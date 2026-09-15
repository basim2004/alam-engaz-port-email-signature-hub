import React, { useState, useEffect } from 'react';
import { PageRoute } from '../types';
import { getMasterWebsiteData, subscribeToWebsiteData, DEFAULT_MASTER_DATA } from '../services/websiteContentService';
import { CENTRAL_ORIGINAL_LOGO, CENTRAL_ORIGINAL_LOGO_ALT } from '../constants/assets';

interface FooterProps {
  onNavigate: (route: PageRoute) => void;
  currentRoute?: PageRoute;
  simple?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, currentRoute, simple = false }) => {
  const [footerData, setFooterData] = useState(DEFAULT_MASTER_DATA.footer);

  useEffect(() => {
    const data = getMasterWebsiteData();
    setFooterData(data.footer);
    const unsubscribe = subscribeToWebsiteData(d => {
      setFooterData(d.footer);
    });
    return unsubscribe;
  }, []);

  // Page 6 (Support Center) and approved corporate pages use the dark maritime footer
  const isDarkMaritime = currentRoute === 'support' || currentRoute === 'installation-guide' || currentRoute === 'about';

  const renderBeCreativesCredit = () => (
    <div className="footer-developer-credit-wrap">
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
  );

  if (isDarkMaritime) {
    return (
      <footer className="site-footer dark-maritime-footer">
        <div className="footer-container">
          <div className="footer-main-row">
            {/* Left: Original Logo & Company Info */}
            <div 
              className="footer-left" 
              onClick={() => onNavigate('home')}
              style={{ cursor: 'pointer' }}
              title={CENTRAL_ORIGINAL_LOGO_ALT}
            >
              <div className="footer-logo-wrap" style={{ backgroundColor: '#FFFFFF', padding: '6px 14px', borderRadius: '6px', display: 'inline-flex' }}>
                <img 
                  src={CENTRAL_ORIGINAL_LOGO} 
                  alt={CENTRAL_ORIGINAL_LOGO_ALT} 
                  className="footer-logo"
                  style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.png';
                  }}
                />
              </div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#94A3B8', letterSpacing: '0.04em', fontWeight: 600 }}>
                ALAM ENGAZ PORT SERVICES CO.
              </div>
            </div>

            {/* Center: Corporate Motto & Official Locations Bar */}
            <div className="footer-center-block">
              <div className="footer-motto-headline">
                <span className="motto-part-white">MOVING </span>
                <span className="motto-part-business" style={{ color: 'var(--red-corporate)' }}>BUSINESS</span>
                <span className="motto-part-white"> FURTHER</span>
              </div>
              
              <div className="footer-locations-center">
                <span className="footer-location-item active" style={{ color: '#FFFFFF' }}>Dammam</span>
                <span className="footer-location-sep" style={{ color: '#64748B' }}>|</span>
                <span className="footer-location-item" style={{ color: '#E2E8F0' }}>Jeddah</span>
                <span className="footer-location-sep" style={{ color: '#64748B' }}>|</span>
                <span className="footer-location-item" style={{ color: '#E2E8F0' }}>Bahrain</span>
                <span className="footer-location-sep" style={{ color: '#64748B' }}>|</span>
                <span className="footer-location-item" style={{ color: '#E2E8F0' }}>India</span>
              </div>

              <a 
                href="https://www.alamengaz.com" 
                target="_blank" 
                rel="noreferrer" 
                style={{ fontSize: '12px', color: '#94A3B8', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
              >
                www.alamengaz.com
              </a>
            </div>

            {/* Right: Social Media Icons & Tagline */}
            <div className="footer-right-col">
              <div className="footer-social-row">
                {/* LinkedIn */}
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="footer-social-icon" 
                  title="LinkedIn"
                  aria-label="LinkedIn"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                  </svg>
                </a>

                {/* YouTube */}
                <a 
                  href="https://youtube.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="footer-social-icon" 
                  title="YouTube"
                  aria-label="YouTube"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73z"/>
                  </svg>
                </a>

                {/* Instagram */}
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="footer-social-icon" 
                  title="Instagram"
                  aria-label="Instagram"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>

              <div className="footer-script-tag" style={{ color: '#94A3B8' }}>
                Global Connections Stronger Tomorrow
              </div>
            </div>
          </div>

          {/* Legal Links & Copyright Row */}
          <div className="footer-bottom-row" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', color: '#94A3B8' }}>
            <span className="footer-copy">© 2026 ALAM ENGAZ PORT SERVICES CO. All rights reserved.</span>
            <div className="footer-legal-links">
              <button 
                className="footer-legal-link"
                style={{ color: '#94A3B8' }}
                onClick={() => alert('Privacy Policy: ALAM ENGAZ PORT SERVICES CO. safeguards all corporate, client, and employee data according to Saudi Arabian cybersecurity standards.')}
              >
                Privacy Policy
              </button>
              <span className="footer-legal-sep" style={{ color: '#475569' }}>|</span>
              <button 
                className="footer-legal-link"
                style={{ color: '#94A3B8' }}
                onClick={() => alert('Terms of Use: This portal is for verified port logistics operations, official email signatures, and corporate communications.')}
              >
                Terms of Use
              </button>
              <span className="footer-legal-sep" style={{ color: '#475569' }}>|</span>
              <button 
                className="footer-legal-link"
                style={{ color: '#94A3B8' }}
                onClick={() => onNavigate('support')}
              >
                Contact Us
              </button>
            </div>
          </div>

          {/* Developer Credit Pill: Designed & Developed by Be_Creatives */}
          {renderBeCreativesCredit()}
        </div>
      </footer>
    );
  }

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-main-row">
          {/* Left: Original Logo */}
          <div 
            className="footer-left" 
            onClick={() => onNavigate('home')}
            style={{ cursor: 'pointer' }}
            title={CENTRAL_ORIGINAL_LOGO_ALT}
          >
            <div className="footer-logo-wrap">
              <img 
                src={CENTRAL_ORIGINAL_LOGO} 
                alt={CENTRAL_ORIGINAL_LOGO_ALT} 
                className="footer-logo" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>
            <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
              ALAM ENGAZ PORT SERVICES CO.
            </div>
          </div>

          {/* Center: Official Locations Bar & Website Link */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div className="footer-locations-center">
              <span className="footer-location-item active">Dammam</span>
              <span className="footer-location-sep">|</span>
              <span className="footer-location-item">Jeddah</span>
              <span className="footer-location-sep">|</span>
              <span className="footer-location-item">Bahrain</span>
              <span className="footer-location-sep">|</span>
              <span className="footer-location-item">India</span>
            </div>
            <a 
              href="https://www.alamengaz.com" 
              target="_blank" 
              rel="noreferrer" 
              style={{ fontSize: '12px', color: 'var(--navy-primary)', textDecoration: 'none', fontWeight: 600, letterSpacing: '0.02em' }}
            >
              www.alamengaz.com
            </a>
          </div>

          {/* Right: Social Media & MOVING BUSINESS FURTHER */}
          <div className="footer-right-motto-wrap">
            <div className="footer-social-row">
              {/* LinkedIn */}
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer" 
                className="footer-social-icon" 
                title="LinkedIn"
                aria-label="LinkedIn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
              </a>

              {/* YouTube */}
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer" 
                className="footer-social-icon" 
                title="YouTube"
                aria-label="YouTube"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer" 
                className="footer-social-icon" 
                title="Instagram"
                aria-label="Instagram"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>

            <div className="footer-vdivider" />

            <div className="footer-motto-stack">
              <div>MOVING</div>
              <div style={{ color: 'var(--red-corporate)' }}>BUSINESS</div>
              <div>FURTHER</div>
            </div>
          </div>
        </div>

        {/* Legal Links & Copyright Row */}
        <div className="footer-bottom-row">
          <span className="footer-copy">© 2026 ALAM ENGAZ PORT SERVICES CO. All rights reserved.</span>
          <div className="footer-legal-links">
            <button 
              className="footer-legal-link"
              onClick={() => alert('Privacy Policy: ALAM ENGAZ PORT SERVICES CO. safeguards all corporate, client, and employee data according to Saudi Arabian cybersecurity standards.')}
            >
              Privacy Policy
            </button>
            <span className="footer-legal-sep">|</span>
            <button 
              className="footer-legal-link"
              onClick={() => alert('Terms of Use: This portal is for verified port logistics operations, official email signatures, and corporate communications.')}
            >
              Terms of Use
            </button>
            <span className="footer-legal-sep">|</span>
            <button 
              className="footer-legal-link"
              onClick={() => onNavigate('support')}
            >
              Contact Us
            </button>
          </div>
        </div>

        {/* Developer Credit Pill: Designed & Developed by Be_Creatives */}
        {renderBeCreativesCredit()}
      </div>
    </footer>
  );
};
