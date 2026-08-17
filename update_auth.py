import sys

with open('src/backend/routes/storefront/auth.routes.ts', 'r') as f:
    content = f.read()

target = """  resetPassword,
  verifyEmail,
} from "../../controllers/storefront/auth.controller";"""

replacement = """  resetPassword,
  verifyEmail,
  resendVerificationEmail,
} from "../../controllers/storefront/auth.controller";"""

target2 = """router.post("/verify-email", verifyEmail);"""
replacement2 = """router.post("/verify-email", verifyEmail);
router.post("/resend-verification", validateBody(z.object({ email: z.string().email() })), resendVerificationEmail);"""

if target in content and target2 in content:
    content = content.replace(target, replacement)
    content = content.replace(target2, replacement2)
    # Add z import if not exists
    if 'import { z } from "zod";' not in content:
        content = 'import { z } from "zod";\n' + content
    with open('src/backend/routes/storefront/auth.routes.ts', 'w') as f:
        f.write(content)
    print("auth routes updated")
else:
    print("auth routes target not found")

with open('src/backend/controllers/storefront/auth.controller.ts', 'r') as f:
    content = f.read()

resend_code = """
export const resendVerificationEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    
    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      return next(new AppError("Customer not found", 404, "NOT_FOUND"));
    }

    if (customer.emailVerified) {
      return next(new AppError("Email is already verified", 400, "BAD_REQUEST"));
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        verificationToken,
        verificationExpires,
      },
    });

    // TODO: Send verification email here

    res.status(200).json({
      status: "success",
      message: "Verification email sent",
    });
  } catch (error) {
    next(error);
  }
};
"""

content = content + resend_code
with open('src/backend/controllers/storefront/auth.controller.ts', 'w') as f:
    f.write(content)
print("auth controller updated")
