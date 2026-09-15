import React, { useState } from 'react';
import { PageRoute, UserRole } from '../types';
import { CENTRAL_ORIGINAL_LOGO, CENTRAL_ORIGINAL_LOGO_ALT } from '../constants/assets';
import { InstallAppButton } from './InstallAppButton';

interface HeaderProps {
  currentRoute: PageRoute;
  onNavigate: (route: PageRoute) => void;
  onOpenLoginModal: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  userRole?: UserRole;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onNavigate,
  onOpenLoginModal,
  searchQuery = '',
  onSearchChange,
  userRole = 'guest',
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigate('employees');
  };

  const getPortalRoute = (): PageRoute => {
    if (userRole === 'admin') return 'admin-panel';
    if (userRole === 'management') return 'management-portal';
    return 'employee-portal';
  };

  const getPortalLabel = (): string => {
    if (userRole === 'admin') return 'Admin Panel';
    if (userRole === 'management') return 'Management Portal';
    return 'Employee Portal';
  };

  const handleNavClick = (route: PageRoute) => {
    setMobileMenuOpen(false);
    onNavigate(route);
  };

  return (
    <header className="site-header">
      <div className="header-container">
        {/* Left: Authentic Original ALAM ENGAZ Logo */}
        <div 
          className="header-logo-wrap" 
          onClick={() => handleNavClick('home')} 
          role="button" 
          tabIndex={0}
          title={CENTRAL_ORIGINAL_LOGO_ALT}
          style={{ cursor: 'pointer' }}
        >
          <img 
            src={CENTRAL_ORIGINAL_LOGO} 
            alt={CENTRAL_ORIGINAL_LOGO_ALT} 
            className="header-logo" 
            style={{ height: '42px', width: 'auto', maxWidth: '220px', objectFit: 'contain', display: 'block' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/logo.png';
            }}
          />
        </div>

        {/* Center: Desktop Public Navigation Links */}
        <nav className="header-nav">
          <button 
            className={`nav-link ${currentRoute === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            Home
          </button>
          <button 
            className={`nav-link ${currentRoute === 'employees' ? 'active' : ''}`}
            onClick={() => handleNavClick('employees')}
          >
            Employees
          </button>
          <button 
            className={`nav-link ${currentRoute === 'signature-studio' ? 'active' : ''}`}
            onClick={() => handleNavClick('signature-studio')}
          >
            Signature Studio
          </button>
          <button 
            className={`nav-link ${currentRoute === 'installation-guide' ? 'active' : ''}`}
            onClick={() => handleNavClick('installation-guide')}
          >
            Installation Guide
          </button>
          <button 
            className={`nav-link ${currentRoute === 'about' ? 'active' : ''}`}
            onClick={() => handleNavClick('about')}
          >
            About
          </button>
          <button 
            className={`nav-link ${currentRoute === 'support' ? 'active' : ''}`}
            onClick={() => handleNavClick('support')}
          >
            Support
          </button>
        </nav>

        {/* Right: Search + Smart Install App + Login CTA + Mobile Hamburger */}
        <div className="header-actions">
          {/* Desktop Search */}
          <form onSubmit={handleSearchSubmit} className="header-search-wrap">
            <span className="header-search-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input 
              type="text" 
              placeholder={currentRoute === 'support' ? "Search guides..." : "Search employee..."} 
              className="header-search-input"
              value={searchQuery}
              onChange={(e) => {
                if (onSearchChange) onSearchChange(e.target.value);
                if (currentRoute !== 'employees' && currentRoute !== 'support') onNavigate('employees');
              }}
              id="header-employee-search-input"
            />
          </form>

          {/* Smart PWA Install Button (Desktop & Tablet) */}
          <InstallAppButton variant="header" className="header-install-desktop" />

          {/* ONE CLEAN CTA: LOGIN (or authorized portal badge if logged in) */}
          {userRole !== 'guest' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="btn-header-filled"
                style={{ backgroundColor: 'var(--navy-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => handleNavClick(getPortalRoute())}
                id="header-my-portal-btn"
              >
                <span>{getPortalLabel()}</span>
              </button>
              {onLogout && (
                <button
                  className="btn-header-outline"
                  onClick={onLogout}
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                  title="Sign Out"
                >
                  Sign Out
                </button>
              )}
            </div>
          ) : (
            <button 
              className="btn-header-filled header-login-btn-desktop"
              style={{ backgroundColor: 'var(--red-corporate)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={onOpenLoginModal}
              id="header-universal-login-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>LOGIN</span>
            </button>
          )}

          {/* Mobile Hamburger Button */}
          <button 
            type="button" 
            className="header-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            id="header-mobile-hamburger"
          >
            {mobileMenuOpen ? (
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
        </div>
      </div>

      {/* Mobile Off-Canvas Drawer & Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="header-mobile-overlay" 
            onClick={() => setMobileMenuOpen(false)} 
            aria-label="Close navigation overlay"
          />
          <div className="header-mobile-drawer open" role="dialog" aria-modal="true">
            <div className="header-mobile-drawer-header">
              <div className="header-mobile-brand">
                <img 
                  src={CENTRAL_ORIGINAL_LOGO} 
                  alt="ALAM ENGAZ" 
                  className="header-mobile-logo" 
                  style={{ height: '38px', width: 'auto', maxWidth: '160px', objectFit: 'contain', display: 'block' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/logo.png';
                  }}
                />
                <div className="header-mobile-brand-meta">
                  <span className="header-mobile-brand-title">ALAM ENGAZ</span>
                  <span className="header-mobile-brand-sub">PORT SERVICES CO.</span>
                </div>
              </div>
              <button 
                type="button" 
                className="header-mobile-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearchSubmit} className="header-mobile-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Search employee or guides..." 
            value={searchQuery}
            onChange={(e) => {
              if (onSearchChange) onSearchChange(e.target.value);
            }}
          />
        </form>

        {/* Mobile Nav Links */}
        <nav className="header-mobile-nav">
          <button 
            className={`header-mobile-link ${currentRoute === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            <span>Home</span>
          </button>
          <button 
            className={`header-mobile-link ${currentRoute === 'employees' ? 'active' : ''}`}
            onClick={() => handleNavClick('employees')}
          >
            <span>Employees</span>
          </button>
          <button 
            className={`header-mobile-link ${currentRoute === 'signature-studio' ? 'active' : ''}`}
            onClick={() => handleNavClick('signature-studio')}
          >
            <span>Signature Studio</span>
          </button>
          <button 
            className={`header-mobile-link ${currentRoute === 'installation-guide' ? 'active' : ''}`}
            onClick={() => handleNavClick('installation-guide')}
          >
            <span>Installation Guide</span>
          </button>
          <button 
            className={`header-mobile-link ${currentRoute === 'about' ? 'active' : ''}`}
            onClick={() => handleNavClick('about')}
          >
            <span>About</span>
          </button>
          <button 
            className={`header-mobile-link ${currentRoute === 'support' ? 'active' : ''}`}
            onClick={() => handleNavClick('support')}
          >
            <span>Support</span>
          </button>
        </nav>

        {/* Mobile Actions Footer: Install App + Login */}
        <div className="header-mobile-footer">
          <InstallAppButton variant="menu" className="header-mobile-install-btn" />

          {userRole === 'guest' ? (
            <button 
              className="btn-header-filled header-mobile-login-btn"
              style={{ backgroundColor: 'var(--red-corporate)', width: '100%', justifyContent: 'center', marginTop: '10px' }}
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLoginModal();
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>SECURE LOGIN</span>
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '10px' }}>
              <button
                className="btn-header-filled"
                style={{ backgroundColor: 'var(--navy-primary)', width: '100%', justifyContent: 'center' }}
                onClick={() => handleNavClick(getPortalRoute())}
              >
                <span>{getPortalLabel()}</span>
              </button>
              {onLogout && (
                <button
                  className="btn-header-outline"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )}
</header>
  );
};
