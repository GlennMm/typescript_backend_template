import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../../types";
import { errorResponse, successResponse } from "../../utils/response";
import { UsersService } from "./users.service";
import {
  activateUserSchema,
  createUserSchema,
  updateUserSchema,
} from "./users.validation";

export class UsersController {
  private usersService: UsersService;

  constructor() {
    this.usersService = new UsersService();
  }

  getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const users = await this.usersService.getAllUsers(req.tenant.tenantId);
      return successResponse(res, users);
    } catch (error: any) {
      next(error);
    }
  };

  getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
      const user = await this.usersService.getUserById(req.tenant.tenantId, id);
      return successResponse(res, user);
    } catch (error: any) {
      next(error);
    }
  };

  createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const dto = createUserSchema.parse(req.body);
      const user = await this.usersService.createUser(req.tenant.tenantId, dto);
      return successResponse(res, user, 201);
    } catch (error: any) {
      next(error);
    }
  };

  updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
      const dto = updateUserSchema.parse(req.body);
      const user = await this.usersService.updateUser(
        req.tenant.tenantId,
        id,
        dto,
      );
      return successResponse(res, user);
    } catch (error: any) {
      next(error);
    }
  };

  activateUser = async (
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
      const dto = activateUserSchema.parse(req.body);
      const user = await this.usersService.activateUser(
        req.tenant.tenantId,
        id,
        dto,
      );
      return successResponse(res, user);
    } catch (error: any) {
      next(error);
    }
  };

  deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
      const result = await this.usersService.deleteUser(
        req.tenant.tenantId,
        id,
      );
      return successResponse(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return errorResponse(
          res,
          "Authentication required",
          401,
          "UNAUTHORIZED",
        );
      }

      if (!req.tenant) {
        return errorResponse(
          res,
          "Tenant context required",
          400,
          "TENANT_CONTEXT_MISSING",
        );
      }

      const profile = await this.usersService.getProfile(
        req.tenant.tenantId,
        req.user.userId,
      );
      return successResponse(res, profile);
    } catch (error: any) {
      next(error);
    }
  };
}
