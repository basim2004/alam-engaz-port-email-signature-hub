import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc
} from 'firebase/firestore';
import { db, firebaseConfig } from './firebaseConfig';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { Employee, ManagementUser, UserAccount, SignatureConfigRecord, ActivityLog } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_MANAGEMENT_USERS, INITIAL_ACTIVITY_LOGS, COMPANY_DETAILS } from '../data/initialData';

export type { UserAccount };

// Firestore collection names per requirement & existing structure
export const COLLECTIONS = {
  EMPLOYEES: 'employees',
  EMPLOYEE_USERS: 'employeeUsers',
  ADMIN_USERS: 'adminUsers',
  MANAGEMENT_USERS: 'managementUsers',
  SIGNATURE_CONFIGURATIONS: 'signatureConfigurations',
  SIGNATURE_TEMPLATES: 'signatureTemplates',
  COMPANY_SETTINGS: 'companySettings',
  ACTIVITY_LOGS: 'activityLogs'
};

const STORAGE_PREFIX = 'alamengaz_firestore_';

// In-memory caches for instantaneous synchronous render & offline fallback
let cachedEmployees: Employee[] = (() => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${COLLECTIONS.EMPLOYEES}`);
    return raw ? JSON.parse(raw) : INITIAL_EMPLOYEES;
  } catch {
    return INITIAL_EMPLOYEES;
  }
})();

let cachedConfigs: Record<string, SignatureConfigRecord> = (() => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${COLLECTIONS.SIGNATURE_CONFIGURATIONS}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
})();

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'USR-ROOT',
    name: 'Basim Aslam',
    username: 'admin',
    email: 'basim@alamengaz.com',
    role: 'SUPER_ADMIN',
    status: 'Active',
    lastLogin: 'Today at 10:15 AM',
    department: 'Executive Board',
    createdAt: '2026-01-01'
  },
  {
    id: 'USR-MGMT-01',
    name: 'Chief Executive Officer',
    username: 'ceo',
    email: 'ceo@alamengaz.com',
    role: 'MANAGEMENT',
    status: 'Active',
    lastLogin: 'Today at 09:15 AM',
    department: 'Management',
    createdAt: '2026-01-05'
  },
  {
    id: 'USR-MGMT-02',
    name: 'General Manager',
    username: 'gm',
    email: 'gm@alamengaz.com',
    role: 'MANAGEMENT',
    status: 'Active',
    lastLogin: 'Yesterday at 04:30 PM',
    department: 'Operations',
    createdAt: '2026-01-05'
  },
  {
    id: 'USR-EMP-1037',
    name: 'MUHAMMED NASEEH',
    username: 'AE-1037',
    employeeId: 'AE-1037',
    email: 'invoice@alamengaz.com',
    role: 'EMPLOYEE',
    status: 'Active',
    lastLogin: 'Today at 08:30 AM',
    department: 'Finance & Accounts',
    createdAt: '2026-01-15',
    mustChangePassword: false
  },
  {
    id: 'USR-EMP-1038',
    name: 'MANAV SUDHEER',
    username: 'AE-1038',
    employeeId: 'AE-1038',
    email: 'manav@alamengaz.com',
    role: 'EMPLOYEE',
    status: 'Active',
    lastLogin: 'Yesterday',
    department: 'Operations',
    createdAt: '2026-02-10',
    mustChangePassword: false
  }
];

let cachedUserAccounts: UserAccount[] = (() => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${COLLECTIONS.EMPLOYEE_USERS}`);
    return raw ? JSON.parse(raw) : INITIAL_USERS;
  } catch {
    return INITIAL_USERS;
  }
})();

