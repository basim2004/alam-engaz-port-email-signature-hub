import { SignatureCustomization, DEFAULT_CUSTOMIZATION } from '../utils/signatureHtmlGenerator';
import { logAuditEvent } from './websiteContentService';
import { 
  getAllFirestoreSignatureConfigs, 
  getFirestoreSignatureConfig, 
  saveFirestoreSignatureConfig, 
  deleteFirestoreSignatureConfig 
} from './firebaseService';
import { SignatureConfigRecord } from '../types';

export interface SignatureRecord {
  employeeId: string;
  employeeName: string;
  customization: SignatureCustomization;
  createdAt: string;
  updatedAt: string;
  lastUpdatedBy: string;
}

/**
 * Retrieves all stored signature customizations from Firestore collection.
 */
export function getAllSignatureRecords(): Record<string, SignatureRecord> {
  const configs = getAllFirestoreSignatureConfigs();
  const records: Record<string, SignatureRecord> = {};
  
  for (const [id, c] of Object.entries(configs)) {
    records[id] = {
      employeeId: c.employeeId,
      employeeName: c.employeeName || c.employeeId,
      customization: {
        showBestRegards: c.showBestRegards,
        bestRegardsText: c.bestRegardsText,
        bestRegardsColor: c.bestRegardsSettings?.color || '#7D0727',
        bestRegardsFontSize: c.bestRegardsSettings?.fontSize || 14,
        bestRegardsFontWeight: c.bestRegardsSettings?.fontWeight || '700',
        bestRegardsX: c.bestRegardsSettings?.x || 0,
        bestRegardsY: c.bestRegardsSettings?.y || 0,
        bestRegardsSpaceBelow: c.bestRegardsSettings?.spaceBelow ?? 10,
        showLogo: c.logoSettings?.showLogo ?? true,
        logoScale: c.logoSettings?.scale || 100,
        logoX: c.logoSettings?.x || 0,
        logoY: c.logoSettings?.y || 0,
        logoSpaceToDivider: c.logoSettings?.spaceToDivider ?? 8,
        showSocialIcons: c.displaySettings?.showSocialIcons ?? false
      },
      createdAt: c.savedAt,
      updatedAt: c.updatedAt,
      lastUpdatedBy: c.lastUpdatedBy || 'System'
    };
  }
  return records;
}

/**
 * Checks if an employee has a custom signature saved in Firestore.
 */
export function hasCustomSignatureRecord(employeeId: string): boolean {
  return !!getFirestoreSignatureConfig(employeeId);
}

/**
 * Retrieves custom signature settings for an employee from Firestore.
 */
export function getCustomSignatureRecord(employeeId: string): SignatureCustomization | null {
  const record = getFirestoreSignatureConfig(employeeId);
  if (!record) return null;
  return {
    showBestRegards: record.showBestRegards,
    bestRegardsText: record.bestRegardsText,
    bestRegardsColor: record.bestRegardsSettings?.color || '#7D0727',
    bestRegardsFontSize: record.bestRegardsSettings?.fontSize || 14,
    bestRegardsFontWeight: record.bestRegardsSettings?.fontWeight || '700',
    bestRegardsX: record.bestRegardsSettings?.x || 0,
    bestRegardsY: record.bestRegardsSettings?.y || 0,
    bestRegardsSpaceBelow: record.bestRegardsSettings?.spaceBelow ?? 10,
    showLogo: record.logoSettings?.showLogo ?? true,
    logoScale: record.logoSettings?.scale || 100,
    logoX: record.logoSettings?.x || 0,
    logoY: record.logoSettings?.y || 0,
    logoSpaceToDivider: record.logoSettings?.spaceToDivider ?? 8,
    showSocialIcons: record.displaySettings?.showSocialIcons ?? false
  };
}

