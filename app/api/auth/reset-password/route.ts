import { NextRequest, NextResponse } from "next/server";
import { PasswordResetService } from "@/server/services/password-reset.service";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email, password } = resetPasswordSchema.parse(body);

    await PasswordResetService.resetPassword(token, email, password);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to reset password",
      },
      { status: 400 }
    );
  }
}

