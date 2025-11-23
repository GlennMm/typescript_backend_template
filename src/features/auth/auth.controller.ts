import { Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { loginSchema, refreshTokenSchema, registerSchema, changePasswordSchema } from './auth.validation';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  loginSuperAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dto = loginSchema.parse(req.body);
      const result = await this.authService.loginSuperAdmin(dto);
      return successResponse(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  loginTenantUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.tenant) {
        return errorResponse(res, 'Tenant context required', 400, 'TENANT_CONTEXT_MISSING');
      }

      const dto = loginSchema.parse(req.body);
      const result = await this.authService.loginTenantUser(req.tenant.tenantId, dto);
      return successResponse(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  registerTenantUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.tenant) {
        return errorResponse(res, 'Tenant context required', 400, 'TENANT_CONTEXT_MISSING');
      }

      const dto = registerSchema.parse(req.body);
      const result = await this.authService.registerTenantUser(req.tenant.tenantId, dto, 'TenantUser');
      return successResponse(res, result, 201);
    } catch (error: any) {
      next(error);
    }
  };

  refreshToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const dto = refreshTokenSchema.parse(req.body);
      const result = await this.authService.refreshAccessToken(dto);
      return successResponse(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);

      if (!req.user) {
        return errorResponse(res, 'Authentication required', 401, 'UNAUTHORIZED');
      }

      await this.authService.logout(refreshToken, req.user.role, req.user.tenantId);
      return successResponse(res, { message: 'Logged out successfully' });
    } catch (error: any) {
      next(error);
    }
  };

  changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return errorResponse(res, 'Authentication required', 401, 'UNAUTHORIZED');
      }

      if (!req.tenant) {
        return errorResponse(res, 'Tenant context required', 400, 'TENANT_CONTEXT_MISSING');
      }

      const dto = changePasswordSchema.parse(req.body);
      const result = await this.authService.changePassword(
        req.tenant.tenantId,
        req.user.userId,
        dto.newPassword
      );
      return successResponse(res, result);
    } catch (error: any) {
      next(error);
    }
  };
}
