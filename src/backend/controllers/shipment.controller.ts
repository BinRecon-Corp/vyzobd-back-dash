import { Response, NextFunction } from "express";
import { AdminShipmentService } from "../services/shipment.service";

export const createShipment = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { orderId, courierId, trackingNumber, items } = req.body;
    const shipment = await AdminShipmentService.createShipment(orderId, courierId, trackingNumber, items);
    res.status(201).json({ status: "success", data: { shipment } });
  } catch (error) {
    next(error);
  }
};

export const getShipments = async (req: any, res: Response, next: NextFunction) => {
  try {
    const shipments = await AdminShipmentService.getShipments();
    res.status(200).json({ status: "success", data: { shipments } });
  } catch (error) {
    next(error);
  }
};

export const getShipmentById = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const shipment = await AdminShipmentService.getShipmentById(id);
    res.status(200).json({ status: "success", data: { shipment } });
  } catch (error) {
    next(error);
  }
};

export const updateShipmentStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, location, description } = req.body;
    const shipment = await AdminShipmentService.updateShipmentStatus(id, status, location, description);
    res.status(200).json({ status: "success", data: { shipment } });
  } catch (error) {
    next(error);
  }
};
