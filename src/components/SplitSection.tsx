import React from 'react';

export const SplitSection: React.FC = () => {
  return (
    <section className="comm-section">
      <div className="comm-split-container">
        {/* Left Content */}
        <div className="comm-left">
          <div className="comm-preheading">
            ALAM ENGAZ PORT SERVICES CO.
          </div>
          <div className="comm-accent-line" />
          <h2 className="comm-heading">
            Professional Communication<br />
            for a Global Network
          </h2>
          <div className="comm-text">
            <p>Consistent signatures. A stronger brand.</p>
            <p>Connecting people, ports and opportunities.</p>
          </div>
        </div>

        {/* Right Slanted Image */}
        <div className="comm-right">
          <div className="comm-image-mask" style={{ position: 'relative' }}>
            <img 
              src="/assets/container-terminal.jpg" 
              alt="ALAM ENGAZ Maritime Port & Container Terminal" 
              className="comm-image" 
            />
            {/* Official ALAM ENGAZ Branding Overlay Badge */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              padding: '8px 16px',
              borderRadius: '6px',
              boxShadow: '0 8px 24px rgba(11, 42, 85, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid rgba(11, 42, 85, 0.1)',
              zIndex: 3
            }}>
              <img 
                src="/assets/logo.png" 
                alt="ALAM ENGAZ PORT SERVICES CO." 
                style={{ height: '26px', width: 'auto', objectFit: 'contain' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
              <div style={{ borderLeft: '1px solid #CBD5E1', paddingLeft: '8px', fontSize: '10.5px', fontWeight: 800, color: '#0B2A55', letterSpacing: '0.04em' }}>
                PORT SERVICES CO.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
