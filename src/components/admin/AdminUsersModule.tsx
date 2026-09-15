import React, { useState, useEffect } from 'react';
import { 
  getFirestoreUserAccounts, 
  saveFirestoreUserAccounts, 
  getFirestoreEmployees,
  saveFirestoreEmployee,
  UserAccount 
} from '../../services/firebaseService';
import { 
  changeUserPassword, 
  sendFirebasePasswordReset 
} from '../../services/authService';
import {
  generateSecureTempPassword,
  openWhatsAppWithCredentials,
  createEmployeeCredentials,
  resetEmployeeCredentials,
  toggleEmployeeAccountStatus,
  deleteEmployeePortalAccess,
  updateEmployeeWhatsAppNumber
} from '../../services/credentialService';
import { logAuditEvent } from '../../services/websiteContentService';
import { EmployeeAvatar } from '../EmployeeAvatar';
import { Employee } from '../../types';

interface AdminUsersModuleProps {
  onShowToast: (msg: string) => void;
}

export const AdminUsersModule: React.FC<AdminUsersModuleProps> = ({
  onShowToast
}) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  // Requirement #9: Keep separate tabs: SUPER ADMIN, MANAGEMENT, EMPLOYEES
  const [roleFilter, setRoleFilter] = useState<'SUPER_ADMIN' | 'MANAGEMENT' | 'EMPLOYEES'>('EMPLOYEES');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [activeModal, setActiveModal] = useState<
    'none' | 'add' | 'edit-user' | 'edit-employee' | 'change-password' | 'delete-user' | 'confirm-delete-access' | 'temp-password-reveal' | 'confirm-reset-whatsapp'
  >('none');
  
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'SUPER_ADMIN' | 'MANAGEMENT' | 'EMPLOYEE'>('EMPLOYEE');
  const [formDept, setFormDept] = useState('Operations');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formWhatsApp, setFormWhatsApp] = useState('');

  // Password change & Temporary password reveal states (Requirement #7 & #14)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [tempPasswordResult, setTempPasswordResult] = useState<string | null>(null);
  const [tempPasswordTarget, setTempPasswordTarget] = useState<{
    name: string;
    username: string;
    whatsappNumber?: string;
    portalUrl?: string;
  } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const userList = getFirestoreUserAccounts();
    const empList = getFirestoreEmployees();
    setUsers(userList);
    setEmployees(empList);
  };

  const syncUsers = async (updated: UserAccount[]) => {
    await saveFirestoreUserAccounts(updated);
    setUsers(updated);
  };

  // Open Add User
  const handleOpenAdd = () => {
    setFormName('');
    setFormUsername('');
    setFormEmployeeId('');
    setFormEmail('');
    setFormRole(roleFilter === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : roleFilter === 'MANAGEMENT' ? 'MANAGEMENT' : 'EMPLOYEE');
    setFormDept('Finance & Accounts');
    setFormStatus('Active');
    setFormWhatsApp('');
    setActiveModal('add');
  };

  // Submit Add User
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) return;

    const newUser: UserAccount = {
      id: `USR-${Date.now()}`,
      name: formName.toUpperCase(),
      username: formUsername || formEmployeeId || formEmail.split('@')[0],
      employeeId: formRole === 'EMPLOYEE' ? (formEmployeeId || `AE-${1040 + users.length}`) : undefined,
      email: formEmail,
      role: formRole,
      status: formStatus,
      lastLogin: 'Never',
      createdAt: new Date().toISOString().split('T')[0],
      department: formDept,
      mustChangePassword: false,
      passwordChangeRequired: false,
      passwordStatus: 'Set',
      whatsappNumber: formWhatsApp
    };

    const updated = [...users, newUser];
    await syncUsers(updated);
    await logAuditEvent('Basim Aslam', 'SUPER_ADMIN', 'User Enrolled', 'Security', `${newUser.name} (${newUser.role})`, 'Enrolled new authenticated system user.');
    setActiveModal('none');
    onShowToast(`✓ Account for "${newUser.name}" created successfully.`);
  };

  // Open Edit User (Super Admin / Management)
  const handleOpenEditUser = (user: UserAccount) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormUsername(user.username || '');
    setFormEmployeeId(user.employeeId || '');
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormDept(user.department || 'Operations');
    setFormStatus(user.status);
    setFormWhatsApp(user.whatsappNumber || '');
    setActiveModal('edit-user');
  };

  // Submit Edit User
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const updated = users.map(u => 
      u.id === selectedUser.id
        ? {
            ...u,
            name: formName,
            username: formUsername || u.username,
            employeeId: formEmployeeId || u.employeeId,
            email: formEmail,
            role: formRole,
            department: formDept,
            status: formStatus,
            whatsappNumber: formWhatsApp
          }
        : u
    );

    await syncUsers(updated);
    await logAuditEvent('Basim Aslam', 'SUPER_ADMIN', 'User Profile Updated', 'Security', `${formName} (${formRole})`, 'Updated user roles and profile details.');
    setActiveModal('none');
    onShowToast(`✓ Updated profile for ${formName}.`);
  };

  // Open Edit Employee (under EMPLOYEES tab)
  const handleOpenEditEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormName(emp.name);
    setFormUsername(emp.username || emp.id);
    setFormEmployeeId(emp.id);
    setFormEmail(emp.email);
    setFormStatus(emp.status as any || 'Active');
    setFormWhatsApp(emp.whatsappNumber || emp.phone || '');
    setActiveModal('edit-employee');
  };

  // Submit Edit Employee
  const handleEditEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const updatedEmp: Employee = {
      ...selectedEmployee,
      name: formName,
      username: formUsername,
      email: formEmail,
      status: formStatus,
      whatsappNumber: formWhatsApp
    };

    await saveFirestoreEmployee(updatedEmp);
    loadData();
    await logAuditEvent('Basim Aslam', 'SUPER_ADMIN', 'Employee Access Profile Updated', 'Security', formName, 'Updated employee portal username and access profile.');
    setActiveModal('none');
    onShowToast(`✓ Updated profile for ${formName}.`);
  };

  // Toggle Status for User (Super Admin / Management)
  const handleToggleUserStatus = async (user: UserAccount) => {
    if (user.role === 'SUPER_ADMIN' && user.email === 'basim@alamengaz.com') {
      alert('The root Super Administrator account cannot be deactivated.');
      return;
    }
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    const updated = users.map(u => u.id === user.id ? { ...u, status: newStatus as any } : u);
    await syncUsers(updated);
    await logAuditEvent('Basim Aslam', 'SUPER_ADMIN', 'User Status Toggled', 'Security', user.name, `Changed account status to ${newStatus}.`);
    onShowToast(`✓ Account for ${user.name} is now ${newStatus}.`);
  };

  // Toggle Employee Portal Access Status (Requirement #8: Activate / Deactivate)
  const handleToggleEmployeeStatus = async (emp: Employee) => {
    const nextStatus = emp.portalAccessStatus === 'Active' ? 'Inactive' : 'Active';
    const res = await toggleEmployeeAccountStatus({
      employeeId: emp.id,
      status: nextStatus,
      actorName: 'Basim Aslam',
      actorRole: 'SUPER_ADMIN'
    });
    loadData();
    onShowToast(res.message);
  };

  // Reset Employee Password (Requirement #7: Show temp pass ONLY in confirmation dialog)
  const handleResetEmployeePassword = async (emp: Employee) => {
    const res = await resetEmployeeCredentials({
      employeeId: emp.id,
      actorName: 'Basim Aslam',
      actorRole: 'SUPER_ADMIN'
    });

    if (res.success && res.tempPassword) {
      setTempPasswordResult(res.tempPassword);
      setTempPasswordTarget({
        name: emp.name,
        username: emp.username || emp.id,
        whatsappNumber: emp.whatsappNumber || emp.phone
      });
      setCopiedPass(false);
      setActiveModal('temp-password-reveal');
      loadData();
      onShowToast(`✓ Temporary password generated for ${emp.name}.`);
    } else {
      onShowToast(res.message);
    }
  };

  // Delete Employee Portal Access (Requirement #11: Delete portal access without deleting employee profile)
  const handleInitiateDeleteAccess = (emp: Employee) => {
    setSelectedEmployee(emp);
    setActiveModal('confirm-delete-access');
  };

  const handleConfirmDeleteAccess = async () => {
    if (!selectedEmployee) return;
    const res = await deleteEmployeePortalAccess({
      employeeId: selectedEmployee.id,
      actorName: 'Basim Aslam',
      actorRole: 'SUPER_ADMIN'
    });
    setActiveModal('none');
    loadData();
    onShowToast(res.message);
  };

  // Send WhatsApp Logic (Requirement #14)
  const handleSendWhatsAppClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    // If account already exists and password has not just been reset, prompt before generating new temporary password
    setActiveModal('confirm-reset-whatsapp');
  };

  const handleGenerateAndSendWhatsApp = async () => {
    if (!selectedEmployee) return;
    const res = await resetEmployeeCredentials({
      employeeId: selectedEmployee.id,
      actorName: 'Basim Aslam',
      actorRole: 'SUPER_ADMIN'
    });

    if (res.success && res.tempPassword) {
      setTempPasswordResult(res.tempPassword);
      setTempPasswordTarget({
        name: selectedEmployee.name,
        username: selectedEmployee.username || selectedEmployee.id,
        whatsappNumber: selectedEmployee.whatsappNumber || selectedEmployee.phone
      });
      setCopiedPass(false);
      setActiveModal('temp-password-reveal');
      loadData();

      // Open WhatsApp prefilled with new credentials
      const num = selectedEmployee.whatsappNumber || selectedEmployee.phone;
      if (num) {
        openWhatsAppWithCredentials({
          employeeName: selectedEmployee.name,
          username: selectedEmployee.username || selectedEmployee.id,
          tempPassword: res.tempPassword,
          whatsappNumber: num,
          actorName: 'Basim Aslam',
          actorRole: 'SUPER_ADMIN'
        });
      }
    }
  };

  // Open Change Password Modal (Management / Super Admin)
  const handleOpenChangePassword = (user: UserAccount) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setPassError('');
    setActiveModal('change-password');
  };

  // Submit Change Password (Management / Super Admin)
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setPassError('');

    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Passwords do not match.');
      return;
    }

    try {
      const res = await changeUserPassword(selectedUser.email, 'admin-override', newPassword, confirmPassword, selectedUser.role === 'SUPER_ADMIN' ? 'admin' : selectedUser.role === 'MANAGEMENT' ? 'management' : 'employee');
      if (res.success) {
        await logAuditEvent('Basim Aslam', 'SUPER_ADMIN', 'Password Updated', 'Security', selectedUser.email, `Admin updated password for ${selectedUser.name}.`);
        setActiveModal('none');
        onShowToast(`✓ Password successfully updated for ${selectedUser.name}.`);
      } else {
        setPassError(res.message);
      }
    } catch (err: any) {
      setPassError(err.message || 'Failed to update password.');
    }
  };

  // Filtered lists
  const filteredEmployees = employees.filter(emp => {
    const q = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.id.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      (emp.username && emp.username.toLowerCase().includes(q))
    );
  });

  const managementUsers = users.filter(u => u.role === 'MANAGEMENT').filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  const superAdminUsers = users.filter(u => u.role === 'SUPER_ADMIN').filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  return (
    <div className="adm-module-wrap">
      {/* Module Header */}
      <div className="adm-module-header">
        <div>
          <div className="adm-module-eyebrow">SETTINGS &bull; USERS &amp; ROLES</div>
          <h2 className="adm-module-title">Users &amp; Roles Management</h2>
          <p className="adm-module-subtitle">
            Administer authenticated accounts across Super Admin, Management, and Employee Portal tiers.
          </p>
        </div>
        <div className="adm-module-header-actions">
          <button type="button" className="btn-adm-primary" onClick={handleOpenAdd}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>+ Add User</span>
          </button>
        </div>
      </div>

      {/* Requirement #9: 3 Separate Tabs (SUPER ADMIN, MANAGEMENT, EMPLOYEES) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '6px' }}>
          <button
            type="button"
            onClick={() => setRoleFilter('EMPLOYEES')}
            style={{
              padding: '8px 18px',
              fontSize: '12.5px',
              fontWeight: 700,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: roleFilter === 'EMPLOYEES' ? 'var(--navy-primary)' : 'transparent',
              color: roleFilter === 'EMPLOYEES' ? '#FFFFFF' : '#64748B',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>EMPLOYEES</span>
            <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', backgroundColor: roleFilter === 'EMPLOYEES' ? 'var(--red-corporate)' : '#E2E8F0', color: '#FFFFFF' }}>
              {employees.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('MANAGEMENT')}
            style={{
              padding: '8px 18px',
              fontSize: '12.5px',
              fontWeight: 700,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: roleFilter === 'MANAGEMENT' ? 'var(--navy-primary)' : 'transparent',
              color: roleFilter === 'MANAGEMENT' ? '#FFFFFF' : '#64748B',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>MANAGEMENT</span>
            <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', backgroundColor: roleFilter === 'MANAGEMENT' ? 'var(--red-corporate)' : '#E2E8F0', color: '#FFFFFF' }}>
              {managementUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('SUPER_ADMIN')}
            style={{
              padding: '8px 18px',
              fontSize: '12.5px',
              fontWeight: 700,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: roleFilter === 'SUPER_ADMIN' ? 'var(--navy-primary)' : 'transparent',
              color: roleFilter === 'SUPER_ADMIN' ? '#FFFFFF' : '#64748B',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>SUPER ADMIN</span>
            <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', backgroundColor: roleFilter === 'SUPER_ADMIN' ? 'var(--red-corporate)' : '#E2E8F0', color: '#FFFFFF' }}>
              {superAdminUsers.length}
            </span>
          </button>
        </div>

        <input 
          type="text"
          placeholder="Search by name, ID, username, or email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            padding: '7px 14px',
            fontSize: '12.5px',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            minWidth: '280px',
            outline: 'none'
          }}
        />
      </div>

      {/* ================= TAB 1: EMPLOYEES (Requirement #8) ================= */}
      {roleFilter === 'EMPLOYEES' && (
        <div className="adm-table-card">
          <table className="ss-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Username</th>
                <th>Portal</th>
                <th>Status</th>
                <th>Password Status</th>
                <th>Last Login</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => {
                const userAcc = users.find(u => u.employeeId?.toLowerCase() === emp.id.toLowerCase());
                const portalActive = emp.portalAccessStatus === 'Active' || emp.hasLoginAccess;
                const portalStatusLabel = portalActive ? '✓ Active' : emp.portalAccessStatus === 'Inactive' ? '✕ Deactivated' : '○ Not Created';
                const passStatus = emp.passwordStatus || userAcc?.passwordStatus || (portalActive ? 'Set' : 'Not Set');
                const lastLogin = userAcc?.lastLogin || 'Never';

                return (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <EmployeeAvatar name={emp.name} photoUrl={emp.photoUrl} size={32} />
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13px' }}>{emp.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>{emp.jobTitle} &bull; {emp.department}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--navy-primary)' }}>
                        {emp.id}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                        {emp.username || emp.id}
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
                        {portalStatusLabel}
                      </span>
                    </td>
                    <td>
                      <span className={`ss-badge-operational ${emp.status !== 'Active' ? 'inactive' : ''}`} style={{ padding: '3px 8px' }}>
                        <span className={emp.status === 'Active' ? 'ss-dot-green' : 'ss-dot-gray'} />
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      {/* Security Rule: Never plaintext. Show Password Status */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: passStatus === 'Set' ? '#F1F5F9' : passStatus === 'Temporary' ? '#FEF3C7' : '#F8FAFC',
                        color: passStatus === 'Set' ? '#0F766E' : passStatus === 'Temporary' ? '#B45309' : '#94A3B8',
                        border: '1px solid #E2E8F0'
                      }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        {passStatus}
                      </span>
                    </td>
                    <td style={{ fontSize: '11.5px', color: '#64748B' }}>{lastLogin}</td>
                    <td style={{ textAlign: 'right' }}>
                      {/* Requirement #8: Edit, Reset Password, Activate, Deactivate, Delete Access, Send WhatsApp */}
                      <div style={{ display: 'inline-flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-adm-subaction"
                          onClick={() => handleOpenEditEmployee(emp)}
                          title="Edit Employee Access Profile"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-adm-subaction"
                          onClick={() => handleResetEmployeePassword(emp)}
                          title="Generate New Temporary Password"
                          style={{ color: '#D97706', fontWeight: 600 }}
                        >
                          Reset Password
                        </button>
                        <button
                          type="button"
                          className="btn-adm-subaction"
                          onClick={() => handleToggleEmployeeStatus(emp)}
                          title={portalActive ? 'Deactivate Portal Login' : 'Activate Portal Login'}
                        >
                          {portalActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          className="btn-adm-subaction"
                          onClick={() => handleSendWhatsAppClick(emp)}
                          title="Send Login Details on WhatsApp"
                          style={{ color: '#059669', fontWeight: 600 }}
                        >
                          Send WhatsApp
                        </button>
                        <button
                          type="button"
                          className="btn-adm-subaction"
                          onClick={() => handleInitiateDeleteAccess(emp)}
                          title="Delete Portal Access (Profile Remains)"
                          style={{ color: '#DC2626' }}
                        >
                          Delete Access
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= TAB 2: MANAGEMENT (Requirement #9) ================= */}
      {roleFilter === 'MANAGEMENT' && (
        <div className="adm-table-card">
          <table className="ss-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {managementUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="adm-avatar-circle" style={{ backgroundColor: 'var(--navy-primary)', color: '#FFFFFF' }}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13px' }}>{user.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>Executive Management</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--navy-primary)' }}>
                      {user.username || user.email.split('@')[0]}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', color: '#334155' }}>{user.email}</span>
                  </td>
                  <td>
                    <span className="adm-role-badge management" style={{ fontSize: '11px' }}>
                      {user.role} (CEO / GM)
                    </span>
                  </td>
                  <td>
                    <span className={`ss-badge-operational ${user.status !== 'Active' ? 'inactive' : ''}`} style={{ padding: '3px 8px' }}>
                      <span className={user.status === 'Active' ? 'ss-dot-green' : 'ss-dot-gray'} />
                      {user.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '11.5px', color: '#64748B' }}>{user.lastLogin}</td>
                  <td style={{ textAlign: 'right' }}>
                    {/* Requirement #9: Edit, Change Password, Reset Password, Activate, Deactivate, Delete */}
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn-adm-subaction"
                        onClick={() => handleOpenEditUser(user)}
                        title="Edit User Profile"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-adm-subaction"
                        onClick={() => handleOpenChangePassword(user)}
                        title="Change Password"
                        style={{ color: 'var(--navy-primary)', fontWeight: 600 }}
                      >
                        Change Password
                      </button>
                      <button
                        type="button"
                        className="btn-adm-subaction"
                        onClick={async () => {
                          const res = await sendFirebasePasswordReset(user.email);
                          onShowToast(res.message);
                        }}
                        title="Dispatch Password Reset"
                        style={{ color: '#D97706' }}
                      >
                        Reset Password
                      </button>
                      <button
                        type="button"
                        className="btn-adm-subaction"
                        onClick={() => handleToggleUserStatus(user)}
                        title={user.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                      >
                        {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className="btn-adm-subaction"
                        onClick={() => {
                          setSelectedUser(user);
                          setActiveModal('delete-user');
                        }}
                        title="Delete User"
                        style={{ color: '#DC2626' }}
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
      )}

      {/* ================= TAB 3: SUPER ADMIN ================= */}
      {roleFilter === 'SUPER_ADMIN' && (
        <div className="adm-table-card">
          <table className="ss-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {superAdminUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="adm-avatar-circle" style={{ backgroundColor: 'var(--red-corporate)', color: '#FFFFFF' }}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13px' }}>{user.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>Root System Administrator</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--navy-primary)' }}>
                      {user.username || user.email.split('@')[0]}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', color: '#334155' }}>{user.email}</span>
                  </td>
                  <td>
                    <span className="adm-role-badge super_admin" style={{ fontSize: '11px' }}>
                      SUPER ADMIN
                    </span>
                  </td>
                  <td>
                    <span className="ss-badge-operational" style={{ padding: '3px 8px' }}>
                      <span className="ss-dot-green" />
                      {user.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '11.5px', color: '#64748B' }}>{user.lastLogin}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn-adm-subaction"
                        onClick={() => handleOpenEditUser(user)}
                        title="Edit Super Admin Profile"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-adm-subaction"
                        onClick={() => handleOpenChangePassword(user)}
                        title="Change Password"
                        style={{ color: 'var(--navy-primary)', fontWeight: 600 }}
                      >
                        Change Password
                      </button>
                      <button
                        type="button"
                        className="btn-adm-subaction"
                        onClick={async () => {
                          const res = await sendFirebasePasswordReset(user.email);
                          onShowToast(res.message);
                        }}
                        title="Dispatch Reset Email"
                        style={{ color: '#D97706' }}
                      >
                        Reset Password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= MODAL: ADD USER ================= */}
      {activeModal === 'add' && (
        <div className="ss-modal-overlay" onClick={() => setActiveModal('none')}>
          <div className="ss-modal-window" onClick={e => e.stopPropagation()}>
            <div className="ss-modal-header">
              <h3 className="ss-modal-title">Add Authenticated User</h3>
              <button className="ss-modal-close" onClick={() => setActiveModal('none')}>&times;</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="ss-modal-body">
                <div className="ss-form-group">
                  <label className="ss-form-label">Full Name *</label>
                  <input
                    type="text"
                    className="ss-input"
                    placeholder="e.g. MUHAMMED NASEEH"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div className="adm-grid-2">
                  <div className="ss-form-group">
                    <label className="ss-form-label">Corporate Email *</label>
                    <input
                      type="email"
                      className="ss-input"
                      placeholder="name@alamengaz.com"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="ss-form-group">
                    <label className="ss-form-label">Username / Login ID</label>
                    <input
                      type="text"
                      className="ss-input"
                      placeholder="e.g. AE-1037"
                      value={formUsername}
                      onChange={e => setFormUsername(e.target.value)}
                    />
                  </div>
                </div>
                <div className="adm-grid-2">
                  <div className="ss-form-group">
                    <label className="ss-form-label">Role Tier *</label>
                    <select
                      className="ss-select"
                      value={formRole}
                      onChange={e => setFormRole(e.target.value as any)}
                    >
                      <option value="EMPLOYEE">EMPLOYEE (Employee Portal)</option>
                      <option value="MANAGEMENT">MANAGEMENT (CEO / General Manager)</option>
                      <option value="SUPER_ADMIN">SUPER ADMIN (Full System Control)</option>
                    </select>
                  </div>
                  <div className="ss-form-group">
                    <label className="ss-form-label">Employee ID (if applicable)</label>
                    <input
                      type="text"
                      className="ss-input"
                      placeholder="e.g. AE-1037"
                      value={formEmployeeId}
                      onChange={e => setFormEmployeeId(e.target.value)}
                    />
                  </div>
                </div>
                <div className="adm-grid-2">
                  <div className="ss-form-group">
                    <label className="ss-form-label">WhatsApp / Mobile Number</label>
                    <input
                      type="text"
                      className="ss-input"
                      placeholder="+966 54 69 79 474"
                      value={formWhatsApp}
                      onChange={e => setFormWhatsApp(e.target.value)}
                    />
                  </div>
                  <div className="ss-form-group">
                    <label className="ss-form-label">Department</label>
                    <select
                      className="ss-select"
                      value={formDept}
                      onChange={e => setFormDept(e.target.value)}
                    >
                      <option value="Finance & Accounts">Finance &amp; Accounts</option>
                      <option value="Operations">Operations</option>
                      <option value="Logistics & Port Terminal">Logistics &amp; Port Terminal</option>
                      <option value="Management">Management</option>
                      <option value="IT & Security">IT &amp; Security</option>
                    </select>
                  </div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '6px', marginTop: '6px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy-primary)' }}>Password Security:</div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                    Plaintext passwords are never stored in Firestore. User password is authenticated via Firebase Authentication with first-time forced password change.
                  </div>
                </div>
              </div>
              <div className="ss-modal-footer">
                <button type="button" className="ss-btn-cancel" onClick={() => setActiveModal('none')}>Cancel</button>
                <button type="submit" className="ss-btn-save">Create User Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT USER (Management/SuperAdmin) ================= */}
      {activeModal === 'edit-user' && selectedUser && (
        <div className="ss-modal-overlay" onClick={() => setActiveModal('none')}>
          <div className="ss-modal-window" onClick={e => e.stopPropagation()}>
            <div className="ss-modal-header">
              <h3 className="ss-modal-title">Edit User: {selectedUser.name}</h3>
              <button className="ss-modal-close" onClick={() => setActiveModal('none')}>&times;</button>
            </div>
            <form onSubmit={handleEditUserSubmit}>
              <div className="ss-modal-body">
                <div className="ss-form-group">
                  <label className="ss-form-label">Full Name</label>
                  <input
                    type="text"
                    className="ss-input"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div className="adm-grid-2">
                  <div className="ss-form-group">
                    <label className="ss-form-label">Corporate Email</label>
                    <input
                      type="email"
                      className="ss-input"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="ss-form-group">
                    <label className="ss-form-label">Username / Login ID</label>
                    <input
                      type="text"
                      className="ss-input"
                      value={formUsername}
                      onChange={e => setFormUsername(e.target.value)}
                    />
                  </div>
                </div>
                <div className="adm-grid-2">
                  <div className="ss-form-group">
                    <label className="ss-form-label">Role Tier</label>
                    <select
                      className="ss-select"
                      value={formRole}
                      onChange={e => setFormRole(e.target.value as any)}
                      disabled={selectedUser.email === 'basim@alamengaz.com'}
                    >
                      <option value="SUPER_ADMIN">SUPER ADMIN</option>
                      <option value="MANAGEMENT">MANAGEMENT (CEO / GM)</option>
                      <option value="EMPLOYEE">EMPLOYEE</option>
                    </select>
                  </div>
                  <div className="ss-form-group">
                    <label className="ss-form-label">Account Status</label>
                    <select
                      className="ss-select"
                      value={formStatus}
                      onChange={e => setFormStatus(e.target.value as any)}
                      disabled={selectedUser.email === 'basim@alamengaz.com'}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="ss-modal-footer">
                <button type="button" className="ss-btn-cancel" onClick={() => setActiveModal('none')}>Cancel</button>
                <button type="submit" className="ss-btn-save">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT EMPLOYEE ACCESS ================= */}
      {activeModal === 'edit-employee' && selectedEmployee && (
        <div className="ss-modal-overlay" onClick={() => setActiveModal('none')}>
          <div className="ss-modal-window" onClick={e => e.stopPropagation()}>
            <div className="ss-modal-header">
              <h3 className="ss-modal-title">Edit Employee Access: {selectedEmployee.name}</h3>
              <button className="ss-modal-close" onClick={() => setActiveModal('none')}>&times;</button>
            </div>
            <form onSubmit={handleEditEmployeeSubmit}>
              <div className="ss-modal-body">
                <div className="adm-grid-2">
                  <div className="ss-form-group">
                    <label className="ss-form-label">Employee ID</label>
                    <input
                      type="text"
                      className="ss-input"
                      value={formEmployeeId}
                      readOnly
                      style={{ backgroundColor: '#F1F5F9' }}
                    />
                  </div>
                  <div className="ss-form-group">
                    <label className="ss-form-label">Username / Portal ID *</label>
                    <input
                      type="text"
                      className="ss-input"
                      value={formUsername}
                      onChange={e => setFormUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="adm-grid-2">
                  <div className="ss-form-group">
                    <label className="ss-form-label">Corporate Email</label>
                    <input
                      type="email"
                      className="ss-input"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="ss-form-group">
                    <label className="ss-form-label">WhatsApp Number *</label>
                    <input
                      type="text"
                      className="ss-input"
                      value={formWhatsApp}
                      placeholder="+966 54 69 79 474"
                      onChange={e => setFormWhatsApp(e.target.value)}
                    />
                  </div>
                </div>
                <div className="ss-form-group">
                  <label className="ss-form-label">Account Status</label>
                  <select
                    className="ss-select"
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="ss-modal-footer">
                <button type="button" className="ss-btn-cancel" onClick={() => setActiveModal('none')}>Cancel</button>
                <button type="submit" className="ss-btn-save">Save Access Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CHANGE PASSWORD ================= */}
      {activeModal === 'change-password' && selectedUser && (
        <div className="ss-modal-overlay" onClick={() => setActiveModal('none')}>
          <div className="ss-modal-window" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="ss-modal-header">
              <h3 className="ss-modal-title">Change Password</h3>
              <button className="ss-modal-close" onClick={() => setActiveModal('none')}>&times;</button>
            </div>
            <form onSubmit={handleChangePasswordSubmit}>
              <div className="ss-modal-body">
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '14px' }}>
                  Set a new password for <strong>{selectedUser.name}</strong> ({selectedUser.email}).
                </p>
                {passError && (
                  <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #F87171', color: '#DC2626', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', marginBottom: '12px' }}>
                    {passError}
                  </div>
                )}
                <div className="ss-form-group">
                  <label className="ss-form-label">New Password *</label>
                  <input
                    type="password"
                    className="ss-input"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="ss-form-group">
                  <label className="ss-form-label">Confirm New Password *</label>
                  <input
                    type="password"
                    className="ss-input"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="ss-modal-footer">
                <button type="button" className="ss-btn-cancel" onClick={() => setActiveModal('none')}>Cancel</button>
                <button type="submit" className="ss-btn-save">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: NEW TEMPORARY PASSWORD REVEAL (Requirement #7) ================= */}
      {activeModal === 'temp-password-reveal' && tempPasswordResult && tempPasswordTarget && (
        <div className="ss-modal-overlay" onClick={() => setActiveModal('none')}>
          <div className="ss-modal-window" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="ss-modal-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--red-corporate)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  CREDENTIALS GENERATED
                </span>
                <h3 className="ss-modal-title" style={{ marginTop: '2px' }}>
                  EMPLOYEE LOGIN CREDENTIALS
                </h3>
              </div>
              <button className="ss-modal-close" onClick={() => setActiveModal('none')}>&times;</button>
            </div>
            <div className="ss-modal-body" style={{ textAlign: 'center', padding: '24px 20px' }}>
              <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
                Login password for <strong>{tempPasswordTarget.name}</strong> (Username: <code>{tempPasswordTarget.username}</code>).
                <br />
                <span style={{ color: '#64748B', fontSize: '11.5px' }}>
                  Provide these credentials to the employee for direct portal access.
                </span>
              </p>

              <div style={{
                backgroundColor: '#F8FAFC',
                border: '2px dashed var(--red-corporate)',
                padding: '16px 20px',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  LOGIN PASSWORD
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: 'var(--navy-primary)',
                  letterSpacing: '0.1em',
                  fontFamily: 'monospace',
                  margin: '8px 0'
                }}>
                  {tempPasswordResult}
                </div>
                <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600 }}>
                  ✓ Login password active immediately
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(tempPasswordResult);
                    setCopiedPass(true);
                    setTimeout(() => setCopiedPass(false), 2500);
                  }}
                  className="btn-adm-secondary"
                  style={{
                    padding: '9px 16px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: copiedPass ? '#ECFDF5' : '#FFFFFF',
                    color: copiedPass ? '#059669' : '#334155'
                  }}
                >
                  {copiedPass ? '✓ Copied!' : 'Copy Password'}
                </button>

                {tempPasswordTarget.whatsappNumber && (
                  <button
                    type="button"
                    onClick={() => {
                      openWhatsAppWithCredentials({
                        employeeName: tempPasswordTarget.name,
                        username: tempPasswordTarget.username,
                        tempPassword: tempPasswordResult,
                        whatsappNumber: tempPasswordTarget.whatsappNumber || '',
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
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Send via WhatsApp</span>
                  </button>
                )}
              </div>
            </div>
            <div className="ss-modal-footer">
              <button
                type="button"
                className="btn-adm-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  setTempPasswordResult(null);
                  setActiveModal('none');
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRM RESET BEFORE WHATSAPP (Requirement #14) ================= */}
      {activeModal === 'confirm-reset-whatsapp' && selectedEmployee && (
        <div className="ss-modal-overlay" onClick={() => setActiveModal('none')}>
          <div className="ss-modal-window" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div className="ss-modal-header">
              <h3 className="ss-modal-title">Send Login Details via WhatsApp</h3>
              <button className="ss-modal-close" onClick={() => setActiveModal('none')}>&times;</button>
            </div>
            <div className="ss-modal-body">
              <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.5, marginBottom: '14px' }}>
                To protect employee security, the existing password is encrypted and never stored in plaintext.
              </p>
              <div style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '6px',
                padding: '12px 14px',
                fontSize: '13px',
                color: '#1E40AF',
                marginBottom: '16px'
              }}>
                <strong>Generate a new login password before sending credentials?</strong>
                <div style={{ fontSize: '11.5px', color: '#3B82F6', marginTop: '4px' }}>
                  Target WhatsApp: {selectedEmployee.whatsappNumber || selectedEmployee.phone || 'Not available'}
                </div>
              </div>
            </div>
            <div className="ss-modal-footer">
              <button type="button" className="ss-btn-cancel" onClick={() => setActiveModal('none')}>Cancel</button>
              <button
                type="button"
                className="btn-adm-primary"
                onClick={handleGenerateAndSendWhatsApp}
                style={{ backgroundColor: '#25D366' }}
              >
                Generate &amp; Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRM DELETE PORTAL ACCESS (Requirement #11) ================= */}
      {activeModal === 'confirm-delete-access' && selectedEmployee && (
        <div className="ss-modal-overlay" onClick={() => setActiveModal('none')}>
          <div className="ss-modal-window" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="ss-modal-header">
              <h3 className="ss-modal-title" style={{ color: '#DC2626' }}>
                Delete portal access for {selectedEmployee.name}?
              </h3>
              <button className="ss-modal-close" onClick={() => setActiveModal('none')}>&times;</button>
            </div>
            <div className="ss-modal-body">
              <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.5 }}>
                This will prevent the employee from logging in to the Employee Portal.
              </p>
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', padding: '10px 14px', borderRadius: '6px', marginTop: '12px', fontSize: '12px', color: '#991B1B' }}>
                <strong>Note:</strong> The employee record, signature data, and profile will remain in the employee database.
              </div>
            </div>
            <div className="ss-modal-footer">
              <button type="button" className="ss-btn-cancel" onClick={() => setActiveModal('none')}>Cancel</button>
              <button 
                type="button" 
                style={{ backgroundColor: '#DC2626', color: '#FFFFFF', padding: '8px 18px', borderRadius: '4px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                onClick={handleConfirmDeleteAccess}
              >
                Delete Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE USER (Super Admin / Management) ================= */}
      {activeModal === 'delete-user' && selectedUser && (
        <div className="ss-modal-overlay" onClick={() => setActiveModal('none')}>
          <div className="ss-modal-window" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="ss-modal-header">
              <h3 className="ss-modal-title" style={{ color: '#DC2626' }}>Delete User Account?</h3>
              <button className="ss-modal-close" onClick={() => setActiveModal('none')}>&times;</button>
            </div>
            <div className="ss-modal-body">
              <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete user account <strong>"{selectedUser.name}"</strong> ({selectedUser.email})?
              </p>
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', padding: '10px 14px', borderRadius: '6px', marginTop: '12px', fontSize: '12px', color: '#991B1B' }}>
                This user will lose access to all portals immediately. This action cannot be undone.
              </div>
            </div>
            <div className="ss-modal-footer">
              <button type="button" className="ss-btn-cancel" onClick={() => setActiveModal('none')}>Cancel</button>
              <button 
                type="button" 
                style={{ backgroundColor: '#DC2626', color: '#FFFFFF', padding: '8px 18px', borderRadius: '4px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                onClick={async () => {
                  if (selectedUser.role === 'SUPER_ADMIN' && selectedUser.email === 'basim@alamengaz.com') {
                    alert('The root Super Administrator account is permanent and cannot be deleted.');
                    setActiveModal('none');
                    return;
                  }
                  const filtered = users.filter(u => u.id !== selectedUser.id);
                  await syncUsers(filtered);
                  await logAuditEvent('Basim Aslam', 'SUPER_ADMIN', 'User Deleted', 'Security', selectedUser.name, 'Revoked user account and login permissions.');
                  setActiveModal('none');
                  onShowToast(`✓ User account "${selectedUser.name}" permanently deleted.`);
                }}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
