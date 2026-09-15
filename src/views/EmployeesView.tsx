import React, { useState } from 'react';
import { Employee, PageRoute } from '../types';
import { OfficialSignature } from '../components/OfficialSignature';
import { EmployeeAvatar } from '../components/EmployeeAvatar';

interface EmployeesViewProps {
  employees: Employee[];
  onNavigate: (route: PageRoute) => void;
  onOpenLoginModal: (portal?: 'employee' | 'management' | 'admin') => void;
  externalSearchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  employees,
  onNavigate,
  onOpenLoginModal,
  externalSearchQuery = '',
  onSearchChange
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedEmployeeForModal, setSelectedEmployeeForModal] = useState<Employee | null>(null);
  const [contactAdminModal, setContactAdminModal] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  // Combine external header search with local search
  const activeSearch = externalSearchQuery || internalSearch;

  const handleResetFilters = () => {
    setInternalSearch('');
    if (onSearchChange) onSearchChange('');
    setSelectedDept('All Departments');
    setSelectedLocation('All Locations');
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
      emp.jobTitle.toLowerCase().includes(activeSearch.toLowerCase()) ||
      emp.department.toLowerCase().includes(activeSearch.toLowerCase()) ||
      emp.id.toLowerCase().includes(activeSearch.toLowerCase());

    const matchesDept = selectedDept === 'All Departments' || emp.department === selectedDept;
    const matchesLocation = selectedLocation === 'All Locations' || emp.locations.includes(selectedLocation) || emp.office.includes(selectedLocation);

    return matchesSearch && matchesDept && matchesLocation;
  });

  return (
    <div className="employees-page-wrap">
      {/* ================= 1. TEAM HERO ================= */}
      <section className="team-hero-section">
        <div className="team-hero-overlay" />
        
        <div className="team-hero-container">
          {/* Left Hero Content */}
          <div className="team-hero-left">
            <div className="team-hero-preheading">
              OUR PEOPLE. OUR STRENGTH.
            </div>
            
            <h1 style={{ margin: 0 }}>
              <span className="team-hero-title-our">OUR</span>
              <span className="team-hero-title-team">TEAM</span>
            </h1>

            <p className="team-hero-subtext">
              Connect with our team and get your official email signature.
            </p>

            <div className="team-hero-accent-line" />

            <div className="team-badges-row">
              <div className="team-badge-item">
                <span className="team-badge-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </span>
                <span>Professional Signatures</span>
              </div>

              <div className="team-badge-item">
                <span className="team-badge-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </span>
                <span>Unified Brand Identity</span>
              </div>

              <div className="team-badge-item">
                <span className="team-badge-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18"></path>
                    <path d="M9 8h1"></path>
                    <path d="M9 12h1"></path>
                    <path d="M9 16h1"></path>
                    <path d="M14 8h1"></path>
                    <path d="M14 12h1"></path>
                    <path d="M14 16h1"></path>
                    <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path>
                  </svg>
                </span>
                <span>One Team One Company</span>
              </div>
            </div>
          </div>

          {/* Right Hero Corner Motto */}
          <div className="team-hero-right-motto">
            <div className="team-motto-stack">
              <div>PEOPLE</div>
              <div>OPERATIONS</div>
              <div>PROGRESS</div>
            </div>
            <div className="team-script-tag">
              Global Connections Stronger Tomorrow
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. EMPLOYEE DIRECTORY ================= */}
      <section className="directory-section">
        {/* Header and Breadcrumbs */}
        <div className="directory-header-row">
          <div>
            <div className="directory-tag-wrap">
              <div className="directory-tag-line" />
              <span className="directory-tag-text">EMPLOYEES</span>
            </div>
            <h2 className="directory-title">Our Team</h2>
            <p className="directory-desc">
              Browse and select your profile to view and copy your official email signature.
            </p>
          </div>

          <div className="directory-breadcrumbs">
            <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>Home</a>
            &nbsp;&gt;&nbsp;
            <span>Employees</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="dir-filter-bar">
          <div className="dir-search-wrap">
            <span className="dir-search-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input 
              type="text"
              placeholder="Search by name, department or designation..."
              className="dir-search-input"
              value={activeSearch}
              onChange={(e) => {
                setInternalSearch(e.target.value);
                if (onSearchChange) onSearchChange(e.target.value);
              }}
              id="employee-directory-search-input"
            />
          </div>

          <div className="dir-select-wrap">
            <select 
              className="dir-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="All Departments">All Departments</option>
              <option value="Finance & Accounts">Finance &amp; Accounts</option>
              <option value="Operations">Operations</option>
              <option value="Logistics">Logistics</option>
              <option value="Administration">Administration</option>
              <option value="Customer Service">Customer Service</option>
              <option value="Documentation">Documentation</option>
              <option value="IT & Systems">IT &amp; Systems</option>
            </select>
          </div>

          <div className="dir-select-wrap">
            <select 
              className="dir-select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="All Locations">All Locations</option>
              <option value="Dammam">Dammam</option>
              <option value="Jeddah">Jeddah</option>
              <option value="Bahrain">Bahrain</option>
              <option value="India">India</option>
            </select>
          </div>

          <button 
            className="dir-btn-reset"
            onClick={handleResetFilters}
            id="employee-directory-reset-btn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span>Reset</span>
          </button>
        </div>

        {/* Employee Cards Grid */}
        <div className="employee-cards-grid">
          {filteredEmployees.map((emp) => (
            <div key={emp.id} className="employee-card" id={`emp-card-${emp.id}`}>
              {/* Premium Brand Logo / Avatar Circle */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                <EmployeeAvatar 
                  name={emp.name} 
                  photoUrl={emp.photoUrl || emp.avatarUrl} 
                  size={64} 
                />
              </div>

              {/* Name & Title */}
              <h3 className="employee-name">{emp.name}</h3>
              <div className="employee-job-title">{emp.jobTitle}</div>

              {/* Department & Location */}
              <div className="employee-meta-info">
                <div className="employee-meta-row">
                  <span className="employee-meta-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                      <path d="M9 22v-4h6v4"></path>
                      <path d="M8 6h.01"></path>
                      <path d="M16 6h.01"></path>
                      <path d="M8 10h.01"></path>
                      <path d="M16 10h.01"></path>
                      <path d="M8 14h.01"></path>
                      <path d="M16 14h.01"></path>
                    </svg>
                  </span>
                  <span>{emp.department}</span>
                </div>
                <div className="employee-meta-row">
                  <span className="employee-meta-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </span>
                  <span>Dammam</span>
                </div>
              </div>

              {/* View Signature Button */}
              <button 
                className="btn-card-view-sig"
                onClick={() => setSelectedEmployeeForModal(emp)}
                id={`btn-view-sig-${emp.id}`}
              >
                <span>View Signature</span>
                <span style={{ fontSize: '15px', lineHeight: 1 }}>&rarr;</span>
              </button>
            </div>
          ))}
        </div>

        {/* Empty Search Feedback */}
        {filteredEmployees.length === 0 && (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            marginBottom: '40px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '6px' }}>
              No employees found matching "{activeSearch}"
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '16px' }}>
              Currently only verified real employees are enrolled in the hub.
            </p>
            <button 
              className="dir-btn-reset"
              onClick={handleResetFilters}
              style={{ display: 'inline-flex' }}
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* ================= 3. CONTACT ADMIN SECTION ================= */}
        <div className="contact-admin-card">
          <div className="contact-admin-left">
            <div className="contact-admin-icon-circle">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div>
              <h3 className="contact-admin-title">Can't find your name?</h3>
              <p className="contact-admin-sub">
                Please contact the administration team to add or update your employee profile.
              </p>
            </div>
          </div>

          <button 
            className="btn-contact-admin"
            onClick={() => setContactAdminModal(true)}
            id="btn-contact-admin-trigger"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span>Contact Admin</span>
          </button>
        </div>

        {/* ================= 4. SIGNATURE STUDIO CTA BANNER ================= */}
        <div className="signature-studio-banner">
          <div className="banner-left-wrap">
            <div className="banner-logo-circle">
              <img 
                src="/assets/logo.png" 
                alt="ALAM ENGAZ PORT SERVICES CO." 
                loading="eager"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>
            <div>
              <div className="banner-preheading">ALAM ENGAZ PORT SERVICES CO.</div>
              <h2 className="banner-heading">One Team. One Identity.</h2>
              <p className="banner-subtext">Professional. Consistent. On Brand.</p>
            </div>
          </div>

          <button 
            className="btn-banner-studio"
            onClick={() => onNavigate('signature-studio')}
            id="btn-banner-signature-studio"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            <span>SIGNATURE STUDIO</span>
            <span style={{ fontSize: '15px', lineHeight: 1 }}>&rarr;</span>
          </button>
        </div>
      </section>

      {/* ================= 5. MASTER SIGNATURE MODAL ================= */}
      {selectedEmployeeForModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(11, 42, 85, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            maxWidth: '820px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '36px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setSelectedEmployeeForModal(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '24px',
                fontSize: '22px',
                color: '#64748B',
                cursor: 'pointer',
                lineHeight: 1
              }}
            >
              ✕
            </button>

            <div style={{ marginBottom: '24px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--red-corporate)',
                display: 'block',
                marginBottom: '4px'
              }}>
                OFFICIAL VERIFIED SIGNATURE
              </span>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--navy-primary)' }}>
                {selectedEmployeeForModal.name}
              </h2>
              <p style={{ fontSize: '14px', color: '#64748B' }}>
                {selectedEmployeeForModal.jobTitle} &bull; {selectedEmployeeForModal.department} &bull; ID: {selectedEmployeeForModal.id}
              </p>
            </div>

            {/* Render the Master Official Signature Component */}
            <OfficialSignature employee={selectedEmployeeForModal} showActions={true} />

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button 
                onClick={() => setSelectedEmployeeForModal(null)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#475569'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Admin Modal */}
      {contactAdminModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(11, 42, 85, 0.7)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy-primary)', marginBottom: '8px' }}>
              Contact Administration Team
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
              Submit a request to add your employee profile or update details.
            </p>

            {contactSent ? (
              <div style={{ padding: '14px', backgroundColor: '#ECFDF5', color: '#065F46', borderRadius: '6px', fontSize: '13.5px', fontWeight: 600 }}>
                ✓ Request submitted! HR &amp; IT Administration will contact you.
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                setContactSent(true);
                setTimeout(() => {
                  setContactSent(false);
                  setContactAdminModal(false);
                }, 2500);
              }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Your Name</label>
                  <input type="text" required placeholder="e.g. Employee Name" style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Email Address</label>
                  <input type="email" required placeholder="e.g. yourname@alamengaz.com" style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Details</label>
                  <textarea rows={3} required placeholder="Please provide your designation, department, and phone number..." style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '13px', fontFamily: 'inherit' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button type="button" onClick={() => setContactAdminModal(false)} style={{ padding: '8px 14px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>Cancel</button>
                  <button type="submit" style={{ padding: '8px 18px', backgroundColor: 'var(--red-corporate)', color: '#FFFFFF', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>Send Request</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
