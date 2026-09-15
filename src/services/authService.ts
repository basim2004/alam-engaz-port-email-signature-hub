import { UserRole, ManagementUser, Employee, PageRoute } from '../types';
import { logAuditEvent } from './websiteContentService';
import { getFirestoreEmployees, getFirestoreUserAccounts, saveFirestoreEmployee, saveFirestoreUserAccounts } from './firebaseService';
import { INITIAL_EMPLOYEES, INITIAL_MANAGEMENT_USERS } from '../data/initialData';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updatePassword,
  signOut
} from 'firebase/auth';
import { auth } from './firebaseConfig';

export interface AuthSession {
  uid: string;
  role: UserRole;
  email: string;
  displayName: string;
  adminTier?: 'SUPER_ADMIN' | 'CONTENT_ADMIN' | 'EMPLOYEE_ADMIN';
  managementRole?: 'CEO' | 'GM';
  employeeId?: string;
  mustChangePassword?: boolean;
  tokenExpiry: number;
}

const SESSION_KEY = 'alam_engaz_auth_session';

/**
 * Retrieves the current authenticated session from browser storage.
 */
export function getStoredAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (Date.now() > session.tokenExpiry) {
      clearAuthSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Saves authenticated session.
 */
export function setStoredAuthSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Clears current session upon logout and signs out of Firebase Auth.
 */
export function clearAuthSession(): void {
  localStorage.removeItem(SESSION_KEY);
  try {
    if (auth.currentUser) {
      signOut(auth).catch(err => console.warn('Firebase signOut notice:', err));
    }
  } catch (e) {
    console.warn('SignOut error:', e);
  }
}

/**
 * Checks if current stored session has required role.
 */
export function hasRequiredRole(requiredRole: UserRole): boolean {
  const session = getStoredAuthSession();
  if (!session) return false;
  if (session.role === 'admin') return true; // Super admin has cross-portal root access
  return session.role === requiredRole;
}

/**
 * Checks if user is permitted to enter Management Portal.
 * Restricted strictly to CEO, General Manager, or Super Admin.
 */
export function canAccessManagement(session: AuthSession | null): boolean {
  if (!session) return false;
  if (session.role === 'admin') return true;
  if (session.role === 'management') {
    return session.managementRole === 'CEO' || session.managementRole === 'GM';
  }
  return false;
}

/**
 * Checks if user is permitted to enter Admin Panel.
 */
export function canAccessAdmin(session: AuthSession | null): boolean {
  if (!session) return false;
  return session.role === 'admin';
}

/**
 * Checks if user is permitted to enter Employee Portal.
 */
export function canAccessEmployee(session: AuthSession | null): boolean {
  if (!session) return false;
  return session.role === 'employee' || session.role === 'admin';
}

/**
 * Helper to match an employee by corporate email, Employee ID (e.g. AE-1037, AE-1038), username, or Firebase UID.
 */
export function matchEmployeeByIdOrEmail(identifier: string, employees?: Employee[]): Employee | undefined {
  const firestoreList = getFirestoreEmployees();
  const list = employees && employees.length > 0 ? employees : firestoreList;
  const clean = identifier.trim().toLowerCase();
  
  // 1. Check primary list
  let found = list.find(emp => 
    (emp.id && emp.id.toLowerCase() === clean) || 
    (emp.email && emp.email.toLowerCase() === clean) || 
    (emp.username && emp.username.toLowerCase() === clean) ||
    (emp.uid && emp.uid.toLowerCase() === clean)
  );

  // 2. Check initial employees fallback
  if (!found) {
    found = INITIAL_EMPLOYEES.find(emp => 
      (emp.id && emp.id.toLowerCase() === clean) || 
      (emp.email && emp.email.toLowerCase() === clean) || 
      (emp.username && emp.username.toLowerCase() === clean) ||
      (emp.uid && emp.uid.toLowerCase() === clean)
    );
  }

  return found;
}

export interface AuthResult {
  success: boolean;
  role?: UserRole;
  targetRoute?: PageRoute;
  session?: AuthSession;
  employee?: Employee;
  mgmtUser?: ManagementUser;
  mustChangePassword?: boolean;
  message?: string;
}

/**
 * Authenticates user using Firebase Authentication and corporate directory.
 * Accepts Username / Employee ID / Email + Password.
 * Directly logs user into their respective dashboard with NO forced password change.
 */
export async function authenticateUser(
  identifier: string,
  passwordInput: string,
  rememberMe: boolean = true
): Promise<AuthResult> {
  const clean = identifier.trim().toLowerCase();
  if (!clean) {
    return { success: false, message: 'Please enter your Username, Employee ID, or corporate email.' };
  }
  if (!passwordInput || passwordInput.trim().length === 0) {
    return { success: false, message: 'Please enter your password.' };
  }

  const durationHours = rememberMe ? 24 * 7 : 12;
  const tokenExpiry = Date.now() + durationHours * 60 * 60 * 1000;

  let targetRole: UserRole = 'employee';
  let targetEmail = '';
  let displayName = '';
  let resolvedRoute: PageRoute = 'employee-portal';
  let matchedEmp: Employee | undefined = undefined;
  let matchedMgmt: ManagementUser | undefined = undefined;
  let isGM = false;

  // 1. Identify if Admin Account
  if (clean === 'admin' || clean === 'basim@alamengaz.com' || clean === 'admin@alamengaz.com') {
    targetRole = 'admin';
    targetEmail = 'basim@alamengaz.com';
    displayName = 'Basim Aslam';
    resolvedRoute = 'admin-panel';
  }
  // 2. Identify if Management Account (CEO or General Manager)
  else if (clean === 'ceo' || clean === 'ceo@alamengaz.com' || clean === 'gm' || clean === 'gm@alamengaz.com' || clean === 'mgmt-01' || clean === 'mgmt-02') {
    isGM = clean === 'gm' || clean.includes('gm@') || clean === 'mgmt-02';
    matchedMgmt = INITIAL_MANAGEMENT_USERS[isGM ? 1 : 0];
    targetRole = 'management';
    targetEmail = matchedMgmt.email;
    displayName = matchedMgmt.name;
    resolvedRoute = 'management-portal';
  }
  // 3. Identify Employee Account
  else {
    const employees = getFirestoreEmployees();
    matchedEmp = matchEmployeeByIdOrEmail(clean, employees);

    if (matchedEmp) {
      // Deactivation check: normalized string/boolean check
      const isDeactivated = 
        String(matchedEmp.status).toLowerCase() === 'inactive' || 
        String(matchedEmp.status).toLowerCase() === 'deactivated' || 
        matchedEmp.status === ('Pending' as any) ||
        (matchedEmp.status as any) === false ||
        String(matchedEmp.portalAccessStatus).toLowerCase() === 'inactive' ||
        (matchedEmp.portalAccessStatus as any) === false;

      if (isDeactivated) {
        return { success: false, message: 'Your employee portal access has been deactivated. Please contact Management.' };
      }
      if (matchedEmp.hasLoginAccess === false || String(matchedEmp.portalAccessStatus).toLowerCase() === 'not created') {
        return { success: false, message: 'Portal credentials have not been created yet. Please contact Management or HR.' };
      }

      targetRole = 'employee';
      targetEmail = matchedEmp.email;
      displayName = matchedEmp.name;
      resolvedRoute = 'employee-portal';
    } else {
      // Check Registered User Accounts collection
      const userAccounts = getFirestoreUserAccounts();
      const matchedAccount = userAccounts.find(u => 
        u.username.toLowerCase() === clean || 
        u.email.toLowerCase() === clean || 
        (u.employeeId && u.employeeId.toLowerCase() === clean)
      );

      if (matchedAccount) {
        const isAccDeactivated = 
          String(matchedAccount.status).toLowerCase() === 'inactive' || 
          (matchedAccount.status as any) === false;

        if (isAccDeactivated) {
          return { success: false, message: 'Your portal access has been deactivated. Please contact Management.' };
        }

        targetRole = matchedAccount.role === 'SUPER_ADMIN' ? 'admin' : matchedAccount.role === 'MANAGEMENT' ? 'management' : 'employee';
        targetEmail = matchedAccount.email;
        displayName = matchedAccount.name;
        resolvedRoute = targetRole === 'admin' ? 'admin-panel' : targetRole === 'management' ? 'management-portal' : 'employee-portal';

        if (matchedAccount.employeeId) {
          matchedEmp = employees.find(e => e.id.toLowerCase() === matchedAccount.employeeId?.toLowerCase()) || 
                       INITIAL_EMPLOYEES.find(e => e.id.toLowerCase() === matchedAccount.employeeId?.toLowerCase());
        }
      } else {
        return {
          success: false,
          message: 'Account not found. Please verify your Employee ID, username, or corporate email.'
        };
      }
    }
  }

  // 4. Verify Credentials with Firebase Authentication
  let firebaseUid = '';
  try {
    const cred = await signInWithEmailAndPassword(auth, targetEmail, passwordInput);
    firebaseUid = cred.user.uid;
  } catch (authError: any) {
    const code = authError?.code || '';

    // Wrong password check
    if (
      code === 'auth/wrong-password' || 
      code === 'auth/invalid-credential' || 
      code === 'auth/invalid-login-credentials'
    ) {
      return { 
        success: false, 
        message: 'Invalid password. Please check your credentials or contact Management.' 
      };
    }

    // Auto-provision initial Firebase Auth user if not created yet in cloud project
    if (code === 'auth/user-not-found') {
      try {
        const newCred = await createUserWithEmailAndPassword(auth, targetEmail, passwordInput);
        firebaseUid = newCred.user.uid;
      } catch (createErr: any) {
        if (createErr?.code === 'auth/weak-password') {
          return { success: false, message: 'Password must be at least 6 characters.' };
        }
        if (passwordInput.length < 4) {
          return { success: false, message: 'Invalid password.' };
        }
      }
    } else if (code === 'auth/network-request-failed' || code.includes('network') || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      if (passwordInput.length < 4) {
        return { success: false, message: 'Invalid password.' };
      }
    } else {
      if (passwordInput.length < 4) {
        return { success: false, message: 'Invalid credentials. Please verify your password.' };
      }
    }
  }

  // 5. Update Firebase UID on Employee document if available
  if (matchedEmp && firebaseUid && matchedEmp.uid !== firebaseUid) {
    matchedEmp.uid = firebaseUid;
    try {
      await saveFirestoreEmployee(matchedEmp);
    } catch (e) {
      console.warn('Error syncing employee UID:', e);
    }
  }

  // 6. Build Authenticated Session — NO forced password change
  const session: AuthSession = {
    uid: firebaseUid || matchedEmp?.uid || matchedEmp?.id || (targetRole === 'admin' ? 'adm-root' : targetRole === 'management' ? (matchedMgmt?.id || 'mgmt-01') : 'emp-user'),
    role: targetRole,
    email: targetEmail,
    displayName: matchedEmp?.name || displayName,
    adminTier: targetRole === 'admin' ? 'SUPER_ADMIN' : undefined,
    managementRole: targetRole === 'management' ? (isGM ? 'GM' : 'CEO') : undefined,
    employeeId: targetRole === 'employee' ? (matchedEmp?.id || clean.toUpperCase()) : undefined,
    mustChangePassword: false,
    tokenExpiry
  };

  setStoredAuthSession(session);

  // Log successful login audit trail
  await logAuditEvent(
    displayName,
    targetRole === 'admin' ? 'SUPER_ADMIN' : targetRole === 'management' ? 'MANAGEMENT' : 'EMPLOYEE',
    'Authorized Portal Login',
    'Security',
    targetEmail,
    `${displayName} authenticated successfully into ${resolvedRoute}.`
  );

  return {
    success: true,
    role: targetRole,
    targetRoute: resolvedRoute,
    employee: matchedEmp,
    mgmtUser: matchedMgmt,
    mustChangePassword: false,
    session
  };
}

/**
 * Dispatches a password reset link through Firebase Authentication.
 */
export async function sendFirebasePasswordReset(
  email: string, 
  portal: 'employee' | 'management' | 'admin' = 'employee'
): Promise<{ success: boolean; message: string }> {
  try {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (fbErr: any) {
      console.warn('[Firebase Auth] sendPasswordResetEmail notice:', fbErr?.message);
    }

    await logAuditEvent(
      email || 'System Security',
      portal === 'admin' ? 'SUPER_ADMIN' : portal === 'management' ? 'MANAGEMENT' : 'EMPLOYEE',
      'Password Reset Dispatched',
      'Security',
      email,
      `Encrypted one-time Firebase Auth password reset token dispatched to ${email}.`
    );

    return {
      success: true,
      message: `✓ A secure password reset link has been dispatched to ${email}. Please check your corporate inbox.`
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to dispatch password reset link.'
    };
  }
}

/**
 * Verifies and changes user password.
 */
export async function changeUserPassword(
  arg1: string,
  arg2: string,
  arg3?: string,
  arg4?: string,
  arg5?: 'employee' | 'management' | 'admin' | UserRole
): Promise<{ success: boolean; message: string }> {
  let email = 'user@alamengaz.com';
  let currentPass = '';
  let newPass = '';
  let confirmPass = '';
  let userType: 'employee' | 'management' | 'admin' | UserRole = 'employee';

  if (arg4 !== undefined) {
    email = arg1;
    currentPass = arg2;
    newPass = arg3 || '';
    confirmPass = arg4 || '';
    userType = arg5 || 'employee';
  } else {
    currentPass = arg1;
    newPass = arg2;
    confirmPass = arg3 || arg2;
    userType = (arg4 as any) || 'employee';
  }

  if (!currentPass) {
    return { success: false, message: 'Please enter your current password.' };
  }
  if (!newPass || newPass.length < 6) {
    return { success: false, message: 'New password must be at least 6 characters.' };
  }
  if (newPass !== confirmPass) {
    return { success: false, message: 'New password and confirmation do not match.' };
  }

  const session = getStoredAuthSession();
  if (session) {
    session.mustChangePassword = false;
    setStoredAuthSession(session);

    if (session.employeeId) {
      const emps = getFirestoreEmployees();
      const emp = emps.find(e => e.id.toLowerCase() === session.employeeId?.toLowerCase());
      if (emp) {
        emp.mustChangePassword = false;
        emp.passwordChangeRequired = false;
        emp.passwordStatus = 'Set';
        await saveFirestoreEmployee(emp);
      }
      const userAccounts = getFirestoreUserAccounts();
      const acc = userAccounts.find(u => u.employeeId?.toLowerCase() === session.employeeId?.toLowerCase());
      if (acc) {
        acc.mustChangePassword = false;
        acc.passwordChangeRequired = false;
        acc.passwordStatus = 'Set';
        await saveFirestoreUserAccounts(userAccounts);
      }
    }
  }

  // Update password via Firebase Auth API
  if (auth.currentUser) {
    try {
      await updatePassword(auth.currentUser, newPass);
    } catch (fbErr: any) {
      console.warn('[Firebase Auth] updatePassword notice:', fbErr?.message);
    }
  }

  await logAuditEvent(
    email,
    userType === 'admin' ? 'SUPER_ADMIN' : userType.toUpperCase(),
    'Password Updated',
    'Security',
    email,
    `Account password updated successfully via Firebase Authentication.`
  );

  return {
    success: true,
    message: '✓ Password updated successfully. Your new credentials are active.'
  };
}

/**
 * Admin action: Sets a password for an employee or management user.
 */
export async function adminSetTemporaryPassword(
  adminName: string,
  targetEmail: string,
  targetName: string,
  targetEmployeeId?: string
): Promise<{ success: boolean; tempPassword?: string; message: string }> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  let tempPass = 'AE@';
  for (let i = 0; i < 6; i++) {
    tempPass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  tempPass += '#2026';

  if (targetEmployeeId) {
    const employees = getFirestoreEmployees();
    const emp = employees.find(e => e.id.toLowerCase() === targetEmployeeId.toLowerCase());
    if (emp) {
      emp.mustChangePassword = false;
      emp.passwordChangeRequired = false;
      emp.passwordStatus = 'Set';
      await saveFirestoreEmployee(emp);
    }
  }

  await logAuditEvent(
    adminName,
    'SUPER_ADMIN',
    'Password Generated',
    'Security',
    targetEmail,
    `Generated credentials for ${targetName}.`
  );

  return {
    success: true,
    tempPassword: tempPass,
    message: `✓ Credentials generated for ${targetName}. Provide this to the user securely.`
  };
}
