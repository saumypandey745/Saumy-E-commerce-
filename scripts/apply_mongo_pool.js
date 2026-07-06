const fs = require('fs');
const glob = require('glob');

const enterpriseOptions = `
        maxPoolSize: 50,
        minPoolSize: 10,
        maxIdleTimeMS: 10000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        retryReads: true
`;

const files = glob.sync('microservices/*/src/config/db.js', { globstar: true });
files.push('microservices/ai-service/src/index.js', 'microservices/monitoring-service/src/index.js');

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    // Simple naive replacement for mongoose.connect
    if (content.includes('mongoose.connect') && !content.includes('maxPoolSize')) {
        // Find the basic connect pattern
        content = content.replace(/mongoose\.connect\(([^,]+)\)/g, `mongoose.connect($1, {${enterpriseOptions}})`);
        content = content.replace(/mongoose\.connect\(([^,]+),\s*\{[^}]*\}\)/g, `mongoose.connect($1, {${enterpriseOptions}})`);
        fs.writeFileSync(file, content);
        console.log(`Updated MongoDB connection in ${file}`);
    }
});
