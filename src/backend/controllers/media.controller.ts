import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.mediaAsset.findMany();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!item) throw new AppError('mediaAsset not found', 404, "NOT_FOUND");
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newItem = await prisma.mediaAsset.create({ data: req.body });
    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updated = await prisma.mediaAsset.update({ where: { id }, data: req.body });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.mediaAsset.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
