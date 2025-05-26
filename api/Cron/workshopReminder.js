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

const sendAdvanceWorkshopReminders = async () => {
  const connection = await db.getConnection();
  try {
    console.log('Starting advance workshop reminder check...');
    
    // Get workshops scheduled in the next 48 hours and next 1 hour
    const [upcomingWorkshops] = await connection.query(`
      SELECT 
        ws.id as schedule_id,
        ws.company_id,
        ws.workshop_id,
        ws.start_time,
        ws.duration_minutes,
        w.title as workshop_title,
        w.location,
        TIMESTAMPDIFF(HOUR, NOW(), ws.start_time) as hours_until_start
      FROM workshop_schedules ws
      JOIN workshops w ON ws.workshop_id = w.id
      WHERE ws.start_time > NOW()
      AND ws.start_time < DATE_ADD(NOW(), INTERVAL 49 HOUR)
      AND ws.status = 'scheduled'
    `);

    if (upcomingWorkshops.length === 0) {
      console.log('No upcoming workshops found for advance reminders');
      return {
        status: true,
        message: 'No upcoming workshops for advance reminders'
      };
    }

    console.log(`Found ${upcomingWorkshops.length} upcoming workshops for potential advance reminders`);
    
    // Filter workshops for 48-hour and 1-hour notifications
    const workshops48Hours = upcomingWorkshops.filter(w => 
      w.hours_until_start >= 47 && w.hours_until_start <= 49
    );
    
    const workshops1Hour = upcomingWorkshops.filter(w => 
      w.hours_until_start >= 0.5 && w.hours_until_start <= 1.5
    );
    
    let totalNotificationsSent = 0;
    
    // Process 48-hour reminders
    for (const workshop of workshops48Hours) {
      const notificationsSent = await sendReminderNotifications(connection, workshop, '48 hours');
      totalNotificationsSent += notificationsSent;
    }
    
    // Process 1-hour reminders
    for (const workshop of workshops1Hour) {
      const notificationsSent = await sendReminderNotifications(connection, workshop, '1 hour');
      totalNotificationsSent += notificationsSent;
    }
    
    console.log('Advance workshop reminder process completed successfully');
    return {
      status: true,
      message: `Sent advance reminders for ${totalNotificationsSent} workshops`
    };
  } catch (error) {
    console.error('Error in sendAdvanceWorkshopReminders:', error);
    return {
      status: false,
      error: error.message
    };
  } finally {
    connection.release();
  }
};

// Helper function to send notifications for a specific workshop
const sendReminderNotifications = async (connection, workshop, timeframe) => {
  // Get all active employees for the company who have subscribed to workshop reminders
  const [employees] = await connection.query(`
    SELECT 
      ce.user_id,
      u.first_name,
      u.email
    FROM company_employees ce
    JOIN users u ON ce.user_id = u.user_id
    JOIN user_subscriptions us ON u.user_id = us.user_id
    WHERE ce.company_id = ?
    AND ce.is_active = 1
    AND us.workshop_event_reminder = 1
  `, [workshop.company_id]);

  if (employees.length === 0) {
    console.log(`No subscribed employees found for workshop: ${workshop.workshop_title}`);
    return 0;
  }

  const startTime = new Date(workshop.start_time);
  const formattedDate = startTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = startTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Create notifications for each subscribed employee
  const notificationPromises = employees.map(employee => 
    NotificationService.createNotification({
      title: `Workshop Reminder: ${workshop.workshop_title}`,
      content: `Your workshop "${workshop.workshop_title}" is scheduled in ${timeframe} (${formattedDate} at ${formattedTime}). ${
        workshop.location ? `Location: ${workshop.location}` : ''
      }. Duration: ${workshop.duration_minutes} minutes`,
      type: "WORKSHOP_REMINDER",
      company_id: workshop.company_id,
      user_id: employee.user_id,
      priority: "HIGH",
      metadata: JSON.stringify({
        workshop_id: workshop.workshop_id,
        schedule_id: workshop.schedule_id,
        start_time: workshop.start_time,
        location: workshop.location,
        duration_minutes: workshop.duration_minutes,
        reminder_type: timeframe === '48 hours' ? 'ADVANCE_48H' : 'ADVANCE_1H'
      })
    })
  );

  await Promise.all(notificationPromises);
  console.log(`Sent ${timeframe} reminders to ${employees.length} employees for workshop: ${workshop.workshop_title}`);
  return employees.length;
};

// Same-day reminders - daily at 01:00 AM
cron.schedule('0 1 * * *', async () => {
  console.log(`[${new Date().toISOString()}] Running same-day workshop reminder cron job...`);
  try {
    const result = await sendWorkshopReminders();
    console.log(`[${new Date().toISOString()}] Same-day workshop reminder cron job result:`, result);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in same-day workshop reminder cron job:`, error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

// Advance reminders - run every hour
cron.schedule('0 * * * *', async () => {
  console.log(`[${new Date().toISOString()}] Running advance workshop reminder cron job...`);
  try {
    const result = await sendAdvanceWorkshopReminders();
    console.log(`[${new Date().toISOString()}] Advance workshop reminder cron job result:`, result);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in advance workshop reminder cron job:`, error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

module.exports = function() {
  console.log('Workshop reminder module initialized');
  // The cron jobs are already scheduled within this file
  // No need to call any functions explicitly
  return {
    sendWorkshopReminders,
    sendAdvanceWorkshopReminders
  };
};
