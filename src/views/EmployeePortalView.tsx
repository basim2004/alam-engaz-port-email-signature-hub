import React, { useState, useRef, useEffect } from 'react';
import { Employee, PageRoute } from '../types';
import { OfficialSignature } from '../components/OfficialSignature';
import { EmployeeAvatar } from '../components/EmployeeAvatar';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { CENTRAL_ORIGINAL_LOGO } from '../constants/assets';
import {
  generateOfficialSignatureHtml,
  copySignatureRichText,
  downloadSignatureHtml,
  DEFAULT_CUSTOMIZATION,
  SignatureCustomization
} from '../utils/signatureHtmlGenerator';
import { changeUserPassword, sendFirebasePasswordReset } from '../services/authService';
import { 
  deleteSignatureRecord, 
  saveSignatureRecord, 
  getCustomSignatureRecord 
} from '../services/signatureStorageService';

// ─── Types ────────────────────────────────────────────────────────────────────
type EPTab =
  | 'dashboard'
  | 'my-profile'
  | 'my-signature'
  | 'signature-studio'
  | 'gmail-demo'
  | 'installation-guide'
  | 'support';

interface EmployeePortalViewProps {
  currentEmployee: Employee;
  initialTab?: EPTab;
  onDeleteSignature?: (empId: string, performedBy?: string, role?: string) => Promise<any>;
  onLogout: () => void;
  onNavigate: (route: PageRoute) => void;
}

// ─── Nav Items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS: { id: EPTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'dashboard', label: 'Dashboard',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  },
  {
    id: 'my-profile', label: 'My Profile',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  },
  {
    id: 'my-signature', label: 'My Signature',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
  },
  {
    id: 'signature-studio', label: 'Signature Studio',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
  },
  {
    id: 'gmail-demo', label: 'Gmail Demo',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
  },
  {
    id: 'installation-guide', label: 'Installation Guide',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  },
  {
    id: 'support', label: 'Support',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  }
];

