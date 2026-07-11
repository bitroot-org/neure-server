const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 30000,
    idleTimeout: 60000,
    // Without this, mysql2 converts DATETIME/TIMESTAMP columns to JS Date
    // objects using the Node process's local timezone — which varies by
    // deployment environment and silently shifts every stored timestamp by
    // that offset (e.g. IST columns coming back shifted by ±5:30). Returning
    // raw DB strings instead makes every date value environment-independent.
    dateStrings: true,
});

module.exports = pool;
