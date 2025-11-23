import type { Response } from "express";
import type { AuthRequest } from "../../types";
import { errorResponse, successResponse } from "../../utils/response";
import { CustomersService } from "./customers.service";

export class CustomersController {
  private service: CustomersService;

  constructor() {
    this.service = new CustomersService();
  }

  createCustomer = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const customer = await this.service.createCustomer(tenantId, req.body);
      return successResponse(res, customer, 201);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getAllCustomers = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { search, customerType, isActive, excludeWalkIn } = req.query;
      const customers = await this.service.getAllCustomers(tenantId, {
        search: search as string,
        customerType: customerType as any,
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
        excludeWalkIn: excludeWalkIn === "true",
      });
      return successResponse(res, customers);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getCustomerById = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const customer = await this.service.getCustomerById(tenantId, id);
      return successResponse(res, customer);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  updateCustomer = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const customer = await this.service.updateCustomer(tenantId, id, req.body);
      return successResponse(res, customer);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  deleteCustomer = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { id } = req.params;
      const customer = await this.service.deleteCustomer(tenantId, id);
      return successResponse(res, customer);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };

  getWalkInCustomer = async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant?.tenantId!;
      const { branchId } = req.params;
      const customer = await this.service.getWalkInCustomer(tenantId, branchId);
      return successResponse(res, customer);
    } catch (error: any) {
      return errorResponse(res, error.message);
    }
  };
}
