import React, { useState, useEffect } from 'react';
import { Employee, ManagementUser, ActivityLog, PageRoute } from '../types';
import { COMPANY_DETAILS } from '../data/initialData';
import { OfficialSignature } from '../components/OfficialSignature';
import { SignatureStudioView } from './SignatureStudioView';
import { 
  DEFAULT_FEATURED_GUIDE, 
  DEFAULT_GUIDES, 
  DEFAULT_VIDEOS, 
  DEFAULT_FAQS, 
  DEFAULT_SUPPORT_CONTACT,
  GuideItem,
  VideoItem,
  FaqItem
} from '../data/supportData';
import { SystemSettingsSection } from '../components/SystemSettingsSection';
import { WebsiteManagerModule } from '../components/admin/WebsiteManagerModule';
import { MediaLibraryModule } from '../components/admin/MediaLibraryModule';
import { AnalyticsModule } from '../components/admin/AnalyticsModule';
import { ActivityLogsModule } from '../components/admin/ActivityLogsModule';
import { AdminUsersModule } from '../components/admin/AdminUsersModule';
import { 
  changeUserPassword, 
  sendFirebasePasswordReset, 
  adminSetTemporaryPassword 
} from '../services/authService';
import { deleteSignatureRecord } from '../services/signatureStorageService';
import { EmployeeAvatar } from '../components/EmployeeAvatar';
import { uploadEmployeeProfilePhoto } from '../services/firebaseService';
import { 
  generateSecureTempPassword,
  openWhatsAppWithCredentials,
  createEmployeeCredentials,
  resetEmployeeCredentials,
  toggleEmployeeAccountStatus,
  deleteEmployeePortalAccess,
  updateEmployeeWhatsAppNumber 
} from '../services/credentialService';

