const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const packageJson = require("../package.json");
const companyRoutes = require("./server/routes/company/companyRoutes");
const userRoutes = require("../api/server/routes/user/UserRoutes");
const workshopRoutes = require("../api/server/routes/company/workshopRoutes");
const articleRoutes = require("../api/server/routes/article/articleRoutes");
const notificationRoutes = require("../api/server/routes/notificationsAndAnnouncements/notificationRoutes");
const announcementRoutes = require("../api/server/routes/notificationsAndAnnouncements/announcementRoutes");
const rewardsRoutes = require("../api/server/routes/company/rewardsRoutes");
const uploadRoutes = require("../api/server/routes/upload/UploadRoutes");
const soundscapeRoutes = require("../api/server/routes/soundscapes/soundscapeRoutes");
const galleryRoutes = require("./server/routes/gallery/galleryRoutes");
const assessmentsRoutes = require('./server/routes/assessments/assessmentsRoutes');
const dashboardRoutes = require("./server/routes/dashboard/dashboardRoutes");
const analyticsRoutes = require("./server/routes/analytics/analyticsRoutes");
const resourceTrackingRoutes = require('./server/routes/tracking/resourceTrackingRoutes');
const qnaRoutes = require("./server/routes/qna/qnaRoutes");
const activityLogRoutes = require('./server/routes/logs/ActivityLogRoutes');
const serverActive = require("./Cron/serverActive");

const monthlyMetricsReset = require("./Cron/monthlyMetricsReset");
const workshopReminder = require("./Cron/workshopReminder");
const {
  calculateCompanyStressLevel,
  calculateRetentionRate,
  calculatePSI,
  calculateEngagementScore,
} = require("./Cron/companyMetrics");
const { updateContentEngagementPercentage } = require("./Cron/resourceUsageMetrics");
const { checkAssessmentCompletion } = require("./Cron/assessmentCompletionCheck");

// Initialize environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*'
}));

// Routes
app.use("/api/company", companyRoutes);
app.use("/api/workshop", workshopRoutes);
app.use("/api/user", userRoutes);
app.use("/api/article", articleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/rewards", rewardsRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/soundscapes", soundscapeRoutes);
app.use("/api", galleryRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use('/api/tracking', resourceTrackingRoutes);
app.use("/api/qna", qnaRoutes);
app.use('/api/logs', activityLogRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(
    `Server is running on PORT ${PORT} and version: ${packageJson.version}`
  );
});

// Keep the server active
serverActive();

// Initialize all cron jobs
// calculateCompanyStressLevel();
// calculateRetentionRate();
// calculatePSI();
// calculateEngagementScore();
updateContentEngagementPercentage();
checkAssessmentCompletion();

app.get("*", (req, res) =>
  res.status(200).send({
    message: `Welcome to Neure API up and running and version : ${packageJson.version}`,
  })
);
