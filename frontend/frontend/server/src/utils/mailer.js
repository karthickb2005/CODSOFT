const nodemailer = require('nodemailer');

// Add EMAIL_USER and EMAIL_PASS in server/.env manually
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

console.log("MAILER ENV CHECK:", {
    user: !!process.env.SMTP_USER,
    pass: !!process.env.SMTP_PASS
});

transporter.verify((err, success) => {
    if (err) {
        console.error("❌ SMTP Connection Failed:", err.message);
    } else {
        console.log("✅ SMTP Server Ready");
    }
});

const sendInvitationEmail = async (toEmail, role, inviteToken) => {
    try {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const inviteLink = `${frontendUrl}/invite/${inviteToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER || '"TaskPilotAI" <no-reply@taskpilotai.com>',
            to: toEmail,
            subject: "You're invited to TaskPilotAI 🚀",
            text: `You have been invited to join TaskPilotAI as ${role}. Accept here: ${inviteLink}`,
            html: `
                <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #4f46e5; font-size: 28px; margin-bottom: 10px;">You're invited to TaskPilotAI 🚀</h1>
                        <p style="color: #6b7280; font-size: 16px;">Step into the future of productivity.</p>
                    </div>
                    
                    <div style="background-color: #f9fafb; padding: 25px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
                        <p style="color: #374151; font-size: 18px; margin: 0;">You have been invited as a</p>
                        <p style="color: #4f46e5; font-size: 24px; font-weight: bold; margin: 10px 0;">${role.replace('_', ' ')}</p>
                    </div>

                    <div style="text-align: center;">
                        <a href="${inviteLink}" style="display: inline-block; padding: 16px 32px; background-color: #7c3aed; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px; transition: background-color 0.2s;">
                            Accept Invitation
                        </a>
                    </div>

                    <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 40px 0;">
                    
                    <div style="text-align: center; color: #9ca3af; font-size: 14px;">
                        <p>This invitation link will expire in 24 hours.</p>
                        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
                    </div>
                </div>
            `
        };

        if (process.env.DISABLE_EMAIL === "true") {
            console.log("[EMAIL_DISABLED_ON_RENDER] Skipping email send to:", toEmail);
            return true; // Return true so calling code thinks it's sent
        }

        const info = await transporter.sendMail(mailOptions);
        console.log(`Invitation email successfully sent to ${toEmail} [MessageId: ${info.messageId}]`);
        return true;
    } catch (error) {
        console.error("❌ EMAIL SEND ERROR:", error.message);
        return false;
    }
};

module.exports = {
    sendInvitationEmail
};