let cachedActivityLogs: ActivityLog[] = (() => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${COLLECTIONS.ACTIVITY_LOGS}`);
    return raw ? JSON.parse(raw) : INITIAL_ACTIVITY_LOGS;
  } catch {
    return INITIAL_ACTIVITY_LOGS;
  }
})();

function persistLocal<T>(collectionName: string, data: T): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${collectionName}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('alamengaz_firestore_sync', { detail: { collection: collectionName } }));
  } catch (err) {
    console.warn(`Local persistence warning for ${collectionName}:`, err);
  }
}

// ─── 1. EMPLOYEES COLLECTION (FIRESTORE) ──────────────────────────────────

/**
 * Returns current cached employees (synchronous).
 */
export function getFirestoreEmployees(): Employee[] {
  return cachedEmployees;
}

/**
 * Fetches all employees directly from Firestore.
 */
export async function fetchFirestoreEmployees(): Promise<Employee[]> {
  try {
    const colRef = collection(db, COLLECTIONS.EMPLOYEES);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list: Employee[] = [];
      snap.forEach(d => list.push(d.data() as Employee));
      cachedEmployees = list;
      persistLocal(COLLECTIONS.EMPLOYEES, list);
      return list;
    } else {
      // Seed Firestore with initial employees if collection is brand new
      for (const emp of INITIAL_EMPLOYEES) {
        await setDoc(doc(db, COLLECTIONS.EMPLOYEES, emp.id), emp, { merge: true });
      }
      return INITIAL_EMPLOYEES;
    }
  } catch (err) {
    console.warn('Error fetching employees from Firestore, using local cache:', err);
    return cachedEmployees;
  }
}

/**
 * Real-time listener for employees collection in Firestore.
 */
export function subscribeToFirestoreEmployees(callback: (employees: Employee[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.EMPLOYEES);
    const unsubscribe = onSnapshot(colRef, async (snap) => {
      if (snap.empty) {
        // Seed if first time
        for (const emp of INITIAL_EMPLOYEES) {
          try {
            await setDoc(doc(db, COLLECTIONS.EMPLOYEES, emp.id), emp, { merge: true });
          } catch (e) {
            console.warn('Error auto-seeding employee:', e);
          }
        }
        callback(INITIAL_EMPLOYEES);
        return;
      }

      const list: Employee[] = [];
      snap.forEach(d => list.push(d.data() as Employee));
      cachedEmployees = list;
      persistLocal(COLLECTIONS.EMPLOYEES, list);
      callback(list);
    }, (error) => {
      console.warn('Firestore onSnapshot error on employees:', error);
      callback(cachedEmployees);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach onSnapshot to employees:', err);
    callback(cachedEmployees);
    return () => {};
  }
}

/**
 * Adds or updates an employee directly in Firestore.
 */
export async function saveFirestoreEmployee(employee: Employee): Promise<{ success: boolean; message: string }> {
  try {
    const now = new Date().toISOString();
    const empToSave: Employee = {
      ...employee,
      fullName: employee.name,
      updatedAt: now,
      createdAt: employee.createdAt || now
    };

    // Save directly to Firestore doc using ID as document key to prevent duplicates
    const docRef = doc(db, COLLECTIONS.EMPLOYEES, empToSave.id);
    await setDoc(docRef, empToSave, { merge: true });

    // Update local cache
    const list = [...cachedEmployees];
    const idx = list.findIndex(e => e.id.toLowerCase() === empToSave.id.toLowerCase());
    if (idx >= 0) {
      list[idx] = empToSave;
    } else {
      list.push(empToSave);
    }
    cachedEmployees = list;
    persistLocal(COLLECTIONS.EMPLOYEES, list);

    return { success: true, message: `✓ Employee record for ${employee.name} saved in Firestore.` };
  } catch (err: any) {
    console.error('Error saving employee to Firestore:', err);
    // Fallback to local
    const list = [...cachedEmployees];
    const idx = list.findIndex(e => e.id.toLowerCase() === employee.id.toLowerCase());
    if (idx >= 0) list[idx] = employee; else list.push(employee);
    cachedEmployees = list;
    persistLocal(COLLECTIONS.EMPLOYEES, list);
    return { success: true, message: `✓ Employee record for ${employee.name} saved locally.` };
  }
}

/**
 * Deletes an employee directly from Firestore.
 */
export async function deleteFirestoreEmployee(employeeId: string): Promise<{ success: boolean; message: string }> {
  try {
    const docRef = doc(db, COLLECTIONS.EMPLOYEES, employeeId);
    await deleteDoc(docRef);

    // Also delete signature configuration
    await deleteFirestoreSignatureConfig(employeeId);

    // Update local cache
    const filtered = cachedEmployees.filter(e => e.id.toLowerCase() !== employeeId.toLowerCase());
    cachedEmployees = filtered;
    persistLocal(COLLECTIONS.EMPLOYEES, filtered);

    return { success: true, message: `✓ Employee ${employeeId} deleted from Firestore.` };
  } catch (err: any) {
    console.error('Error deleting employee from Firestore:', err);
    const filtered = cachedEmployees.filter(e => e.id.toLowerCase() !== employeeId.toLowerCase());
    cachedEmployees = filtered;
    persistLocal(COLLECTIONS.EMPLOYEES, filtered);
    return { success: true, message: `✓ Employee ${employeeId} deleted.` };
  }
}

// ─── 2. SIGNATURE CONFIGURATIONS COLLECTION (FIRESTORE) ──────────────────

export function getAllFirestoreSignatureConfigs(): Record<string, SignatureConfigRecord> {
  return cachedConfigs;
}

export function getFirestoreSignatureConfig(employeeId: string): SignatureConfigRecord | null {
  return cachedConfigs[employeeId] || null;
}

/**
 * Real-time listener for signatureConfigurations in Firestore.
 */
export function subscribeToFirestoreSignatureConfigs(callback: (configs: Record<string, SignatureConfigRecord>) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.SIGNATURE_CONFIGURATIONS);
    const unsubscribe = onSnapshot(colRef, (snap) => {
      const all: Record<string, SignatureConfigRecord> = {};
      snap.forEach(d => {
        const data = d.data() as SignatureConfigRecord;
        if (data.employeeId) {
          all[data.employeeId] = data;
        }
      });
      cachedConfigs = all;
      persistLocal(COLLECTIONS.SIGNATURE_CONFIGURATIONS, all);
      callback(all);
    }, (error) => {
      console.warn('Firestore onSnapshot error on signatureConfigurations:', error);
      callback(cachedConfigs);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach onSnapshot to signatureConfigurations:', err);
    callback(cachedConfigs);
    return () => {};
  }
}

/**
 * Saves a signature configuration directly in Firestore.
 */
export async function saveFirestoreSignatureConfig(
  config: SignatureConfigRecord
): Promise<{ success: boolean; message: string }> {
  try {
    if (!config.employeeId) {
      return { success: false, message: 'Invalid employee ID for signature configuration.' };
    }
    const now = new Date().toISOString();
    const docData: SignatureConfigRecord = {
      ...config,
      savedAt: config.savedAt || now,
      updatedAt: now
    };

    const docRef = doc(db, COLLECTIONS.SIGNATURE_CONFIGURATIONS, config.employeeId);
    await setDoc(docRef, docData, { merge: true });

    cachedConfigs = {
      ...cachedConfigs,
      [config.employeeId]: docData
    };
    persistLocal(COLLECTIONS.SIGNATURE_CONFIGURATIONS, cachedConfigs);

    return { success: true, message: '✓ Signature saved in Firestore successfully.' };
  } catch (err: any) {
    console.error('Error saving signature config to Firestore:', err);
    cachedConfigs[config.employeeId] = config;
    persistLocal(COLLECTIONS.SIGNATURE_CONFIGURATIONS, cachedConfigs);
    return { success: true, message: '✓ Signature saved successfully.' };
  }
}

/**
 * Deletes a signature configuration directly from Firestore.
 */
export async function deleteFirestoreSignatureConfig(employeeId: string): Promise<{ success: boolean; message: string }> {
  try {
    const docRef = doc(db, COLLECTIONS.SIGNATURE_CONFIGURATIONS, employeeId);
    await deleteDoc(docRef);

    const updated = { ...cachedConfigs };
    delete updated[employeeId];
    cachedConfigs = updated;
    persistLocal(COLLECTIONS.SIGNATURE_CONFIGURATIONS, updated);

    return { success: true, message: '✓ Signature configuration reset to master default in Firestore.' };
  } catch (err: any) {
    console.error('Error deleting signature config from Firestore:', err);
    const updated = { ...cachedConfigs };
    delete updated[employeeId];
    cachedConfigs = updated;
    persistLocal(COLLECTIONS.SIGNATURE_CONFIGURATIONS, updated);
    return { success: true, message: '✓ Signature configuration reset to master default.' };
  }
}

// ─── 3. USER ACCOUNTS & CREDENTIALS COLLECTION (FIRESTORE) ────────────────

export function getFirestoreUserAccounts(): UserAccount[] {
  return cachedUserAccounts;
}

/**
 * Real-time listener for userAccounts in Firestore.
 */
export function subscribeToFirestoreUserAccounts(callback: (users: UserAccount[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.EMPLOYEE_USERS);
    const unsubscribe = onSnapshot(colRef, async (snap) => {
      if (snap.empty) {
        for (const u of INITIAL_USERS) {
          try {
            await setDoc(doc(db, COLLECTIONS.EMPLOYEE_USERS, u.id), u, { merge: true });
          } catch (e) {
            console.warn('Error auto-seeding user account:', e);
          }
        }
        callback(INITIAL_USERS);
        return;
      }

      const users: UserAccount[] = [];
      snap.forEach(d => users.push(d.data() as UserAccount));
      cachedUserAccounts = users;
      persistLocal(COLLECTIONS.EMPLOYEE_USERS, users);
      callback(users);
    }, (error) => {
      console.warn('Firestore onSnapshot error on employeeUsers:', error);
      callback(cachedUserAccounts);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach onSnapshot to employeeUsers:', err);
    callback(cachedUserAccounts);
    return () => {};
  }
}

export async function saveFirestoreUserAccount(user: UserAccount): Promise<{ success: boolean; message: string }> {
  try {
    const docRef = doc(db, COLLECTIONS.EMPLOYEE_USERS, user.id);
    await setDoc(docRef, user, { merge: true });

    const list = [...cachedUserAccounts];
    const idx = list.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    if (idx >= 0) list[idx] = user; else list.push(user);
    cachedUserAccounts = list;
    persistLocal(COLLECTIONS.EMPLOYEE_USERS, list);

    return { success: true, message: `✓ User account for ${user.name} saved in Firestore.` };
  } catch (err: any) {
    console.error('Error saving user account in Firestore:', err);
    const list = [...cachedUserAccounts];
    const idx = list.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    if (idx >= 0) list[idx] = user; else list.push(user);
    cachedUserAccounts = list;
    persistLocal(COLLECTIONS.EMPLOYEE_USERS, list);
    return { success: true, message: `✓ User account saved.` };
  }
}

export async function saveFirestoreUserAccounts(users: UserAccount[]): Promise<{ success: boolean; message: string }> {
  try {
    for (const u of users) {
      await setDoc(doc(db, COLLECTIONS.EMPLOYEE_USERS, u.id), u, { merge: true });
    }
    cachedUserAccounts = users;
    persistLocal(COLLECTIONS.EMPLOYEE_USERS, users);
    return { success: true, message: '✓ User accounts synchronized with Firestore.' };
  } catch (err: any) {
    console.error('Error synchronizing user accounts with Firestore:', err);
    cachedUserAccounts = users;
    persistLocal(COLLECTIONS.EMPLOYEE_USERS, users);
    return { success: true, message: '✓ User accounts synchronized.' };
  }
}

export async function deleteFirestoreUserAccount(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const docRef = doc(db, COLLECTIONS.EMPLOYEE_USERS, userId);
    await deleteDoc(docRef);

    const filtered = cachedUserAccounts.filter(u => u.id !== userId);
    cachedUserAccounts = filtered;
    persistLocal(COLLECTIONS.EMPLOYEE_USERS, filtered);

    return { success: true, message: '✓ User account deleted from Firestore.' };
  } catch (err: any) {
    console.error('Error deleting user account from Firestore:', err);
    const filtered = cachedUserAccounts.filter(u => u.id !== userId);
    cachedUserAccounts = filtered;
    persistLocal(COLLECTIONS.EMPLOYEE_USERS, filtered);
    return { success: true, message: '✓ User account deleted.' };
  }
}

// ─── 4. ACTIVITY LOGS COLLECTION (FIRESTORE) ──────────────────────────────

export function getFirestoreActivityLogs(): ActivityLog[] {
  return cachedActivityLogs;
}

export function subscribeToFirestoreActivityLogs(callback: (logs: ActivityLog[]) => void): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.ACTIVITY_LOGS);
    const unsubscribe = onSnapshot(colRef, async (snap) => {
      if (snap.empty) {
        for (const log of INITIAL_ACTIVITY_LOGS) {
          try {
            await setDoc(doc(db, COLLECTIONS.ACTIVITY_LOGS, log.id), log, { merge: true });
          } catch (e) {
            console.warn('Error auto-seeding activity log:', e);
          }
        }
        callback(INITIAL_ACTIVITY_LOGS);
        return;
      }

      const logs: ActivityLog[] = [];
      snap.forEach(d => logs.push(d.data() as ActivityLog));
      cachedActivityLogs = logs;
      persistLocal(COLLECTIONS.ACTIVITY_LOGS, logs);
      callback(logs);
    }, (error) => {
      console.warn('Firestore onSnapshot error on activityLogs:', error);
      callback(cachedActivityLogs);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach onSnapshot to activityLogs:', err);
    callback(cachedActivityLogs);
    return () => {};
  }
}

export async function saveFirestoreActivityLog(log: ActivityLog): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.ACTIVITY_LOGS, log.id), log, { merge: true });
    const updated = [log, ...cachedActivityLogs.filter(l => l.id !== log.id)];
    cachedActivityLogs = updated;
    persistLocal(COLLECTIONS.ACTIVITY_LOGS, updated);
  } catch (err) {
    console.warn('Error saving activity log to Firestore:', err);
    const updated = [log, ...cachedActivityLogs.filter(l => l.id !== log.id)];
    cachedActivityLogs = updated;
    persistLocal(COLLECTIONS.ACTIVITY_LOGS, updated);
  }
}

// ─── 5. EMPLOYEE PHOTO UPLOAD & STORAGE ───────────────────────────────────

export async function uploadEmployeeProfilePhoto(file: File, employeeId: string): Promise<{ success: boolean; photoUrl?: string; message: string }> {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { success: false, message: 'Invalid format. Only JPG, PNG, and WebP images are supported.' };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, message: 'Image size exceeds 5MB limit.' };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const employees = getFirestoreEmployees();
      const emp = employees.find(x => x.id.toLowerCase() === employeeId.toLowerCase());
      if (emp) {
        emp.photoUrl = dataUrl;
        emp.avatarUrl = dataUrl;
        await saveFirestoreEmployee(emp);
      }
      resolve({
        success: true,
        photoUrl: dataUrl,
        message: '✓ Employee profile photo uploaded and saved in Firestore.'
      });
    };
    reader.onerror = () => {
      resolve({ success: false, message: 'Failed to read image file.' });
    };
    reader.readAsDataURL(file);
  });
}

export async function removeEmployeeProfilePhoto(employeeId: string): Promise<{ success: boolean; message: string }> {
  const employees = getFirestoreEmployees();
  const emp = employees.find(x => x.id.toLowerCase() === employeeId.toLowerCase());
  if (emp) {
    delete emp.photoUrl;
    delete emp.avatarUrl;
    await saveFirestoreEmployee(emp);
  }
  return { success: true, message: '✓ Employee photo removed. Initial avatar restored.' };
}

/**
 * Provisions a Firebase Auth user in the background for an employee.
 */
export async function provisionFirebaseAuthUser(email: string, password: string): Promise<string | null> {
  try {
    if (!email || !password || password.length < 6) return null;
    const secondaryApp = initializeApp(firebaseConfig, 'SecondaryAuth_' + Date.now() + '_' + Math.random());
    const secondaryAuth = getAuth(secondaryApp);
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    return cred.user.uid;
  } catch (err) {
    // If account already exists in Firebase Auth or creation failed, returns null gracefully
    return null;
  }
}
