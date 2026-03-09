const { Resend } = require('resend');
const logger = require('./logger');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Validates SMTP configuration at startup or before sending
 */
const validateSMTPConfig = () => {
    const requiredKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    const missing = requiredKeys.filter(key => !process.env[key] || process.env[key].includes('your_'));
    return missing;
};

const sendInviteMail = async (email, role, inviteToken, requestId = null) => {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const inviteLink = `${frontendUrl}/invite/${inviteToken}`;

        if (!resend) {
            logger.warn(`Skipping email send to ${email}: RESEND_API_KEY not configured.`);
            return { success: false, message: 'Resend API key missing' };
        }

        const info = await resend.emails.send({
            from: 'TaskPilot <onboarding@resend.dev>',
            to: email,
            subject: "You're invited to TaskPilotAI 🚀",
            html: `<h2>You are invited as ${role}</h2>
                   <a href="${inviteLink}">Accept Invitation</a>`
        });

        console.log("STEP 3: Email sent successfully");
        logger.info(`✔ Invite email sent successfully to ${email}`, { requestId });
        return info;
    } catch (error) {
        console.log("STEP ERROR:", error.message);
        logger.error(`Failed to send invite email to ${email}: ${error.message}`, { requestId, error });
        throw error;
    }
};

module.exports = { sendInviteMail, validateSMTPConfig };
