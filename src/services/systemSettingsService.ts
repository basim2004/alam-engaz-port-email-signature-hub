import { Employee, ActivityLog } from '../types';
import { GuideItem } from '../data/supportData';

export interface SystemStatusState {
  website: 'Online' | 'Offline';
  database: 'Connected' | 'Disconnected';
  authentication: 'Active' | 'Inactive';
  storage: 'Active' | 'Degraded';
  overallStatus: 'Operational' | 'Degraded' | 'Maintenance';
}

export interface AppInfoState {
  version: string;
  status: string;
  lastUpdated: string;
  environment: 'Production' | 'Development' | 'Staging';
  firebaseProject: string;
}

export interface GeneralSettingsState {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  defaultLocation: string;
}

export interface BrandThemeSettingsState {
  primaryColor: string;
  secondaryColor: string;
  faviconUrl: string;
  themeMode: 'Light (Default)' | 'Dark' | 'System Sync';
  companyLogoUrl: string;
}

export interface SecuritySettingsState {
  enableEmailAuth: boolean;
  requireStrongPasswords: boolean;
  enableTwoFactor: boolean;
  sessionTimeoutHours: number;
  passwordExpiryDays: number;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Content Admin' | 'Employee Admin';
  status: 'Active' | 'Pending' | 'Inactive';
  createdAt?: string;
}

export interface ActivityLogSettingsState {
  logEmployeeChanges: boolean;
  logSignatureGen: boolean;
  logGuideDownloads: boolean;
  logAdminActions: boolean;
  retainLogsDays: number;
}

export interface BackupRecordState {
  lastBackupTime: string;
  status: 'Success' | 'In Progress' | 'Failed';
}

export interface AllSystemSettings {
  general: GeneralSettingsState;
  brand: BrandThemeSettingsState;
  security: SecuritySettingsState;
  activityLogSettings: ActivityLogSettingsState;
  adminUsers: AdminUserRecord[];
  backup: BackupRecordState;
}

const STORAGE_KEY = 'alamengaz_system_settings_v1';

export const DEFAULT_SETTINGS: AllSystemSettings = {
  general: {
    siteName: 'ALAM ENGAZ Email Signature Hub',
    siteDescription: 'Official email signature management system for ALAM ENGAZ Port Services Co.',
    supportEmail: 'it@alamengaz.com',
    defaultLocation: 'Dammam, Saudi Arabia'
  },
  brand: {
    primaryColor: '#B30000',
    secondaryColor: '#0A2B52',
    faviconUrl: '/assets/logo.png',
    themeMode: 'Light (Default)',
    companyLogoUrl: '/assets/logo.png'
  },
  security: {
    enableEmailAuth: true,
    requireStrongPasswords: true,
    enableTwoFactor: false,
    sessionTimeoutHours: 8,
    passwordExpiryDays: 90
  },
  activityLogSettings: {
    logEmployeeChanges: true,
    logSignatureGen: true,
    logGuideDownloads: true,
    logAdminActions: true,
    retainLogsDays: 365
  },
  adminUsers: [
    {
      id: 'adm-001',
      name: 'Basim Aslam',
      email: 'basim@alamengaz.com',
      role: 'Super Admin',
      status: 'Active',
      createdAt: '2026-01-10'
    }
  ],
  backup: {
    lastBackupTime: 'Aug 22, 2026 10:15 PM',
    status: 'Success'
  }
};

/**
 * Load system settings from persistent storage (simulating Firestore document fetch)
 */
