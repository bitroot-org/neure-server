const cron = require('node-cron');
const db = require('../config/db');

const updateContentEngagementPercentage = async () => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get the first and last day of the current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get total available gallery items
    const [totalGalleryItems] = await connection.query(`
      SELECT COUNT(*) as total
      FROM gallery
      WHERE file_type IN ('image', 'video', 'document')
    `);

    // console.log(`Total gallery items: ${totalGalleryItems[0].total}`);

    // If there are no gallery items, set engagement to 0
    if (totalGalleryItems[0].total === 0) {
      await connection.query(`
        UPDATE company_employees 
        SET 
          content_engagement_percentage = 0,
          last_activity_date = NOW()
      `);
      await connection.commit();
      console.log('No gallery items found, set all engagement to 0');
      return {
        status: true,
        message: "No gallery content available for engagement calculation"
      };
    }

    // Calculate engagement percentage for each employee
    const query = `
      UPDATE company_employees ce
      LEFT JOIN (
        SELECT 
          urt.user_id,
          (COUNT(DISTINCT urt.resource_id) / ?) * 100 as engagement_percentage
        FROM user_resource_tracking urt
        WHERE 
          urt.resource_type IN ('gallery_image', 'gallery_video', 'gallery_document')
          AND urt.action_timestamp BETWEEN ? AND ?
        GROUP BY urt.user_id
      ) engagement ON ce.user_id = engagement.user_id
      SET 
        ce.content_engagement_percentage = COALESCE(engagement.engagement_percentage, 0),
        ce.last_activity_date = NOW(),
        ce.last_activity_type = 'content_engagement'
    `;

    await connection.query(query, [
      totalGalleryItems[0].total,
      firstDayOfMonth,
      lastDayOfMonth
    ]);

    // Get summary statistics
    const [stats] = await connection.query(`
      SELECT 
        COUNT(*) as total_employees,
        COUNT(CASE WHEN content_engagement_percentage > 0 THEN 1 END) as engaged_employees,
        AVG(content_engagement_percentage) as average_engagement,
        MAX(content_engagement_percentage) as max_engagement
      FROM company_employees
    `);

    await connection.commit();

    // Add timestamp to logging for better tracking
    // console.log(`[${new Date().toISOString()}] Updated engagement metrics:`, stats[0]);

    return {
      status: true,
      message: "Content engagement percentages updated successfully",
      stats: stats[0]
    };
  } catch (error) {
    await connection.rollback();
    console.error(`[${new Date().toISOString()}] Error:`, error);
    return {
      status: false,
      error: error.message
    };
  } finally {
    connection.release();
  }
};


// Update content engagement - daily at 00:05 AM
cron.schedule('5 0 * * *', async () => {
  console.log(`[${new Date().toISOString()}] Starting content engagement percentage update...`);
  try {
    const result = await updateContentEngagementPercentage();
    console.log(`[${new Date().toISOString()}] Content engagement update completed:`, result);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in content engagement cron job:`, error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

// Export the function for manual testing if needed
module.exports = function initResourceUsageMetrics() {
  console.log('Resource usage metrics cron initialized');
  // The cron job is already scheduled when this file is imported
  return {
    updateContentEngagementPercentage
  };
};
