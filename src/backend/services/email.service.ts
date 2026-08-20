import nodemailer from "nodemailer";
import { AppError } from "../utils/AppError";
import { getVerificationEmailHtml, getEmailChangeHtml, getPasswordResetHtml, getOrderConfirmationHtml, getOrderProcessingHtml, getOrderConfirmedHtml, getOrderCancelledHtml, getPaymentSuccessHtml, getPaymentFailedHtml, getOrderShippedHtml, getOrderDeliveredHtml } from "./email/templates";

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private getStorefrontUrl() {
    let url = process.env.STOREFRONT_URL || "http://localhost:3000";
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    return url;
  }

  async sendVerificationEmail(email: string, firstName: string | null | undefined, token: string) {
    if (!process.env.SMTP_HOST && process.env.NODE_ENV === "production") {
      console.warn("[EMAIL] SMTP_HOST not set, verification email may fail.");
    }
    
    const verificationUrl = `${this.getStorefrontUrl()}/verify-email?token=${encodeURIComponent(token)}`;
    const displayName = firstName || "Customer";

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Storefront" <noreply@storefront.com>',
      to: email,
      subject: "Verify Your Email Address",
      html: getVerificationEmailHtml(displayName, verificationUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("[EMAIL] Verification email delivery failed to recipient");
      throw new AppError("Failed to send verification email. Please try again later.", 500, "EMAIL_SEND_FAILED");
    }
  }

  async sendEmailChangeVerificationEmail(newEmail: string, firstName: string | null | undefined, token: string) {
    const verificationUrl = `${this.getStorefrontUrl()}/verify-email-change?token=${encodeURIComponent(token)}`;
    const displayName = firstName || "Customer";

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Storefront" <noreply@storefront.com>',
      to: newEmail,
      subject: "Confirm Your New Email Address",
      html: getEmailChangeHtml(displayName, verificationUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("[EMAIL] Email change verification delivery failed to recipient");
      throw new AppError("Failed to send verification email to the new address. Please try again.", 500, "EMAIL_SEND_FAILED");
    }
  }

  async sendPasswordResetEmail(email: string, firstName: string | null | undefined, rawToken: string) {
    const resetUrl = `${this.getStorefrontUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
    const displayName = firstName || "Customer";

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Storefront" <noreply@storefront.com>',
      to: email,
      subject: "Reset Your Password",
      html: getPasswordResetHtml(displayName, resetUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("[EMAIL] Password reset email delivery failed to recipient");
      throw new AppError("Failed to send password reset email. Please try again later.", 500, "EMAIL_SEND_FAILED");
    }
  }
  async sendOrderConfirmationEmail(customer: { email: string; firstName?: string | null; lastName?: string | null }, order: any) {
    if (!customer || !customer.email) return;
    const displayName = customer.firstName || "Customer";
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Storefront" <noreply@storefront.com>',
      to: customer.email,
      subject: `Order Confirmation #${order.orderNumber}`,
      html: getOrderConfirmationHtml(displayName, order),
    };
    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(`[EMAIL] Order confirmation email delivery failed for order ${order.orderNumber}`);
      // Do not throw to avoid crashing checkout flow
    }
  }

  async sendOrderProcessingEmail(customer: { email: string; firstName?: string | null; lastName?: string | null }, order: any) {
    if (!customer || !customer.email) return;
    const displayName = customer.firstName || "Customer";
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Storefront" <noreply@storefront.com>',
      to: customer.email,
      subject: `Your Order #${order.orderNumber} is Processing`,
      html: getOrderProcessingHtml(displayName, order),
    };
    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(`[EMAIL] Order processing email delivery failed for order ${order.orderNumber}`);
    }
  }

  async sendOrderConfirmedEmail(customer: { email: string; firstName?: string | null; lastName?: string | null }, order: any) {
    if (!customer || !customer.email) return;
    const displayName = customer.firstName || "Customer";
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Storefront" <noreply@storefront.com>',
      to: customer.email,
      subject: `Your Order #${order.orderNumber} is Confirmed`,
      html: getOrderConfirmedHtml(displayName, order),
    };
    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(`[EMAIL] Order confirmed email delivery failed for order ${order.orderNumber}`);
    }
  }

  async sendOrderCancelledEmail(customer: { email: string; firstName?: string | null; lastName?: string | null }, order: any) {
    if (!customer || !customer.email) return;
    const displayName = customer.firstName || "Customer";
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Storefront" <noreply@storefront.com>',
      to: customer.email,
      subject: `Your Order #${order.orderNumber} is Cancelled`,
      html: getOrderCancelledHtml(displayName, order),
    };
    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(`[EMAIL] Order cancelled email delivery failed for order ${order.orderNumber}`);
    }
  }



  async sendPaymentSuccessEmail(customer: { email: string; firstName?: string | null; lastName?: string | null }, payment: any, order: any) {
    if (!customer || !customer.email) return;
    const displayName = customer.firstName || "Customer";
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Storefront" <noreply@storefront.com>',
      to: customer.email,
      subject: `Payment Successful for Order #${order.orderNumber}`,
      html: getPaymentSuccessHtml(displayName, payment, order),
    };
    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(`[EMAIL] Payment success email delivery failed for order ${order.orderNumber}`);
    }
  }

  async sendPaymentFailedEmail(customer: { email: string; firstName?: string | null; lastName?: string | null }, payment: any, order: any) {
    if (!customer || !customer.email) return;
    const displayName = customer.firstName || "Customer";
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Storefront" <noreply@storefront.com>',
      to: customer.email,
      subject: `Payment Failed for Order #${order.orderNumber}`,
      html: getPaymentFailedHtml(displayName, payment, order),
    };
    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(`[EMAIL] Payment failed email delivery failed for order ${order.orderNumber}`);
    }
  }

  async sendOrderShippedEmail(customer: { email: string; firstName?: string | null; lastName?: string | null }, shipment: any, order: any) {
    if (!customer || !customer.email) return;
    const displayName = customer.firstName || "Customer";
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Storefront" <noreply@storefront.com>',
      to: customer.email,
      subject: `Your Order #${order.orderNumber} has Shipped`,
      html: getOrderShippedHtml(displayName, shipment, order),
    };
    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(`[EMAIL] Order shipped email delivery failed for order ${order.orderNumber}`);
    }
  }

  async sendOrderDeliveredEmail(customer: { email: string; firstName?: string | null; lastName?: string | null }, shipment: any, order: any) {
    if (!customer || !customer.email) return;
    const displayName = customer.firstName || "Customer";
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Storefront" <noreply@storefront.com>',
      to: customer.email,
      subject: `Your Order #${order.orderNumber} has been Delivered`,
      html: getOrderDeliveredHtml(displayName, shipment, order),
    };
    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(`[EMAIL] Order delivered email delivery failed for order ${order.orderNumber}`);
    }
  }

}


export const emailService = new EmailService();
