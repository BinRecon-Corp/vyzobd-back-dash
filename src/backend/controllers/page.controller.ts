import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.page.findMany();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await prisma.page.findUnique({ where: { id } });
    if (!item) throw new AppError('page not found', 404, "NOT_FOUND");
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newItem = await prisma.page.create({ data: req.body });
    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updated = await prisma.page.update({ where: { id }, data: req.body });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.page.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
