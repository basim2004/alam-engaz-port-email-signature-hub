import React, { useState, useEffect } from 'react';
import { PageRoute } from '../types';
import { getMasterWebsiteData, subscribeToWebsiteData, DEFAULT_MASTER_DATA } from '../services/websiteContentService';

interface HeroSectionProps {
  onNavigate: (route: PageRoute) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  const [content, setContent] = useState(DEFAULT_MASTER_DATA.homepage);

  useEffect(() => {
    setContent(getMasterWebsiteData().homepage);
    const unsubscribe = subscribeToWebsiteData(data => {
      setContent(data.homepage);
    });
    return unsubscribe;
  }, []);

  return (
    <section className="hero-section">
      <div className="hero-overlay" />
      
      <div className="hero-container">
        {/* Left Main Content */}
        <div className="hero-main-content">
          <div className="hero-preheading">
            {content.heroPreheading}
          </div>
          <h1 className="hero-heading">
            {content.heroHeading}
          </h1>
          <div className="hero-accent-line" />
          
          <div className="hero-tagline">
            {content.heroTagline}
          </div>
          <p className="hero-subtext">
            {content.heroSubtext}
          </p>

          <div className="hero-buttons">
            <button 
              className="btn-hero-primary"
              onClick={() => onNavigate((content.cta1Link as PageRoute) || 'employees')}
              id="hero-browse-employee-btn"
            >
              {content.cta1Text}
            </button>
            <button 
              className="btn-hero-secondary"
              onClick={() => onNavigate((content.cta2Link as PageRoute) || 'signature-studio')}
              id="hero-signature-studio-btn"
            >
              {content.cta2Text}
            </button>
          </div>
        </div>

        {/* Bottom Bar: Moving Business Further & Locations */}
        <div className="hero-footer-bar">
          <div className="hero-brand-phrase">
            <span className="hero-brand-phrase-text">MOVING</span>
            <span className="hero-brand-phrase-text">BUSINESS</span>
            <span className="hero-brand-phrase-text">FURTHER</span>
            <div className="hero-phrase-accent" />
          </div>

          <div className="hero-locations">
            {content.locationsText}
          </div>
        </div>
      </div>
    </section>
  );
};
