import { prisma } from "@/server/db/prisma";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

export class PasswordResetService {
  /**
   * Generate password reset token and send email
   */
  static async sendPasswordResetEmail(userId: string, adminTriggered: boolean = false) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || !user.email) {
      throw new Error("User not found or email not set");
    }

    // Generate secure token
    const token = randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hour expiry

    // Store token in VerificationToken (reuse NextAuth's model)
    await prisma.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: user.email,
          token: token,
        },
      },
      update: {
        token: token,
        expires: expires,
      },
      create: {
        identifier: user.email,
        token: token,
        expires: expires,
      },
    });

    // Send email using SMTP
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    
    await this.sendResetEmail(user.email, user.name || "User", resetUrl, adminTriggered);

    return { success: true, token };
  }

  /**
   * Send password reset email using nodemailer
   */
  private static async sendResetEmail(
    email: string,
    name: string,
    resetUrl: string,
    adminTriggered: boolean
  ) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const subject = adminTriggered 
      ? "Set Up Your Password - Invent Wealth"
      : "Reset Your Password - Invent Wealth";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${adminTriggered ? "Set Up Your Password" : "Reset Your Password"}</h2>
        <p>Hello ${name},</p>
        <p>${adminTriggered 
          ? "An administrator has requested that you set up a password for your account."
          : "You requested to reset your password."
        }</p>
        <p>Click the button below to ${adminTriggered ? "set up" : "reset"} your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            ${adminTriggered ? "Set Up Password" : "Reset Password"}
          </a>
        </div>
        <p style="color: #666; font-size: 12px;">
          This link will expire in 24 hours. If you didn't request this, please ignore this email.
        </p>
        <p>Best regards,<br />Invent Wealth Team</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@inventwealth.com",
      to: email,
      subject,
      html,
    });
  }

  /**
   * Verify reset token
   */
  static async verifyResetToken(token: string, email: string) {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token: token,
        },
      },
    });

    if (!verificationToken) {
      return { valid: false, error: "Invalid token" };
    }

    if (verificationToken.expires < new Date()) {
      return { valid: false, error: "Token expired" };
    }

    return { valid: true };
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, email: string, newPassword: string) {
    // Verify token
    const verification = await this.verifyResetToken(token, email);
    if (!verification.valid) {
      throw new Error(verification.error);
    }

    // Hash password (use bcrypt)
    const bcrypt = require("bcryptjs");
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    // Delete used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: token,
        },
      },
    });

    return { success: true };
  }
}