// ─── Main Component ────────────────────────────────────────────────────────────
export const EmployeePortalView: React.FC<EmployeePortalViewProps> = ({
  currentEmployee,
  initialTab,
  onDeleteSignature,
  onLogout,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<EPTab>(initialTab || 'dashboard');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropOpen, setProfileDropOpen] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'html'>('idle');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPhone, setEditPhone] = useState(currentEmployee.phone);
  const [editSaved, setEditSaved] = useState(false);
  const [gmailTab, setGmailTab] = useState<'gmail' | 'outlook'>('gmail');
  const [gmailTo, setGmailTo] = useState('');
  const [gmailSubject, setGmailSubject] = useState('');
  const [gmailMsg, setGmailMsg] = useState('');
  const [gmailSent, setGmailSent] = useState(false);
  const [studioCustom, setStudioCustom] = useState<SignatureCustomization>(DEFAULT_CUSTOMIZATION);
  const [deleteSignatureModalOpen, setDeleteSignatureModalOpen] = useState(false);
  const [studioSavedNotice, setStudioSavedNotice] = useState<string | null>(null);

  // Load custom signature on mount & when currentEmployee changes
  useEffect(() => {
    if (currentEmployee.id) {
      const saved = getCustomSignatureRecord(currentEmployee.id);
      if (saved) {
        setStudioCustom(saved);
      } else {
        setStudioCustom(DEFAULT_CUSTOMIZATION);
      }
      setEditPhone(currentEmployee.phone);
    }
  }, [currentEmployee.id, currentEmployee.phone]);

  // Requirement #3: Save Signature in Employee Portal
  const handleSaveSignature = async () => {
    const res = await saveSignatureRecord(
      currentEmployee.id,
      currentEmployee.name,
      studioCustom,
      currentEmployee.name,
      'employee'
    );
    if (res.success) {
      setStudioSavedNotice('Signature saved successfully.');
    } else {
      setStudioSavedNotice(res.message || 'Failed to save signature.');
    }
    setTimeout(() => setStudioSavedNotice(null), 3500);
  };

  // Requirement #14: Controlled Delete Signature (Employee can reset ONLY own signature)
  const handleDeleteOwnSignature = async () => {
    if (onDeleteSignature) {
      await onDeleteSignature(currentEmployee.id, currentEmployee.name, 'employee');
    } else {
      await deleteSignatureRecord(currentEmployee.id, currentEmployee.name, currentEmployee.name, 'employee', currentEmployee.id);
    }
    setStudioCustom(DEFAULT_CUSTOMIZATION);
    setDeleteSignatureModalOpen(false);
    setStudioSavedNotice('✓ Saved signature deleted. Master template restored.');
    setTimeout(() => setStudioSavedNotice(null), 3500);
  };

  const [currentEmpPass, setCurrentEmpPass] = useState('');
  const [newEmpPass, setNewEmpPass] = useState('');
  const [confirmEmpPass, setConfirmEmpPass] = useState('');
  const [passFeedback, setPassFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  // Stats (Firebase-ready: replace with Firestore snapshots)
  const [stats] = useState({ copies: 0, htmlDownloads: 0, pngDownloads: 0, views: 0 });

  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setProfileDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/assets/logo.png` : '/assets/logo.png';
  const companyName = currentEmployee.companyName || 'ALAM ENGAZ PORT SERVICES CO.';
  const plainText = `Best Regards,\n\n${currentEmployee.name}\n${currentEmployee.jobTitle}\nT: ${currentEmployee.phone} | E: ${currentEmployee.email} | W: ${currentEmployee.website}\nA company, incorporated/registered under the Laws of SAUDI ARABIA, having its registered office at King Abdul Aziz Road, Near Dammam Sea Port, P.O. Box 2791, Dammam 32213, Eastern Province, Kingdom of Saudi Arabia.\n${currentEmployee.locations}\n${companyName}`;
  const rawHtml = generateOfficialSignatureHtml(currentEmployee, logoUrl, DEFAULT_CUSTOMIZATION);

  const handleCopySignature = async () => {
    const ok = await copySignatureRichText(rawHtml, plainText);
    if (ok) {
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 3500);
    }
  };

  const handleDownloadHtml = () => {
    downloadSignatureHtml(currentEmployee, rawHtml);
  };

  const handleDownloadAsImage = () => {
    // Open HTML file in new window for print-to-image
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Email Signature — ${currentEmployee.name}</title><style>body{margin:40px;font-family:'Segoe UI',sans-serif;background:#fff;}</style></head><body>${rawHtml}<p style="margin-top:20px;font-size:11px;color:#999;">Use File → Print → Save as PDF / Screenshot to export as image.</p></body></html>`);
      win.document.close();
    }
  };

  const handleGmailSend = () => {
    setGmailSent(true);
    setTimeout(() => setGmailSent(false), 3000);
  };

  const handleEmployeePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassFeedback(null);
    if (newEmpPass !== confirmEmpPass) {
      setPassFeedback({ text: 'New password and confirmation do not match.', isError: true });
      return;
    }
    if (newEmpPass.length < 6) {
      setPassFeedback({ text: 'Password must be at least 6 characters long.', isError: true });
      return;
    }
    try {
      const res = await changeUserPassword(currentEmpPass, newEmpPass);
      if (res.success) {
        setPassFeedback({ text: '✓ Password changed successfully.', isError: false });
        setCurrentEmpPass('');
        setNewEmpPass('');
        setConfirmEmpPass('');
      } else {
        setPassFeedback({ text: res.message, isError: true });
      }
    } catch (err: any) {
      setPassFeedback({ text: err.message || 'Error updating password', isError: true });
    }
  };

  const handleEmployeeForgotPassword = async () => {
    try {
      const res = await sendFirebasePasswordReset(currentEmployee.email);
      alert(res.message);
    } catch (err: any) {
      alert(err.message || 'Error sending password reset email');
    }
  };


  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="ep-layout">
      {/* ── SIDEBAR ── */}
      <aside className={`ep-sidebar ${sidebarOpen ? 'ep-sidebar-open' : ''}`}>
        {/* Sidebar Brand */}
        <div className="ep-sidebar-brand">
          <img src="/assets/logo.png" alt="ALAM ENGAZ" className="ep-sidebar-logo" />
          <div className="ep-sidebar-brand-text">
            <span className="ep-brand-name">ALAM ENGAZ</span>
            <span className="ep-brand-portal">EMPLOYEE PORTAL</span>
            <span className="ep-brand-sub">My Signature</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="ep-sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`ep-nav-item ${activeTab === item.id ? 'ep-nav-active' : ''}`}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            >
              <span className="ep-nav-icon">{item.icon}</span>
              <span className="ep-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Bottom */}
        <div className="ep-sidebar-bottom">
          <div className="ep-sidebar-port-img" style={{ backgroundImage: 'url(/assets/container-terminal.jpg)' }} />
          <div className="ep-sidebar-motto">
            <span>Global Connections</span>
            <span>Stronger Tomorrow</span>
          </div>
        </div>
      </aside>

      {/* ── SIDEBAR OVERLAY (mobile) ── */}
      {sidebarOpen && <div className="ep-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── RIGHT PANEL ── */}
      <div className="ep-right-panel">

        {/* ── TOP HEADER ── */}
        <header className="ep-header">
          {/* Hamburger */}
          <button className="ep-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Logo */}
          <div className="ep-header-logo-wrap">
            <img src="/assets/logo.png" alt="ALAM ENGAZ PORT SERVICES CO." className="ep-header-logo" />
          </div>

          {/* Center Tagline */}
          <div className="ep-header-center">
            <span className="ep-header-tagline">MOVING BUSINESS FURTHER</span>
            <span className="ep-header-locations">Dammam &nbsp;|&nbsp; Jeddah &nbsp;|&nbsp; Bahrain &nbsp;|&nbsp; India</span>
          </div>

          {/* Right Actions */}
          <div className="ep-header-right">
            {/* Notification Bell */}
            <button className="ep-notif-btn" title="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="ep-notif-dot" />
            </button>

            {/* Profile Dropdown */}
            <div className="ep-profile-wrap" ref={dropRef}>
              <button className="ep-profile-trigger" onClick={() => setProfileDropOpen(!profileDropOpen)}>
                <EmployeeAvatar name={currentEmployee.name} photoUrl={currentEmployee.photoUrl} size={32} />
                <div className="ep-profile-info">
                  <span className="ep-profile-name">{currentEmployee.name.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}</span>
                  <span className="ep-profile-role">{currentEmployee.jobTitle}</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94A3B8', flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {profileDropOpen && (
                <div className="ep-profile-dropdown">
                  <button className="ep-dropdown-item" onClick={() => { setActiveTab('my-profile'); setProfileDropOpen(false); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    My Profile
                  </button>
                  <button className="ep-dropdown-item" onClick={() => { setActiveTab('my-signature'); setProfileDropOpen(false); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    My Signature
                  </button>
                  <div className="ep-dropdown-divider" />
                  <button className="ep-dropdown-item ep-dropdown-logout" onClick={onLogout}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className="ep-main">

          {/* ═══════════════ DASHBOARD TAB ═══════════════ */}
          {activeTab === 'dashboard' && (
            <div className="ep-content ep-fade-in">

              {/* HERO */}
              <section className="ep-hero" style={{ backgroundImage: 'url(/assets/hero-ship.jpg)' }}>
                <div className="ep-hero-overlay" />
                <div className="ep-hero-content">
                  <p className="ep-hero-greeting">Welcome Back,</p>
                  <h1 className="ep-hero-name">{currentEmployee.name.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}</h1>
                  <p className="ep-hero-sub">Your official email signature<br />is ready to use.</p>
                  <div className="ep-hero-line" />
                </div>
                <div className="ep-hero-badge-group">
                  <div className="ep-hero-badge">GLOBAL<br />PEOPLE</div>
                  <div className="ep-hero-badge">GLOBAL<br />OPPORTUNITIES</div>
                </div>
              </section>

              {/* STATS */}
              <section className="ep-stats-grid">
                {[
                  { label: 'Signature Copies', value: stats.copies, color: '#8B0021', bg: '#FFF1F3', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> },
                  { label: 'HTML Downloads', value: stats.htmlDownloads, color: '#0B2A55', bg: '#EFF6FF', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> },
                  { label: 'PNG Downloads', value: stats.pngDownloads, color: '#92400E', bg: '#FFFBEB', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
                  { label: 'Signature Views', value: stats.views, color: '#065F46', bg: '#ECFDF5', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> }
                ].map(stat => (
                  <div key={stat.label} className="ep-stat-card">
                    <div className="ep-stat-icon" style={{ backgroundColor: stat.bg, color: stat.color }}>
                      {stat.icon}
                    </div>
                    <div className="ep-stat-body">
                      <div className="ep-stat-value" style={{ color: stat.color }}>{stat.value}</div>
                      <div className="ep-stat-label">{stat.label}</div>
                      <div className="ep-stat-activity">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        No activity yet
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              {/* SIGNATURE SECTION */}
              <section className="ep-sig-section">
                <div className="ep-sig-header">
                  <div className="ep-sig-title-row">
                    <h2 className="ep-sig-title">My Official Email Signature</h2>
                    <span className="ep-sig-badge-active">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ACTIVE
                    </span>
                  </div>
                  <div className="ep-sig-meta">
                    <span className="ep-sig-updated">Last Updated: 12 Sep 2026</span>
                    <button className="ep-sig-more" title="More options">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                    </button>
                  </div>
                </div>

                {/* Copy success toast */}
                {copyState === 'copied' && (
                  <div className="ep-toast ep-toast-green">
                    ✓ Signature copied! Press <strong>Ctrl+V</strong> (or <strong>Cmd+V</strong>) to paste in Gmail, Outlook, or Apple Mail.
                  </div>
                )}

                {/* THE OFFICIAL SIGNATURE — unchanged master structure */}
                <div className="ep-sig-preview-wrap">
                  <OfficialSignature employee={currentEmployee} showActions={false} />
                </div>

                {/* Action Bar */}
                <div className="ep-action-bar">
                  <button className="ep-btn-action ep-btn-red" onClick={handleCopySignature} id="ep-copy-sig-btn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copy Signature
                  </button>
                  <button className="ep-btn-action ep-btn-outline" onClick={handleDownloadHtml} id="ep-dl-html-btn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download HTML
                  </button>
                  <button className="ep-btn-action ep-btn-outline" onClick={handleDownloadAsImage} id="ep-dl-img-btn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    Download as Image
                  </button>
                  <button className="ep-btn-action ep-btn-outline" onClick={() => setActiveTab('signature-studio')} id="ep-open-studio-btn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
                    Open in Studio
                  </button>
                </div>
              </section>

              {/* QUICK ACTIONS + MY PROFILE — side by side */}
              <div className="ep-two-col-grid">

                {/* Quick Actions */}
                <div className="ep-card">
                  <h3 className="ep-card-title">Quick Actions</h3>
                  {[
                    { label: 'Edit My Details', sub: 'Update your personal information.', tab: 'my-profile' as EPTab, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                    { label: 'Customize Signature', sub: 'Adjust text details. Structure locked.', tab: 'signature-studio' as EPTab, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg> },
                    { label: 'Test in Gmail', sub: 'See how your signature looks.', tab: 'gmail-demo' as EPTab, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
                    { label: 'Installation Guide', sub: 'Step-by-step setup for all platforms.', tab: 'installation-guide' as EPTab, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> }
                  ].map(action => (
                    <button key={action.label} className="ep-quick-action-row" onClick={() => setActiveTab(action.tab)}>
                      <div className="ep-qa-icon">{action.icon}</div>
                      <div className="ep-qa-text">
                        <span className="ep-qa-label">{action.label}</span>
                        <span className="ep-qa-sub">{action.sub}</span>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ep-qa-arrow"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  ))}
                </div>

                {/* My Profile Card */}
                <div className="ep-card">
                  <div className="ep-card-title-row">
                    <h3 className="ep-card-title">My Profile</h3>
                    <button className="ep-card-edit-link" onClick={() => { setActiveTab('my-profile'); setShowEditModal(true); }}>Edit</button>
                  </div>
                  <div className="ep-profile-mini">
                    <div className="ep-profile-mini-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
                      <img src="/assets/logo.png" onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }} alt="ALAM ENGAZ" style={{ width: '26px', height: 'auto', objectFit: 'contain' }} />
                    </div>
                    <div className="ep-profile-mini-info">
                      <div className="ep-profile-mini-name">{currentEmployee.name.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}</div>
                      <div className="ep-profile-mini-role">{currentEmployee.jobTitle}</div>
                    </div>
                  </div>
                  <div className="ep-profile-detail-list">
                    {[
                      { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, value: currentEmployee.email },
                      { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.59 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.79a16 16 0 0 0 6.29 6.29l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>, value: currentEmployee.phone },
                      { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, value: 'Dammam, Saudi Arabia' },
                      { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>, value: `Employee ID: ${currentEmployee.id}` },
                      { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, value: 'Joining Date: 15 Mar 2024' }
                    ].map((row, i) => (
                      <div key={i} className="ep-profile-detail-row">
                        <span className="ep-pd-icon">{row.icon}</span>
                        <span className="ep-pd-value">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* HELP & RESOURCES + SUPPORT */}
              <div className="ep-two-col-grid">

                {/* Help & Resources */}
                <div className="ep-card">
                  <div className="ep-card-title-row">
                    <h3 className="ep-card-title">Help &amp; Resources</h3>
                    <button className="ep-card-edit-link" onClick={() => setActiveTab('installation-guide')}>View All</button>
                  </div>
                  <div className="ep-help-cards">
                    {[
                      { label: 'Gmail Guide', sub: 'PDF', color: '#EA4335', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
                      { label: 'Outlook Guide', sub: 'PDF', color: '#0078D4', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/></svg> },
                      { label: 'Mobile Guide', sub: 'PDF', color: '#374151', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> },
                      { label: 'Troubleshooting', sub: 'PDF', color: '#8B0021', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg> }
                    ].map(h => (
                      <button key={h.label} className="ep-help-card" onClick={() => setActiveTab('installation-guide')}>
                        <div className="ep-help-icon" style={{ color: h.color }}>{h.icon}</div>
                        <div className="ep-help-label">{h.label}</div>
                        <div className="ep-help-sub">{h.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Support Card */}
                <div className="ep-card ep-support-card">
                  <div className="ep-support-head">
                    <div className="ep-support-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div>
                      <div className="ep-support-title">Need Help?</div>
                      <div className="ep-support-sub">Our support team is here to assist you.</div>
                    </div>
                  </div>
                  <div className="ep-support-info-list">
                    <div className="ep-support-info-row">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B0021" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <div>
                        <div className="ep-support-info-label">Email Support</div>
                        <div className="ep-support-info-val">it@alamengaz.com</div>
                      </div>
                    </div>
                    <div className="ep-support-info-row">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B0021" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <div>
                        <div className="ep-support-info-label">Support Hours</div>
                        <div className="ep-support-info-val">Sunday – Thursday<br />9:00 AM – 6:00 PM (KSA Time)</div>
                      </div>
                    </div>
                  </div>
                  <a href="mailto:it@alamengaz.com" className="ep-support-btn">
                    Contact Support &rarr;
                  </a>
                </div>
              </div>

              {/* PORTAL FOOTER */}
              <PortalFooter />
            </div>
          )}

          {/* ═══════════════ MY PROFILE TAB ═══════════════ */}
          {activeTab === 'my-profile' && (
            <div className="ep-content ep-fade-in">
              <div className="ep-page-header">
                <div>
                  <h2 className="ep-page-title">My Profile</h2>
                  <p className="ep-page-sub">Employee ID: {currentEmployee.id} &nbsp;·&nbsp; <span style={{ color: '#059669', fontWeight: 600 }}>Active</span></p>
                </div>
                <button className="ep-btn-action ep-btn-red" onClick={() => setShowEditModal(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  Edit Profile
                </button>
              </div>

              <div className="ep-profile-full-card">
                <div className="ep-profile-full-top" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <EmployeeAvatar name={currentEmployee.name} photoUrl={currentEmployee.photoUrl} size={64} />
                  <div>
                    <div className="ep-profile-full-name">{currentEmployee.name.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}</div>
                    <div className="ep-profile-full-role">{currentEmployee.jobTitle}</div>
                    <span className="ep-profile-full-badge">Active</span>
                  </div>
                </div>

                <div className="ep-profile-fields-grid">
                  {[
                    { label: 'Full Name', value: currentEmployee.name, locked: true },
                    { label: 'Designation', value: currentEmployee.jobTitle, locked: true },
                    { label: 'Department', value: currentEmployee.department, locked: true },
                    { label: 'Official Email', value: currentEmployee.email, locked: true },
                    { label: 'Direct Contact', value: editPhone, locked: false },
                    { label: 'Office', value: currentEmployee.office, locked: true },
                    { label: 'Locations', value: currentEmployee.locations, locked: true },
                    { label: 'Website', value: currentEmployee.website, locked: true },
                    { label: 'Employee ID', value: currentEmployee.id, locked: true },
                    { label: 'Joining Date', value: '15 Mar 2024', locked: true }
                  ].map(field => (
                    <div key={field.label} className="ep-profile-field">
                      <div className="ep-profile-field-label">
                        {field.label}
                        {field.locked && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        )}
                      </div>
                      <div className={`ep-profile-field-value ${field.locked ? 'ep-field-locked' : 'ep-field-editable'}`}>
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="ep-profile-lock-note">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Company-controlled fields (name, email, designation, department) can only be changed by HR / IT Administration. Contact <strong>it@alamengaz.com</strong> to request updates.
                </div>
              </div>

              {/* Profile Security & Password Card */}
              <div className="ep-card" style={{ marginTop: 24, maxWidth: 640 }}>
                <div className="ep-card-title-row">
                  <h3 className="ep-card-title">Security & Password</h3>
                </div>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: 16 }}>
                  Update your employee account password. Passwords must be at least 6 characters.
                </p>

                {passFeedback && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 6,
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: 16,
                    backgroundColor: passFeedback.isError ? '#FEF2F2' : '#F0FDF4',
                    color: passFeedback.isError ? '#DC2626' : '#16A34A',
                    border: `1px solid ${passFeedback.isError ? '#FECACA' : '#BBF7D0'}`
                  }}>
                    {passFeedback.text}
                  </div>
                )}

                <form onSubmit={handleEmployeePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: 6 }}>Current Password</label>
                    <input
                      type="password"
                      className="ep-form-input"
                      value={currentEmpPass}
                      onChange={e => setCurrentEmpPass(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: 6 }}>New Password</label>
                    <input
                      type="password"
                      className="ep-form-input"
                      value={newEmpPass}
                      onChange={e => setNewEmpPass(e.target.value)}
                      placeholder="Enter new strong password"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: 6 }}>Confirm New Password</label>
                    <input
                      type="password"
                      className="ep-form-input"
                      value={confirmEmpPass}
                      onChange={e => setConfirmEmpPass(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    <button type="submit" className="ep-btn-action ep-btn-red">
                      Change Password
                    </button>
                    <button
                      type="button"
                      onClick={handleEmployeeForgotPassword}
                      style={{ background: 'none', border: 'none', color: '#8B0021', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </form>
              </div>

              {/* Edit Modal */}
              {showEditModal && (
                <div className="ep-modal-overlay" onClick={() => setShowEditModal(false)}>
                  <div className="ep-modal" onClick={e => e.stopPropagation()}>
                    <div className="ep-modal-header">
                      <h3 className="ep-modal-title">Edit My Details</h3>
                      <button className="ep-modal-close" onClick={() => setShowEditModal(false)}>✕</button>
                    </div>
                    <div className="ep-modal-body">
                      <p className="ep-modal-note">Only your personal contact details can be edited. Company-controlled information remains locked.</p>
                      <div className="ep-form-group">
                        <label className="ep-form-label">Direct Contact Number</label>
                        <input
                          type="tel"
                          className="ep-form-input"
                          value={editPhone}
                          onChange={e => setEditPhone(e.target.value)}
                          placeholder="+966 XX XX XX XXX"
                        />
                      </div>
                      <div className="ep-form-group">
                        <label className="ep-form-label" style={{ opacity: 0.5 }}>Full Name (Locked)</label>
                        <input type="text" className="ep-form-input ep-input-locked" value={currentEmployee.name} readOnly />
                      </div>
                      <div className="ep-form-group">
                        <label className="ep-form-label" style={{ opacity: 0.5 }}>Designation (Locked)</label>
                        <input type="text" className="ep-form-input ep-input-locked" value={currentEmployee.jobTitle} readOnly />
                      </div>
                      <div className="ep-form-group">
                        <label className="ep-form-label" style={{ opacity: 0.5 }}>Official Email (Locked)</label>
                        <input type="text" className="ep-form-input ep-input-locked" value={currentEmployee.email} readOnly />
                      </div>

                      {editSaved && (
                        <div className="ep-toast ep-toast-green" style={{ marginTop: 12 }}>✓ Changes saved successfully!</div>
                      )}
                    </div>
                    <div className="ep-modal-footer">
                      <button className="ep-btn-action ep-btn-outline" onClick={() => setShowEditModal(false)}>Cancel</button>
                      <button className="ep-btn-action ep-btn-red" onClick={() => {
                        setEditSaved(true);
                        setTimeout(() => { setEditSaved(false); setShowEditModal(false); }, 1800);
                      }}>Save Changes</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ MY SIGNATURE TAB ═══════════════ */}
          {activeTab === 'my-signature' && (
            <div className="ep-content ep-fade-in">
              <div className="ep-page-header">
                <div>
                  <h2 className="ep-page-title">My Official Email Signature</h2>
                  <p className="ep-page-sub">Your standardized signature — verified for Gmail, Outlook, and Apple Mail.</p>
                </div>
                <span className="ep-sig-badge-active">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ACTIVE
                </span>
              </div>

              {copyState === 'copied' && (
                <div className="ep-toast ep-toast-green">✓ Signature copied! Press <strong>Ctrl+V</strong> (or <strong>Cmd+V</strong>) to paste in your email client.</div>
              )}

              <div className="ep-sig-section">
                <div className="ep-sig-preview-wrap">
                  <OfficialSignature employee={currentEmployee} showActions={true} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                  <button
                    className="ep-btn-action ep-btn-outline"
                    style={{ color: '#DC2626', borderColor: '#FECACA', backgroundColor: '#FEF2F2' }}
                    onClick={() => setDeleteSignatureModalOpen(true)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete / Reset Signature
                  </button>
                </div>
              </div>

              <div className="ep-card" style={{ marginTop: 24 }}>
                <h3 className="ep-card-title" style={{ marginBottom: 12 }}>Signature Details</h3>
                <div className="ep-profile-fields-grid">
                  <div className="ep-profile-field"><div className="ep-profile-field-label">Employee Name</div><div className="ep-profile-field-value">{currentEmployee.name}</div></div>
                  <div className="ep-profile-field"><div className="ep-profile-field-label">Designation</div><div className="ep-profile-field-value">{currentEmployee.jobTitle}</div></div>
                  <div className="ep-profile-field"><div className="ep-profile-field-label">Phone</div><div className="ep-profile-field-value">{currentEmployee.phone}</div></div>
                  <div className="ep-profile-field"><div className="ep-profile-field-label">Email</div><div className="ep-profile-field-value">{currentEmployee.email}</div></div>
                  <div className="ep-profile-field"><div className="ep-profile-field-label">Website</div><div className="ep-profile-field-value">{currentEmployee.website}</div></div>
                  <div className="ep-profile-field"><div className="ep-profile-field-label">Last Updated</div><div className="ep-profile-field-value">12 Sep 2026</div></div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ SIGNATURE STUDIO TAB ═══════════════ */}
          {activeTab === 'signature-studio' && (
            <div className="ep-content ep-fade-in">
              <div className="ep-page-header">
                <div>
                  <h2 className="ep-page-title">Signature Studio</h2>
                  <p className="ep-page-sub">Adjust cosmetic settings. The master signature structure is locked.</p>
                </div>
                <div className="ep-studio-lock-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Structure Locked
                </div>
              </div>

              <div className="ep-studio-layout">
                {/* Controls */}
                <div className="ep-studio-controls">
                  {/* Best Regards */}
                  <div className="ep-studio-section">
                    <h4 className="ep-studio-section-title">Best Regards</h4>
                    <div className="ep-studio-row">
                      <label className="ep-studio-label">Show / Hide</label>
                      <button
                        className={`ep-toggle ${studioCustom.showBestRegards ? 'ep-toggle-on' : 'ep-toggle-off'}`}
                        onClick={() => setStudioCustom(c => ({ ...c, showBestRegards: !c.showBestRegards }))}
                      >
                        <span className="ep-toggle-knob" />
                      </button>
                    </div>
                    <div className="ep-studio-row">
                      <label className="ep-studio-label">Text</label>
                      <input className="ep-studio-input" value={studioCustom.bestRegardsText || 'Best Regards,'} onChange={e => setStudioCustom(c => ({ ...c, bestRegardsText: e.target.value }))} />
                    </div>
                    <div className="ep-studio-row">
                      <label className="ep-studio-label">Font Size</label>
                      <input type="range" min="12" max="24" value={studioCustom.bestRegardsFontSize || 16} onChange={e => setStudioCustom(c => ({ ...c, bestRegardsFontSize: Number(e.target.value) }))} className="ep-studio-slider" />
                      <span className="ep-studio-val">{studioCustom.bestRegardsFontSize || 16}px</span>
                    </div>
                    <div className="ep-studio-row">
                      <label className="ep-studio-label">Color</label>
                      <input type="color" value={studioCustom.bestRegardsColor || '#B30000'} onChange={e => setStudioCustom(c => ({ ...c, bestRegardsColor: e.target.value }))} className="ep-studio-color" />
                    </div>
                    <div className="ep-studio-row">
                      <label className="ep-studio-label">Space Below</label>
                      <input type="range" min="0" max="24" value={studioCustom.bestRegardsSpaceBelow ?? 8} onChange={e => setStudioCustom(c => ({ ...c, bestRegardsSpaceBelow: Number(e.target.value) }))} className="ep-studio-slider" />
                      <span className="ep-studio-val">{studioCustom.bestRegardsSpaceBelow ?? 8}px</span>
                    </div>
                  </div>

                  {/* Logo */}
                  <div className="ep-studio-section">
                    <h4 className="ep-studio-section-title">Logo</h4>
                    <div className="ep-studio-row">
                      <label className="ep-studio-label">Show / Hide</label>
                      <button
                        className={`ep-toggle ${studioCustom.showLogo ? 'ep-toggle-on' : 'ep-toggle-off'}`}
                        onClick={() => setStudioCustom(c => ({ ...c, showLogo: !c.showLogo }))}
                      >
                        <span className="ep-toggle-knob" />
                      </button>
                    </div>
                    <div className="ep-studio-row">
                      <label className="ep-studio-label">Scale</label>
                      <input type="range" min="60" max="150" value={studioCustom.logoScale || 100} onChange={e => setStudioCustom(c => ({ ...c, logoScale: Number(e.target.value) }))} className="ep-studio-slider" />
                      <span className="ep-studio-val">{studioCustom.logoScale || 100}%</span>
                    </div>
                    <div className="ep-studio-row">
                      <label className="ep-studio-label">Space to Divider</label>
                      <input type="range" min="10" max="60" value={studioCustom.logoSpaceToDivider ?? 30} onChange={e => setStudioCustom(c => ({ ...c, logoSpaceToDivider: Number(e.target.value) }))} className="ep-studio-slider" />
                      <span className="ep-studio-val">{studioCustom.logoSpaceToDivider ?? 30}px</span>
                    </div>
                  </div>

                  <button className="ep-btn-action ep-btn-red" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => setStudioCustom(DEFAULT_CUSTOMIZATION)}>
                    Reset to Default
                  </button>
                </div>

                {/* Live Preview */}
                <div className="ep-studio-preview">
                  <div className="ep-studio-preview-label">Live Preview</div>
                  <div className="ep-sig-preview-wrap">
                    <OfficialSignature employee={currentEmployee} showActions={false} customization={studioCustom} />
                  </div>
                  {/* Success notification */}
                  {studioSavedNotice && (
                    <div style={{
                      backgroundColor: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      color: '#065F46',
                      padding: '10px 14px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      marginTop: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <span>✓</span>
                      <span>{studioSavedNotice}</span>
                    </div>
                  )}

                  <div className="ep-action-bar" style={{ marginTop: 16 }}>
                    {/* Working Save Signature button (Requirement #3) */}
                    <button 
                      className="ep-btn-action" 
                      style={{ backgroundColor: '#059669', color: '#FFFFFF', borderColor: '#047857', fontWeight: 700 }}
                      onClick={handleSaveSignature}
                      id="ep-save-signature-btn"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                      </svg>
                      Save Signature
                    </button>

                    <button className="ep-btn-action ep-btn-red" onClick={handleCopySignature}>Copy Signature</button>
                    <button className="ep-btn-action ep-btn-outline" onClick={handleDownloadHtml}>Download HTML</button>
                    <button
                      className="ep-btn-action ep-btn-outline"
                      style={{ color: '#DC2626', borderColor: '#FECACA', backgroundColor: '#FEF2F2' }}
                      onClick={() => setDeleteSignatureModalOpen(true)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      Delete Signature
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ GMAIL DEMO TAB ═══════════════ */}
          {activeTab === 'gmail-demo' && (
            <div className="ep-content ep-fade-in">
              <div className="ep-page-header">
                <div>
                  <h2 className="ep-page-title">Email Preview Demo</h2>
                  <p className="ep-page-sub">Test your signature in a real-world email composer. Demo only — no emails are sent.</p>
                </div>
              </div>

              {/* Gmail / Outlook Tabs */}
              <div className="ep-gmail-tabs">
                <button className={`ep-gmail-tab ${gmailTab === 'gmail' ? 'ep-gmail-tab-active' : ''}`} onClick={() => setGmailTab('gmail')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Gmail
                </button>
                <button className={`ep-gmail-tab ${gmailTab === 'outlook' ? 'ep-gmail-tab-active' : ''}`} onClick={() => setGmailTab('outlook')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/></svg>
                  Outlook
                </button>
              </div>

              {/* Gmail Compose */}
              {gmailTab === 'gmail' && (
                <div className="ep-gmail-compose">
                  <div className="ep-gmail-compose-header">
                    <div className="ep-gmail-compose-title">
                      <div className="ep-gmail-dot ep-gmail-dot-red" />
                      <div className="ep-gmail-dot ep-gmail-dot-yellow" />
                      <div className="ep-gmail-dot ep-gmail-dot-green" />
                      <span style={{ marginLeft: 10, fontSize: 13, color: '#5F6368', fontWeight: 600 }}>New Message</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#5F6368' }}>Demo Mode — No emails sent</div>
                  </div>

                  <div className="ep-gmail-compose-body">
                    <div className="ep-gmail-field-row">
                      <span className="ep-gmail-field-label">To</span>
                      <input className="ep-gmail-field-input" value={gmailTo} onChange={e => setGmailTo(e.target.value)} placeholder="recipient@example.com" />
                    </div>
                    <div className="ep-gmail-divider" />
                    <div className="ep-gmail-field-row">
                      <span className="ep-gmail-field-label">Subject</span>
                      <input className="ep-gmail-field-input" value={gmailSubject} onChange={e => setGmailSubject(e.target.value)} placeholder="Email subject..." />
                    </div>
                    <div className="ep-gmail-divider" />
                    <textarea className="ep-gmail-message" value={gmailMsg} onChange={e => setGmailMsg(e.target.value)} placeholder="Compose your message..." rows={5} />
                    <div className="ep-gmail-sig-separator">-- </div>

                    {/* Actual signature rendered */}
                    <div style={{ padding: '8px 0' }}>
                      <OfficialSignature employee={currentEmployee} showActions={false} clean={true} />
                    </div>

                    <div className="ep-gmail-actions">
                      {gmailSent ? (
                        <div className="ep-toast ep-toast-green" style={{ display: 'inline-flex' }}>✓ Demo sent! (No actual email was sent)</div>
                      ) : (
                        <button className="ep-gmail-send-btn" onClick={handleGmailSend}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                          TEST SIGNATURE
                        </button>
                      )}
                      <span className="ep-gmail-demo-note">DEMO ONLY — signature layout verified</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Outlook Compose */}
              {gmailTab === 'outlook' && (
                <div className="ep-outlook-compose">
                  <div className="ep-outlook-header">
                    <div className="ep-outlook-ribbon">
                      <span className="ep-outlook-ribbon-tab ep-outlook-ribbon-active">Message</span>
                      <span className="ep-outlook-ribbon-tab">Insert</span>
                      <span className="ep-outlook-ribbon-tab">Options</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#605E5C', padding: '6px 16px', backgroundColor: '#FAF9F8' }}>Demo Mode — No emails sent</div>
                  </div>
                  <div className="ep-outlook-body">
                    <div className="ep-outlook-field-row">
                      <span className="ep-outlook-label">To:</span>
                      <input className="ep-outlook-input" value={gmailTo} onChange={e => setGmailTo(e.target.value)} placeholder="recipient@example.com" />
                    </div>
                    <div className="ep-outlook-field-row">
                      <span className="ep-outlook-label">Subject:</span>
                      <input className="ep-outlook-input" value={gmailSubject} onChange={e => setGmailSubject(e.target.value)} placeholder="Subject..." />
                    </div>
                    <textarea className="ep-outlook-message" value={gmailMsg} onChange={e => setGmailMsg(e.target.value)} placeholder="Message body..." rows={4} />
                    <div style={{ borderTop: '1px dashed #E1DFDD', padding: '12px 0', margin: '0 16px' }}>
                      <OfficialSignature employee={currentEmployee} showActions={false} clean={true} />
                    </div>
                    <div style={{ padding: '12px 16px' }}>
                      {gmailSent ? (
                        <div className="ep-toast ep-toast-green" style={{ display: 'inline-flex' }}>✓ Demo sent! (No actual email was sent)</div>
                      ) : (
                        <button className="ep-outlook-send-btn" onClick={handleGmailSend}>
                          ▶ TEST SIGNATURE
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Checklist */}
              <div className="ep-card" style={{ marginTop: 24 }}>
                <h3 className="ep-card-title" style={{ marginBottom: 12 }}>Signature Verification Checklist</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    'Logo loads correctly',
                    'Burgundy vertical divider visible',
                    'Name, designation, contact details aligned',
                    'Links (email, website) are clickable',
                    'Company address text is readable',
                    'Table structure preserved (no stacking)',
                    'Best Regards spacing is correct'
                  ].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: '#374151' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ INSTALLATION GUIDE TAB ═══════════════ */}
          {activeTab === 'installation-guide' && (
            <div className="ep-content ep-fade-in">
              <div className="ep-page-header">
                <div>
                  <h2 className="ep-page-title">Installation Guide</h2>
                  <p className="ep-page-sub">Step-by-step setup instructions for all email clients.</p>
                </div>
              </div>

              {[
                {
                  title: 'Gmail (Web)',
                  steps: [
                    'Open Gmail and click the gear icon (Settings) → See all settings.',
                    'Go to the General tab and scroll to the Signature section.',
                    'Click "+ Create new" and name it "ALAM ENGAZ Official".',
                    'Go back to the Employee Portal and click Copy Signature.',
                    'In Gmail, click inside the signature text area and press Ctrl+V (Cmd+V on Mac).',
                    'Select your new signature under "Signature defaults" for new emails and replies.',
                    'Click Save Changes at the bottom of the Settings page.'
                  ]
                },
                {
                  title: 'Outlook Web (OWA)',
                  steps: [
                    'Open Outlook Web and click Settings (gear icon) → View all Outlook settings.',
                    'Navigate to Mail → Compose and reply.',
                    'Under the Email signature section, click in the text area.',
                    'Click Copy Signature from the Employee Portal and press Ctrl+V.',
                    'Enable "Automatically include my signature on new messages".',
                    'Click Save.'
                  ]
                },
                {
                  title: 'Outlook Desktop (Windows)',
                  steps: [
                    'Open Outlook and click New Email to open a compose window.',
                    'In the compose window, click Insert → Signature → Signatures.',
                    'Click New, name it "ALAM ENGAZ Official", and click OK.',
                    'Click in the Edit signature text area below.',
                    'From the Employee Portal, click Copy Signature and press Ctrl+V.',
                    'Set this signature as default for New Messages and Replies/Forwards.',
                    'Click OK to save.'
                  ]
                },
                {
                  title: 'Apple Mail (macOS)',
                  steps: [
                    'Open Apple Mail and go to Mail → Settings → Signatures.',
                    'Select your email account and click the "+" button.',
                    'Name the signature "ALAM ENGAZ Official".',
                    'Click in the signature text area on the right.',
                    'From the Employee Portal, click Copy Signature and press Cmd+V.',
                    'Uncheck "Always match my default message font" if prompted.',
                    'Close the Signatures window — it saves automatically.'
                  ]
                }
              ].map((guide, idx) => (
                <div key={guide.title} className="ep-guide-card">
                  <div className="ep-guide-card-header">
                    <div className="ep-guide-number">{idx + 1}</div>
                    <h3 className="ep-guide-title">{guide.title}</h3>
                  </div>
                  <ol className="ep-guide-steps">
                    {guide.steps.map((step, si) => (
                      <li key={si} className="ep-guide-step">{step}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}

          {/* ═══════════════ SUPPORT TAB ═══════════════ */}
          {activeTab === 'support' && (
            <div className="ep-content ep-fade-in">
              <div className="ep-page-header">
                <div>
                  <h2 className="ep-page-title">Support</h2>
                  <p className="ep-page-sub">We're here to help with any questions about your email signature.</p>
                </div>
              </div>

              <div className="ep-support-full-grid">
                <div className="ep-card ep-support-card-lg">
                  <div className="ep-support-head">
                    <div className="ep-support-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div>
                      <div className="ep-support-title" style={{ fontSize: 22 }}>Need Help?</div>
                      <div className="ep-support-sub">Our support team is here to assist you with any signature or portal issues.</div>
                    </div>
                  </div>

                  <div className="ep-support-info-list" style={{ marginTop: 24 }}>
                    <div className="ep-support-info-row">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B0021" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <div>
                        <div className="ep-support-info-label">Email Support</div>
                        <a href="mailto:it@alamengaz.com" className="ep-support-info-val ep-support-email-link">it@alamengaz.com</a>
                      </div>
                    </div>
                    <div className="ep-support-info-row">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B0021" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <div>
                        <div className="ep-support-info-label">Support Hours</div>
                        <div className="ep-support-info-val">Sunday – Thursday<br />9:00 AM – 6:00 PM (KSA Time)</div>
                      </div>
                    </div>
                  </div>

                  <a href="mailto:it@alamengaz.com" className="ep-support-btn" style={{ marginTop: 24, display: 'inline-block' }}>
                    Contact Support &rarr;
                  </a>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { q: 'My signature is not showing in Gmail', a: 'Ensure you pasted using the Copy Signature (Rich Format) button. Go to Gmail Settings → Signature, click the signature area, and press Ctrl+V again.' },
                    { q: 'The logo is not displaying in Outlook', a: 'The logo in the email uses a hosted URL. Ensure your Outlook is connected to the internet and that images are allowed for this sender.' },
                    { q: 'Signature looks broken on mobile', a: 'Email signatures use table-based HTML which may appear differently on mobile clients. This is expected and normal.' },
                    { q: 'I need to update my phone number', a: 'Click Edit My Details from your profile or Quick Actions. Only phone number can be edited. For name or title changes, contact it@alamengaz.com.' }
                  ].map(faq => (
                    <div key={faq.q} className="ep-faq-card">
                      <div className="ep-faq-q">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B0021" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        {faq.q}
                      </div>
                      <div className="ep-faq-a">{faq.a}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── DELETE SIGNATURE CONFIRMATION MODAL ── */}
      {deleteSignatureModalOpen && (
        <div className="support-modal-backdrop" onClick={() => setDeleteSignatureModalOpen(false)}>
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
              Are you sure you want to delete your saved signature configuration? The default master signature configuration will be restored.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setDeleteSignatureModalOpen(false)}
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
                onClick={handleDeleteOwnSignature}
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
    </div>
  );
};

// ─── Portal Footer ─────────────────────────────────────────────────────────────
const PortalFooter: React.FC = () => (
  <footer className="ep-footer">
    <div className="ep-footer-img" style={{ backgroundImage: 'url(/assets/container-terminal.jpg)' }}>
      <div className="ep-footer-overlay" />
      <div className="ep-footer-content">
        <div className="ep-footer-motto">
          <span className="ep-footer-together">Together We <em>Move Forward</em></span>
          <span className="ep-footer-sub">People &nbsp;|&nbsp; Ports &nbsp;|&nbsp; Possibilities</span>
        </div>
        <div className="ep-footer-right">
          <div className="ep-footer-badge">
            Global Connections<br />Stronger Tomorrow
          </div>
        </div>
      </div>
    </div>

    <div className="ep-footer-bottom">
      <div className="ep-footer-logo-wrap">
        <img src="/assets/logo.png" alt="ALAM ENGAZ" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
      </div>
      <div className="ep-footer-bottom-center">
        <span>Dammam &nbsp;|&nbsp; Jeddah &nbsp;|&nbsp; Bahrain &nbsp;|&nbsp; India</span>
        <a href="https://www.alamengaz.com" target="_blank" rel="noopener noreferrer" style={{ color: '#8B0021', fontWeight: 600 }}>www.alamengaz.com</a>
        <div className="ep-footer-socials">
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" title="LinkedIn" aria-label="LinkedIn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" title="YouTube" aria-label="YouTube">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 1.96C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" title="Instagram" aria-label="Instagram">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          </a>
        </div>
      </div>
      <div className="ep-footer-copy">
        © 2026 ALAM ENGAZ PORT SERVICES CO.<br />All rights reserved.
      </div>
    </div>
    <div className="footer-developer-credit-wrap" style={{ marginTop: '16px', paddingBottom: '16px' }}>
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
);
