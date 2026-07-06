const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (e) {
  console.warn('sqlite3 module not found, using mock implementation');
  class MockDB {
    constructor() {}
    run(sql, params, cb) { if (cb) cb(null); }
    all(sql, params, cb) { if (cb) cb(null, []); }
    get(sql, params, cb) { if (cb) cb(null, null); }
    close(cb) { if (cb) cb(null); }
  }
  // Provide Database directly and a verbose method that returns the same mock object
  sqlite3 = {
    Database: MockDB,
    verbose: () => sqlite3,
  };
}

const path = require('path');

const app = express();\n
// --- BEGIN ENTERPRISE STRUCTURED LOGGING ---
const { AsyncLocalStorage } = require('async_hooks');
const asyncLocalStorage = new AsyncLocalStorage();
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

function formatLog(level, args) {
    const store = asyncLocalStorage.getStore();
    const requestId = store ? store.get('x-request-id') : 'system';
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
    return JSON.stringify({ timestamp: new Date().toISOString(), level, requestId, message: msg });
}

console.log = (...args) => originalLog(formatLog('info', args));
console.error = (...args) => originalError(formatLog('error', args));
console.warn = (...args) => originalWarn(formatLog('warn', args));

// Intercept requests to seed AsyncLocalStorage
app.use((req, res, next) => {
    const store = new Map();
    store.set('x-request-id', req.headers['x-request-id'] || 'unknown');
    asyncLocalStorage.run(store, () => next());
});
// --- END ENTERPRISE STRUCTURED LOGGING ---

const PORT = process.env.PORT || 8005;

app.use(cors());
app.use(express.json());

// MongoDB connection for product retrieval
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/product_db';
mongoose.connect(mongoUri)
    .then(() => console.log('AI Service connected to MongoDB.'))
    .catch(err => console.error('AI Service MongoDB connection error:', err));

// Product Schema definition to fetch catalog
const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    base_price: { type: Number, required: true },
    seller_id: { type: String, required: true },
    category_id: { type: String, required: true },
    brand: { type: String },
    status: { type: String, default: 'ACTIVE' }
}));

const orderDbPath = path.resolve(__dirname, '../../order-service/order_db.sqlite');

// Levenshtein Distance for Typo Correction
function levenshtein(s1, s2) {
    const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
    for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
    for (let j = 1; j <= s2.length; j += 1) {
        for (let i = 1; i <= s1.length; i += 1) {
            const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1, // deletion
                track[j - 1][i] + 1, // insertion
                track[j - 1][i - 1] + indicator // substitution
            );
        }
    }
    return track[s2.length][s1.length];
}

// TF-IDF Search ranking
function tfIdfSearch(products, query) {
    const queryTokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (queryTokens.length === 0) return products;

    const docCount = products.length;
    const termDocCounts = {};

    queryTokens.forEach(token => {
        let count = 0;
        products.forEach(p => {
            const text = `${p.title} ${p.description} ${p.brand || ''}`.toLowerCase();
            if (text.includes(token)) count++;
        });
        termDocCounts[token] = count;
    });

    const scored = products.map(product => {
        let score = 0;
        const text = `${product.title} ${product.description} ${product.brand || ''}`.toLowerCase();
        const tokens = text.split(/\s+/).filter(Boolean);
        const totalTokens = tokens.length;

        queryTokens.forEach(token => {
            const occurrences = tokens.filter(t => t === token || t.includes(token)).length;
            const tf = totalTokens > 0 ? occurrences / totalTokens : 0;
            const df = termDocCounts[token] || 0;
            const idf = Math.log((docCount + 1) / (df + 1)) + 1;
            score += tf * idf;
        });

        return { product, score };
    });

    return scored
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.product);
}

// Collaborative Filtering Recommendations Builder
function getCollaborativeRecommendations(userId) {
    return new Promise((resolve) => {
        const db = new sqlite3.Database(orderDbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) return resolve([]);
        });

        const sql = `
            SELECT o.user_id, oi.product_id, SUM(oi.quantity) as total_qty
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            GROUP BY o.user_id, oi.product_id
        `;

        db.all(sql, [], (err, rows) => {
            db.close();
            if (err || !rows || rows.length === 0) return resolve([]);

            const matrix = {};
            const allProducts = new Set();

            rows.forEach(row => {
                if (!matrix[row.user_id]) matrix[row.user_id] = {};
                matrix[row.user_id][row.product_id] = parseFloat(row.total_qty);
                allProducts.add(row.product_id);
            });

            const trending = [...rows].reduce((acc, curr) => {
                acc[curr.product_id] = (acc[curr.product_id] || 0) + curr.total_qty;
                return acc;
            }, {});
            const sortedTrending = Object.keys(trending).sort((a, b) => trending[b] - trending[a]);

            if (!matrix[userId]) {
                return resolve(sortedTrending.slice(0, 4));
            }

            const similarities = [];
            const user1Vector = matrix[userId];

            Object.keys(matrix).forEach(otherUserId => {
                if (otherUserId === userId) return;
                const user2Vector = matrix[otherUserId];

                let dotProduct = 0;
                let norm1 = 0;
                let norm2 = 0;

                allProducts.forEach(prodId => {
                    const val1 = user1Vector[prodId] || 0;
                    const val2 = user2Vector[prodId] || 0;
                    dotProduct += val1 * val2;
                    norm1 += val1 * val1;
                    norm2 += val2 * val2;
                });

                const similarity = norm1 > 0 && norm2 > 0 ? dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)) : 0;
                if (similarity > 0) {
                    similarities.push({ otherUserId, similarity });
                }
            });

            similarities.sort((a, b) => b.similarity - a.similarity);

            const recommendations = {};
            similarities.forEach(sim => {
                const otherUserVector = matrix[sim.otherUserId];
                Object.keys(otherUserVector).forEach(prodId => {
                    if (user1Vector[prodId]) return;
                    if (!recommendations[prodId]) recommendations[prodId] = 0;
                    recommendations[prodId] += otherUserVector[prodId] * sim.similarity;
                });
            });

            const sortedRecs = Object.keys(recommendations).sort((a, b) => recommendations[b] - recommendations[a]);
            if (sortedRecs.length > 0) {
                return resolve(sortedRecs.slice(0, 4));
            }

            resolve(sortedTrending.slice(0, 4));
        });
    });
}

