const cron = require('node-cron');
const { expireUnpaidRequests } = require('../server/services/prodesk/servicePurchaseService');

// Runs every 5 minutes: a prepaid booking request that is still unpaid after its time (60 min online, 24 h direct) is released,
// so an abandoned payment page does not hold a therapist's time slot for ever.
let running = false;
const initProdeskUnpaidRequests = () => {
  cron.schedule('*/5 * * * *', async () => {
    if (running) return;
    running = true;
    try {
      const r = await expireUnpaidRequests();
      if (r.released) console.log(`[prodeskUnpaidRequests] released ${r.released} unpaid request(s)`);
    } finally { running = false; }
  });
};

module.exports = initProdeskUnpaidRequests;
