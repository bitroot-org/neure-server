const cron = require('node-cron');
const db = require('../config/db');
const NotificationService = require('../server/services/notificationsAndAnnouncements/notificationService');

const sendWorkshopReminders = async () => {
  const connection = await db.getConnection();
  try {
    console.log('Starting workshop reminder check...');
    
    // Get all workshops scheduled for today
    const [todayWorkshops] = await connection.query(`
      SELECT 
        ws.id as schedule_id,
        ws.company_id,
        ws.workshop_id,
        ws.start_time,
        w.title as workshop_title,
        w.location
      FROM workshop_schedules ws
      JOIN workshops w ON ws.workshop_id = w.id
      WHERE DATE(ws.start_time) = CURDATE()
      AND ws.status = 'scheduled'
    `);

    if (todayWorkshops.length === 0) {
      console.log('No workshops scheduled for today');
      return;
    }

    console.log(`Found ${todayWorkshops.length} workshops scheduled for today`);

    for (const workshop of todayWorkshops) {
      // Get all active employees for the company
      const [employees] = await connection.query(`
        SELECT 
          ce.user_id,
          u.first_name,
          u.email
        FROM company_employees ce
        JOIN users u ON ce.user_id = u.user_id
        WHERE ce.company_id = ?
        AND ce.is_active = 1
      `, [workshop.company_id]);

      const startTime = new Date(workshop.start_time);
      const formattedTime = startTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      // Create notifications for each employee
      const notificationPromises = employees.map(employee => 
        NotificationService.createNotification({
          title: `Workshop Reminder: ${workshop.workshop_title}`,
          content: `Reminder: Your workshop "${workshop.workshop_title}" is scheduled for today at ${formattedTime}. ${
            workshop.location ? `Location: ${workshop.location}` : ''
          }. Duration: ${workshop.duration} minutes`,
          type: "WORKSHOP_REMINDER",
          company_id: workshop.company_id,
          user_id: employee.user_id,
          priority: "HIGH",
          metadata: JSON.stringify({
            workshop_id: workshop.workshop_id,
            schedule_id: workshop.schedule_id,
            start_time: workshop.start_time,
            location: workshop.location,
            duration: workshop.duration
          })
        })
      );

      await Promise.all(notificationPromises);
      console.log(`Sent reminders to ${employees.length} employees for workshop: ${workshop.workshop_title}`);
    }

    console.log('Workshop reminder process completed successfully');
    return {
      status: true,
      message: `Sent reminders for ${todayWorkshops.length} workshops`
    };

  } catch (error) {
    console.error('Error in sendWorkshopReminders:', error);
    return {
      status: false,
      error: error.message
    };
  } finally {
    connection.release();
  }
};

// Schedule the cron job to run at 8:00 AM every day
cron.schedule('0 1 * * *', async () => {
  console.log('Running workshop reminder cron job...');
  try {
    const result = await sendWorkshopReminders();
    console.log('Workshop reminder cron job result:', result);
  } catch (error) {
    console.error('Error in workshop reminder cron job:', error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

module.exports = sendWorkshopReminders;