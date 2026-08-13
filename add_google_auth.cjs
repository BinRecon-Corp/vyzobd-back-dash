const fs = require('fs');

let content = fs.readFileSync('src/backend/controllers/customer-auth.controller.ts', 'utf8');

// Add OAuth2Client import
content = content.replace(
  'import crypto from "crypto";',
  'import crypto from "crypto";\nimport { OAuth2Client } from "google-auth-library";'
);

const googleAuthCode = `
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return next(new AppError("ID Token is required", 400, "BAD_REQUEST"));
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return next(new AppError("Invalid Google token", 401, "UNAUTHORIZED"));
    }

    const { sub, email, given_name, family_name, picture, email_verified } = payload;
    
    if (!email) {
      return next(new AppError("Email is required from Google provider", 400, "BAD_REQUEST"));
    }

    let customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (customer) {
      // Update existing customer
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          provider: "GOOGLE",
          providerId: sub,
          avatarUrl: picture || customer.avatarUrl,
          emailVerified: email_verified || customer.emailVerified,
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Create new customer
      customer = await prisma.customer.create({
        data: {
          email,
          firstName: given_name || "Google User",
          lastName: family_name,
          provider: "GOOGLE",
          providerId: sub,
          avatarUrl: picture,
          emailVerified: email_verified || false,
          lastLoginAt: new Date(),
        },
      });
    }

    if (!customer.isActive || customer.deletedAt) {
      return next(new AppError("Account is inactive", 401, "UNAUTHORIZED"));
    }

    const accessToken = generateCustomerAccessToken(customer.id, customer.email);
    const refreshToken = generateCustomerRefreshToken(customer.id, customer.email);
    
    // Hash refresh token for DB storage
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const expiresInDays = parseInt(env.JWT_REFRESH_EXPIRES_IN) || 7;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    const ip = (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress || "Unknown";
    const userAgent = req.headers["user-agent"] || "Unknown";

    await prisma.$transaction([
      prisma.customerRefreshToken.create({
        data: {
          customerId: customer.id,
          tokenHash,
          expiresAt,
          ipAddress: ip,
          userAgent,
        }
      }),
      prisma.customerSession.create({
        data: {
          customerId: customer.id,
          token: tokenHash,
          expiresAt,
          ipAddress: ip,
          userAgent,
        }
      })
    ]);

    res.status(200).json({
      status: "success",
      data: {
        customer: {
          id: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          emailVerified: customer.emailVerified,
          avatarUrl: customer.avatarUrl,
        },
        accessToken,
        refreshToken,
      },
    });

  } catch (error: any) {
    console.error("Google Auth Error:", error);
    next(new AppError("Authentication failed: " + (error.message || "Unknown error"), 401, "UNAUTHORIZED"));
  }
};
`;

content += '\n' + googleAuthCode;
fs.writeFileSync('src/backend/controllers/customer-auth.controller.ts', content);
