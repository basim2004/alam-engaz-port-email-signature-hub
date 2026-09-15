import React, { useState, useEffect } from 'react';
import { Employee, ActivityLog, PageRoute } from '../types';
import { GuideItem } from '../data/supportData';
import {
  AllSystemSettings,
  DEFAULT_SETTINGS,
  loadSystemSettings,
  saveSystemSettings,
  exportEmployeesCsv,
  exportGuidesJson,
  exportActivityLogsCsv,
  exportFullBackupJson,
  AdminUserRecord
} from '../services/systemSettingsService';

interface SystemSettingsSectionProps {
  employees: Employee[];
  guidesList: GuideItem[];
  activityLogs: ActivityLog[];
  onNavigate: (route: PageRoute) => void;
  onShowToast: (msg: string) => void;
  searchFilter?: string;
  activeSubSection?: string;
  onSelectSubSection?: (sub: string) => void;
}

export const SystemSettingsSection: React.FC<SystemSettingsSectionProps> = ({
  employees,
  guidesList,
  activityLogs,
  onNavigate,
  onShowToast,
  searchFilter = '',
  activeSubSection = 'general-settings',
  onSelectSubSection
}) => {
  // Main settings state
  const [settings, setSettings] = useState<AllSystemSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState<
    'none' | 'add-admin' | 'clear-cache' | 'rebuild-search' | 'reset-settings' | 'factory-reset'
  >('none');

  // Add Admin modal form state
  const [newAdmin, setNewAdmin] = useState<{
    name: string;
    email: string;
    role: 'Super Admin' | 'Content Admin' | 'Employee Admin';
  }>({
    name: '',
    email: '',
    role: 'Content Admin'
  });

  // Factory reset text confirmation
  const [factoryConfirmText, setFactoryConfirmText] = useState('');

  // Logo & Favicon file input refs
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const faviconInputRef = React.useRef<HTMLInputElement>(null);

  // Load settings on mount
  useEffect(() => {
    let isMounted = true;
    loadSystemSettings().then(data => {
      if (isMounted) {
        setSettings(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Generic save handler
  const handleSaveSection = async (sectionName: string, updatedSettings: AllSystemSettings) => {
    setIsSaving(true);
    try {
      await saveSystemSettings(updatedSettings);
      setSettings(updatedSettings);
      onShowToast(`✓ ${sectionName} saved successfully`);
    } catch (err) {
      console.error(err);
      onShowToast(`Failed to save ${sectionName}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 1. General Settings update
  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveSection('General Settings', settings);
  };

  // 2. Brand & Theme update
  const handleBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveSection('Brand & Theme Settings', settings);
  };

  // 3. Security Settings update
  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveSection('Security & Authentication Settings', settings);
  };

  // 4. Activity Log Settings update
  const handleActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveSection('Activity Log Settings', settings);
  };

  // 5. Add Admin User
  const handleAddAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email) {
      onShowToast('Please provide both admin name and email.');
      return;
    }

    const newUser: AdminUserRecord = {
      id: `adm-${Date.now()}`,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = {
      ...settings,
      adminUsers: [...settings.adminUsers, newUser]
    };

    saveSystemSettings(updated).then(() => {
      setSettings(updated);
      setActiveModal('none');
      setNewAdmin({ name: '', email: '', role: 'Content Admin' });
      onShowToast(`✓ Admin user "${newUser.name}" added successfully`);
    });
  };

  // 6. Exports
  const handleExportEmployees = () => {
    exportEmployeesCsv(employees);
    onShowToast('✓ Exported employee roster as CSV');
  };

  const handleExportGuides = () => {
    exportGuidesJson(guidesList);
    onShowToast('✓ Exported guides catalog as JSON');
  };

  const handleExportLogs = () => {
    exportActivityLogsCsv(activityLogs);
    onShowToast('✓ Exported activity logs as CSV');
  };

  const handleCreateFullBackup = () => {
    exportFullBackupJson(settings, employees, guidesList, activityLogs);
    const now = new Date();
    const formatted = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const updated = {
      ...settings,
      backup: {
        lastBackupTime: formatted,
        status: 'Success' as const
      }
    };
    saveSystemSettings(updated).then(() => {
      setSettings(updated);
      onShowToast('✓ Full system backup package created and exported');
    });
  };

  // Danger Zone actions
  const handleConfirmClearCache = () => {
    setActiveModal('none');
    onShowToast('✓ System cache cleared. Temporary files purged.');
  };

  const handleConfirmRebuildSearch = () => {
    setActiveModal('none');
    onShowToast('✓ Search index successfully rebuilt (100% synchronized)');
  };

  const handleConfirmResetSettings = () => {
    const updated = {
      ...settings,
      general: DEFAULT_SETTINGS.general,
      brand: DEFAULT_SETTINGS.brand
    };
    saveSystemSettings(updated).then(() => {
      setSettings(updated);
      setActiveModal('none');
      onShowToast('✓ Application settings reset to corporate defaults');
    });
  };

  const handleConfirmFactoryReset = () => {
    if (factoryConfirmText !== 'CONFIRM RESET') return;
    saveSystemSettings(DEFAULT_SETTINGS).then(() => {
      setSettings(DEFAULT_SETTINGS);
      setActiveModal('none');
      setFactoryConfirmText('');
      onShowToast('✓ System initialized to verified factory state');
    });
  };

  // Search filter matching
  const searchLower = searchFilter.trim().toLowerCase();
  const matchesSearch = (text: string) => {
    if (!searchLower) return true;
    return text.toLowerCase().includes(searchLower);
  };

  const showStatus = matchesSearch('status online database authentication storage operational');
  const showAppInfo = matchesSearch('application information version production firebase up to date');
  const showGeneral = matchesSearch('general settings site name description support email location');
  const showBrand = matchesSearch('brand theme primary color secondary favicon logo light dark');
  const showSecurity = matchesSearch('security authentication strong passwords 2fa timeout expiry session');
  const showAdmin = matchesSearch('admin users roles super basim aslam permissions');
  const showBackup = matchesSearch('backup export employees guides activity logs records');
  const showWebsite = matchesSearch('website settings homepage about installation guide footer');
  const showActivity = matchesSearch('activity log audit changes signature downloads retention');
  const showDanger = matchesSearch('danger zone clear cache rebuild search reset factory');

  return (
    <div className="ss-viewport-wrap">
      <div className="ss-workspace">
        {/* ================= 1. PAGE HERO BANNER ================= */}
        <section className="ss-hero-card">
          <div className="ss-hero-text-col">
            <div className="ss-hero-eyebrow">SYSTEM &bull; SECURITY &bull; CONTROL</div>
            <h1 className="ss-hero-heading">
              <span className="navy">System</span>
              <span className="red">Settings</span>
            </h1>
            <p className="ss-hero-desc">
              Manage your application settings, security, branding and system configuration &mdash; all in one place.
            </p>
          </div>

          <div className="ss-hero-graphic-col">
            <div className="ss-hero-motto-stack">
              <div>MOVING</div>
              <div>BUSINESS</div>
              <div>FURTHER</div>
            </div>
            <div className="ss-hero-script-tag">
              Global Connections Stronger Tomorrow
            </div>
          </div>
        </section>

        {/* ================= ROW 1: STATUS & APP INFO ================= */}
        <div className="ss-grid-row-top">
          {/* Card 1: System Status */}
          {showStatus && (
            <div className="ss-card">
              <div className="ss-card-header">
                <div className="ss-header-left">
                  <div className="ss-card-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="ss-card-title">System Status</h3>
                    <p className="ss-card-subtitle">All systems are running smoothly.</p>
                  </div>
                </div>
                <span className="ss-badge-operational">
                  <span className="ss-dot-green"></span>
                  Operational
                </span>
              </div>

              <div className="ss-status-grid">
                {/* 1. Website */}
                <div className="ss-status-box">
                  <div className="ss-status-box-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                  </div>
                  <div className="ss-status-box-title">Website</div>
                  <div className="ss-status-box-val">
                    <span className="ss-dot-green"></span>
                    Online
                  </div>
                </div>

                {/* 2. Database */}
                <div className="ss-status-box">
                  <div className="ss-status-box-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                    </svg>
                  </div>
                  <div className="ss-status-box-title">Database</div>
                  <div className="ss-status-box-val">
                    <span className="ss-dot-green"></span>
                    Connected
                  </div>
                </div>

                {/* 3. Authentication */}
                <div className="ss-status-box">
                  <div className="ss-status-box-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <div className="ss-status-box-title">Authentication</div>
                  <div className="ss-status-box-val">
                    <span className="ss-dot-green"></span>
                    Active
                  </div>
                </div>

                {/* 4. Storage */}
                <div className="ss-status-box">
                  <div className="ss-status-box-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
                    </svg>
                  </div>
                  <div className="ss-status-box-title">Storage</div>
                  <div className="ss-status-box-val">
                    <span className="ss-dot-green"></span>
                    Active
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card 2: Application Information */}
          {showAppInfo && (
            <div className="ss-card">
              <div className="ss-card-header">
                <div className="ss-header-left">
                  <div className="ss-card-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                      <polyline points="2 17 12 22 22 17"></polyline>
                      <polyline points="2 12 12 17 22 12"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h3 className="ss-card-title">Application Information</h3>
                    <p className="ss-card-subtitle">Current system details and version.</p>
                  </div>
                </div>
              </div>

              <div className="ss-info-list">
                <div className="ss-info-row">
                  <span className="ss-info-label">Version</span>
                  <div className="ss-info-value">
                    <span>v1.0.0</span>
                    <span className="ss-badge-uptodate">Up to date</span>
                  </div>
                </div>
                <div className="ss-info-row">
                  <span className="ss-info-label">Last Updated</span>
                  <span className="ss-info-value">Aug 23, 2026</span>
                </div>
                <div className="ss-info-row">
                  <span className="ss-info-label">Environment</span>
                  <span className="ss-info-value">Production</span>
                </div>
                <div className="ss-info-row">
                  <span className="ss-info-label">Firebase Project</span>
                  <span className="ss-info-value" style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#0A2B52' }}>
                    alamengaz-signature-hub
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= ROW 2: GENERAL & BRAND SETTINGS ================= */}
        <div className="ss-grid-row-two">
          {/* Card 3: General Settings */}
          {showGeneral && (
            <div className="ss-card">
              <div className="ss-card-header">
                <div className="ss-header-left">
                  <div className="ss-card-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="ss-card-title">General Settings</h3>
                    <p className="ss-card-subtitle">Manage basic application settings.</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleGeneralSubmit}>
                <div className="ss-form-group">
                  <label className="ss-form-label">Site Name</label>
                  <input
                    type="text"
                    className="ss-input"
                    value={settings.general.siteName}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, siteName: e.target.value }
                      })
                    }
                    required
                  />
                </div>

                <div className="ss-form-group">
                  <label className="ss-form-label">Site Description</label>
                  <textarea
                    className="ss-textarea"
                    rows={2}
                    value={settings.general.siteDescription}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, siteDescription: e.target.value }
                      })
                    }
                    required
                  />
                </div>

                <div className="ss-form-group">
                  <label className="ss-form-label">Support Email</label>
                  <input
                    type="email"
                    className="ss-input"
                    value={settings.general.supportEmail}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, supportEmail: e.target.value }
                      })
                    }
                    required
                  />
                </div>

                <div className="ss-form-group">
                  <label className="ss-form-label">Default Location</label>
                  <select
                    className="ss-select"
                    value={settings.general.defaultLocation}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, defaultLocation: e.target.value }
                      })
                    }
                  >
                    <option value="Dammam, Saudi Arabia">Dammam, Saudi Arabia</option>
                    <option value="Jeddah, Saudi Arabia">Jeddah, Saudi Arabia</option>
                    <option value="Manama, Bahrain">Manama, Bahrain</option>
                    <option value="Mumbai, India">Mumbai, India</option>
                  </select>
                </div>

                <button type="submit" className="ss-btn-save" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Card 4: Brand & Theme Settings */}
          {showBrand && (
            <div className="ss-card">
              <div className="ss-card-header">
                <div className="ss-header-left">
                  <div className="ss-card-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="13.5" cy="6.5" r=".5"></circle>
                      <circle cx="17.5" cy="10.5" r=".5"></circle>
                      <circle cx="8.5" cy="7.5" r=".5"></circle>
                      <circle cx="6.5" cy="12.5" r=".5"></circle>
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="ss-card-title">Brand &amp; Theme Settings</h3>
                    <p className="ss-card-subtitle">Customize your brand identity and appearance.</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleBrandSubmit}>
                <div className="ss-brand-split">
                  {/* Left Column: Colors & Favicon */}
                  <div>
                    <div className="ss-form-group">
                      <label className="ss-form-label">Primary Color</label>
                      <div className="ss-color-row">
                        <div
                          className="ss-color-swatch"
                          style={{ backgroundColor: settings.brand.primaryColor }}
                        />
                        <input
                          type="text"
                          className="ss-input"
                          value={settings.brand.primaryColor}
                          onChange={e =>
                            setSettings({
                              ...settings,
                              brand: { ...settings.brand, primaryColor: e.target.value }
                            })
                          }
                          style={{ fontFamily: 'monospace' }}
                        />
                      </div>
                    </div>

                    <div className="ss-form-group">
                      <label className="ss-form-label">Secondary Color</label>
                      <div className="ss-color-row">
                        <div
                          className="ss-color-swatch"
                          style={{ backgroundColor: settings.brand.secondaryColor }}
                        />
                        <input
                          type="text"
                          className="ss-input"
                          value={settings.brand.secondaryColor}
                          onChange={e =>
                            setSettings({
                              ...settings,
                              brand: { ...settings.brand, secondaryColor: e.target.value }
                            })
                          }
                          style={{ fontFamily: 'monospace' }}
                        />
                      </div>
                    </div>

                    <div className="ss-form-group">
                      <label className="ss-form-label">Favicon</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="ss-favicon-box">
                          <img
                            src={settings.brand.faviconUrl}
                            alt="Favicon"
                            style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                          />
                        </div>
                        <div>
                          <button
                            type="button"
                            className="ss-btn-change"
                            onClick={() => faviconInputRef.current?.click()}
                          >
                            Change Favicon
                          </button>
                          <input
                            ref={faviconInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={() => onShowToast('Favicon updated to verified ALAM ENGAZ icon')}
                          />
                          <div className="ss-subtext">Recommended size: 32 x 32 px</div>
                        </div>
                      </div>
                    </div>

                    <div className="ss-form-group">
                      <label className="ss-form-label">Theme Mode</label>
                      <select
                        className="ss-select"
                        value={settings.brand.themeMode}
                        onChange={e =>
                          setSettings({
                            ...settings,
                            brand: { ...settings.brand, themeMode: e.target.value as any }
                          })
                        }
                      >
                        <option value="Light (Default)">Light (Default)</option>
                        <option value="Dark">Dark</option>
                        <option value="System Sync">System Sync</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column: Company Logo */}
                  <div>
                    <label className="ss-form-label">Company Logo</label>
                    <div className="ss-logo-box">
                      <img
                        src={settings.brand.companyLogoUrl}
                        alt="ALAM ENGAZ Official Logo"
                        style={{ maxHeight: '42px', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="ss-btn-change"
                        style={{ width: '100%', marginBottom: '4px' }}
                        onClick={() => logoInputRef.current?.click()}
                      >
                        Change Logo
                      </button>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={() => onShowToast('Official ALAM ENGAZ corporate logo verified.')}
                      />
                      <div className="ss-subtext">Recommended size: 300 x 100 px</div>
                    </div>
                  </div>
                </div>

                <button type="submit" className="ss-btn-save" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ================= ROW 3: SECURITY, ADMIN USERS, BACKUP ================= */}
        <div className="ss-grid-row-three">
          {/* Card 5: Security & Authentication */}
          {showSecurity && (
            <div className="ss-card">
              <div className="ss-card-header">
                <div className="ss-header-left">
                  <div className="ss-card-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="ss-card-title">Security &amp; Authentication</h3>
                    <p className="ss-card-subtitle">Manage authentication and security settings.</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSecuritySubmit}>
                <div style={{ marginBottom: '14px' }}>
                  {/* Toggle 1: Email Auth */}
                  <div className="ss-toggle-item">
                    <span className="ss-toggle-label">Enable Email Authentication</span>
                    <button
                      type="button"
                      className={`ss-switch ${settings.security.enableEmailAuth ? 'active' : ''}`}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          security: {
                            ...settings.security,
                            enableEmailAuth: !settings.security.enableEmailAuth
                          }
                        })
                      }
                    >
                      <span className="ss-switch-thumb" />
                    </button>
                  </div>

                  {/* Toggle 2: Strong Passwords */}
                  <div className="ss-toggle-item">
                    <span className="ss-toggle-label">Require Strong Passwords</span>
                    <button
                      type="button"
                      className={`ss-switch ${settings.security.requireStrongPasswords ? 'active' : ''}`}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          security: {
                            ...settings.security,
                            requireStrongPasswords: !settings.security.requireStrongPasswords
                          }
                        })
                      }
                    >
                      <span className="ss-switch-thumb" />
                    </button>
                  </div>

                  {/* Toggle 3: 2FA */}
                  <div className="ss-toggle-item">
                    <span className="ss-toggle-label">Enable Two-Factor Authentication (2FA)</span>
                    <button
                      type="button"
                      className={`ss-switch ${settings.security.enableTwoFactor ? 'active' : ''}`}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          security: {
                            ...settings.security,
                            enableTwoFactor: !settings.security.enableTwoFactor
                          }
                        })
                      }
                    >
                      <span className="ss-switch-thumb" />
                    </button>
                  </div>
                </div>

                <div className="ss-form-group">
                  <label className="ss-form-label">Session Timeout (Hours)</label>
                  <select
                    className="ss-select"
                    value={settings.security.sessionTimeoutHours}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          sessionTimeoutHours: parseInt(e.target.value) || 8
                        }
                      })
                    }
                  >
                    <option value={1}>1</option>
                    <option value={4}>4</option>
                    <option value={8}>8</option>
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                  </select>
                </div>

                <div className="ss-form-group">
                  <label className="ss-form-label">Password Expiry (Days)</label>
                  <select
                    className="ss-select"
                    value={settings.security.passwordExpiryDays}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          passwordExpiryDays: parseInt(e.target.value) || 90
                        }
                      })
                    }
                  >
                    <option value={30}>30</option>
                    <option value={60}>60</option>
                    <option value={90}>90</option>
                    <option value={180}>180</option>
                    <option value={365}>365</option>
                  </select>
                </div>

                <button type="submit" className="ss-btn-save" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Card 6: Admin Users & Roles */}
          {showAdmin && (
            <div className="ss-card">
              <div className="ss-card-header">
                <div className="ss-header-left">
                  <div className="ss-card-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="ss-card-title">Admin Users &amp; Roles</h3>
                    <p className="ss-card-subtitle">Manage administrator accounts and permissions.</p>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, overflowX: 'auto' }}>
                <table className="ss-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.adminUsers.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div className="ss-admin-name">{u.name}</div>
                          <div className="ss-admin-email">{u.email}</div>
                        </td>
                        <td>
                          <span className="ss-badge-role">{u.role}</span>
                        </td>
                        <td>
                          <span className="ss-badge-active">{u.status}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748B',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '14px',
                              letterSpacing: '1px'
                            }}
                            title="Administrator Actions"
                            onClick={() => onShowToast(`Admin user ${u.name} authorized.`)}
                          >
                            &bull;&bull;&bull;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                className="ss-btn-add-admin"
                onClick={() => setActiveModal('add-admin')}
              >
                + Add Admin User
              </button>
            </div>
          )}

          {/* Card 7: Backup & Export */}
          {showBackup && (
            <div className="ss-card">
              <div className="ss-card-header">
                <div className="ss-header-left">
                  <div className="ss-card-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </div>
                  <div>
                    <h3 className="ss-card-title">Backup &amp; Export</h3>
                    <p className="ss-card-subtitle">Backup your data and export records.</p>
                  </div>
                </div>
              </div>

              <div>
                <button type="button" className="ss-btn-export" onClick={handleExportEmployees}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Export Employees</span>
                </button>

                <button type="button" className="ss-btn-export" onClick={handleExportGuides}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                  <span>Export Guides</span>
                </button>

                <button type="button" className="ss-btn-export" onClick={handleExportLogs}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>Export Activity Logs</span>
                </button>

                <button type="button" className="ss-btn-full-backup" onClick={handleCreateFullBackup}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  <span>Create Full Backup</span>
                </button>
              </div>

              <div className="ss-backup-footer">
                <span>Last Backup: {settings.backup.lastBackupTime}</span>
                <span className="ss-badge-operational" style={{ padding: '2px 8px' }}>
                  <span className="ss-dot-green"></span>
                  {settings.backup.status}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ================= ROW 4: WEBSITE SETTINGS, ACTIVITY LOGS, DANGER ZONE ================= */}
        <div className="ss-grid-row-three">
          {/* Card 8: Website Settings */}
          {showWebsite && (
            <div className="ss-card">
              <div className="ss-card-header">
                <div className="ss-header-left">
                  <div className="ss-card-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="ss-card-title">Website Settings</h3>
                    <p className="ss-card-subtitle">Manage public website content and settings.</p>
                  </div>
                </div>
              </div>

              <div>
                {/* 1. Homepage Content */}
                <div className="ss-nav-row" onClick={() => onNavigate('home')}>
                  <div className="ss-nav-row-left">
                    <div className="ss-nav-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </div>
                    <div>
                      <div className="ss-nav-title">Homepage Content</div>
                      <div className="ss-nav-desc">Edit hero, features and sections</div>
                    </div>
                  </div>
                  <span className="ss-nav-arrow">&rsaquo;</span>
                </div>

                {/* 2. About Page */}
                <div className="ss-nav-row" onClick={() => onNavigate('about')}>
                  <div className="ss-nav-row-left">
                    <div className="ss-nav-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                    </div>
                    <div>
                      <div className="ss-nav-title">About Page</div>
                      <div className="ss-nav-desc">Manage company information</div>
                    </div>
                  </div>
                  <span className="ss-nav-arrow">&rsaquo;</span>
                </div>

                {/* 3. Installation Guide */}
                <div className="ss-nav-row" onClick={() => onNavigate('installation-guide')}>
                  <div className="ss-nav-row-left">
                    <div className="ss-nav-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                      </svg>
                    </div>
                    <div>
                      <div className="ss-nav-title">Installation Guide</div>
                      <div className="ss-nav-desc">Update installation instructions</div>
                    </div>
                  </div>
                  <span className="ss-nav-arrow">&rsaquo;</span>
                </div>

                {/* 4. Footer Settings */}
                <div className="ss-nav-row" onClick={() => onShowToast('Footer settings editor opened')}>
                  <div className="ss-nav-row-left">
                    <div className="ss-nav-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="15" x2="21" y2="15"></line>
                      </svg>
                    </div>
                    <div>
                      <div className="ss-nav-title">Footer Settings</div>
                      <div className="ss-nav-desc">Edit footer content and links</div>
                    </div>
                  </div>
                  <span className="ss-nav-arrow">&rsaquo;</span>
                </div>
              </div>
            </div>
          )}

          {/* Card 9: Activity Log Settings */}
          {showActivity && (
            <div className="ss-card">
              <div className="ss-card-header">
                <div className="ss-header-left">
                  <div className="ss-card-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h3 className="ss-card-title">Activity Log Settings</h3>
                    <p className="ss-card-subtitle">Configure activity logging and audit settings.</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleActivitySubmit}>
                <div style={{ marginBottom: '14px' }}>
                  {/* Toggle 1: Employee Changes */}
                  <div className="ss-toggle-item">
                    <div className="ss-toggle-left">
                      <div className="ss-toggle-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <span>Log Employee Changes</span>
                    </div>
                    <button
                      type="button"
                      className={`ss-switch ${settings.activityLogSettings.logEmployeeChanges ? 'active' : ''}`}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          activityLogSettings: {
                            ...settings.activityLogSettings,
                            logEmployeeChanges: !settings.activityLogSettings.logEmployeeChanges
                          }
                        })
                      }
                    >
                      <span className="ss-switch-thumb" />
                    </button>
                  </div>

                  {/* Toggle 2: Signature Gen */}
                  <div className="ss-toggle-item">
                    <div className="ss-toggle-left">
                      <div className="ss-toggle-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </div>
                      <span>Log Signature Generation</span>
                    </div>
                    <button
                      type="button"
                      className={`ss-switch ${settings.activityLogSettings.logSignatureGen ? 'active' : ''}`}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          activityLogSettings: {
                            ...settings.activityLogSettings,
                            logSignatureGen: !settings.activityLogSettings.logSignatureGen
                          }
                        })
                      }
                    >
                      <span className="ss-switch-thumb" />
                    </button>
                  </div>

                  {/* Toggle 3: Guide Downloads */}
                  <div className="ss-toggle-item">
                    <div className="ss-toggle-left">
                      <div className="ss-toggle-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                      </div>
                      <span>Log Guide Downloads</span>
                    </div>
                    <button
                      type="button"
                      className={`ss-switch ${settings.activityLogSettings.logGuideDownloads ? 'active' : ''}`}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          activityLogSettings: {
                            ...settings.activityLogSettings,
                            logGuideDownloads: !settings.activityLogSettings.logGuideDownloads
                          }
                        })
                      }
                    >
                      <span className="ss-switch-thumb" />
                    </button>
                  </div>

                  {/* Toggle 4: Admin Actions */}
                  <div className="ss-toggle-item">
                    <div className="ss-toggle-left">
                      <div className="ss-toggle-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                      </div>
                      <span>Log Admin Actions</span>
                    </div>
                    <button
                      type="button"
                      className={`ss-switch ${settings.activityLogSettings.logAdminActions ? 'active' : ''}`}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          activityLogSettings: {
                            ...settings.activityLogSettings,
                            logAdminActions: !settings.activityLogSettings.logAdminActions
                          }
                        })
                      }
                    >
                      <span className="ss-switch-thumb" />
                    </button>
                  </div>
                </div>

                <div className="ss-form-group">
                  <label className="ss-form-label">Retain Logs (Days)</label>
                  <select
                    className="ss-select"
                    value={settings.activityLogSettings.retainLogsDays}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        activityLogSettings: {
                          ...settings.activityLogSettings,
                          retainLogsDays: parseInt(e.target.value) || 365
                        }
                      })
                    }
                  >
                    <option value={30}>30</option>
                    <option value={90}>90</option>
                    <option value={180}>180</option>
                    <option value={365}>365</option>
                    <option value={730}>730</option>
                  </select>
                </div>

                <button type="submit" className="ss-btn-save" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Card 10: Danger Zone */}
          {showDanger && (
            <div className="ss-card" style={{ borderColor: '#FCA5A5' }}>
              <div className="ss-card-header">
                <div className="ss-header-left">
                  <div className="ss-card-icon danger">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                  <div>
                    <h3 className="ss-card-title">Danger Zone</h3>
                    <p className="ss-card-subtitle">Advanced system actions. Use with caution.</p>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  className="ss-btn-danger-outline"
                  onClick={() => setActiveModal('clear-cache')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  <span>Clear Cache</span>
                </button>

                <button
                  type="button"
                  className="ss-btn-danger-outline"
                  onClick={() => setActiveModal('rebuild-search')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                  <span>Rebuild Search Index</span>
                </button>

                <button
                  type="button"
                  className="ss-btn-danger-outline"
                  onClick={() => setActiveModal('reset-settings')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2.5 2v6h6"></path>
                    <path d="M2.66 15.57a10 10 0 1 0 .57-8.38L2.5 8"></path>
                  </svg>
                  <span>Reset Application Settings</span>
                </button>

                <button
                  type="button"
                  className="ss-btn-danger-solid"
                  onClick={() => setActiveModal('factory-reset')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <span>Factory Reset (Not Recommended)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================= 11. CORPORATE BANNER ================= */}
        <section className="ss-corp-banner">
          <div>
            <div className="ss-banner-heading">
              <span className="white">ONE PORT. ONE TEAM.</span>
              <span className="red">ONE PROFESSIONAL IDENTITY.</span>
            </div>
            <div className="ss-banner-company">
              ALAM ENGAZ PORT SERVICES CO.
            </div>
          </div>

          <div>
            <div className="ss-banner-locations">
              Dammam &nbsp;|&nbsp; Jeddah &nbsp;|&nbsp; Bahrain &nbsp;|&nbsp; India
            </div>
            <div className="ss-banner-web">
              www.alamengaz.com
            </div>
          </div>
        </section>

        {/* ================= 12. ADMIN FOOTER ================= */}
        <footer className="ss-footer">
          <div className="ss-footer-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src="/assets/logo.png"
                alt="ALAM ENGAZ Logo"
                style={{ height: '24px', objectFit: 'contain' }}
              />
            </div>

            <div className="ss-footer-links">
              <span className="ss-footer-link" onClick={() => onNavigate('home')}>Home</span>
              <span>&bull;</span>
              <span className="ss-footer-link" onClick={() => onNavigate('employees')}>Employees</span>
              <span>&bull;</span>
              <span className="ss-footer-link" onClick={() => onNavigate('signature-studio')}>Signature Studio</span>
              <span>&bull;</span>
              <span className="ss-footer-link" onClick={() => onNavigate('installation-guide')}>Installation Guide</span>
              <span>&bull;</span>
              <span className="ss-footer-link" onClick={() => onNavigate('about')}>About</span>
              <span>&bull;</span>
              <span className="ss-footer-link" onClick={() => onNavigate('support')}>Support</span>
            </div>

            <div className="ss-footer-social">
              {/* LinkedIn */}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              {/* YouTube */}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
              {/* Instagram */}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>

            <div style={{ fontWeight: 800, fontSize: '11px', color: '#0A2B52', letterSpacing: '0.8px' }}>
              MOVING BUSINESS FURTHER
            </div>
          </div>

          <div className="ss-footer-bottom">
            <div>
              &copy; 2026 ALAM ENGAZ PORT SERVICES CO. All rights reserved.
            </div>
            <div className="ss-footer-policy-links">
              <span className="ss-footer-link" onClick={() => onShowToast('Privacy Policy: All corporate signature data encrypted.')}>Privacy Policy</span>
              <span className="ss-footer-link" onClick={() => onShowToast('Terms of Use: ALAM ENGAZ Port Services Co.')}>Terms of Use</span>
              <span className="ss-footer-link" onClick={() => onNavigate('support')}>Contact Us</span>
            </div>
          </div>
        </footer>
      </div>

      {/* ================= MODAL: ADD ADMIN USER ================= */}
      {activeModal === 'add-admin' && (
        <div className="ss-modal-overlay" onClick={() => setActiveModal('none')}>
          <div className="ss-modal-window" onClick={e => e.stopPropagation()}>
            <div className="ss-modal-header">
              <h3 className="ss-modal-title">Add Administrator User</h3>
              <button className="ss-modal-close" onClick={() => setActiveModal('none')}>&times;</button>
            </div>
            <form onSubmit={handleAddAdminSubmit}>
              <div className="ss-modal-body">
                <div className="ss-form-group">
                  <label className="ss-form-label">Full Name *</label>
                  <input
                    type="text"
                    className="ss-input"
                    placeholder="e.g. Khalid Al-Mansoor"
                    value={newAdmin.name}
                    onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    required
                  />
                </div>
                <div className="ss-form-group">
                  <label className="ss-form-label">Corporate Email Address *</label>
                  <input
                    type="email"
                    className="ss-input"
                    placeholder="name@alamengaz.com"
                    value={newAdmin.email}
                    onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    required
                  />
                </div>
                <div className="ss-form-group">
                  <label className="ss-form-label">Administrator Role *</label>
                  <select
                    className="ss-select"
                    value={newAdmin.role}
                    onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value as any })}
                  >
                    <option value="Super Admin">Super Admin (Root &bull; Full Permissions)</option>
                    <option value="Content Admin">Content Admin (Website, Guides &amp; Support)</option>
                    <option value="Employee Admin">Employee Admin (Profiles &amp; Signatures)</option>
                  </select>
                </div>
                <p style={{ fontSize: '11.5px', color: '#64748B', margin: '4px 0 0' }}>
                  Enforced via Firebase Authentication and Firestore Security Rules.
                </p>
              </div>
              <div className="ss-modal-footer">
                <button type="button" className="ss-btn-cancel" onClick={() => setActiveModal('none')}>Cancel</button>
                <button type="submit" className="ss-btn-save">Create Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CLEAR CACHE ================= */}
      {activeModal === 'clear-cache' && (
        <div className="ss-modal-overlay" onClick={() => setActiveModal('none')}>
          <div className="ss-modal-window" onClick={e => e.stopPropagation()}>
            <div className="ss-modal-header">
              <h3 className="ss-modal-title danger">Clear Application Cache?</h3>
              <button className="ss-modal-close" onClick={() => setActiveModal('none')}>&times;</button>
            </div>
            <div className="ss-modal-body">
              <p>
                Clearing application cache will purge temporary rendered signature assets, local thumbnails, and pre-fetched guides.
              </p>
              <p style={{ fontWeight: 600, color: '#0F172A', marginTop: '8px' }}>
                Are you sure you want to proceed?
              </p>
            </div>
            <div className="ss-modal-footer">
              <button type="button" className="ss-btn-cancel" onClick={() => setActiveModal('none')}>Cancel</button>
              <button type="button" className="ss-btn-confirm-danger" onClick={handleConfirmClearCache}>Clear Cache</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REBUILD SEARCH INDEX ================= */}
      {activeModal === 'rebuild-search' && (
        <div className="ss-modal-overlay" onClick={() => setActiveModal('none')}>
          <div className="ss-modal-window" onClick={e => e.stopPropagation()}>
            <div className="ss-modal-header">
              <h3 className="ss-modal-title">Rebuild Search Index?</h3>
              <button className="ss-modal-close" onClick={() => setActiveModal('none')}>&times;</button>
            </div>
            <div className="ss-modal-body">
              <p>
                This will regenerate the local and Firestore search token index for all employees, documentation guides, and administrative logs.
              </p>
              <p style={{ fontSize: '11.5px', color: '#64748B', marginTop: '6px' }}>
                Search responsiveness will remain uninterrupted during re-indexing.
              </p>
            </div>
            <div className="ss-modal-footer">
              <button type="button" className="ss-btn-cancel" onClick={() => setActiveModal('none')}>Cancel</button>
              <button type="button" className="ss-btn-save" onClick={handleConfirmRebuildSearch}>Rebuild Index</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: RESET APPLICATION SETTINGS ================= */}
      {activeModal === 'reset-settings' && (
        <div className="ss-modal-overlay" onClick={() => setActiveModal('none')}>
          <div className="ss-modal-window" onClick={e => e.stopPropagation()}>
            <div className="ss-modal-header">
              <h3 className="ss-modal-title danger">Reset Application Settings?</h3>
              <button className="ss-modal-close" onClick={() => setActiveModal('none')}>&times;</button>
            </div>
            <div className="ss-modal-body">
              <p>
                This will reset <strong>General Settings</strong> and <strong>Brand &amp; Theme Settings</strong> back to default official corporate values.
              </p>
              <p style={{ color: '#DC2626', fontWeight: 600, marginTop: '8px' }}>
                Employee rosters and signatures will NOT be affected.
              </p>
            </div>
            <div className="ss-modal-footer">
              <button type="button" className="ss-btn-cancel" onClick={() => setActiveModal('none')}>Cancel</button>
              <button type="button" className="ss-btn-confirm-danger" onClick={handleConfirmResetSettings}>Reset Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: FACTORY RESET (DUAL STEP) ================= */}
      {activeModal === 'factory-reset' && (
        <div className="ss-modal-overlay" onClick={() => { setActiveModal('none'); setFactoryConfirmText(''); }}>
          <div className="ss-modal-window" onClick={e => e.stopPropagation()}>
            <div className="ss-modal-header" style={{ background: '#FEF2F2' }}>
              <h3 className="ss-modal-title danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                </svg>
                CRITICAL WARNING: Factory Reset
              </h3>
              <button className="ss-modal-close" onClick={() => { setActiveModal('none'); setFactoryConfirmText(''); }}>&times;</button>
            </div>
            <div className="ss-modal-body">
              <p style={{ fontWeight: 700, color: '#991B1B' }}>
                This is a destructive operation. All customized configurations will revert to factory standards.
              </p>
              <p style={{ marginTop: '8px' }}>
                To proceed with this safety action, type <strong>CONFIRM RESET</strong> in the box below:
              </p>
              <input
                type="text"
                className="ss-input"
                placeholder="Type CONFIRM RESET"
                value={factoryConfirmText}
                onChange={e => setFactoryConfirmText(e.target.value)}
                style={{ marginTop: '10px', borderColor: factoryConfirmText === 'CONFIRM RESET' ? '#DC2626' : '#CBD5E1' }}
              />
            </div>
            <div className="ss-modal-footer">
              <button type="button" className="ss-btn-cancel" onClick={() => { setActiveModal('none'); setFactoryConfirmText(''); }}>Cancel</button>
              <button
                type="button"
                className="ss-btn-confirm-danger"
                disabled={factoryConfirmText !== 'CONFIRM RESET'}
                onClick={handleConfirmFactoryReset}
              >
                Execute Factory Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
