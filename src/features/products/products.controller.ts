import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../../types";
import { errorResponse, successResponse } from "../../utils/response";
import { ProductsService } from "./products.service";
import {
  createCategorySchema,
  createProductSchema,
  updateCategorySchema,
  updateProductSchema,
} from "./products.validation";

export class ProductsController {
  private productsService: ProductsService;

  constructor() {
    this.productsService = new ProductsService();
  }

  // Category Methods

  getAllCategories = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const categories = await this.productsService.getAllCategories(
        req.tenant.tenantId,
      );
      return successResponse(res, categories);
    } catch (error: any) {
      next(error);
    }
  };

  getCategoryById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const { id } = req.params;
      const category = await this.productsService.getCategoryById(
        req.tenant.tenantId,
        id,
      );
      return successResponse(res, category);
    } catch (error: any) {
      next(error);
    }
  };

  createCategory = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const dto = createCategorySchema.parse(req.body);
      const category = await this.productsService.createCategory(
        req.tenant.tenantId,
        dto,
      );
      return successResponse(res, category, 201);
    } catch (error: any) {
      next(error);
    }
  };

  updateCategory = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const { id } = req.params;
      const dto = updateCategorySchema.parse(req.body);
      const category = await this.productsService.updateCategory(
        req.tenant.tenantId,
        id,
        dto,
      );
      return successResponse(res, category);
    } catch (error: any) {
      next(error);
    }
  };

  deleteCategory = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const { id } = req.params;
      const result = await this.productsService.deleteCategory(
        req.tenant.tenantId,
        id,
      );
      return successResponse(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  // Product Methods

  getAllProducts = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const products = await this.productsService.getAllProducts(
        req.tenant.tenantId,
      );
      return successResponse(res, products);
    } catch (error: any) {
      next(error);
    }
  };

  getProductById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const { id } = req.params;
      const product = await this.productsService.getProductById(
        req.tenant.tenantId,
        id,
      );
      return successResponse(res, product);
    } catch (error: any) {
      next(error);
    }
  };

  createProduct = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const dto = createProductSchema.parse(req.body);
      const product = await this.productsService.createProduct(
        req.tenant.tenantId,
        dto,
      );
      return successResponse(res, product, 201);
    } catch (error: any) {
      next(error);
    }
  };

  updateProduct = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const { id } = req.params;
      const dto = updateProductSchema.parse(req.body);
      const product = await this.productsService.updateProduct(
        req.tenant.tenantId,
        id,
        dto,
      );
      return successResponse(res, product);
    } catch (error: any) {
      next(error);
    }
  };

  deleteProduct = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const { id } = req.params;
      const result = await this.productsService.deleteProduct(
        req.tenant.tenantId,
        id,
      );
      return successResponse(res, result);
    } catch (error: any) {
      next(error);
    }
  };
}
