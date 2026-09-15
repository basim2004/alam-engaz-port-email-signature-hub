import { Employee, UserAccount } from '../types';
import {
  getFirestoreEmployees,
  saveFirestoreEmployee,
  getFirestoreUserAccounts,
  saveFirestoreUserAccounts
} from './firebaseService';
import { logAuditEvent } from './websiteContentService';

/**
 * Generates an executive-grade, readable password.
 * Format: AE@[4-digits]#[year] (e.g., AE@4827#2026)
 */
export function generateSecureTempPassword(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const currentYear = new Date().getFullYear();
  return `AE@${randomDigits}#${currentYear}`;
}

/**
 * Cleans phone number for international WhatsApp link.
 * Handles '+966 54 69 79 474' -> '966546979474', or '05XXXXXXXX' -> '9665XXXXXXXX'
 */
export function sanitizeWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('05')) {
    digits = '966' + digits.substring(1);
  } else if (digits.startsWith('5') && digits.length === 9) {
    digits = '966' + digits;
  }
  return digits;
}

/**
 * Formats the official ALAM ENGAZ WhatsApp message for credential delivery.
 */
export function formatWhatsAppLoginMessage(params: {
  employeeName: string;
  username: string;
  tempPassword?: string;
  portalUrl?: string;
}): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.alamengaz.com';
  const url = params.portalUrl || origin;

  return `Hello ${params.employeeName.toUpperCase()},

Your ALAM ENGAZ Employee Portal account is ready.

You can now access your personal Employee Portal.

Portal:
${url}

Username / Employee ID:
${params.username}

Password:
${params.tempPassword || '••••••••'}

This portal is your personal ALAM ENGAZ Employee Portal for accessing your profile, official email signature, Signature Studio, installation guides and related tools.

Regards,
ALAM ENGAZ PORT SERVICES CO.`;
}

/**
 * Prepares and opens WhatsApp in a new tab with the pre-filled message.
 * Does NOT auto-send; allows CEO/GM to review before pressing send.
 */
