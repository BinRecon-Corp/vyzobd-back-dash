const fs = require('fs');
let content = fs.readFileSync('src/backend/controllers/customer-profile.controller.ts', 'utf8');

const prefCode = `
export const getPreferences = async (req: CustomerAuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customer!.id;
    let preferences = await prisma.notificationPreference.findUnique({
      where: { customerId }
    });

    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: { customerId }
      });
    }

    res.status(200).json({ status: "success", data: { preferences } });
  } catch(error) {
    next(error);
  }
};

export const updatePreferences = async (req: CustomerAuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customer!.id;
    const { email, sms, inApp } = req.body;

    const preferences = await prisma.notificationPreference.upsert({
      where: { customerId },
      update: {
        ...(email !== undefined && { email }),
        ...(sms !== undefined && { sms }),
        ...(inApp !== undefined && { inApp }),
      },
      create: {
        customerId,
        email: email ?? true,
        sms: sms ?? false,
        inApp: inApp ?? true,
      }
    });

    res.status(200).json({ status: "success", message: "Preferences updated", data: { preferences } });
  } catch(error) {
    next(error);
  }
};
`;

content += '\n' + prefCode;
fs.writeFileSync('src/backend/controllers/customer-profile.controller.ts', content);
