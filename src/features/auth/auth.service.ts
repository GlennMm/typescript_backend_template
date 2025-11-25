import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getMainDb, getTenantDb } from "../../db/connection";
import {
  subscriptionPlans,
  superAdminRefreshTokens,
  superAdmins,
  tenants,
} from "../../db/schemas/main.schema";
import { refreshTokens, users } from "../../db/schemas/tenant.schema";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { hashPassword, verifyPassword } from "../../utils/password";
import type { LoginDto, RefreshTokenDto, RegisterDto } from "./auth.validation";

export class AuthService {
  // Super Admin Login
  async loginSuperAdmin(dto: LoginDto) {
    const db = getMainDb();

    const [admin] = await db
      .select()
      .from(superAdmins)
      .where(eq(superAdmins.email, dto.email))
      .limit(1);

    if (!admin) {
      throw new Error("Invalid credentials");
    }

    if (!admin.isActive) {
      throw new Error("Account is inactive");
    }

    const isPasswordValid = await verifyPassword(
      dto.password,
      admin.passwordHash,
    );
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const tokenId = nanoid();
    const accessToken = generateAccessToken({
      userId: admin.id,
      role: "SuperAdmin",
    });

    const refreshToken = generateRefreshToken({
      userId: admin.id,
      tokenId,
      role: "SuperAdmin",
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.insert(superAdminRefreshTokens).values({
      id: tokenId,
      superAdminId: admin.id,
      token: refreshToken,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: "SuperAdmin" as const,
      },
    };
  }

  // Tenant User Login
  async loginTenantUser(tenantId: string, dto: LoginDto) {
    const db = getTenantDb(tenantId);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (!user.isActive) {
      throw new Error(
        "Account is not activated. Please contact your administrator.",
      );
    }

    // Check if user has OTP and if it's expired
    if (user.otpHash && user.otpExpiresAt) {
      if (user.otpExpiresAt < new Date()) {
        throw new Error(
          "OTP has expired. Please contact your administrator for a new OTP.",
        );
      }
    }

    const isPasswordValid = await verifyPassword(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // If OTP was used successfully, clear OTP fields
    if (user.otpHash) {
      await db
        .update(users)
        .set({
          otpHash: null,
          otpExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    // Get tenant information from main database
    const mainDb = getMainDb();
    const [tenant] = await mainDb
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        subscriptionStatus: tenants.subscriptionStatus,
        subscriptionEndDate: tenants.subscriptionEndDate,
        planName: subscriptionPlans.name,
        createdAt: tenants.createdAt,
      })
      .from(tenants)
      .leftJoin(
        subscriptionPlans,
        eq(tenants.subscriptionPlanId, subscriptionPlans.id),
      )
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    const tokenId = nanoid();
    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      tenantId,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenId,
      role: user.role,
      tenantId,
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.insert(refreshTokens).values({
      id: tokenId,
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId,
        role: user.role,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: (tenant.planName?.toLowerCase() || "free") as "free" | "pro" | "enterprise",
        subscriptionStatus: tenant.subscriptionStatus,
        subscriptionExpiresAt: tenant.subscriptionEndDate?.toISOString() || null,
        createdAt: tenant.createdAt?.toISOString() || new Date().toISOString(),
      },
      requirePasswordChange: user.requirePasswordChange,
    };
  }

  // Register Tenant User
  async registerTenantUser(
    tenantId: string,
    dto: RegisterDto,
    role: "TenantAdmin" | "TenantUser",
  ) {
    const db = getTenantDb(tenantId);

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const passwordHash = await hashPassword(dto.password);

    const [newUser] = await db
      .insert(users)
      .values({
        id: nanoid(),
        email: dto.email,
        passwordHash,
        name: dto.name,
        role,
        isActive: false, // Requires activation by admin
      })
      .returning();

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      isActive: newUser.isActive,
    };
  }

  // Refresh Token
  async refreshAccessToken(dto: RefreshTokenDto) {
    try {
      const payload = verifyRefreshToken(dto.refreshToken);

      // Check if it's a super admin or tenant user
      if (payload.role === "SuperAdmin") {
        const db = getMainDb();

        const [tokenRecord] = await db
          .select()
          .from(superAdminRefreshTokens)
          .where(eq(superAdminRefreshTokens.token, dto.refreshToken))
          .limit(1);

        if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
          throw new Error("Invalid or expired refresh token");
        }

        const accessToken = generateAccessToken({
          userId: payload.userId,
          role: payload.role,
        });

        return { accessToken };
      } else {
        if (!payload.tenantId) {
          throw new Error("Invalid refresh token");
        }

        const db = getTenantDb(payload.tenantId);

        const [tokenRecord] = await db
          .select()
          .from(refreshTokens)
          .where(eq(refreshTokens.token, dto.refreshToken))
          .limit(1);

        if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
          throw new Error("Invalid or expired refresh token");
        }

        const accessToken = generateAccessToken({
          userId: payload.userId,
          role: payload.role,
          tenantId: payload.tenantId,
        });

        return { accessToken };
      }
    } catch (_error) {
      throw new Error("Invalid or expired refresh token");
    }
  }

  // Logout
  async logout(
    refreshToken: string,
    role: "SuperAdmin" | "TenantAdmin" | "TenantUser",
    tenantId?: string,
  ) {
    if (role === "SuperAdmin") {
      const db = getMainDb();
      await db
        .delete(superAdminRefreshTokens)
        .where(eq(superAdminRefreshTokens.token, refreshToken));
    } else {
      if (!tenantId) {
        throw new Error("Tenant ID required for tenant users");
      }
      const db = getTenantDb(tenantId);
      await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.token, refreshToken));
    }
  }

  // Change Password (after OTP login)
  async changePassword(tenantId: string, userId: string, newPassword: string) {
    const db = getTenantDb(tenantId);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    const newPasswordHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        requirePasswordChange: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return {
      message: "Password changed successfully",
    };
  }
}
