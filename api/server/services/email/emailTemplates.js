class EmailTemplates {
  static adminWelcomeTemplate(adminName, username, tempPassword, dashboardLink) {
    return {
      subject: "Welcome to Neure – Your Organization's Well-being Revolution Begins Now!",
      html: `
        <div style="max-width: 600px; margin: 20px auto; background:rgba(40, 41, 50, 0.91); border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: white;">
          <div style="background: #191A20; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="font-size: 28px; margin: 0; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);">Welcome to Neure!</h1>
          </div>
          <div style="padding: 30px;">
            <p style="margin: 15px 0;">Hi <span style="font-weight: 600;">${adminName}</span>,</p>
            <p style="margin: 15px 0;">We're thrilled to officially welcome you to Neure – where workplace well-being is redefined.</p>
            
            <div style="background-color: transparent; border-image: linear-gradient(to bottom, #FFFFFF 0%, #797B87 100%) 1; border-width: 0 0 0 4px; border-style: solid; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
              <h3 style="color: white; margin: 20px 0 10px 0;">Your Account Details</h3>
              <p style="margin: 15px 0;"><strong>Username:</strong> ${username}</p>
              <p style="margin: 15px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
              <p style="margin: 15px 0;"><em>Please update your password upon first login</em></p>
            </div>

            <p style="text-align: start; margin: 15px 0;">
              <a href="${dashboardLink}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(180deg, #FFFFFF 0%, #797B87 100%); color: black !important; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 15px 0; text-align: center; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">Access Your Dashboard</a>
            </p>

            <p style="margin: 15px 0;">As an Admin, you'll have full control to:</p>
            <ul style="list-style-type: none; padding: 0; margin: 15px 0;">
              <li style="padding: 8px 0; padding-left: 25px; position: relative;">Onboard employees</li>
              <li style="padding: 8px 0; padding-left: 25px; position: relative;">Track engagement</li>
              <li style="padding: 8px 0; padding-left: 25px; position: relative;">Manage well-being programs</li>
            </ul>
          </div>
          <div style="background-color: #191A20; padding: 20px; text-align: center; border-top: 1px solid #eee; color: #666; margin-top: 30px;">
            <p style="margin: 5px 0;">Welcome to the future of workplace well-being.</p>
            <p style="margin: 5px 0;">Regards,<br>Team Neure</p>
          </div>
        </div>
      `
    };
  }

  static superAdminWelcomeTemplate(adminName, username, tempPassword, dashboardLink) {
    return {
      subject: "Your Super Admin Access to Lumos Has Been Activated",
      html: `
        <div style="max-width: 600px; margin: 20px auto; background:rgba(40, 41, 50, 0.91); border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: white;">
          <div style="background: #191A20; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="font-size: 28px; margin: 0; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);">Super Admin Access Granted</h1>
          </div>
          <div style="padding: 30px;">
            <p style="margin: 15px 0;">Dear <span style="font-weight: 600;">${adminName}</span>,</p>
            <p style="margin: 15px 0;">We're pleased to welcome you to Lumos - Neure's internal platform designed to support and manage our wellbeing operations with clarity and efficiency.</p>
            <p style="margin: 15px 0;">You have been granted Super Admin access, which enables you to oversee key internal functions and team activity.</p>
            
            <div style="background-color: transparent; border-image: linear-gradient(to bottom, #FFFFFF 0%, #797B87 100%) 1; border-width: 0 0 0 4px; border-style: solid; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
              <h3 style="color: white; margin: 20px 0 10px 0;">Your Super Admin Credentials</h3>
              <p style="margin: 15px 0;"><strong>Username:</strong> ${username}</p>
              <p style="margin: 15px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
              <p style="margin: 15px 0;"><em>We recommend updating your password to a stronger one after login.</em></p>
            </div>

            <p style="text-align: center; margin: 25px 0;">
              <a href="${dashboardLink}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(180deg, #FFFFFF 0%, #797B87 100%); color: black !important; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 15px 0; text-align: center; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">Access Lumos Super Admin Dashboard</a>
            </p>

            <p style="margin: 15px 0;">We're excited to have you onboard in this pivotal role and look forward to building together.</p>
          </div>
          <div style="background-color: #191A20; padding: 20px; text-align: center; border-top: 1px solid #eee; color: #666; margin-top: 30px;">
            <p style="margin: 5px 0;">Warm regards,</p>
            <p style="margin: 5px 0;">Team Neure</p>
          </div>
        </div>
      `
    };
  }

  static employeeWelcomeTemplate(employeeName, email, password, dashboardLink) {
    return {
      subject: `Welcome to Neure - ${employeeName}`,
      html: `
        <div style="max-width: 600px; margin: 20px auto; background:rgba(40, 41, 50, 0.91); border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: white;">
          <div style="background: #191A20; color: white; padding: 30px 20px; text-align: center;">
            <div style="font-size: 24px; vertical-align: middle; margin: 0 2px;">👋</div>
            <h1 style="font-size: 28px; margin: 0; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);">Welcome Aboard!</h1>
          </div>
          <div style="padding: 30px;">
            <p style="margin: 15px 0; color: white;">Hi <span style="font-weight: 600; color: white;">${employeeName}</span>,</p>
            
            <div style="background-color: transparent; border-image: linear-gradient(to bottom, #FFFFFF 0%, #797B87 100%) 1; border-width: 0 0 0 4px; border-style: solid; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
              <p style="margin: 15px 0;">Welcome to Neure! You're now part of something truly transformative—a space designed to help you take charge of your mental well-being, build resilience, and unlock your full potential.</p>
            </div>

            <div style="background-color: transparent; border-image: linear-gradient(to bottom, #FFFFFF 0%, #797B87 100%) 1; border-width: 0 0 0 4px; border-style: solid; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
              <h3 style="color: white; margin: 20px 0 10px 0;">Your Login Credentials</h3>
              <p style="margin: 15px 0; color: white;"><strong style="color: white;">Email/Username:</strong> ${email}</p>
              <p style="margin: 15px 0;"><strong>Password:</strong> ${password}</p>
              <p style="margin: 15px 0;"><em>Please change your password after first login for security.</em></p>
            </div>

            <h3 style="color: white; margin: 20px 0 10px 0;">Getting Started</h3>
            <div style="background-color: transparent; border-image: linear-gradient(to bottom, #FFFFFF 0%, #797B87 100%) 1; border-width: 0 0 0 4px; border-style: solid; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
              <p style="margin: 15px 0;"><strong>1. Access Your Dashboard</strong></p>
              <p style="margin: 15px 0; text-align: center;">
                <a href="${dashboardLink}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(180deg, #FFFFFF 0%, #797B87 100%); color: black !important; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 15px 0; text-align: center; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">Go to Dashboard →</a>
              </p>
              <p style="margin: 15px 0;"><strong>2. Complete Your Profile</strong></p>
              <ul style="list-style-type: none; padding: 0; margin: 15px 0;">
                <li style="padding: 8px 0; padding-left: 25px; position: relative; color: white;">Change your password</li>
                <li style="padding: 8px 0; padding-left: 25px; position: relative;">Update your profile details</li>
                <li style="padding: 8px 0; padding-left: 25px; position: relative;">Add a profile picture</li>
              </ul>
            </div>

            <div style="background-color: transparent; border-image: linear-gradient(to bottom, #FFFFFF 0%, #797B87 100%) 1; border-width: 0 0 0 4px; border-style: solid; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
              <h3 style="color: white; margin: 20px 0 10px 0;">What's Inside Neure</h3>
              <ul style="list-style-type: none; padding: 0; margin: 15px 0;">
                <li style="padding: 8px 0; padding-left: 25px; position: relative;">Expert-led wellness workshops</li>
                <li style="padding: 8px 0; padding-left: 25px; position: relative;">Immersive well-being tools & resources</li>
                <li style="padding: 8px 0; padding-left: 25px; position: relative;">Focus-enhancing soundscapes</li>
                <li style="padding: 8px 0; padding-left: 25px; position: relative;">Personalized growth tracking</li>
              </ul>
            </div>
          </div>
          
          <div style="background-color: #191A20; padding: 20px; text-align: center; border-top: 1px solid #eee; color: #666; margin-top: 30px;">
            <p style="margin: 5px 0;">We're thrilled to have you on this journey! 🌟</p>
            <p style="margin: 5px 0;">Best regards,<br>Team Neure</p>
          </div>
        </div>
      `
    };
  }

  static employeeRewardTemplate(employeeName, adminName) {
    return {
      subject: "🎉 You've Earned a Reward!",
      html: `
        <div style="max-width: 600px; margin: 20px auto; background:rgba(40, 41, 50, 0.91); border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: white;">
          <div style="background: #191A20; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="font-size: 28px; margin: 0; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);">🎊 Congratulations! 🎊</h1>
          </div>
          <div style="padding: 30px;">
            <p style="margin: 15px 0;">Hi <span style="font-weight: 600;">${employeeName}</span>,</p>

            <div style="background-color: transparent; border-image: linear-gradient(to bottom, #FFFFFF 0%, #797B87 100%) 1; border-width: 0 0 0 4px; border-style: solid; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
              <h3 style="color: white; margin: 20px 0 10px 0;">You've just unlocked an in-company reward! 🎊</h3>
              <p style="margin: 15px 0;"><span style="font-weight: 600;">${adminName}</span> has sent this your way as a token of appreciation for your dedication and efforts.</p>
            </div>

            <p style="margin: 15px 0;">Keep up the amazing work, you're making a real impact, and we're excited to see you continue growing and thriving!</p>

            <div style="background-color: transparent; border-image: linear-gradient(to bottom, #FFFFFF 0%, #797B87 100%) 1; border-width: 0 0 0 4px; border-style: solid; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
              <p style="margin: 15px 0; text-align: center;">Check your rewards section now and enjoy your well-earned perk!</p>
            </div>
            
            <p style="text-align: center; margin: 25px 0;">
              <a href="https://main.d20xlhmrfjnx3n.amplifyapp.com/rewardsAndRecognition" style="display: inline-block; padding: 12px 28px; background: linear-gradient(180deg, #FFFFFF 0%, #797B87 100%); color: black !important; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 15px 0; text-align: center; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">View Your Reward</a>
            </p>
          </div>
          <div style="background-color: #191A20; padding: 20px; text-align: center; border-top: 1px solid #eee; color: #666; margin-top: 30px;">
            <p style="margin: 5px 0;">More wins ahead! 🚀</p>
            <p style="margin: 5px 0;">Team Neure</p>
          </div>
        </div>
      `
    };
  }

  static rewardRedemptionAdminTemplate(adminName, employeeName, rewardName) {
    return {
      subject: "Reward Redemption Notification",
      html: `
        <div style="max-width: 600px; margin: 20px auto; background:rgba(40, 41, 50, 0.91); border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: white;">
          <div style="background: #191A20; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="font-size: 28px; margin: 0; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);">Reward Redemption</h1>
          </div>
          <div style="padding: 30px;">
            <p style="margin: 15px 0;">Hi <span style="font-weight: 600;">${adminName}</span>,</p>

            <div style="background-color: transparent; border-image: linear-gradient(to bottom, #FFFFFF 0%, #797B87 100%) 1; border-width: 0 0 0 4px; border-style: solid; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
              <p style="margin: 15px 0;"><span style="font-weight: 600;">${employeeName}</span> has successfully redeemed the reward you sent their way! 🎉</p>
              <p style="margin: 15px 0;"><strong>Reward Name:</strong> ${rewardName}</p>
            </div>

            <p style="margin: 15px 0;">Your recognition made an impact, and they've claimed their well-earned perk.</p>
          </div>
          <div style="background-color: #191A20; padding: 20px; text-align: center; border-top: 1px solid #eee; color: #666; margin-top: 30px;">
            <p style="margin: 5px 0;">Celebrating wins like these keeps the momentum strong, and it's amazing to see your team engaging with Neure's rewards program.</p>
            <p style="margin: 5px 0;">Head to the admin panel anytime to recognize and reward more employees! 🚀</p>
          </div>
        </div>
      `
    };
  }

  static rewardClaimConfirmationTemplate(employeeName, rewardName) {
  return {
    subject: "Reward Claim Confirmation",
    html: `
      <div style="max-width: 600px; margin: 20px auto; background:rgba(40, 41, 50, 0.91); border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: white;">
        <div style="background: #191A20; color: white; padding: 30px 20px; text-align: center;">
          <h1 style="font-size: 28px; margin: 0; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);">Reward Claimed Successfully</h1>
        </div>
        <div style="padding: 30px;">
          <p style="margin: 15px 0;">Hi <span style="font-weight: 600;">${employeeName}</span>,</p>

          <div style="background-color: transparent; border-image: linear-gradient(to bottom, #FFFFFF 0%, #797B87 100%) 1; border-width: 0 0 0 4px; border-style: solid; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
            <h3 style="color: white; margin: 20px 0 10px 0;">Your reward has been successfully claimed! 🎉</h3>
            <p style="margin: 15px 0;"><strong>Reward:</strong> ${rewardName}</p>
            <p style="margin: 15px 0;"><strong>Claimed on:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <p style="margin: 15px 0;">Your reward has been processed and is now ready for redemption. If your reward requires any additional steps for redemption, your administrator will reach out with further instructions.</p>
          
          <div style="background-color: transparent; border-image: linear-gradient(to bottom, #FFFFFF 0%, #797B87 100%) 1; border-width: 0 0 0 4px; border-style: solid; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
            <p style="margin: 15px 0;">Thank you for your continued dedication and contributions. We hope you enjoy your well-deserved reward!</p>
          </div>
        </div>
        <div style="background-color: #191A20; padding: 20px; text-align: center; border-top: 1px solid #eee; color: #666; margin-top: 30px;">
          <p style="margin: 5px 0;">Keep up the great work! 🚀</p>
          <p style="margin: 5px 0;">Team Neure</p>
        </div>
      </div>
    `
  };
}

  static accountDeactivationTemplate(employeeName, companyName) {
    return {
      subject: "Account Deactivation - Neure",
      html: `
        <div style="max-width: 600px; margin: 20px auto; background:rgba(40, 41, 50, 0.91); border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: white;">
          <div style="background: #191A20; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="font-size: 28px; margin: 0; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);">Account Update</h1>
          </div>
          <div style="padding: 30px;">
            <p style="margin: 15px 0;">Dear <span style="font-weight: 600;">${employeeName}</span>,</p>

            <div style="background-color: transparent; border-image: linear-gradient(to bottom, #FFFFFF 0%, #797B87 100%) 1; border-width: 0 0 0 4px; border-style: solid; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
              <p style="margin: 15px 0;">We wanted to share that your access to Neure, as part of <span style="font-weight: 600;">${companyName}</span>'s well-being program, has now been deactivated due to internal updates.</p>
            </div>

            <p style="margin: 15px 0;">While this marks the end of your time with Neure for now, your well-being journey doesn't stop here. We hope the insights, tools, and experiences you've gained continue to support you in both work and life.</p>
          </div>
          <div style="background-color: #191A20; padding: 20px; text-align: center; border-top: 1px solid #eee; color: #666; margin-top: 30px;">
            <p style="margin: 5px 0;">Wishing you growth, balance, and success ahead.</p>
            <p style="margin: 5px 0;">Regards,<br>Team Neure</p>
          </div>
        </div>
      `
    };
  }

  static wellbeingReportTemplate(contactName, companyName, startDate, endDate, reportUrl) {
    return {
      subject: `${companyName} - Wellbeing Report`,
      html: `
        <div style="max-width: 600px; margin: 20px auto; background:rgba(40, 41, 50, 0.91); border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: white;">
          <div style="background: #191A20; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="font-size: 28px; margin: 0; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);">Wellbeing Report</h1>
          </div>
          <div style="padding: 30px;">
            <p style="margin: 15px 0;">Hello <span style="font-weight: 600;">${contactName}</span>,</p>

            <div style="background-color: transparent; border-image: linear-gradient(to bottom, #FFFFFF 0%, #797B87 100%) 1; border-width: 0 0 0 4px; border-style: solid; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
              <p style="margin: 15px 0;">Your company wellbeing report for the period <span style="font-weight: 600;">${startDate}</span> to <span style="font-weight: 600;">${endDate}</span> is now available.</p>
            </div>

            <p style="margin: 15px 0;">This report provides valuable insights into your organization's wellbeing metrics, including engagement scores, stress levels, and overall psychological safety index.</p>
            
            <p style="text-align: center; margin: 25px 0;">
              <a href="${reportUrl}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(180deg, #FFFFFF 0%, #797B87 100%); color: black !important; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 15px 0; text-align: center; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">Download Wellbeing Report</a>
            </p>
            
            <p style="margin: 15px 0; font-style: italic; color: #666;">This report will be available for 30 days.</p>
          </div>
          <div style="background-color: #191A20; padding: 20px; text-align: center; border-top: 1px solid #eee; color: #666; margin-top: 30px;">
            <p style="margin: 5px 0;">Thank you for using our services.</p>
            <p style="margin: 5px 0;">Regards,<br>Team Neure</p>
          </div>
        </div>
      `
    };
  }

  static workshopTicketTemplate(employeeName, workshopTitle, startTime, hostName, companyName, ticketId, pdfUrl) {
    return {
      subject: `Your Ticket for Workshop: ${workshopTitle}`,
      html: `
        <div style="max-width: 600px; margin: 20px auto; background:rgba(40, 41, 50, 0.91); border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: white;">
          <div style="background: #191A20; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="font-size: 28px; margin: 0; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);">Workshop Ticket</h1>
          </div>
          <div style="padding: 30px;">
            <p style="margin: 15px 0;">Hi <span style="font-weight: 600;">${employeeName}</span>,</p>
            
            <div style="background-color: transparent; border-image: linear-gradient(to bottom, #FFFFFF 0%, #797B87 100%) 1; border-width: 0 0 0 4px; border-style: solid; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
              <h3 style="color: white; margin: 20px 0 10px 0;">Your Workshop Ticket is Ready!</h3>
              <p style="margin: 15px 0;">You're all set for the upcoming workshop. Here are your details:</p>
            </div>

            <div style="background-color: transparent; border-image: linear-gradient(to bottom, #FFFFFF 0%, #797B87 100%) 1; border-width: 0 0 0 4px; border-style: solid; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
              <h3 style="color: white; margin: 20px 0 10px 0;">Workshop Details</h3>
              <p style="margin: 15px 0;"><strong>Workshop:</strong> ${workshopTitle}</p>
              <p style="margin: 15px 0;"><strong>Date & Time:</strong> ${startTime}</p>
              <p style="margin: 15px 0;"><strong>Host:</strong> ${hostName}</p>
              <p style="margin: 15px 0;"><strong>Company:</strong> ${companyName}</p>
              <p style="margin: 15px 0;"><strong>Ticket ID:</strong> ${ticketId}</p>
            </div>

            <p style="text-align: center; margin: 25px 0;">
              <a href="${pdfUrl}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(180deg, #FFFFFF 0%, #797B87 100%); color: black !important; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 15px 0; text-align: center; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">Download Your Ticket</a>
            </p>
            
            <p style="margin: 15px 0;">Please bring this ticket (either printed or on your device) to the workshop for check-in.</p>
          </div>
          <div style="background-color: #191A20; padding: 20px; text-align: center; border-top: 1px solid #eee; color: #666; margin-top: 30px;">
            <p style="margin: 5px 0;">We look forward to seeing you there!</p>
            <p style="margin: 5px 0;">Regards,<br>Team Neure</p>
          </div>
        </div>
      `
    };
  }

  static passwordResetTemplate(userName, resetToken, roleId) {
    // roleId – 1: Superadmin, 2: Company Admin, 3: Employee
    // Map role → dashboard base URL
    const baseUrlMap = {
      1: 'https://main.d1cczoqd1ouk3l.amplifyapp.com/login', // Superadmin_dashboard
      2: 'https://main.d141ack5c21hha.amplifyapp.com',       // Company_admin_dashboard
      3: 'https://main.d20xlhmrfjnx3n.amplifyapp.com'        // Employee_dashboard
    };

    const baseUrl = baseUrlMap[roleId];
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
    
    return {
      subject: "Reset Your Password - Neure",
      html: `
        <div style="max-width: 600px; margin: 20px auto; background:rgba(40, 41, 50, 0.91); border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: white;">
          <div style="background: #191A20; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="font-size: 28px; margin: 0; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);">Password Reset Request</h1>
          </div>
          <div style="padding: 30px;">
            <p style="margin: 15px 0;">Hello <span style="font-weight: 600;">${userName}</span>,</p>
            <p style="margin: 15px 0;">We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
            
            <div style="background-color: transparent; border-image: linear-gradient(to bottom, #FFFFFF 0%, #797B87 100%) 1; border-width: 0 0 0 4px; border-style: solid; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
              <p style="margin: 15px 0;">To reset your password, click the button below:</p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="${resetLink}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(180deg, #FFFFFF 0%, #797B87 100%); color: black !important; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 15px 0; text-align: center; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">Reset Password</a>
              </div>
              
              <p style="margin: 15px 0; font-size: 13px;">This link will expire in 1 hour for security reasons.</p>
            </div>
            
            <p style="margin: 15px 0;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="margin: 15px 0; word-break: break-all; font-size: 13px;"><a href="${resetLink}" style="color: #FFFFFF; ">${resetLink}</a></p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #777; text-align: center;">
              &copy; ${new Date().getFullYear()} Neure. All rights reserved.
            </p>
          </div>
        </div>
      `
    };
  }
}

module.exports = EmailTemplates;
