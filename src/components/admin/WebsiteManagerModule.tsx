import React, { useState, useEffect } from 'react';
import { PageRoute } from '../../types';
import {
  getMasterWebsiteData,
  saveMasterWebsiteData,
  DEFAULT_MASTER_DATA,
  HomepageContent,
  AboutContent,
  InstallationGuideContent,
  FooterContent,
  logAuditEvent
} from '../../services/websiteContentService';

interface WebsiteManagerModuleProps {
  initialSubTab?: 'homepage' | 'about' | 'installation' | 'footer';
  onNavigate: (route: PageRoute) => void;
  onShowToast: (msg: string) => void;
}

export const WebsiteManagerModule: React.FC<WebsiteManagerModuleProps> = ({
  initialSubTab = 'homepage',
  onNavigate,
  onShowToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'homepage' | 'about' | 'installation' | 'footer'>(initialSubTab);
  const [homepageForm, setHomepageForm] = useState<HomepageContent>(DEFAULT_MASTER_DATA.homepage);
  const [aboutForm, setAboutForm] = useState<AboutContent>(DEFAULT_MASTER_DATA.about);
  const [installForm, setInstallForm] = useState<InstallationGuideContent>(DEFAULT_MASTER_DATA.installation);
  const [footerForm, setFooterForm] = useState<FooterContent>(DEFAULT_MASTER_DATA.footer);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    const data = getMasterWebsiteData();
    setHomepageForm(data.homepage);
    setAboutForm(data.about);
    setInstallForm(data.installation);
    setFooterForm(data.footer);
  }, []);

  // Save Homepage
  const handleSaveHomepage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = getMasterWebsiteData();
      const updated = { ...data, homepage: homepageForm };
      await saveMasterWebsiteData(updated);
      await logAuditEvent(
        'Basim Aslam',
        'SUPER_ADMIN',
        'Homepage Content Updated',
        'Website',
        'Public Homepage',
        'Updated hero typography, CTA buttons, and portal descriptions.'
      );
      onShowToast('✓ Homepage content updated and published to live website');
    } catch (err) {
      console.error(err);
      onShowToast('Failed to save homepage content.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save About
  const handleSaveAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = getMasterWebsiteData();
      const updated = { ...data, about: aboutForm };
      await saveMasterWebsiteData(updated);
      await logAuditEvent(
        'Basim Aslam',
        'SUPER_ADMIN',
        'About Page Updated',
        'Website',
        'Public About Page',
        'Updated corporate mission, vision, statistics, and company narrative.'
      );
      onShowToast('✓ About page updated and published to live website');
    } catch (err) {
      console.error(err);
      onShowToast('Failed to save About page content.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Installation
  const handleSaveInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = getMasterWebsiteData();
      const updated = { ...data, installation: installForm };
      await saveMasterWebsiteData(updated);
      await logAuditEvent(
        'Basim Aslam',
        'SUPER_ADMIN',
        'Installation Guide Settings Updated',
        'Guides',
        'Installation Guide Page',
        'Configured client guide publication toggles and setup documentation.'
      );
      onShowToast('✓ Installation guide configuration published to public site');
    } catch (err) {
      console.error(err);
      onShowToast('Failed to save installation guide.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Footer
  const handleSaveFooter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = getMasterWebsiteData();
      const updated = { ...data, footer: footerForm };
      await saveMasterWebsiteData(updated);
      await logAuditEvent(
        'Basim Aslam',
        'SUPER_ADMIN',
        'Corporate Footer Updated',
        'Website',
        'Universal Footer',
        'Updated port locations, social links, contact info, and legal notices.'
      );
      onShowToast('✓ Footer updated and synchronized across all public pages');
    } catch (err) {
      console.error(err);
      onShowToast('Failed to save footer content.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to Defaults
  const handleResetSection = (section: 'homepage' | 'about' | 'installation' | 'footer') => {
    if (!window.confirm(`Reset ${section} content back to default corporate values?`)) return;
    if (section === 'homepage') setHomepageForm(DEFAULT_MASTER_DATA.homepage);
    if (section === 'about') setAboutForm(DEFAULT_MASTER_DATA.about);
    if (section === 'installation') setInstallForm(DEFAULT_MASTER_DATA.installation);
    if (section === 'footer') setFooterForm(DEFAULT_MASTER_DATA.footer);
    onShowToast(`Reset ${section} fields. Click Save Changes to commit.`);
  };

  return (
    <div className="adm-module-wrap">
      {/* Module Header */}
      <div className="adm-module-header">
        <div>
          <div className="adm-module-eyebrow">CONTENT MANAGEMENT &bull; PUBLIC CMS</div>
          <h2 className="adm-module-title">Website Content Manager</h2>
          <p className="adm-module-subtitle">
            Edit live corporate copy, hero sections, company information, installation instructions, and universal footer links.
          </p>
        </div>
        <div className="adm-module-header-actions">
          <button 
            type="button" 
            className="btn-adm-outline"
            onClick={() => onNavigate(activeSubTab === 'about' ? 'about' : activeSubTab === 'installation' ? 'installation-guide' : 'home')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            <span>Preview Public Page</span>
          </button>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="adm-subtabs-nav">
        <button
          className={`adm-subtab-btn ${activeSubTab === 'homepage' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('homepage')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          </svg>
          <span>Homepage Content</span>
        </button>
        <button
          className={`adm-subtab-btn ${activeSubTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('about')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
          <span>About Page</span>
        </button>
        <button
          className={`adm-subtab-btn ${activeSubTab === 'installation' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('installation')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          <span>Installation Guide</span>
        </button>
        <button
          className={`adm-subtab-btn ${activeSubTab === 'footer' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('footer')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="15" x2="21" y2="15"></line>
          </svg>
          <span>Footer Settings</span>
        </button>
      </div>

      {/* ================= TAB 1: HOMEPAGE CONTENT ================= */}
      {activeSubTab === 'homepage' && (
        <form onSubmit={handleSaveHomepage} className="adm-card-form">
          <div className="adm-form-section">
            <h3 className="adm-form-section-title">1. Hero Section &amp; Tagline</h3>
            <p className="adm-form-section-sub">Main above-the-fold banner displayed on the public landing page.</p>

            <div className="adm-grid-2">
              <div className="ss-form-group">
                <label className="ss-form-label">Hero Preheading / Organization</label>
                <input
                  type="text"
                  className="ss-input"
                  value={homepageForm.heroPreheading}
                  onChange={e => setHomepageForm({ ...homepageForm, heroPreheading: e.target.value })}
                  required
                />
              </div>

              <div className="ss-form-group">
                <label className="ss-form-label">Hero Main Title (H1)</label>
                <input
                  type="text"
                  className="ss-input"
                  value={homepageForm.heroHeading}
                  onChange={e => setHomepageForm({ ...homepageForm, heroHeading: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="adm-grid-2">
              <div className="ss-form-group">
                <label className="ss-form-label">Corporate Tagline</label>
                <input
                  type="text"
                  className="ss-input"
                  value={homepageForm.heroTagline}
                  onChange={e => setHomepageForm({ ...homepageForm, heroTagline: e.target.value })}
                  required
                />
              </div>

              <div className="ss-form-group">
                <label className="ss-form-label">Hero Background Image Path</label>
                <input
                  type="text"
                  className="ss-input"
                  value={homepageForm.heroBackgroundImage}
                  onChange={e => setHomepageForm({ ...homepageForm, heroBackgroundImage: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="ss-form-group">
              <label className="ss-form-label">Hero Subtext Description</label>
              <textarea
                className="ss-textarea"
                rows={2}
                value={homepageForm.heroSubtext}
                onChange={e => setHomepageForm({ ...homepageForm, heroSubtext: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="adm-form-section">
            <h3 className="adm-form-section-title">2. Call to Action (CTA) Buttons</h3>
            <div className="adm-grid-2">
              <div>
                <div className="ss-form-group">
                  <label className="ss-form-label">Primary CTA Button Text</label>
                  <input
                    type="text"
                    className="ss-input"
                    value={homepageForm.cta1Text}
                    onChange={e => setHomepageForm({ ...homepageForm, cta1Text: e.target.value })}
                    required
                  />
                </div>
                <div className="ss-form-group">
                  <label className="ss-form-label">Primary CTA Route</label>
                  <select
                    className="ss-select"
                    value={homepageForm.cta1Link}
                    onChange={e => setHomepageForm({ ...homepageForm, cta1Link: e.target.value })}
                  >
                    <option value="employees">Employees Roster (/employees)</option>
                    <option value="signature-studio">Signature Studio (/signature-studio)</option>
                    <option value="installation-guide">Installation Guide (/installation-guide)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="ss-form-group">
                  <label className="ss-form-label">Secondary CTA Button Text</label>
                  <input
                    type="text"
                    className="ss-input"
                    value={homepageForm.cta2Text}
                    onChange={e => setHomepageForm({ ...homepageForm, cta2Text: e.target.value })}
                    required
                  />
                </div>
                <div className="ss-form-group">
                  <label className="ss-form-label">Secondary CTA Route</label>
                  <select
                    className="ss-select"
                    value={homepageForm.cta2Link}
                    onChange={e => setHomepageForm({ ...homepageForm, cta2Link: e.target.value })}
                  >
                    <option value="signature-studio">Signature Studio (/signature-studio)</option>
                    <option value="employees">Employees Roster (/employees)</option>
                    <option value="about">About Page (/about)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="adm-form-section">
            <h3 className="adm-form-section-title">3. Bottom Bar &amp; Section Descriptions</h3>
            <div className="adm-grid-2">
              <div className="ss-form-group">
                <label className="ss-form-label">Slogan Phrase</label>
                <input
                  type="text"
                  className="ss-input"
                  value={homepageForm.sloganText}
                  onChange={e => setHomepageForm({ ...homepageForm, sloganText: e.target.value })}
                  required
                />
              </div>

              <div className="ss-form-group">
                <label className="ss-form-label">Operational Locations Display</label>
                <input
                  type="text"
                  className="ss-input"
                  value={homepageForm.locationsText}
                  onChange={e => setHomepageForm({ ...homepageForm, locationsText: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="ss-form-group">
              <label className="ss-form-label">Portal Section Description</label>
              <input
                type="text"
                className="ss-input"
                value={homepageForm.portalSectionSubtitle}
                onChange={e => setHomepageForm({ ...homepageForm, portalSectionSubtitle: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="adm-form-actions">
            <button type="button" className="btn-adm-outline" onClick={() => handleResetSection('homepage')}>
              Reset to Defaults
            </button>
            <button type="submit" className="ss-btn-save" disabled={isSaving}>
              {isSaving ? 'Saving to Firestore...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* ================= TAB 2: ABOUT PAGE ================= */}
      {activeSubTab === 'about' && (
        <form onSubmit={handleSaveAbout} className="adm-card-form">
          <div className="adm-form-section">
            <h3 className="adm-form-section-title">1. About Hero &amp; Subtitle</h3>
            <div className="adm-grid-2">
              <div className="ss-form-group">
                <label className="ss-form-label">About Page Preheading</label>
                <input
                  type="text"
                  className="ss-input"
                  value={aboutForm.pagePreheading}
                  onChange={e => setAboutForm({ ...aboutForm, pagePreheading: e.target.value })}
                  required
                />
              </div>
              <div className="ss-form-group">
                <label className="ss-form-label">Page Main Heading</label>
                <input
                  type="text"
                  className="ss-input"
                  value={aboutForm.pageTitle}
                  onChange={e => setAboutForm({ ...aboutForm, pageTitle: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="ss-form-group">
              <label className="ss-form-label">Subtitle / Hook</label>
              <textarea
                className="ss-textarea"
                rows={2}
                value={aboutForm.pageSubtext}
                onChange={e => setAboutForm({ ...aboutForm, pageSubtext: e.target.value })}
                required
              />
            </div>

            <div className="ss-form-group">
              <label className="ss-form-label">Full Corporate Description</label>
              <textarea
                className="ss-textarea"
                rows={3}
                value={aboutForm.companyDescription}
                onChange={e => setAboutForm({ ...aboutForm, companyDescription: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="adm-form-section">
            <h3 className="adm-form-section-title">2. Mission, Vision &amp; Values</h3>
            <div className="ss-form-group">
              <label className="ss-form-label">Corporate Mission</label>
              <textarea
                className="ss-textarea"
                rows={2}
                value={aboutForm.mission}
                onChange={e => setAboutForm({ ...aboutForm, mission: e.target.value })}
                required
              />
            </div>
            <div className="ss-form-group">
              <label className="ss-form-label">Corporate Vision</label>
              <textarea
                className="ss-textarea"
                rows={2}
                value={aboutForm.vision}
                onChange={e => setAboutForm({ ...aboutForm, vision: e.target.value })}
                required
              />
            </div>
            <div className="ss-form-group">
              <label className="ss-form-label">Core Values (Comma Separated)</label>
              <input
                type="text"
                className="ss-input"
                value={aboutForm.values}
                onChange={e => setAboutForm({ ...aboutForm, values: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="adm-form-section">
            <h3 className="adm-form-section-title">3. Key Operational Statistics</h3>
            <div className="adm-grid-4">
              <div className="ss-form-group">
                <label className="ss-form-label">Ports Served</label>
                <input
                  type="text"
                  className="ss-input"
                  value={aboutForm.portsServed}
                  onChange={e => setAboutForm({ ...aboutForm, portsServed: e.target.value })}
                  required
                />
              </div>
              <div className="ss-form-group">
                <label className="ss-form-label">Vessels Handled</label>
                <input
                  type="text"
                  className="ss-input"
                  value={aboutForm.vesselsHandled}
                  onChange={e => setAboutForm({ ...aboutForm, vesselsHandled: e.target.value })}
                  required
                />
              </div>
              <div className="ss-form-group">
                <label className="ss-form-label">Team Members</label>
                <input
                  type="text"
                  className="ss-input"
                  value={aboutForm.teamMembers}
                  onChange={e => setAboutForm({ ...aboutForm, teamMembers: e.target.value })}
                  required
                />
              </div>
              <div className="ss-form-group">
                <label className="ss-form-label">Service Reliability</label>
                <input
                  type="text"
                  className="ss-input"
                  value={aboutForm.uptime}
                  onChange={e => setAboutForm({ ...aboutForm, uptime: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="adm-form-actions">
            <button type="button" className="btn-adm-outline" onClick={() => handleResetSection('about')}>
              Reset to Defaults
            </button>
            <button type="submit" className="ss-btn-save" disabled={isSaving}>
              {isSaving ? 'Saving to Firestore...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* ================= TAB 3: INSTALLATION GUIDE ================= */}
      {activeSubTab === 'installation' && (
        <form onSubmit={handleSaveInstall} className="adm-card-form">
          <div className="adm-form-section">
            <h3 className="adm-form-section-title">1. Guide Header &amp; Subtitle</h3>
            <div className="adm-grid-2">
              <div className="ss-form-group">
                <label className="ss-form-label">Preheading</label>
                <input
                  type="text"
                  className="ss-input"
                  value={installForm.heroPreheading}
                  onChange={e => setInstallForm({ ...installForm, heroPreheading: e.target.value })}
                  required
                />
              </div>
              <div className="ss-form-group">
                <label className="ss-form-label">Main Heading</label>
                <input
                  type="text"
                  className="ss-input"
                  value={installForm.heroTitle}
                  onChange={e => setInstallForm({ ...installForm, heroTitle: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="ss-form-group">
              <label className="ss-form-label">Guide Description</label>
              <textarea
                className="ss-textarea"
                rows={2}
                value={installForm.heroSubtext}
                onChange={e => setInstallForm({ ...installForm, heroSubtext: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="adm-form-section">
            <h3 className="adm-form-section-title">2. Client Installation Modules (Publish / Unpublish)</h3>
            <p className="adm-form-section-sub">Control which email client walkthroughs are published on the public guide page.</p>

            <div className="adm-toggle-grid">
              <div className="adm-toggle-card">
                <div>
                  <strong>Gmail Web &amp; Mobile</strong>
                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>Google Workspace setup walkthrough</div>
                </div>
                <button
                  type="button"
                  className={`ss-switch ${installForm.gmailGuidePublished ? 'active' : ''}`}
                  onClick={() => setInstallForm({ ...installForm, gmailGuidePublished: !installForm.gmailGuidePublished })}
                >
                  <span className="ss-switch-thumb" />
                </button>
              </div>

              <div className="adm-toggle-card">
                <div>
                  <strong>Outlook on the Web</strong>
                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>Office 365 web portal setup</div>
                </div>
                <button
                  type="button"
                  className={`ss-switch ${installForm.outlookWebPublished ? 'active' : ''}`}
                  onClick={() => setInstallForm({ ...installForm, outlookWebPublished: !installForm.outlookWebPublished })}
                >
                  <span className="ss-switch-thumb" />
                </button>
              </div>

              <div className="adm-toggle-card">
                <div>
                  <strong>Outlook Desktop App</strong>
                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>Windows &amp; Mac desktop client</div>
                </div>
                <button
                  type="button"
                  className={`ss-switch ${installForm.outlookDesktopPublished ? 'active' : ''}`}
                  onClick={() => setInstallForm({ ...installForm, outlookDesktopPublished: !installForm.outlookDesktopPublished })}
                >
                  <span className="ss-switch-thumb" />
                </button>
              </div>

              <div className="adm-toggle-card">
                <div>
                  <strong>Mobile Mail (iOS &amp; Android)</strong>
                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>Native smartphone clients</div>
                </div>
                <button
                  type="button"
                  className={`ss-switch ${installForm.mobilePublished ? 'active' : ''}`}
                  onClick={() => setInstallForm({ ...installForm, mobilePublished: !installForm.mobilePublished })}
                >
                  <span className="ss-switch-thumb" />
                </button>
              </div>

              <div className="adm-toggle-card">
                <div>
                  <strong>Troubleshooting Guide</strong>
                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>Common issues and layout fixes</div>
                </div>
                <button
                  type="button"
                  className={`ss-switch ${installForm.troubleshootingPublished ? 'active' : ''}`}
                  onClick={() => setInstallForm({ ...installForm, troubleshootingPublished: !installForm.troubleshootingPublished })}
                >
                  <span className="ss-switch-thumb" />
                </button>
              </div>

              <div className="adm-toggle-card">
                <div>
                  <strong>FAQ &amp; Best Practices</strong>
                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>Corporate signature etiquette</div>
                </div>
                <button
                  type="button"
                  className={`ss-switch ${installForm.faqPublished ? 'active' : ''}`}
                  onClick={() => setInstallForm({ ...installForm, faqPublished: !installForm.faqPublished })}
                >
                  <span className="ss-switch-thumb" />
                </button>
              </div>
            </div>
          </div>

          <div className="adm-form-actions">
            <button type="button" className="btn-adm-outline" onClick={() => handleResetSection('installation')}>
              Reset to Defaults
            </button>
            <button type="submit" className="ss-btn-save" disabled={isSaving}>
              {isSaving ? 'Saving to Firestore...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* ================= TAB 4: FOOTER SETTINGS ================= */}
      {activeSubTab === 'footer' && (
        <form onSubmit={handleSaveFooter} className="adm-card-form">
          <div className="adm-form-section">
            <h3 className="adm-form-section-title">1. Corporate Identity &amp; Ports</h3>
            <div className="adm-grid-2">
              <div className="ss-form-group">
                <label className="ss-form-label">Company Official Name</label>
                <input
                  type="text"
                  className="ss-input"
                  value={footerForm.companyName}
                  onChange={e => setFooterForm({ ...footerForm, companyName: e.target.value })}
                  required
                />
              </div>
              <div className="ss-form-group">
                <label className="ss-form-label">Corporate Slogan</label>
                <input
                  type="text"
                  className="ss-input"
                  value={footerForm.tagline}
                  onChange={e => setFooterForm({ ...footerForm, tagline: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="adm-grid-2">
              <div className="ss-form-group">
                <label className="ss-form-label">Locations Display Bar</label>
                <input
                  type="text"
                  className="ss-input"
                  value={footerForm.locations}
                  onChange={e => setFooterForm({ ...footerForm, locations: e.target.value })}
                  required
                />
              </div>
              <div className="ss-form-group">
                <label className="ss-form-label">Website Domain</label>
                <input
                  type="text"
                  className="ss-input"
                  value={footerForm.websiteUrl}
                  onChange={e => setFooterForm({ ...footerForm, websiteUrl: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="adm-grid-2">
              <div className="ss-form-group">
                <label className="ss-form-label">Support Email</label>
                <input
                  type="email"
                  className="ss-input"
                  value={footerForm.supportEmail}
                  onChange={e => setFooterForm({ ...footerForm, supportEmail: e.target.value })}
                  required
                />
              </div>
              <div className="ss-form-group">
                <label className="ss-form-label">Contact Phone</label>
                <input
                  type="text"
                  className="ss-input"
                  value={footerForm.phone}
                  onChange={e => setFooterForm({ ...footerForm, phone: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="adm-form-section">
            <h3 className="adm-form-section-title">2. Social Media &amp; Legal Notices</h3>
            <div className="adm-grid-3">
              <div className="ss-form-group">
                <label className="ss-form-label">LinkedIn URL</label>
                <input
                  type="text"
                  className="ss-input"
                  value={footerForm.socialLinkedin}
                  onChange={e => setFooterForm({ ...footerForm, socialLinkedin: e.target.value })}
                  required
                />
              </div>
              <div className="ss-form-group">
                <label className="ss-form-label">YouTube URL</label>
                <input
                  type="text"
                  className="ss-input"
                  value={footerForm.socialYoutube}
                  onChange={e => setFooterForm({ ...footerForm, socialYoutube: e.target.value })}
                  required
                />
              </div>
              <div className="ss-form-group">
                <label className="ss-form-label">Instagram URL</label>
                <input
                  type="text"
                  className="ss-input"
                  value={footerForm.socialInstagram}
                  onChange={e => setFooterForm({ ...footerForm, socialInstagram: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="ss-form-group">
              <label className="ss-form-label">Copyright Notice</label>
              <input
                type="text"
                className="ss-input"
                value={footerForm.copyrightText}
                onChange={e => setFooterForm({ ...footerForm, copyrightText: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="adm-form-actions">
            <button type="button" className="btn-adm-outline" onClick={() => handleResetSection('footer')}>
              Reset to Defaults
            </button>
            <button type="submit" className="ss-btn-save" disabled={isSaving}>
              {isSaving ? 'Saving to Firestore...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
