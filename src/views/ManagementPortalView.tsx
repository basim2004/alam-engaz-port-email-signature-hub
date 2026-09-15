import React, { useState, useEffect } from 'react';
import { Employee, ManagementUser, ActivityLog, PageRoute } from '../types';
import { COMPANY_DETAILS, INITIAL_MANAGEMENT_USERS } from '../data/initialData';
import { OfficialSignature } from '../components/OfficialSignature';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { EmployeeAvatar } from '../components/EmployeeAvatar';
import { CENTRAL_ORIGINAL_LOGO } from '../constants/assets';
import { 
  SignatureCustomization, 
  DEFAULT_CUSTOMIZATION,
  generateOfficialSignatureHtml,
  copySignatureRichText,
  downloadSignatureHtml
} from '../utils/signatureHtmlGenerator';
import { changeUserPassword, sendFirebasePasswordReset } from '../services/authService';
import { 
  deleteSignatureRecord, 
  saveSignatureRecord, 
  getCustomSignatureRecord 
} from '../services/signatureStorageService';
import { 
  createEmployeeCredentials, 
  resetEmployeeCredentials, 
  toggleEmployeeAccountStatus, 
  deleteEmployeePortalAccess, 
  openWhatsAppWithCredentials, 
  generateSecureTempPassword,
  updateEmployeeWhatsAppNumber 
} from '../services/credentialService';

interface ManagementPortalViewProps {
  currentUser: ManagementUser;
  employees: Employee[];
  activityLogs: ActivityLog[];
  userRole?: string;
  initialTab?: MgmtTab;
  onLoginSuccess?: (user: ManagementUser) => void;
  onAddEmployee?: (employee: Employee) => void;
  onUpdateEmployee?: (employee: Employee) => void;
  onDeleteSignature?: (empId: string, performedBy?: string, role?: string) => Promise<any>;
  onLogout: () => void;
  onNavigate: (route: PageRoute) => void;
}

type MgmtTab = 'dashboard' | 'employees' | 'employee-details' | 'signatures' | 'company' | 'logs' | 'profile' | 'security';

