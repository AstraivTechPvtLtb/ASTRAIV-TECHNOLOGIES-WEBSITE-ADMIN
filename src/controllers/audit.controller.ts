'use server';

/**
 * @file admin/src/controllers/audit.controller.ts
 * @description [CONTROLLER] Activity History & Audit Logging Controller.
 */

import { db } from '@/models/db';
import { getAdminUser, requireAdminUser } from './auth.controller';

export interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  userId: string | null;
  userName: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: Date;
}

export async function logAuditAction(params: {
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
  isSystem?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser().catch(() => null);

    // Prevent anonymous callers from forging or writing audit records
    if (!admin && !params.isSystem) {
      console.warn('[Audit Security Warning]: Rejected anonymous attempt to write audit log.');
      return { success: false, error: 'Unauthorized: Admin authentication required.' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        userId: admin?.id || (params.isSystem ? 'system' : null),
        userName: admin?.fullName || admin?.email || (params.isSystem ? 'System' : 'Admin'),
        details: (params.details || {}) as object,
        ipAddress: params.ipAddress || null,
      }
    });
    return { success: true };
  } catch (err) {
    // Non-blocking logger
    console.warn('[Audit Logger Warning]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to record audit log' };
  }
}

export async function getAuditLogs(limit = 100): Promise<{ success: boolean; data: AuditLogItem[] }> {
  try {
    await requireAdminUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logs = await (db as any).auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return {
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: logs.map((l: any) => ({
        ...l,
        details: (typeof l.details === 'string' ? JSON.parse(l.details) : l.details) as Record<string, unknown> | null
      }))
    };
  } catch (err: unknown) {
    console.error('[getAuditLogs error]:', err);
    return { success: false, data: [] };
  }
}
