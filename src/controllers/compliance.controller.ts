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

const DEFAULT_CLIENT_LOGOS = [
  { id: 'acme', name: 'ACME CORP', iconKey: 'acme', imageUrl: null },
  { id: 'globex', name: 'GLOBEX', iconKey: 'globex', imageUrl: null },
  { id: 'initech', name: 'INITECH', iconKey: 'initech', imageUrl: null },
  { id: 'umbrella', name: 'UMBRELLA', iconKey: 'umbrella', imageUrl: null },
  { id: 'hooli', name: 'HOOLI', iconKey: 'hooli', imageUrl: null },
  { id: 'stark', name: 'STARK INDUSTRIES', iconKey: 'stark', imageUrl: null },
];

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
  clientLogos: JSON.stringify(DEFAULT_CLIENT_LOGOS),
};

interface ComplianceDbRecord {
  id: string;
  isoNumber: string;
  isoLabel: string;
  showIsoBadge: boolean;
  showIsoSection: boolean;
  uptimeValue: string;
  uptimeLabel: string;
  savingsValue: string;
  savingsLabel: string;
  actionsValue: string;
  actionsLabel: string;
  slaValue: string;
  slaLabel: string;
  clientLogos?: string | null;
  client_logos?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface PrismaWithCompliance {
  complianceSetting?: {
    findFirst: () => Promise<ComplianceDbRecord | null>;
    create: (args: { data: Partial<ComplianceDbRecord> }) => Promise<ComplianceDbRecord>;
    update: (args: { where: { id: string }; data: Partial<ComplianceDbRecord> }) => Promise<ComplianceDbRecord>;
  };
}

/**
 * Helper to fetch the compliance record via model or raw SQL fallback.
 */
async function fetchComplianceRecord(): Promise<ComplianceDbRecord> {
  const model = (db as unknown as PrismaWithCompliance).complianceSetting;
  if (model && typeof model.findFirst === 'function') {
    let rec = await model.findFirst();
    if (!rec) {
      rec = await model.create({ data: DEFAULT_SETTINGS });
    }
    return rec;
  }

  // Fallback: direct query via raw SQL in case PrismaClient was cached in dev memory
  try {
    const rows = await db.$queryRaw<ComplianceDbRecord[]>`
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
        client_logos as "clientLogos",
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
        actions_value, actions_label, sla_value, sla_label, client_logos
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
        ${DEFAULT_SETTINGS.slaLabel},
        ${DEFAULT_SETTINGS.clientLogos}
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
async function saveComplianceRecord(payload: AdminComplianceSettingsInput): Promise<ComplianceDbRecord> {
  const clientLogosString = payload.clientLogos
    ? (typeof payload.clientLogos === 'string' ? payload.clientLogos : JSON.stringify(payload.clientLogos))
    : null;

  const model = (db as unknown as PrismaWithCompliance).complianceSetting;
  if (model && typeof model.findFirst === 'function') {
    const rec = await model.findFirst();
    const dataToSave = {
      ...payload,
      clientLogos: clientLogosString,
    };
    if (!rec) {
      return await model.create({ data: dataToSave });
    }
    return await model.update({
      where: { id: rec.id },
      data: dataToSave,
    });
  }

  // Fallback: direct raw SQL update
  const rows = await db.$queryRaw<Array<{ id: string }>>`SELECT id FROM compliance_settings LIMIT 1`;
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
        client_logos = ${clientLogosString},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    const updatedRows = await db.$queryRaw<ComplianceDbRecord[]>`
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
        client_logos as "clientLogos",
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
        actions_value, actions_label, sla_value, sla_label, client_logos
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
        ${payload.slaLabel},
        ${clientLogosString}
      )
    `;

    return {
      id,
      ...payload,
      uptimeValue: payload.uptimeValue || '99.99%',
      uptimeLabel: payload.uptimeLabel || 'SERVER UPTIME',
      savingsValue: payload.savingsValue || '40%+',
      savingsLabel: payload.savingsLabel || 'INFRASTRUCTURE SAVING',
      actionsValue: payload.actionsValue || '10M+',
      actionsLabel: payload.actionsLabel || 'API ACTIONS',
      slaValue: payload.slaValue || '100%',
      slaLabel: payload.slaLabel || 'ON-TIME SLA DELIVERY',
      clientLogos: clientLogosString,
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

    let clientLogos = DEFAULT_CLIENT_LOGOS;
    const rawLogos = record.clientLogos || record.client_logos;
    if (rawLogos) {
      try {
        const parsed = typeof rawLogos === 'string' ? JSON.parse(rawLogos) : rawLogos;
        if (Array.isArray(parsed) && parsed.length > 0) {
          clientLogos = parsed;
        }
      } catch {
        // Fallback to default
      }
    }

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
        clientLogos,
        createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : String(record.createdAt || ''),
        updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : String(record.updatedAt || ''),
      },
    };
  } catch (error: unknown) {
    console.error('getComplianceSettings error:', error);
    return {
      settings: {
        id: 'default',
        ...DEFAULT_SETTINGS,
        clientLogos: DEFAULT_CLIENT_LOGOS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      error: error instanceof Error ? error.message : 'Failed to fetch compliance settings',
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
      clientLogos: input.clientLogos,
    };

    const updated = await saveComplianceRecord(payload);

    try {
      revalidatePath('/settings');
    } catch {
      // safe fallback if outside active request lifecycle
    }

    let parsedLogos = DEFAULT_CLIENT_LOGOS;
    const rawUpdatedLogos = updated.clientLogos || updated.client_logos;
    if (rawUpdatedLogos) {
      try {
        const parsed = typeof rawUpdatedLogos === 'string' ? JSON.parse(rawUpdatedLogos) : rawUpdatedLogos;
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsedLogos = parsed;
        }
      } catch {
        // Fallback
      }
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
        clientLogos: parsedLogos,
        createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt || ''),
        updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : String(updated.updatedAt || ''),
      },
    };
  } catch (error: unknown) {
    console.error('updateComplianceSettings error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update compliance settings.',
    };
  }
}
