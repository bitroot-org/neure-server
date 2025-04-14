class EmailTemplates {
  static get baseStyle() {
    return `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          background-color: #f5f5f5;
          font-family: 'Segoe UI', Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
        }
        
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #0066cc, #0052a3);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 28px;
          margin: 0;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        
        .content {
          padding: 30px;
        }
        
        .highlight {
          background-color: #f8f9fa;
          border-left: 4px solid #0066cc;
          padding: 20px;
          margin: 20px 0;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .important {
          color: #0066cc;
          font-weight: 600;
        }
        
        .button {
          display: inline-block;
          padding: 12px 28px;
          background: linear-gradient(135deg, #0066cc, #0052a3);
          color: white !important;
          text-decoration: none;
          border-radius: 25px;
          font-weight: 600;
          margin: 15px 0;
          text-align: center;
          transition: transform 0.2s;
          box-shadow: 0 2px 4px rgba(0, 102, 204, 0.3);
        }
        
        .button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 102, 204, 0.4);
        }
        
        ul {
          list-style-type: none;
          padding: 0;
          margin: 15px 0;
        }
        
        li {
          padding: 8px 0;
          padding-left: 25px;
          position: relative;
        }
        
        li:before {
          content: "✓";
          color: #0066cc;
          position: absolute;
          left: 0;
        }
        
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #eee;
          color: #666;
          margin-top: 30px;
        }
        
        .footer p {
          margin: 5px 0;
        }
        
        h3 {
          color: #0066cc;
          margin: 20px 0 10px 0;
        }
        
        p {
          margin: 15px 0;
        }
        
        .emoji {
          font-size: 24px;
          vertical-align: middle;
          margin: 0 2px;
        }
        
        @media only screen and (max-width: 600px) {
          .email-container {
            margin: 10px;
            border-radius: 8px;
          }
          
          .content {
            padding: 20px;
          }
        }
      </style>
    `;
  }

  static adminWelcomeTemplate(adminName, username, tempPassword, dashboardLink) {
    return {
      subject: "Welcome to Neure – Your Organization's Well-being Revolution Begins Now!",
      html: `
        ${this.baseStyle}
        <div class="email-container">
          <div class="header">
            <h1>Welcome to Neure!</h1>
          </div>
          <div class="content">
            <p>Hi <span class="important">${adminName}</span>,</p>
            <p>We're thrilled to officially welcome you to Neure – where workplace well-being is redefined.</p>
            
            <div class="highlight">
              <h3>Your Account Details</h3>
              <p><strong>Username:</strong> ${username}</p>
              <p><strong>Temporary Password:</strong> ${tempPassword}</p>
              <p><em>Please update your password upon first login</em></p>
            </div>

            <p style="text-align: start;">
              <a href="${dashboardLink}" class="button">Access Your Dashboard</a>
            </p>

            <p>As an Admin, you'll have full control to:</p>
            <ul>
              <li>Onboard employees</li>
              <li>Track engagement</li>
              <li>Manage well-being programs</li>
            </ul>
          </div>
          <div class="footer">
            <p>Welcome to the future of workplace well-being.</p>
            <p>Regards,<br>Team Neure</p>
          </div>
        </div>
      `
    };
  }

  static employeeWelcomeTemplate(employeeName, email, password, dashboardLink) {
    return {
      subject: `Welcome to Neure - ${employeeName}`,
      html: `
        ${this.baseStyle}
        <div class="email-container">
          <div class="header">
            <div class="header-emoji">👋</div>
            <h1>Welcome Aboard!</h1>
          </div>
          <div class="content">
            <p>Hi <span class="important">${employeeName}</span>,</p>
            
            <div class="highlight">
              <p>Welcome to Neure! You're now part of something truly transformative—a space designed to help you take charge of your mental well-being, build resilience, and unlock your full potential.</p>
            </div>

            <div class="highlight">
              <h3>Your Login Credentials</h3>
              <p><strong>Email/Username:</strong> ${email}</p>
              <p><strong>Password:</strong> ${password}</p>
              <p><em>Please change your password after first login for security.</em></p>
            </div>

            <h3>Getting Started</h3>
            <div class="highlight">
              <p><strong>1. Access Your Dashboard</strong></p>
              <p style="text-align: center;">
                <a href="${dashboardLink}" class="button">Go to Dashboard →</a>
              </p>
              <p><strong>2. Complete Your Profile</strong></p>
              <ul>
                <li>Change your password</li>
                <li>Update your profile details</li>
                <li>Add a profile picture</li>
              </ul>
            </div>

            <div class="highlight">
              <h3>What's Inside Neure</h3>
              <ul>
                <li>Expert-led wellness workshops</li>
                <li>Immersive well-being tools & resources</li>
                <li>Focus-enhancing soundscapes</li>
                <li>Personalized growth tracking</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>We're thrilled to have you on this journey! 🌟</p>
            <p>Best regards,<br>Team Neure</p>
          </div>
        </div>
      `
    };
  }

  static employeeRewardTemplate(employeeName, adminName) {
    return {
      subject: "🎉 You've Earned a Reward!",
      html: `
        ${this.baseStyle}
        <div class="email-container">
          <div class="header">
            <h1>🎉 Congratulations! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi <span class="important">${employeeName}</span>,</p>

            <div class="highlight">
              <h3>You've just unlocked an in-company reward! 🎊</h3>
              <p><span class="important">${adminName}</span> has sent this your way as a token of appreciation for your dedication and efforts.</p>
            </div>

            <p>Keep up the amazing work, you're making a real impact, and we're excited to see you continue growing and thriving!</p>

            <div class="highlight">
              <p style="text-align: center;">Check your rewards section now and enjoy your well-earned perk!</p>
            </div>
          </div>
          <div class="footer">
            <p>More wins ahead! 🚀</p>
            <p>Team Neure</p>
          </div>
        </div>
      `
    };
  }

  static rewardRedemptionAdminTemplate(adminName, employeeName, rewardName) {
    return {
      subject: "Reward Redemption Notification",
      html: `
        ${this.baseStyle}
        <div class="email-container">
          <div class="header">
            <h1>Reward Redemption</h1>
          </div>
          <div class="content">
            <p>Hi <span class="important">${adminName}</span>,</p>

            <div class="highlight">
              <p><span class="important">${employeeName}</span> has successfully redeemed the reward you sent their way! 🎉</p>
              <p><strong>Reward Name:</strong> ${rewardName}</p>
            </div>

            <p>Your recognition made an impact, and they've claimed their well-earned perk.</p>
          </div>
          <div class="footer">
            <p>Celebrating wins like these keeps the momentum strong, and it's amazing to see your team engaging with Neure's rewards program.</p>
            <p>Head to the admin panel anytime to recognize and reward more employees! 🚀</p>
          </div>
        </div>
      `
    };
  }

  static accountDeactivationTemplate(employeeName, companyName) {
    return {
      subject: "Account Deactivation - Neure",
      html: `
        ${this.baseStyle}
        <div class="email-container">
          <div class="header">
            <h1>Account Update</h1>
          </div>
          <div class="content">
            <p>Dear <span class="important">${employeeName}</span>,</p>

            <div class="highlight">
              <p>We wanted to share that your access to Neure, as part of <span class="important">${companyName}</span>'s well-being program, has now been deactivated due to internal updates.</p>
            </div>

            <p>While this marks the end of your time with Neure for now, your well-being journey doesn't stop here. We hope the insights, tools, and experiences you've gained continue to support you in both work and life.</p>
          </div>
          <div class="footer">
            <p>Wishing you growth, balance, and success ahead.</p>
            <p>Regards,<br>Team Neure</p>
          </div>
        </div>
      `
    };
  }
}

module.exports = EmailTemplates;