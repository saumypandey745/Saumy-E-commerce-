const { Invoice, Transaction } = require('../models');
const fs = require('fs');
const path = require('path');

exports.downloadInvoice = async (req, res, next) => {
    try {
        const { id } = req.params; // Invoice ID
        
        const invoice = await Invoice.findByPk(id, {
            include: [{ model: Transaction }]
        });

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        const filePath = invoice.file_path;
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Invoice file missing on disk' });
        }

        res.download(filePath, `invoice_${invoice.order_id}.pdf`);
    } catch (error) {
        next(error);
    }
};

exports.getTransactionHistory = async (req, res, next) => {
    try {
        // Ideally filter by user_id, but payment service only knows order_id
        // This endpoint would likely be called internally by Gateway or Admin
        const transactions = await Transaction.findAll({
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        
        res.status(200).json({ success: true, transactions });
    } catch (error) {
        next(error);
    }
};
