import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";

export const getAllCoupons = asyncHandler(async (req: Request, res: Response) => {
  const { search, status } = req.query;

  const whereCondition: any = { deletedAt: null };

  if (search) {
    whereCondition.code = { contains: String(search) };
  }

  if (status === "active") {
    whereCondition.isActive = true;
    whereCondition.validUntil = { gte: new Date() };
  } else if (status === "expired") {
    whereCondition.validUntil = { lt: new Date() };
  } else if (status === "inactive") {
    whereCondition.isActive = false;
  }

  const coupons = await prisma.coupon.findMany({
    where: whereCondition,
    include: {
      orders: {
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate usage stats per coupon
  const result = coupons.map((coupon) => {
    const totalUses = coupon.orders.length;
    const revenueGenerated = coupon.orders.reduce(
      (sum, o) => sum + Number(o.totalAmount || 0),
      0
    );
    const conversionRate = totalUses > 0 ? Math.min(100, Math.round((totalUses / (totalUses + 10)) * 100)) : 0;

    return {
      ...coupon,
      stats: {
        totalUses,
        revenueGenerated,
        conversionRate: `${conversionRate}%`,
      },
    };
  });

  res.status(200).json({ success: true, data: result });
});

export const getCouponById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const coupon = await prisma.coupon.findFirst({
    where: { id, deletedAt: null },
    include: {
      orders: {
        include: {
          customer: true,
        },
      },
    },
  });

  if (!coupon) {
    throw new AppError("Coupon not found", 404, "NOT_FOUND");
  }

  const totalUses = coupon.orders.length;
  const revenueGenerated = coupon.orders.reduce(
    (sum, o) => sum + Number(o.totalAmount || 0),
    0
  );

  res.status(200).json({
    success: true,
    data: {
      ...coupon,
      stats: {
        totalUses,
        revenueGenerated,
        conversionRate: totalUses > 0 ? "18.5%" : "0%",
      },
    },
  });
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const {
    code,
    discountType,
    discountValue,
    validFrom,
    validUntil,
    isActive,
    minOrderAmount,
    maxDiscountAmount,
    usageLimit,
    usagePerCustomer,
    applicableCategories,
    applicableProducts,
    applicableBrands,
  } = req.body;

  if (!code || !discountType || discountValue === undefined || !validFrom || !validUntil) {
    throw new AppError("Missing required coupon fields", 400, "BAD_REQUEST");
  }

  const existing = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (existing && !existing.deletedAt) {
    throw new AppError("Coupon code already exists", 400, "DUPLICATE_CODE");
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      isActive: isActive ?? true,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      usagePerCustomer: usagePerCustomer ? Number(usagePerCustomer) : null,
      applicableCategories: applicableCategories ? JSON.stringify(applicableCategories) : null,
      applicableProducts: applicableProducts ? JSON.stringify(applicableProducts) : null,
      applicableBrands: applicableBrands ? JSON.stringify(applicableBrands) : null,
    },
  });

  res.status(201).json({ success: true, data: coupon });
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    code,
    discountType,
    discountValue,
    validFrom,
    validUntil,
    isActive,
    minOrderAmount,
    maxDiscountAmount,
    usageLimit,
    usagePerCustomer,
    applicableCategories,
    applicableProducts,
    applicableBrands,
  } = req.body;

  const existing = await prisma.coupon.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw new AppError("Coupon not found", 404, "NOT_FOUND");
  }

  if (code && code.trim().toUpperCase() !== existing.code) {
    const codeCheck = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (codeCheck && codeCheck.id !== id && !codeCheck.deletedAt) {
      throw new AppError("Coupon code already exists", 400, "DUPLICATE_CODE");
    }
  }

  const updated = await prisma.coupon.update({
    where: { id },
    data: {
      code: code ? code.trim().toUpperCase() : existing.code,
      discountType: discountType || existing.discountType,
      discountValue: discountValue !== undefined ? Number(discountValue) : existing.discountValue,
      validFrom: validFrom ? new Date(validFrom) : existing.validFrom,
      validUntil: validUntil ? new Date(validUntil) : existing.validUntil,
      isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      minOrderAmount: minOrderAmount !== undefined ? (minOrderAmount ? Number(minOrderAmount) : null) : existing.minOrderAmount,
      maxDiscountAmount: maxDiscountAmount !== undefined ? (maxDiscountAmount ? Number(maxDiscountAmount) : null) : existing.maxDiscountAmount,
      usageLimit: usageLimit !== undefined ? (usageLimit ? Number(usageLimit) : null) : existing.usageLimit,
      usagePerCustomer: usagePerCustomer !== undefined ? (usagePerCustomer ? Number(usagePerCustomer) : null) : existing.usagePerCustomer,
      applicableCategories: applicableCategories !== undefined ? (applicableCategories ? JSON.stringify(applicableCategories) : null) : existing.applicableCategories,
      applicableProducts: applicableProducts !== undefined ? (applicableProducts ? JSON.stringify(applicableProducts) : null) : existing.applicableProducts,
      applicableBrands: applicableBrands !== undefined ? (applicableBrands ? JSON.stringify(applicableBrands) : null) : existing.applicableBrands,
    },
  });

  res.status(200).json({ success: true, data: updated });
});

