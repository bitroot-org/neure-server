const cron = require('node-cron');
const { purgeDueClients, purgeDueAccounts, purgeOldNotes, purgeOldAccessLogs } = require('../server/services/prodesk/privacyService');

// Runs daily at 2:30 AM — DPDP clean-up:
//  • erases clients deleted more than 30 days ago
//  • erases therapist accounts that asked for deletion more than 30 days ago
//  • erases session notes 3 years after the client's last session
//  • removes access-log entries older than 12 months
// Preview what would be removed first with:  node api/scripts/privacyPurge.js --dry-run
const initProdeskPrivacyJobs = () => {
  cron.schedule('30 2 * * *', async () => {
    console.log('[Cron] prodeskPrivacyJobs: starting...');
    try {
      console.log('[Cron] clients:', JSON.stringify(await purgeDueClients()));
      console.log('[Cron] accounts:', JSON.stringify(await purgeDueAccounts()));
      console.log('[Cron] old notes:', JSON.stringify(await purgeOldNotes()));
      console.log('[Cron] access logs:', JSON.stringify(await purgeOldAccessLogs()));
    } catch (e) {
      console.log('[Cron] prodeskPrivacyJobs failed::>>', e.message);
    }
    console.log('[Cron] prodeskPrivacyJobs: done');
  });
};

module.exports = initProdeskPrivacyJobs;