export function openWhatsAppWithCredentials(params: {
  employeeName: string;
  username: string;
  tempPassword?: string;
  whatsappNumber: string;
  portalUrl?: string;
  actorName?: string;
  actorRole?: string;
}): { success: boolean; url?: string; message: string } {
  const cleanNumber = sanitizeWhatsAppNumber(params.whatsappNumber);
  if (!cleanNumber) {
    return {
      success: false,
      message: 'WhatsApp number not available. Please provide a valid mobile number with country code.'
    };
  }

  const messageText = formatWhatsAppLoginMessage({
    employeeName: params.employeeName,
    username: params.username,
    tempPassword: params.tempPassword,
    portalUrl: params.portalUrl
  });

  const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageText)}`;

  logAuditEvent(
    params.actorName || 'Management',
    (params.actorRole as any) || 'MANAGEMENT',
    'WhatsApp Delivery Prepared',
    'Security',
    params.whatsappNumber,
    `Login details prepared for WhatsApp delivery to ${params.employeeName} (${params.whatsappNumber}).`
  );

  if (typeof window !== 'undefined') {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }

  return {
    success: true,
    url: waUrl,
    message: '✓ WhatsApp opened with pre-filled login credentials for review.'
  };
}

/**
 * Creates login credentials for an employee.
 * The credentials remain active directly without forced first-login change.
 */
export async function createEmployeeCredentials(params: {
  employeeId: string;
  username?: string;
  tempPassword: string;
  whatsappNumber?: string;
  actorName?: string;
  actorRole?: string;
}): Promise<{ success: boolean; employee?: Employee; message: string }> {
  const employees = getFirestoreEmployees();
  const empIndex = employees.findIndex(e => e.id.toLowerCase() === params.employeeId.toLowerCase());
  if (empIndex < 0) {
    return { success: false, message: `Employee ID ${params.employeeId} not found.` };
  }

  const employee = employees[empIndex];
  const finalUsername = (params.username || employee.id).trim().toUpperCase();
  const now = new Date().toISOString();
  const finalWhatsApp = params.whatsappNumber || employee.whatsappNumber || employee.phone;

  // Update employee record — directly active credentials
  employee.username = finalUsername;
  employee.hasLoginAccess = true;
  employee.portalAccessStatus = 'Active';
  employee.passwordStatus = 'Set';
  employee.mustChangePassword = false;
  employee.passwordChangeRequired = false;
  if (params.whatsappNumber) {
    employee.whatsappNumber = params.whatsappNumber;
  }
  employee.updatedAt = now;

  await saveFirestoreEmployee(employee);

  // Sync to UserAccounts collection
  const userAccounts = getFirestoreUserAccounts();
  const existingIdx = userAccounts.findIndex(u =>
    (u.employeeId && u.employeeId.toLowerCase() === employee.id.toLowerCase()) ||
    u.username.toLowerCase() === finalUsername.toLowerCase() ||
    u.email.toLowerCase() === employee.email.toLowerCase()
  );

  const accountRecord: UserAccount = {
    id: `USR-EMP-${employee.id}`,
    name: employee.name,
    username: finalUsername,
    employeeId: employee.id,
    email: employee.email,
    role: 'EMPLOYEE',
    status: 'Active',
    lastLogin: 'Never',
    createdAt: now.split('T')[0],
    updatedAt: now,
    department: employee.department,
    mustChangePassword: false,
    passwordChangeRequired: false,
    passwordStatus: 'Set',
    whatsappNumber: finalWhatsApp
  };

  if (existingIdx >= 0) {
    userAccounts[existingIdx] = { ...userAccounts[existingIdx], ...accountRecord };
  } else {
    userAccounts.push(accountRecord);
  }

  await saveFirestoreUserAccounts(userAccounts);

  await logAuditEvent(
    params.actorName || 'Management',
    (params.actorRole as any) || 'MANAGEMENT',
    'Employee Credentials Created',
    'Security',
    employee.email,
    `${params.actorRole || 'Management'} created portal credentials for ${employee.name} (Username: ${finalUsername}).`
  );

  return {
    success: true,
    employee,
    message: 'Employee portal account created successfully.'
  };
}

/**
 * Resets employee password and generates a valid active password.
 */
export async function resetEmployeeCredentials(params: {
  employeeId: string;
  actorName?: string;
  actorRole?: string;
}): Promise<{ success: boolean; tempPassword?: string; employee?: Employee; message: string }> {
  const employees = getFirestoreEmployees();
  const employee = employees.find(e => e.id.toLowerCase() === params.employeeId.toLowerCase());
  if (!employee) {
    return { success: false, message: `Employee ID ${params.employeeId} not found.` };
  }

  const tempPass = generateSecureTempPassword();
  const now = new Date().toISOString();

  employee.hasLoginAccess = true;
  employee.portalAccessStatus = 'Active';
  employee.passwordStatus = 'Set';
  employee.mustChangePassword = false;
  employee.passwordChangeRequired = false;
  employee.updatedAt = now;

  await saveFirestoreEmployee(employee);

  // Sync to UserAccounts
  const userAccounts = getFirestoreUserAccounts();
  const acc = userAccounts.find(u => u.employeeId?.toLowerCase() === employee.id.toLowerCase());
  if (acc) {
    acc.mustChangePassword = false;
    acc.passwordChangeRequired = false;
    acc.passwordStatus = 'Set';
    acc.updatedAt = now;
    await saveFirestoreUserAccounts(userAccounts);
  }

  // Audit Log
  await logAuditEvent(
    params.actorName || 'Management',
    (params.actorRole as any) || 'MANAGEMENT',
    'Password Reset',
    'Security',
    employee.email,
    `${params.actorRole || 'Management'} reset portal password for ${employee.name}.`
  );

  return {
    success: true,
    tempPassword: tempPass,
    employee,
    message: `✓ Credentials generated for ${employee.name}.`
  };
}

/**
 * Toggles account status (Active <-> Inactive).
 */
export async function toggleEmployeeAccountStatus(params: {
  employeeId: string;
  status: 'Active' | 'Inactive';
  actorName?: string;
  actorRole?: string;
}): Promise<{ success: boolean; employee?: Employee; message: string }> {
  const employees = getFirestoreEmployees();
  const employee = employees.find(e => e.id.toLowerCase() === params.employeeId.toLowerCase());
  if (!employee) {
    return { success: false, message: `Employee ID ${params.employeeId} not found.` };
  }

  const now = new Date().toISOString();
  employee.portalAccessStatus = params.status;
  employee.updatedAt = now;
  await saveFirestoreEmployee(employee);

  const userAccounts = getFirestoreUserAccounts();
  const acc = userAccounts.find(u => u.employeeId?.toLowerCase() === employee.id.toLowerCase());
  if (acc) {
    acc.status = params.status;
    acc.updatedAt = now;
    await saveFirestoreUserAccounts(userAccounts);
  }

  await logAuditEvent(
    params.actorName || 'Management',
    (params.actorRole as any) || 'MANAGEMENT',
    params.status === 'Active' ? 'Account Activated' : 'Account Deactivated',
    'Security',
    employee.email,
    `${params.actorRole || 'Management'} ${params.status === 'Active' ? 'activated' : 'deactivated'} portal access for ${employee.name}.`
  );

  return {
    success: true,
    employee,
    message: `✓ Portal access ${params.status.toLowerCase()} for ${employee.name}.`
  };
}

/**
 * Revokes / Deletes employee portal login access without deleting the employee profile.
 */
export async function deleteEmployeePortalAccess(params: {
  employeeId: string;
  actorName?: string;
  actorRole?: string;
}): Promise<{ success: boolean; employee?: Employee; message: string }> {
  const employees = getFirestoreEmployees();
  const employee = employees.find(e => e.id.toLowerCase() === params.employeeId.toLowerCase());
  if (!employee) {
    return { success: false, message: `Employee ID ${params.employeeId} not found.` };
  }

  const now = new Date().toISOString();
  employee.hasLoginAccess = false;
  employee.portalAccessStatus = 'Not Created';
  employee.passwordStatus = 'Not Set';
  employee.mustChangePassword = false;
  employee.passwordChangeRequired = false;
  employee.updatedAt = now;

  await saveFirestoreEmployee(employee);

  // Remove from UserAccounts
  const userAccounts = getFirestoreUserAccounts();
  const filtered = userAccounts.filter(u => u.employeeId?.toLowerCase() !== employee.id.toLowerCase());
  await saveFirestoreUserAccounts(filtered);

  await logAuditEvent(
    params.actorName || 'Management',
    (params.actorRole as any) || 'MANAGEMENT',
    'Portal Access Deleted',
    'Security',
    employee.email,
    `${params.actorRole || 'Management'} deleted portal access for ${employee.name}.`
  );

  return {
    success: true,
    employee,
    message: `✓ Portal access deleted for ${employee.name}. Employee profile retained in database.`
  };
}

/**
 * Updates WhatsApp Number for an employee.
 */
export async function updateEmployeeWhatsAppNumber(params: {
  employeeId: string;
  whatsappNumber: string;
  actorName?: string;
  actorRole?: string;
}): Promise<{ success: boolean; employee?: Employee; message: string }> {
  const employees = getFirestoreEmployees();
  const employee = employees.find(e => e.id.toLowerCase() === params.employeeId.toLowerCase());
  if (!employee) {
    return { success: false, message: `Employee ID ${params.employeeId} not found.` };
  }

  const now = new Date().toISOString();
  employee.whatsappNumber = params.whatsappNumber;
  employee.updatedAt = now;
  await saveFirestoreEmployee(employee);

  const userAccounts = getFirestoreUserAccounts();
  const acc = userAccounts.find(u => u.employeeId?.toLowerCase() === employee.id.toLowerCase());
  if (acc) {
    acc.whatsappNumber = params.whatsappNumber;
    acc.updatedAt = now;
    await saveFirestoreUserAccounts(userAccounts);
  }

  return {
    success: true,
    employee,
    message: `✓ WhatsApp number updated for ${employee.name}.`
  };
}