interface AdminPanelViewProps {
  employees: Employee[];
  managementUsers: ManagementUser[];
  activityLogs: ActivityLog[];
  initialTab?: string;
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee?: (empId: string) => void;
  onDeleteSignature?: (empId: string, performedBy?: string, role?: string) => Promise<any>;
  onUpdateManagementUsers?: (users: ManagementUser[]) => void;
  onLogout: () => void;
  onNavigate: (route: PageRoute) => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  employees,
  managementUsers,
  activityLogs,
  initialTab,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onDeleteSignature,
  onUpdateManagementUsers,
  onLogout,
  onNavigate
}) => {
  // Navigation & View State (Defaults to Page 10: System Settings or initialTab)
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'settings');
  const [activeSubTab, setActiveSubTab] = useState<string>('general-settings');
  const [websiteSubTab, setWebsiteSubTab] = useState<'homepage' | 'about' | 'installation' | 'footer'>('homepage');
  const [mediaSubTab, setMediaSubTab] = useState<'logos' | 'pdfs' | 'videos'>('logos');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    employees: false,
    signatures: false,
    company: false,
    guides: false,
    tutorials: false,
    faq: false,
    support: false,
    website: false,
    media: false,
    logs: false,
    adminUsers: false,
    settings: true,
    backup: false
  });

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Modals & Popovers
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeePhotoUploading, setEmployeePhotoUploading] = useState(false);
  const [showUploadGuideModal, setShowUploadGuideModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showAddMgmtModal, setShowAddMgmtModal] = useState(false);
  const [selectedEmpAccount, setSelectedEmpAccount] = useState<Employee | null>(null);
  const [tempPasswordModalData, setTempPasswordModalData] = useState<{ tempPass: string; emp: Employee } | null>(null);
  const [showConfirmResetBeforeWhatsApp, setShowConfirmResetBeforeWhatsApp] = useState<Employee | null>(null);
  const [showDeleteAccessConfirm, setShowDeleteAccessConfirm] = useState<Employee | null>(null);
  const [showEditWhatsAppAdminModal, setShowEditWhatsAppAdminModal] = useState<Employee | null>(null);
  const [adminWhatsAppInput, setAdminWhatsAppInput] = useState('');
  const [copiedTempPass, setCopiedTempPass] = useState(false);
  const [adminToast, setAdminToast] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Reusable Universal Delete Confirmation Modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'employee' | 'signature' | 'management' | 'admin' | 'guide' | 'media';
    id: string;
    title: string;
    targetName: string;
    message: string;
  } | null>(null);

  // Change Password Form State
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [passError, setPassError] = useState('');

  // Management Form State
  const [mgmtFormName, setMgmtFormName] = useState('');
  const [mgmtFormEmail, setMgmtFormEmail] = useState('');
  const [mgmtFormRole, setMgmtFormRole] = useState<'CEO' | 'General Manager'>('CEO');


  // Search & Filter
  const [adminSearch, setAdminSearch] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('Last 30 Days');

  // Data Collections
  const [guidesList, setGuidesList] = useState<GuideItem[]>([...DEFAULT_GUIDES]);
  const [videosList, setVideosList] = useState<VideoItem[]>([...DEFAULT_VIDEOS]);
  const [faqsList, setFaqsList] = useState<FaqItem[]>([...DEFAULT_FAQS]);
  const [supportEmail, setSupportEmail] = useState(DEFAULT_SUPPORT_CONTACT.email);
  const [supportHours, setSupportHours] = useState(DEFAULT_SUPPORT_CONTACT.hoursTime);

  // Form State for Add Employee
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: '',
    jobTitle: '',
    department: 'Finance & Accounts',
    phone: '+966 ',
    email: '@alamengaz.com',
    status: 'Active',
    locations: 'Dammam | Jeddah | Bahrain | India',
    office: COMPANY_DETAILS.address,
    website: 'www.alamengaz.com',
    companyName: COMPANY_DETAILS.name
  });

  // Form State for Upload Guide
  const [newGuide, setNewGuide] = useState({
    title: '',
    description: '',
    pages: 12,
    fileSize: '1.4 MB'
  });

  const showToast = (msg: string) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(null), 3500);
  };

  const toggleSectionExpand = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePhotoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setEmployeePhotoUploading(true);
      const tempId = isEditing && editingEmployee ? editingEmployee.id : (newEmployee.id || `AE-${1038 + employees.length}`);
      const res = await uploadEmployeeProfilePhoto(file, tempId);
      if (res.success && res.photoUrl) {
        if (isEditing && editingEmployee) {
          setEditingEmployee({ ...editingEmployee, photoUrl: res.photoUrl });
        } else {
          setNewEmployee({ ...newEmployee, photoUrl: res.photoUrl });
        }
        showToast('✓ Employee photo uploaded successfully.');
      } else {
        showToast(res.message || 'Failed to upload photo.');
      }
    } catch (err: any) {
      showToast(err.message || 'Error uploading photo.');
    } finally {
      setEmployeePhotoUploading(false);
    }
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.email) {
      showToast('Please fill in Employee Name and Corporate Email.');
      return;
    }

    const emp: Employee = {
      id: newEmployee.id || `AE-${1038 + employees.length}`,
      name: (newEmployee.name || '').toUpperCase(),
      jobTitle: newEmployee.jobTitle || 'Officer',
      department: newEmployee.department || 'Operations',
      phone: newEmployee.phone || '+966 54 00 00 000',
      email: newEmployee.email || 'info@alamengaz.com',
      office: COMPANY_DETAILS.address,
      locations: newEmployee.locations || 'Dammam | Jeddah | Bahrain | India',
      website: newEmployee.website || 'www.alamengaz.com',
      companyName: newEmployee.companyName || COMPANY_DETAILS.name,
      status: newEmployee.status || 'Active',
      photoUrl: newEmployee.photoUrl,
      createdAt: new Date().toISOString().split('T')[0]
    };

    onAddEmployee(emp);
    setShowAddEmployeeModal(false);
    setNewEmployee({
      name: '',
      jobTitle: '',
      department: 'Finance & Accounts',
      phone: '+966 ',
      email: '@alamengaz.com',
      status: 'Active',
      companyName: COMPANY_DETAILS.name
    });
    showToast(`✓ Employee ${emp.name} added successfully.`);
  };

  const handleUpdateEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    onUpdateEmployee(editingEmployee);
    setShowEditEmployeeModal(false);
    setEditingEmployee(null);
    showToast(`✓ Employee ${editingEmployee.name} updated successfully.`);
  };

  const handleCreateGuide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuide.title) return;

    const guide: GuideItem = {
      id: `guide-${Date.now()}`,
      title: newGuide.title,
      description: newGuide.description || 'Official user instructions for ALAM ENGAZ team.',
      pages: newGuide.pages,
      fileSize: newGuide.fileSize,
      isPublished: true,
      iconType: 'studio'
    };

    setGuidesList(prev => [guide, ...prev]);
    setShowUploadGuideModal(false);
    setNewGuide({ title: '', description: '', pages: 12, fileSize: '1.4 MB' });
    showToast(`Guide "${guide.title}" published successfully.`);
  };

  // Real statistics based on current database state (1 Real Employee: Muhammed Naseeh)
  const totalEmployeesCount = employees.length;
  const activeEmployeesCount = employees.filter(e => e.status === 'Active').length;
  const inactiveEmployeesCount = employees.filter(e => e.status !== 'Active').length;

  return (
    <div className="admin-viewport-wrap">
      {/* ================= 1. TOP ADMIN HEADER ================= */}
      <header className="admin-top-header">
        <div className="admin-header-left">
          {/* Mobile Sidebar Hamburger Toggle */}
          <button 
            type="button" 
            className="admin-mobile-hamburger"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            aria-label="Toggle Navigation Drawer"
            id="admin-mobile-hamburger"
          >
            {mobileSidebarOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>

          <div 
            className="admin-logo-wrap"
            onClick={() => onNavigate('home')}
            title="ALAM ENGAZ PORT SERVICES CO."
            style={{ cursor: 'pointer' }}
          >
            <img 
              src="/assets/logo.png" 
              alt="ALAM ENGAZ PORT SERVICES CO." 
              className="admin-header-logo"
            />
          </div>
        </div>

        {/* Center Search Field */}
        <div className="admin-header-search-wrap">
          <svg className="admin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text"
            className="admin-search-input"
            placeholder="Search settings, users, backup, security..."
            value={adminSearch}
            onChange={(e) => setAdminSearch(e.target.value)}
          />
        </div>

        {/* Right Header Controls */}
        <div className="admin-header-right">
          {/* Notifications Icon with Badge */}
          <div className="admin-notify-wrap" onClick={() => setShowNotificationsModal(!showNotificationsModal)}>
            <button className="admin-notify-btn" title="System Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="admin-notify-badge">2</span>
            </button>

            {showNotificationsModal && (
              <div className="admin-notify-dropdown">
                <div className="admin-notify-header">
                  <span style={{ fontWeight: 800, fontSize: '13px', color: '#0F172A' }}>Notifications</span>
                  <span style={{ fontSize: '11px', color: 'var(--red-corporate)', fontWeight: 700 }}>2 New</span>
                </div>
                <div className="admin-notify-list">
                  <div className="admin-notify-item">
                    <span className="admin-notify-dot" />
                    <div>
                      <div className="admin-notify-text">Master signature synchronized</div>
                      <div className="admin-notify-time">2 hours ago</div>
                    </div>
                  </div>
                  <div className="admin-notify-item">
                    <span className="admin-notify-dot" />
                    <div>
                      <div className="admin-notify-text">Installation Guide published (Web & Desktop)</div>
                      <div className="admin-notify-time">5 hours ago</div>
                    </div>
                  </div>
                  <div className="admin-notify-item">
                    <span className="admin-notify-dot" />
                    <div>
                      <div className="admin-notify-text">Single employee profile active: Muhammed Naseeh</div>
                      <div className="admin-notify-time">1 day ago</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Admin Profile Dropdown */}
          <div className="admin-profile-menu-wrap">
            <div 
              className="admin-profile-pill"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <div className="admin-profile-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
                <img src="/assets/logo.png" onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }} alt="Logo" style={{ width: '22px', height: 'auto', objectFit: 'contain' }} />
              </div>
              <div className="admin-profile-info">
                <span className="admin-profile-name">Basim Aslam</span>
                <span className="admin-profile-role">Super Admin</span>
              </div>
              <svg className="admin-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {showProfileDropdown && (
              <div className="admin-profile-dropdown">
                <div className="admin-dropdown-header">
                  <strong>Basim Aslam</strong>
                  <span>Super Admin &bull; Root Authorization</span>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>admin@alamengaz.com</span>
                </div>
                <button 
                  className="admin-dropdown-item"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    onNavigate('home');
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                  <span>Public Website</span>
                </button>
                <button 
                  className="admin-dropdown-item"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    setActiveTab('signature-studio');
                    onNavigate('admin-signatures-studio');
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  <span>Admin Signature Studio</span>
                </button>
                <button 
                  className="admin-dropdown-item"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    setShowChangePasswordModal(true);
                    setPassError('');
                    setCurrentPassInput('');
                    setNewPassInput('');
                    setConfirmPassInput('');
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <span>Change Password</span>
                </button>
                <button 
                  className="admin-dropdown-item"
                  onClick={async () => {
                    setShowProfileDropdown(false);
                    const res = await sendFirebasePasswordReset('admin@alamengaz.com', 'admin');
                    showToast(res.message);
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  <span>Forgot Password</span>
                </button>
                <button 
                  className="admin-dropdown-item"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    showToast('Root security audit status: Verified & Compliant.');
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  <span>Security Audit</span>
                </button>
                <div className="admin-dropdown-divider" />
                <button 
                  className="admin-dropdown-item admin-logout-item"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    onLogout();
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Admin Toast */}
      {adminToast && (
        <div className="admin-toast-banner">
          <span>✓</span>
          <span>{adminToast}</span>
        </div>
      )}

      {/* ================= 2. MAIN ADMIN LAYOUT (SIDEBAR + WORKSPACE) ================= */}
      <div className="admin-body-container">
        
        {/* Mobile Off-Canvas Drawer Backdrop */}
        {mobileSidebarOpen && (
          <div 
            className="admin-sidebar-overlay" 
            onClick={() => setMobileSidebarOpen(false)} 
            aria-label="Close sidebar backdrop"
          />
        )}

        {/* ================= LEFT SIDEBAR (DRAWER ON MOBILE) ================= */}
        <aside className={`admin-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
          {/* Sidebar Top Title */}
          <div className="admin-sidebar-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="admin-brand-icon">
                <img src="/assets/logo.png" alt="Logo" style={{ height: '22px', objectFit: 'contain' }} />
              </div>
              <div className="admin-brand-text">
                <span className="brand-title">ADMIN PANEL</span>
                <span className="brand-subtitle">Email Signature Hub</span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button 
              type="button" 
              className="admin-sidebar-mobile-close"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close navigation drawer"
            >
              ✕
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="admin-nav-menu">
            {/* Dashboard */}
            <button 
              className={`admin-nav-item ${activeTab === 'dashboard' ? 'active-red' : ''}`}
              onClick={() => {
                setActiveTab('dashboard');
                setMobileSidebarOpen(false);
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
              <span>Dashboard</span>
            </button>

            {/* Employees */}
            <div className="admin-nav-group">
              <button 
                className={`admin-nav-item has-sub ${activeTab === 'employees' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('employees');
                  toggleSectionExpand('employees');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  <span>Employees</span>
                </div>
                <span className={`admin-sub-arrow ${expandedSections.employees ? 'open' : ''}`}>▾</span>
              </button>
              {expandedSections.employees && (
                <div className="admin-sub-menu">
                  <button className="admin-sub-item" onClick={() => setActiveTab('employees')}>All Employees</button>
                  <button className="admin-sub-item" onClick={() => setShowAddEmployeeModal(true)}>Add Employee</button>
                  <button className="admin-sub-item" onClick={() => setActiveTab('employees')}>Departments</button>
                  <button className="admin-sub-item" onClick={() => showToast('Employee export ready: Muhammed Naseeh (AE-1037)')}>Import / Export</button>
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="admin-nav-group">
              <button 
                className={`admin-nav-item has-sub ${activeTab === 'signatures' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('signatures');
                  toggleSectionExpand('signatures');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  <span>Signatures</span>
                </div>
                <span className={`admin-sub-arrow ${expandedSections.signatures ? 'open' : ''}`}>▾</span>
              </button>
              {expandedSections.signatures && (
                <div className="admin-sub-menu">
                  <button className={`admin-sub-item ${activeTab === 'signature-studio' ? 'active' : ''}`} onClick={() => { setActiveTab('signature-studio'); onNavigate('admin-signatures-studio'); }}>Signature Studio</button>
                  <button className="admin-sub-item" onClick={() => setActiveTab('signatures')}>Master Template</button>
                  <button className="admin-sub-item" onClick={() => setActiveTab('signatures')}>Signature Settings</button>
                  <button className="admin-sub-item" onClick={() => setActiveTab('signatures')}>Best Regards Settings</button>
                  <button className="admin-sub-item" onClick={() => setActiveTab('signatures')}>Logo Settings</button>
                </div>
              )}
            </div>

            {/* Company */}
            <div className="admin-nav-group">
              <button 
                className={`admin-nav-item has-sub ${activeTab === 'company' || activeTab === 'management-users' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('company');
                  toggleSectionExpand('company');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                  <span>Company</span>
                </div>
                <span className={`admin-sub-arrow ${expandedSections.company ? 'open' : ''}`}>▾</span>
              </button>
              {expandedSections.company && (
                <div className="admin-sub-menu">
                  <button className="admin-sub-item" onClick={() => setActiveTab('company')}>Company Information</button>
                  <button className="admin-sub-item" onClick={() => setActiveTab('company')}>Locations</button>
                  <button className="admin-sub-item" onClick={() => setActiveTab('company')}>Contact Details</button>
                  <button className={`admin-sub-item ${activeTab === 'management-users' ? 'active' : ''}`} onClick={() => setActiveTab('management-users')}>Executive Accounts (CEO/GM)</button>
                </div>
              )}
            </div>

            {/* Guides */}
            <div className="admin-nav-group">
              <button 
                className={`admin-nav-item has-sub ${activeTab === 'guides' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('guides');
                  toggleSectionExpand('guides');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                  <span>Guides</span>
                </div>
                <span className={`admin-sub-arrow ${expandedSections.guides ? 'open' : ''}`}>▾</span>
              </button>
              {expandedSections.guides && (
                <div className="admin-sub-menu">
                  <button className="admin-sub-item" onClick={() => setActiveTab('guides')}>Complete Website Guide</button>
                  <button className="admin-sub-item" onClick={() => setActiveTab('guides')}>Individual Guides</button>
                  <button className="admin-sub-item" onClick={() => setShowUploadGuideModal(true)}>Manage Downloads</button>
                </div>
              )}
            </div>

            {/* Tutorials */}
            <div className="admin-nav-group">
              <button 
                className={`admin-nav-item has-sub ${activeTab === 'tutorials' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('tutorials');
                  toggleSectionExpand('tutorials');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                  <span>Tutorials</span>
                </div>
                <span className={`admin-sub-arrow ${expandedSections.tutorials ? 'open' : ''}`}>▾</span>
              </button>
              {expandedSections.tutorials && (
                <div className="admin-sub-menu">
                  <button className="admin-sub-item" onClick={() => setActiveTab('tutorials')}>Video Management</button>
                </div>
              )}
            </div>

            {/* FAQ */}
            <div className="admin-nav-group">
              <button 
                className={`admin-nav-item has-sub ${activeTab === 'faq' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('faq');
                  toggleSectionExpand('faq');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  <span>FAQ</span>
                </div>
                <span className={`admin-sub-arrow ${expandedSections.faq ? 'open' : ''}`}>▾</span>
              </button>
              {expandedSections.faq && (
                <div className="admin-sub-menu">
                  <button className="admin-sub-item" onClick={() => setActiveTab('faq')}>FAQ Management</button>
                </div>
              )}
            </div>

            {/* Support */}
            <div className="admin-nav-group">
              <button 
                className={`admin-nav-item has-sub ${activeTab === 'support' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('support');
                  toggleSectionExpand('support');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  <span>Support</span>
                </div>
                <span className={`admin-sub-arrow ${expandedSections.support ? 'open' : ''}`}>▾</span>
              </button>
              {expandedSections.support && (
                <div className="admin-sub-menu">
                  <button className="admin-sub-item" onClick={() => setActiveTab('support')}>Support Settings</button>
                  <button className="admin-sub-item" onClick={() => setActiveTab('support')}>Contact Messages</button>
                </div>
              )}
            </div>

            {/* Website */}
            <div className="admin-nav-group">
              <button 
                className={`admin-nav-item has-sub ${activeTab === 'website' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('website');
                  toggleSectionExpand('website');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                  <span>Website</span>
                </div>
                <span className={`admin-sub-arrow ${expandedSections.website ? 'open' : ''}`}>▾</span>
              </button>
              {expandedSections.website && (
                <div className="admin-sub-menu">
                  <button className={`admin-sub-item ${activeTab === 'website' && websiteSubTab === 'homepage' ? 'active' : ''}`} onClick={() => { setActiveTab('website'); setWebsiteSubTab('homepage'); }}>Homepage Content</button>
                  <button className={`admin-sub-item ${activeTab === 'website' && websiteSubTab === 'about' ? 'active' : ''}`} onClick={() => { setActiveTab('website'); setWebsiteSubTab('about'); }}>About Page</button>
                  <button className={`admin-sub-item ${activeTab === 'website' && websiteSubTab === 'installation' ? 'active' : ''}`} onClick={() => { setActiveTab('website'); setWebsiteSubTab('installation'); }}>Installation Guide</button>
                  <button className={`admin-sub-item ${activeTab === 'website' && websiteSubTab === 'footer' ? 'active' : ''}`} onClick={() => { setActiveTab('website'); setWebsiteSubTab('footer'); }}>Footer</button>
                </div>
              )}
            </div>

            {/* Media Library */}
            <div className="admin-nav-group">
              <button 
                className={`admin-nav-item has-sub ${activeTab === 'media' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('media');
                  toggleSectionExpand('media');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  <span>Media Library</span>
                </div>
                <span className={`admin-sub-arrow ${expandedSections.media ? 'open' : ''}`}>▾</span>
              </button>
              {expandedSections.media && (
                <div className="admin-sub-menu">
                  <button className={`admin-sub-item ${activeTab === 'media' && mediaSubTab === 'logos' ? 'active' : ''}`} onClick={() => { setActiveTab('media'); setMediaSubTab('logos'); }}>Logos &amp; Images</button>
                  <button className={`admin-sub-item ${activeTab === 'media' && mediaSubTab === 'pdfs' ? 'active' : ''}`} onClick={() => { setActiveTab('media'); setMediaSubTab('pdfs'); }}>PDF Files</button>
                  <button className={`admin-sub-item ${activeTab === 'media' && mediaSubTab === 'videos' ? 'active' : ''}`} onClick={() => { setActiveTab('media'); setMediaSubTab('videos'); }}>Video Thumbnails</button>
                </div>
              )}
            </div>

            {/* Analytics */}
            <div className="admin-nav-group">
              <button 
                className={`admin-nav-item has-sub ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('analytics');
                  toggleSectionExpand('analytics');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                  <span>Analytics</span>
                </div>
                <span className={`admin-sub-arrow ${expandedSections.analytics ? 'open' : ''}`}>▾</span>
              </button>
              {expandedSections.analytics && (
                <div className="admin-sub-menu">
                  <button className={`admin-sub-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>Reports &amp; Statistics</button>
                </div>
              )}
            </div>

            {/* Activity Logs */}
            <div className="admin-nav-group">
              <button 
                className={`admin-nav-item has-sub ${activeTab === 'logs' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('logs');
                  toggleSectionExpand('logs');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  <span>Activity Logs</span>
                </div>
                <span className={`admin-sub-arrow ${expandedSections.logs ? 'open' : ''}`}>▾</span>
              </button>
              {expandedSections.logs && (
                <div className="admin-sub-menu">
                  <button className={`admin-sub-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>System Activity</button>
                </div>
              )}
            </div>

            {/* Admin Users */}
            <div className="admin-nav-group">
              <button 
                className={`admin-nav-item has-sub ${activeTab === 'admin-users' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('admin-users');
                  toggleSectionExpand('adminUsers');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <span>Admin Users</span>
                </div>
                <span className={`admin-sub-arrow ${expandedSections.adminUsers ? 'open' : ''}`}>▾</span>
              </button>
              {expandedSections.adminUsers && (
                <div className="admin-sub-menu">
                  <button className={`admin-sub-item ${activeTab === 'admin-users' ? 'active' : ''}`} onClick={() => setActiveTab('admin-users')}>Manage Admins</button>
                </div>
              )}
            </div>

            {/* Settings (Active Section) */}
            <div className="admin-nav-group">
              <button 
                className={`admin-nav-item has-sub ${activeTab === 'settings' ? 'active-red' : ''}`}
                onClick={() => {
                  setActiveTab('settings');
                  toggleSectionExpand('settings');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  <span>Settings</span>
                </div>
                <span className={`admin-sub-arrow ${expandedSections.settings ? 'open' : ''}`}>▾</span>
              </button>
              {expandedSections.settings && (
                <div className="admin-sub-menu">
                  <button 
                    className="admin-sub-item"
                    style={activeTab === 'settings' && activeSubTab === 'general-settings' ? { color: '#FFFFFF', fontWeight: 700 } : {}}
                    onClick={() => {
                      setActiveTab('settings');
                      setActiveSubTab('general-settings');
                    }}
                  >
                    General Settings
                  </button>
                  <button 
                    className="admin-sub-item"
                    style={activeTab === 'settings' && activeSubTab === 'theme-branding' ? { color: '#FFFFFF', fontWeight: 700 } : {}}
                    onClick={() => {
                      setActiveTab('settings');
                      setActiveSubTab('theme-branding');
                    }}
                  >
                    Theme &amp; Branding
                  </button>
                  <button 
                    className="admin-sub-item"
                    style={activeTab === 'admin-users' ? { color: '#FFFFFF', fontWeight: 700 } : {}}
                    onClick={() => {
                      setActiveTab('admin-users');
                    }}
                  >
                    Users &amp; Roles (Access Control)
                  </button>
                </div>
              )}
            </div>

            {/* Backup & Export */}
            <div className="admin-nav-group">
              <button 
                className={`admin-nav-item has-sub ${activeTab === 'backup' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('settings');
                  toggleSectionExpand('backup');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  <span>Backup &amp; Export</span>
                </div>
                <span className={`admin-sub-arrow ${expandedSections.backup ? 'open' : ''}`}>▾</span>
              </button>
              {expandedSections.backup && (
                <div className="admin-sub-menu">
                  <button className="admin-sub-item" onClick={() => { setActiveTab('settings'); showToast('Employee and logs export ready.'); }}>Export Data</button>
                  <button className="admin-sub-item" onClick={() => { setActiveTab('settings'); showToast('System backup ready.'); }}>System Backup</button>
                </div>
              )}
            </div>
          </nav>

          {/* Bottom Sidebar Support Card */}
          <div className="admin-sidebar-support-card">
            <div className="admin-sidebar-support-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
              </svg>
            </div>
            <div className="admin-sidebar-support-info">
              <div className="supp-title">Need Help?</div>
              <div className="supp-team">IT Support Team</div>
              <div className="supp-email">it@alamengaz.com</div>
              <div className="supp-hours">
                Sun - Thu | 9:00 AM - 6:00 PM<br />(KSA Time)
              </div>
            </div>
          </div>
        </aside>

        {/* ================= RIGHT WORKSPACE ================= */}
        <main className="admin-workspace">

          {/* ================= IF DASHBOARD TAB IS ACTIVE ================= */}
          {activeTab === 'dashboard' && (
            <div className="admin-dashboard-flow">

              {/* 3. DASHBOARD HERO CARD */}
              <section className="admin-hero-card">
                <div className="admin-hero-overlay" />
                <div className="admin-hero-content">
                  <div className="admin-hero-text-col">
                    <h1 className="admin-hero-heading">
                      <span className="welcome-part">Welcome Back,</span><br />
                      <span className="admin-name-red">Basim Aslam</span>
                    </h1>

                    <div className="admin-hero-breadcrumb">
                      Admin Panel &nbsp;|&nbsp; ALAM ENGAZ Email Signature Hub
                    </div>

                    <p className="admin-hero-desc">
                      Manage your employees, signatures, guides and website content — all in one place.
                    </p>
                  </div>

                  {/* Right Maritime Tagline over Ship */}
                  <div className="admin-hero-motto-col">
                    <div className="admin-hero-motto-stack">
                      <div>MOVING</div>
                      <div>BUSINESS</div>
                      <div>FURTHER</div>
                    </div>
                    <div className="admin-hero-script-tag">
                      Global Connections Stronger Tomorrow
                    </div>
                  </div>
                </div>
              </section>

              {/* 4. DASHBOARD STATISTICS (7 CARDS ROW) */}
              <section className="admin-stats-grid">
                {/* 1. Total Employees */}
                <div className="admin-stat-card">
                  <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#FEF2F2', color: 'var(--red-corporate)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                  </div>
                  <div className="admin-stat-number">{totalEmployeesCount}</div>
                  <div className="admin-stat-label">Total Employees</div>
                  <div className="admin-stat-trend green">
                    <span>↑ 100%</span>
                    <span className="trend-sub">real employee</span>
                  </div>
                </div>

                {/* 2. Active Employees */}
                <div className="admin-stat-card">
                  <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div className="admin-stat-number">{activeEmployeesCount}</div>
                  <div className="admin-stat-label">Active Employees</div>
                  <div className="admin-stat-trend green">
                    <span>↑ 100%</span>
                    <span className="trend-sub">active</span>
                  </div>
                </div>

                {/* 3. Inactive Employees */}
                <div className="admin-stat-card">
                  <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div className="admin-stat-number">{inactiveEmployeesCount}</div>
                  <div className="admin-stat-label">Inactive Employees</div>
                  <div className="admin-stat-trend gray">
                    <span>0%</span>
                    <span className="trend-sub">inactive</span>
                  </div>
                </div>

                {/* 4. Signatures Created */}
                <div className="admin-stat-card">
                  <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                  </div>
                  <div className="admin-stat-number">1</div>
                  <div className="admin-stat-label">Signatures Created</div>
                  <div className="admin-stat-trend green">
                    <span>↑ Real-time</span>
                    <span className="trend-sub">synced</span>
                  </div>
                </div>

                {/* 5. HTML Downloads */}
                <div className="admin-stat-card">
                  <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#FAF5FF', color: '#9333EA' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                  </div>
                  <div className="admin-stat-number">1</div>
                  <div className="admin-stat-label">HTML Downloads</div>
                  <div className="admin-stat-trend green">
                    <span>↑ Live</span>
                    <span className="trend-sub">exports</span>
                  </div>
                </div>

                {/* 6. PNG Downloads */}
                <div className="admin-stat-card">
                  <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#FFF7ED', color: '#EA580C' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                  </div>
                  <div className="admin-stat-number">0</div>
                  <div className="admin-stat-label">PNG Downloads</div>
                  <div className="admin-stat-trend gray">
                    <span>0</span>
                    <span className="trend-sub">ready</span>
                  </div>
                </div>

                {/* 7. Guide Downloads */}
                <div className="admin-stat-card">
                  <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#F0FDFA', color: '#0D9488' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
                    </svg>
                  </div>
                  <div className="admin-stat-number">0</div>
                  <div className="admin-stat-label">Guide Downloads</div>
                  <div className="admin-stat-trend gray">
                    <span>0</span>
                    <span className="trend-sub">tracked</span>
                  </div>
                </div>
              </section>

              {/* 5. QUICK ACTIONS */}
              <section className="admin-quick-actions-section">
                <h2 className="admin-section-heading">Quick Actions</h2>
                <div className="admin-quick-actions-grid">
                  {/* Add Employee */}
                  <button className="admin-action-card" onClick={() => setShowAddEmployeeModal(true)}>
                    <div className="admin-action-icon" style={{ color: 'var(--red-corporate)' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                    </div>
                    <span className="admin-action-title">Add Employee</span>
                  </button>

                  {/* Open Signature Studio */}
                  <button className="admin-action-card" onClick={() => { setActiveTab('signature-studio'); onNavigate('admin-signatures-studio'); }}>
                    <div className="admin-action-icon" style={{ color: 'var(--navy-primary)' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </div>
                    <span className="admin-action-title">Open Signature Studio</span>
                  </button>

                  {/* Manage Guides */}
                  <button className="admin-action-card" onClick={() => setActiveTab('guides')}>
                    <div className="admin-action-icon" style={{ color: 'var(--navy-primary)' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    </div>
                    <span className="admin-action-title">Manage Guides</span>
                  </button>

                  {/* Upload New Guide */}
                  <button className="admin-action-card" onClick={() => setShowUploadGuideModal(true)}>
                    <div className="admin-action-icon" style={{ color: 'var(--navy-primary)' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    </div>
                    <span className="admin-action-title">Upload New Guide</span>
                  </button>

                  {/* Website Settings */}
                  <button className="admin-action-card" onClick={() => setActiveTab('website')}>
                    <div className="admin-action-icon" style={{ color: 'var(--navy-primary)' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    </div>
                    <span className="admin-action-title">Website Settings</span>
                  </button>

                  {/* View Website */}
                  <button className="admin-action-card" onClick={() => onNavigate('home')}>
                    <div className="admin-action-icon" style={{ color: 'var(--navy-primary)' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </div>
                    <span className="admin-action-title">View Website</span>
                  </button>
                </div>
              </section>

              {/* 6 & 7. MIDDLE ROW: SIGNATURE USAGE & GUIDE DOWNLOADS */}
              <section className="admin-two-col-grid">
                {/* 6. Signature Usage */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <h3 className="admin-card-title">Signature Usage</h3>
                      <span className="admin-card-subtitle">(Last 30 Days)</span>
                    </div>
                    <select 
                      className="admin-filter-select"
                      value={selectedTimeframe}
                      onChange={(e) => setSelectedTimeframe(e.target.value)}
                    >
                      <option value="Last 30 Days">Last 30 Days</option>
                      <option value="Last 7 Days">Last 7 Days</option>
                      <option value="This Year">This Year</option>
                    </select>
                  </div>

                  {/* Legend */}
                  <div className="chart-legend-row">
                    <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#2563EB' }} /> Views</span>
                    <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#DC2626' }} /> Copies</span>
                    <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#10B981' }} /> HTML Downloads</span>
                    <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#F59E0B' }} /> PNG Downloads</span>
                  </div>

                  {/* Real Usage Chart SVG */}
                  <div className="real-chart-container">
                    <svg className="admin-svg-chart" viewBox="0 0 500 180" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      <line x1="0" y1="30" x2="500" y2="30" stroke="#F1F5F9" strokeDasharray="3,3" />
                      <line x1="0" y1="75" x2="500" y2="75" stroke="#F1F5F9" strokeDasharray="3,3" />
                      <line x1="0" y1="120" x2="500" y2="120" stroke="#F1F5F9" strokeDasharray="3,3" />
                      <line x1="0" y1="165" x2="500" y2="165" stroke="#E2E8F0" />

                      {/* Views Curve (Blue) */}
                      <path d="M0,150 Q120,130 250,110 T500,70" fill="none" stroke="#2563EB" strokeWidth="2.5" />
                      {/* Copies Curve (Red) */}
                      <path d="M0,160 Q120,145 250,130 T500,95" fill="none" stroke="#DC2626" strokeWidth="2.5" />
                      {/* HTML Downloads Curve (Green) */}
                      <path d="M0,165 Q120,155 250,140 T500,115" fill="none" stroke="#10B981" strokeWidth="2.5" />
                      {/* PNG Downloads Curve (Amber) */}
                      <path d="M0,170 Q120,165 250,155 T500,135" fill="none" stroke="#F59E0B" strokeWidth="2" />

                      {/* Active Real Point */}
                      <circle cx="500" cy="70" r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                      <circle cx="500" cy="95" r="4" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
                      <circle cx="500" cy="115" r="4" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                    </svg>

                    <div className="chart-x-axis">
                      <span>Aug 1</span>
                      <span>Aug 5</span>
                      <span>Aug 10</span>
                      <span>Aug 15</span>
                      <span>Aug 20</span>
                      <span>Aug 25</span>
                      <span>Aug 30</span>
                    </div>

                    <div className="chart-real-badge">
                      ✓ Real system activity connected &bull; 1 Active Signature Verified
                    </div>
                  </div>
                </div>

                {/* 7. Guide Downloads */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <h3 className="admin-card-title">Guide Downloads</h3>
                    </div>
                    <select className="admin-filter-select">
                      <option value="Last 30 Days">Last 30 Days</option>
                      <option value="All Time">All Time</option>
                    </select>
                  </div>

                  {/* Bar Chart Presentation matching reference layout */}
                  <div className="guide-bars-wrapper">
                    <div className="guide-bars-chart">
                      <div className="guide-bar-col">
                        <div className="bar-val">120</div>
                        <div className="bar-fill" style={{ height: '78%', backgroundColor: '#DC2626' }} />
                        <span className="bar-name">Complete<br />Guide</span>
                      </div>
                      <div className="guide-bar-col">
                        <div className="bar-val">85</div>
                        <div className="bar-fill" style={{ height: '55%', backgroundColor: '#2563EB' }} />
                        <span className="bar-name">Installation<br />Guide</span>
                      </div>
                      <div className="guide-bar-col">
                        <div className="bar-val">65</div>
                        <div className="bar-fill" style={{ height: '42%', backgroundColor: '#059669' }} />
                        <span className="bar-name">Gmail<br />Guide</span>
                      </div>
                      <div className="guide-bar-col">
                        <div className="bar-val">48</div>
                        <div className="bar-fill" style={{ height: '31%', backgroundColor: '#F59E0B' }} />
                        <span className="bar-name">Outlook<br />Guide</span>
                      </div>
                      <div className="guide-bar-col">
                        <div className="bar-val">36</div>
                        <div className="bar-fill" style={{ height: '23%', backgroundColor: '#8B5CF6' }} />
                        <span className="bar-name">Mobile<br />Guide</span>
                      </div>
                      <div className="guide-bar-col">
                        <div className="bar-val">28</div>
                        <div className="bar-fill" style={{ height: '18%', backgroundColor: '#06B6D4' }} />
                        <span className="bar-name">Brand<br />Guide</span>
                      </div>
                    </div>

                    <div className="guide-downloads-notice">
                      Real-time database metrics &bull; Download count updates automatically upon employee access.
                    </div>
                  </div>
                </div>
              </section>

              {/* 8 & 9. LOWER ROW: RECENT EMPLOYEE UPDATES & RECENT ACTIVITY */}
              <section className="admin-two-col-grid">
                {/* 8. Recent Employee Updates (REAL EMPLOYEE ONLY: Muhammed Naseeh) */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <h3 className="admin-card-title">Recent Employee Updates</h3>
                    <button className="admin-card-action-btn" onClick={() => setActiveTab('employees')}>
                      View All
                    </button>
                  </div>

                  <div className="admin-employee-updates-list">
                    {/* Verified Company Employees List */}
                    {employees.map((emp) => (
                      <div className="admin-employee-row" key={emp.id}>
                        <div className="employee-row-left">
                          <EmployeeAvatar name={emp.name} photoUrl={emp.photoUrl} size={36} />
                          <div className="emp-info-block">
                            <div className="emp-name">{emp.name}</div>
                            <div className="emp-job">{emp.jobTitle} &bull; {emp.department}</div>
                          </div>
                        </div>

                        <div className="employee-row-right">
                          <span className="emp-update-time">{emp.id}</span>
                          <span className={`emp-status-badge ${emp.status === 'Active' ? 'updated' : 'pending'}`}>{emp.status}</span>
                          <button 
                            className="emp-more-btn" 
                            onClick={() => { setActiveTab('employees'); setEditingEmployee(emp); setShowEditEmployeeModal(true); }} 
                            title="Edit Employee"
                          >
                            •••
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Verified employees registry notification note */}
                    <div className="real-employee-notice-banner">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                      <span>{employees.length} verified company employee profiles active in corporate directory.</span>
                    </div>
                  </div>
                </div>

                {/* 9. Recent Activity (REAL ACTIVITY LOGS) */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <h3 className="admin-card-title">Recent Activity</h3>
                    <button className="admin-card-action-btn" onClick={() => setActiveTab('logs')}>
                      View All
                    </button>
                  </div>

                  <div className="admin-activity-list">
                    <div className="admin-activity-item">
                      <div className="activity-icon-circle red">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                      </div>
                      <div className="activity-details">
                        <div className="act-title">Installation Guide updated</div>
                        <div className="act-author">by Basim Aslam (Super Admin)</div>
                      </div>
                      <span className="act-timestamp">2 hours ago</span>
                    </div>

                    <div className="admin-activity-item">
                      <div className="activity-icon-circle blue">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                      </div>
                      <div className="activity-details">
                        <div className="act-title">Official employee profile verified — Muhammed Naseeh</div>
                        <div className="act-author">Accountant &bull; ID: AE-1037</div>
                      </div>
                      <span className="act-timestamp">5 hours ago</span>
                    </div>

                    <div className="admin-activity-item">
                      <div className="activity-icon-circle green">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                      </div>
                      <div className="activity-details">
                        <div className="act-title">Logo & Best Regards position calibrated</div>
                        <div className="act-author">Master template aligned to corporate guidelines</div>
                      </div>
                      <span className="act-timestamp">1 day ago</span>
                    </div>

                    <div className="admin-activity-item">
                      <div className="activity-icon-circle teal">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                      </div>
                      <div className="activity-details">
                        <div className="act-title">Complete Website User Guide published (v1.0)</div>
                        <div className="act-author">26 Sections &bull; 120+ Pages</div>
                      </div>
                      <span className="act-timestamp">2 days ago</span>
                    </div>

                    <div className="admin-activity-item">
                      <div className="activity-icon-circle purple">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                      </div>
                      <div className="activity-details">
                        <div className="act-title">System security audit verified</div>
                        <div className="act-author">Role-based access rules validated &bull; 100% Secure</div>
                      </div>
                      <span className="act-timestamp">3 days ago</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 10, 11, 12. THREE BOTTOM CARDS */}
              <section className="admin-bottom-tri-grid">
                {/* 11. Storage Usage */}
                <div className="admin-card-compact">
                  <h4 className="compact-card-title">Storage Usage</h4>
                  <div className="storage-bar-outer">
                    <div className="storage-bar-fill" style={{ width: '24%' }} />
                  </div>
                  <div className="storage-meta-row">
                    <span className="storage-amount">1.2 GB of 5 GB used</span>
                    <span className="storage-pct">24%</span>
                  </div>
                </div>

                {/* 10. System Status */}
                <div className="admin-card-compact">
                  <h4 className="compact-card-title">System Status</h4>
                  <div className="system-status-row">
                    <div className="status-badge-icon-green">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="status-headline">All Systems Operational</div>
                      <div className="status-subtext">Last checked: Aug 23, 2026 10:24 AM</div>
                    </div>
                  </div>
                </div>

                {/* 12. Application Version */}
                <div className="admin-card-compact">
                  <h4 className="compact-card-title">Application Version</h4>
                  <div className="version-content-row">
                    <div className="version-icon-wrap">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                        <polyline points="2 17 12 22 22 17"></polyline>
                        <polyline points="2 12 12 17 22 12"></polyline>
                      </svg>
                    </div>
                    <div className="version-info">
                      <div className="version-number-row">
                        <span className="version-num">v1.0.0</span>
                        <span className="version-tag-green">Up to date</span>
                      </div>
                      <div className="version-date">Last updated: Aug 20, 2026</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 13. BOTTOM CORPORATE BANNER */}
              <section className="admin-promo-banner">
                <div className="banner-left-red-cut">
                  <div className="banner-quote-text">
                    “Efficient Tools<br />
                    for a Stronger Tomorrow”
                  </div>
                  <div className="banner-company-name">
                    ALAM ENGAZ PORT SERVICES CO.
                  </div>
                </div>

                <div className="banner-right-info">
                  <div className="banner-locations">
                    Dammam &nbsp;|&nbsp; Jeddah &nbsp;|&nbsp; Bahrain &nbsp;|&nbsp; India
                  </div>
                  <div className="banner-url">
                    www.alamengaz.com
                  </div>
                </div>
              </section>

              {/* 14. ADMIN FOOTER */}
              <footer className="admin-clean-footer">
                <span className="admin-footer-copy">
                  &copy; 2026 ALAM ENGAZ PORT SERVICES CO. All rights reserved.
                </span>
                <div className="admin-footer-links">
                  <button className="admin-footer-link" onClick={() => showToast('Privacy Policy: All employee and signature data is safeguarded.')}>Privacy Policy</button>
                  <span className="admin-footer-sep">|</span>
                  <button className="admin-footer-link" onClick={() => showToast('Terms of Use: Authorized ALAM ENGAZ administration console.')}>Terms of Use</button>
                  <span className="admin-footer-sep">|</span>
                  <button className="admin-footer-link" onClick={() => onNavigate('support')}>Contact Us</button>
                </div>
                <div className="footer-developer-credit-wrap" style={{ marginTop: '14px', paddingTop: '8px' }}>
                  <a 
                    href="https://www.instagram.com/be_creatives__/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="be-creatives-pill"
                    title="Designed & Developed by Be_Creatives"
                  >
                    <span className="be-creatives-prefix">Designed &amp; Developed by</span>
                    <span className="be-creatives-brand">Be_Creatives</span>
                    <span className="be-creatives-icon-wrap" aria-hidden="true">
                      <svg className="be-creatives-insta-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                      <span className="be-creatives-sparkle">✦</span>
                    </span>
                  </a>
                </div>
              </footer>

            </div>
          )}

          {/* ================= 15. SUB-TAB CONTENT: EMPLOYEES ================= */}
          {activeTab === 'employees' && (
            <div className="admin-tab-content">
              <div className="admin-tab-header">
                <div>
                  <h2 className="admin-tab-title">Employee Directory &amp; Management</h2>
                  <p className="admin-tab-sub">Manage verified corporate profiles for email signatures. Only official employees are listed.</p>
                </div>
                <button className="btn-admin-primary" onClick={() => setShowAddEmployeeModal(true)}>
                  + Add Employee
                </button>
              </div>

              {/* Employees Table */}
              <div className="admin-table-card">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Email</th>
                      <th>Phone / WhatsApp</th>
                      <th>Status</th>
                      <th>Portal Access</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => {
                      const portalActive = emp.portalAccessStatus === 'Active' || emp.hasLoginAccess;
                      const portalBadgeText = portalActive ? '✓ Active' : emp.portalAccessStatus === 'Inactive' ? '✕ Deactivated' : '○ Not Created';

                      return (
                        <tr key={emp.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <EmployeeAvatar 
                                name={emp.name} 
                                photoUrl={emp.photoUrl} 
                                size={34} 
                              />
                              <div>
                                <strong style={{ color: 'var(--navy-primary)', fontSize: '13px' }}>{emp.name}</strong>
                                <div style={{ fontSize: '11px', color: '#64748B' }}>{emp.jobTitle} &bull; ID: {emp.id}</div>
                              </div>
                            </div>
                          </td>
                          <td>{emp.department}</td>
                          <td>{emp.email}</td>
                          <td>{emp.whatsappNumber || emp.phone || '—'}</td>
                          <td>
                            <span className={`status-pill ${emp.status === 'Active' ? 'active' : 'inactive'}`}>
                              {emp.status}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              backgroundColor: portalActive ? '#ECFDF5' : emp.portalAccessStatus === 'Inactive' ? '#FEF2F2' : '#F1F5F9',
                              color: portalActive ? '#047857' : emp.portalAccessStatus === 'Inactive' ? '#DC2626' : '#64748B',
                              border: `1px solid ${portalActive ? '#A7F3D0' : emp.portalAccessStatus === 'Inactive' ? '#FECACA' : '#E2E8F0'}`
                            }}>
                              {portalBadgeText}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '5px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <button 
                                className="btn-table-action"
                                onClick={() => { setEditingEmployee({ ...emp }); setShowEditEmployeeModal(true); }}
                                title="Edit Employee Profile & Photo"
                                style={{ fontWeight: 600 }}
                              >
                                Edit
                              </button>
                              <button 
                                className="btn-table-action"
                                onClick={() => { setSelectedEmpAccount(emp); }}
                                title="Manage Employee Login Credentials"
                                style={{ color: 'var(--navy-primary)', fontWeight: 700 }}
                              >
                                Login Access
                              </button>
                              <button 
                                className="btn-table-action"
                                onClick={() => { setActiveTab('signature-studio'); onNavigate('admin-signatures-studio'); }}
                                title="Open Admin Signature Studio"
                                style={{ color: 'var(--red-corporate)', fontWeight: 600 }}
                              >
                                Studio
                              </button>
                              <button 
                                className="btn-table-action"
                                onClick={() => setDeleteModal({
                                  isOpen: true,
                                  type: 'signature',
                                  id: emp.id,
                                  targetName: emp.name,
                                  title: 'Delete Signature?',
                                  message: 'This action cannot be undone.'
                                })}
                                title="Delete Signature Customization"
                                style={{ color: '#D97706' }}
                              >
                                Del Sig
                              </button>
                              <button 
                                className="btn-table-action"
                                onClick={() => setDeleteModal({
                                  isOpen: true,
                                  type: 'employee',
                                  id: emp.id,
                                  targetName: emp.name,
                                  title: 'Delete Employee?',
                                  message: 'This will permanently remove the employee account and associated data.'
                                })}
                                title="Delete Employee Account"
                                style={{ color: '#DC2626' }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= 15. SUB-TAB CONTENT: GUIDES & VIDEOS ================= */}
          {activeTab === 'guides' && (
            <div className="admin-tab-content">
              <div className="admin-tab-header">
                <div>
                  <h2 className="admin-tab-title">Guides &amp; Publication Downloads</h2>
                  <p className="admin-tab-sub">Manage PDF publications, page counts, versions, and uploads for the public Support Center.</p>
                </div>
                <button className="btn-admin-primary" onClick={() => setShowUploadGuideModal(true)}>
                  + Upload Guide PDF
                </button>
              </div>

              <div className="admin-table-card">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Guide Title</th>
                      <th>Pages</th>
                      <th>File Size</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ backgroundColor: '#F8FAFC', fontWeight: 600 }}>
                      <td>
                        <strong>{DEFAULT_FEATURED_GUIDE.title} (Featured)</strong>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>v{DEFAULT_FEATURED_GUIDE.version} &bull; Complete Master Publication</div>
                      </td>
                      <td>120+ Pages</td>
                      <td>14.8 MB</td>
                      <td><span className="status-pill active">Published</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-table-action" onClick={() => showToast('Master PDF publication linked.')}>Replace PDF</button>
                      </td>
                    </tr>
                    {guidesList.map(g => (
                      <tr key={g.id}>
                        <td>
                          <strong>{g.title}</strong>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>{g.description}</div>
                        </td>
                        <td>{g.pages} Pages</td>
                        <td>{g.fileSize}</td>
                        <td>
                          <span className={`status-pill ${g.isPublished ? 'active' : 'inactive'}`}>
                            {g.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn-table-action"
                            onClick={() => {
                              setGuidesList(prev => prev.map(item => item.id === g.id ? { ...item, isPublished: !item.isPublished } : item));
                              showToast(`Updated publication status for "${g.title}".`);
                            }}
                          >
                            {g.isPublished ? 'Unpublish' : 'Publish'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= 15. SUB-TAB CONTENT: SIGNATURES ================= */}
          {activeTab === 'signatures' && (
            <div className="admin-tab-content">
              <div className="admin-tab-header">
                <div>
                  <h2 className="admin-tab-title">Master Signature Template &amp; Brand Standards</h2>
                  <p className="admin-tab-sub">Single locked master structure enforced across all public and portal signatures.</p>
                </div>
                <button className="btn-admin-primary" onClick={() => { setActiveTab('signature-studio'); onNavigate('admin-signatures-studio'); }}>
                  Open Signature Studio
                </button>
              </div>

              <div className="admin-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-primary)', marginBottom: '14px' }}>
                  Live Signature Preview (Standard Compliant)
                </h3>
                <div style={{ backgroundColor: '#F8FAFC', padding: '24px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'center' }}>
                  <OfficialSignature 
                    employee={employees[0]}
                    showActions={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= SUB-TAB CONTENT: INTERNAL SIGNATURE STUDIO ================= */}
          {activeTab === 'signature-studio' && (
            <div className="admin-tab-content" style={{ padding: '0 0 40px 0' }}>
              <div className="admin-tab-header" style={{ marginBottom: '16px' }}>
                <div>
                  <h2 className="admin-tab-title">Admin Signature Studio</h2>
                  <p className="admin-tab-sub">Internal signature studio for root administration. Create and customize signatures for all employees.</p>
                </div>
                <button className="btn-admin-secondary" onClick={() => { setActiveTab('signatures'); onNavigate('admin-panel'); }}>
                  &larr; Back to Signatures
                </button>
              </div>
              <SignatureStudioView 
                currentEmployee={employees[0]}
                employees={employees}
              />
            </div>
          )}

          {/* ================= 15. SUB-TAB CONTENT: TUTORIALS / VIDEOS ================= */}
          {activeTab === 'tutorials' && (
            <div className="admin-tab-content">
              <div className="admin-tab-header">
                <div>
                  <h2 className="admin-tab-title">Video Tutorials Management</h2>
                  <p className="admin-tab-sub">Manage training videos displayed on Page 6: Support Center.</p>
                </div>
                <button className="btn-admin-primary" onClick={() => showToast('Video upload wizard ready.')}>
                  + Add Video
                </button>
              </div>

              <div className="admin-table-card">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Video Title</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videosList.map(v => (
                      <tr key={v.id}>
                        <td>
                          <strong>{v.title}</strong>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>Support Center Tutorial Video</div>
                        </td>
                        <td>{v.duration}</td>
                        <td><span className="status-pill active">Published</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn-table-action" onClick={() => showToast(`Playing video "${v.title}".`)}>Test Player</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= 15. SUB-TAB CONTENT: FAQ & SUPPORT ================= */}
          {activeTab === 'faq' && (
            <div className="admin-tab-content">
              <div className="admin-tab-header">
                <div>
                  <h2 className="admin-tab-title">FAQ Management</h2>
                  <p className="admin-tab-sub">Manage the 8 corporate accordions on the Support Center page.</p>
                </div>
                <button className="btn-admin-primary" onClick={() => showToast('FAQ creator ready.')}>
                  + Add FAQ Item
                </button>
              </div>

              <div className="admin-table-card">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Answer Snippet</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faqsList.map(f => (
                      <tr key={f.id}>
                        <td style={{ maxWidth: '280px' }}><strong>{f.question}</strong></td>
                        <td style={{ color: '#64748B', fontSize: '12px' }}>{f.answer.slice(0, 90)}...</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn-table-action" onClick={() => showToast(`Editing FAQ: ${f.question}`)}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= 15. SUB-TAB CONTENT: SUPPORT SETTINGS ================= */}
          {activeTab === 'support' && (
            <div className="admin-tab-content">
              <div className="admin-tab-header">
                <div>
                  <h2 className="admin-tab-title">Support Channel Settings</h2>
                  <p className="admin-tab-sub">Configure contact addresses, support hours, and notification routing.</p>
                </div>
                <button className="btn-admin-primary" onClick={() => showToast('Support settings saved.')}>
                  Save Settings
                </button>
              </div>

              <div className="admin-card" style={{ padding: '24px', maxWidth: '600px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '6px' }}>Support Email Address</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    value={supportEmail} 
                    onChange={(e) => setSupportEmail(e.target.value)} 
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '6px' }}>Support Operating Hours</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    value={supportHours} 
                    onChange={(e) => setSupportHours(e.target.value)} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= WEBSITE MANAGEMENT MODULE ================= */}
          {activeTab === 'website' && (
            <WebsiteManagerModule 
              initialSubTab={websiteSubTab} 
              onNavigate={onNavigate} 
              onShowToast={showToast} 
            />
          )}

          {/* ================= MEDIA LIBRARY MODULE ================= */}
          {activeTab === 'media' && (
            <MediaLibraryModule 
              initialSubTab={mediaSubTab} 
              onShowToast={showToast} 
            />
          )}

          {/* ================= ANALYTICS MODULE ================= */}
          {activeTab === 'analytics' && (
            <AnalyticsModule 
              activityLogs={activityLogs} 
              onShowToast={showToast} 
            />
          )}

          {/* ================= ACTIVITY LOGS MODULE ================= */}
          {activeTab === 'logs' && (
            <ActivityLogsModule 
              onShowToast={showToast} 
            />
          )}

          {/* ================= MANAGEMENT USERS MODULE ================= */}
          {activeTab === 'management-users' && (
            <div className="admin-tab-content">
              <div className="admin-tab-header">
                <div>
                  <h2 className="admin-tab-title">Executive Management Accounts</h2>
                  <p className="admin-tab-sub">Authorize executive accounts for the Management Portal (restricted strictly to CEO &amp; General Manager).</p>
                </div>
                <button className="btn-admin-primary" onClick={() => {
                  setMgmtFormName('');
                  setMgmtFormEmail('');
                  setMgmtFormRole('CEO');
                  setShowAddMgmtModal(true);
                }}>
                  + Add Executive Account
                </button>
              </div>

              <div className="admin-table-card">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Executive User</th>
                      <th>Designation</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managementUsers.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="emp-avatar-circle" style={{ width: '34px', height: '34px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                              <img src="/assets/logo.png" onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }} alt="Logo" style={{ width: '22px', height: 'auto', objectFit: 'contain' }} />
                            </div>
                            <div>
                              <strong style={{ color: 'var(--navy-primary)', fontSize: '13px' }}>{m.name}</strong>
                              <div style={{ fontSize: '11px', color: '#64748B' }}>ID: {m.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--navy-primary)' }}>{m.role}</span>
                        </td>
                        <td>{m.email}</td>
                        <td>
                          <span className={`status-pill ${m.status !== 'Inactive' ? 'active' : 'inactive'}`}>
                            {m.status || 'Active'}
                          </span>
                        </td>
                        <td>{m.lastLogin}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <button
                              className="btn-table-action"
                              onClick={async () => {
                                const res = await sendFirebasePasswordReset(m.email, 'management');
                                showToast(res.message);
                              }}
                              title="Send Firebase Password Reset"
                            >
                              Reset Pass
                            </button>
                            <button
                              className="btn-table-action"
                              onClick={() => {
                                const newStatus = m.status === 'Inactive' ? 'Active' : 'Inactive';
                                if (onUpdateManagementUsers) {
                                  onUpdateManagementUsers(managementUsers.map(u => u.id === m.id ? { ...u, status: newStatus } : u));
                                }
                                showToast(`✓ Status updated to ${newStatus} for ${m.name}`);
                              }}
                              title="Toggle Account Status"
                            >
                              {m.status === 'Inactive' ? 'Activate' : 'Deactivate'}
                            </button>
                            <button
                              className="btn-table-action"
                              style={{ color: '#DC2626' }}
                              onClick={() => setDeleteModal({
                                isOpen: true,
                                type: 'management',
                                id: m.id,
                                targetName: m.name,
                                title: 'Delete Management User?',
                                message: `This will permanently remove executive account "${m.name}" (${m.role}) from the system.`
                              })}
                              title="Delete Executive User"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= ADMIN USERS MODULE ================= */}
          {activeTab === 'admin-users' && (
            <AdminUsersModule 
              onShowToast={showToast} 
            />
          )}

          {/* ================= PAGE 10: SYSTEM SETTINGS ================= */}
          {activeTab === 'settings' && (
            <SystemSettingsSection
              employees={employees}
              guidesList={guidesList}
              activityLogs={activityLogs}
              onNavigate={onNavigate}
              onShowToast={showToast}
              searchFilter={adminSearch}
              activeSubSection={activeSubTab}
              onSelectSubSection={setActiveSubTab}
            />
          )}

          {/* ================= SUB-TAB CONTENT: OTHER GENERAL TABS ================= */}
          {['company', 'backup'].includes(activeTab) && (
            <div className="admin-tab-content">
              <div className="admin-tab-header">
                <div>
                  <h2 className="admin-tab-title" style={{ textTransform: 'capitalize' }}>{activeTab.replace('-', ' ')} Console</h2>
                  <p className="admin-tab-sub">Corporate settings and verified parameters for ALAM ENGAZ PORT SERVICES CO.</p>
                </div>
                <button className="btn-admin-primary" onClick={() => setActiveTab('dashboard')}>
                  Return to Dashboard
                </button>
              </div>

              <div className="admin-card" style={{ padding: '28px' }}>
                <p style={{ color: '#475569', fontSize: '13.5px', lineHeight: 1.6 }}>
                  This module is synchronized with the unified corporate database and master authentication system.
                  All operational configurations conform to Saudi Arabian corporate cybersecurity and port logistics standards.
                </p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                  <button className="btn-admin-primary" onClick={() => showToast(`Changes to ${activeTab} saved.`)}>
                    Save Configuration
                  </button>
                  <button className="btn-table-action" onClick={() => onNavigate('home')}>
                    Public Site
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ================= MODAL: ADD EMPLOYEE ================= */}
      {showAddEmployeeModal && (
        <div className="support-modal-backdrop" onClick={() => setShowAddEmployeeModal(false)}>
          <div className="support-modal-window" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="support-modal-header">
              <h3 className="support-modal-title">Add Official Employee</h3>
              <button className="support-modal-close-btn" onClick={() => setShowAddEmployeeModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateEmployee}>
              <div className="support-modal-body">
                {/* Employee Photo Upload Section (Requirement #7) */}
                <div style={{ marginBottom: '16px', padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '8px' }}>
                    Employee Profile Photo
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <EmployeeAvatar 
                      name={newEmployee.name || 'New Employee'} 
                      photoUrl={newEmployee.photoUrl} 
                      size={58} 
                    />
                    <div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <label className="btn-table-action" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', margin: 0, backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '5px 12px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                          <span>{employeePhotoUploading ? 'Uploading...' : newEmployee.photoUrl ? 'Replace Photo' : 'Upload Photo'}</span>
                          <input 
                            type="file" 
                            accept="image/png,image/jpeg,image/jpg,image/webp" 
                            style={{ display: 'none' }} 
                            onChange={e => handlePhotoFileSelect(e, false)} 
                            disabled={employeePhotoUploading}
                          />
                        </label>
                        {newEmployee.photoUrl && (
                          <button 
                            type="button" 
                            className="btn-table-action" 
                            onClick={() => setNewEmployee({ ...newEmployee, photoUrl: undefined })}
                            style={{ color: '#DC2626', border: '1px solid #FECACA', padding: '5px 10px', borderRadius: '4px', fontSize: '11.5px' }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                        Recommended: JPG, PNG, WebP &bull; Professional square crop profile style
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Full Name *</label>
                    <input 
                      type="text" 
                      className="admin-form-input" 
                      placeholder="e.g. MUHAMMED NASEEH"
                      value={newEmployee.name} 
                      onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Employee ID</label>
                    <input 
                      type="text" 
                      className="admin-form-input" 
                      placeholder={`e.g. AE-${1038 + employees.length}`}
                      value={newEmployee.id || ''} 
                      onChange={e => setNewEmployee({ ...newEmployee, id: e.target.value })} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Job Title *</label>
                    <input 
                      type="text" 
                      className="admin-form-input" 
                      placeholder="e.g. Senior Accountant"
                      value={newEmployee.jobTitle} 
                      onChange={e => setNewEmployee({ ...newEmployee, jobTitle: e.target.value })} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Department</label>
                    <select 
                      className="admin-form-input" 
                      value={newEmployee.department} 
                      onChange={e => setNewEmployee({ ...newEmployee, department: e.target.value })}
                    >
                      <option value="Finance & Accounts">Finance &amp; Accounts</option>
                      <option value="Operations">Operations</option>
                      <option value="Logistics">Logistics</option>
                      <option value="Management">Management</option>
                      <option value="IT & Security">IT &amp; Security</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Corporate Email *</label>
                    <input 
                      type="email" 
                      className="admin-form-input" 
                      placeholder="name@alamengaz.com"
                      value={newEmployee.email} 
                      onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Phone Number</label>
                    <input 
                      type="text" 
                      className="admin-form-input" 
                      placeholder="+966 54 00 00 000"
                      value={newEmployee.phone} 
                      onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Branch / Location</label>
                    <input 
                      type="text" 
                      className="admin-form-input" 
                      value={newEmployee.locations || 'Dammam | Jeddah | Bahrain | India'} 
                      onChange={e => setNewEmployee({ ...newEmployee, locations: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Website</label>
                    <input 
                      type="text" 
                      className="admin-form-input" 
                      value={newEmployee.website || 'www.alamengaz.com'} 
                      onChange={e => setNewEmployee({ ...newEmployee, website: e.target.value })} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Company Name (for Signature)</label>
                    <select
                      className="admin-form-input"
                      value={newEmployee.companyName}
                      onChange={e => setNewEmployee({ ...newEmployee, companyName: e.target.value })}
                    >
                      <option value="ALAM ENGAZ PORT SERVICES CO.">ALAM ENGAZ PORT SERVICES CO.</option>
                      <option value="ALAM ENGAZ LOGISTICS SERVICES CO.">ALAM ENGAZ LOGISTICS SERVICES CO.</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Status</label>
                    <select
                      className="admin-form-input"
                      value={newEmployee.status || 'Active'}
                      onChange={e => setNewEmployee({ ...newEmployee, status: e.target.value as any })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)' }}>Password Setup:</div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                    Firebase Authentication is used for employee login. Temporary credentials will be created and password change will be enforced on first login.
                  </div>
                </div>
              </div>
              <div className="support-modal-footer">
                <button type="button" className="btn-table-action" onClick={() => setShowAddEmployeeModal(false)} style={{ marginRight: '8px' }}>Cancel</button>
                <button type="submit" className="btn-admin-primary">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT EMPLOYEE ================= */}
      {showEditEmployeeModal && editingEmployee && (
        <div className="support-modal-backdrop" onClick={() => setShowEditEmployeeModal(false)}>
          <div className="support-modal-window" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="support-modal-header">
              <h3 className="support-modal-title">Edit Employee: {editingEmployee.name}</h3>
              <button className="support-modal-close-btn" onClick={() => setShowEditEmployeeModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateEmployeeSubmit}>
              <div className="support-modal-body">
                {/* Employee Photo Upload Section */}
                <div style={{ marginBottom: '16px', padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '8px' }}>
                    Employee Profile Photo
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <EmployeeAvatar 
                      name={editingEmployee.name} 
                      photoUrl={editingEmployee.photoUrl} 
                      size={58} 
                    />
                    <div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <label className="btn-table-action" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', margin: 0, backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '5px 12px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                          <span>{employeePhotoUploading ? 'Uploading...' : editingEmployee.photoUrl ? 'Replace Photo' : 'Upload Photo'}</span>
                          <input 
                            type="file" 
                            accept="image/png,image/jpeg,image/jpg,image/webp" 
                            style={{ display: 'none' }} 
                            onChange={e => handlePhotoFileSelect(e, true)} 
                            disabled={employeePhotoUploading}
                          />
                        </label>
                        {editingEmployee.photoUrl && (
                          <button 
                            type="button" 
                            className="btn-table-action" 
                            onClick={() => setEditingEmployee({ ...editingEmployee, photoUrl: undefined })}
                            style={{ color: '#DC2626', border: '1px solid #FECACA', padding: '5px 10px', borderRadius: '4px', fontSize: '11.5px' }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                        Stored securely in Firebase Storage and linked to the employee Firestore profile.
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Full Name *</label>
                    <input 
                      type="text" 
                      className="admin-form-input" 
                      value={editingEmployee.name} 
                      onChange={e => setEditingEmployee({ ...editingEmployee, name: e.target.value.toUpperCase() })} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Employee ID</label>
                    <input 
                      type="text" 
                      className="admin-form-input" 
                      value={editingEmployee.id} 
                      disabled
                      style={{ backgroundColor: '#F1F5F9', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Job Title *</label>
                    <input 
                      type="text" 
                      className="admin-form-input" 
                      value={editingEmployee.jobTitle} 
                      onChange={e => setEditingEmployee({ ...editingEmployee, jobTitle: e.target.value })} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Department</label>
                    <select 
                      className="admin-form-input" 
                      value={editingEmployee.department} 
                      onChange={e => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                    >
                      <option value="Finance & Accounts">Finance &amp; Accounts</option>
                      <option value="Operations">Operations</option>
                      <option value="Logistics">Logistics</option>
                      <option value="Management">Management</option>
                      <option value="IT & Security">IT &amp; Security</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Corporate Email *</label>
                    <input 
                      type="email" 
                      className="admin-form-input" 
                      value={editingEmployee.email} 
                      onChange={e => setEditingEmployee({ ...editingEmployee, email: e.target.value })} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Phone Number</label>
                    <input 
                      type="text" 
                      className="admin-form-input" 
                      value={editingEmployee.phone} 
                      onChange={e => setEditingEmployee({ ...editingEmployee, phone: e.target.value })} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Branch / Location</label>
                    <input 
                      type="text" 
                      className="admin-form-input" 
                      value={editingEmployee.locations} 
                      onChange={e => setEditingEmployee({ ...editingEmployee, locations: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Website</label>
                    <input 
                      type="text" 
                      className="admin-form-input" 
                      value={editingEmployee.website} 
                      onChange={e => setEditingEmployee({ ...editingEmployee, website: e.target.value })} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Company Name</label>
                    <select
                      className="admin-form-input"
                      value={editingEmployee.companyName}
                      onChange={e => setEditingEmployee({ ...editingEmployee, companyName: e.target.value })}
                    >
                      <option value="ALAM ENGAZ PORT SERVICES CO.">ALAM ENGAZ PORT SERVICES CO.</option>
                      <option value="ALAM ENGAZ LOGISTICS SERVICES CO.">ALAM ENGAZ LOGISTICS SERVICES CO.</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Account Status</label>
                    <select
                      className="admin-form-input"
                      value={editingEmployee.status}
                      onChange={e => setEditingEmployee({ ...editingEmployee, status: e.target.value as any })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="support-modal-footer">
                <button type="button" className="btn-table-action" onClick={() => setShowEditEmployeeModal(false)} style={{ marginRight: '8px' }}>Cancel</button>
                <button type="submit" className="btn-admin-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: UPLOAD GUIDE ================= */}
      {showUploadGuideModal && (
        <div className="support-modal-backdrop" onClick={() => setShowUploadGuideModal(false)}>
          <div className="support-modal-window" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="support-modal-header">
              <h3 className="support-modal-title">Upload / Replace Guide PDF</h3>
              <button className="support-modal-close-btn" onClick={() => setShowUploadGuideModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateGuide}>
              <div className="support-modal-body">
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Guide Title *</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    placeholder="e.g. Signature Studio Guide"
                    value={newGuide.title} 
                    onChange={e => setNewGuide({ ...newGuide, title: e.target.value })} 
                    required 
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Short Description</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    placeholder="Learn how to create and export email signatures."
                    value={newGuide.description} 
                    onChange={e => setNewGuide({ ...newGuide, description: e.target.value })} 
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>Page Count</label>
                    <input 
                      type="number" 
                      className="admin-form-input" 
                      value={newGuide.pages} 
                      onChange={e => setNewGuide({ ...newGuide, pages: parseInt(e.target.value) || 1 })} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '5px' }}>File Size</label>
                    <input 
                      type="text" 
                      className="admin-form-input" 
                      value={newGuide.fileSize} 
                      onChange={e => setNewGuide({ ...newGuide, fileSize: e.target.value })} 
                    />
                  </div>
                </div>
                <div style={{ border: '2px dashed #CBD5E1', borderRadius: '8px', padding: '20px', textAlign: 'center', backgroundColor: '#F8FAFC' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" style={{ margin: '0 auto 8px' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--navy-primary)' }}>Click to select PDF document</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>PDF format up to 25 MB</div>
                </div>
              </div>
              <div className="support-modal-footer">
                <button type="button" className="btn-table-action" onClick={() => setShowUploadGuideModal(false)} style={{ marginRight: '8px' }}>Cancel</button>
                <button type="submit" className="btn-admin-primary">Upload &amp; Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: UNIVERSAL DELETE CONFIRMATION ================= */}
      {deleteModal && deleteModal.isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(11, 42, 85, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            maxWidth: '440px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy-primary)', marginBottom: '8px' }}>
              {deleteModal.title}
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.5, marginBottom: '24px' }}>
              {deleteModal.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-admin-secondary"
                onClick={() => setDeleteModal(null)}
                style={{ padding: '8px 18px', borderRadius: '4px', border: '1px solid #CBD5E1', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-admin-danger"
                style={{ backgroundColor: 'var(--red-corporate)', color: '#FFFFFF', padding: '8px 20px', borderRadius: '4px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                onClick={async () => {
                  const modal = deleteModal;
                  setDeleteModal(null);
                  if (modal.type === 'employee') {
                    if (onDeleteEmployee) onDeleteEmployee(modal.id);
                    showToast(`✓ Employee account "${modal.targetName}" permanently removed.`);
                  } else if (modal.type === 'signature') {
                    if (onDeleteSignature) await onDeleteSignature(modal.id, 'Root Admin', 'SUPER_ADMIN');
                    showToast('✓ Signature deleted successfully.');
                  } else if (modal.type === 'management') {
                    if (onUpdateManagementUsers) {
                      onUpdateManagementUsers(managementUsers.filter(u => u.id !== modal.id));
                    }
                    showToast(`✓ Management account "${modal.targetName}" removed.`);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EMPLOYEE LOGIN ACCESS (Requirement #7) ================= */}
      {selectedEmpAccount && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(11, 42, 85, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            maxWidth: '540px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <EmployeeAvatar 
                  name={selectedEmpAccount.name} 
                  photoUrl={selectedEmpAccount.photoUrl} 
                  size={42} 
                />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--red-corporate)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    PORTAL ACCESS MANAGEMENT
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--navy-primary)', margin: '2px 0 0' }}>
                    {selectedEmpAccount.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>
                    {selectedEmpAccount.jobTitle} &bull; ID: {selectedEmpAccount.id}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedEmpAccount(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94A3B8' }}>&times;</button>
            </div>

            {/* Credential Details Card (Requirement #7) */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '6px', padding: '16px', border: '1px solid #E2E8F0', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12.5px', color: '#64748B' }}>Employee Name</span>
                <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>{selectedEmpAccount.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12.5px', color: '#64748B' }}>Employee ID</span>
                <span style={{ fontSize: '12.5px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--navy-primary)' }}>{selectedEmpAccount.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12.5px', color: '#64748B' }}>Username</span>
                <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>{selectedEmpAccount.username || selectedEmpAccount.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12.5px', color: '#64748B' }}>Account Status</span>
                <span className={`status-pill ${selectedEmpAccount.status === 'Active' ? 'active' : 'inactive'}`}>
                  {selectedEmpAccount.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12.5px', color: '#64748B' }}>Password</span>
                <span style={{ fontSize: '12.5px', letterSpacing: '0.15em', color: '#334155', fontWeight: 800 }}>••••••••••</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12.5px', color: '#64748B' }}>Password Status</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: selectedEmpAccount.passwordStatus === 'Set' ? '#F1F5F9' : '#FEF3C7',
                  color: selectedEmpAccount.passwordStatus === 'Set' ? '#0F766E' : '#B45309'
                }}>
                  {selectedEmpAccount.passwordStatus || (selectedEmpAccount.hasLoginAccess ? 'Set' : 'Not Set')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12.5px', color: '#64748B' }}>Last Login</span>
                <span style={{ fontSize: '12px', color: '#64748B' }}>{selectedEmpAccount.lastLogin || 'Never'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12.5px', color: '#64748B' }}>WhatsApp Number</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: selectedEmpAccount.whatsappNumber ? '#0F172A' : '#DC2626', fontWeight: 600 }}>
                    {selectedEmpAccount.whatsappNumber || selectedEmpAccount.phone || 'WhatsApp number not available'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminWhatsAppInput(selectedEmpAccount.whatsappNumber || selectedEmpAccount.phone || '');
                      setShowEditWhatsAppAdminModal(selectedEmpAccount);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--red-corporate)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {selectedEmpAccount.whatsappNumber ? 'Edit' : 'Add WhatsApp'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed #E2E8F0' }}>
                <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>Created: {selectedEmpAccount.createdAt || '2026-01-01'}</span>
                <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>Updated: {selectedEmpAccount.updatedAt || '2026-09-14'}</span>
              </div>
            </div>

            {/* Actions Grid (Requirement #7: View Access, Reset Password, Activate, Deactivate, Send WhatsApp, Delete Access) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '18px' }}>
              <button
                type="button"
                className="btn-admin-secondary"
                style={{ padding: '9px 12px', fontSize: '12px', fontWeight: 700, textAlign: 'center', borderRadius: '4px', border: '1px solid #CBD5E1', color: 'var(--navy-primary)' }}
                onClick={async () => {
                  const res = await resetEmployeeCredentials({
                    employeeId: selectedEmpAccount.id,
                    actorName: 'Basim Aslam',
                    actorRole: 'SUPER_ADMIN'
                  });
                  if (res.success && res.tempPassword) {
                    setTempPasswordModalData({ tempPass: res.tempPassword, emp: selectedEmpAccount });
                    setCopiedTempPass(false);
                    setSelectedEmpAccount(null);
                    showToast(`✓ Temporary password generated for ${selectedEmpAccount.name}.`);
                  }
                }}
              >
                Reset Password
              </button>

              <button
                type="button"
                className="btn-admin-secondary"
                style={{ padding: '9px 12px', fontSize: '12px', fontWeight: 700, textAlign: 'center', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                onClick={async () => {
                  const nextStatus = selectedEmpAccount.status === 'Active' ? 'Inactive' : 'Active';
                  await toggleEmployeeAccountStatus({
                    employeeId: selectedEmpAccount.id,
                    status: nextStatus as any,
                    actorName: 'Basim Aslam',
                    actorRole: 'SUPER_ADMIN'
                  });
                  const updated = { ...selectedEmpAccount, status: nextStatus as any };
                  onUpdateEmployee(updated);
                  setSelectedEmpAccount(updated);
                  showToast(`✓ Account for ${selectedEmpAccount.name} is now ${nextStatus}.`);
                }}
              >
                {selectedEmpAccount.status === 'Active' ? 'Deactivate' : 'Activate'}
              </button>

              <button
                type="button"
                style={{
                  padding: '9px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textAlign: 'center',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const emp = selectedEmpAccount;
                  setSelectedEmpAccount(null);
                  setShowConfirmResetBeforeWhatsApp(emp);
                }}
              >
                Send WhatsApp
              </button>

              <button
                type="button"
                style={{
                  padding: '9px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textAlign: 'center',
                  borderRadius: '4px',
                  border: '1px solid #FECACA',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const emp = selectedEmpAccount;
                  setSelectedEmpAccount(null);
                  setShowDeleteAccessConfirm(emp);
                }}
              >
                Delete Access
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
              <button
                type="button"
                className="btn-admin-primary"
                onClick={() => setSelectedEmpAccount(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: NEW TEMPORARY PASSWORD REVEAL (Requirement #7) ================= */}
      {tempPasswordModalData && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(11, 42, 85, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--red-corporate)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  ADMIN SECURITY DIALOG
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy-primary)', margin: '2px 0 0' }}>
                  NEW TEMPORARY PASSWORD
                </h3>
              </div>
              <button onClick={() => setTempPasswordModalData(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94A3B8' }}>&times;</button>
            </div>

            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
                Temporary password for <strong>{tempPasswordModalData.emp.name}</strong> (Username: <code>{tempPasswordModalData.emp.username || tempPasswordModalData.emp.id}</code>).
                <br />
                <span style={{ color: '#DC2626', fontWeight: 600, fontSize: '11.5px' }}>
                  ⚠️ This password will NOT be visible again after closing this dialog.
                </span>
              </p>

              <div style={{
                backgroundColor: '#F8FAFC',
                border: '2px dashed var(--red-corporate)',
                padding: '18px',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  TEMPORARY PASSWORD
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: 'var(--navy-primary)',
                  letterSpacing: '0.1em',
                  fontFamily: 'monospace',
                  margin: '8px 0'
                }}>
                  {tempPasswordModalData.tempPass}
                </div>
                <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600 }}>
                  ✓ First-login password change enabled
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(tempPasswordModalData.tempPass);
                    setCopiedTempPass(true);
                    setTimeout(() => setCopiedTempPass(false), 2500);
                  }}
                  className="btn-admin-secondary"
                  style={{
                    padding: '9px 16px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: copiedTempPass ? '#ECFDF5' : '#FFFFFF',
                    color: copiedTempPass ? '#059669' : '#334155'
                  }}
                >
                  {copiedTempPass ? '✓ Copied!' : 'Copy Password'}
                </button>

                {(tempPasswordModalData.emp.whatsappNumber || tempPasswordModalData.emp.phone) && (
                  <button
                    type="button"
                    onClick={() => {
                      openWhatsAppWithCredentials({
                        employeeName: tempPasswordModalData.emp.name,
                        username: tempPasswordModalData.emp.username || tempPasswordModalData.emp.id,
                        tempPassword: tempPasswordModalData.tempPass,
                        whatsappNumber: tempPasswordModalData.emp.whatsappNumber || tempPasswordModalData.emp.phone || '',
                        actorName: 'Basim Aslam',
                        actorRole: 'SUPER_ADMIN'
                      });
                    }}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#25D366',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Send via WhatsApp
                  </button>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '14px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn-admin-primary"
                style={{ width: '100%' }}
                onClick={() => setTempPasswordModalData(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRM RESET BEFORE WHATSAPP (Requirement #14) ================= */}
      {showConfirmResetBeforeWhatsApp && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(11, 42, 85, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            maxWidth: '460px',
            width: '100%',
            padding: '26px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--navy-primary)', margin: 0 }}>
                Send Login Details via WhatsApp
              </h3>
              <button onClick={() => setShowConfirmResetBeforeWhatsApp(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94A3B8' }}>&times;</button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, marginBottom: '14px' }}>
              For strict security, the existing password is encrypted and never stored in plaintext.
            </p>

            <div style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '6px',
              padding: '12px 14px',
              fontSize: '13px',
              color: '#1E40AF',
              marginBottom: '18px'
            }}>
              <strong>Generate a new temporary password before sending login credentials?</strong>
              <div style={{ fontSize: '11.5px', color: '#3B82F6', marginTop: '4px' }}>
                Target: {showConfirmResetBeforeWhatsApp.name} ({showConfirmResetBeforeWhatsApp.whatsappNumber || showConfirmResetBeforeWhatsApp.phone || 'No number'})
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-admin-secondary"
                onClick={() => setShowConfirmResetBeforeWhatsApp(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-admin-primary"
                style={{ backgroundColor: '#25D366' }}
                onClick={async () => {
                  const emp = showConfirmResetBeforeWhatsApp;
                  setShowConfirmResetBeforeWhatsApp(null);
                  const res = await resetEmployeeCredentials({
                    employeeId: emp.id,
                    actorName: 'Basim Aslam',
                    actorRole: 'SUPER_ADMIN'
                  });
                  if (res.success && res.tempPassword) {
                    setTempPasswordModalData({ tempPass: res.tempPassword, emp });
                    const num = emp.whatsappNumber || emp.phone;
                    if (num) {
                      openWhatsAppWithCredentials({
                        employeeName: emp.name,
                        username: emp.username || emp.id,
                        tempPassword: res.tempPassword,
                        whatsappNumber: num,
                        actorName: 'Basim Aslam',
                        actorRole: 'SUPER_ADMIN'
                      });
                    }
                  }
                }}
              >
                Generate &amp; Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE PORTAL ACCESS CONFIRMATION (Requirement #11) ================= */}
      {showDeleteAccessConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(11, 42, 85, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            maxWidth: '450px',
            width: '100%',
            padding: '26px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#DC2626', margin: '0 0 10px' }}>
              Delete portal access for {showDeleteAccessConfirm.name}?
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              This will prevent the employee from logging in to the Employee Portal.
            </p>
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', padding: '10px 14px', borderRadius: '6px', margin: '14px 0', fontSize: '12px', color: '#991B1B' }}>
              <strong>Note:</strong> The employee record, email signature, and profile will remain in the employee database.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-admin-secondary"
                onClick={() => setShowDeleteAccessConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{ backgroundColor: '#DC2626', color: '#FFFFFF', padding: '8px 18px', borderRadius: '4px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                onClick={async () => {
                  const emp = showDeleteAccessConfirm;
                  setShowDeleteAccessConfirm(null);
                  const res = await deleteEmployeePortalAccess({
                    employeeId: emp.id,
                    actorName: 'Basim Aslam',
                    actorRole: 'SUPER_ADMIN'
                  });
                  if (res.employee) onUpdateEmployee(res.employee);
                  showToast(res.message);
                }}
              >
                Delete Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT WHATSAPP NUMBER (Requirement #4) ================= */}
      {showEditWhatsAppAdminModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(11, 42, 85, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            maxWidth: '420px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--navy-primary)', margin: '0 0 8px' }}>
              WhatsApp Number: {showEditWhatsAppAdminModal.name}
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748B', marginBottom: '14px' }}>
              Enter mobile number with country code (e.g. +966 54 69 79 474) used for sending portal credentials.
            </p>
            <input
              type="text"
              className="admin-form-input"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '14px', marginBottom: '16px' }}
              value={adminWhatsAppInput}
              onChange={e => setAdminWhatsAppInput(e.target.value)}
              placeholder="+966 5X XXX XXXX"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-admin-secondary"
                onClick={() => setShowEditWhatsAppAdminModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-admin-primary"
                onClick={async () => {
                  const emp = showEditWhatsAppAdminModal;
                  setShowEditWhatsAppAdminModal(null);
                  const res = await updateEmployeeWhatsAppNumber({
                    employeeId: emp.id,
                    whatsappNumber: adminWhatsAppInput,
                    actorName: 'Basim Aslam',
                    actorRole: 'SUPER_ADMIN'
                  });
                  if (res.employee) onUpdateEmployee(res.employee);
                  showToast(res.message);
                }}
              >
                Save Number
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADMIN CHANGE PASSWORD ================= */}
      {showChangePasswordModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(11, 42, 85, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy-primary)', margin: 0 }}>
                Change Admin Password
              </h3>
              <button onClick={() => setShowChangePasswordModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94A3B8' }}>&times;</button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '18px' }}>
              Update your root Super Admin credentials in Firebase Authentication.
            </p>

            {passError && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '10px 14px', borderRadius: '4px', fontSize: '12.5px', marginBottom: '14px' }}>
                {passError}
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setPassError('');
              const res = await changeUserPassword('admin@alamengaz.com', currentPassInput, newPassInput, confirmPassInput, 'admin');
              if (!res.success) {
                setPassError(res.message);
              } else {
                setShowChangePasswordModal(false);
                showToast(res.message);
              }
            }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Current Password *</label>
                <input
                  type="password"
                  required
                  className="admin-form-input"
                  value={currentPassInput}
                  onChange={e => setCurrentPassInput(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>New Password (min 8 characters) *</label>
                <input
                  type="password"
                  required
                  className="admin-form-input"
                  value={newPassInput}
                  onChange={e => setNewPassInput(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Confirm New Password *</label>
                <input
                  type="password"
                  required
                  className="admin-form-input"
                  value={confirmPassInput}
                  onChange={e => setConfirmPassInput(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-admin-secondary" onClick={() => setShowChangePasswordModal(false)}>Cancel</button>
                <button type="submit" className="btn-admin-primary">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD EXECUTIVE ACCOUNT ================= */}
      {showAddMgmtModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(11, 42, 85, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy-primary)', margin: 0 }}>
                Add Executive Account
              </h3>
              <button onClick={() => setShowAddMgmtModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94A3B8' }}>&times;</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!mgmtFormName || !mgmtFormEmail) return;
              const newMgmt: ManagementUser = {
                id: `MGMT-0${managementUsers.length + 1}`,
                name: mgmtFormName,
                email: mgmtFormEmail,
                role: mgmtFormRole,
                status: 'Active',
                lastLogin: 'Never'
              };
              if (onUpdateManagementUsers) {
                onUpdateManagementUsers([...managementUsers, newMgmt]);
              }
              setShowAddMgmtModal(false);
              showToast(`✓ Executive user "${newMgmt.name}" (${newMgmt.role}) added successfully.`);
            }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Executive Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chief Executive Officer"
                  className="admin-form-input"
                  value={mgmtFormName}
                  onChange={e => setMgmtFormName(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Corporate Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ceo@alamengaz.com"
                  className="admin-form-input"
                  value={mgmtFormEmail}
                  onChange={e => setMgmtFormEmail(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Designation *</label>
                <select
                  className="admin-form-input"
                  value={mgmtFormRole}
                  onChange={e => setMgmtFormRole(e.target.value as any)}
                >
                  <option value="CEO">Chief Executive Officer (CEO)</option>
                  <option value="General Manager">General Manager (GM)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-admin-secondary" onClick={() => setShowAddMgmtModal(false)}>Cancel</button>
                <button type="submit" className="btn-admin-primary">Create Executive</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
