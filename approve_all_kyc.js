const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/ecommerce_products';

const run = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        const StoreProfile = mongoose.models.StoreProfile || mongoose.model('StoreProfile', new mongoose.Schema({}, { strict: false }));
        
        const result = await StoreProfile.updateMany({}, { $set: { kyc_status: 'APPROVED' } });
        console.log(`Updated ${result.modifiedCount} store profiles to APPROVED.`);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
