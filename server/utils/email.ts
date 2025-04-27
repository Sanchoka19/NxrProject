import nodemailer from 'nodemailer';
import cryptoRandomString from 'crypto-random-string';

// Configure email transporter
export const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

// Generate random token
export const generateInviteToken = (): string => {
  return cryptoRandomString({ length: 12, type: 'url-safe' });
};

// Send invitation email
export const sendInvitationEmail = async (
  email: string, 
  inviteToken: string,
  frontendUrl: string = 'http://localhost:5000' // Default to local dev
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    // Registration URL with the token
    const registrationUrl = `${frontendUrl}/register?inviteToken=${inviteToken}`;
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Invitation to join Nexaro-CRM',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to Nexaro-CRM</h1>
          <p>You have been invited to join Nexaro-CRM.</p>
          <p>Click the button below to complete your registration:</p>
          <div style="margin: 30px 0;">
            <a href="${registrationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Register Your Account
            </a>
          </div>
          <p>Or copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; color: #666;">${registrationUrl}</p>
          <p>This invitation link will expire in 48 hours.</p>
          <p>Thank you,<br>The Nexaro-CRM Team</p>
        </div>
      `,
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return false;
  }
};