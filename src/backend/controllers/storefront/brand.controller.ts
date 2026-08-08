import { Request, Response } from "express";
import { storefrontBrandService } from "../../services/storefront/brand.service";
import { ga4Service } from "../../services/storefront/ga4.service";

const asyncHandler = (fn: any) => (req: Request, res: Response, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const getBrands = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query;
  
  const options = {
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 50,
  };

  const result = await storefrontBrandService.getBrands(options);
  const ga4 = ga4Service.getBrandListPayload(result.data);

  res.json({
    success: true,
    data: result.data,
    meta: result.meta,
    ga4
  });
});


export const getBrandBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const data = await storefrontBrandService.getBrandBySlug(slug);

  if (!data) {
    return res.status(404).json({ success: false, message: "Brand not found" });
  }

  res.json({
    success: true,
    data,
    meta: {}
  });
});
