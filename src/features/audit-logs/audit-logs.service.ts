import { and, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { getTenantDb } from "@/db";
import { auditLogs } from "@/db/schemas/tenant.schema";
import { nanoid } from "nanoid";

// ============================================
// TYPES
// ============================================

interface CreateAuditLogDto {
  tableName: string;
  recordId: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  oldValues?: any;
  newValues?: any;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditLogFilters {
  tableName?: string;
  recordId?: string;
  action?: "INSERT" | "UPDATE" | "DELETE";
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  includeArchived?: boolean;
}

// ============================================
// SERVICE
// ============================================

export class AuditLogsService {
  /**
   * Create an audit log entry
   * This should be called manually in services after each database operation
   */
  async createAuditLog(
    tenantId: string,
    data: CreateAuditLogDto,
  ): Promise<any> {
    const db = getTenantDb(tenantId);

    const [log] = await db
      .insert(auditLogs)
      .values({
        id: nanoid(),
        tableName: data.tableName,
        recordId: data.recordId,
        action: data.action,
        oldValues: data.oldValues || null,
        newValues: data.newValues || null,
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: new Date(),
        isArchived: false,
        createdAt: new Date(),
      })
      .returning();

    return log;
  }

  /**
   * Helper method to log INSERT operations
   */
  async logInsert(
    tenantId: string,
    tableName: string,
    recordId: string,
    newValues: any,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<any> {
    return this.createAuditLog(tenantId, {
      tableName,
      recordId,
      action: "INSERT",
      newValues,
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Helper method to log UPDATE operations
   */
  async logUpdate(
    tenantId: string,
    tableName: string,
    recordId: string,
    oldValues: any,
    newValues: any,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<any> {
    return this.createAuditLog(tenantId, {
      tableName,
      recordId,
      action: "UPDATE",
      oldValues,
      newValues,
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Helper method to log DELETE operations
   */
  async logDelete(
    tenantId: string,
    tableName: string,
    recordId: string,
    oldValues: any,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<any> {
    return this.createAuditLog(tenantId, {
      tableName,
      recordId,
      action: "DELETE",
      oldValues,
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(
    tenantId: string,
    filters: AuditLogFilters,
    limit: number = 100,
    offset: number = 0,
  ): Promise<any[]> {
    const db = getTenantDb(tenantId);

    const conditions = [];

    if (filters.tableName) {
      conditions.push(eq(auditLogs.tableName, filters.tableName));
    }

    if (filters.recordId) {
      conditions.push(eq(auditLogs.recordId, filters.recordId));
    }

    if (filters.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }

    if (filters.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }

    if (filters.startDate) {
      conditions.push(gte(auditLogs.timestamp, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(auditLogs.timestamp, filters.endDate));
    }

    // By default, don't include archived logs unless explicitly requested
    if (!filters.includeArchived) {
      conditions.push(eq(auditLogs.isArchived, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const logs = await db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    return logs;
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(tenantId: string, logId: string): Promise<any> {
    const db = getTenantDb(tenantId);

    const [log] = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, logId))
      .limit(1);

    if (!log) {
      throw new Error("Audit log not found");
    }

    return log;
  }

  /**
   * Get audit history for a specific record
   */
  async getRecordHistory(
    tenantId: string,
    tableName: string,
    recordId: string,
  ): Promise<any[]> {
    const db = getTenantDb(tenantId);

    const logs = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.tableName, tableName),
          eq(auditLogs.recordId, recordId),
        ),
      )
      .orderBy(desc(auditLogs.timestamp));

    return logs;
  }

  /**
   * Archive old logs (older than specified date)
   */
  async archiveLogs(
    tenantId: string,
    beforeDate: Date,
  ): Promise<{ archived: number }> {
    const db = getTenantDb(tenantId);

    const result = await db
      .update(auditLogs)
      .set({
        isArchived: true,
        archivedAt: new Date(),
      })
      .where(
        and(
          lte(auditLogs.timestamp, beforeDate),
          eq(auditLogs.isArchived, false),
        ),
      );

    return { archived: result.changes || 0 };
  }

  /**
   * Unarchive logs
   */
  async unarchiveLogs(
    tenantId: string,
    logIds: string[],
  ): Promise<{ unarchived: number }> {
    const db = getTenantDb(tenantId);

    let unarchived = 0;

    for (const logId of logIds) {
      const result = await db
        .update(auditLogs)
        .set({
          isArchived: false,
          archivedAt: null,
        })
        .where(eq(auditLogs.id, logId));

      unarchived += result.changes || 0;
    }

    return { unarchived };
  }

  /**
   * Export audit logs (return as JSON array)
   */
  async exportLogs(
    tenantId: string,
    filters: AuditLogFilters,
  ): Promise<any[]> {
    // Get all matching logs without limit
    return this.getAuditLogs(tenantId, filters, 999999, 0);
  }

  /**
   * Get audit summary statistics
   */
  async getAuditSummary(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    const db = getTenantDb(tenantId);

    const conditions = [eq(auditLogs.isArchived, false)];

    if (startDate) {
      conditions.push(gte(auditLogs.timestamp, startDate));
    }

    if (endDate) {
      conditions.push(lte(auditLogs.timestamp, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total counts by action
    const insertCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(auditLogs)
      .where(and(whereClause, eq(auditLogs.action, "INSERT")));

    const updateCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(auditLogs)
      .where(and(whereClause, eq(auditLogs.action, "UPDATE")));

    const deleteCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(auditLogs)
      .where(and(whereClause, eq(auditLogs.action, "DELETE")));

    // Get counts by table
    const byTable = await db
      .select({
        tableName: auditLogs.tableName,
        count: sql<number>`COUNT(*)`,
      })
      .from(auditLogs)
      .where(whereClause)
      .groupBy(auditLogs.tableName)
      .orderBy(desc(sql`COUNT(*)`));

    return {
      period: {
        startDate,
        endDate,
      },
      totalLogs:
        (insertCount[0]?.count || 0) +
        (updateCount[0]?.count || 0) +
        (deleteCount[0]?.count || 0),
      byAction: {
        INSERT: insertCount[0]?.count || 0,
        UPDATE: updateCount[0]?.count || 0,
        DELETE: deleteCount[0]?.count || 0,
      },
      byTable,
    };
  }
}
