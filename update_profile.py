import sys

with open('src/backend/validators/account.validator.ts', 'r') as f:
    content = f.read()

target = """export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
});"""

replacement = """export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/backend/validators/account.validator.ts', 'w') as f:
        f.write(content)
    print("validator updated")
else:
    print("validator target not found")

with open('src/backend/controllers/storefront/account.controller.ts', 'r') as f:
    content = f.read()

target2 = """export const updateMyProfile = async (req: CustomerAuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const customer = await prisma.customer.update({
      where: { id: req.customer!.id },
      data: { firstName, lastName, phone },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,"""

replacement2 = """export const updateMyProfile = async (req: CustomerAuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, phone, avatarUrl } = req.body;

    const customer = await prisma.customer.update({
      where: { id: req.customer!.id },
      data: { firstName, lastName, phone, avatarUrl },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,"""

if target2 in content:
    content = content.replace(target2, replacement2)
    with open('src/backend/controllers/storefront/account.controller.ts', 'w') as f:
        f.write(content)
    print("controller updated")
else:
    print("controller target not found")
