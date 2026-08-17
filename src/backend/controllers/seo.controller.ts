import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

import { prisma } from "../config/db";

export const getGlobalSeo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.globalSeoSettings.findFirst();
    res.json(settings || {});
  } catch (error) {
    next(error);
  }
};

export const updateGlobalSeo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.globalSeoSettings.findFirst();
    let updated;
    if (existing) {
      updated = await prisma.globalSeoSettings.update({ where: { id: existing.id }, data: req.body });
    } else {
      updated = await prisma.globalSeoSettings.create({ data: req.body });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
};