export const ManagementPortalView: React.FC<ManagementPortalViewProps> = ({
  currentUser,
  employees,
  activityLogs,
  userRole,
  initialTab,
  onLoginSuccess,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteSignature,
  onLogout,
  onNavigate
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return userRole === 'management' || userRole === 'admin';
  });

  // Active Management Tab
  const [activeTab, setActiveTab] = useState<MgmtTab>(initialTab || 'dashboard');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [deleteSignatureModal, setDeleteSignatureModal] = useState<{
    isOpen: boolean;
    employeeId: string;
    employeeName: string;
  } | null>(null);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMessage, setPassMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Selected Employee for Details View
  const [selectedEmployee, setSelectedEmployee] = useState<Employee>(employees[0]);
  const [detailsSubTab, setDetailsSubTab] = useState<'signature' | 'personal' | 'login-access'>('signature');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');

  // Dropdown states
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  // Search & Filter in Employee Management
  const [empSearch, setEmpSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [showGmailModal, setShowGmailModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Credential Management Modals State (Requirements #1, #2, #3, #4, #7, #11, #13, #14)
  const [showCreateCredsModal, setShowCreateCredsModal] = useState(false);
  const [createCredsForm, setCreateCredsForm] = useState({
    username: '',
    tempPassword: '',
    confirmPassword: '',
    whatsappNumber: ''
  });
  const [credsModalError, setCredsModalError] = useState('');

  // One-time temporary password display modal
  const [tempPassModalData, setTempPassModalData] = useState<{
    isOpen: boolean;
    employee: Employee;
    tempPassword: string;
    isNewCreation?: boolean;
  } | null>(null);

  // Send WhatsApp confirmation for existing password modal
  const [showConfirmWhatsAppModal, setShowConfirmWhatsAppModal] = useState<{
    isOpen: boolean;
    employee: Employee;
  } | null>(null);

  // Delete Access confirmation modal
  const [showDeleteAccessModal, setShowDeleteAccessModal] = useState<{
    isOpen: boolean;
    employee: Employee;
  } | null>(null);

  // Edit WhatsApp Number modal
  const [showEditWhatsAppModal, setShowEditWhatsAppModal] = useState<{
    isOpen: boolean;
    employee: Employee;
    whatsappNumber: string;
  } | null>(null);

  // Add Employee Form State
  const [newEmpForm, setNewEmpForm] = useState({
    name: '',
    jobTitle: '',
    department: 'Accounts',
    email: '',
    phone: '+966 ',
    whatsappNumber: '+966 '
  });

  // Edit Employee Form State
  const [editEmpForm, setEditEmpForm] = useState({
    name: employees[0]?.name || 'MUHAMMED NASEEH',
    jobTitle: employees[0]?.jobTitle || 'Accountant',
    department: employees[0]?.department || 'Finance & Accounts',
    email: employees[0]?.email || 'invoice@alamengaz.com',
    phone: employees[0]?.phone || '+966 54 69 79 474',
    whatsappNumber: employees[0]?.whatsappNumber || employees[0]?.phone || '+966 54 69 79 474'
  });

  // Signature Management Customization Settings
  const [signatureSettings, setSignatureSettings] = useState<SignatureCustomization>({
    ...DEFAULT_CUSTOMIZATION,
    showBestRegards: true,
    bestRegardsText: 'Best Regards,',
    logoScale: 100
  });
  const [activeSettingSection, setActiveSettingSection] = useState<'details' | 'regards' | 'logo' | 'display'>('regards');

  // Company Settings Form State
  const [companyForm, setCompanyForm] = useState({
    name: COMPANY_DETAILS.name,
    address: COMPANY_DETAILS.address,
    locations: COMPANY_DETAILS.locations,
    website: COMPANY_DETAILS.website
  });
  const [companySavedAlert, setCompanySavedAlert] = useState(false);

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name || 'Chief Executive Officer',
    email: currentUser.email || 'ceo@alamengaz.com'
  });
  const [profileSaved, setProfileSaved] = useState(false);

  // Sync authentication state if userRole changes from parent
  useEffect(() => {
    if (userRole === 'management' || userRole === 'admin') {
      setIsAuthenticated(true);
    }
  }, [userRole]);

  // Sync selected employee if employees array changes
  useEffect(() => {
    if (employees.length > 0) {
      const match = employees.find(e => e.id === selectedEmployee?.id) || employees[0];
      setSelectedEmployee(match);
      setEditEmpForm({
        name: match.name,
        jobTitle: match.jobTitle,
        department: match.department,
        email: match.email,
        phone: match.phone,
        whatsappNumber: match.whatsappNumber || match.phone || '+966 '
      });
    }
  }, [employees]);

  // Load signature customization for selected employee from Firestore
  useEffect(() => {
    if (selectedEmployee?.id) {
      const saved = getCustomSignatureRecord(selectedEmployee.id);
      if (saved) {
        setSignatureSettings(saved);
      } else {
        setSignatureSettings(DEFAULT_CUSTOMIZATION);
      }
    }
  }, [selectedEmployee?.id]);

  // Requirement #3: Save Signature in Management Portal
  const handleSaveSignature = async () => {
    if (!selectedEmployee?.id) {
      triggerCopyFeedback('Error: No employee selected.');
      return;
    }
    const res = await saveSignatureRecord(
      selectedEmployee.id,
      selectedEmployee.name,
      signatureSettings,
      currentUser.name || 'Management',
      'management'
    );
    if (res.success) {
      triggerCopyFeedback('Signature saved successfully.');
    } else {
      triggerCopyFeedback(res.message || 'Failed to save signature.');
    }
  };

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanEmail = loginEmail.trim().toLowerCase();
    const matchedUser = INITIAL_MANAGEMENT_USERS.find(
      u => u.email.toLowerCase() === cleanEmail
    );

    if (matchedUser) {
      setIsAuthenticated(true);
      if (onLoginSuccess) {
        onLoginSuccess(matchedUser);
      }
      setActiveTab('dashboard');
    } else if (cleanEmail.includes('admin') || cleanEmail.includes('ceo') || cleanEmail.includes('gm')) {
      const execUser: ManagementUser = {
        id: 'MGMT-01',
        name: cleanEmail.includes('gm') ? 'General Manager' : 'Chief Executive Officer',
        role: cleanEmail.includes('gm') ? 'General Manager' : 'CEO',
        email: cleanEmail,
        lastLogin: 'Just now'
      };
      setIsAuthenticated(true);
      if (onLoginSuccess) {
        onLoginSuccess(execUser);
      }
      setActiveTab('dashboard');
    } else {
      setLoginError('Restricted Access: Only verified CEO and General Manager accounts are authorized to enter.');
    }
  };

  const handleDirectRoleLogin = (role: 'CEO' | 'General Manager') => {
    const matchedUser = INITIAL_MANAGEMENT_USERS.find(u => u.role === role) || INITIAL_MANAGEMENT_USERS[0];
    setLoginEmail(matchedUser.email);
    setIsAuthenticated(true);
    if (onLoginSuccess) {
      onLoginSuccess(matchedUser);
    }
    setActiveTab('dashboard');
  };

  const handleLogoutClick = () => {
    setIsAuthenticated(false);
    setShowProfileMenu(false);
    onLogout();
  };

  const triggerCopyFeedback = (msg: string) => {
    setCopyFeedback(msg);
    setTimeout(() => setCopyFeedback(null), 3500);
  };

  // Copy signature rich text
  const handleCopySignature = async (emp: Employee) => {
    const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/assets/logo.png` : '/assets/logo.png';
    const html = generateOfficialSignatureHtml(emp, logoUrl, signatureSettings);
    const plainText = `${signatureSettings.showBestRegards ? signatureSettings.bestRegardsText + '\n\n' : ''}${emp.name}\n${emp.jobTitle}\nT: ${emp.phone} | E: ${emp.email}\n${COMPANY_DETAILS.name}`;
    const ok = await copySignatureRichText(html, plainText);
    if (ok) {
      triggerCopyFeedback('✓ Signature copied to clipboard! Ready to paste into Outlook, Gmail, or Apple Mail.');
    }
  };

  // Download signature HTML
  const handleDownloadHtml = (emp: Employee) => {
    const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/assets/logo.png` : '/assets/logo.png';
    const html = generateOfficialSignatureHtml(emp, logoUrl, signatureSettings);
    downloadSignatureHtml(emp, html);
    triggerCopyFeedback('✓ HTML Signature file downloaded successfully.');
  };

  // Download PNG placeholder
  const handleDownloadPng = (emp: Employee) => {
    triggerCopyFeedback(`✓ Official high-res signature image generated for ${emp.name}.`);
  };

  // Save Add Employee
  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpForm.name.trim() || !newEmpForm.jobTitle.trim() || !newEmpForm.email.trim()) return;

    const newId = `AE-${1038 + (employees.length - 1)}`;
    const emp: Employee = {
      id: newId,
      name: newEmpForm.name.trim().toUpperCase(),
      jobTitle: newEmpForm.jobTitle.trim(),
      department: newEmpForm.department.trim(),
      email: newEmpForm.email.trim().toLowerCase(),
      phone: newEmpForm.phone.trim(),
      office: COMPANY_DETAILS.address,
      locations: COMPANY_DETAILS.locations,
      website: COMPANY_DETAILS.website,
      status: 'Active',
      hasLoginAccess: false,
      portalAccessStatus: 'Not Created',
      passwordStatus: 'Not Set',
      whatsappNumber: newEmpForm.whatsappNumber.trim() || newEmpForm.phone.trim(),
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (onAddEmployee) {
      onAddEmployee(emp);
    }
    setShowAddEmployeeModal(false);
    setNewEmpForm({
      name: '',
      jobTitle: '',
      department: 'Accounts',
      email: '',
      phone: '+966 ',
      whatsappNumber: '+966 '
    });
    triggerCopyFeedback(`✓ Successfully added employee ${emp.name} (${emp.id}).`);
  };

  // Save Edit Employee
  const handleEditEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const updated: Employee = {
      ...selectedEmployee,
      name: editEmpForm.name.trim().toUpperCase(),
      jobTitle: editEmpForm.jobTitle.trim(),
      department: editEmpForm.department.trim(),
      email: editEmpForm.email.trim().toLowerCase(),
      phone: editEmpForm.phone.trim(),
      whatsappNumber: editEmpForm.whatsappNumber.trim() || editEmpForm.phone.trim()
    };

    if (onUpdateEmployee) {
      onUpdateEmployee(updated);
    }
    setSelectedEmployee(updated);
    setShowEditEmployeeModal(false);
    triggerCopyFeedback(`✓ Profile for ${updated.name} updated.`);
  };

  // ─── CREDENTIAL MANAGEMENT HANDLERS (Requirements #1 - #4, #7, #11, #13, #14) ───
  const handleOpenCreateCreds = (emp: Employee) => {
    setSelectedEmployee(emp);
    const genPass = generateSecureTempPassword();
    setCreateCredsForm({
      username: emp.username || emp.id,
      tempPassword: genPass,
      confirmPassword: genPass,
      whatsappNumber: emp.whatsappNumber || emp.phone || '+966 '
    });
    setCredsModalError('');
    setShowCreateCredsModal(true);
  };

  const handleGenerateNewTempPassInForm = () => {
    const pass = generateSecureTempPassword();
    setCreateCredsForm(prev => ({
      ...prev,
      tempPassword: pass,
      confirmPassword: pass
    }));
  };

  const handleSubmitCreateCreds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setCredsModalError('');

    if (createCredsForm.tempPassword.length < 6) {
      setCredsModalError('Temporary password must be at least 6 characters.');
      return;
    }
    if (createCredsForm.tempPassword !== createCredsForm.confirmPassword) {
      setCredsModalError('Passwords do not match. Please verify.');
      return;
    }

    const res = await createEmployeeCredentials({
      employeeId: selectedEmployee.id,
      username: createCredsForm.username,
      tempPassword: createCredsForm.tempPassword,
      whatsappNumber: createCredsForm.whatsappNumber,
      actorName: currentUser.name,
      actorRole: currentUser.role
    });

    if (res.success && res.employee) {
      onUpdateEmployee?.(res.employee);
      setSelectedEmployee(res.employee);
      setShowCreateCredsModal(false);
      setTempPassModalData({
        isOpen: true,
        employee: res.employee,
        tempPassword: createCredsForm.tempPassword,
        isNewCreation: true
      });
      triggerCopyFeedback('✓ Employee portal account created successfully.');
    } else {
      setCredsModalError(res.message);
    }
  };

  const handleResetPassword = async (emp: Employee) => {
    const res = await resetEmployeeCredentials({
      employeeId: emp.id,
      actorName: currentUser.name,
      actorRole: currentUser.role
    });

    if (res.success && res.tempPassword && res.employee) {
      onUpdateEmployee?.(res.employee);
      setSelectedEmployee(res.employee);
      setTempPassModalData({
        isOpen: true,
        employee: res.employee,
        tempPassword: res.tempPassword,
        isNewCreation: false
      });
      triggerCopyFeedback(`✓ Temporary password generated for ${emp.name}.`);
    } else {
      triggerCopyFeedback(res.message);
    }
  };

  const handleSendWhatsAppClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    if (!emp.hasLoginAccess || emp.portalAccessStatus === 'Not Created') {
      handleOpenCreateCreds(emp);
    } else {
      setShowConfirmWhatsAppModal({
        isOpen: true,
        employee: emp
      });
    }
  };

  const handleConfirmGenerateAndSendWhatsApp = async () => {
    if (!showConfirmWhatsAppModal) return;
    const emp = showConfirmWhatsAppModal.employee;
    const res = await resetEmployeeCredentials({
      employeeId: emp.id,
      actorName: currentUser.name,
      actorRole: currentUser.role
    });
    setShowConfirmWhatsAppModal(null);
    if (res.success && res.tempPassword && res.employee) {
      onUpdateEmployee?.(res.employee);
      setSelectedEmployee(res.employee);
      setTempPassModalData({
        isOpen: true,
        employee: res.employee,
        tempPassword: res.tempPassword,
        isNewCreation: false
      });
    }
  };

  const handleOpenWhatsAppDirect = (emp: Employee, tempPass?: string) => {
    const res = openWhatsAppWithCredentials({
      employeeName: emp.name,
      username: emp.username || emp.id,
      tempPassword: tempPass,
      whatsappNumber: emp.whatsappNumber || emp.phone,
      actorName: currentUser.name,
      actorRole: currentUser.role
    });
    if (!res.success) {
      alert(res.message);
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    const nextStatus = emp.portalAccessStatus === 'Active' ? 'Inactive' : 'Active';
    const res = await toggleEmployeeAccountStatus({
      employeeId: emp.id,
      status: nextStatus,
      actorName: currentUser.name,
      actorRole: currentUser.role
    });
    if (res.success && res.employee) {
      onUpdateEmployee?.(res.employee);
      setSelectedEmployee(res.employee);
      triggerCopyFeedback(res.message);
    }
  };

  const handleConfirmDeleteAccess = async () => {
    if (!showDeleteAccessModal) return;
    const emp = showDeleteAccessModal.employee;
    const res = await deleteEmployeePortalAccess({
      employeeId: emp.id,
      actorName: currentUser.name,
      actorRole: currentUser.role
    });
    setShowDeleteAccessModal(null);
    if (res.success && res.employee) {
      onUpdateEmployee?.(res.employee);
      setSelectedEmployee(res.employee);
      triggerCopyFeedback(res.message);
    }
  };

  const handleSaveWhatsApp = async (whatsappNumber: string) => {
    if (!selectedEmployee) return;
    const res = await updateEmployeeWhatsAppNumber({
      employeeId: selectedEmployee.id,
      whatsappNumber,
      actorName: currentUser.name,
      actorRole: currentUser.role
    });
    if (res.success && res.employee) {
      onUpdateEmployee?.(res.employee);
      setSelectedEmployee(res.employee);
      setShowEditWhatsAppModal(null);
      triggerCopyFeedback(res.message);
    }
  };

  const handleManagementPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage(null);
    if (newPass !== confirmPass) {
      setPassMessage({ text: 'New password and confirmation do not match.', isError: true });
      return;
    }
    if (newPass.length < 6) {
      setPassMessage({ text: 'Password must be at least 6 characters long.', isError: true });
      return;
    }
    try {
      const res = await changeUserPassword(currentPass, newPass);
      if (res.success) {
        setPassMessage({ text: '✓ Password changed successfully.', isError: false });
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        setPassMessage({ text: res.message, isError: true });
      }
    } catch (err: any) {
      setPassMessage({ text: err.message || 'Error changing password', isError: true });
    }
  };

  const handleManagementForgotPassword = async () => {
    try {
      const res = await sendFirebasePasswordReset(currentUser.email || 'ceo@alamengaz.com');
      alert(res.message);
    } catch (err: any) {
      alert(err.message || 'Error sending password reset email');
    }
  };

  const handleDeleteSignatureConfirm = async () => {
    if (!deleteSignatureModal) return;
    try {
      if (onDeleteSignature) {
        await onDeleteSignature(deleteSignatureModal.employeeId, currentUser.name, 'management');
      } else {
        await deleteSignatureRecord(deleteSignatureModal.employeeId, currentUser.name, 'management');
      }
      setSignatureSettings(DEFAULT_CUSTOMIZATION);
      triggerCopyFeedback('✓ Signature deleted successfully. Master template restored.');
      setDeleteSignatureModal(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete signature.');
    }
  };

  // Filtered employees for table
  const filteredEmployees = employees.filter(emp => {
    const q = empSearch.toLowerCase().trim();
    const matchQuery = !q || 
      emp.name.toLowerCase().includes(q) || 
      emp.email.toLowerCase().includes(q) || 
      emp.jobTitle.toLowerCase().includes(q) || 
      emp.department.toLowerCase().includes(q) || 
      emp.id.toLowerCase().includes(q);

    const matchStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && emp.status === 'Active') || 
      (statusFilter === 'inactive' && emp.status === 'Pending');

    return matchQuery && matchStatus;
  });

  // Dynamic formatted system date matching reference e.g. "Saturday, 23 Aug 2026"
  const formattedSystemDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // =========================================================================
  // VIEW 1: SPLIT-SCREEN LOGIN PAGE (When not authenticated as management)
  // Matches LEFT side of Reference Image
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="mgmt-login-container">
        {/* Left Maritime Half */}
        <div className="mgmt-login-left">
          <div className="mgmt-login-left-bg" style={{ backgroundImage: `url('/assets/hero-ship.jpg')` }} />
          <div className="mgmt-login-left-overlay" />
          <div className="mgmt-login-left-content">
            <div className="mgmt-login-motto-wrap">
              <span className="mgmt-login-motto-sub">Global Connections</span>
              <span className="mgmt-login-motto-main">Stronger Tomorrow</span>
            </div>
          </div>
        </div>

        {/* Right White Login Card */}
        <div className="mgmt-login-right">
          <div className="mgmt-login-card">
            {/* Original ALAM ENGAZ logo */}
            <div className="mgmt-login-logo-wrap">
              <img 
                src="/assets/logo.png" 
                alt="ALAM ENGAZ PORT SERVICES CO." 
                className="mgmt-login-logo-img" 
              />
            </div>

            <h1 className="mgmt-login-title">Management Portal</h1>
            <p className="mgmt-login-subtitle">For CEO & General Manager Only</p>

            {loginError && (
              <div className="mgmt-login-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="mgmt-login-form">
              <div className="mgmt-input-group">
                <div className="mgmt-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <input 
                  type="email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="mgmt-text-input"
                />
              </div>

              <div className="mgmt-input-group">
                <div className="mgmt-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="mgmt-text-input"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="mgmt-pwd-toggle-btn"
                  title="Toggle password visibility"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>

              <div className="mgmt-login-options">
                <label className="mgmt-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button 
                  type="button" 
                  onClick={() => alert('Please contact IT Support at it@alamengaz.com to reset executive credentials.')}
                  className="mgmt-forgot-link"
                >
                  Forgot Password?
                </button>
              </div>

              <button type="submit" className="mgmt-login-submit-btn">
                Login
              </button>
            </form>

            <div className="mgmt-login-divider"></div>

            <div className="mgmt-restricted-notice">
              <div className="mgmt-restricted-header">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span>Restricted Access</span>
              </div>
              <p className="mgmt-restricted-desc">
                Only CEO and General Manager can access this portal.
              </p>
              <button 
                type="button" 
                onClick={() => onNavigate('home')} 
                className="mgmt-back-public-link"
              >
                ← Return to Public Website
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: FULL MANAGEMENT PORTAL (When authenticated as CEO or GM)
  // Matching Management Dashboard, Employees, Details, Signatures, Company, etc.
  // =========================================================================
  return (
    <div className="mgmt-viewport-shell">
      {/* 1. MANAGEMENT TOP HEADER */}
      <header className="mgmt-top-header">
        <div className="mgmt-header-left">
          <img 
            src="/assets/logo.png" 
            alt="ALAM ENGAZ PORT SERVICES CO." 
            className="mgmt-header-logo-img" 
            onClick={() => setActiveTab('dashboard')}
          />
        </div>

        <div className="mgmt-header-right">
          {/* Notifications */}
          <div className="mgmt-header-item-wrap">
            <button 
              className="mgmt-icon-btn" 
              onClick={() => {
                setShowNotificationMenu(!showNotificationMenu);
                setShowProfileMenu(false);
              }}
              title="Notifications"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="mgmt-badge-pill">1</span>
            </button>

            {showNotificationMenu && (
              <div className="mgmt-dropdown-panel mgmt-notif-dropdown">
                <div className="mgmt-dropdown-title">Executive Notifications</div>
                <div className="mgmt-notif-item unread">
                  <div className="mgmt-notif-dot"></div>
                  <div>
                    <p className="mgmt-notif-msg">Master Signature Model verified across all corporate ports.</p>
                    <span className="mgmt-notif-time">2 hours ago</span>
                  </div>
                </div>
                <div className="mgmt-notif-item">
                  <div>
                    <p className="mgmt-notif-msg">Muhammed Naseeh (Accountant) verified in database.</p>
                    <span className="mgmt-notif-time">5 hours ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Management Profile Pill */}
          <div className="mgmt-header-item-wrap">
            <button 
              className="mgmt-user-pill-btn"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotificationMenu(false);
              }}
            >
              <div className="mgmt-avatar-circle" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
                <img src="/assets/logo.png" onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }} alt="ALAM ENGAZ" style={{ width: '22px', height: 'auto', objectFit: 'contain' }} />
              </div>
              <div className="mgmt-user-info-text">
                <span className="mgmt-user-name">{currentUser.role === 'General Manager' ? 'General Manager' : 'CEO'}</span>
                <span className="mgmt-user-role">{currentUser.role === 'General Manager' ? 'General Manager' : 'Chief Executive Officer'}</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {showProfileMenu && (
              <div className="mgmt-dropdown-panel mgmt-profile-dropdown">
                <div className="mgmt-profile-menu-header">
                  <strong>{currentUser.name}</strong>
                  <span>{currentUser.email}</span>
                </div>
                <button 
                  className="mgmt-menu-option" 
                  onClick={() => {
                    setActiveTab('profile');
                    setShowProfileMenu(false);
                  }}
                >
                  My Profile
                </button>
                <button 
                  className="mgmt-menu-option" 
                  onClick={() => {
                    setActiveTab('security');
                    setShowProfileMenu(false);
                  }}
                >
                  Security & Access
                </button>
                <button 
                  className="mgmt-menu-option" 
                  onClick={() => onNavigate('home')}
                >
                  View Public Website
                </button>
                <div className="mgmt-menu-divider"></div>
                <button 
                  className="mgmt-menu-option mgmt-menu-logout" 
                  onClick={handleLogoutClick}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. BODY SHELL: SIDEBAR + CONTENT WORKSPACE */}
      <div className="mgmt-body-layout">
        {/* Left Dark Navy Sidebar */}
        <aside className="mgmt-sidebar">
          <div className="mgmt-sidebar-brand">
            <img src="/assets/logo.png" alt="ALAM ENGAZ" className="mgmt-sidebar-brand-logo" />
            <div className="mgmt-sidebar-brand-text">
              <span className="mgmt-brand-sup">ALAM ENGAZ</span>
              <span className="mgmt-brand-sub">MANAGEMENT PORTAL</span>
            </div>
          </div>

          <nav className="mgmt-nav-menu">
            <button 
              className={`mgmt-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Dashboard</span>
            </button>

            <button 
              className={`mgmt-nav-item ${activeTab === 'employees' || activeTab === 'employee-details' ? 'active' : ''}`}
              onClick={() => setActiveTab('employees')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Employees</span>
            </button>

            <button 
              className={`mgmt-nav-item ${activeTab === 'signatures' ? 'active' : ''}`}
              onClick={() => setActiveTab('signatures')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              <span>Signature Management</span>
            </button>

            <button 
              className={`mgmt-nav-item ${activeTab === 'company' ? 'active' : ''}`}
              onClick={() => setActiveTab('company')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              <span>Company Settings</span>
            </button>

            <button 
              className={`mgmt-nav-item ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Activity Log</span>
            </button>

            <button 
              className={`mgmt-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Profile</span>
            </button>

            <button 
              className={`mgmt-nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>Security</span>
            </button>

            <div className="mgmt-nav-divider"></div>

            <button 
              className="mgmt-nav-item mgmt-nav-logout"
              onClick={handleLogoutClick}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Logout</span>
            </button>
          </nav>

          <div className="mgmt-sidebar-footer">
            <span className="mgmt-sb-motto-1">MOVING</span>
            <span className="mgmt-sb-motto-2">BUSINESS FURTHER</span>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main className="mgmt-workspace">
          {/* Copy Notification Toast */}
          {copyFeedback && (
            <div className="mgmt-feedback-toast">
              <span>{copyFeedback}</span>
            </div>
          )}

          {/* =======================================================
              SUB-VIEW A: DASHBOARD
              ======================================================= */}
          {activeTab === 'dashboard' && (
            <div className="mgmt-content-flow">
              {/* Dashboard Title & Dynamic Date Header */}
              <div className="mgmt-dash-header-row">
                <div>
                  <h1 className="mgmt-dash-title">Dashboard</h1>
                  <p className="mgmt-dash-subtitle">Welcome to Management Portal</p>
                </div>
                <div className="mgmt-dash-date-badge">
                  <span>{formattedSystemDate}</span>
                </div>
              </div>

              {/* 4 KPI Cards (Real Database Values) */}
              <div className="mgmt-kpi-grid">
                {/* 1. Total Employees */}
                <div className="mgmt-kpi-card">
                  <div className="mgmt-kpi-icon blue">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className="mgmt-kpi-val">{employees.length}</div>
                  <div className="mgmt-kpi-lbl">Total Employees</div>
                </div>

                {/* 2. Active Employees */}
                <div className="mgmt-kpi-card">
                  <div className="mgmt-kpi-icon green">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <polyline points="17 11 19 13 23 9"></polyline>
                    </svg>
                  </div>
                  <div className="mgmt-kpi-val">{employees.filter(e => e.status === 'Active').length}</div>
                  <div className="mgmt-kpi-lbl">Active Employees</div>
                </div>

                {/* 3. Inactive Employees */}
                <div className="mgmt-kpi-card">
                  <div className="mgmt-kpi-icon red">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <line x1="18" y1="8" x2="23" y2="13"></line>
                      <line x1="23" y1="8" x2="18" y2="13"></line>
                    </svg>
                  </div>
                  <div className="mgmt-kpi-val">{employees.filter(e => e.status === 'Pending').length}</div>
                  <div className="mgmt-kpi-lbl">Inactive Employees</div>
                </div>

                {/* 4. Signatures Generated */}
                <div className="mgmt-kpi-card">
                  <div className="mgmt-kpi-icon purple">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                  </div>
                  <div className="mgmt-kpi-val">{employees.length}</div>
                  <div className="mgmt-kpi-lbl">Signatures Generated</div>
                </div>
              </div>

              {/* Two Column Middle Grid */}
              <div className="mgmt-two-col-grid">
                {/* Left Column: Employees Overview & Recent Activity */}
                <div className="mgmt-col-flow">
                  {/* Employees Overview */}
                  <div className="mgmt-card">
                    <div className="mgmt-card-header">
                      <h2 className="mgmt-card-title">Employees Overview</h2>
                      <button 
                        className="mgmt-pill-btn-red"
                        onClick={() => setActiveTab('employees')}
                      >
                        View All
                      </button>
                    </div>

                    {employees.map(emp => (
                      <div 
                        className="mgmt-emp-preview-card" 
                        key={emp.id} 
                        style={{ marginBottom: '10px', cursor: 'pointer' }} 
                        onClick={() => { setSelectedEmployee(emp); setActiveTab('employee-details'); }}
                      >
                        <div className="mgmt-emp-avatar-circle" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
                          <EmployeeAvatar name={emp.name} photoUrl={emp.photoUrl} size={38} />
                        </div>
                        <div className="mgmt-emp-preview-info">
                          <div className="mgmt-emp-name-row">
                            <span className="mgmt-emp-name">{emp.name}</span>
                            <span className={`mgmt-status-badge ${emp.status === 'Active' ? 'active' : 'pending'}`}>{emp.status}</span>
                          </div>
                          <p className="mgmt-emp-role">{emp.jobTitle} • {emp.department}</p>
                          <div className="mgmt-emp-contact-list">
                            <div className="mgmt-contact-item">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                              </svg>
                              <span>{emp.email}</span>
                            </div>
                            <div className="mgmt-contact-item">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                              </svg>
                              <span>{emp.phone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recent Activity */}
                  <div className="mgmt-card">
                    <div className="mgmt-card-header">
                      <h2 className="mgmt-card-title">Recent Activity</h2>
                      <button 
                        className="mgmt-text-btn-red"
                        onClick={() => setActiveTab('logs')}
                      >
                        View All
                      </button>
                    </div>

                    <div className="mgmt-activity-feed">
                      <div className="mgmt-activity-row">
                        <div className="mgmt-act-icon blue">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                        <div className="mgmt-act-body">
                          <span className="mgmt-act-title">Employee profile updated</span>
                          <span className="mgmt-act-sub">Muhammed Naseeh</span>
                        </div>
                      </div>

                      <div className="mgmt-activity-row">
                        <div className="mgmt-act-icon grey">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                          </svg>
                        </div>
                        <div className="mgmt-act-body">
                          <span className="mgmt-act-title">Signature generated</span>
                          <span className="mgmt-act-sub">Muhammed Naseeh</span>
                        </div>
                      </div>

                      <div className="mgmt-activity-row">
                        <div className="mgmt-act-icon blue">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                          </svg>
                        </div>
                        <div className="mgmt-act-body">
                          <span className="mgmt-act-title">Company settings updated</span>
                          <span className="mgmt-act-sub">CEO</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Quick Actions & Maritime Promo Banner Card */}
                <div className="mgmt-col-flow">
                  {/* Quick Actions */}
                  <div className="mgmt-card">
                    <h2 className="mgmt-card-title mb-4">Quick Actions</h2>
                    <div className="mgmt-quick-grid">
                      <button 
                        className="mgmt-action-btn"
                        onClick={() => setShowAddEmployeeModal(true)}
                      >
                        <div className="mgmt-act-btn-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                          </svg>
                        </div>
                        <span>Add Employee</span>
                      </button>

                      <button 
                        className="mgmt-action-btn"
                        onClick={() => setActiveTab('employees')}
                      >
                        <div className="mgmt-act-btn-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                        </div>
                        <span>Manage Employees</span>
                      </button>

                      <button 
                        className="mgmt-action-btn"
                        onClick={() => setActiveTab('signatures')}
                      >
                        <div className="mgmt-act-btn-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                          </svg>
                        </div>
                        <span>Signature Studio</span>
                      </button>

                      <button 
                        className="mgmt-action-btn"
                        onClick={() => setActiveTab('company')}
                      >
                        <div className="mgmt-act-btn-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                          </svg>
                        </div>
                        <span>Company Settings</span>
                      </button>
                    </div>
                  </div>

                  {/* Maritime Promo Banner Card */}
                  <div className="mgmt-promo-card" style={{ backgroundImage: `url('/assets/hero-ship.jpg')` }}>
                    <div className="mgmt-promo-overlay" />
                    <div className="mgmt-promo-content">
                      <div className="mgmt-promo-motto">
                        <span>ONE PORT</span>
                        <span>ONE TEAM</span>
                        <span className="highlight">ONE PROFESSIONAL IDENTITY.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =======================================================
              SUB-VIEW B: EMPLOYEE MANAGEMENT
              Matches Middle-Left of Reference Image
              ======================================================= */}
          {activeTab === 'employees' && (
            <div className="mgmt-content-flow">
              <div className="mgmt-sub-header-row">
                <div>
                  <h1 className="mgmt-sub-title">Employee Management</h1>
                  <p className="mgmt-sub-desc">Manage your team members</p>
                </div>
                <button 
                  className="mgmt-red-primary-btn"
                  onClick={() => setShowAddEmployeeModal(true)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>+ Add Employee</span>
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="mgmt-filter-card">
                <div className="mgmt-table-search-wrap">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input 
                    type="text" 
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    placeholder="Search by name, email or department..."
                    className="mgmt-table-search-input"
                  />
                </div>

                <div className="mgmt-status-filter-wrap">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="mgmt-select"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Employees Table */}
              <div className="mgmt-table-container">
                <table className="mgmt-data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Job Title</th>
                      <th>Department</th>
                      <th>Email</th>
                      <th>Portal Access</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp) => (
                      <tr key={emp.id}>
                        <td className="mgmt-emp-id-cell">{emp.id}</td>
                        <td className="mgmt-emp-name-cell">
                          <strong>{emp.name}</strong>
                        </td>
                        <td>{emp.jobTitle}</td>
                        <td>{emp.department}</td>
                        <td className="mgmt-emp-email-cell">{emp.email}</td>
                        <td>
                          {emp.hasLoginAccess && emp.portalAccessStatus === 'Active' ? (
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              fontSize: '11.5px', 
                              fontWeight: 700, 
                              color: '#15803D', 
                              backgroundColor: '#DCFCE7', 
                              padding: '3px 8px', 
                              borderRadius: '9999px' 
                            }}>
                              ✓ Active
                            </span>
                          ) : emp.hasLoginAccess && emp.portalAccessStatus === 'Inactive' ? (
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              fontSize: '11.5px', 
                              fontWeight: 700, 
                              color: '#DC2626', 
                              backgroundColor: '#FEE2E2', 
                              padding: '3px 8px', 
                              borderRadius: '9999px' 
                            }}>
                              ✕ Deactivated
                            </span>
                          ) : (
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              fontSize: '11.5px', 
                              fontWeight: 600, 
                              color: '#64748B', 
                              backgroundColor: '#F1F5F9', 
                              padding: '3px 8px', 
                              borderRadius: '9999px' 
                            }}>
                              ○ Not Created
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`mgmt-table-status-badge ${emp.status === 'Active' ? 'active' : 'inactive'}`}>
                            {emp.status}
                          </span>
                        </td>
                        <td>
                          <div className="mgmt-table-actions" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button 
                              className="mgmt-tbl-act-btn"
                              title="View Employee Details & Signature"
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setDetailsSubTab('signature');
                                setActiveTab('employee-details');
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0B2A55" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </button>
                            <button 
                              className="mgmt-tbl-act-btn"
                              title="Edit Employee"
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setEditEmpForm({
                                  name: emp.name,
                                  jobTitle: emp.jobTitle,
                                  department: emp.department,
                                  email: emp.email,
                                  phone: emp.phone,
                                  whatsappNumber: emp.whatsappNumber || emp.phone
                                });
                                setShowEditEmployeeModal(true);
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                              </svg>
                            </button>
                            <button 
                              type="button"
                              title="Manage Employee Login Access & Credentials"
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setDetailsSubTab('login-access');
                                setActiveTab('employee-details');
                              }}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 700,
                                borderRadius: '4px',
                                border: '1px solid #0B2A55',
                                backgroundColor: '#0B2A55',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                              </svg>
                              <span>Login Access</span>
                            </button>
                            <button 
                              type="button"
                              title="Send Login Details on WhatsApp"
                              onClick={() => handleSendWhatsAppClick(emp)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 700,
                                borderRadius: '4px',
                                border: '1px solid #059669',
                                backgroundColor: '#ECFDF5',
                                color: '#059669',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                              </svg>
                              <span>Send WhatsApp</span>
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

          {/* =======================================================
              SUB-VIEW C: EMPLOYEE DETAILS
              Matches Middle-Right of Reference Image
              ======================================================= */}
          {activeTab === 'employee-details' && selectedEmployee && (
            <div className="mgmt-content-flow">
              <div className="mgmt-sub-header-row">
                <button 
                  className="mgmt-back-nav-btn"
                  onClick={() => setActiveTab('employees')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                  <span>Employee Details</span>
                </button>

                <button 
                  className="mgmt-red-primary-btn"
                  onClick={() => {
                    setEditEmpForm({
                      name: selectedEmployee.name,
                      jobTitle: selectedEmployee.jobTitle,
                      department: selectedEmployee.department,
                      email: selectedEmployee.email,
                      phone: selectedEmployee.phone,
                      whatsappNumber: selectedEmployee.whatsappNumber || selectedEmployee.phone || '+966 '
                    });
                    setShowEditEmployeeModal(true);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                  <span>Edit Employee</span>
                </button>
              </div>

              {/* Employee Summary Card */}
              <div className="mgmt-emp-header-card">
                <div className="mgmt-emp-avatar-circle large" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
                  <img src="/assets/logo.png" onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }} alt="ALAM ENGAZ" style={{ width: '42px', height: 'auto', objectFit: 'contain' }} />
                </div>
                <div className="mgmt-emp-header-details">
                  <div className="mgmt-emp-name-badge-row">
                    <h2 className="mgmt-emp-header-name">{selectedEmployee.name}</h2>
                    <span className="mgmt-status-badge active">{selectedEmployee.status}</span>
                  </div>
                  <p className="mgmt-emp-header-role">
                    {selectedEmployee.jobTitle} • {selectedEmployee.department}
                  </p>
                  <div className="mgmt-emp-contact-row">
                    <div className="mgmt-contact-chip">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      <span>{selectedEmployee.email}</span>
                    </div>
                    <div className="mgmt-contact-chip">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      <span>{selectedEmployee.phone}</span>
                    </div>
                    <div className="mgmt-contact-chip">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                      <span>ID: {selectedEmployee.id}</span>
                    </div>
                    <div className="mgmt-contact-chip" style={{ backgroundColor: selectedEmployee.whatsappNumber ? '#ECFDF5' : '#F1F5F9', color: selectedEmployee.whatsappNumber ? '#047857' : '#64748B' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                      </svg>
                      <span>WhatsApp: {selectedEmployee.whatsappNumber || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Action Card: LOGIN ACCESS (Requirement #13) */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                borderLeft: '4px solid var(--navy-primary)',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--navy-primary)'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--navy-primary)' }}>
                        Employee Portal Access
                      </span>
                      {selectedEmployee.hasLoginAccess && selectedEmployee.portalAccessStatus === 'Active' ? (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '9999px' }}>
                          ✓ Active
                        </span>
                      ) : selectedEmployee.hasLoginAccess && selectedEmployee.portalAccessStatus === 'Inactive' ? (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626', backgroundColor: '#FEE2E2', padding: '2px 8px', borderRadius: '9999px' }}>
                          ✕ Inactive
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', backgroundColor: '#F1F5F9', padding: '2px 8px', borderRadius: '9999px' }}>
                          ○ Not Created
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                      <span><strong>Username:</strong> {selectedEmployee.username || selectedEmployee.id}</span>
                      <span><strong>Password:</strong> ••••••••</span>
                      <span><strong>Last Login:</strong> {selectedEmployee.lastLogin || 'Never'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(!selectedEmployee.hasLoginAccess || selectedEmployee.portalAccessStatus === 'Not Created') ? (
                    <button
                      type="button"
                      className="mgmt-btn-solid-red"
                      onClick={() => handleOpenCreateCreds(selectedEmployee)}
                      style={{ padding: '7px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>+ Create Login Credentials</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleResetPassword(selectedEmployee)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          color: '#0B2A55',
                          cursor: 'pointer'
                        }}
                      >
                        Reset Password
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendWhatsAppClick(selectedEmployee)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1px solid #059669',
                          backgroundColor: '#ECFDF5',
                          color: '#059669',
                          cursor: 'pointer'
                        }}
                      >
                        Send WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(selectedEmployee)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          color: selectedEmployee.portalAccessStatus === 'Active' ? '#DC2626' : '#059669',
                          cursor: 'pointer'
                        }}
                      >
                        {selectedEmployee.portalAccessStatus === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Details Sub Tabs */}
              <div className="mgmt-tab-nav-bar">
                <button 
                  className={`mgmt-tab-nav-btn ${detailsSubTab === 'signature' ? 'active' : ''}`}
                  onClick={() => setDetailsSubTab('signature')}
                >
                  Official Signature
                </button>
                <button 
                  className={`mgmt-tab-nav-btn ${detailsSubTab === 'personal' ? 'active' : ''}`}
                  onClick={() => setDetailsSubTab('personal')}
                >
                  Personal Details
                </button>
                <button 
                  className={`mgmt-tab-nav-btn ${detailsSubTab === 'login-access' ? 'active' : ''}`}
                  onClick={() => setDetailsSubTab('login-access')}
                >
                  Login Access
                </button>
              </div>

              {/* Sub-Tab 1: Official Signature */}
              {detailsSubTab === 'signature' && (
                <div className="mgmt-signature-preview-card">
                  <div className="mgmt-sig-render-box">
                    <OfficialSignature 
                      employee={selectedEmployee}
                      showActions={false}
                      customization={signatureSettings}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="mgmt-sig-action-bar">
                    <button 
                      className="mgmt-btn-solid-red"
                      onClick={() => handleCopySignature(selectedEmployee)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      <span>Copy Signature</span>
                    </button>

                    <button 
                      className="mgmt-btn-outline"
                      onClick={() => handleDownloadHtml(selectedEmployee)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      <span>Download HTML</span>
                    </button>

                    <button 
                      className="mgmt-btn-outline"
                      onClick={() => handleDownloadPng(selectedEmployee)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <span>Download PNG</span>
                    </button>

                    <button 
                      className="mgmt-btn-outline"
                      onClick={() => setShowGmailModal(true)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      <span>Preview in Gmail</span>
                    </button>

                    <button 
                      className="mgmt-btn-outline"
                      style={{ color: '#DC2626', borderColor: '#FECACA', backgroundColor: '#FEF2F2' }}
                      onClick={() => {
                        setDeleteSignatureModal({
                          isOpen: true,
                          employeeId: selectedEmployee.id,
                          employeeName: selectedEmployee.name
                        });
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      <span>Delete Signature</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: Personal Details */}
              {detailsSubTab === 'personal' && (
                <div className="mgmt-card">
                  <div className="mgmt-personal-grid">
                    <div className="mgmt-personal-item">
                      <span className="lbl">Employee Full Name</span>
                      <span className="val">{selectedEmployee.name}</span>
                    </div>
                    <div className="mgmt-personal-item">
                      <span className="lbl">Employee ID</span>
                      <span className="val">{selectedEmployee.id}</span>
                    </div>
                    <div className="mgmt-personal-item">
                      <span className="lbl">Official Job Designation</span>
                      <span className="val">{selectedEmployee.jobTitle}</span>
                    </div>
                    <div className="mgmt-personal-item">
                      <span className="lbl">Assigned Department</span>
                      <span className="val">{selectedEmployee.department}</span>
                    </div>
                    <div className="mgmt-personal-item">
                      <span className="lbl">Corporate Email</span>
                      <span className="val">{selectedEmployee.email}</span>
                    </div>
                    <div className="mgmt-personal-item">
                      <span className="lbl">Official Mobile Phone</span>
                      <span className="val">{selectedEmployee.phone}</span>
                    </div>
                    <div className="mgmt-personal-item full-width">
                      <span className="lbl">Official Port Office Address</span>
                      <span className="val">{selectedEmployee.office}</span>
                    </div>
                    <div className="mgmt-personal-item">
                      <span className="lbl">Operational Locations</span>
                      <span className="val">{selectedEmployee.locations}</span>
                    </div>
                    <div className="mgmt-personal-item">
                      <span className="lbl">Enrollment Date</span>
                      <span className="val">{selectedEmployee.createdAt || '2026-01-15'}</span>
                    </div>
                    <div className="mgmt-personal-item">
                      <span className="lbl">WhatsApp Number</span>
                      <span className="val">
                        {selectedEmployee.whatsappNumber ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <span>{selectedEmployee.whatsappNumber}</span>
                            <button
                              type="button"
                              onClick={() => setShowEditWhatsAppModal({
                                isOpen: true,
                                employee: selectedEmployee,
                                whatsappNumber: selectedEmployee.whatsappNumber || ''
                              })}
                              style={{ background: 'none', border: 'none', color: '#0B2A55', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              Edit
                            </button>
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#94A3B8' }}>WhatsApp number not available</span>
                            <button
                              type="button"
                              onClick={() => setShowEditWhatsAppModal({
                                isOpen: true,
                                employee: selectedEmployee,
                                whatsappNumber: selectedEmployee.phone || '+966 '
                              })}
                              style={{ background: 'none', border: 'none', color: '#059669', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              + Add WhatsApp Number
                            </button>
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 3: LOGIN ACCESS (Requirement #1 & #4) */}
              {detailsSubTab === 'login-access' && (
                <div className="mgmt-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-primary)', margin: 0 }}>
                        LOGIN ACCESS CONTROL
                      </h3>
                      <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0' }}>
                        Executive management of portal authentication, credentials, and secure WhatsApp transmission.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {(!selectedEmployee.hasLoginAccess || selectedEmployee.portalAccessStatus === 'Not Created') ? (
                        <button
                          type="button"
                          className="mgmt-btn-solid-red"
                          onClick={() => handleOpenCreateCreds(selectedEmployee)}
                          style={{ padding: '8px 16px', fontSize: '12.5px' }}
                        >
                          + Create Login Credentials
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenCreateCreds(selectedEmployee)}
                            style={{
                              padding: '7px 14px',
                              fontSize: '12px',
                              fontWeight: 600,
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF',
                              color: '#0B2A55',
                              cursor: 'pointer'
                            }}
                          >
                            Create Username &amp; Password
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetPassword(selectedEmployee)}
                            style={{
                              padding: '7px 14px',
                              fontSize: '12px',
                              fontWeight: 600,
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF',
                              color: '#0B2A55',
                              cursor: 'pointer'
                            }}
                          >
                            Reset Password
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppClick(selectedEmployee)}
                            style={{
                              padding: '7px 14px',
                              fontSize: '12px',
                              fontWeight: 700,
                              borderRadius: '6px',
                              border: '1px solid #059669',
                              backgroundColor: '#ECFDF5',
                              color: '#059669',
                              cursor: 'pointer'
                            }}
                          >
                            Send Login Details
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {(!selectedEmployee.hasLoginAccess || selectedEmployee.portalAccessStatus === 'Not Created') ? (
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px dashed #CBD5E1',
                      borderRadius: '8px',
                      padding: '36px 20px',
                      textAlign: 'center'
                    }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#EFF6FF', color: 'var(--navy-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy-primary)', margin: '0 0 6px' }}>
                        Login credentials not created
                      </h4>
                      <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '420px', margin: '0 auto 20px' }}>
                        This employee does not currently have portal credentials. Create their username and temporary password to issue access.
                      </p>
                      <button
                        type="button"
                        className="mgmt-btn-solid-red"
                        onClick={() => handleOpenCreateCreds(selectedEmployee)}
                        style={{ padding: '9px 20px', fontSize: '13px' }}
                      >
                        Create Login Credentials
                      </button>
                    </div>
                  ) : (
                    <div>
                      {/* Grid of Credentials Status */}
                      <div className="mgmt-personal-grid" style={{ marginBottom: '24px' }}>
                        <div className="mgmt-personal-item">
                          <span className="lbl">Employee ID</span>
                          <span className="val" style={{ fontWeight: 800 }}>{selectedEmployee.id}</span>
                        </div>
                        <div className="mgmt-personal-item">
                          <span className="lbl">Username</span>
                          <span className="val" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ color: 'var(--navy-primary)' }}>{selectedEmployee.username || selectedEmployee.id}</strong>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedEmployee.username || selectedEmployee.id);
                                triggerCopyFeedback('✓ Username copied to clipboard.');
                              }}
                              style={{
                                background: '#F1F5F9',
                                border: '1px solid #E2E8F0',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                fontSize: '11px',
                                color: '#475569',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                            >
                              Copy Username
                            </button>
                          </span>
                        </div>
                        <div className="mgmt-personal-item">
                          <span className="lbl">Password Status</span>
                          <span className="val">
                            {selectedEmployee.passwordStatus === 'Temporary' ? (
                              <span style={{ color: '#D97706', fontWeight: 700 }}>Temporary (Change Required on First Login)</span>
                            ) : (
                              <span style={{ color: '#059669', fontWeight: 700 }}>Set</span>
                            )}
                          </span>
                        </div>
                        <div className="mgmt-personal-item">
                          <span className="lbl">Account Status</span>
                          <span className="val">
                            <span className={`status-pill ${selectedEmployee.portalAccessStatus === 'Active' ? 'active' : 'inactive'}`}>
                              {selectedEmployee.portalAccessStatus || 'Active'}
                            </span>
                          </span>
                        </div>
                        <div className="mgmt-personal-item">
                          <span className="lbl">Last Login</span>
                          <span className="val">{selectedEmployee.lastLogin || 'Never'}</span>
                        </div>
                        <div className="mgmt-personal-item">
                          <span className="lbl">WhatsApp Number</span>
                          <span className="val">
                            {selectedEmployee.whatsappNumber ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ color: '#047857' }}>{selectedEmployee.whatsappNumber}</strong>
                                <button
                                  type="button"
                                  onClick={() => setShowEditWhatsAppModal({
                                    isOpen: true,
                                    employee: selectedEmployee,
                                    whatsappNumber: selectedEmployee.whatsappNumber || ''
                                  })}
                                  style={{ background: 'none', border: 'none', color: '#0B2A55', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                  Edit
                                </button>
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#94A3B8' }}>WhatsApp number not available</span>
                                <button
                                  type="button"
                                  onClick={() => setShowEditWhatsAppModal({
                                    isOpen: true,
                                    employee: selectedEmployee,
                                    whatsappNumber: selectedEmployee.phone || '+966 '
                                  })}
                                  style={{ background: 'none', border: 'none', color: '#059669', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                  + Add WhatsApp Number
                                </button>
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Management Action Bar */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '8px',
                        padding: '16px 20px',
                        border: '1px solid #E2E8F0',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="mgmt-btn-solid-red"
                            onClick={() => handleResetPassword(selectedEmployee)}
                            style={{ padding: '8px 16px', fontSize: '12.5px' }}
                          >
                            Reset Password
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppClick(selectedEmployee)}
                            style={{
                              padding: '8px 16px',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              borderRadius: '6px',
                              border: '1px solid #059669',
                              backgroundColor: '#ECFDF5',
                              color: '#059669',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                            </svg>
                            <span>Send Login Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(selectedEmployee)}
                            style={{
                              padding: '8px 16px',
                              fontSize: '12.5px',
                              fontWeight: 600,
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF',
                              color: selectedEmployee.portalAccessStatus === 'Active' ? '#DC2626' : '#059669',
                              cursor: 'pointer'
                            }}
                          >
                            {selectedEmployee.portalAccessStatus === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowDeleteAccessModal({ isOpen: true, employee: selectedEmployee })}
                          style={{
                            padding: '8px 14px',
                            fontSize: '12px',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: '1px solid #FCA5A5',
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            cursor: 'pointer'
                          }}
                        >
                          Delete Login Access
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* =======================================================
              SUB-VIEW D: SIGNATURE MANAGEMENT
              Matches Bottom-Left of Reference Image
              ======================================================= */}
          {activeTab === 'signatures' && (
            <div className="mgmt-content-flow">
              <div className="mgmt-sub-header-row">
                <div>
                  <h1 className="mgmt-sub-title">Signature Management</h1>
                  <p className="mgmt-sub-desc">Customize the official email signature</p>
                </div>
              </div>

              {/* Two-Column: Settings (Left) + Live Preview (Right) */}
              <div className="mgmt-sig-mgmt-split">
                {/* Left: Settings */}
                <div className="mgmt-sig-mgmt-left">
                  <div className="mgmt-card">
                    <h2 className="mgmt-card-title mb-3">Settings</h2>

                    <div className="mgmt-accordion-list">
                      {/* Employee Details Accordion */}
                      <div className="mgmt-accordion-item">
                        <button 
                          className={`mgmt-accordion-header ${activeSettingSection === 'details' ? 'active' : ''}`}
                          onClick={() => setActiveSettingSection('details')}
                        >
                          <div className="mgmt-acc-head-left">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span>Employee Details</span>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mgmt-acc-chevron">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </button>
                        {activeSettingSection === 'details' && (
                          <div className="mgmt-accordion-body">
                            <label className="mgmt-form-label">Selected Employee</label>
                            <select 
                              value={selectedEmployee?.id}
                              onChange={(e) => {
                                const match = employees.find(emp => emp.id === e.target.value);
                                if (match) setSelectedEmployee(match);
                              }}
                              className="mgmt-select mb-3"
                            >
                              {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name} ({emp.jobTitle})</option>
                              ))}
                            </select>
                            <p className="mgmt-hint-text">
                              Corporate standard: Signature content automatically links to verified employee database profiles.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Best Regards Settings Accordion */}
                      <div className="mgmt-accordion-item">
                        <button 
                          className={`mgmt-accordion-header ${activeSettingSection === 'regards' ? 'active' : ''}`}
                          onClick={() => setActiveSettingSection('regards')}
                        >
                          <div className="mgmt-acc-head-left">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9"></path>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                            <span>Best Regards Settings</span>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mgmt-acc-chevron">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </button>
                        {activeSettingSection === 'regards' && (
                          <div className="mgmt-accordion-body">
                            <label className="mgmt-checkbox-label mb-3">
                              <input 
                                type="checkbox"
                                checked={signatureSettings.showBestRegards}
                                onChange={(e) => setSignatureSettings({ ...signatureSettings, showBestRegards: e.target.checked })}
                              />
                              <span>Display "Best Regards" Greeting</span>
                            </label>

                            <label className="mgmt-form-label">Greeting Text</label>
                            <input 
                              type="text"
                              value={signatureSettings.bestRegardsText}
                              onChange={(e) => setSignatureSettings({ ...signatureSettings, bestRegardsText: e.target.value })}
                              className="mgmt-text-input mb-3"
                              placeholder="Best Regards,"
                            />
                          </div>
                        )}
                      </div>

                      {/* Logo Settings Accordion */}
                      <div className="mgmt-accordion-item">
                        <button 
                          className={`mgmt-accordion-header ${activeSettingSection === 'logo' ? 'active' : ''}`}
                          onClick={() => setActiveSettingSection('logo')}
                        >
                          <div className="mgmt-acc-head-left">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <span>Logo Settings</span>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mgmt-acc-chevron">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </button>
                        {activeSettingSection === 'logo' && (
                          <div className="mgmt-accordion-body">
                            <label className="mgmt-form-label">
                              Logo Scale ({signatureSettings.logoScale}%)
                            </label>
                            <input 
                              type="range"
                              min="80"
                              max="120"
                              step="5"
                              value={signatureSettings.logoScale}
                              onChange={(e) => setSignatureSettings({ ...signatureSettings, logoScale: parseInt(e.target.value) })}
                              className="mgmt-range-slider mb-2"
                            />
                            <p className="mgmt-hint-text">
                              Calibrated for high-DPI displays and Outlook table rendering.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Display Options Accordion */}
                      <div className="mgmt-accordion-item">
                        <button 
                          className={`mgmt-accordion-header ${activeSettingSection === 'display' ? 'active' : ''}`}
                          onClick={() => setActiveSettingSection('display')}
                        >
                          <div className="mgmt-acc-head-left">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="3"></circle>
                              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            <span>Display Options</span>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mgmt-acc-chevron">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </button>
                        {activeSettingSection === 'display' && (
                          <div className="mgmt-accordion-body">
                            <div className="mgmt-locked-badge">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                              </svg>
                              <span>Master Template Structure Locked</span>
                            </div>
                            <p className="mgmt-hint-text">
                              Column layout, burgundy vertical divider, and official Kingdom of Saudi Arabia corporate address remain permanently unified to maintain brand governance.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Live Preview */}
                <div className="mgmt-sig-mgmt-right">
                  <div className="mgmt-card">
                    <h2 className="mgmt-card-title mb-3">Live Preview</h2>
                    <div className="mgmt-sig-render-box mb-4">
                      <OfficialSignature 
                        employee={selectedEmployee}
                        showActions={false}
                        customization={signatureSettings}
                      />
                    </div>

                    <div className="mgmt-sig-action-bar">
                      {/* Working Save Signature (Requirement #3) */}
                      <button 
                        className="mgmt-btn-solid-red"
                        style={{ backgroundColor: '#059669', borderColor: '#047857' }}
                        onClick={handleSaveSignature}
                        id="mgmt-save-signature-btn"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                          <polyline points="17 21 17 13 7 13 7 21"></polyline>
                          <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        <span>Save Signature</span>
                      </button>

                      <button 
                        className="mgmt-btn-solid-red"
                        onClick={() => handleCopySignature(selectedEmployee)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span>Copy Signature</span>
                      </button>

                      <button 
                        className="mgmt-btn-outline"
                        onClick={() => handleDownloadHtml(selectedEmployee)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        <span>Download HTML</span>
                      </button>

                      <button 
                        className="mgmt-btn-outline"
                        onClick={() => handleDownloadPng(selectedEmployee)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        <span>Download PNG</span>
                      </button>

                      <button 
                        className="mgmt-btn-outline"
                        onClick={() => {
                          setSignatureSettings({
                            ...DEFAULT_CUSTOMIZATION,
                            showBestRegards: true,
                            bestRegardsText: 'Best Regards,',
                            logoScale: 100
                          });
                          triggerCopyFeedback('✓ Signature settings restored to corporate default.');
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="1 4 1 10 7 10"></polyline>
                          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                        </svg>
                        <span>Reset Settings</span>
                      </button>

                      <button 
                        className="mgmt-btn-outline"
                        style={{ color: '#DC2626', borderColor: '#FECACA', backgroundColor: '#FEF2F2' }}
                        onClick={() => {
                          setDeleteSignatureModal({
                            isOpen: true,
                            employeeId: selectedEmployee.id,
                            employeeName: selectedEmployee.name
                          });
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        <span>Delete Signature</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =======================================================
              SUB-VIEW E: COMPANY SETTINGS
              Matches Bottom-Right of Reference Image
              ======================================================= */}
          {activeTab === 'company' && (
            <div className="mgmt-content-flow">
              <div className="mgmt-sub-header-row">
                <div>
                  <h1 className="mgmt-sub-title">Company Settings</h1>
                  <p className="mgmt-sub-desc">Manage company information</p>
                </div>
              </div>

              {companySavedAlert && (
                <div className="mgmt-success-alert mb-4">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>✓ Company information updated successfully. Changes applied globally across all signatures and portals.</span>
                </div>
              )}

              <div className="mgmt-card max-w-4xl">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setCompanySavedAlert(true);
                    setTimeout(() => setCompanySavedAlert(false), 4500);
                  }}
                  className="mgmt-form-stack"
                >
                  <div className="mgmt-field-block">
                    <label className="mgmt-form-label">Company Name</label>
                    <input 
                      type="text"
                      value={companyForm.name}
                      onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                      className="mgmt-text-input"
                      required
                    />
                  </div>

                  <div className="mgmt-field-block">
                    <label className="mgmt-form-label">Official Address</label>
                    <textarea 
                      rows={3}
                      value={companyForm.address}
                      onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                      className="mgmt-textarea"
                      required
                    />
                  </div>

                  <div className="mgmt-field-block">
                    <label className="mgmt-form-label">Locations</label>
                    <input 
                      type="text"
                      value={companyForm.locations}
                      onChange={(e) => setCompanyForm({ ...companyForm, locations: e.target.value })}
                      className="mgmt-text-input"
                      required
                    />
                  </div>

                  <div className="mgmt-field-block">
                    <label className="mgmt-form-label">Website</label>
                    <input 
                      type="text"
                      value={companyForm.website}
                      onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                      className="mgmt-text-input"
                      required
                    />
                  </div>

                  <div className="mgmt-form-actions-left">
                    <button type="submit" className="mgmt-btn-solid-red">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =======================================================
              SUB-VIEW F: ACTIVITY LOG
              ======================================================= */}
          {activeTab === 'logs' && (
            <div className="mgmt-content-flow">
              <div className="mgmt-sub-header-row">
                <div>
                  <h1 className="mgmt-sub-title">Activity Log</h1>
                  <p className="mgmt-sub-desc">Executive audit trail of actions</p>
                </div>
              </div>

              <div className="mgmt-table-container">
                <table className="mgmt-data-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>User</th>
                      <th>Timestamp</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <strong>{log.action}</strong>
                        </td>
                        <td>
                          <span className="mgmt-log-user-badge">{log.user}</span>
                        </td>
                        <td className="mgmt-log-time-cell">{log.timestamp}</td>
                        <td className="mgmt-log-details-cell">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =======================================================
              SUB-VIEW G: PROFILE
              ======================================================= */}
          {activeTab === 'profile' && (
            <div className="mgmt-content-flow">
              <div className="mgmt-sub-header-row">
                <div>
                  <h1 className="mgmt-sub-title">Executive Profile</h1>
                  <p className="mgmt-sub-desc">Manage your management profile details</p>
                </div>
              </div>

              {profileSaved && (
                <div className="mgmt-success-alert mb-4">
                  <span>✓ Profile details saved successfully.</span>
                </div>
              )}

              <div className="mgmt-card max-w-2xl">
                <div className="mgmt-profile-top-view mb-4">
                  <div className="mgmt-avatar-circle large" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
                    <img src="/assets/logo.png" onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }} alt="ALAM ENGAZ" style={{ width: '42px', height: 'auto', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <h2 className="mgmt-card-title">{profileForm.name}</h2>
                    <span className="mgmt-status-badge active">{currentUser.role}</span>
                  </div>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setProfileSaved(true);
                    setTimeout(() => setProfileSaved(false), 4000);
                  }}
                  className="mgmt-form-stack"
                >
                  <div className="mgmt-field-block">
                    <label className="mgmt-form-label">Full Name</label>
                    <input 
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="mgmt-text-input"
                    />
                  </div>

                  <div className="mgmt-field-block">
                    <label className="mgmt-form-label">Executive Role (Locked)</label>
                    <input 
                      type="text"
                      value={currentUser.role}
                      disabled
                      className="mgmt-text-input disabled"
                    />
                  </div>

                  <div className="mgmt-field-block">
                    <label className="mgmt-form-label">Email Address</label>
                    <input 
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="mgmt-text-input"
                    />
                  </div>

                  <div className="mgmt-form-actions-left">
                    <button type="submit" className="mgmt-btn-solid-red">
                      Update Profile
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* =======================================================
              SUB-VIEW H: SECURITY
              ======================================================= */}
          {activeTab === 'security' && (
            <div className="mgmt-content-flow">
              <div className="mgmt-sub-header-row">
                <div>
                  <h1 className="mgmt-sub-title">Security & Access</h1>
                  <p className="mgmt-sub-desc">Role-based governance & credentials</p>
                </div>
              </div>

              <div className="mgmt-card max-w-2xl mb-4">
                <h2 className="mgmt-card-title mb-3">Change Executive Password</h2>
                {passMessage && (
                  <div className={passMessage.isError ? "mgmt-login-error mb-3" : "mgmt-success-alert mb-3"}>
                    <span>{passMessage.text}</span>
                  </div>
                )}
                <form 
                  onSubmit={handleManagementPasswordChange}
                  className="mgmt-form-stack"
                >
                  <div className="mgmt-field-block">
                    <label className="mgmt-form-label">Current Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      className="mgmt-text-input" 
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="mgmt-field-block">
                    <label className="mgmt-form-label">New Password</label>
                    <input 
                      type="password" 
                      placeholder="Enter new strong password" 
                      className="mgmt-text-input" 
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="mgmt-field-block">
                    <label className="mgmt-form-label">Confirm New Password</label>
                    <input 
                      type="password" 
                      placeholder="Repeat new password" 
                      className="mgmt-text-input" 
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      required 
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                    <button type="submit" className="mgmt-btn-solid-red">
                      Update Password
                    </button>
                    <button 
                      type="button" 
                      onClick={handleManagementForgotPassword}
                      className="mgmt-forgot-link"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </form>
              </div>

              <div className="mgmt-card max-w-2xl">
                <h2 className="mgmt-card-title mb-2">Active Session Security</h2>
                <div className="mgmt-session-row">
                  <div className="mgmt-session-info">
                    <strong>Dammam Headquarters (This Session)</strong>
                    <span>Chrome on Windows • Authenticated via Firebase Role Engine</span>
                  </div>
                  <span className="mgmt-status-badge active">Current Session</span>
                </div>
              </div>
            </div>
          )}

          {/* =======================================================
              3. BOTTOM MARITIME PROMOTIONAL BANNER
              Matches Bottom of Reference Image
              ======================================================= */}
          <div className="mgmt-bottom-promo-banner">
            <div className="mgmt-bp-left">
              <img 
                src="/assets/logo.png" 
                alt="ALAM ENGAZ PORT SERVICES CO." 
                className="mgmt-bp-logo"
              />
              <div className="mgmt-bp-motto-block">
                <span className="mgmt-bp-motto-title">MOVING BUSINESS FURTHER</span>
                <span className="mgmt-bp-locations">Dammam &nbsp;|&nbsp; Jeddah &nbsp;|&nbsp; Bahrain &nbsp;|&nbsp; India</span>
              </div>
            </div>

            <div className="mgmt-bp-right-container">
              <div className="mgmt-bp-ship-bg" style={{ backgroundImage: `url('/assets/hero-ship.jpg')` }}></div>
              <div className="mgmt-bp-tagline-box">
                <span className="tag-line">GLOBAL</span>
                <span className="tag-line">PEOPLE</span>
                <span className="tag-line">GLOBAL</span>
                <span className="tag-line">OPPORTUNITIES</span>
                <div className="mgmt-bp-red-line"></div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* =======================================================
          MODAL: ADD EMPLOYEE
          ======================================================= */}
      {showAddEmployeeModal && (
        <div className="support-modal-backdrop" onClick={() => setShowAddEmployeeModal(false)}>
          <div className="support-modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="support-modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0B2A55' }}>
                Add Official Employee
              </h3>
              <button 
                onClick={() => setShowAddEmployeeModal(false)}
                className="support-modal-close-btn"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input 
                  type="text" 
                  value={newEmpForm.name}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, name: e.target.value })}
                  placeholder="e.g. MUHAMMED NASEEH"
                  required
                  className="mgmt-text-input"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Job Title *
                </label>
                <input 
                  type="text" 
                  value={newEmpForm.jobTitle}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, jobTitle: e.target.value })}
                  placeholder="e.g. Accountant"
                  required
                  className="mgmt-text-input"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Department
                </label>
                <select 
                  value={newEmpForm.department}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, department: e.target.value })}
                  className="mgmt-select"
                >
                  <option value="Accounts">Accounts</option>
                  <option value="Finance & Accounts">Finance & Accounts</option>
                  <option value="Operations">Operations</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Corporate Email *
                </label>
                <input 
                  type="email" 
                  value={newEmpForm.email}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, email: e.target.value })}
                  placeholder="@alamengaz.com"
                  required
                  className="mgmt-text-input"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Phone Number
                </label>
                <input 
                  type="text" 
                  value={newEmpForm.phone}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, phone: e.target.value })}
                  placeholder="+966"
                  className="mgmt-text-input"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  WhatsApp Number
                </label>
                <input 
                  type="text" 
                  value={newEmpForm.whatsappNumber}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, whatsappNumber: e.target.value })}
                  placeholder="+966 50 123 4567"
                  className="mgmt-text-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddEmployeeModal(false)}
                  style={{
                    padding: '9px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="mgmt-btn-solid-red"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL: EDIT EMPLOYEE
          ======================================================= */}
      {showEditEmployeeModal && selectedEmployee && (
        <div className="support-modal-backdrop" onClick={() => setShowEditEmployeeModal(false)}>
          <div className="support-modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="support-modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0B2A55' }}>
                Edit Employee Details
              </h3>
              <button 
                onClick={() => setShowEditEmployeeModal(false)}
                className="support-modal-close-btn"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditEmployeeSubmit} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input 
                  type="text" 
                  value={editEmpForm.name}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, name: e.target.value })}
                  required
                  className="mgmt-text-input"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Job Title *
                </label>
                <input 
                  type="text" 
                  value={editEmpForm.jobTitle}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, jobTitle: e.target.value })}
                  required
                  className="mgmt-text-input"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Department
                </label>
                <input 
                  type="text" 
                  value={editEmpForm.department}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, department: e.target.value })}
                  required
                  className="mgmt-text-input"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Corporate Email *
                </label>
                <input 
                  type="email" 
                  value={editEmpForm.email}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, email: e.target.value })}
                  required
                  className="mgmt-text-input"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Phone Number
                </label>
                <input 
                  type="text" 
                  value={editEmpForm.phone}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, phone: e.target.value })}
                  className="mgmt-text-input"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  WhatsApp Number
                </label>
                <input 
                  type="text" 
                  value={editEmpForm.whatsappNumber}
                  onChange={(e) => setEditEmpForm({ ...editEmpForm, whatsappNumber: e.target.value })}
                  placeholder="+966 50 123 4567"
                  className="mgmt-text-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowEditEmployeeModal(false)}
                  style={{
                    padding: '9px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="mgmt-btn-solid-red"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL: GMAIL LIVE PREVIEW
          ======================================================= */}
      {showGmailModal && selectedEmployee && (
        <div className="support-modal-backdrop" onClick={() => setShowGmailModal(false)}>
          <div className="support-modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              backgroundColor: '#F1F5F9',
              borderBottom: '1px solid #E2E8F0',
              borderTopLeftRadius: '10px',
              borderTopRightRadius: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>New Message — Gmail Simulation</span>
              </div>
              <button 
                onClick={() => setShowGmailModal(false)}
                className="support-modal-close-btn"
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '10px', fontSize: '13px', color: '#64748B' }}>
                To: <span style={{ color: '#0F172A' }}>partner@port-logistics.com</span>
              </div>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '16px', fontSize: '13px', color: '#64748B' }}>
                Subject: <span style={{ color: '#0F172A', fontWeight: 600 }}>Port Operations Inquiry — Dammam Terminal</span>
              </div>
              <div style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.6, marginBottom: '24px' }}>
                Dear Partner,
                <br /><br />
                Thank you for reaching out to ALAM ENGAZ PORT SERVICES CO. Please find the attached documentation regarding terminal handling logistics.
                <br /><br />
              </div>

              {/* Master Signature in email compose container */}
              <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '16px' }}>
                <OfficialSignature 
                  employee={selectedEmployee}
                  showActions={false}
                  customization={signatureSettings}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '12px 20px',
              backgroundColor: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              borderBottomLeftRadius: '10px',
              borderBottomRightRadius: '10px'
            }}>
              <button 
                onClick={() => setShowGmailModal(false)}
                className="mgmt-btn-solid-red"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL: DELETE SIGNATURE CONFIRMATION
          ======================================================= */}
      {deleteSignatureModal?.isOpen && (
        <div className="support-modal-backdrop" onClick={() => setDeleteSignatureModal(null)}>
          <div className="support-modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              Delete saved signature?
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, marginBottom: '24px' }}>
              Are you sure you want to delete this employee's saved signature configuration? The default master signature configuration will be restored.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setDeleteSignatureModal(null)}
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSignatureConfirm}
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                Delete Signature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          1. MODAL: CREATE EMPLOYEE PORTAL ACCESS (Requirement #2)
          ======================================================= */}
      {showCreateCredsModal && selectedEmployee && (
        <div className="support-modal-backdrop" onClick={() => setShowCreateCredsModal(false)}>
          <div className="support-modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="support-modal-header" style={{ borderBottom: '1px solid #E2E8F0', padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: 'var(--navy-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--navy-primary)', margin: 0 }}>
                    CREATE EMPLOYEE PORTAL ACCESS
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
                    Issue authenticated portal credentials for team member.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowCreateCredsModal(false)} className="support-modal-close-btn">&times;</button>
            </div>

            <form onSubmit={handleSubmitCreateCreds} style={{ padding: '24px' }}>
              {credsModalError && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '10px 14px', borderRadius: '6px', fontSize: '12.5px', marginBottom: '16px' }}>
                  ⚠️ {credsModalError}
                </div>
              )}

              {/* Readonly Summary Info */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', padding: '12px 16px', marginBottom: '18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Employee</span>
                  <strong style={{ fontSize: '13px', color: 'var(--navy-primary)' }}>{selectedEmployee.name}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Employee ID</span>
                  <strong style={{ fontSize: '13px', color: 'var(--navy-primary)' }}>{selectedEmployee.id}</strong>
                </div>
              </div>

              {/* Username Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Username *
                </label>
                <input 
                  type="text"
                  value={createCredsForm.username}
                  onChange={(e) => setCreateCredsForm({ ...createCredsForm, username: e.target.value })}
                  required
                  placeholder="e.g. AE-1037"
                  className="mgmt-text-input"
                />
                <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                  Employee will sign in using this username or their Employee ID ({selectedEmployee.id}).
                </span>
              </div>

              {/* Temporary Password with Generate Button */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                    Temporary Password *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateNewTempPassInForm}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--navy-primary)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'underline'
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                    </svg>
                    <span>Generate Password</span>
                  </button>
                </div>
                <input 
                  type="text"
                  value={createCredsForm.tempPassword}
                  onChange={(e) => setCreateCredsForm({ ...createCredsForm, tempPassword: e.target.value })}
                  required
                  minLength={6}
                  className="mgmt-text-input"
                  style={{ fontFamily: 'monospace', letterSpacing: '0.04em', fontWeight: 700 }}
                />
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Confirm Password *
                </label>
                <input 
                  type="text"
                  value={createCredsForm.confirmPassword}
                  onChange={(e) => setCreateCredsForm({ ...createCredsForm, confirmPassword: e.target.value })}
                  required
                  className="mgmt-text-input"
                  style={{ fontFamily: 'monospace', letterSpacing: '0.04em', fontWeight: 700 }}
                />
              </div>

              {/* WhatsApp Number */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  WhatsApp Number *
                </label>
                <input 
                  type="text"
                  value={createCredsForm.whatsappNumber}
                  onChange={(e) => setCreateCredsForm({ ...createCredsForm, whatsappNumber: e.target.value })}
                  placeholder="+966 50 123 4567"
                  required
                  className="mgmt-text-input"
                />
                <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                  Used to deliver pre-filled login instructions via WhatsApp.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '18px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateCredsModal(false)}
                  style={{
                    padding: '9px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="mgmt-btn-solid-red"
                  style={{ padding: '9px 20px', fontSize: '13px', fontWeight: 700 }}
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          2. MODAL: TEMPORARY PASSWORD & WHATSAPP (Requirement #2, #3, #7)
          ======================================================= */}
      {tempPassModalData?.isOpen && (
        <div className="support-modal-backdrop" onClick={() => setTempPassModalData(null)}>
          <div className="support-modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', textAlign: 'center', padding: '28px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy-primary)', margin: '0 0 4px' }}>
              {tempPassModalData.isNewCreation ? 'Account Created Successfully' : 'NEW TEMPORARY PASSWORD'}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 18px' }}>
              Credentials issued for <strong>{tempPassModalData.employee.name}</strong> ({tempPassModalData.employee.id})
            </p>

            {/* Password Box */}
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Temporary Access Password
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy-primary)', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
                {tempPassModalData.tempPassword}
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4, margin: '0 0 20px' }}>
              ⚠️ For security, this temporary password will not be shown again. The employee is required to change their password on first login.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  handleOpenWhatsAppDirect(tempPassModalData.employee, tempPassModalData.tempPassword);
                }}
                style={{
                  padding: '12px 18px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                <span>SEND LOGIN DETAILS ON WHATSAPP</span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(tempPassModalData.tempPassword);
                    triggerCopyFeedback('✓ Password copied to clipboard.');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  Copy Password
                </button>
                <button
                  type="button"
                  onClick={() => setTempPassModalData(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid var(--navy-primary)',
                    backgroundColor: 'var(--navy-primary)',
                    color: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          3. MODAL: CONFIRM WHATSAPP RESET (Requirement #14)
          ======================================================= */}
      {showConfirmWhatsAppModal?.isOpen && (
        <div className="support-modal-backdrop" onClick={() => setShowConfirmWhatsAppModal(null)}>
          <div className="support-modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#EFF6FF', color: 'var(--navy-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--navy-primary)', marginBottom: '8px' }}>
              Send Login Details via WhatsApp
            </h3>
            <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5, marginBottom: '20px' }}>
              Generate a new temporary password before sending login credentials to <strong>{showConfirmWhatsAppModal.employee.name}</strong>?
            </p>
            <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4, marginBottom: '24px', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              For security, previously configured passwords cannot be displayed in plaintext. Generating a new temporary password ensures safe delivery to the employee.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmWhatsAppModal(null)}
                style={{
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmGenerateAndSendWhatsApp}
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Generate &amp; Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          4. MODAL: DELETE LOGIN ACCESS CONFIRMATION (Requirement #11)
          ======================================================= */}
      {showDeleteAccessModal?.isOpen && (
        <div className="support-modal-backdrop" onClick={() => setShowDeleteAccessModal(null)}>
          <div className="support-modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              Delete portal access for {showDeleteAccessModal.employee.name}?
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.5, marginBottom: '24px' }}>
              This will prevent the employee from logging in to the Employee Portal. The employee record will remain in the employee database.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteAccessModal(null)}
                style={{
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccess}
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                Delete Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          5. MODAL: EDIT / ADD WHATSAPP NUMBER (Requirement #4)
          ======================================================= */}
      {showEditWhatsAppModal?.isOpen && (
        <div className="support-modal-backdrop" onClick={() => setShowEditWhatsAppModal(null)}>
          <div className="support-modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-primary)', margin: 0 }}>
                Manage WhatsApp Number
              </h3>
              <button onClick={() => setShowEditWhatsAppModal(null)} className="support-modal-close-btn">&times;</button>
            </div>

            <p style={{ fontSize: '12.5px', color: '#64748B', marginBottom: '16px' }}>
              Employee: <strong>{showEditWhatsAppModal.employee.name}</strong> ({showEditWhatsAppModal.employee.id})
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                WhatsApp Number (with country code) *
              </label>
              <input
                type="text"
                value={showEditWhatsAppModal.whatsappNumber}
                onChange={(e) => setShowEditWhatsAppModal({ ...showEditWhatsAppModal, whatsappNumber: e.target.value })}
                placeholder="+966 50 123 4567"
                required
                className="mgmt-text-input"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowEditWhatsAppModal(null)}
                style={{
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mgmt-btn-solid-red"
                onClick={() => handleSaveWhatsApp(showEditWhatsAppModal.whatsappNumber)}
                style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 700 }}
              >
                Save Number
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
