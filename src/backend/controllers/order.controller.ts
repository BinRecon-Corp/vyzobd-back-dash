import { Response, NextFunction } from "express";
import { prisma } from "../config/db";
import { AuthRequest } from "../middlewares/auth";
import { AppError } from "../utils/AppError";
import { AuditService } from "../services/audit.service";
import { MeasurementProtocolService } from "../services/measurement-protocol.service";

// GET /api/v1/orders
export const getOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      paymentStatus = "",
      startDate = "",
      endDate = "",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string } },
        { customer: { firstName: { contains: search as string } } },
        { customer: { lastName: { contains: search as string } } },
        { customer: { email: { contains: search as string } } },
      ];
    }

    if (status) {
      where.status = status as string;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus as string;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
          assignedStaff: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        orders,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/orders/:id
export const getOrderById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: true,
        assignedStaff: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
        timeline: {
          orderBy: { createdAt: "asc" },
        },
        orderNotes: {
          orderBy: { createdAt: "desc" },
        },
        coupon: true,
      },
    });

    if (!order) {
      return next(new AppError("Order not found", 404, "NOT_FOUND"));
    }

    res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/orders/:id/status
export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, internalNotes } = req.body;

    const existingOrder = await prisma.order.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingOrder) {
      return next(new AppError("Order not found", 404, "NOT_FOUND"));
    }

    const updateData: any = {};
    const timelineEntries: any[] = [];
    const actorName = req.user?.email || "Admin";

    if (status && status !== existingOrder.status) {
      updateData.status = status;
      timelineEntries.push({
        status,
        action: `Order status changed from ${existingOrder.status} to ${status}`,
        userId: req.user?.id || null,
        userName: actorName,
      });
    }

    if (paymentStatus && paymentStatus !== existingOrder.paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      timelineEntries.push({
        status: status || existingOrder.status,
        action: `Payment status updated to ${paymentStatus}`,
        userId: req.user?.id || null,
        userName: actorName,
      });
    }

    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes;
    }

    if (status === "Cancelled" && existingOrder.status !== "Cancelled") {
      // Restore inventory
      const orderItems = await prisma.orderItem.findMany({ where: { orderId: id } });
      for (const item of orderItems) {
        if (item.productVariantId) {
          const inv = await prisma.inventory.findFirst({ where: { variantId: item.productVariantId } });
          if (inv) await prisma.inventory.update({ where: { id: inv.id }, data: { quantityAvailable: { increment: item.quantity } } });
        } else {
          const inv = await prisma.inventory.findFirst({ where: { productId: item.productId } });
          if (inv) await prisma.inventory.update({ where: { id: inv.id }, data: { quantityAvailable: { increment: item.quantity } } });
        }
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        ...updateData,
        timeline: {
          create: timelineEntries,
        },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
        timeline: { orderBy: { createdAt: "asc" } },
        orderNotes: { orderBy: { createdAt: "desc" } },
      },
    });

    await AuditService.createLog(
      req.user?.id || null,
      "UPDATE_ORDER_STATUS",
      "Order",
      id,
      null,
      { oldStatus: existingOrder.status, newStatus: status, paymentStatus },
      req
    );

    if (
      existingOrder.paymentStatus?.toUpperCase() !== "PAID" &&
      updatedOrder.paymentStatus?.toUpperCase() === "PAID"
    ) {
      MeasurementProtocolService.processOrderPaymentSuccess(id).catch((err) => {
        console.error("[Analytics] Error tracking purchase on admin order update:", err);
      });
    }

    const updatedStatusUpper = updatedOrder.status?.toUpperCase() || "";
    const isConfirmedOrProcessing = updatedStatusUpper === "CONFIRMED" || updatedStatusUpper === "PROCESSING";
    const methodUpper = (updatedOrder.paymentMethod || "").toUpperCase();
    const isCod = methodUpper.includes("COD") || methodUpper.includes("CASH");

    if (isCod && isConfirmedOrProcessing) {
      MeasurementProtocolService.processCodOrderConfirmation(id).catch((err) => {
        console.error("[Analytics] Error tracking COD purchase on admin order update:", err);
      });
    }

    res.status(200).json({
      status: "success",
      message: "Order status updated successfully",
      data: { order: updatedOrder },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/orders/:id/assign
export const assignOrderStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { assignedStaffId } = req.body;

    const existingOrder = await prisma.order.findFirst({ where: { id, deletedAt: null } });
    if (!existingOrder) {
      return next(new AppError("Order not found", 404, "NOT_FOUND"));
    }

    let staffName = "Unassigned";
    if (assignedStaffId) {
      const staff = await prisma.user.findFirst({ where: { id: assignedStaffId } });
      if (staff) {
        staffName = `${staff.firstName} ${staff.lastName || ""}`.trim();
      }
    }

    const actorName = req.user?.email || "Admin";

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        assignedStaffId: assignedStaffId || null,
        timeline: {
          create: {
            status: existingOrder.status,
            action: assignedStaffId ? `Order assigned to ${staffName}` : "Staff unassigned from order",
            userId: req.user?.id || null,
            userName: actorName,
          },
        },
      },
      include: {
        assignedStaff: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    res.status(200).json({
      status: "success",
      message: "Order staff updated successfully",
      data: { order: updatedOrder },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/orders/:id/notes
export const addOrderNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return next(new AppError("Note text is required", 400, "VALIDATION_ERROR"));
    }

    const order = await prisma.order.findFirst({ where: { id, deletedAt: null } });
    if (!order) {
      return next(new AppError("Order not found", 404, "NOT_FOUND"));
    }

    const actorName = req.user?.email || "Admin";

    const newNote = await prisma.orderNote.create({
      data: {
        orderId: id,
        note: note.trim(),
        author: actorName,
      },
    });

    await prisma.orderTimeline.create({
      data: {
        orderId: id,
        status: order.status,
        action: `Internal note added by ${actorName}: "${note.trim()}"`,
        userId: req.user?.id || null,
        userName: actorName,
      },
    });

    res.status(201).json({
      status: "success",
      message: "Order note added successfully",
      data: { note: newNote },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/orders/:id
export const deleteOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({ where: { id, deletedAt: null } });
    if (!order) {
      return next(new AppError("Order not found", 404, "NOT_FOUND"));
    }

    await prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await AuditService.createLog(
      req.user?.id || null,
      "DELETE_ORDER",
      "Order",
      id,
      null,
      { orderNumber: order.orderNumber },
      req
    );

    res.status(200).json({
      status: "success",
      message: "Order deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