// 1. AI Recommendation Engine Route
app.post('/recommendations', async (req, res) => {
    try {
        const { user_id } = req.body;
        const recommendedIds = await getCollaborativeRecommendations(user_id);
        const products = await Product.find({ _id: { $in: recommendedIds } });
        res.status(200).json({ success: true, recommendations: products });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. AI Smart Search (TF-IDF & Cosine Typo matching)
app.post('/search', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ success: false, message: 'Query parameter is required' });

        const products = await Product.find({ status: 'ACTIVE' });
        
        // Try spelling correction (Levenshtein check on title words)
        const queryWords = query.toLowerCase().split(/\s+/);
        const correctedWords = queryWords.map(word => {
            let bestWord = word;
            let minDistance = 2; // threshold for typo
            
            products.forEach(p => {
                const words = p.title.toLowerCase().split(/\s+/);
                words.forEach(w => {
                    const d = levenshtein(word, w);
                    if (d < minDistance) {
                        minDistance = d;
                        bestWord = w;
                    }
                });
            });
            return bestWord;
        });

        const correctedQuery = correctedWords.join(' ');
        const matched = tfIdfSearch(products, correctedQuery);

        res.status(200).json({
            success: true,
            original_query: query,
            corrected_query: correctedQuery !== query ? correctedQuery : null,
            products: matched
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. AI support chatbot (intent recognition)
app.post('/chat', async (req, res) => {
    try {
        const { message, user_id } = req.body;
        const msg = message.toLowerCase();
        
        let responseText = "I'm your E-Commerce Smart Assistant. You can ask me to recommend products, track your orders, or check return policies!";

        if (msg.includes('track') || msg.includes('order') || msg.includes('where')) {
            // Retrieve latest order from order database
            responseText = await new Promise((resolve) => {
                const db = new sqlite3.Database(orderDbPath, sqlite3.OPEN_READONLY, (err) => {
                    if (err) return resolve("I couldn't fetch your orders database. Please try again later.");
                });
                
                db.get(
                    "SELECT id, status, total_amount, createdAt FROM orders WHERE user_id = ? ORDER BY createdAt DESC LIMIT 1",
                    [user_id || ''],
                    (err, row) => {
                        db.close();
                        if (err) return resolve("There was an error checking your order status.");
                        if (row) {
                            resolve(`I found your latest order! Order ID: **${row.id}** status is **${row.status}** (Total: $${row.total_amount.toFixed(2)}). Placed on ${new Date(row.createdAt).toLocaleDateString()}.`);
                        } else {
                            resolve("I couldn't find any orders placed under your account yet!");
                        }
                    }
                );
            });
        } else if (msg.includes('recommend') || msg.includes('suggest') || msg.includes('buy')) {
            const recIds = await getCollaborativeRecommendations(user_id);
            const products = await Product.find({ _id: { $in: recIds } }).limit(2);
            if (products.length > 0) {
                const productList = products.map(p => `- **${p.title}** ($${p.base_price})`).join('\n');
                responseText = `Based on shopping trends and matching behaviors, I suggest checking out:\n${productList}`;
            } else {
                responseText = "I don't have any specific product recommendations for you right now, but feel free to browse our explore page!";
            }
        } else if (msg.includes('compare') || msg.includes('versus') || msg.includes('vs')) {
            responseText = "To compare products, simply view their details on the storefront cards where price and descriptions are listed side-by-side!";
        } else if (msg.includes('return') || msg.includes('refund') || msg.includes('cancel')) {
            responseText = "Our return policy allows returns within 30 days of delivery. Refunds are processed back to your original payment method via our Saga transaction manager.";
        }

        res.status(200).json({ success: true, response: responseText });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'AI Service' });
});

app.listen(PORT, () => {
    console.log(`AI Service is running on port ${PORT}`);
});
