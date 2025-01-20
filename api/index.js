const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); 
const packageJson = require('../package.json');
const companyRoutes = require('./server/routes/company/companyRoutes');
const userRoutes = require('../api/server/routes/user/UserRoutes');
const workshopRoutes = require('../api/server/routes/company/workshopRoutes');
const articleRoutes = require('../api/server/routes/article/articleRoutes');
const notificationRoutes = require('../api/server/routes/notifications/notificationRoutes');
const serverActive = require('./Cron/serverActive');

// Initialize environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/company', companyRoutes);
app.use('/api/workshop', workshopRoutes);
app.use('/api/user', userRoutes);
app.use('/api/article', articleRoutes);
app.use('/api/notifications', notificationRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT} and version: ${packageJson.version}`);
});


app.get("*", (req, res) =>
	res.status(200).send({
		message: `Welcome to Neure API up and running and version : ${packageJson.version}`,
	}),
);
