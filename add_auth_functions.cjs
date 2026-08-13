const fs = require('fs');

let content = fs.readFileSync('src/backend/controllers/customer-auth.controller.ts', 'utf8');

const additionalCode = `
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const customer = await prisma.customer.findUnique({ where: { email } });

    if (!customer) {
      return res.status(200).json({ status: "success", message: "If an account with that email exists, we sent a password reset link." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.customer.update({
      where: { email },
      data: { resetPasswordToken, resetPasswordExpires },
    });

    // In a real app, send an email here with resetToken.
    // We'll return it for testing purposes only if in development, else just success msg.
    if (env.NODE_ENV === "development") {
       return res.status(200).json({ status: "success", message: "Reset token generated (DEV ONLY)", data: { resetToken } });
    }

    res.status(200).json({ status: "success", message: "If an account with that email exists, we sent a password reset link." });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;
    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

    const customer = await prisma.customer.findFirst({
      where: {
        resetPasswordToken,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!customer) {
      return next(new AppError("Token is invalid or has expired", 400, "BAD_REQUEST"));
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    // Revoke all existing sessions for security
    await prisma.customerRefreshToken.updateMany({
      where: { customerId: customer.id, revokedAt: null },
      data: { revokedAt: new Date() }
    });

    await prisma.customerSession.deleteMany({
      where: { customerId: customer.id }
    });

    res.status(200).json({ status: "success", message: "Password reset successful. Please log in." });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    const verificationToken = crypto.createHash("sha256").update(token).digest("hex");

    const customer = await prisma.customer.findFirst({
      where: {
        verificationToken,
        verificationExpires: { gt: new Date() },
      },
    });

    if (!customer) {
      return next(new AppError("Token is invalid or has expired", 400, "BAD_REQUEST"));
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null,
      },
    });

    res.status(200).json({ status: "success", message: "Email verified successfully" });
  } catch (error) {
    next(error);
  }
};
`;

content += '\n' + additionalCode;
fs.writeFileSync('src/backend/controllers/customer-auth.controller.ts', content);
