import React from 'react';

interface LoginCtaSectionProps {
  onOpenLogin: () => void;
}

export const LoginCtaSection: React.FC<LoginCtaSectionProps> = ({ onOpenLogin }) => {
  return (
    <section className="portal-section" style={{ padding: '64px 20px', backgroundColor: '#F8FAFC' }}>
      <div className="portal-container" style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
        <div className="section-header-center" style={{ marginBottom: '28px' }}>
          <span className="portal-badge" style={{
            display: 'inline-block',
            backgroundColor: '#FEF2F2',
            color: 'var(--red-corporate)',
            border: '1px solid #FECACA',
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '11.5px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            marginBottom: '12px'
          }}>
            AUTHORIZED ACCESS
          </span>
          <h2 className="portal-title" style={{
            fontSize: '30px',
            fontWeight: 800,
            color: 'var(--navy-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '10px'
          }}>
            ALAM ENGAZ Corporate Portal
          </h2>
          <p className="portal-subtitle" style={{
            fontSize: '15px',
            color: '#64748B',
            maxWidth: '560px',
            margin: '0 auto',
            lineHeight: 1.5
          }}>
            Single secure gateway for employee signature hub, executive management, and administrative control.
          </p>
        </div>

        {/* ONE CLEAN CTA: LOGIN */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          marginTop: '20px'
        }}>
          <button 
            className="btn-hero-primary"
            onClick={onOpenLogin}
            id="public-cta-login-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px 44px',
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              backgroundColor: 'var(--red-corporate)',
              color: '#FFFFFF',
              borderRadius: '6px',
              boxShadow: '0 4px 14px rgba(125, 7, 39, 0.25)',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>LOGIN</span>
          </button>
        </div>

        <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '16px' }}>
          Restricted access. All login attempts are recorded for corporate compliance and cybersecurity.
        </p>
      </div>
    </section>
  );
};
