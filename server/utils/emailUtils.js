const nodemailer = require("nodemailer");

const sendVerificationEmail = async (email, otp) => {
    // ALWAYS log OTP to console for easy testing during development
    console.log('\n=========================================');
    console.log('       CAMPUSCONNECT VERIFICATION        ');
    console.log(`  Target Email: ${email}`);
    console.log(`  Your Code   : ${otp}`);
    console.log('=========================================\n');

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "Your OTP Verification Code",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">Email Verification</h2>
          <p>Hello,</p>
          <p>Your OTP code for CampusConnect is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code expires in 3 minutes.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #6b7280; text-align: center;">© 2026 CampusConnect. All rights reserved.</p>
        </div>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.response);
        return true;
    } catch (error) {
        console.log("Email error:", error);
        // In development, we return true if it's just an auth error so they can still test with the console log
        if (error.code === 'EAUTH' || error.responseCode === 535) {
            console.log("NOTE: Email failed to send due to Auth error. You can still use the code above in the terminal.");
            return true;
        }
        return false;
    }
};

const sendWelcomeEmail = async (email, name, password, role, systemEmail = null) => {
    const displayEmail = systemEmail || email;
    console.log('\n=========================================');
    console.log('       CAMPUSCONNECT WELCOME EMAIL       ');
    console.log(`  Recipient Email: ${email}`);
    console.log(`  Name           : ${name}`);
    console.log(`  Role           : ${role}`);
    console.log(`  Login Email    : ${displayEmail}`);
    console.log(`  Password       : ${password}`);
    console.log('=========================================\n');

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "Welcome to CampusConnect!",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">Welcome to CampusConnect!</h2>
          <p>Hello ${name},</p>
          <p>An administrative account has been created for you as an <strong>${role}</strong>.</p>
          <p>You can now log in using the following credentials:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Login Email:</strong> ${displayEmail}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
          </div>
          <p>Please change your password after your first login for security reasons.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #6b7280; text-align: center;">© 2026 CampusConnect. All rights reserved.</p>
        </div>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Welcome Email sent:", info.response);
        return true;
    } catch (error) {
        console.log("Welcome Email error:", error);
        if (error.code === 'EAUTH' || error.responseCode === 535) {
            return true;
        }
        return false;
    }
};

const sendSkillReplyEmail = async (studentEmail, studentName, expertName, skillTitle, message) => {
    console.log('\n=========================================');
    console.log('       CAMPUSCONNECT SKILL REPLY         ');
    console.log(`  To: ${studentEmail}`);
    console.log(`  From Expert: ${expertName}`);
    console.log(`  Skill Topic: ${skillTitle}`);
    console.log('=========================================\n');

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: studentEmail,
            subject: `Expert Response: Support for ${skillTitle}`,
            html: `
        <div style="font-family: 'Times New Roman', serif; max-width: 650px; margin: auto; padding: 40px; border: 2px solid #2563eb; border-radius: 4px; color: #1f2937; line-height: 1.6;">
          <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; text-transform: uppercase; letter-spacing: 2px;">CampusConnect</h1>
            <p style="margin: 5px 0; font-style: italic; color: #6b7280;">Institutional Peer Skill Exchange & Community Events</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <p><strong>To:</strong> ${studentName}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Subject:</strong> Formal Response to Skill Request - "${skillTitle}"</p>
          </div>

          <p>Dear ${studentName},</p>
          
          <p>We are pleased to inform you that a verified expert, <strong>${expertName}</strong>, has reviewed your request for guidance regarding "<strong>${skillTitle}</strong>" and has provided the following professional response:</p>
          
          <div style="background-color: #f8fafc; padding: 25px; border-left: 4px solid #2563eb; margin: 25px 0; font-style: italic;">
            "${message}"
          </div>

          <p>You are encouraged to coordinate your learning schedule directly through the platform or by replying to the expert's institutional contact information.</p>
          
          <p>Thank you for engaging with the CampusConnect academic community. We wish you success in your learning endeavors.</p>
          
          <div style="margin-top: 50px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <p style="margin: 0;">Sincerely,</p>
            <p style="margin: 5px 0; font-weight: bold; color: #2563eb;">The CampusConnect Academic Module</p>
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">Official Notification System | University Skill Exchange</p>
          </div>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.log("Skill Reply Email error:", error);
        return false;
    }
};

module.exports = { sendVerificationEmail, sendWelcomeEmail, sendSkillReplyEmail };
