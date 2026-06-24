const StoreProfile = require('../models/StoreProfile');
const Product = require('../models/Product');

exports.getPendingSellers = async (req, res) => {
    try {
        const sellers = await StoreProfile.find({ kyc_status: 'PENDING' });
        res.status(200).json({ success: true, sellers });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateSellerStatus = async (req, res) => {
    try {
        const { id } = req.params; // store profile ID
        const { status } = req.body; // 'APPROVED', 'REJECTED', 'SUSPENDED'

        if (!['APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const store = await StoreProfile.findById(id);
        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        // If suspending, we might want to also suspend all their products
        if (status === 'SUSPENDED') {
            await Product.updateMany({ seller_id: store.seller_id }, { status: 'ARCHIVED' });
            store.is_suspended = true;
        } else if (status === 'APPROVED') {
            store.is_suspended = false;
        }

        store.kyc_status = status;
        await store.save();

        res.status(200).json({ success: true, message: `Seller status updated to ${status}`, store });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getAllSellers = async (req, res) => {
    try {
        const sellers = await StoreProfile.find();
        res.status(200).json({ success: true, sellers });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
