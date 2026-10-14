import { prisma } from './prisma';

interface LogAuditParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

/**
 * Record a traceable audit log entry in PostgreSQL
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        beforeState: params.beforeState ? JSON.parse(JSON.stringify(params.beforeState)) : undefined,
        afterState: params.afterState ? JSON.parse(JSON.stringify(params.afterState)) : undefined,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    // Non-blocking log failure - do not break parent operation, but output structured error
    console.error('[AUDIT_LOG_ERROR]', error);
  }
}