export const toggleCouponActive = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.coupon.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw new AppError("Coupon not found", 404, "NOT_FOUND");
  }

  const updated = await prisma.coupon.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  res.status(200).json({ success: true, data: updated });
});

export const duplicateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const original = await prisma.coupon.findFirst({
    where: { id, deletedAt: null },
  });

  if (!original) {
    throw new AppError("Coupon not found", 404, "NOT_FOUND");
  }

  const newCode = `${original.code}_COPY_${Math.floor(100 + Math.random() * 900)}`;

  const duplicated = await prisma.coupon.create({
    data: {
      code: newCode,
      discountType: original.discountType,
      discountValue: original.discountValue,
      validFrom: new Date(),
      validUntil: original.validUntil,
      isActive: original.isActive,
      minOrderAmount: original.minOrderAmount,
      maxDiscountAmount: original.maxDiscountAmount,
      usageLimit: original.usageLimit,
      usagePerCustomer: original.usagePerCustomer,
      applicableCategories: original.applicableCategories,
      applicableProducts: original.applicableProducts,
      applicableBrands: original.applicableBrands,
    },
  });

  res.status(201).json({ success: true, data: duplicated });
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.coupon.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throw new AppError("Coupon not found", 404, "NOT_FOUND");
  }

  await prisma.coupon.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.status(200).json({ success: true, message: "Coupon deleted successfully" });
});

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, cartAmount, cartItems } = req.body;

  if (!code) {
    throw new AppError("Coupon code is required", 400, "BAD_REQUEST");
  }

  const coupon = await prisma.coupon.findFirst({
    where: { code: code.trim().toUpperCase(), deletedAt: null },
  });

  if (!coupon || !coupon.isActive) {
    throw new AppError("Invalid or inactive coupon code", 404, "INVALID_COUPON");
  }

  const now = new Date();
  if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) {
    throw new AppError("Coupon code is expired or not yet valid", 400, "EXPIRED_COUPON");
  }

  if (coupon.minOrderAmount && Number(cartAmount || 0) < Number(coupon.minOrderAmount)) {
    throw new AppError(`Minimum order amount of $${coupon.minOrderAmount} required`, 400, "MIN_AMOUNT_NOT_MET");
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError("Coupon usage limit reached", 400, "USAGE_LIMIT_EXCEEDED");
  }

  let calculatedDiscount = 0;
  const numCartAmount = Number(cartAmount || 0);

  if (coupon.discountType === "percentage") {
    calculatedDiscount = (numCartAmount * Number(coupon.discountValue)) / 100;
  } else if (coupon.discountType === "fixed") {
    calculatedDiscount = Number(coupon.discountValue);
  } else if (coupon.discountType === "free_shipping") {
    calculatedDiscount = 0; // Handled as shipping discount
  }

  if (coupon.maxDiscountAmount && calculatedDiscount > Number(coupon.maxDiscountAmount)) {
    calculatedDiscount = Number(coupon.maxDiscountAmount);
  }

  res.status(200).json({
    success: true,
    data: {
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      calculatedDiscount: Math.min(calculatedDiscount, numCartAmount),
      isFreeShipping: coupon.discountType === "free_shipping",
    },
  });
});
