/**
 * @file admin/src/lib/audit-internal.ts
 * @description [SERVER-INTERNAL] Trusted server-only audit logger for background, system, and automated tasks.
 * NOTE: This module does not contain any server action directive and cannot be invoked remotely by untrusted clients.
 */

import { db } from '@/models/db';

export async function logSystemAuditEvent(params: {
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
  systemComponent?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        userId: 'system',
        userName: params.systemComponent ? `System [${params.systemComponent}]` : 'System',
        details: (params.details || {}) as object,
        ipAddress: params.ipAddress || null,
      },
    });
    return { success: true };
  } catch (err) {
    console.warn('[System Audit Logger Warning]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to record system audit log' };
  }
}
