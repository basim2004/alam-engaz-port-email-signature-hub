import React, { useState, useRef, useEffect } from 'react';
import { Employee } from '../types';
import { OfficialSignature } from '../components/OfficialSignature';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { COMPANY_DETAILS } from '../data/initialData';
import { CENTRAL_ORIGINAL_LOGO } from '../constants/assets';
import { 
  SignatureCustomization, 
  DEFAULT_CUSTOMIZATION, 
  generateOfficialSignatureHtml, 
  copySignatureRichText, 
  downloadSignatureHtml 
} from '../utils/signatureHtmlGenerator';
import { 
  saveSignatureRecord, 
  deleteSignatureRecord, 
  getCustomSignatureRecord 
} from '../services/signatureStorageService';

interface SignatureStudioViewProps {
  currentEmployee: Employee;
  employees?: Employee[];
}

export const SignatureStudioView: React.FC<SignatureStudioViewProps> = ({ currentEmployee, employees: allEmployees = [] }) => {
  // 1. Employee Details State (dynamically reflects currentEmployee)
  const [employee, setEmployee] = useState<Employee>({ ...currentEmployee });

  useEffect(() => {
    if (currentEmployee) {
      setEmployee({ ...currentEmployee });
    }
  }, [currentEmployee]);

  // 2. Customization State
  const [customization, setCustomization] = useState<SignatureCustomization>({ ...DEFAULT_CUSTOMIZATION });

  // Delete Signature confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Load saved customization from Firestore on mount & when employee changes
  useEffect(() => {
    if (employee.id) {
      const saved = getCustomSignatureRecord(employee.id);
      if (saved) {
        setCustomization(saved);
      }
    }
  }, [employee.id]);

  // Notification state
  const [notification, setNotification] = useState<string | null>(null);

  // 8. Gmail / Outlook Test State
  const [testClient, setTestClient] = useState<'gmail' | 'outlook'>('gmail');
  const [testMode, setTestMode] = useState<'live' | 'sig-only'>('live');
  const [emailSubject, setEmailSubject] = useState('Business Enquiry – ALAM ENGAZ Port Services Co.');
  const [emailBody, setEmailBody] = useState(
    'Dear Sir/Madam,\n\nThank you for contacting ALAM ENGAZ Port Services Co.\n\nWe are pleased to assist you with your requirements.'
  );
  const [showInsertedBadge, setShowInsertedBadge] = useState(true);
  // Track whether the signature has been "pasted" into the test composer
  const [pasteSuccess, setPasteSuccess] = useState(false);

  const gmailSectionRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Best Regards Position Handlers
  const moveBestRegards = (dx: number, dy: number) => {
    setCustomization(prev => ({
      ...prev,
      bestRegardsX: (prev.bestRegardsX || 0) + dx,
      bestRegardsY: (prev.bestRegardsY || 0) + dy
    }));
  };

  const resetBestRegardsPosition = () => {
    setCustomization(prev => ({
      ...prev,
      bestRegardsX: 0,
      bestRegardsY: 0,
      bestRegardsSpaceBelow: DEFAULT_CUSTOMIZATION.bestRegardsSpaceBelow
    }));
    showToast('Best Regards position reset.');
  };

  const resetBestRegardsAll = () => {
    setCustomization(prev => ({
      ...prev,
      showBestRegards: DEFAULT_CUSTOMIZATION.showBestRegards,
      bestRegardsText: DEFAULT_CUSTOMIZATION.bestRegardsText,
      bestRegardsColor: DEFAULT_CUSTOMIZATION.bestRegardsColor,
      bestRegardsFontSize: DEFAULT_CUSTOMIZATION.bestRegardsFontSize,
      bestRegardsFontWeight: DEFAULT_CUSTOMIZATION.bestRegardsFontWeight,
      bestRegardsX: DEFAULT_CUSTOMIZATION.bestRegardsX,
      bestRegardsY: DEFAULT_CUSTOMIZATION.bestRegardsY,
      bestRegardsSpaceBelow: DEFAULT_CUSTOMIZATION.bestRegardsSpaceBelow
    }));
    showToast('Best Regards settings restored to default.');
  };

  // Logo Handlers
  const moveLogo = (dx: number, dy: number) => {
    setCustomization(prev => ({
      ...prev,
      logoX: (prev.logoX || 0) + dx,
      logoY: (prev.logoY || 0) + dy
    }));
  };

  const changeLogoScale = (delta: number) => {
    setCustomization(prev => ({
      ...prev,
      logoScale: Math.max(50, Math.min(160, (prev.logoScale || 100) + delta))
    }));
  };

  const resetLogoPosition = () => {
    setCustomization(prev => ({
      ...prev,
      logoX: 0,
      logoY: 0
    }));
    showToast('Logo position reset.');
  };

  const resetLogoSize = () => {
    setCustomization(prev => ({
      ...prev,
      logoScale: 100
    }));
    showToast('Logo size reset to 100%.');
  };

  const resetLogoAll = () => {
    setCustomization(prev => ({
      ...prev,
      showLogo: DEFAULT_CUSTOMIZATION.showLogo,
      logoScale: DEFAULT_CUSTOMIZATION.logoScale,
      logoX: DEFAULT_CUSTOMIZATION.logoX,
      logoY: DEFAULT_CUSTOMIZATION.logoY,
      logoSpaceBelowRegards: DEFAULT_CUSTOMIZATION.logoSpaceBelowRegards,
      logoSpaceToDivider: DEFAULT_CUSTOMIZATION.logoSpaceToDivider
    }));
    showToast('Logo settings restored to default.');
  };

  const resetAllSettings = () => {
    setEmployee({ ...currentEmployee });
    setCustomization({ ...DEFAULT_CUSTOMIZATION });
    showToast('All settings restored to official defaults.');
  };

  // Requirement #3: Working SAVE SIGNATURE button
  const handleSaveSignature = async () => {
    if (!employee.id || !employee.name) {
      showToast('Validation Error: Employee Name and ID are required.');
      return;
    }
    const res = await saveSignatureRecord(
      employee.id,
      employee.name,
      customization,
      employee.name,
      'employee'
    );
    if (res.success) {
      showToast('Signature saved successfully.');
    } else {
      showToast(res.message || 'Failed to save signature.');
    }
  };

  // Requirement #14: Controlled Delete Signature with confirmation
  const handleDeleteSignatureConfirm = async () => {
    const res = await deleteSignatureRecord(employee.id, employee.name, employee.name, 'employee', employee.id);
    setCustomization({ ...DEFAULT_CUSTOMIZATION });
    setDeleteModalOpen(false);
    showToast('✓ Saved signature deleted. Master template restored.');
  };

  // Quick Actions Handlers
  const handleCopyHtml = async () => {
    const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/assets/logo.png` : '/assets/logo.png';
    const html = generateOfficialSignatureHtml(employee, logoUrl, customization);
    const companyName = employee.companyName || COMPANY_DETAILS.name;
    const plainText = [
      customization.showBestRegards !== false ? (customization.bestRegardsText || 'Best Regards,') : '',
      '',
      employee.name,
      employee.jobTitle,
      `T: ${employee.phone} | E: ${employee.email} | W: ${employee.website}`,
      COMPANY_DETAILS.address,
      employee.locations,
      companyName
    ].join('\n');

    const success = await copySignatureRichText(html, plainText);
    if (success) {
      showToast('✓ Signature copied to clipboard! Paste directly into Outlook, Gmail, or Apple Mail.');
    } else {
      showToast('Signature copied.');
    }
  };

  // "Paste into Test" — copies then marks signature as inserted in the test composer
  const handlePasteIntoTest = async () => {
    await handleCopyHtml();
    setPasteSuccess(true);
    setShowInsertedBadge(true);
    setTimeout(() => setPasteSuccess(false), 3500);
    showToast('✓ Signature pasted into the email test area below!');
  };

  const handleDownloadHtml = () => {
    const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/assets/logo.png` : '/assets/logo.png';
    const html = generateOfficialSignatureHtml(employee, logoUrl, customization);
    downloadSignatureHtml(employee, html);
    showToast('HTML Signature file downloaded.');
  };

  const handleDownloadPng = () => {
    try {
      const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/assets/logo.png` : '/assets/logo.png';
      const rawHtml = generateOfficialSignatureHtml(employee, logoUrl, customization);
      
      const canvas = document.createElement('canvas');
      canvas.width = 1400;
      canvas.height = 520;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="260">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="background:#ffffff;padding:24px;font-family:Segoe UI,sans-serif;">
            ${rawHtml}
          </div>
        </foreignObject>
      </svg>`;

      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.drawImage(img, 0, 0, 1400, 520);
        URL.revokeObjectURL(url);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${employee.name.toLowerCase().replace(/\s+/g, '-')}-signature.png`;
        link.href = pngUrl;
        link.click();
        showToast('PNG Signature image downloaded successfully!');
      };
      img.onerror = () => {
        handleDownloadHtml();
      };
      img.src = url;
    } catch {
      handleDownloadHtml();
    }
  };

  const handleScrollToEmailTest = () => {
    if (gmailSectionRef.current) {
      gmailSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="signature-studio-page-wrap">
      {/* ================= HERO SECTION ================= */}
      <section className="studio-hero-section">
        <div className="studio-hero-overlay" />
        
        <div className="studio-hero-container">
          <div className="studio-hero-left">
            <div className="studio-hero-preheading">
              CREATE · CUSTOMIZE · COMMUNICATE
            </div>

            <h1 className="studio-hero-title-wrap">
              <span className="studio-title-signature">SIGNATURE </span>
              <span className="studio-title-studio">STUDIO</span>
            </h1>

            <p className="studio-hero-subtext">
              Generate professional email signatures for the<br />
              ALAM ENGAZ Port Services Co. team.
            </p>

            <div className="studio-badges-row">
              <div className="studio-badge-item">
                <span className="studio-badge-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </span>
                <span>Professional Design</span>
              </div>
              <div className="studio-badge-item">
                <span className="studio-badge-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </span>
                <span>Consistent Brand Identity</span>
              </div>
              <div className="studio-badge-item">
                <span className="studio-badge-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </span>
                <span>Ready to Use Everywhere</span>
              </div>
            </div>
          </div>

          <div className="team-hero-right-motto">
            <div className="team-motto-stack">
              <div>MOVING</div>
              <div>BUSINESS</div>
              <div>FURTHER</div>
            </div>
            <div className="team-script-tag">
              Global Connections Stronger Tomorrow
            </div>
          </div>
        </div>
      </section>

      {/* Global Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '90px',
          right: '30px',
          backgroundColor: '#ECFDF5',
          border: '1px solid #10B981',
          color: '#065F46',
          padding: '12px 20px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 700,
          boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>✓</span>
          <span>{notification}</span>
        </div>
      )}

      {/* ================= MAIN TWO-COLUMN WORKSPACE ================= */}
      <div className="studio-workspace-container">
        
        {/* ================= LEFT COLUMN: SETTINGS ================= */}
        <div className="studio-col-left">

          {/* 1. EMPLOYEE DETAILS */}
          <div className="studio-card" id="card-employee-details">
            <div className="studio-card-header">
              <div className="card-num-badge">1</div>
              <div>
                <h2 className="studio-card-title">EMPLOYEE DETAILS</h2>
                <p className="studio-card-desc">Enter the employee information to generate the official signature.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div className="studio-form-group">
                <label className="studio-label">Full Name *</label>
                <input 
                  type="text" 
                  className="studio-input"
                  value={employee.name}
                  onChange={(e) => setEmployee({ ...employee, name: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="studio-form-group">
                <label className="studio-label">Job Title *</label>
                <input 
                  type="text" 
                  className="studio-input"
                  value={employee.jobTitle}
                  onChange={(e) => setEmployee({ ...employee, jobTitle: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="studio-form-group">
                <label className="studio-label">Phone *</label>
                <input 
                  type="text" 
                  className="studio-input"
                  value={employee.phone}
                  onChange={(e) => setEmployee({ ...employee, phone: e.target.value })}
                />
              </div>

              <div className="studio-form-group">
                <label className="studio-label">Email *</label>
                <input 
                  type="email" 
                  className="studio-input"
                  value={employee.email}
                  onChange={(e) => setEmployee({ ...employee, email: e.target.value })}
                />
              </div>

              <div className="studio-form-group">
                <label className="studio-label">Website</label>
                <input 
                  type="text" 
                  className="studio-input"
                  value={employee.website}
                  disabled
                />
              </div>
            </div>

            {/* Employee Selector — visible when multiple employees are loaded */}
            {allEmployees.length > 1 && (
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #E2E8F0' }}>
                <label className="studio-label">Load Employee Record</label>
                <select
                  className="studio-input"
                  value={employee.id}
                  onChange={(e) => {
                    const found = allEmployees.find(emp => emp.id === e.target.value);
                    if (found) setEmployee({ ...found });
                  }}
                >
                  {allEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.companyName || 'ALAM ENGAZ PORT SERVICES CO.'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 2. BEST REGARDS SETTINGS */}
          <div className="studio-card" id="card-best-regards-settings">
            <div className="studio-card-header">
              <div className="card-num-badge">2</div>
              <div>
                <h2 className="studio-card-title">BEST REGARDS SETTINGS</h2>
                <p className="studio-card-desc">Edit, style and position the "Best Regards," text.</p>
              </div>
            </div>

            {/* Toggle Show/Hide */}
            <div className="toggle-switch-row">
              <label className="switch-toggle">
                <input 
                  type="checkbox" 
                  checked={customization.showBestRegards}
                  onChange={(e) => setCustomization({ ...customization, showBestRegards: e.target.checked })}
                />
                <span className="slider-round" />
              </label>
              <span className="toggle-switch-label">Show "Best Regards,"</span>
            </div>

            {customization.showBestRegards && (
              <>
                {/* Text Content & Color */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '12px', marginBottom: '12px' }}>
                  <div className="studio-form-group">
                    <label className="studio-label">Text Content</label>
                    <input 
                      type="text" 
                      className="studio-input"
                      value={customization.bestRegardsText}
                      onChange={(e) => setCustomization({ ...customization, bestRegardsText: e.target.value })}
                    />
                  </div>

                  <div className="studio-form-group">
                    <label className="studio-label">Text Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="color" 
                        value={customization.bestRegardsColor}
                        onChange={(e) => setCustomization({ ...customization, bestRegardsColor: e.target.value })}
                        style={{ width: '36px', height: '36px', border: '1px solid #CBD5E1', borderRadius: '4px', cursor: 'pointer', padding: '2px', backgroundColor: '#FFFFFF' }}
                      />
                      <input 
                        type="text" 
                        className="studio-input"
                        value={customization.bestRegardsColor}
                        onChange={(e) => setCustomization({ ...customization, bestRegardsColor: e.target.value })}
                        style={{ width: '85px', fontSize: '12.5px', fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Font Size & Font Weight */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="studio-form-group">
                    <label className="studio-label">Font Size</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <select 
                        className="studio-input"
                        value={customization.bestRegardsFontSize}
                        onChange={(e) => setCustomization({ ...customization, bestRegardsFontSize: Number(e.target.value) })}
                      >
                        <option value={12}>12</option>
                        <option value={13}>13</option>
                        <option value={14}>14</option>
                        <option value={15}>15</option>
                        <option value={16}>16</option>
                        <option value={18}>18</option>
                      </select>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>px</span>
                    </div>
                  </div>

                  <div className="studio-form-group">
                    <label className="studio-label">Font Weight</label>
                    <select 
                      className="studio-input"
                      value={customization.bestRegardsFontWeight}
                      onChange={(e) => setCustomization({ ...customization, bestRegardsFontWeight: e.target.value })}
                    >
                      <option value="Regular">Regular</option>
                      <option value="Medium">Medium</option>
                      <option value="Semi-Bold">Semi-Bold</option>
                      <option value="Bold">Bold</option>
                    </select>
                  </div>
                </div>

                {/* Position (Move) */}
                <div style={{ marginBottom: '14px' }}>
                  <label className="studio-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Position (Move)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="directional-pad">
                      <button className="btn-arrow" onClick={() => moveBestRegards(0, -2)} title="Move Up">↑</button>
                      <button className="btn-arrow" onClick={() => moveBestRegards(0, 2)} title="Move Down">↓</button>
                      <button className="btn-arrow" onClick={() => moveBestRegards(-2, 0)} title="Move Left">←</button>
                      <button className="btn-arrow" onClick={() => moveBestRegards(2, 0)} title="Move Right">→</button>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#475569', fontWeight: 600 }}>
                      X: {customization.bestRegardsX || 0} px &nbsp;&bull;&nbsp; Y: {customization.bestRegardsY || 0} px
                    </div>
                  </div>
                </div>

                {/* Space Below Text Slider & Reset Button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      <span>Space Below Text</span>
                      <span>{customization.bestRegardsSpaceBelow} px</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="30" 
                      value={customization.bestRegardsSpaceBelow}
                      onChange={(e) => setCustomization({ ...customization, bestRegardsSpaceBelow: Number(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--red-corporate)' }}
                    />
                  </div>

                  <button 
                    onClick={resetBestRegardsPosition}
                    className="btn-reset-box"
                    style={{ height: '36px', padding: '0 12px', fontSize: '12px' }}
                  >
                    <span>Reset Best Regards Position</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 3. LOGO SETTINGS */}
          <div className="studio-card" id="card-logo-settings">
            <div className="studio-card-header">
              <div className="card-num-badge">3</div>
              <div>
                <h2 className="studio-card-title">LOGO SETTINGS</h2>
                <p className="studio-card-desc">Control logo visibility, position, size and spacing.</p>
              </div>
            </div>

            {/* Toggle Show Company Logo */}
            <div className="toggle-switch-row">
              <label className="switch-toggle">
                <input 
                  type="checkbox" 
                  checked={customization.showLogo}
                  onChange={(e) => setCustomization({ ...customization, showLogo: e.target.checked })}
                />
                <span className="slider-round" />
              </label>
              <span className="toggle-switch-label">Show Company Logo</span>
            </div>

            {customization.showLogo && (
              <>
                {/* Position & Logo Size */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                  <div>
                    <label className="studio-label" style={{ display: 'block', marginBottom: '6px' }}>Position (Move)</label>
                    <div className="directional-pad">
                      <button className="btn-arrow" onClick={() => moveLogo(0, -2)} title="Move Up">↑</button>
                      <button className="btn-arrow" onClick={() => moveLogo(0, 2)} title="Move Down">↓</button>
                      <button className="btn-arrow" onClick={() => moveLogo(-2, 0)} title="Move Left">←</button>
                      <button className="btn-arrow" onClick={() => moveLogo(2, 0)} title="Move Right">→</button>
                    </div>
                  </div>

                  <div>
                    <label className="studio-label" style={{ display: 'block', marginBottom: '6px' }}>Logo Size</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button className="btn-arrow" onClick={() => changeLogoScale(-5)}>−</button>
                      <span style={{ fontSize: '13px', fontWeight: 700, width: '46px', textAlign: 'center' }}>
                        {customization.logoScale || 100}%
                      </span>
                      <button className="btn-arrow" onClick={() => changeLogoScale(5)}>+</button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', fontSize: '12.5px', color: '#475569' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: 'var(--red-corporate)' }} />
                    <span>Y: {customization.logoY || 0} px</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <input type="checkbox" checked readOnly style={{ accentColor: 'var(--red-corporate)' }} />
                    <span>Lock Aspect Ratio</span>
                  </label>
                </div>

                {/* Spacing sliders */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    <span>Space Between "Best Regards," and Logo</span>
                    <span>{customization.logoSpaceBelowRegards} px</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="30" 
                    value={customization.logoSpaceBelowRegards}
                    onChange={(e) => setCustomization({ ...customization, logoSpaceBelowRegards: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: 'var(--red-corporate)' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    <span>Space Between Logo and Divider</span>
                    <span>{customization.logoSpaceToDivider} px</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="50" 
                    value={customization.logoSpaceToDivider}
                    onChange={(e) => setCustomization({ ...customization, logoSpaceToDivider: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: 'var(--red-corporate)' }}
                  />
                </div>

                {/* Reset Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button 
                    onClick={resetLogoPosition}
                    className="btn-reset-box"
                    style={{ height: '36px', fontSize: '11px', padding: '0 6px' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                    </svg>
                    <span>Reset Logo Position</span>
                  </button>
                  <button 
                    onClick={resetLogoSize}
                    className="btn-reset-box"
                    style={{ height: '36px', fontSize: '11px', padding: '0 6px' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                    </svg>
                    <span>Reset Logo Size</span>
                  </button>
                  <button 
                    onClick={resetLogoAll}
                    className="btn-reset-box"
                    style={{ height: '36px', fontSize: '11px', padding: '0 6px' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                    </svg>
                    <span>Reset Logo Settings</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 4. DISPLAY OPTIONS */}
          <div className="studio-card" id="card-display-options">
            <div className="studio-card-header">
              <div className="card-num-badge">4</div>
              <div>
                <h2 className="studio-card-title">DISPLAY OPTIONS</h2>
                <p className="studio-card-desc">Choose additional options for your signature.</p>
              </div>
            </div>

            <div className="toggle-switch-row" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
              <label className="switch-toggle">
                <input 
                  type="checkbox" 
                  checked={customization.showSocialIcons}
                  onChange={(e) => setCustomization({ ...customization, showSocialIcons: e.target.checked })}
                />
                <span className="slider-round" />
              </label>
              <div>
                <span className="toggle-switch-label" style={{ display: 'block' }}>Show Social Media Icons</span>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Display company social media icons (if applicable).</span>
              </div>
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN: PREVIEW + ACTIONS + GMAIL TEST ================= */}
        <div className="studio-col-right">

          {/* 5. LIVE SIGNATURE PREVIEW (LOCKED FORMAT) */}
          <div className="studio-card" id="card-live-preview">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="card-num-badge">5</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <h2 className="studio-card-title" style={{ margin: 0 }}>LIVE SIGNATURE PREVIEW (LOCKED FORMAT)</h2>
                  </div>
                  <p className="studio-card-desc">Structure &amp; company information are locked for brand consistency.</p>
                </div>
              </div>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ECFDF5',
                color: '#059669',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 700
              }}>
                ● Live Preview
              </span>
            </div>

            {/* Reusable OfficialSignature Component */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '24px',
              overflowX: 'auto',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <OfficialSignature 
                employee={employee} 
                showActions={false}
                customization={customization}
                clean={true}
                showVerifiedBadge={false}
              />
            </div>
          </div>

          {/* 6. QUICK ACTIONS */}
          <div className="studio-card" id="card-quick-actions">
            <div className="studio-card-header">
              <div className="card-num-badge">6</div>
              <div>
                <h2 className="studio-card-title">QUICK ACTIONS</h2>
                <p className="studio-card-desc">Download or copy your signature in different formats.</p>
              </div>
            </div>

            <div className="quick-actions-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
              {/* SAVE SIGNATURE (Requirement #3) */}
              <button 
                className="btn-quick-action"
                style={{
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  border: '1px solid #047857',
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
                }}
                onClick={handleSaveSignature}
                id="qa-btn-save-signature"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                <span>SAVE<br />SIGNATURE</span>
              </button>

              <button 
                className="btn-quick-action btn-qa-red"
                onClick={handleCopyHtml}
                id="qa-btn-copy-html"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy HTML<br />(For Email)</span>
              </button>

              <button 
                className="btn-quick-action btn-qa-white"
                onClick={handleDownloadHtml}
                id="qa-btn-download-html"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Download<br />HTML File</span>
              </button>

              <button 
                className="btn-quick-action btn-qa-white"
                onClick={handleDownloadPng}
                id="qa-btn-download-image"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span>Download<br />as Image (PNG)</span>
              </button>

              {/* DELETE SIGNATURE (Requirement #14) */}
              <button 
                className="btn-quick-action"
                style={{
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FECACA'
                }}
                onClick={() => setDeleteModalOpen(true)}
                id="qa-btn-delete-signature"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Delete<br />Signature</span>
              </button>

              <button 
                className="btn-quick-action btn-qa-white"
                onClick={handleScrollToEmailTest}
                id="qa-btn-test-client"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span>Test in<br />Email Client</span>
              </button>
            </div>
          </div>

          {/* 7. RESET OPTIONS */}
          <div className="studio-card" id="card-reset-options">
            <div className="studio-card-header">
              <div className="card-num-badge">7</div>
              <div>
                <h2 className="studio-card-title">RESET OPTIONS</h2>
                <p className="studio-card-desc">Reset individual settings or restore default layout.</p>
              </div>
            </div>

            <div className="reset-options-row">
              <button 
                className="btn-reset-box"
                onClick={resetBestRegardsAll}
                id="btn-reset-best-regards"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                <span>Reset Best Regards</span>
              </button>

              <button 
                className="btn-reset-box"
                onClick={resetLogoAll}
                id="btn-reset-logo-settings"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                <span>Reset Logo Settings</span>
              </button>

              <button 
                className="btn-reset-box"
                onClick={resetAllSettings}
                id="btn-reset-all-settings"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                <span>Reset All Settings</span>
              </button>
            </div>
          </div>

          {/* 8. GMAIL SIGNATURE TEST */}
          <div className="studio-card" id="card-gmail-test" ref={gmailSectionRef}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div className="card-num-badge">8</div>
                <div>
                  <h2 className="studio-card-title">GMAIL SIGNATURE TEST</h2>
                  <p className="studio-card-desc">Test how your signature appears inside an email before using it in your real email.</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                {/* Client toggles */}
                <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '6px' }}>
                  <button 
                    onClick={() => setTestClient('gmail')}
                    style={{
                      padding: '4px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: testClient === 'gmail' ? 'var(--red-corporate)' : 'transparent',
                      color: testClient === 'gmail' ? '#FFFFFF' : '#64748B'
                    }}
                  >
                    Gmail
                  </button>
                  <button 
                    onClick={() => setTestClient('outlook')}
                    style={{
                      padding: '4px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: testClient === 'outlook' ? 'var(--navy-primary)' : 'transparent',
                      color: testClient === 'outlook' ? '#FFFFFF' : '#64748B'
                    }}
                  >
                    Outlook
                  </button>
                </div>

                {/* View Mode toggles */}
                <div style={{ display: 'flex', gap: '6px', fontSize: '11px' }}>
                  <button 
                    onClick={() => setTestMode('live')}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: testMode === 'live' ? 700 : 500,
                      color: testMode === 'live' ? 'var(--red-corporate)' : '#64748B',
                      backgroundColor: testMode === 'live' ? '#FEF2F2' : 'transparent',
                      border: testMode === 'live' ? '1px solid #FCA5A5' : '1px solid #E2E8F0'
                    }}
                  >
                    Live Email
                  </button>
                  <button 
                    onClick={() => setTestMode('sig-only')}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: testMode === 'sig-only' ? 700 : 500,
                      color: testMode === 'sig-only' ? 'var(--red-corporate)' : '#64748B',
                      backgroundColor: testMode === 'sig-only' ? '#FEF2F2' : 'transparent',
                      border: testMode === 'sig-only' ? '1px solid #FCA5A5' : '1px solid #E2E8F0'
                    }}
                  >
                    Signature Only
                  </button>
                </div>
              </div>
            </div>

            {/* Gmail Composer Window */}
            <div className="gmail-composer-card">
              {/* Window Header */}
              <div className="gmail-window-header">
                <div className="gmail-title-left">
                  <span className="gmail-icon-m">M</span>
                  <span>New Message</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', color: '#64748B', fontSize: '14px', cursor: 'pointer' }}>
                  <span>—</span>
                  <span>↗</span>
                  <span>✕</span>
                </div>
              </div>

              {/* To / Subject Fields */}
              <div className="gmail-fields-wrap">
                <div className="gmail-field-row">
                  <span className="gmail-field-label">To</span>
                  <input 
                    type="text" 
                    className="gmail-field-input" 
                    defaultValue="client@example.com" 
                  />
                  <div style={{ display: 'flex', gap: '8px', color: '#64748B', fontSize: '11.5px', cursor: 'pointer' }}>
                    <span>Cc</span>
                    <span>Bcc</span>
                  </div>
                </div>
                <div className="gmail-field-row">
                  <span className="gmail-field-label">Subject</span>
                  <input 
                    type="text" 
                    className="gmail-field-input" 
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>
              </div>

              {/* Body + Inserted Master Signature */}
              <div className="gmail-body-area">
                {testMode === 'live' && (
                  <div className="gmail-message-text">
                    <p style={{ margin: '0 0 12px 0' }}>Dear Sir/Madam,</p>
                    <p style={{ margin: '0 0 12px 0' }}>Thank you for contacting ALAM ENGAZ Port Services Co.</p>
                    <p style={{ margin: '0 0 24px 0' }}>We are pleased to assist you with your requirements.</p>
                  </div>
                )}

                {/* REAL MASTER SIGNATURE COMPONENT */}
                <div style={{ marginTop: testMode === 'live' ? '8px' : '0' }}>
                  <OfficialSignature 
                    employee={employee} 
                    showActions={false}
                    customization={customization}
                    clean={true}
                    showVerifiedBadge={false}
                  />
                </div>
              </div>

              {/* Gmail Rich Formatting Toolbar */}
              <div style={{
                padding: '6px 16px',
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#64748B',
                fontSize: '13px',
                backgroundColor: '#FAFAFA'
              }}>
                <span title="Undo" style={{ cursor: 'pointer' }}>↶</span>
                <span title="Redo" style={{ cursor: 'pointer' }}>↷</span>
                <span style={{ height: '14px', width: '1px', backgroundColor: '#CBD5E1' }}></span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>Sans Serif ▾</span>
                <span style={{ height: '14px', width: '1px', backgroundColor: '#CBD5E1' }}></span>
                <span title="Bold" style={{ fontWeight: 800, color: '#1E293B', cursor: 'pointer' }}>B</span>
                <span title="Italic" style={{ fontStyle: 'italic', cursor: 'pointer' }}>I</span>
                <span title="Underline" style={{ textDecoration: 'underline', cursor: 'pointer' }}>U</span>
                <span title="Text Color" style={{ color: '#DC2626', fontWeight: 700, cursor: 'pointer' }}>A ▾</span>
                <span style={{ height: '14px', width: '1px', backgroundColor: '#CBD5E1' }}></span>
                <span title="Attach files" style={{ cursor: 'pointer' }}>📎</span>
                <span title="Insert link" style={{ cursor: 'pointer' }}>🔗</span>
                <span title="Insert emoji" style={{ cursor: 'pointer' }}>😀</span>
                <span title="Insert files using Drive" style={{ cursor: 'pointer' }}>💾</span>
                <span title="Insert photo" style={{ cursor: 'pointer' }}>📷</span>
                <span title="Toggle confidential mode" style={{ cursor: 'pointer' }}>🔒</span>
                <span title="Insert signature" style={{ cursor: 'pointer' }}>🖊️</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', cursor: 'pointer' }}>
                  <span>︙</span>
                  <span>🗑️</span>
                </div>
              </div>

              {/* Gmail/Outlook Action Toolbar */}
              <div className="gmail-toolbar-row">
                <div className="gmail-tools-icons">
                  {/* DEMO-only Send button */}
                  <button className="btn-gmail-send" onClick={() => showToast('Demo Mode: No actual email is sent.')}>
                    <span>Send</span> <span>▾</span>
                  </button>

                  {/* Copy Signature — copies real HTML to clipboard */}
                  <button
                    className="btn-gmail-test"
                    style={{ backgroundColor: '#8B0021', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 14px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                    onClick={handleCopyHtml}
                    id="btn-copy-sig-from-test"
                  >
                    📋 Copy Signature
                  </button>

                  {/* Paste into Test — copies + marks signature as pasted into composer */}
                  <button
                    className="btn-gmail-test"
                    style={{ backgroundColor: '#0B2A55', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 14px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                    onClick={handlePasteIntoTest}
                    id="btn-paste-sig-into-test"
                  >
                    ✦ Paste into {testClient === 'gmail' ? 'Gmail' : 'Outlook'} Test
                  </button>

                  <button
                    className="btn-gmail-clear"
                    onClick={() => { setEmailBody(''); showToast('Message body cleared.'); }}
                  >
                    Clear
                  </button>
                </div>

                {/* Paste success badge */}
                {pasteSuccess && (
                  <div style={{
                    backgroundColor: '#ECFDF5', color: '#059669',
                    border: '1px solid #A7F3D0', padding: '4px 12px',
                    borderRadius: '16px', fontSize: '12px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    <span>✓</span>
                    <span>Signature pasted into {testClient === 'gmail' ? 'Gmail' : 'Outlook'} test!</span>
                  </div>
                )}
                {!pasteSuccess && showInsertedBadge && (
                  <div style={{
                    backgroundColor: '#EFF6FF', color: '#1D4ED8',
                    border: '1px solid #BFDBFE', padding: '4px 12px',
                    borderRadius: '16px', fontSize: '12px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    <span>●</span>
                    <span>Signature live in composer — click "Copy Signature" then paste into real {testClient === 'gmail' ? 'Gmail' : 'Outlook'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

      </div>
      </div>

      {/* Requirement #14: Confirmation Modal for Delete Signature */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete saved signature?"
        message="Are you sure you want to delete your custom signature configuration? The default master signature configuration will be restored."
        confirmLabel="Delete Signature"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleDeleteSignatureConfirm}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};
