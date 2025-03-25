const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const packageJson = require("../package.json");
const companyRoutes = require("./server/routes/company/companyRoutes");
const userRoutes = require("../api/server/routes/user/UserRoutes");
const workshopRoutes = require("../api/server/routes/company/workshopRoutes");
const articleRoutes = require("../api/server/routes/article/articleRoutes");
const notificationRoutes = require("../api/server/routes/notifications/notificationRoutes");
const rewardsRoutes = require("../api/server/routes/company/rewardsRoutes");
const uploadRoutes = require("../api/server/routes/upload/UploadRoutes");
const soundscapeRoutes = require("../api/server/routes/soundscapes/soundscapeRoutes");
const galleryRoutes = require("./server/routes/gallery/galleryRoutes");

const serverActive = require("./Cron/serverActive");
const {
  calculateCompanyStressLevel,
  calculateRetentionRate,
  calculatePSI,
  calculateEngagementScore,
} = require("./Cron/companyMetrics");

// Initialize environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());


app.use(cors({
  origin: '*'
}));


// app.use(
//   cors({
//     origin: "http://localhost:5173", // Replace with your frontend's URL
//     credentials: true, // Enable cookies and HTTP authentication
//   })
// );

// Routes
app.use("/api/company", companyRoutes);
app.use("/api/workshop", workshopRoutes);
app.use("/api/user", userRoutes);
app.use("/api/article", articleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/rewards", rewardsRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api", soundscapeRoutes);
app.use("/api", galleryRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(
    `Server is running on PORT ${PORT} and version: ${packageJson.version}`
  );
});

// Keep the server active
serverActive();

// Ensure the cron jobs are scheduled
calculateCompanyStressLevel();
calculateRetentionRate();
calculatePSI();
calculateEngagementScore();

app.get("*", (req, res) =>
  res.status(200).send({
    message: `Welcome to Neure API up and running and version : ${packageJson.version}`,
  })
);
