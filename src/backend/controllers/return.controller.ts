import { Response, NextFunction } from "express";
import { AdminReturnService } from "../services/return.service";

export const getReturns = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, status } = req.query;
    const result = await AdminReturnService.getReturns({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      status: status as string
    });
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const getReturnById = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const returnReq = await AdminReturnService.getReturnById(id);
    res.status(200).json({ status: "success", data: { returnRequest: returnReq } });
  } catch (error) {
    next(error);
  }
};

export const updateReturnStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    let returnReq;
    if (status === "APPROVED") {
      returnReq = await AdminReturnService.approveReturn(id, adminNotes);
    } else if (status === "REJECTED") {
      returnReq = await AdminReturnService.rejectReturn(id, adminNotes);
    } else if (status === "RECEIVED") {
      returnReq = await AdminReturnService.receiveReturn(id, adminNotes);
    } else {
      returnReq = await AdminReturnService.getReturnById(id);
    }

    res.status(200).json({ status: "success", data: { returnRequest: returnReq } });
  } catch (error) {
    next(error);
  }
};

export const approveReturn = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const returnReq = await AdminReturnService.approveReturn(id, adminNotes);
    res.status(200).json({ status: "success", data: { returnRequest: returnReq } });
  } catch (error) {
    next(error);
  }
};

export const rejectReturn = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const returnReq = await AdminReturnService.rejectReturn(id, adminNotes);
    res.status(200).json({ status: "success", data: { returnRequest: returnReq } });
  } catch (error) {
    next(error);
  }
};

export const receiveReturn = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const returnReq = await AdminReturnService.receiveReturn(id, adminNotes);
    res.status(200).json({ status: "success", data: { returnRequest: returnReq } });
  } catch (error) {
    next(error);
  }
};
