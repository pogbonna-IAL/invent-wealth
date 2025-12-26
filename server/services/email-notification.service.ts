/**
 * Email Notification Service for Distributions
 * 
 * This service handles sending email notifications for distribution-related events.
 * In a production environment, you would integrate with an email service provider
 * like SendGrid, AWS SES, or Resend.
 */

export interface EmailNotificationOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailNotificationService {
  /**
   * Send email notification
   * In production, integrate with your email service provider
   */
  static async sendEmail(options: EmailNotificationOptions): Promise<boolean> {
    try {
      // TODO: Integrate with email service provider
      // Example with Resend:
      // const resend = new Resend(process.env.RESEND_API_KEY);
      // await resend.emails.send({
      //   from: 'noreply@inventwealth.com',
      //   to: options.to,
      //   subject: options.subject,
      //   html: options.html,
      // });

      console.log("Email notification:", {
        to: options.to,
        subject: options.subject,
        // Don't log HTML in production
      });

      // For now, return true to simulate success
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  /**
   * Notify user when distribution is declared
   */
  static async notifyDistributionDeclared(
    userEmail: string,
    userName: string | null,
    propertyName: string,
    payoutAmount: number,
    period: string
  ): Promise<boolean> {
    const name = userName || "Investor";
    const subject = `Distribution Declared: ${propertyName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Distribution Declared</h2>
        <p>Hello ${name},</p>
        <p>A new distribution has been declared for your investment in <strong>${propertyName}</strong>.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Period:</strong> ${period}</p>
          <p><strong>Your Payout:</strong> ₦${payoutAmount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</p>
        </div>
        <p>You can view your payout details in your investor dashboard.</p>
        <p>Best regards,<br />Invent Wealth Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  /**
   * Notify user when payout is marked as paid
   */
  static async notifyPayoutPaid(
    userEmail: string,
    userName: string | null,
    propertyName: string,
    payoutAmount: number,
    paymentMethod: string | null,
    paymentReference: string | null
  ): Promise<boolean> {
    const name = userName || "Investor";
    const subject = `Payout Processed: ${propertyName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payout Processed</h2>
        <p>Hello ${name},</p>
        <p>Your payout for <strong>${propertyName}</strong> has been processed.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Amount:</strong> ₦${payoutAmount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</p>
          ${paymentMethod ? `<p><strong>Payment Method:</strong> ${paymentMethod}</p>` : ""}
          ${paymentReference ? `<p><strong>Reference:</strong> ${paymentReference}</p>` : ""}
        </div>
        <p>You can view your transaction history in your investor dashboard.</p>
        <p>Best regards,<br />Invent Wealth Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  /**
   * Notify admin when distribution needs approval
   */
  static async notifyDistributionPendingApproval(
    adminEmail: string,
    propertyName: string,
    distributionId: string,
    totalAmount: number
  ): Promise<boolean> {
    const subject = `Distribution Pending Approval: ${propertyName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Distribution Pending Approval</h2>
        <p>A new distribution for <strong>${propertyName}</strong> is pending your approval.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Total Amount:</strong> ₦${totalAmount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</p>
        </div>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/distributions/${distributionId}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Review Distribution</a></p>
        <p>Best regards,<br />Invent Wealth System</p>
      </div>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject,
      html,
    });
  }
}

