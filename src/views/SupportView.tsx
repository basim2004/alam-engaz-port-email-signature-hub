import React, { useState } from 'react';
import { 
  DEFAULT_FEATURED_GUIDE, 
  DEFAULT_GUIDES, 
  DEFAULT_VIDEOS, 
  DEFAULT_FAQS, 
  DEFAULT_SUPPORT_CONTACT,
  GuideItem,
  VideoItem
} from '../data/supportData';

interface SupportViewProps {
  searchQuery?: string;
  onNavigate?: (route: any) => void;
}

export const SupportView: React.FC<SupportViewProps> = ({ searchQuery = '', onNavigate }) => {
  // Accordion open states
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');
  
  // Modals / Toasts
  const [activeModal, setActiveModal] = useState<'reader' | 'video' | 'coming-soon' | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const toggleFaq = (id: string) => {
    setOpenFaqId(prev => (prev === id ? null : id));
  };

  const handleDownloadGuide = (guide: GuideItem | typeof DEFAULT_FEATURED_GUIDE) => {
    if (guide.pdfUrl) {
      window.open(guide.pdfUrl, '_blank');
    } else {
      setModalData({
        title: guide.title,
        message: 'The official PDF document is being finalized by the ALAM ENGAZ IT Systems team. Authorized administrators can upload or replace this publication directly from the Admin Panel.'
      });
      setActiveModal('coming-soon');
    }
  };

  const handleDownloadAllZip = () => {
    setModalData({
      title: 'Complete Guides Archive (ZIP)',
      message: 'The unified ZIP package containing all 7 official signature guides and brand standards is scheduled for automated packaging. You can access individual guide topics online or contact it@alamengaz.com.'
    });
    setActiveModal('coming-soon');
  };

  const handleOpenVideo = (video: VideoItem) => {
    setModalData(video);
    setActiveModal('video');
  };

  const handleOpenReader = () => {
    setActiveModal('reader');
  };

  // Filter guides if search query is provided
  const filteredGuides = searchQuery.trim() 
    ? DEFAULT_GUIDES.filter(g => 
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        g.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : DEFAULT_GUIDES;

  return (
    <div className="support-page-wrap">
      {/* ================= HERO SECTION ================= */}
      <section className="support-hero-section">
        <div className="support-hero-overlay" />
        
        <div className="support-hero-container">
          <div className="support-hero-left">
            <div className="support-hero-preheading">
              HELP · LEARN · SOLVE · SUCCEED
            </div>

            <h1 className="support-hero-title-wrap">
              <span className="support-title-navy">SUPPORT </span>
              <span className="support-title-red">CENTER</span>
            </h1>

            <p className="support-hero-subtext">
              Guides, tutorials and support to help you use<br />
              ALAM ENGAZ email signatures with confidence.
            </p>

            <div className="support-badges-row">
              <div className="support-badge-item">
                <span className="support-badge-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 14H6c-.55 0-1-.45-1-1s.45-1 1-1h12c.55 0 1 .45 1 1s-.45 1-1 1zm0-4H6c-.55 0-1-.45-1-1s.45-1 1-1h12c.55 0 1 .45 1 1s-.45 1-1 1zm0-4H6c-.55 0-1-.45-1-1s.45-1 1-1h12c.55 0 1 .45 1 1s-.45 1-1 1z"/>
                  </svg>
                </span>
                <div className="support-badge-label">
                  <span className="badge-line-1">Step-by-Step</span>
                  <span className="badge-line-2">Guides</span>
                </div>
              </div>

              <div className="support-badge-item">
                <span className="support-badge-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
                  </svg>
                </span>
                <div className="support-badge-label">
                  <span className="badge-line-1">Easy</span>
                  <span className="badge-line-2">Installation</span>
                </div>
              </div>

              <div className="support-badge-item">
                <span className="support-badge-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1a9 9 0 0 0-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7a9 9 0 0 0-9-9z"/>
                  </svg>
                </span>
                <div className="support-badge-label">
                  <span className="badge-line-1">Expert</span>
                  <span className="badge-line-2">Support</span>
                </div>
              </div>

              <div className="support-badge-item">
                <span className="support-badge-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                  </svg>
                </span>
                <div className="support-badge-label">
                  <span className="badge-line-1">Reliable</span>
                  <span className="badge-line-2">Solutions</span>
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

      {/* Global Toast Notification */}
      {toastMessage && (
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
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= MAIN CONTENT CONTAINER ================= */}
      <div className="support-content-container">

        {/* ================= 1. FEATURED GUIDE (LARGE CARD) ================= */}
        <section className="featured-guide-card">
          {/* Recommended Badge */}
          <div className="featured-ribbon-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
            </svg>
            <span>{DEFAULT_FEATURED_GUIDE.badge}</span>
          </div>

          <div className="featured-guide-grid">
            {/* Left: 3D Book Mockup */}
            <div className="featured-book-col">
              <div className="book-3d-mockup" onClick={handleOpenReader} title="Click to preview guide">
                <div className="book-spine" />
                <div className="book-cover">
                  <div className="book-cover-header">
                    <img 
                      src="/assets/logo.png" 
                      alt="ALAM ENGAZ PORT SERVICES CO." 
                      className="book-cover-logo"
                    />
                  </div>
                  <div className="book-cover-image">
                    <img 
                      src="/assets/container-terminal.jpg" 
                      alt="Port Operations"
                      className="book-inner-photo"
                    />
                  </div>
                  <div className="book-cover-content">
                    <div className="book-banner-tag">EMAIL SIGNATURE HUB</div>
                    <div className="book-main-title">COMPLETE USER GUIDE</div>
                    <div className="book-version-tag">Version {DEFAULT_FEATURED_GUIDE.version}</div>
                  </div>
                  <div className="book-cover-footer">
                    <div className="book-footer-motto">MOVING BUSINESS FURTHER</div>
                    <div className="book-footer-locations">Dammam &nbsp;|&nbsp; Jeddah &nbsp;|&nbsp; Bahrain &nbsp;|&nbsp; India</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Details & Actions */}
            <div className="featured-info-col">
              <div className="featured-prelabel">FEATURED GUIDE</div>
              <h2 className="featured-main-title">
                <span style={{ color: 'var(--navy-primary)' }}>COMPLETE </span>
                <span style={{ color: 'var(--red-corporate)' }}>WEBSITE GUIDE</span>
              </h2>
              <p className="featured-description">
                {DEFAULT_FEATURED_GUIDE.description}
              </p>

              {/* Meta Pills */}
              <div className="featured-meta-row">
                <div className="featured-meta-pill">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <span>{DEFAULT_FEATURED_GUIDE.sectionsCount}</span>
                </div>

                <div className="featured-meta-pill">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                  <span>{DEFAULT_FEATURED_GUIDE.pagesCount}</span>
                </div>

                <div className="featured-meta-pill">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{DEFAULT_FEATURED_GUIDE.format}</span>
                </div>

                <div className="featured-meta-pill">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                  </svg>
                  <span>{DEFAULT_FEATURED_GUIDE.updatedStatus}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="featured-action-row">
                <button 
                  className="btn-featured-download"
                  onClick={() => handleDownloadGuide(DEFAULT_FEATURED_GUIDE)}
                  id="btn-download-featured-guide"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Download Full Guide PDF</span>
                </button>

                <button 
                  className="btn-featured-view"
                  onClick={handleOpenReader}
                  id="btn-view-featured-guide"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>View Guide</span>
                </button>
              </div>
            </div>

            {/* Right: Feature Checklist */}
            <div className="featured-checklist-col">
              <div className="featured-checklist-wrap">
                {DEFAULT_FEATURED_GUIDE.checklist.map((item, idx) => (
                  <div key={idx} className="featured-check-item">
                    <span className="featured-check-icon">✓</span>
                    <span className="featured-check-text">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= 2. GUIDES & DOWNLOADS ================= */}
        <section className="guides-section">
          {/* Section Header with Download All */}
          <div className="guides-section-header">
            <div>
              <h2 className="guides-title-wrap">
                <span style={{ color: 'var(--navy-primary)' }}>GUIDES &amp; </span>
                <span style={{ color: 'var(--red-corporate)' }}>DOWNLOADS</span>
              </h2>
              <p className="guides-subtext">
                Download individual guides or get the complete package.
              </p>
            </div>

            <div className="guides-header-actions">
              <button 
                className="btn-download-all-zip"
                onClick={handleDownloadAllZip}
                id="btn-download-all-guides"
              >
                <span className="btn-zip-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    <line x1="12" y1="11" x2="12" y2="17"></line>
                    <polyline points="9 14 12 17 15 14"></polyline>
                  </svg>
                </span>
                <div className="btn-zip-text-wrap">
                  <span className="btn-zip-main">Download All Guides (ZIP)</span>
                  <span className="btn-zip-sub">Download all guides in one file</span>
                </div>
              </button>

              <div className="guides-update-notice">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                <span>All guides are regularly updated.<br />Check back for the latest version.</span>
              </div>
            </div>
          </div>

          {/* 7-Card Grid */}
          <div className="guides-cards-grid">
            {filteredGuides.map((guide) => (
              <div key={guide.id} className="guide-card-item">
                <div className="guide-card-icon-wrap">
                  {/* Studio Icon */}
                  {guide.iconType === 'studio' && (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                  )}

                  {/* Installation Icon */}
                  {guide.iconType === 'install' && (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                  )}

                  {/* Gmail Icon */}
                  {guide.iconType === 'gmail' && (
                    <svg width="28" height="28" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6z" opacity="0.1"/>
                      <path fill="#EA4335" d="M20 4H4c-1.1 0-2 .9-2 2v.4l10 6.2 10-6.2V6c0-1.1-.9-2-2-2z"/>
                      <path fill="#4285F4" d="M22 6.4L12 12.6 2 6.4V18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6.4z"/>
                      <path fill="#FBBC05" d="M2 7l10 6.2L22 7v-.6L12 12.6 2 6.4z"/>
                    </svg>
                  )}

                  {/* Outlook Icon */}
                  {guide.iconType === 'outlook' && (
                    <svg width="28" height="28" viewBox="0 0 24 24">
                      <rect x="2" y="4" width="20" height="16" rx="2" fill="#0078D4"/>
                      <circle cx="12" cy="12" r="5" fill="#FFFFFF"/>
                      <text x="12" y="15.5" fontSize="10" fontWeight="900" textAnchor="middle" fill="#0078D4">O</text>
                    </svg>
                  )}

                  {/* Mobile Icon */}
                  {guide.iconType === 'mobile' && (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                      <line x1="12" y1="18" x2="12.01" y2="18"></line>
                    </svg>
                  )}

                  {/* Troubleshooting Icon */}
                  {guide.iconType === 'troubleshoot' && (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                    </svg>
                  )}

                  {/* Brand Guidelines Icon */}
                  {guide.iconType === 'brand' && (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0B2A55" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      <polyline points="9 12 11 14 15 10"></polyline>
                    </svg>
                  )}
                </div>

                <h3 className="guide-card-title">{guide.title}</h3>
                <p className="guide-card-desc">{guide.description}</p>
                <div className="guide-card-pages">PDF · {guide.pages} Pages</div>

                <button 
                  className="btn-guide-download"
                  onClick={() => handleDownloadGuide(guide)}
                  id={`btn-download-${guide.id}`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Download PDF</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ================= 3. THREE-COLUMN SECTION: VIDEOS | FAQ | HELP ================= */}
        <section className="support-tri-grid">
          
          {/* ================= COLUMN 1: VIDEO TUTORIALS ================= */}
          <div className="support-col-card" id="section-video-tutorials">
            <div className="col-header-row">
              <div className="col-badge-circle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </div>
              <div>
                <h3 className="col-title">VIDEO TUTORIALS</h3>
                <p className="col-desc">Watch short videos to learn quickly.</p>
              </div>
            </div>

            {/* Featured Video Box */}
            <div 
              className="featured-video-box"
              onClick={() => handleOpenVideo(DEFAULT_VIDEOS[0])}
              title="Click to play video"
            >
              <img 
                src="/assets/team-hero.jpg" 
                alt="How to Create Your Email Signature" 
                className="featured-video-thumb"
              />
              <div className="featured-video-overlay" />
              <div className="video-play-btn-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
                  <polygon points="6 4 20 12 6 20 6 4"></polygon>
                </svg>
              </div>
              <div className="featured-video-info">
                <span className="featured-video-name">{DEFAULT_VIDEOS[0].title}</span>
                <span className="video-duration-pill">{DEFAULT_VIDEOS[0].duration}</span>
              </div>
            </div>

            {/* Video List */}
            <div className="video-playlist">
              {DEFAULT_VIDEOS.slice(1).map((vid) => (
                <div 
                  key={vid.id} 
                  className="video-list-item"
                  onClick={() => handleOpenVideo(vid)}
                >
                  <div className="video-list-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="6 4 20 12 6 20 6 4"></polygon>
                    </svg>
                  </div>
                  <span className="video-list-title">{vid.title}</span>
                  <span className="video-list-duration">{vid.duration}</span>
                </div>
              ))}
            </div>

            {/* View All Videos Button */}
            <button 
              className="btn-col-action"
              onClick={() => handleOpenVideo(DEFAULT_VIDEOS[0])}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>View All Videos</span>
            </button>
          </div>

          {/* ================= COLUMN 2: FREQUENTLY ASKED QUESTIONS ================= */}
          <div className="support-col-card" id="section-faq">
            <div className="col-header-row">
              <div className="col-badge-circle">
                <span style={{ fontSize: '14px', fontWeight: 900 }}>?</span>
              </div>
              <div>
                <h3 className="col-title">FREQUENTLY ASKED QUESTIONS</h3>
                <p className="col-desc">Find quick answers to common questions.</p>
              </div>
            </div>

            {/* Accordion List */}
            <div className="faq-accordion-list">
              {DEFAULT_FAQS.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div key={faq.id} className={`faq-item ${isOpen ? 'faq-item-open' : ''}`}>
                    <button 
                      className="faq-question-btn"
                      onClick={() => toggleFaq(faq.id)}
                    >
                      <span className="faq-question-text">{faq.question}</span>
                      <span className={`faq-chevron ${isOpen ? 'chevron-rotated' : ''}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </span>
                    </button>
                    {isOpen && (
                      <div className="faq-answer-body">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* View All FAQs Button */}
            <button 
              className="btn-col-action"
              onClick={() => showToast('Displaying all 8 official corporate signature knowledgebase questions.')}
            >
              <span>View All FAQs</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </button>
          </div>

          {/* ================= COLUMN 3: NEED HELP? & QUICK TIP ================= */}
          <div className="support-col-right-stack">
            
            {/* Need Help Card */}
            <div className="support-col-card" id="section-need-help">
              <div className="col-header-row">
                <div className="col-badge-circle">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="col-title">NEED HELP?</h3>
                  <p className="col-desc">Our team is here to assist you.</p>
                </div>
              </div>

              {/* Email Support Item */}
              <div className="help-info-block">
                <div className="help-icon-circle">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </div>
                <div className="help-text-wrap">
                  <div className="help-item-title">Email Support</div>
                  <div className="help-item-sub">Send us your questions anytime.</div>
                  <a href={`mailto:${DEFAULT_SUPPORT_CONTACT.email}`} className="help-link-email">
                    {DEFAULT_SUPPORT_CONTACT.email}
                  </a>
                </div>
              </div>

              {/* Support Hours Item */}
              <div className="help-info-block">
                <div className="help-icon-circle">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                </div>
                <div className="help-text-wrap">
                  <div className="help-item-title">Support Hours</div>
                  <div className="help-item-sub">{DEFAULT_SUPPORT_CONTACT.hoursDays}</div>
                  <div className="help-item-time">{DEFAULT_SUPPORT_CONTACT.hoursTime}</div>
                </div>
              </div>

              {/* Live Support Item */}
              <div className="help-info-block">
                <div className="help-icon-circle">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                  </svg>
                </div>
                <div className="help-text-wrap">
                  <div className="help-item-title">Live Support <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>(Coming Soon)</span></div>
                  <div className="help-item-sub">Live chat support will be available soon.</div>
                </div>
              </div>
            </div>

            {/* Quick Tip Card */}
            <div className="quick-tip-box">
              <div className="quick-tip-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                </svg>
                <span className="quick-tip-title">Quick Tip</span>
              </div>
              <p className="quick-tip-text">
                For the best experience, always use the latest version of your email client and follow our installation guide.
              </p>
            </div>

          </div>

        </section>

      </div>

      {/* ================= MODAL: COMING SOON / NOTICE ================= */}
      {activeModal === 'coming-soon' && (
        <div className="support-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="support-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="support-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--red-corporate)', fontSize: '18px' }}>ℹ</span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--navy-primary)' }}>
                  {modalData?.title || 'Guide Download'}
                </h3>
              </div>
              <button className="support-modal-close" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="support-modal-body">
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '20px' }}>📦</span>
                <div>
                  <strong style={{ color: 'var(--red-corporate)', display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                    PUBLICATION STATUS: COMING SOON
                  </strong>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                    {modalData?.message}
                  </p>
                </div>
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                Administrators can upload new PDF documentation packages through the <strong>Admin Panel → Guides &amp; Videos</strong> tab.
              </p>
            </div>
            <div className="support-modal-footer">
              <button 
                className="btn-modal-primary"
                onClick={() => setActiveModal(null)}
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: INTERACTIVE VIDEO PLAYER ================= */}
      {activeModal === 'video' && modalData && (
        <div className="support-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="support-modal-box" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="support-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--red-corporate)' }}>▶</span>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--navy-primary)' }}>
                  {modalData.title}
                </h3>
              </div>
              <button className="support-modal-close" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="support-modal-body" style={{ padding: 0, backgroundColor: '#0B1528' }}>
              <div style={{ position: 'relative', width: '100%', height: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src="/assets/team-hero.jpg" 
                  alt={modalData.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
                />
                <div style={{
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#FFFFFF'
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--red-corporate)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    cursor: 'pointer'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF">
                      <polygon points="6 4 20 12 6 20 6 4"></polygon>
                    </svg>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>Corporate Training Video ({modalData.duration})</span>
                  <span style={{ fontSize: '12px', color: '#CBD5E1' }}>Official ALAM ENGAZ Port Services Co. Tutorial</span>
                </div>
              </div>
            </div>
            <div className="support-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#64748B' }}>Duration: {modalData.duration} &bull; 1080p Full HD</span>
              <button className="btn-modal-primary" onClick={() => setActiveModal(null)}>Close Player</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: COMPLETE GUIDE READER ================= */}
      {activeModal === 'reader' && (
        <div className="support-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="support-modal-box" style={{ maxWidth: '780px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div className="support-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/assets/logo.png" alt="Logo" style={{ height: '24px' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--navy-primary)' }}>
                  Complete Website Guide &bull; Table of Contents
                </h3>
              </div>
              <button className="support-modal-close" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="support-modal-body" style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '18px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--navy-primary)' }}>
                    ALAM ENGAZ EMAIL SIGNATURE HUB — USER MANUAL
                  </h4>
                  <span style={{ fontSize: '12.5px', color: '#64748B' }}>Version 1.0 &bull; 26 Sections &bull; 120+ Pages</span>
                </div>
                <span style={{ backgroundColor: '#ECFDF5', color: '#059669', padding: '4px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: 700, height: 'fit-content' }}>
                  ✓ Up to Date
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div style={{ padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <strong>Part 1: System Overview</strong>
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', color: '#475569', fontSize: '12px' }}>
                    <li>1.1 Port Hub Architecture</li>
                    <li>1.2 Security &amp; Compliance</li>
                    <li>1.3 Brand Standards</li>
                  </ul>
                </div>

                <div style={{ padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <strong>Part 2: Signature Studio</strong>
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', color: '#475569', fontSize: '12px' }}>
                    <li>2.1 Employee Identity Sync</li>
                    <li>2.2 Best Regards Controls</li>
                    <li>2.3 Logo Positioning &amp; Scale</li>
                    <li>2.4 Live Email Simulation</li>
                  </ul>
                </div>

                <div style={{ padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <strong>Part 3: Platform Installation</strong>
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', color: '#475569', fontSize: '12px' }}>
                    <li>3.1 Gmail Web &amp; Mobile Setup</li>
                    <li>3.2 Outlook Desktop (Office 365)</li>
                    <li>3.3 Apple Mail &amp; iOS Settings</li>
                    <li>3.4 Android Client Setup</li>
                  </ul>
                </div>

                <div style={{ padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <strong>Part 4: Diagnostics &amp; Support</strong>
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', color: '#475569', fontSize: '12px' }}>
                    <li>4.1 HTML Formatting Rules</li>
                    <li>4.2 Missing Image Prevention</li>
                    <li>4.3 IT Helpdesk Dispatch</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="support-modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button 
                className="btn-featured-download"
                style={{ height: '36px', fontSize: '12.5px', padding: '0 16px' }}
                onClick={() => handleDownloadGuide(DEFAULT_FEATURED_GUIDE)}
              >
                Download PDF
              </button>
              <button className="btn-modal-primary" onClick={() => setActiveModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
