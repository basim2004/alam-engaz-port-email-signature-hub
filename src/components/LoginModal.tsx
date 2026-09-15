import React, { useState } from 'react';
import { PageRoute, UserRole, ManagementUser, Employee } from '../types';
import { authenticateUser, sendFirebasePasswordReset } from '../services/authService';
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
      // Automatically detect the user's role and route to dashboard:
      // EMPLOYEE -> Employee Portal (/employee)
      // MANAGEMENT -> Management Portal (/management)
      // SUPER ADMIN / ADMIN -> Admin Panel (/admin)
      const resolvedTarget = role === 'admin' 
        ? (targetRoute && (targetRoute === 'admin-panel' || targetRoute === 'admin-signatures-studio') ? targetRoute : 'admin-panel')
        : role === 'management'
        ? (targetRoute && (targetRoute === 'management-portal' || targetRoute === 'management-signatures') ? targetRoute : 'management-portal')
        : (targetRoute && (targetRoute === 'employee-portal' || targetRoute === 'employee-signature-studio') ? targetRoute : 'employee-portal');

      // Direct entry to Employee Portal Dashboard — NO password change prompt
      onLoginSuccess(role, resolvedTarget, result.mgmtUser, result.employee);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unexpected login error occurred.');
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
            style={{ height: '38px', objectFit: 'contain', margin: '0 auto 12px', display: 'block' }} 
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
          />
          <h2 style={{ fontSize: '21px', fontWeight: 800, color: 'var(--navy-primary)', letterSpacing: '-0.02em' }}>
            Secure Corporate Login
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', lineHeight: 1.4 }}>
            Enter your Employee ID, username, or corporate email.
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

        {/* Standard Authentication Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
              Username / Employee ID / Email
            </label>
            <input 
              type="text"
              placeholder="e.g. AE-1037 or username or email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 14px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '4px'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--red-primary, #8B0021)',
                cursor: 'pointer',
                fontWeight: 600,
                textDecoration: 'underline'
              }}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor: 'var(--red-primary, #8B0021)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              marginTop: '6px',
              transition: 'background-color 0.15s ease'
            }}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>
      </div>
    </div>
  );
};
