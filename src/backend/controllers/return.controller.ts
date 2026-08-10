import { Response, NextFunction } from "express";
import { AdminReturnService } from "../services/return.service";

export const getReturns = async (req: any, res: Response, next: NextFunction) => {
  try {
    const returns = await AdminReturnService.getReturns();
    res.status(200).json({ status: "success", data: { returns } });
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
