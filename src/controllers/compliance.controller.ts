'use server';

/**
 * @file admin/src/controllers/compliance.controller.ts
 * @description [CONTROLLER] Business logic for managing client website compliance & ISO certification settings.
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import {
  AdminComplianceSettings,
  AdminComplianceSettingsInput,
  AdminActionResponse,
} from '@/models/types';

const DEFAULT_SETTINGS = {
  isoNumber: 'ISO 27001:2022',
  isoLabel: 'Certified',
  showIsoBadge: true,
  showIsoSection: true,
  uptimeValue: '99.99%',
  uptimeLabel: 'SERVER UPTIME',
  savingsValue: '40%+',
  savingsLabel: 'INFRASTRUCTURE SAVING',
  actionsValue: '10M+',
  actionsLabel: 'API ACTIONS',
  slaValue: '100%',
  slaLabel: 'ON-TIME SLA DELIVERY',
};

/**
 * Helper to fetch the compliance record via model or raw SQL fallback.
 */
async function fetchComplianceRecord(): Promise<any> {
  const model = (db as any).complianceSetting;
  if (model && typeof model.findFirst === 'function') {
    let rec = await model.findFirst();
    if (!rec) {
      rec = await model.create({ data: DEFAULT_SETTINGS });
    }
    return rec;
  }

  // Fallback: direct query via raw SQL in case PrismaClient was cached in dev memory
  try {
    const rows: any[] = await db.$queryRaw`
      SELECT 
        id, 
        iso_number as "isoNumber", 
        iso_label as "isoLabel", 
        show_iso_badge as "showIsoBadge", 
        show_iso_section as "showIsoSection",
        uptime_value as "uptimeValue",
        uptime_label as "uptimeLabel",
        savings_value as "savingsValue",
        savings_label as "savingsLabel",
        actions_value as "actionsValue",
        actions_label as "actionsLabel",
        sla_value as "slaValue",
        sla_label as "slaLabel",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM compliance_settings 
      LIMIT 1
    `;

    if (rows && rows.length > 0) {
      return rows[0];
    }

    // Insert default row
    const id = 'default-compliance-id';
    await db.$executeRaw`
      INSERT INTO compliance_settings (
        id, iso_number, iso_label, show_iso_badge, show_iso_section,
        uptime_value, uptime_label, savings_value, savings_label,
        actions_value, actions_label, sla_value, sla_label
      ) VALUES (
        ${id},
        ${DEFAULT_SETTINGS.isoNumber},
        ${DEFAULT_SETTINGS.isoLabel},
        ${DEFAULT_SETTINGS.showIsoBadge},
        ${DEFAULT_SETTINGS.showIsoSection},
        ${DEFAULT_SETTINGS.uptimeValue},
        ${DEFAULT_SETTINGS.uptimeLabel},
        ${DEFAULT_SETTINGS.savingsValue},
        ${DEFAULT_SETTINGS.savingsLabel},
        ${DEFAULT_SETTINGS.actionsValue},
        ${DEFAULT_SETTINGS.actionsLabel},
        ${DEFAULT_SETTINGS.slaValue},
        ${DEFAULT_SETTINGS.slaLabel}
      )
    `;

    return {
      id,
      ...DEFAULT_SETTINGS,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (rawErr) {
    console.warn('[Compliance Fallback Query Error]:', rawErr);
    return {
      id: 'default-compliance-id',
      ...DEFAULT_SETTINGS,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * Helper to update the compliance record via model or raw SQL fallback.
 */
async function saveComplianceRecord(payload: any): Promise<any> {
  const model = (db as any).complianceSetting;
  if (model && typeof model.findFirst === 'function') {
    let rec = await model.findFirst();
    if (!rec) {
      return await model.create({ data: payload });
    }
    return await model.update({
      where: { id: rec.id },
      data: payload,
    });
  }

  // Fallback: direct raw SQL update
  const rows: any[] = await db.$queryRaw`SELECT id FROM compliance_settings LIMIT 1`;
  if (rows && rows.length > 0) {
    const id = rows[0].id;
    await db.$executeRaw`
      UPDATE compliance_settings 
      SET 
        iso_number = ${payload.isoNumber},
        iso_label = ${payload.isoLabel},
        show_iso_badge = ${payload.showIsoBadge},
        show_iso_section = ${payload.showIsoSection},
        uptime_value = ${payload.uptimeValue},
        uptime_label = ${payload.uptimeLabel},
        savings_value = ${payload.savingsValue},
        savings_label = ${payload.savingsLabel},
        actions_value = ${payload.actionsValue},
        actions_label = ${payload.actionsLabel},
        sla_value = ${payload.slaValue},
        sla_label = ${payload.slaLabel},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    const updatedRows: any[] = await db.$queryRaw`
      SELECT 
        id, 
        iso_number as "isoNumber", 
        iso_label as "isoLabel", 
        show_iso_badge as "showIsoBadge", 
        show_iso_section as "showIsoSection",
        uptime_value as "uptimeValue",
        uptime_label as "uptimeLabel",
        savings_value as "savingsValue",
        savings_label as "savingsLabel",
        actions_value as "actionsValue",
        actions_label as "actionsLabel",
        sla_value as "slaValue",
        sla_label as "slaLabel",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM compliance_settings 
      WHERE id = ${id}
    `;

    return updatedRows[0];
  } else {
    const id = 'default-compliance-id';
    await db.$executeRaw`
      INSERT INTO compliance_settings (
        id, iso_number, iso_label, show_iso_badge, show_iso_section,
        uptime_value, uptime_label, savings_value, savings_label,
        actions_value, actions_label, sla_value, sla_label
      ) VALUES (
        ${id},
        ${payload.isoNumber},
        ${payload.isoLabel},
        ${payload.showIsoBadge},
        ${payload.showIsoSection},
        ${payload.uptimeValue},
        ${payload.uptimeLabel},
        ${payload.savingsValue},
        ${payload.savingsLabel},
        ${payload.actionsValue},
        ${payload.actionsLabel},
        ${payload.slaValue},
        ${payload.slaLabel}
      )
    `;

    return {
      id,
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * Retrieves the current ISO & compliance section configuration.
 */
export async function getComplianceSettings(): Promise<{
  settings: AdminComplianceSettings;
  error?: string;
}> {
  try {
    const record = await fetchComplianceRecord();

    return {
      settings: {
        id: record.id,
        isoNumber: record.isoNumber || 'ISO 27001:2022',
        isoLabel: record.isoLabel !== undefined ? record.isoLabel : 'Certified',
        showIsoBadge: record.showIsoBadge !== false,
        showIsoSection: record.showIsoSection !== false,
        uptimeValue: record.uptimeValue || '99.99%',
        uptimeLabel: record.uptimeLabel || 'SERVER UPTIME',
        savingsValue: record.savingsValue || '40%+',
        savingsLabel: record.savingsLabel || 'INFRASTRUCTURE SAVING',
        actionsValue: record.actionsValue || '10M+',
        actionsLabel: record.actionsLabel || 'API ACTIONS',
        slaValue: record.slaValue || '100%',
        slaLabel: record.slaLabel || 'ON-TIME SLA DELIVERY',
        createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : String(record.createdAt || ''),
        updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : String(record.updatedAt || ''),
      },
    };
  } catch (error: any) {
    console.error('getComplianceSettings error:', error);
    return {
      settings: {
        id: 'default',
        ...DEFAULT_SETTINGS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      error: error.message || 'Failed to fetch compliance settings',
    };
  }
}

/**
 * Updates the ISO certification and compliance section settings.
 */
export async function updateComplianceSettings(
  input: AdminComplianceSettingsInput
): Promise<AdminActionResponse & { settings?: AdminComplianceSettings }> {
  try {
    const payload = {
      isoNumber: input.isoNumber.trim() || 'ISO 27001:2022',
      isoLabel: input.isoLabel.trim(),
      showIsoBadge: Boolean(input.showIsoBadge),
      showIsoSection: Boolean(input.showIsoSection),
      uptimeValue: input.uptimeValue?.trim() || '99.99%',
      uptimeLabel: input.uptimeLabel?.trim() || 'SERVER UPTIME',
      savingsValue: input.savingsValue?.trim() || '40%+',
      savingsLabel: input.savingsLabel?.trim() || 'INFRASTRUCTURE SAVING',
      actionsValue: input.actionsValue?.trim() || '10M+',
      actionsLabel: input.actionsLabel?.trim() || 'API ACTIONS',
      slaValue: input.slaValue?.trim() || '100%',
      slaLabel: input.slaLabel?.trim() || 'ON-TIME SLA DELIVERY',
    };

    const updated = await saveComplianceRecord(payload);

    try {
      revalidatePath('/settings');
    } catch {
      // safe fallback if outside active request lifecycle
    }

    return {
      success: true,
      message: 'ISO & Compliance settings successfully updated and live on client website.',
      settings: {
        id: updated.id,
        isoNumber: updated.isoNumber,
        isoLabel: updated.isoLabel,
        showIsoBadge: updated.showIsoBadge,
        showIsoSection: updated.showIsoSection,
        uptimeValue: updated.uptimeValue,
        uptimeLabel: updated.uptimeLabel,
        savingsValue: updated.savingsValue,
        savingsLabel: updated.savingsLabel,
        actionsValue: updated.actionsValue,
        actionsLabel: updated.actionsLabel,
        slaValue: updated.slaValue,
        slaLabel: updated.slaLabel,
        createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt || ''),
        updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : String(updated.updatedAt || ''),
      },
    };
  } catch (error: any) {
    console.error('updateComplianceSettings error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update compliance settings.',
    };
  }
}
