export interface Employee {
  id: string;             // e.g. AE-1037
  name: string;
  fullName?: string;      // Alias for name
  photoUrl?: string;      // Firebase Storage or secure profile image URL
  avatarUrl?: string;     // Backward compatibility
  jobTitle: string;
  department: string;
  phone: string;
  email: string;
  office: string;
  locations: string;
  branch?: string;
  website: string;
  companyName?: string;   // e.g. "ALAM ENGAZ PORT SERVICES CO." or "ALAM ENGAZ LOGISTICS SERVICES CO."
  status: 'Active' | 'Pending' | 'Inactive';
  createdAt: string;
  joiningDate?: string;
  username?: string;
  mustChangePassword?: boolean;
  passwordChangeRequired?: boolean;
  passwordStatus?: 'Set' | 'Temporary' | 'Not Set';
  portalAccessStatus?: 'Active' | 'Inactive' | 'Not Created';
  hasLoginAccess?: boolean;
  whatsappNumber?: string;
  uid?: string;
  role?: string;
  updatedAt?: string;
  lastLogin?: string;
  hasCustomSignature?: boolean;
}

export type PageRoute = 
  | 'home' 
  | 'employees' 
  | 'signature-studio' 
  | 'installation-guide' 
  | 'about' 
  | 'support'
  | 'employee-portal'
  | 'management-portal'
  | 'admin-panel'
  | 'admin-signatures-studio'
  | 'employee-signature-studio'
  | 'management-signatures';

export type UserRole = 'guest' | 'employee' | 'management' | 'admin';

export interface ManagementUser {
  id: string;
  name: string;
  username?: string;
  role: 'CEO' | 'General Manager';
  email: string;
  lastLogin: string;
  status?: 'Active' | 'Inactive';
  createdAt?: string;
  phone?: string;
  photoUrl?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  employeeId?: string;
  email: string;
  role: 'SUPER_ADMIN' | 'MANAGEMENT' | 'EMPLOYEE';
  status: 'Active' | 'Inactive';
  lastLogin: string;
  createdAt?: string;
  updatedAt?: string;
  department?: string;
  mustChangePassword?: boolean;
  passwordChangeRequired?: boolean;
  passwordStatus?: 'Set' | 'Temporary' | 'Not Set';
  whatsappNumber?: string;
}

export interface SignatureConfigRecord {
  employeeId: string;
  employeeName?: string;
  showBestRegards: boolean;
  bestRegardsText: string;
  bestRegardsSettings?: {
    color?: string;
    fontSize?: number;
    fontWeight?: string;
    x?: number;
    y?: number;
    spaceBelow?: number;
  };
  logoSettings?: {
    showLogo?: boolean;
    scale?: number;
    x?: number;
    y?: number;
    spaceToDivider?: number;
  };
  displaySettings?: {
    showSocialIcons?: boolean;
  };
  savedAt: string;
  updatedAt: string;
  lastUpdatedBy?: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  details: string;
}


