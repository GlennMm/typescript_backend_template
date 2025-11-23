import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getTenantDb } from "../../db/connection";
import { users } from "../../db/schemas/tenant.schema";
import { hashPassword } from "../../utils/password";
import type {
  ActivateUserDto,
  CreateUserDto,
  UpdateUserDto,
} from "./users.validation";

export class UsersService {
  async getAllUsers(tenantId: string) {
    const db = getTenantDb(tenantId);

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        activatedAt: users.activatedAt,
        createdAt: users.createdAt,
      })
      .from(users);

    return allUsers;
  }

  async getUserById(tenantId: string, userId: string) {
    const db = getTenantDb(tenantId);

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        activatedAt: users.activatedAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async createUser(tenantId: string, dto: CreateUserDto) {
    const db = getTenantDb(tenantId);

    // Check if email already exists
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
        role: dto.role,
        isActive: false, // New users start as inactive
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    return newUser;
  }

  async updateUser(tenantId: string, userId: string, dto: UpdateUserDto) {
    const db = getTenantDb(tenantId);

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      throw new Error("User not found");
    }

    // If email is being updated, check if it's already taken
    if (dto.email && dto.email !== existingUser.email) {
      const [emailTaken] = await db
        .select()
        .from(users)
        .where(eq(users.email, dto.email))
        .limit(1);

      if (emailTaken) {
        throw new Error("Email already in use");
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        updatedAt: users.updatedAt,
      });

    return updatedUser;
  }

  async activateUser(tenantId: string, userId: string, dto: ActivateUserDto) {
    const db = getTenantDb(tenantId);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        isActive: dto.isActive,
        activatedAt: dto.isActive ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        activatedAt: users.activatedAt,
      });

    return updatedUser;
  }

  async deleteUser(tenantId: string, userId: string) {
    const db = getTenantDb(tenantId);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    await db.delete(users).where(eq(users.id, userId));

    return { message: "User deleted successfully" };
  }

  async getProfile(tenantId: string, userId: string) {
    return this.getUserById(tenantId, userId);
  }
}
