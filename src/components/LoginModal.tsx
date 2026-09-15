import React, { useState } from 'react';
import { PageRoute, UserRole, ManagementUser, Employee } from '../types';
import { authenticateUser, sendFirebasePasswordReset, changeUserPassword } from '../services/authService';
import { CENTRAL_ORIGINAL_LOGO, CENTRAL_ORIGINAL_LOGO_ALT } from '../constants/assets';

interface LoginModalProps {
  initialPortal?: 'employee' | 'management' | 'admin' | UserRole;
  targetRoute?: PageRoute;
  employees?: Employee[];
  managementUsers?: ManagementUser[];
  onClose: () => void;
  onLoginSuccess: (role: UserRole, targetRoute: PageRoute, mgmtUser?: ManagementUser, employee?: Employee) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  targetRoute,
  employees = [],
  managementUsers = [],
  onClose,
  onLoginSuccess
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // First-time login password change state (Requirement #5)
  const [isMandatoryPasswordChange, setIsMandatoryPasswordChange] = useState(false);
  const [pendingAuthData, setPendingAuthData] = useState<{
    role: UserRole;
    targetRoute: PageRoute;
    employee?: Employee;
    mgmtUser?: ManagementUser;
  } | null>(null);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setIsSubmitting(true);

    try {
      const result = await authenticateUser(identifier, password, rememberMe);

      if (!result.success) {
        setErrorMessage(result.message || 'Authentication failed. Please verify credentials.');
        setIsSubmitting(false);
        return;
      }

      const role = result.role || 'employee';
      // Automatically detect the user's role from the authenticated account:
      // EMPLOYEE -> Employee Portal (/employee)
      // MANAGEMENT / CEO / GENERAL MANAGER -> Management Portal (/management)
      // SUPER ADMIN / ADMIN -> Admin Panel (/admin)
      const resolvedTarget = role === 'admin' 
        ? (targetRoute && (targetRoute === 'admin-panel' || targetRoute === 'admin-signatures-studio') ? targetRoute : 'admin-panel')
        : role === 'management'
        ? (targetRoute && (targetRoute === 'management-portal' || targetRoute === 'management-signatures') ? targetRoute : 'management-portal')
        : (targetRoute && (targetRoute === 'employee-portal' || targetRoute === 'employee-signature-studio') ? targetRoute : 'employee-portal');

      // Check if user requires mandatory first-time password change (Requirement #5)
      if (result.mustChangePassword) {
        setPendingAuthData({
          role,
          targetRoute: resolvedTarget,
          employee: result.employee,
          mgmtUser: result.mgmtUser
        });
        setCurrentPasswordInput(password);
        setIsMandatoryPasswordChange(true);
        setInfoMessage('Welcome to ALAM ENGAZ! Please change your temporary password after your first login.');
        setIsSubmitting(false);
        return;
      }

      onLoginSuccess(role, resolvedTarget, result.mgmtUser, result.employee);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unexpected login error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMandatoryPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!currentPasswordInput) {
      setErrorMessage('Please enter your current temporary password.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changeUserPassword(identifier, currentPasswordInput, newPassword, confirmPassword, pendingAuthData?.role);
      if (res.success) {
        setInfoMessage('Password changed successfully.');
        setTimeout(() => {
          if (pendingAuthData) {
            onLoginSuccess(pendingAuthData.role, pendingAuthData.targetRoute, pendingAuthData.mgmtUser, pendingAuthData.employee);
          }
        }, 900);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!identifier.trim()) {
      setErrorMessage('Please enter your Employee ID, username, or corporate email first.');
      return;
    }
    setErrorMessage(null);
    try {
      const targetEmail = identifier.includes('@') ? identifier : `${identifier}@alamengaz.com`;
      const res = await sendFirebasePasswordReset(targetEmail);
      setInfoMessage(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch password reset link.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(11, 42, 85, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        maxWidth: '460px',
        width: '100%',
        padding: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '20px',
            fontSize: '20px',
            color: '#94A3B8',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px'
          }}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <img 
            src={CENTRAL_ORIGINAL_LOGO} 
            alt={CENTRAL_ORIGINAL_LOGO_ALT} 
            style={{ height: '38px', objectFit: 'contain', margin: '0 auto 12px' }} 
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/logo.png';
            }}
          />
          <h2 style={{ fontSize: '21px', fontWeight: 800, color: 'var(--navy-primary)', letterSpacing: '-0.02em' }}>
            {isMandatoryPasswordChange ? 'CHANGE YOUR PASSWORD' : 'Secure Corporate Login'}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', lineHeight: 1.4 }}>
            {isMandatoryPasswordChange 
              ? 'Please change your temporary password after your first login to secure your account.' 
              : 'Enter your Employee ID, username, or corporate email.'}
          </p>
        </div>

        {/* Feedback alerts */}
        {errorMessage && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#B91C1C',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}
        {infoMessage && (
          <div style={{
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#065F46',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>✓</span>
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Mandatory First-Time Password Change Form (Requirement #5) */}
        {isMandatoryPasswordChange ? (
          <form onSubmit={handleMandatoryPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Current Password
              </label>
              <input 
                type="password"
                placeholder="Enter current temporary password"
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                New Password
              </label>
              <input 
                type="password"
                placeholder="Enter at least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Confirm New Password
              </label>
              <input 
                type="password"
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-hero-primary"
              style={{
                width: '100%',
                backgroundColor: 'var(--red-corporate)',
                padding: '12px',
                marginTop: '6px',
                fontWeight: 700,
                letterSpacing: '0.02em'
              }}
            >
              {isSubmitting ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        ) : (
          /* Standard Single Secure Login Form */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Username / Employee ID / Email
              </label>
              <input 
                type="text" 
                placeholder=""
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
                id="login-modal-identifier"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px',
                  outlineColor: 'var(--red-corporate)'
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '12px', cursor: 'pointer' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                id="login-modal-password"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px',
                  outlineColor: 'var(--red-corporate)'
                }}
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-2px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#475569', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--red-corporate)' }}
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--red-corporate)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Submit CTA */}
            <button 
              type="submit"
              disabled={isSubmitting}
              className="btn-hero-primary"
              id="login-modal-submit-btn"
              style={{
                width: '100%',
                backgroundColor: 'var(--red-corporate)',
                padding: '12px',
                fontSize: '14.5px',
                fontWeight: 800,
                letterSpacing: '0.03em',
                marginTop: '4px'
              }}
            >
              {isSubmitting ? 'Authenticating...' : 'LOGIN'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
