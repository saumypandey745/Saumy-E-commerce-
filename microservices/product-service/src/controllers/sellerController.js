const StoreProfile = require('../models/StoreProfile');
const Product = require('../models/Product');
const { uploadDocument } = require('../utils/s3Client');

exports.getSellerProducts = async (req, res) => {
    try {
        if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: 'Unauthorized' });
        
        const products = await Product.find({ seller_id: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, products });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { title, description, base_price, category_id, ...otherFields } = req.body;

        const Category = require('../models/Category');
        if (category_id) {
            const category = await Category.findById(category_id);
            if (!category) {
                return res.status(400).json({ success: false, message: 'Invalid category_id: Category does not exist.' });
            }
        } else {
            return res.status(400).json({ success: false, message: 'category_id is required.' });
        }

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
        const final_price = base_price - (base_price * (otherFields.discount_percentage || 0) / 100);

        const newProduct = await Product.create({
            ...otherFields,
            seller_id: req.user.id,
            title,
            slug,
            description,
            base_price,
            final_price,
            category_id,
            status: 'PENDING_APPROVAL'
        });

        res.status(201).json({ success: true, product: newProduct });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const productId = req.params.id;
        
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        if (product.seller_id.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });

        if (req.body.category_id) {
            const Category = require('../models/Category');
            const category = await Category.findById(req.body.category_id);
            if (!category) {
                return res.status(400).json({ success: false, message: 'Invalid category_id: Category does not exist.' });
            }
        }

        Object.assign(product, req.body);
        if (req.body.base_price !== undefined || req.body.discount_percentage !== undefined) {
            product.final_price = product.base_price - (product.base_price * (product.discount_percentage || 0) / 100);
        }

        await product.save();
        res.status(200).json({ success: true, product });
    } catch (err) {
        console.error("updateProduct error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const productId = req.params.id;
        
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        if (product.seller_id.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });

        product.status = 'ARCHIVED'; // Soft delete
        await product.save();
        
        res.status(200).json({ success: true, message: 'Product archived' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.uploadProductImage = async (req, res) => {
    try {
        console.log("uploadProductImage headers:", req.headers);
        console.log("uploadProductImage req.file:", !!req.file);
        if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: 'Unauthorized' });
        if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided' });

        const productId = req.params.id;
        const product = await Product.findById(productId);

        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        if (product.seller_id.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden: You do not own this product' });

        const bucketName = 'product-images';
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `${productId}_${Date.now()}.${fileExt}`;
        
        const imageUrl = await uploadDocument(bucketName, fileName, req.file.buffer, req.file.mimetype);

        // Append to images array
        product.images.push(imageUrl);
        await product.save();

        res.status(200).json({ success: true, message: 'Image uploaded successfully', imageUrl, product });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getStoreProfile = async (req, res) => {
    try {
        if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const store = await StoreProfile.findOne({ seller_id: req.user.id });
        if (!store) return res.status(404).json({ success: false, message: 'Store profile not found' });
        
        res.status(200).json({ success: true, store });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateStoreProfile = async (req, res) => {
    try {
        if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { store_name, description, contact_email, contact_phone, return_policy, shipping_policy } = req.body;
        
        const store = await StoreProfile.findOne({ seller_id: req.user.id });
        if (!store) return res.status(404).json({ success: false, message: 'Store profile not found' });

        if (store_name) {
            store.store_name = store_name;
            store.slug = store_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        }
        if (description) store.description = description;
        if (contact_email) store.contact_email = contact_email;
        if (contact_phone) store.contact_phone = contact_phone;
        if (return_policy) store.return_policy = return_policy;
        if (shipping_policy) store.shipping_policy = shipping_policy;
        
        await store.save();
        res.status(200).json({ success: true, message: 'Store updated', store });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.onboardStore = async (req, res) => {
    try {
        const { store_name, description, contact_email, business_registration_number, tax_id } = req.body;
        
        const slug = store_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        // Check if store already exists
        const existingStore = await StoreProfile.findOne({ $or: [{ slug }, { seller_id: req.user.id }] });
        if (existingStore) {
            return res.status(400).json({ success: false, message: 'Store name already taken or seller already onboarded' });
        }
        
        const newStore = await StoreProfile.create({
            seller_id: req.user.id,
            store_name,
            slug,
            description,
            contact_email,
            business_registration_number,
            tax_id,
            kyc_status: 'APPROVED'
        });

        // Upgrade user's role to SELLER in auth-service internally
        try {
            const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:8001';
            const response = await fetch(`${authServiceUrl}/user/${req.user.id}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': req.headers['authorization'] || '' },
                body: JSON.stringify({ role: 'SELLER' })
            });
            const data = await response.json();
            console.log('[Seller Onboarding] Internal user role updated successfully:', data);
        } catch (err) {
            console.error('[Seller Onboarding] Failed to update user role in auth-service:', err.message);
        }
        
        res.status(201).json({ success: true, store: newStore });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getSellerAnalytics = async (req, res) => {
    try {
        const sellerId = req.user.id;
        
        // Mocking complex aggregation for rapid UI development
        // In reality, this would aggregate OrderItems where seller_id matches
        const analytics = {
            total_revenue: 14500.50,
            active_products: await Product.countDocuments({ seller_id: sellerId, status: 'ACTIVE' }),
            total_orders: 124,
            conversion_rate: 3.2,
            top_products: await Product.find({ seller_id: sellerId }).sort({ review_count: -1 }).limit(5)
        };
        
        res.status(200).json({ success: true, analytics });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.bulkImportProducts = async (req, res) => {
    try {
        if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: 'Unauthorized' });
        
        const products = req.body.products;
        if (!products || !Array.isArray(products)) {
            return res.status(400).json({ success: false, message: 'Invalid payload. "products" array required.' });
        }

        const { publishEvent } = require('../config/rabbitmq');
        publishEvent('product.bulk.import', { seller_id: req.user.id, products });

        res.status(202).json({ 
            success: true, 
            message: 'Bulk import task queued successfully. You will be notified when it completes.' 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.uploadKycDocument = async (req, res) => {
    try {
        if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: 'Unauthorized' });
        
        const store = await StoreProfile.findOne({ seller_id: req.user.id });
        if (!store) return res.status(404).json({ success: false, message: 'Store profile not found. Please complete onboarding first.' });

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No document file provided.' });
        }

        if (store.documents.length >= 3) {
            return res.status(400).json({ success: false, message: 'Maximum of 3 documents allowed per store.' });
        }

        const docType = req.body.doc_type || 'IDENTITY';
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `kyc_${req.user.id}_${Date.now()}.${fileExt}`;

        // Upload to MinIO
        const fileUrl = await uploadDocument('kyc-documents', fileName, req.file.buffer, req.file.mimetype);

        // Update Database
        store.documents.push({
            doc_type: docType,
            url: fileUrl,
            verified: false
        });
        await store.save();

        res.status(201).json({ success: true, document_url: fileUrl, store });
    } catch (err) {
        console.error('KYC Upload Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};
