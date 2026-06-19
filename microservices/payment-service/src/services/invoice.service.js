const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.generateInvoice = (transaction, orderDetails) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            
            const fileName = `invoice_${transaction.order_id}.pdf`;
            const filePath = path.join(__dirname, '../invoices', fileName);
            
            const writeStream = fs.createWriteStream(filePath);
            doc.pipe(writeStream);
            
            // Header
            doc.fontSize(20).text('ENTERPRISE PLATFORM INVOICE', { align: 'center' });
            doc.moveDown();
            
            // Info
            doc.fontSize(12)
               .text(`Invoice ID: ${transaction.id}`)
               .text(`Order ID: ${transaction.order_id}`)
               .text(`Date: ${new Date().toLocaleDateString()}`)
               .text(`Status: PAID`);
            doc.moveDown();

            // Total
            doc.fontSize(14).text(`Total Amount: $${transaction.amount.toFixed(2)} ${transaction.currency}`);
            doc.moveDown();
            
            doc.fontSize(10).text('Thank you for your business.', { align: 'center' });
            
            doc.end();
            
            writeStream.on('finish', () => {
                resolve(filePath);
            });
            
            writeStream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};
