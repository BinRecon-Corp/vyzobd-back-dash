import { Request, Response } from "express";
import { storefrontCategoryService } from "../../services/storefront/category.service";
import { ga4Service } from "../../services/storefront/ga4.service";

const asyncHandler = (fn: any) => (req: Request, res: Response, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const tree = req.query.tree !== "false";
  
  const data = await storefrontCategoryService.getCategories(tree);
  const ga4 = ga4Service.getCategoryListPayload(data);

  res.json({
    success: true,
    data,
    meta: {},
    ga4
  });
});


export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const data = await storefrontCategoryService.getCategoryBySlug(slug);

  if (!data) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }

  res.json({
    success: true,
    data,
    meta: {}
  });
});
