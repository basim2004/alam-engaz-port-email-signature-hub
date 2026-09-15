import React, { useState, useEffect } from 'react';
import { PageRoute } from '../types';
import { getMasterWebsiteData, subscribeToWebsiteData, AboutContent } from '../services/websiteContentService';

interface AboutViewProps {
  onNavigate: (route: PageRoute) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  const [aboutData, setAboutData] = useState<AboutContent>(() => getMasterWebsiteData().about);

  useEffect(() => {
    const unsub = subscribeToWebsiteData(data => {
      setAboutData(data.about);
    });
    return unsub;
  }, []);

  const handleDownloadBrochure = () => {
    if (aboutData.brochureUrl) {
      const link = document.createElement('a');
      link.href = aboutData.brochureUrl;
      link.download = 'ALAM_ENGAZ_Corporate_Brochure.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('ALAM ENGAZ Corporate Brochure (PDF) downloaded.');
    }
  };

  const handleWatchStory = () => {
    alert('ALAM ENGAZ Corporate Documentary: "Moving Business Further across Global Maritime Hubs".');
  };

  return (
    <div className="about-page-wrap">
      {/* ================= HERO SECTION ================= */}
      <section className="about-hero-section">
        <div className="about-hero-overlay" />
        
        <div className="about-hero-container">
          <div className="about-hero-left">
            <div className="about-hero-preheading">
              {aboutData.pagePreheading || 'PEOPLE . PORTS . POSSIBILITIES'}
            </div>

            <h1 className="about-hero-title">
              <span className="about-title-white">{aboutData.pageTitle.split(' ')[0] || 'ABOUT'} </span><br />
              <span className="about-title-red">{aboutData.pageTitle.split(' ').slice(1).join(' ') || 'ALAM ENGAZ'}</span>
            </h1>

            <p className="about-hero-subtext">
              {aboutData.pageSubtext || 'A trusted name in port services, built on commitment, expertise and global connections.'}
            </p>

            {/* 3 Simple Highlights */}
            <div className="about-hero-highlights">
              <div className="about-highlight-item">
                <div className="about-highlight-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 2H9c-1.1 0-2 .9-2 2v2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h10v2H9V4zM5 8h2v2H5V8zm0 4h2v2H5v-2zm0 4h2v2H5v-2zm14 4H9v-2h2v-2H9v-2h2v-2H9V8h10v12zm-6-8h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
                  </svg>
                </div>
                <div className="about-highlight-text">
                  <span className="about-highlight-title">Our</span>
                  <span className="about-highlight-desc">Company</span>
                </div>
              </div>

              <div className="about-highlight-vsep" />

              <div className="about-highlight-item">
                <div className="about-highlight-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                </div>
                <div className="about-highlight-text">
                  <span className="about-highlight-title">Our</span>
                  <span className="about-highlight-desc">Values</span>
                </div>
              </div>

              <div className="about-highlight-vsep" />

              <div className="about-highlight-item">
                <div className="about-highlight-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
                  </svg>
                </div>
                <div className="about-highlight-text">
                  <span className="about-highlight-title">Our</span>
                  <span className="about-highlight-desc">Journey</span>
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
            <div className="about-motto-red-line" />
            <div className="team-script-tag">
              Global Connections Stronger Tomorrow
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHO WE ARE SECTION ================= */}
      <section className="about-who-section">
        <div className="about-who-container">
          {/* Left Column: Heading & Introduction */}
          <div className="about-who-left">
            <div className="about-section-preheading">WHO WE ARE</div>
            <h2 className="about-who-heading">
              Reliable Port Services<br />
              for a <span className="text-red">Connected World</span>
            </h2>
            <p className="about-who-text">
              {aboutData.companyDescription || 'ALAM ENGAZ Port Services Co. is a Saudi-based company providing comprehensive port services and logistics support with a commitment to operational excellence, safety and customer satisfaction. We work closely with global partners to ensure smooth, efficient and reliable port operations.'}
            </p>

