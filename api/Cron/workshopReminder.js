const cron = require('node-cron');
const db = require('../config/db');
const NotificationService = require('../server/services/notificationsAndAnnouncements/notificationService');

const sendWorkshopReminders = async () => {
  const connection = await db.getConnection();
  try {
    console.log('Starting workshop reminder check...');
    
    // Log the current date and time for debugging
    const now = new Date();
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`Current date in YYYY-MM-DD: ${now.toISOString().split('T')[0]}`);
    
    // Get MySQL's current date for comparison
    const [mysqlDate] = await connection.query('SELECT CURDATE() as today, NOW() as now');
    console.log(`MySQL CURDATE(): ${mysqlDate[0].today}`);
    console.log(`MySQL NOW(): ${mysqlDate[0].now}`);
    
    // Get all workshops scheduled for today
    const [todayWorkshops] = await connection.query(`
      SELECT 
        ws.id as schedule_id,
        ws.company_id,
        ws.workshop_id,
        ws.start_time,
        ws.duration_minutes,
        w.title as workshop_title,
        w.location
      FROM workshop_schedules ws
      JOIN workshops w ON ws.workshop_id = w.id
      WHERE DATE(ws.start_time) = CURDATE()
      AND ws.status = 'scheduled'
    `);

    console.log(`Query returned ${todayWorkshops.length} workshops for today (${mysqlDate[0].today})`);
    
    // Log each workshop's details for debugging
    if (todayWorkshops.length > 0) {
      console.log('Today\'s workshops:');
      todayWorkshops.forEach(workshop => {
        console.log(`- ID: ${workshop.schedule_id}, Title: ${workshop.workshop_title}, Start time: ${workshop.start_time}`);
      });
    }

    if (todayWorkshops.length === 0) {
      console.log('No workshops scheduled for today');
      return {
        status: true,
        message: 'No workshops scheduled for today'
      };
    }


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
    
    // Log the current date and time for debugging
    const now = new Date();
    console.log(`JavaScript Date(): ${now}`);
    console.log(`JavaScript toISOString(): ${now.toISOString()}`);
    console.log(`JavaScript toLocaleString('en-IN'): ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    
    // Get MySQL's current time for comparison
    const [mysqlTime] = await connection.query('SELECT NOW() as now, UNIX_TIMESTAMP(NOW()) as unix_now');
    console.log(`MySQL NOW(): ${mysqlTime[0].now}`);
    console.log(`MySQL UNIX_TIMESTAMP(NOW()): ${mysqlTime[0].unix_now}`);
    
    // Get workshops scheduled in the next 48 hours and next 1 hour with detailed time info
    const [upcomingWorkshops] = await connection.query(`
      SELECT 
        ws.id as schedule_id,
        ws.company_id,
        ws.workshop_id,
        ws.start_time,
        UNIX_TIMESTAMP(ws.start_time) as unix_start_time,
        ws.duration_minutes,
        w.title as workshop_title,
        w.location,
        TIMESTAMPDIFF(HOUR, NOW(), ws.start_time) as hours_until_start,
        TIMESTAMPDIFF(MINUTE, NOW(), ws.start_time) as minutes_until_start
      FROM workshop_schedules ws
      JOIN workshops w ON ws.workshop_id = w.id
      WHERE ws.start_time > NOW()
      AND ws.start_time < DATE_ADD(NOW(), INTERVAL 49 HOUR)
      AND ws.status = 'scheduled'
    `);

    console.log(`Query returned ${upcomingWorkshops.length} upcoming workshops within the next 49 hours`);
    
    // Log each workshop's details for debugging with more time information
    if (upcomingWorkshops.length > 0) {
      console.log('Upcoming workshops:');
      upcomingWorkshops.forEach(workshop => {
        const jsStartTime = new Date(workshop.start_time);
        console.log(`- ID: ${workshop.schedule_id}, Title: ${workshop.workshop_title}`);
        console.log(`  DB start_time: ${workshop.start_time}`);
        console.log(`  JS Date: ${jsStartTime}`);
        console.log(`  JS toLocaleString: ${jsStartTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        console.log(`  UNIX timestamp: ${workshop.unix_start_time}`);
        console.log(`  Hours until start: ${workshop.hours_until_start}`);
        console.log(`  Minutes until start: ${workshop.minutes_until_start}`);
      });
    }

    // Adjust filter criteria to be more inclusive
    const workshops48Hours = upcomingWorkshops.filter(w => 
      w.hours_until_start >= 46 && w.hours_until_start <= 50
    );
    
    const workshops6Hours = upcomingWorkshops.filter(w => 
      w.hours_until_start >= 5 && w.hours_until_start <= 7
    );
    
    const workshops1Hour = upcomingWorkshops.filter(w => 
      w.minutes_until_start >= 30 && w.minutes_until_start <= 90
    );
    
    console.log(`Filtered ${workshops48Hours.length} workshops for 48-hour reminders`);
    console.log(`Filtered ${workshops6Hours.length} workshops for 6-hour reminders`);
    console.log(`Filtered ${workshops1Hour.length} workshops for 1-hour reminders`);
    
    let totalNotificationsSent = 0;
    
    // Process 48-hour reminders
    for (const workshop of workshops48Hours) {
      const notificationsSent = await sendReminderNotifications(connection, workshop, '48 hours');
      totalNotificationsSent += notificationsSent;
    }
    
    // Process 6-hour reminders
    for (const workshop of workshops6Hours) {
      const notificationsSent = await sendReminderNotifications(connection, workshop, '6 hours');
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
  console.log(`Sending ${timeframe} reminders for workshop: ${workshop.workshop_title} (ID: ${workshop.schedule_id})`);
  
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

  console.log(`Found ${employees.length} subscribed employees for company ID: ${workshop.company_id}`);

  if (employees.length === 0) {
    console.log(`No subscribed employees found for workshop: ${workshop.workshop_title}`);
    return 0;
  }

  const startTime = new Date(workshop.start_time);
  console.log(`Workshop start time: ${startTime.toISOString()}`);
  
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
  try {
    const result = await sendWorkshopReminders();
  } catch (error) {
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

// Advance reminders - run every hour
cron.schedule('0 * * * *', async () => {
  try {
    const result = await sendAdvanceWorkshopReminders();
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
