import React, { useState } from 'react';
import { Employee } from '../types';
import { COMPANY_DETAILS } from '../data/initialData';
import { CENTRAL_ORIGINAL_LOGO, CENTRAL_ORIGINAL_LOGO_ALT } from '../constants/assets';
import { 
  generateOfficialSignatureHtml, 
  copySignatureRichText, 
  downloadSignatureHtml, 
  SignatureCustomization, 
  DEFAULT_CUSTOMIZATION 
} from '../utils/signatureHtmlGenerator';

interface OfficialSignatureProps {
  employee: Employee;
  showActions?: boolean;
  customization?: SignatureCustomization;
  showVerifiedBadge?: boolean;
  clean?: boolean;
}

export const OfficialSignature: React.FC<OfficialSignatureProps> = ({ 
  employee, 
  showActions = true,
  customization = DEFAULT_CUSTOMIZATION,
  showVerifiedBadge = false,
  clean = false
}) => {
  const [copiedState, setCopiedState] = useState<'none' | 'rich' | 'html'>('none');
  const [showHtmlModal, setShowHtmlModal] = useState(false);

  const c = { ...DEFAULT_CUSTOMIZATION, ...customization };
  const logoWidth = Math.round(140 * ((c.logoScale || 100) / 100));

  // Dynamic company name — from employee record, fallback to company settings
  const companyName = employee.companyName || COMPANY_DETAILS.name;
  const companyAddress = COMPANY_DETAILS.address;

  const plainTextVersion = [
    c.showBestRegards ? (c.bestRegardsText || 'Best Regards,') : '',
    '',
    employee.name,
    employee.jobTitle,
    `T: ${employee.phone} | E: ${employee.email} | W: ${employee.website}`,
    '',
    'A company, incorporated/registered under the Laws of SAUDI ARABIA, having its registered office at King Abdul Aziz Road, Near Dammam Sea Port, P.O. Box 2791, Dammam 32213, Eastern Province, Kingdom of Saudi Arabia.',
    '',
    employee.locations,
    companyName
  ].filter((line, i) => !(i === 0 && !c.showBestRegards)).join('\n');

  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}${CENTRAL_ORIGINAL_LOGO}` : CENTRAL_ORIGINAL_LOGO;
  const rawHtml = generateOfficialSignatureHtml(employee, logoUrl, c);


  const handleCopyRichText = async () => {
    const success = await copySignatureRichText(rawHtml, plainTextVersion);
    if (success) {
      setCopiedState('rich');
      setTimeout(() => setCopiedState('none'), 3500);
    }
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(rawHtml);
      setCopiedState('html');
      setTimeout(() => setCopiedState('none'), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = () => {
    downloadSignatureHtml(employee, rawHtml);
  };

  return (
    <div className="signature-container-wrap">
      {/* Verified Badge */}
      {showVerifiedBadge && (
        <div className="signature-badge-verified">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>OFFICIAL MASTER SIGNATURE TEMPLATE — EMAIL CLIENT VERIFIED</span>
        </div>
      )}

      {/* Copy success alerts */}
      {copiedState === 'rich' && (
        <div style={{
          backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46',
          padding: '12px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600,
          marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <span>✓ Signature copied! Open Gmail, Outlook, or Apple Mail and press <strong>Ctrl+V</strong> / <strong>Cmd+V</strong> to paste.</span>
        </div>
      )}
      {copiedState === 'html' && (
        <div style={{
          backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF',
          padding: '12px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600,
          marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <span>✓ Raw HTML code copied to clipboard!</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          OFFICIAL MASTER EMAIL SIGNATURE
          Structure is IDENTICAL to generateOfficialSignatureHtml().
          LEFT (valign=top): Best Regards → small gap → Logo
          DIVIDER: narrow td with border-left (Outlook-safe)
          RIGHT (valign=top): Employee information
      ═══════════════════════════════════════════════════════════════ */}
      <div
        className={clean ? 'signature-card-clean' : 'signature-card-preview'}
        id="official-signature-rendered"
        style={clean ? {
          backgroundColor: '#FFFFFF',
          width: '100%',
          overflowX: 'auto'
        } : {
          backgroundColor: '#FFFFFF',
          padding: '28px',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflowX: 'auto'
        }}
      >
        <table
          cellPadding="0"
          cellSpacing="0"
          border={0}
          style={{
            fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
            fontSize: '13px',
            lineHeight: 1.4,
            color: '#1f2937',
            backgroundColor: '#ffffff',
            borderCollapse: 'collapse'
          }}
        >
          <tbody>
            {/* ROW 1: Best Regards (sits above logo and divider) */}
            {c.showBestRegards && (
              <tr>
                <td
                  colSpan={3}
                  align="left"
                  style={{
                    padding: `${c.bestRegardsY || 0}px 0 ${c.bestRegardsSpaceBelow || 10}px ${c.bestRegardsX || 0}px`,
                    fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
                    fontSize: `${c.bestRegardsFontSize || 14}px`,
                    fontWeight: (c.bestRegardsFontWeight || '700') as React.CSSProperties['fontWeight'],
                    color: c.bestRegardsColor || '#7D0727',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {c.bestRegardsText || 'Best Regards,'}
                </td>
              </tr>
            )}

            {/* ROW 2: Main Signature Row (Logo | Divider | Details) */}
            <tr>
              {/* LEFT COLUMN: Logo */}
              <td
                valign="top"
                style={{
                  padding: `${c.logoY || 0}px ${c.logoSpaceToDivider ?? 8}px 0 ${c.logoX || 0}px`,
                  verticalAlign: 'top',
                  width: `${logoWidth}px`
                }}
              >
                {c.showLogo && (
                  <img
                    src={CENTRAL_ORIGINAL_LOGO}
                    alt={companyName}
                    width={logoWidth}
                    style={{
                      display: 'block',
                      width: `${logoWidth}px`,
                      maxWidth: `${logoWidth}px`,
                      height: 'auto',
                      border: 0,
                      outline: 'none',
                      textDecoration: 'none'
                    }}
                  />
                )}
              </td>

              {/* CENTER COLUMN: Thin Burgundy Divider (border-left, Outlook-safe) */}
              <td
                valign="top"
                style={{
                  borderLeft: '1.5px solid #7D0727',
                  padding: 0,
                  fontSize: 0,
                  lineHeight: 0,
                  width: 1,
                  verticalAlign: 'top'
                }}
              >&nbsp;</td>

              {/* RIGHT COLUMN: Employee Information */}
              <td
                valign="top"
                style={{
                  padding: '4px 0 0 15px',
                  verticalAlign: 'top'
                }}
              >
                {/* Employee Name */}
                <div style={{
                  fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
                  fontSize: '14.5px',
                  fontWeight: 800,
                  color: '#7D0727',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '5px',
                  lineHeight: 1
                }}>
                  {employee.name}
                </div>

                {/* Job Title */}
                <div style={{
                  fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
                  fontSize: '12px',
                  fontWeight: 400,
                  color: '#4B5563',
                  marginBottom: '8px',
                  lineHeight: 1
                }}>
                  {employee.jobTitle}
                </div>

                {/* Contact Row */}
                <div style={{
                  fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
                  fontSize: '11px',
                  marginBottom: '10px',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap'
                }}>
                  <strong style={{ color: '#7D0727' }}>T:</strong>{' '}
                  <a href={`tel:${employee.phone.replace(/\s/g, '')}`} style={{ color: '#222222', textDecoration: 'none' }}>{employee.phone}</a>
                  &nbsp;<span style={{ color: '#7D0727', fontWeight: 700 }}>|</span>&nbsp;{' '}
                  <strong style={{ color: '#7D0727' }}>E:</strong>{' '}
                  <a href={`mailto:${employee.email}`} style={{ color: '#7D0727', textDecoration: 'none' }}>{employee.email}</a>
                  &nbsp;<span style={{ color: '#7D0727', fontWeight: 700 }}>|</span>&nbsp;{' '}
                  <strong style={{ color: '#7D0727' }}>W:</strong>{' '}
                  <a href={`https://${employee.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#7D0727', textDecoration: 'none' }}>{employee.website}</a>
                </div>

                {/* Company Address with specific bold parts */}
                <div
                  style={{
                    fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
                    fontSize: '10px',
                    lineHeight: 1.4,
                    color: '#555555',
                    marginBottom: '8px',
                    maxWidth: '475px'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: `A company, incorporated/registered under the Laws of <strong style="color: #222222; font-weight: 700;">SAUDI ARABIA</strong>, having its registered office at<br /><strong style="color: #222222; font-weight: 700;">King Abdul Aziz Road</strong>, Near Dammam Sea Port, P.O. Box 2791, Dammam 32213, Eastern Province,<br />Kingdom of Saudi Arabia.`
                  }}
                />

                {/* Locations */}
                <div style={{
                  fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
                  fontSize: '10.5px',
                  fontWeight: 500,
                  color: '#64748B',
                  marginBottom: '8px',
                  lineHeight: 1
                }}>
                  {employee.locations.split('|').map((loc, idx, arr) => (
                    <React.Fragment key={idx}>
                      <span>{loc.trim()}</span>
                      {idx < arr.length - 1 && <span style={{ color: '#94A3B8', margin: '0 5px' }}>|</span>}
                    </React.Fragment>
                  ))}
                </div>

                {/* Company Name — dynamic */}
                <div style={{
                  fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#7D0727',
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  lineHeight: 1
                }}>
                  {companyName}
                </div>

                {/* Social icons (optional) */}
                {c.showSocialIcons && (
                  <div style={{ marginTop: '8px', paddingTop: '6px', fontSize: '11px', color: '#64748B' }}>
                    <a href="https://linkedin.com" target="_blank" rel="noreferrer" style={{ color: '#0B2A55', textDecoration: 'none', fontWeight: 600, marginRight: '10px' }}>LinkedIn</a>
                    <a href="https://youtube.com" target="_blank" rel="noreferrer" style={{ color: '#0B2A55', textDecoration: 'none', fontWeight: 600, marginRight: '10px' }}>YouTube</a>
                    <a href="https://instagram.com" target="_blank" rel="noreferrer" style={{ color: '#0B2A55', textDecoration: 'none', fontWeight: 600 }}>Instagram</a>
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="signature-action-bar">
          <button className="btn-sig-action btn-sig-red" onClick={handleCopyRichText} id="btn-copy-signature-rich">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy Signature (Rich Format)
          </button>
          <button className="btn-sig-action btn-sig-navy" onClick={handleCopyHtml} id="btn-copy-signature-html">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
            Copy HTML Code
          </button>
          <button className="btn-sig-action btn-sig-white" onClick={handleDownload} id="btn-download-signature-file">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download HTML File
          </button>
          <button className="btn-sig-action btn-sig-white" onClick={() => setShowHtmlModal(true)} id="btn-view-raw-code">
            View Code
          </button>
        </div>
      )}

      {/* Raw HTML inspection modal */}
      {showHtmlModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(11,42,85,0.65)',
          backdropFilter: 'blur(4px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '8px', maxWidth: '700px', width: '100%',
            maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid #E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0B2A55' }}>Master Signature HTML Code</h3>
              <button onClick={() => setShowHtmlModal(false)}
                style={{ fontSize: '20px', color: '#64748B', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>
                ✕
              </button>
            </div>
            <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
              <pre style={{
                backgroundColor: '#0B2A55', color: '#E2E8F0', padding: '16px',
                borderRadius: '6px', fontSize: '12px', lineHeight: 1.5,
                whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace'
              }}>
                {rawHtml}
              </pre>
            </div>
            <div style={{
              padding: '14px 24px', borderTop: '1px solid #E2E8F0',
              display: 'flex', justifyContent: 'flex-end', gap: '12px'
            }}>
              <button className="btn-sig-action btn-sig-white" onClick={() => setShowHtmlModal(false)}>Close</button>
              <button className="btn-sig-action btn-sig-red" onClick={() => { handleCopyHtml(); setShowHtmlModal(false); }}>
                Copy HTML Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
