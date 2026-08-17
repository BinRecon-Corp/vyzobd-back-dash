import sys

with open('src/backend/routes/storefront/account.routes.ts', 'r') as f:
    content = f.read()

target = """  revokeAllOtherSessions,
} from "../../controllers/storefront/account.controller";"""

replacement = """  revokeAllOtherSessions,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../../controllers/storefront/account.controller";"""

target2 = """router.delete("/sessions", revokeAllOtherSessions);"""
replacement2 = """router.delete("/sessions", revokeAllOtherSessions);

router.get("/notification-preferences", getNotificationPreferences);
router.put("/notification-preferences", validateBody(updateNotificationPrefSchema), updateNotificationPreferences);
"""

if target in content and target2 in content:
    content = content.replace(target, replacement)
    content = content.replace(target2, replacement2)
    with open('src/backend/routes/storefront/account.routes.ts', 'w') as f:
        f.write(content)
    print("account routes updated")
else:
    print("account routes target not found")

with open('src/backend/validators/account.validator.ts', 'a') as f:
    f.write("""
export const updateNotificationPrefSchema = z.object({
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  inApp: z.boolean().optional(),
});
""")

with open('src/backend/routes/storefront/account.routes.ts', 'r') as f:
    content = f.read()
content = content.replace('updateAddressSchema,\n} from "../../validators/account.validator";', 'updateAddressSchema,\n  updateNotificationPrefSchema,\n} from "../../validators/account.validator";')
with open('src/backend/routes/storefront/account.routes.ts', 'w') as f:
    f.write(content)

with open('src/backend/controllers/storefront/account.controller.ts', 'a') as f:
    f.write("""
export const getNotificationPreferences = async (req: CustomerAuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customer!.id;
    let prefs = await prisma.notificationPreference.findUnique({
      where: { customerId }
    });
    
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { customerId }
      });
    }

    res.status(200).json({
      status: "success",
      data: { preferences: prefs },
    });
  } catch (error) {
    next(error);
  }
};

export const updateNotificationPreferences = async (req: CustomerAuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customer!.id;
    const { email, sms, inApp } = req.body;
    
    const prefs = await prisma.notificationPreference.upsert({
      where: { customerId },
      update: { email, sms, inApp },
      create: { customerId, email: email ?? true, sms: sms ?? false, inApp: inApp ?? true },
    });

    res.status(200).json({
      status: "success",
      data: { preferences: prefs },
    });
  } catch (error) {
    next(error);
  }
};
""")