/**
 * Saves a signature record in Firestore collection signatureConfigurations.
 * Requirement #3:
 * - Validate current employee data
 * - Save current signature configuration
 * - Save Best Regards settings
 * - Save logo settings
 * - Save display settings
 * - Save employee details
 * - Save timestamp
 * - Notification: “Signature saved successfully.”
 */
export async function saveSignatureRecord(
  employeeId: string,
  employeeName: string,
  customization: SignatureCustomization,
  performedBy: string = 'User',
  userRole: string = 'employee'
): Promise<{ success: boolean; message: string }> {
  try {
    if (!employeeId || !employeeId.trim()) {
      return { success: false, message: 'Validation error: Employee ID is required to save signature.' };
    }

    const c = { ...DEFAULT_CUSTOMIZATION, ...customization };
    const now = new Date().toISOString();

    const configDoc: SignatureConfigRecord = {
      employeeId: employeeId.trim(),
      employeeName: employeeName || employeeId,
      showBestRegards: c.showBestRegards !== false,
      bestRegardsText: c.bestRegardsText || 'Best Regards,',
      bestRegardsSettings: {
        color: c.bestRegardsColor || '#7D0727',
        fontSize: c.bestRegardsFontSize || 14,
        fontWeight: c.bestRegardsFontWeight || '700',
        x: c.bestRegardsX || 0,
        y: c.bestRegardsY || 0,
        spaceBelow: c.bestRegardsSpaceBelow ?? 10
      },
      logoSettings: {
        showLogo: c.showLogo !== false,
        scale: c.logoScale || 100,
        x: c.logoX || 0,
        y: c.logoY || 0,
        spaceToDivider: c.logoSpaceToDivider ?? 8
      },
      displaySettings: {
        showSocialIcons: !!c.showSocialIcons
      },
      savedAt: now,
      updatedAt: now,
      lastUpdatedBy: performedBy
    };

    const res = await saveFirestoreSignatureConfig(configDoc);
    if (!res.success) {
      return res;
    }

    await logAuditEvent(
      performedBy,
      userRole.toUpperCase(),
      'Signature Saved',
      'Signatures',
      `${employeeName} (${employeeId})`,
      `Signature customization saved in Firestore signatureConfigurations collection.`
    );

    return { 
      success: true, 
      message: 'Signature saved successfully.' 
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to save signature configuration.' };
  }
}

/**
 * Deletes a signature record from Firestore.
 * Enforces RBAC permissions:
 * - ADMIN: can delete any signature
 * - MANAGEMENT: can delete signatures according to permissions
 * - EMPLOYEE: can delete/reset ONLY their own saved signature
 */
export async function deleteSignatureRecord(
  employeeId: string,
  employeeNameOrPerformer: string = 'Employee',
  performedByOrRole: string = 'System Admin',
  userRole: string = 'admin',
  requestingEmployeeId?: string
): Promise<{ success: boolean; message: string }> {
  let employeeName = employeeNameOrPerformer;
  let performedBy = performedByOrRole;
  let role = userRole;

  if (['admin', 'management', 'employee'].includes(performedByOrRole.toLowerCase())) {
    role = performedByOrRole.toLowerCase();
    performedBy = employeeNameOrPerformer;
    employeeName = employeeId;
  }

  try {
    // RBAC validation: Employees cannot delete someone else's signature
    if (role === 'employee' && requestingEmployeeId && requestingEmployeeId.toLowerCase() !== employeeId.toLowerCase()) {
      return {
        success: false,
        message: 'Access Denied: You are not authorized to delete another employee’s signature.'
      };
    }

    await deleteFirestoreSignatureConfig(employeeId);

    await logAuditEvent(
      performedBy,
      role.toUpperCase(),
      'Signature Deleted',
      'Signatures',
      `${employeeName} (${employeeId})`,
      `Signature customization record purged from Firestore. Default master template restored.`
    );

    return {
      success: true,
      message: '✓ Signature deleted successfully.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to delete signature record.'
    };
  }
}
