const cron = require('node-cron');
const { flagOverdueInvoicesService } = require('../server/services/prodesk/billingService');

// Runs daily at 1:00 AM — flips sent/payment_initiated invoices past due_date to 'overdue'
const initProdeskOverdueInvoices = () => {
  cron.schedule('0 1 * * *', async () => {
    console.log('[Cron] prodeskOverdueInvoices: starting...');
    await flagOverdueInvoicesService();
    console.log('[Cron] prodeskOverdueInvoices: done');
  });
};

module.exports = initProdeskOverdueInvoices;
