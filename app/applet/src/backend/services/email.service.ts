import nodemailer from "nodemailer";
import { AppError } from "../utils/AppError";

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationEmail(email: string, firstName: string | null | undefined, token: string) {
    if (!process.env.SMTP_HOST && process.env.NODE_ENV === "production") {
      console.warn("SMTP_HOST not set, verification email may fail.");
    }

    const baseUrl = process.env.STOREFRONT_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
    const displayName = firstName || "Customer";

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Storefront" <noreply@storefront.com>',
      to: email,
      subject: "Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Welcome, ${displayName}!</h2>
          <p>Thank you for registering. Please verify your email address to complete your account setup.</p>
          <div style="margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>This verification link will expire in 24 hours.</p>
          <p style="font-size: 12px; color: #666; margin-top: 40px;">
            Security Notice: If you did not request this email, please ignore it or contact support. Never share your verification link with anyone.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Failed to send verification email:", error);
      throw new AppError("Failed to send verification email. Please try again later.", 500, "EMAIL_SEND_FAILED");
    }
  }
}

export const emailService = new EmailService();