            <div className="about-who-actions">
              <button className="btn-about-brochure" onClick={handleDownloadBrochure}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Our Brochure</span>
              </button>

              <div className="about-watch-story" onClick={handleWatchStory} role="button" tabIndex={0}>
                <div className="about-play-circle">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--red-corporate)">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <div className="about-watch-text">
                  <div className="about-watch-title">Watch Our Story</div>
                  <div className="about-watch-sub">A glimpse of our journey</div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column: 4 Feature Points in card */}
          <div className="about-features-card">
            <div className="about-feat-item">
              <div className="about-feat-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L1 9l11 13L23 9 12 2zm0 3.2L18.4 9 12 17.5 5.6 9 12 5.2z"/>
                </svg>
              </div>
              <div>
                <h4 className="about-feat-title">Trusted Partner</h4>
                <p className="about-feat-desc">Delivering reliable and professional port services.</p>
              </div>
            </div>

            <div className="about-feat-item">
              <div className="about-feat-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>
              <div>
                <h4 className="about-feat-title">Experienced Team</h4>
                <p className="about-feat-desc">A skilled team with industry expertise.</p>
              </div>
            </div>

            <div className="about-feat-item">
              <div className="about-feat-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66z"/>
                </svg>
              </div>
              <div>
                <h4 className="about-feat-title">Operational Excellence</h4>
                <p className="about-feat-desc">Committed to safety, efficiency and quality.</p>
              </div>
            </div>

            <div className="about-feat-item">
              <div className="about-feat-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <div>
                <h4 className="about-feat-title">Global Connections</h4>
                <p className="about-feat-desc">Building strong partnerships across the world.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Tall Banner Card */}
          <div className="about-portrait-card">
            <img 
              src="/assets/container-terminal.jpg" 
              alt="More Than Logistics" 
              className="about-portrait-img" 
            />
            <div className="about-portrait-overlay" />
            <div className="about-portrait-content">
              <div className="about-portrait-line">MORE</div>
              <div className="about-portrait-line">THAN</div>
              <div className="about-portrait-line">LOGISTICS</div>
              <div className="about-portrait-sub-line">A STRONGER</div>
              <div className="about-portrait-sub-line">TOMORROW</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= COMPANY STATISTICS STRIP ================= */}
      <section className="about-stats-section">
        <div className="about-stats-container">
          <div className="about-stat-item">
            <div className="about-stat-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.47L20 11V6c0-1.1-.9-2-2-2h-3V2h-2v2h-2V2H9v2H6c-1.1 0-2 .9-2 2v5l-1.28.27c-.26.05-.48.23-.6.47s-.14.52-.06.78L3.95 19zM6 6h12v5.33l-6-1.2-6 1.2V6z"/>
              </svg>
            </div>
            <div className="about-stat-num">{aboutData.vesselsHandled || '2,500+'}</div>
            <div className="about-stat-label">Vessel Services</div>
          </div>

          <div className="about-stat-vsep" />

          <div className="about-stat-item">
            <div className="about-stat-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 2h2v14h-2V5zm-4 0h2v14H8V5zm8 14V5h2v14h-2zM5 5h1v14H5V5z"/>
              </svg>
            </div>
            <div className="about-stat-num">1M+</div>
            <div className="about-stat-label">Tons Handled Annually</div>
          </div>

          <div className="about-stat-vsep" />

          <div className="about-stat-item">
            <div className="about-stat-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.5 4H16V2h-2v2h-4V2H8v2H5.5C4.12 4 3 5.12 3 6.5v12C3 19.88 4.12 21 5.5 21h13c1.38 0 2.5-1.12 2.5-2.5v-12C21 5.12 19.88 4 18.5 4zM19 18.5c0 .28-.22.5-.5.5h-13c-.28 0-.5-.22-.5-.5V9h14v9.5zM10.5 11l-2.5 2.5 1.41 1.41L10.5 13.83l3.59 3.58 1.41-1.41L10.5 11z"/>
              </svg>
            </div>
            <div className="about-stat-num">{aboutData.portsServed || '200+'}</div>
            <div className="about-stat-label">Global Partners</div>
          </div>

          <div className="about-stat-vsep" />

          <div className="about-stat-item">
            <div className="about-stat-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
            <div className="about-stat-num">{aboutData.teamMembers || '100+'}</div>
            <div className="about-stat-label">Dedicated Professionals</div>
          </div>
        </div>
      </section>

      {/* ================= OUR VALUES SECTION ================= */}
      <section className="about-values-section">
        <div className="about-values-container">
          <div className="about-values-header">
            <div className="about-section-preheading">OUR VALUES</div>
            <h2 className="about-values-title">
              The Principles<br />
              That <span className="text-red">Drive Us</span>
            </h2>
          </div>

          <div className="about-values-grid">
            {/* 1. Safety First */}
            <div className="value-card">
              <div className="value-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm1 14h-2v-2h2v2zm0-4h-2V7h2v4z"/>
                </svg>
              </div>
              <h3 className="value-card-title">Safety First</h3>
              <p className="value-card-desc">
                We prioritize the safety of people, assets and the environment.
              </p>
            </div>

            {/* 2. Integrity */}
            <div className="value-card">
              <div className="value-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
                </svg>
              </div>
              <h3 className="value-card-title">Integrity</h3>
              <p className="value-card-desc">
                We conduct business with honesty and transparency.
              </p>
            </div>

            {/* 3. Teamwork */}
            <div className="value-card">
              <div className="value-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>
              <h3 className="value-card-title">Teamwork</h3>
              <p className="value-card-desc">
                We believe in the power of collaboration.
              </p>
            </div>

            {/* 4. Excellence */}
            <div className="value-card">
              <div className="value-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/>
                </svg>
              </div>
              <h3 className="value-card-title">Excellence</h3>
              <p className="value-card-desc">
                We strive for continuous improvement in everything we do.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= VISION & MISSION SECTION ================= */}
      <section className="about-vm-section">
        <div className="about-vm-container">
          {/* Left Thumbnail Image */}
          <div className="about-vm-image-col">
            <img 
              src="/assets/container-terminal.jpg" 
              alt="Port Terminal Operations" 
              className="about-vm-img" 
            />
          </div>

          {/* Center: OUR VISION (Red Panel) */}
          <div className="about-vm-panel about-vision-panel">
            <div className="about-vm-icon-circle">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
            </div>
            <div className="about-vm-label">OUR VISION</div>
            <p className="about-vm-text">
              {aboutData.vision || 'To be a leading port services provider in the region, recognized for reliability, innovation and customer value.'}
            </p>
          </div>

          {/* Right: OUR MISSION (Navy Panel) */}
          <div className="about-vm-panel about-mission-panel">
            <div className="about-vm-icon-circle">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
            </div>
            <div className="about-vm-label">OUR MISSION</div>
            <p className="about-vm-text">
              {aboutData.mission || 'To deliver efficient, safe and high-quality port services that connect businesses and create sustainable growth.'}
            </p>
          </div>
        </div>
      </section>

      {/* ================= OUR PRESENCE SECTION ================= */}
      <section className="about-presence-section">
        <div className="about-presence-container">
          {/* Left Heading */}
          <div className="about-presence-left">
            <div className="about-section-preheading">OUR PRESENCE</div>
            <h2 className="about-presence-heading">
              Strategically Located<br />
              for <span className="text-red">Global Trade</span>
            </h2>
          </div>

          <div className="about-presence-vsep" />

          {/* Center: Locations with Pins */}
          <div className="about-presence-pins">
            <div className="presence-pin-item active">
              <span className="presence-pin-icon">📍</span>
              <span className="presence-pin-name">Dammam</span>
              <div className="presence-pin-underline" />
            </div>

            <div className="presence-pin-item">
              <span className="presence-pin-icon">📍</span>
              <span className="presence-pin-name">Jeddah</span>
            </div>

            <div className="presence-pin-item">
              <span className="presence-pin-icon">📍</span>
              <span className="presence-pin-name">Bahrain</span>
            </div>

            <div className="presence-pin-item">
              <span className="presence-pin-icon">📍</span>
              <span className="presence-pin-name">India</span>
            </div>
          </div>

          {/* Right: World Map with Hub Arcs */}
          <div className="about-presence-map-wrap">
            <svg viewBox="0 0 420 180" className="about-presence-svg-map">
              {/* Simplified world continents outlines */}
              <path 
                d="M40,50 Q60,40 85,55 Q100,75 80,105 Q60,130 50,110 Z" 
                fill="#E2E8F0" 
                opacity="0.8" 
              />
              <path 
                d="M75,115 Q95,120 110,140 Q105,170 85,165 Q70,145 75,115 Z" 
                fill="#E2E8F0" 
                opacity="0.8" 
              />
              <path 
                d="M170,40 Q210,35 240,50 Q235,80 200,85 Q175,70 170,40 Z" 
                fill="#E2E8F0" 
                opacity="0.8" 
              />
              <path 
                d="M185,90 Q220,95 225,135 Q205,160 190,140 Z" 
                fill="#E2E8F0" 
                opacity="0.8" 
              />
              <path 
                d="M245,45 Q310,40 350,65 Q330,115 285,110 Q250,85 245,45 Z" 
                fill="#E2E8F0" 
                opacity="0.8" 
              />
              <path 
                d="M320,125 Q355,120 365,150 Q340,165 315,150 Z" 
                fill="#E2E8F0" 
                opacity="0.8" 
              />

              {/* Trade Connection Arcs from Dammam/Jeddah (Arabian Gulf) to Bahrain, India, Red Sea */}
              {/* Dammam Hub: (235, 78), Jeddah: (220, 88), Bahrain: (240, 77), India Hub: (282, 92) */}
              <path 
                d="M220,88 Q228,80 235,78" 
                fill="none" 
                stroke="var(--red-corporate)" 
                strokeWidth="1.8" 
                strokeDasharray="2,2" 
              />
              <path 
                d="M235,78 Q238,76 242,77" 
                fill="none" 
                stroke="var(--red-corporate)" 
                strokeWidth="1.8" 
              />
              <path 
                d="M235,78 Q260,65 282,92" 
                fill="none" 
                stroke="var(--red-corporate)" 
                strokeWidth="2" 
              />
              <path 
                d="M235,78 Q180,60 120,70" 
                fill="none" 
                stroke="#94A3B8" 
                strokeWidth="1.2" 
                strokeDasharray="3,3" 
              />
              <path 
                d="M282,92 Q320,110 340,135" 
                fill="none" 
                stroke="#94A3B8" 
                strokeWidth="1.2" 
                strokeDasharray="3,3" 
              />

              {/* Glowing Hub Nodes */}
              {/* Dammam Main HQ */}
              <circle cx="235" cy="78" r="4.5" fill="var(--red-corporate)" />
              <circle cx="235" cy="78" r="7.5" fill="none" stroke="var(--red-corporate)" strokeWidth="1" opacity="0.6" />

              {/* Jeddah Hub */}
              <circle cx="220" cy="88" r="3.5" fill="var(--red-corporate)" />

              {/* Bahrain Hub */}
              <circle cx="242" cy="77" r="3.2" fill="var(--red-corporate)" />

              {/* India Network Hub */}
              <circle cx="282" cy="92" r="4" fill="var(--red-corporate)" />
              <circle cx="282" cy="92" r="6.5" fill="none" stroke="var(--red-corporate)" strokeWidth="1" opacity="0.5" />
            </svg>

            <div className="presence-motto-stack">
              <div>MOVING</div>
              <div>BUSINESS</div>
              <div>FURTHER</div>
              <div className="presence-red-line" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
