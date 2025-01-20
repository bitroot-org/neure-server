const cron = require('node-cron');
const axios = require('axios');

const renderServerUrl = 'https://neure-server.onrender.com/';

// Function to ping the server
const keepServerActive = async () => {
  try {
    // Send a GET request to your Render server URL
    const response = await axios.get(renderServerUrl);
    console.log(`Server pinged successfully at ${new Date().toISOString()}:`, response.status);
  } catch (error) {
    console.error(`Error pinging server at ${new Date().toISOString()}:`, error.message);
  }
};

// Schedule the cron job to run every 20 minutes
cron.schedule('*/20 * * * *', () => {
  console.log('Pinging Render server...');
  keepServerActive();
});

module.exports = keepServerActive;
