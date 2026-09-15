import { Employee, ManagementUser, ActivityLog } from '../types';

export const INITIAL_EMPLOYEE: Employee = {
  id: 'AE-1037',
  name: 'MUHAMMED NASEEH',
  username: 'AE-1037',
  jobTitle: 'Accountant',
  department: 'Finance & Accounts',
  phone: '+966 54 69 79 474',
  whatsappNumber: '+966 54 69 79 474',
  email: 'invoice@alamengaz.com',
  office: 'King Abdul Aziz Road, Near Dammam Sea Port, P.O. Box 2791, Dammam 32213, Eastern Province, Kingdom of Saudi Arabia',
  locations: 'Dammam | Jeddah | Bahrain | India',
  website: 'www.alamengaz.com',
  companyName: 'ALAM ENGAZ PORT SERVICES CO.',
  status: 'Active',
  hasLoginAccess: true,
  portalAccessStatus: 'Active',
  passwordStatus: 'Set',
  passwordChangeRequired: false,
  createdAt: '2026-01-15'
};

// Initial state — real company employees
export const INITIAL_EMPLOYEES: Employee[] = [
  INITIAL_EMPLOYEE,
  {
    id: 'AE-1038',
    name: 'MANAV SUDHEER',
    username: 'AE-1038',
    jobTitle: 'Operation Executive',
    department: 'Operations',
    phone: '+966 50 123 4567',
    whatsappNumber: '+966 50 123 4567',
    email: 'manav@alamengaz.com',
    office: 'King Abdul Aziz Road, Near Dammam Sea Port, P.O. Box 2791, Dammam 32213, Eastern Province, Kingdom of Saudi Arabia',
    locations: 'Dammam | Jeddah | Bahrain | India',
    website: 'www.alamengaz.com',
    companyName: 'ALAM ENGAZ LOGISTICS SERVICES CO.',
    status: 'Active',
    hasLoginAccess: true,
    portalAccessStatus: 'Active',
    passwordStatus: 'Set',
    passwordChangeRequired: false,
    createdAt: '2026-02-10'
  }
];

export const INITIAL_MANAGEMENT_USERS: ManagementUser[] = [
  {
    id: 'MGMT-01',
    name: 'Chief Executive Officer',
    role: 'CEO',
    email: 'ceo@alamengaz.com',
    lastLogin: 'Today at 09:15 AM'
  },
  {
    id: 'MGMT-02',
    name: 'General Manager',
    role: 'General Manager',
    email: 'gm@alamengaz.com',
    lastLogin: 'Yesterday at 04:30 PM'
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'LOG-001',
    user: 'Admin',
    action: 'Verified Master Signature Model',
    timestamp: '2026-09-12 10:30',
    details: 'Standardized company email signature template across all ports.'
  },
  {
    id: 'LOG-002',
    user: 'MUHAMMED NASEEH',
    action: 'Signature Exported',
    timestamp: '2026-09-12 11:45',
    details: 'Exported official signature for Outlook Desktop & Web.'
  },
  {
    id: 'LOG-003',
    user: 'General Manager',
    action: 'Portal Security Audit',
    timestamp: '2026-09-12 14:00',
    details: 'Completed access review for executive & administrative portals.'
  }
];

export const COMPANY_DETAILS = {
  name: 'ALAM ENGAZ PORT SERVICES CO.',
  shortName: 'ALAM ENGAZ',
  productName: 'EMAIL SIGNATURE HUB',
  tagline: 'ONE PORT. ONE TEAM. ONE PROFESSIONAL IDENTITY.',
  secondaryPhrase: 'MOVING BUSINESS FURTHER',
  locations: 'Dammam | Jeddah | Bahrain | India',
  address: 'A company, incorporated/registered under the Laws of SAUDI ARABIA, having its registered office at King Abdul Aziz Road, Near Dammam Sea Port, P.O. Box 2791, Dammam 32213, Eastern Province, Kingdom of Saudi Arabia.',
  phone: '+966 54 69 79 474',
  email: 'info@alamengaz.com',
  website: 'www.alamengaz.com',
  primaryRed: '#8B0021',
  secondaryRed: '#A30A24',
  primaryNavy: '#0B2A55',
  bgLight: '#F6F8FA'
};