export async function loadSystemSettings(): Promise<AllSystemSettings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        general: { ...DEFAULT_SETTINGS.general, ...(parsed.general || {}) },
        brand: { ...DEFAULT_SETTINGS.brand, ...(parsed.brand || {}) },
        security: { ...DEFAULT_SETTINGS.security, ...(parsed.security || {}) },
        activityLogSettings: { ...DEFAULT_SETTINGS.activityLogSettings, ...(parsed.activityLogSettings || {}) },
        adminUsers: parsed.adminUsers && parsed.adminUsers.length > 0 ? parsed.adminUsers : DEFAULT_SETTINGS.adminUsers,
        backup: { ...DEFAULT_SETTINGS.backup, ...(parsed.backup || {}) }
      };
    }
  } catch (err) {
    console.warn('Could not read saved system settings, fallback to defaults:', err);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Save system settings to persistent storage (simulating Firestore setDoc)
 */
export async function saveSystemSettings(settings: AllSystemSettings): Promise<void> {
  // Simulate network latency like a real Firestore update
  await new Promise(res => setTimeout(res, 250));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/**
 * Helper to download text or data as a file in the browser
 */
export function triggerFileDownload(content: string, filename: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Export Employees as CSV file
 */
export function exportEmployeesCsv(employees: Employee[]) {
  const headers = ['ID', 'Name', 'Job Title', 'Department', 'Email', 'Phone', 'Office', 'Status', 'CreatedAt'];
  const rows = employees.map(emp => [
    `"${emp.id}"`,
    `"${emp.name.replace(/"/g, '""')}"`,
    `"${emp.jobTitle.replace(/"/g, '""')}"`,
    `"${emp.department.replace(/"/g, '""')}"`,
    `"${emp.email}"`,
    `"${emp.phone}"`,
    `"${emp.office.replace(/"/g, '""')}"`,
    `"${emp.status}"`,
    `"${emp.createdAt}"`
  ]);
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  triggerFileDownload(csvContent, `ALAM_ENGAZ_Employees_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8');
}

/**
 * Export Guides as JSON file
 */
export function exportGuidesJson(guides: GuideItem[]) {
  const json = JSON.stringify(guides, null, 2);
  triggerFileDownload(json, `ALAM_ENGAZ_Guides_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
}

/**
 * Export Activity Logs as CSV file
 */
export function exportActivityLogsCsv(logs: ActivityLog[]) {
  const headers = ['Log ID', 'User', 'Action', 'Timestamp', 'Details'];
  const rows = logs.map(log => [
    `"${log.id}"`,
    `"${log.user.replace(/"/g, '""')}"`,
    `"${log.action.replace(/"/g, '""')}"`,
    `"${log.timestamp}"`,
    `"${log.details.replace(/"/g, '""')}"`
  ]);
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  triggerFileDownload(csvContent, `ALAM_ENGAZ_Activity_Logs_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8');
}

/**
 * Create a complete system backup JSON export excluding any sensitive credentials
 */
export function exportFullBackupJson(
  settings: AllSystemSettings,
  employees: Employee[],
  guides: GuideItem[],
  logs: ActivityLog[]
) {
  const backupPayload = {
    backupMetadata: {
      system: 'ALAM ENGAZ EMAIL SIGNATURE HUB',
      organization: 'ALAM ENGAZ PORT SERVICES CO.',
      generatedAt: new Date().toISOString(),
      version: 'v1.0.0',
      environment: 'Production',
      firebaseProject: 'alamengaz-signature-hub'
    },
    systemSettings: {
      general: settings.general,
      brand: settings.brand,
      security: {
        enableEmailAuth: settings.security.enableEmailAuth,
        requireStrongPasswords: settings.security.requireStrongPasswords,
        enableTwoFactor: settings.security.enableTwoFactor,
        sessionTimeoutHours: settings.security.sessionTimeoutHours,
        passwordExpiryDays: settings.security.passwordExpiryDays
      },
      activityLogSettings: settings.activityLogSettings,
      adminUsers: settings.adminUsers.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status }))
    },
    employees: employees,
    guidesCatalog: guides,
    activityLogs: logs
  };

  const json = JSON.stringify(backupPayload, null, 2);
  const filename = `ALAM_ENGAZ_Full_System_Backup_${new Date().toISOString().split('T')[0]}.json`;
  triggerFileDownload(json, filename, 'application/json');
}
