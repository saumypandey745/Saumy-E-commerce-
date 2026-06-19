const Transaction = require('./Transaction');
const Invoice = require('./Invoice');

Transaction.hasOne(Invoice, { foreignKey: 'transaction_id', as: 'invoice' });
Invoice.belongsTo(Transaction, { foreignKey: 'transaction_id' });

module.exports = {
    Transaction,
    Invoice
};
