const fs = require('fs');

const files = [
    'microservices/cart-service/src/index.js',
    'microservices/payment-service/src/index.js',
    'microservices/product-service/src/index.js',
    'microservices/promotion-service/src/index.js',
    'microservices/review-service/src/index.js'
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if it already has if (require.main === module)
    if (content.includes('if (require.main === module)')) continue;
    
    // Replace const server = app.listen...
    content = content.replace(/const server = app\.listen\([\s\S]*?\n\}\);/g, (match) => {
        return `let server;\nif (require.main === module) {\n    server = ${match.substring(15)}\n}`;
    });
    
    // Move connectDB() to inside the new if block if it's outside
    const dbMatch = content.match(/^connectDB\(\).*?$/m);
    if (dbMatch) {
        content = content.replace(/^connectDB\(\).*?$\n/m, '');
        content = content.replace('if (require.main === module) {', `if (require.main === module) {\n    ${dbMatch[0]}`);
    }
    
    // Export app
    if (!content.includes('module.exports = app;')) {
        content += '\nmodule.exports = app;\n';
    }
    
    fs.writeFileSync(file, content);
}
