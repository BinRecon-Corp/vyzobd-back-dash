const fs = require('fs');

let content = fs.readFileSync('src/backend/controllers/customer-auth.controller.ts', 'utf8');

const facebookAuthCode = `
export const facebookAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accessToken: fbAccessToken } = req.body;
    if (!fbAccessToken) {
      return next(new AppError("Facebook access token is required", 400, "BAD_REQUEST"));
    }

    // Verify token with Facebook Graph API
    const response = await fetch(\`https://graph.facebook.com/me?fields=id,first_name,last_name,email,picture.type(large)&access_token=\${fbAccessToken}\`);
    const data = await response.json();

    if (!response.ok || data.error) {
      return next(new AppError("Invalid Facebook token", 401, "UNAUTHORIZED"));
    }

    const { id: fbId, email, first_name, last_name, picture } = data;

    if (!email) {
      return next(new AppError("Email is required from Facebook provider. Please ensure you have granted email permissions.", 400, "BAD_REQUEST"));
    }

    let customer = await prisma.customer.findUnique({
      where: { email },
    });

    const avatarUrl = picture?.data?.url;

    if (customer) {
      // Update existing customer
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          provider: "FACEBOOK",
          providerId: fbId,
          avatarUrl: avatarUrl || customer.avatarUrl,
          emailVerified: true, // Assuming FB emails are verified
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Create new customer
      customer = await prisma.customer.create({
        data: {
          email,
          firstName: first_name || "Facebook User",
          lastName: last_name,
          provider: "FACEBOOK",
          providerId: fbId,
          avatarUrl: avatarUrl,
          emailVerified: true,
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
    console.error("Facebook Auth Error:", error);
    next(new AppError("Authentication failed: " + (error.message || "Unknown error"), 401, "UNAUTHORIZED"));
  }
};
`;

content += '\n' + facebookAuthCode;
fs.writeFileSync('src/backend/controllers/customer-auth.controller.ts', content);
