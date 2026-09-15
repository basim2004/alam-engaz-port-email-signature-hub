import React, { useState, useRef, useEffect } from 'react';
import { PageRoute } from '../types';
import { getMasterWebsiteData, subscribeToWebsiteData, InstallationGuideContent } from '../services/websiteContentService';

interface InstallationGuideViewProps {
  onNavigate: (route: PageRoute) => void;
}

export const InstallationGuideView: React.FC<InstallationGuideViewProps> = ({ onNavigate }) => {
  const [activeItem, setActiveItem] = useState<string>('getting-started');
  const [guideData, setGuideData] = useState<InstallationGuideContent>(() => getMasterWebsiteData().installation);

  useEffect(() => {
    const unsub = subscribeToWebsiteData(data => {
      setGuideData(data.installation);
    });
    return unsub;
  }, []);

  const gettingStartedRef = useRef<HTMLDivElement>(null);
  const gmailRef = useRef<HTMLDivElement>(null);
  const outlookWebRef = useRef<HTMLDivElement>(null);
  const outlookDesktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const troubleshootingRef = useRef<HTMLDivElement>(null);
  const tipsRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (id: string, ref: React.RefObject<HTMLDivElement | null>) => {
    setActiveItem(id);
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="installation-guide-page-wrap">
      {/* ================= HERO SECTION ================= */}
      <section className="guide-hero-section">
        <div className="guide-hero-overlay" />
        
        <div className="guide-hero-container">
          <div className="guide-hero-left">
            <div className="guide-hero-preheading">
              {guideData.heroPreheading || 'SETUP · USE · STAY PROFESSIONAL'}
            </div>

            <h1 className="guide-hero-title-wrap">
              <span className="guide-title-installation">{guideData.heroTitle.split(' ')[0] || 'INSTALLATION'} </span>
              <span className="guide-title-guide">{guideData.heroTitle.split(' ').slice(1).join(' ') || 'GUIDE'}</span>
            </h1>

            <p className="guide-hero-subtext">
              {guideData.heroSubtext || 'Step-by-step instructions to set up your ALAM ENGAZ email signature in Gmail, Outlook and other email clients.'}
            </p>

            {/* 3 Simple Highlights Matching Reference */}
            <div className="guide-hero-highlights">
              <div className="guide-highlight-item">
                <div className="guide-highlight-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66z"/>
                  </svg>
                </div>
                <div className="guide-highlight-text">
                  <span className="guide-highlight-title">Easy Setup</span>
                  <span className="guide-highlight-desc">for Everyone</span>
                </div>
              </div>

              <div className="guide-highlight-vsep" />

              <div className="guide-highlight-item">
                <div className="guide-highlight-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </div>
                <div className="guide-highlight-text">
                  <span className="guide-highlight-title">Professional</span>
                  <span className="guide-highlight-desc">Brand Identity</span>
                </div>
              </div>

              <div className="guide-highlight-vsep" />

              <div className="guide-highlight-item">
                <div className="guide-highlight-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                  </svg>
                </div>
                <div className="guide-highlight-text">
                  <span className="guide-highlight-title">Consistent</span>
                  <span className="guide-highlight-desc">Communication</span>
                </div>
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

      {/* ================= MAIN TWO-COLUMN WORKSPACE ================= */}
      <div className="guide-layout-container">
        
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className="guide-sidebar">
          {/* Navigation Menu Card */}
          <div className="guide-nav-card">
            {/* 1. Getting Started */}
            <button
              onClick={() => scrollToSection('getting-started', gettingStartedRef)}
              className={`guide-nav-btn ${activeItem === 'getting-started' ? 'active' : ''}`}
              id="guide-nav-getting-started"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>Getting Started</span>
            </button>

            {/* 2. Gmail (Web) */}
            <button
              onClick={() => scrollToSection('gmail-web', gmailRef)}
              className={`guide-nav-btn ${activeItem === 'gmail-web' ? 'active' : ''}`}
              id="guide-nav-gmail-web"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22 6c0-.94-.57-1.74-1.39-2.07L12 9.25 3.39 3.93C2.57 4.26 2 5.06 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6z"/>
                <path fill="#34A853" d="M22 6l-10 6.25L2 6"/>
                <path fill="#EA4335" d="M20.61 3.93L12 9.25 3.39 3.93A2.008 2.008 0 0 0 2 6v1l10 6.25L22 7V6c0-.85-.53-1.58-1.39-2.07z"/>
                <path fill="#FBBC05" d="M2 7v11c0 1.1.9 2 2 2h2V9.5L2 7z"/>
                <path fill="#4285F4" d="M22 7v11c0 1.1-.9 2-2 2h-2V9.5L22 7z"/>
              </svg>
              <span>Gmail (Web)</span>
            </button>

            {/* 3. Outlook (Web) */}
            <button
              onClick={() => scrollToSection('outlook-web', outlookWebRef)}
              className={`guide-nav-btn ${activeItem === 'outlook-web' ? 'active' : ''}`}
              id="guide-nav-outlook-web"
            >
              <div style={{ width: '18px', height: '18px', borderRadius: '3px', backgroundColor: '#0078D4', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900 }}>O</div>
              <span>Outlook (Web)</span>
            </button>

            {/* 4. Outlook (Desktop) */}
            <button
              onClick={() => scrollToSection('outlook-desktop', outlookDesktopRef)}
              className={`guide-nav-btn ${activeItem === 'outlook-desktop' ? 'active' : ''}`}
              id="guide-nav-outlook-desktop"
            >
              <div style={{ width: '18px', height: '18px', borderRadius: '3px', backgroundColor: '#004B87', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900 }}>O</div>
              <span>Outlook (Desktop)</span>
            </button>

            {/* 5. Mobile (iPhone) */}
            <button
              onClick={() => scrollToSection('mobile-iphone', mobileRef)}
              className={`guide-nav-btn ${activeItem === 'mobile-iphone' ? 'active' : ''}`}
              id="guide-nav-mobile-iphone"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
              <span>Mobile (iPhone)</span>
            </button>

            {/* 6. Mobile (Android) */}
            <button
              onClick={() => scrollToSection('mobile-android', mobileRef)}
              className={`guide-nav-btn ${activeItem === 'mobile-android' ? 'active' : ''}`}
              id="guide-nav-mobile-android"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#3DDC84">
                <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1 0-.5514.4482-1 .9993-1 .5511 0 .9993.4486.9993 1 0 .5514-.4482 1-.9993 1m-11.046 0c-.5511 0-.9993-.4486-.9993-1 0-.5514.4482-1 .9993-1 .5511 0 .9993.4486.9993 1 0 .5514-.4482 1-.9993 1m11.4045-6.02l1.9973-3.4592a.416.416 0 0 0-.1521-.5676.416.416 0 0 0-.5676.1521l-2.0223 3.503C15.5902 8.4114 13.8533 8.1 12 8.1c-1.8533 0-3.5902.3114-5.1368.8497L4.8409 5.4467a.416.416 0 0 0-.5676-.1521.416.416 0 0 0-.1521.5676l1.9973 3.4592C2.6889 11.1867 1.0003 14.426 1 18.0003h22c-.0003-3.5743-1.6889-6.8136-5.1185-8.6789"/>
              </svg>
              <span>Mobile (Android)</span>
            </button>

            {/* 7. Troubleshooting */}
            <button
              onClick={() => scrollToSection('troubleshooting', troubleshootingRef)}
              className={`guide-nav-btn ${activeItem === 'troubleshooting' ? 'active' : ''}`}
              id="guide-nav-troubleshooting"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Troubleshooting</span>
            </button>

            {/* 8. Tips & Best Practices */}
            <button
              onClick={() => scrollToSection('tips', tipsRef)}
              className={`guide-nav-btn ${activeItem === 'tips' ? 'active' : ''}`}
              id="guide-nav-tips"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="9" y1="18" x2="15" y2="18"></line>
                <line x1="10" y1="22" x2="14" y2="22"></line>
                <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
              </svg>
              <span>Tips &amp; Best Practices</span>
            </button>

            {/* 9. FAQ */}
            <button
              onClick={() => scrollToSection('faq', faqRef)}
              className={`guide-nav-btn ${activeItem === 'faq' ? 'active' : ''}`}
              id="guide-nav-faq"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span>FAQ</span>
            </button>
          </div>

          {/* Need Help Support Card */}
          <div className="guide-support-box">
            <div className="guide-support-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
              </svg>
            </div>
            <div>
              <div className="guide-support-title">Need Help?</div>
              <div className="guide-support-desc">Contact IT Support</div>
              <a href="mailto:it@alamengaz.com" className="guide-support-email">
                it@alamengaz.com
              </a>
            </div>
          </div>
        </aside>

        {/* ================= RIGHT INSTRUCTION CONTENT ================= */}
        <div className="guide-content-col">

          {/* 1. GETTING STARTED */}
          <div className="guide-card" id="section-getting-started" ref={gettingStartedRef}>
            <div className="guide-card-header">
              <div className="guide-header-left">
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#FEF2F2',
                  color: 'var(--red-corporate)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px'
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                </div>
                <div>
                  <h2 className="guide-title">Getting Started</h2>
                  <p className="guide-subtitle">Follow these simple steps to install your official ALAM ENGAZ email signature.</p>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>
                  Use the Signature Studio to generate your signature first.
                </div>
                <button 
                  onClick={() => onNavigate('signature-studio')}
                  style={{
                    backgroundColor: 'var(--red-corporate)',
                    color: '#FFFFFF',
                    padding: '8px 18px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  id="btn-open-signature-studio"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                  <span>Open Signature Studio</span>
                </button>
              </div>
            </div>

            {/* 3 Steps Row */}
            <div className="getting-started-steps-row">
              <div className="step-card-box">
                <div className="step-circle-num">1</div>
                <div>
                  <h3 className="step-card-title">Create Your Signature</h3>
                  <p className="step-card-desc">Enter your details and customize in Signature Studio.</p>
                </div>
              </div>

              <div className="step-chevron">&gt;</div>

              <div className="step-card-box">
                <div className="step-circle-num">2</div>
                <div>
                  <h3 className="step-card-title">Copy the Signature</h3>
                  <p className="step-card-desc">Use the "Copy HTML" button from Signature Studio.</p>
                </div>
              </div>

              <div className="step-chevron">&gt;</div>

              <div className="step-card-box">
                <div className="step-circle-num">3</div>
                <div>
                  <h3 className="step-card-title">Install in Your Email</h3>
                  <p className="step-card-desc">Follow the steps below for your email client.</p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. GMAIL (WEB) */}
          <div className="guide-card" id="section-gmail-web" ref={gmailRef}>
            <div className="guide-card-header">
              <div className="guide-header-left">
                <svg width="32" height="32" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22 6c0-.94-.57-1.74-1.39-2.07L12 9.25 3.39 3.93C2.57 4.26 2 5.06 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6z"/>
                  <path fill="#34A853" d="M22 6l-10 6.25L2 6"/>
                  <path fill="#EA4335" d="M20.61 3.93L12 9.25 3.39 3.93A2.008 2.008 0 0 0 2 6v1l10 6.25L22 7V6c0-.85-.53-1.58-1.39-2.07z"/>
                  <path fill="#FBBC05" d="M2 7v11c0 1.1.9 2 2 2h2V9.5L2 7z"/>
                  <path fill="#4285F4" d="M22 7v11c0 1.1-.9 2-2 2h-2V9.5L22 7z"/>
                </svg>
                <div>
                  <h2 className="guide-title">Gmail (Web)</h2>
                  <p className="guide-subtitle">Follow these steps to add your signature in Gmail (Web Browser).</p>
                </div>
              </div>

              <span style={{
                backgroundColor: '#ECFDF5',
                color: '#059669',
                border: '1px solid #A7F3D0',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span>✓</span>
                <span>Recommended</span>
              </span>
            </div>

            <div className="instruction-split-grid">
              {/* Left: 6 Steps */}
              <div className="steps-list">
                <div className="step-item-row">
                  <div className="step-circle-num">1</div>
                  <div className="step-item-text">
                    Open <strong>Gmail</strong> and click the ⚙️ <strong>Settings</strong> icon (top right).
                  </div>
                </div>

                <div className="step-item-row">
                  <div className="step-circle-num">2</div>
                  <div className="step-item-text">
                    Click <strong>"See all settings"</strong>.
                  </div>
                </div>

                <div className="step-item-row">
                  <div className="step-circle-num">3</div>
                  <div className="step-item-text">
                    In the <strong>General</strong> tab, scroll down to the <strong>"Signature"</strong> section.
                  </div>
                </div>

                <div className="step-item-row">
                  <div className="step-circle-num">4</div>
                  <div className="step-item-text">
                    Click <strong>"+ Create new"</strong>, give it a name (e.g. <strong>ALAM ENGAZ</strong>).
                  </div>
                </div>

                <div className="step-item-row">
                  <div className="step-circle-num">5</div>
                  <div className="step-item-text">
                    Paste the copied signature (<strong>Ctrl + V</strong>) into the signature box.
                  </div>
                </div>

                <div className="step-item-row">
                  <div className="step-circle-num">6</div>
                  <div className="step-item-text">
                    Scroll down and click <strong>"Save Changes"</strong>.
                  </div>
                </div>
              </div>

              {/* Right: Realistic Gmail Settings UI Mockup */}
              <div className="mockup-window">
                <div className="mockup-header-bar">
                  <span>Settings</span>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>gmail.com</span>
                </div>
                <div className="mockup-body" style={{ backgroundColor: '#FAFAFA' }}>
                  <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px', marginBottom: '10px', fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
                    <span style={{ color: '#0B57D0', borderBottom: '2px solid #0B57D0', paddingBottom: '4px' }}>General</span>
                    <span>Labels</span>
                    <span>Inbox</span>
                    <span>Accounts</span>
                    <span>Filters and Blocked Addresses</span>
                  </div>

                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '2px' }}>
                    Signature:
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748B', marginBottom: '8px' }}>
                    (appended at the end of all outgoing messages) &nbsp;<span style={{ color: '#0B57D0', cursor: 'pointer' }}>Learn more</span>
                  </div>

                  <div style={{ border: '1px solid #CBD5E1', borderRadius: '4px', backgroundColor: '#FFFFFF', padding: '8px', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 700, color: '#0B2A55', fontSize: '12px', marginBottom: '4px' }}>
                      ALAM ENGAZ
                    </div>
                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '6px', display: 'flex', gap: '10px', color: '#64748B', fontSize: '11px' }}>
                      <span>Sans Serif ▾</span>
                      <span><strong>B</strong></span>
                      <span><em>I</em></span>
                      <span><u>U</u></span>
                      <span>A ▾</span>
                      <span>🔗</span>
                      <span>⋮</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <button style={{ padding: '4px 10px', fontSize: '11px', border: '1px solid #CBD5E1', borderRadius: '3px', backgroundColor: '#FFFFFF', fontWeight: 600, color: '#0B57D0' }}>
                      + Create new
                    </button>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button style={{ padding: '5px 12px', fontSize: '11px', backgroundColor: '#0B57D0', color: '#FFFFFF', borderRadius: '3px', fontWeight: 700, border: 'none' }}>
                        Save Changes
                      </button>
                      <button style={{ padding: '5px 10px', fontSize: '11px', border: '1px solid #CBD5E1', borderRadius: '3px', backgroundColor: '#FFFFFF' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. OUTLOOK (WEB) */}
          <div className="guide-card" id="section-outlook-web" ref={outlookWebRef}>
            <div className="guide-card-header">
              <div className="guide-header-left">
                <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#0078D4', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900 }}>O</div>
                <div>
                  <h2 className="guide-title">Outlook (Web)</h2>
                  <p className="guide-subtitle">Follow these steps to add your signature in Outlook on the web (Outlook.com / Office 365).</p>
                </div>
              </div>
            </div>

            <div className="instruction-split-grid">
              {/* Left: 5 Steps */}
              <div className="steps-list">
                <div className="step-item-row">
                  <div className="step-circle-num">1</div>
                  <div className="step-item-text">
                    Click the ⚙️ <strong>Settings</strong> icon (top right).
                  </div>
                </div>

                <div className="step-item-row">
                  <div className="step-circle-num">2</div>
                  <div className="step-item-text">
                    Go to <strong>"Mail"</strong> &rarr; <strong>"Compose and reply"</strong>.
                  </div>
                </div>

                <div className="step-item-row">
                  <div className="step-circle-num">3</div>
                  <div className="step-item-text">
                    In the <strong>"Email signature"</strong> section, paste your signature.
                  </div>
                </div>

                <div className="step-item-row">
                  <div className="step-circle-num">4</div>
                  <div className="step-item-text">
                    You can give it a name and set it as default.
                  </div>
                </div>

                <div className="step-item-row">
                  <div className="step-circle-num">5</div>
                  <div className="step-item-text">
                    Click <strong>"Save"</strong>.
                  </div>
                </div>
              </div>

              {/* Right: Realistic Outlook Web Settings UI Mockup */}
              <div className="mockup-window">
                <div className="mockup-header-bar" style={{ backgroundColor: '#0078D4', color: '#FFFFFF' }}>
                  <span>Outlook Web Settings</span>
                  <span style={{ fontSize: '11px', color: '#E0F2FE' }}>office.com</span>
                </div>
                <div className="mockup-body" style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: '12px' }}>
                  <div style={{ borderRight: '1px solid #E2E8F0', paddingRight: '8px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ color: '#64748B' }}>⚙️ General</span>
                    <span style={{ color: '#0078D4', fontWeight: 700, backgroundColor: '#EFF6FF', padding: '3px 6px', borderRadius: '3px' }}>✉️ Mail</span>
                    <span style={{ color: '#64748B' }}>📅 Calendar</span>
                    <span style={{ color: '#64748B' }}>👥 People</span>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '2px' }}>Compose and reply</div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '6px' }}>Email signature</div>
                    <div style={{ border: '1px solid #CBD5E1', borderRadius: '4px', padding: '8px', fontSize: '11px', backgroundColor: '#FFFFFF', marginBottom: '6px' }}>
                      <div style={{ fontWeight: 700, color: '#0B2A55' }}>ALAM ENGAZ</div>
                      <div style={{ borderTop: '1px solid #F1F5F9', marginTop: '6px', paddingTop: '4px', display: 'flex', gap: '8px', color: '#64748B', fontSize: '10px' }}>
                        <span>A</span>
                        <span><strong>B</strong></span>
                        <span><em>I</em></span>
                        <span><u>U</u></span>
                        <span>🔗</span>
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: '#334155' }}>
                      <input type="checkbox" defaultChecked style={{ accentColor: '#0078D4' }} />
                      <span>Automatically include my signature on new messages I compose</span>
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '10px' }}>
                      <button style={{ padding: '4px 12px', fontSize: '11px', backgroundColor: '#0078D4', color: '#FFFFFF', borderRadius: '3px', fontWeight: 700, border: 'none' }}>Save</button>
                      <button style={{ padding: '4px 10px', fontSize: '11px', border: '1px solid #CBD5E1', borderRadius: '3px', backgroundColor: '#FFFFFF' }}>Discard</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. OUTLOOK (DESKTOP) */}
          <div className="guide-card" id="section-outlook-desktop" ref={outlookDesktopRef}>
            <div className="guide-card-header">
              <div className="guide-header-left">
                <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#004B87', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900 }}>O</div>
                <div>
                  <h2 className="guide-title">Outlook (Desktop)</h2>
                  <p className="guide-subtitle">Follow these steps to add your signature in Microsoft Outlook (Windows).</p>
                </div>
              </div>
            </div>

            <div className="instruction-split-grid">
              {/* Left: 5 Steps */}
              <div className="steps-list">
                <div className="step-item-row">
                  <div className="step-circle-num">1</div>
                  <div className="step-item-text">
                    Open Outlook and go to <strong>File</strong> &rarr; <strong>Options</strong>.
                  </div>
                </div>

                <div className="step-item-row">
                  <div className="step-circle-num">2</div>
                  <div className="step-item-text">
                    Click <strong>"Mail"</strong> &rarr; <strong>"Signatures..."</strong>.
                  </div>
                </div>

                <div className="step-item-row">
                  <div className="step-circle-num">3</div>
                  <div className="step-item-text">
                    Click <strong>"New"</strong>, give it a name.
                  </div>
                </div>

                <div className="step-item-row">
                  <div className="step-circle-num">4</div>
                  <div className="step-item-text">
                    Paste your signature in the edit box.
                  </div>
                </div>

                <div className="step-item-row">
                  <div className="step-circle-num">5</div>
                  <div className="step-item-text">
                    Click <strong>"OK"</strong> to save.
                  </div>
                </div>
              </div>

              {/* Right: Realistic Windows Dialog Mockup */}
              <div className="mockup-window">
                <div className="mockup-header-bar" style={{ backgroundColor: '#F3F4F6' }}>
                  <span>Signatures and Stationery</span>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>✕</span>
                </div>
                <div className="mockup-body" style={{ fontSize: '11px' }}>
                  <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px', marginBottom: '8px', fontWeight: 600 }}>
                    <span style={{ color: '#004B87', borderBottom: '2px solid #004B87' }}>E-mail Signature</span>
                    <span style={{ color: '#64748B' }}>Personal Stationery</span>
                  </div>

                  <div style={{ border: '1px solid #CBD5E1', padding: '5px 8px', backgroundColor: '#F8FAFC', marginBottom: '6px' }}>
                    <span style={{ backgroundColor: '#004B87', color: '#FFFFFF', padding: '2px 8px', borderRadius: '2px', fontWeight: 700 }}>ALAM ENGAZ</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                    <button style={{ padding: '3px 10px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', borderRadius: '2px' }}>New</button>
                    <button style={{ padding: '3px 10px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', borderRadius: '2px' }}>Delete</button>
                    <button style={{ padding: '3px 10px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', borderRadius: '2px' }}>Rename</button>
                  </div>

                  <div style={{ border: '1px solid #CBD5E1', padding: '8px', borderRadius: '3px', backgroundColor: '#FFFFFF' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--navy-primary)' }}>ALAM ENGAZ</div>
                    <div style={{ display: 'flex', gap: '8px', color: '#64748B', fontSize: '10px', marginTop: '4px' }}>
                      <span>Calibri ▾</span>
                      <span><strong>B</strong></span>
                      <span><em>I</em></span>
                      <span><u>U</u></span>
                      <span>A ▾</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '10px' }}>
                    <button style={{ padding: '4px 14px', border: '1px solid #004B87', borderRadius: '2px', backgroundColor: '#004B87', color: '#FFFFFF', fontWeight: 700 }}>OK</button>
                    <button style={{ padding: '4px 10px', border: '1px solid #CBD5E1', borderRadius: '2px', backgroundColor: '#FFFFFF' }}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. MOBILE (SIDE-BY-SIDE CARDS) */}
          <div className="mobile-dual-grid" id="section-mobile" ref={mobileRef}>
            {/* iPhone iOS */}
            <div className="mobile-client-card">
              <div className="mobile-client-header">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.66-1.09 1.73-.95 2.76.99.08 2.05-.51 2.68-1.26z"/>
                </svg>
                <span>iPhone (iOS)</span>
              </div>

              <div className="steps-list" style={{ marginBottom: '18px' }}>
                <div className="step-item-row">
                  <div className="step-circle-num">1</div>
                  <div className="step-item-text">Go to <strong>Settings</strong> &rarr; <strong>Mail</strong> &rarr; <strong>Signature</strong>.</div>
                </div>
                <div className="step-item-row">
                  <div className="step-circle-num">2</div>
                  <div className="step-item-text">Paste your copied signature.</div>
                </div>
                <div className="step-item-row">
                  <div className="step-circle-num">3</div>
                  <div className="step-item-text">You may need to use <strong>"Paste as Rich Text"</strong>.</div>
                </div>
                <div className="step-item-row">
                  <div className="step-circle-num">4</div>
                  <div className="step-item-text">Your signature will be added to all outgoing emails.</div>
                </div>
              </div>

              {/* iPhone Mockup */}
              <div className="mockup-window">
                <div className="mockup-header-bar" style={{ backgroundColor: '#F8FAFC' }}>
                  <span>&lt; Mail</span>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Signature</span>
                  <span>✕</span>
                </div>
                <div className="mockup-body" style={{ fontSize: '11px' }}>
                  <div style={{ color: '#64748B', fontSize: '10.5px', marginBottom: '4px' }}>Account: Work</div>
                  <div style={{ border: '1px solid #E2E8F0', padding: '8px', borderRadius: '4px', backgroundColor: '#FFFFFF', marginBottom: '8px' }}>
                    <strong style={{ color: 'var(--navy-primary)' }}>ALAM ENGAZ</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#334155' }}>All Accounts</span>
                    <span style={{ width: '32px', height: '18px', borderRadius: '10px', backgroundColor: '#10B981', display: 'inline-block' }}></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Android */}
            <div className="mobile-client-card">
              <div className="mobile-client-header">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#3DDC84">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1 0-.5514.4482-1 .9993-1 .5511 0 .9993.4486.9993 1 0 .5514-.4482 1-.9993 1m-11.046 0c-.5511 0-.9993-.4486-.9993-1 0-.5514.4482-1 .9993-1 .5511 0 .9993.4486.9993 1 0 .5514-.4482 1-.9993 1m11.4045-6.02l1.9973-3.4592a.416.416 0 0 0-.1521-.5676.416.416 0 0 0-.5676.1521l-2.0223 3.503C15.5902 8.4114 13.8533 8.1 12 8.1c-1.8533 0-3.5902.3114-5.1368.8497L4.8409 5.4467a.416.416 0 0 0-.5676-.1521.416.416 0 0 0-.1521.5676l1.9973 3.4592C2.6889 11.1867 1.0003 14.426 1 18.0003h22c-.0003-3.5743-1.6889-6.8136-5.1185-8.6789"/>
                </svg>
                <span>Android</span>
              </div>

              <div className="steps-list" style={{ marginBottom: '18px' }}>
                <div className="step-item-row">
                  <div className="step-circle-num">1</div>
                  <div className="step-item-text">Open the <strong>Gmail app</strong>.</div>
                </div>
                <div className="step-item-row">
                  <div className="step-circle-num">2</div>
                  <div className="step-item-text">Go to <strong>Settings</strong> &rarr; your account.</div>
                </div>
                <div className="step-item-row">
                  <div className="step-circle-num">3</div>
                  <div className="step-item-text">Tap <strong>"Mobile signature"</strong>.</div>
                </div>
                <div className="step-item-row">
                  <div className="step-circle-num">4</div>
                  <div className="step-item-text">Paste your signature and save.</div>
                </div>
                <div className="step-item-row">
                  <div className="step-circle-num">5</div>
                  <div className="step-item-text">It will be added to all outgoing emails from that account.</div>
                </div>
              </div>

              {/* Android Mockup */}
              <div className="mockup-window">
                <div className="mockup-header-bar" style={{ backgroundColor: '#F8FAFC' }}>
                  <span>&larr; Mobile signature</span>
                </div>
                <div className="mockup-body" style={{ fontSize: '11px' }}>
                  <div style={{ border: '1px solid #CBD5E1', padding: '8px', borderRadius: '4px', backgroundColor: '#FFFFFF', marginBottom: '10px' }}>
                    <strong style={{ color: 'var(--navy-primary)' }}>ALAM ENGAZ</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button style={{ padding: '3px 8px', border: 'none', color: '#64748B', fontWeight: 600, background: 'none', cursor: 'pointer' }}>Cancel</button>
                    <button style={{ padding: '3px 10px', border: 'none', color: '#0B57D0', fontWeight: 700, background: 'none', cursor: 'pointer' }}>OK</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 6. TROUBLESHOOTING */}
          <div className="guide-card" id="section-troubleshooting" ref={troubleshootingRef}>
            <div className="guide-card-header">
              <div className="guide-header-left">
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#EFF6FF',
                  color: '#0B57D0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div>
                  <h2 className="guide-title">Troubleshooting</h2>
                  <p className="guide-subtitle">Solutions to common email client formatting and signature issues.</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
              <div style={{ padding: '14px 18px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: 'var(--navy-primary)' }}>1. Logo appears broken or with a red "X"</strong>
                <p style={{ color: '#475569', marginTop: '4px' }}>
                  Ensure you are connected to the corporate network or internet so the public asset CDN loads properly. Also verify that your mail client allows remote images.
                </p>
              </div>

              <div style={{ padding: '14px 18px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <strong style={{ color: 'var(--navy-primary)' }}>2. Signature spacing looks enlarged in Outlook</strong>
                <p style={{ color: '#475569', marginTop: '4px' }}>
                  In Outlook Desktop, click <strong>File &gt; Options &gt; Mail &gt; Signatures</strong> and paste using <strong>Keep Source Formatting</strong>. Our master template is constructed with strict email-safe tables to prevent distortion.
                </p>
              </div>
            </div>
          </div>

          {/* 7. TIPS & BEST PRACTICES */}
          <div className="guide-card" id="section-tips" ref={tipsRef}>
            <div className="guide-card-header">
              <div className="guide-header-left">
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="9" y1="18" x2="15" y2="18"></line>
                    <line x1="10" y1="22" x2="14" y2="22"></line>
                    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
                  </svg>
                </div>
                <div>
                  <h2 className="guide-title">Tips &amp; Best Practices</h2>
                  <p className="guide-subtitle">Maintain brand compliance and clean email communication.</p>
                </div>
              </div>
            </div>

            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px', color: '#334155' }}>
              <li><strong>Do not alter company legal notices:</strong> The registered office address near Dammam Sea Port must remain intact on all official correspondence.</li>
              <li><strong>Use Rich Format:</strong> Always use the "Copy HTML" or "Copy Signature (Rich Format)" button from the Signature Studio.</li>
              <li><strong>Sync mobile devices:</strong> Set up the signature in Outlook Web so it syncs automatically to your mobile devices.</li>
            </ul>
          </div>

          {/* 8. FAQ */}
          <div className="guide-card" id="section-faq" ref={faqRef}>
            <div className="guide-card-header">
              <div className="guide-header-left">
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <div>
                  <h2 className="guide-title">Frequently Asked Questions</h2>
                  <p className="guide-subtitle">Answers to common signature installation queries.</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
              <div>
                <strong style={{ color: 'var(--navy-primary)' }}>Can I add custom social icons or personal quotes?</strong>
                <p style={{ color: '#475569', marginTop: '3px' }}>No. To maintain uniform corporate identity across Saudi Arabia, Bahrain, and India, the signature layout is locked to the approved executive standard.</p>
              </div>

              <div>
                <strong style={{ color: 'var(--navy-primary)' }}>How do I change my phone number or job title?</strong>
                <p style={{ color: '#475569', marginTop: '3px' }}>Please log in to the Employee Portal to submit an official profile update request, or contact IT Support at it@alamengaz.com.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
