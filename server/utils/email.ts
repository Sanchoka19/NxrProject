import nodemailer from 'nodemailer';
import cryptoRandomString from 'crypto-random-string';

// Configure email transporter
export const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error('Email configuration is missing. Please set EMAIL_USER and EMAIL_APP_PASSWORD environment variables.');
  }
  
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD, // This should be an App Password, not the regular Gmail password
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false
    }
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
): Promise<{success: boolean; error?: string}> => {
  try {
    // Validate required environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      return { 
        success: false, 
        error: 'Email configuration is missing. Please set EMAIL_USER and EMAIL_APP_PASSWORD environment variables.' 
      };
    }
    
    const transporter = createTransporter();
    
    // Registration URL with the token - make sure it points to the register-with-invite page
    const registrationUrl = `${frontendUrl}/auth?inviteToken=${inviteToken}`;
    
    // Email content
    const mailOptions = {
      from: `"Nexaro CRM" <${process.env.EMAIL_USER}>`,
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
          <p> ნუკრიი აქაც მოგაგენით <br>The Nexaro-CRM Team</p>
        </div>
      `,
      text: `Welcome to Nexaro-CRM! You have been invited to join. Please register your account by visiting: ${registrationUrl}. This invitation link will expire in 48 hours.`
    };
    
    // Send email and wait for the response
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error sending invitation email:', errorMessage);
    return { 
      success: false, 
      error: `Failed to send invitation email: ${errorMessage}` 
    };
  }
};