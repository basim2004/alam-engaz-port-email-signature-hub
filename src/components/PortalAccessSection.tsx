import React from 'react';

interface PortalAccessSectionProps {
  onOpenLoginModal: (portal: 'employee' | 'management' | 'admin') => void;
}

export const PortalAccessSection: React.FC<PortalAccessSectionProps> = ({ onOpenLoginModal }) => {
  return (
    <section className="portal-section">
      <div className="portal-container">
        <div className="section-header-center">
          <span className="portal-badge">ONE PLATFORM</span>
          <h2 className="portal-title">Access Your Portal</h2>
          <p className="portal-subtitle">
            Secure access for employees, management and administrators.
          </p>
        </div>

        <div className="portal-cards-grid">
          {/* Card 1: Employee Portal */}
          <div className="portal-card">
            <div>
              <h3 className="portal-card-title">EMPLOYEE PORTAL</h3>
              <p className="portal-card-desc">
                Access your profile, signature and tools.
              </p>
            </div>
            <button 
              className="btn-portal btn-portal-red"
              onClick={() => onOpenLoginModal('employee')}
              id="portal-card-employee-btn"
            >
              Employee Login
            </button>
          </div>

          {/* Card 2: Management Portal */}
          <div className="portal-card">
            <div>
              <h3 className="portal-card-title">MANAGEMENT PORTAL</h3>
              <p className="portal-card-desc">
                For CEO &amp; General Manager only.
              </p>
            </div>
            <button 
              className="btn-portal btn-portal-navy"
              onClick={() => onOpenLoginModal('management')}
              id="portal-card-management-btn"
            >
              Management Login
            </button>
          </div>

          {/* Card 3: Admin Panel */}
          <div className="portal-card">
            <div>
              <h3 className="portal-card-title">ADMIN PANEL</h3>
              <p className="portal-card-desc">
                Full system administration and control.
              </p>
            </div>
            <button 
              className="btn-portal btn-portal-outline"
              onClick={() => onOpenLoginModal('admin')}
              id="portal-card-admin-btn"
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
