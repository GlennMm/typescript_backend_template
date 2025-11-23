import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../../types";
import { errorResponse, successResponse } from "../../utils/response";
import { CustomersService } from "./customers.service";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "./customers.validation";

export class CustomersController {
  private customersService: CustomersService;

  constructor() {
    this.customersService = new CustomersService();
  }

  getAllCustomers = async (
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

      const search = req.query.search as string | undefined;
      const customers = await this.customersService.getAllCustomers(
        req.tenant.tenantId,
        search,
      );
      return successResponse(res, customers);
    } catch (error: any) {
      next(error);
    }
  };

  getCustomerById = async (
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
      const customer = await this.customersService.getCustomerById(
        req.tenant.tenantId,
        id,
      );
      return successResponse(res, customer);
    } catch (error: any) {
      next(error);
    }
  };

  createCustomer = async (
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

      const dto = createCustomerSchema.parse(req.body);
      const customer = await this.customersService.createCustomer(
        req.tenant.tenantId,
        dto,
      );
      return successResponse(res, customer, 201);
    } catch (error: any) {
      next(error);
    }
  };

  updateCustomer = async (
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
      const dto = updateCustomerSchema.parse(req.body);
      const customer = await this.customersService.updateCustomer(
        req.tenant.tenantId,
        id,
        dto,
      );
      return successResponse(res, customer);
    } catch (error: any) {
      next(error);
    }
  };

  deleteCustomer = async (
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
      const result = await this.customersService.deleteCustomer(
        req.tenant.tenantId,
        id,
      );
      return successResponse(res, result);
    } catch (error: any) {
      next(error);
    }
  };
}
