import { Employee } from '../types';
import { COMPANY_DETAILS } from '../data/initialData';
import { CENTRAL_ORIGINAL_LOGO } from '../constants/assets';

export interface SignatureCustomization {

  showBestRegards?: boolean;
  bestRegardsText?: string;
  bestRegardsColor?: string;
  bestRegardsFontSize?: number;
  bestRegardsFontWeight?: string;
  bestRegardsX?: number;
  bestRegardsY?: number;
  bestRegardsSpaceBelow?: number;

  showLogo?: boolean;
  logoScale?: number; // percentage e.g. 100
  logoX?: number;
  logoY?: number;
  logoSpaceBelowRegards?: number;
  logoSpaceToDivider?: number;

  showSocialIcons?: boolean;
}

export const DEFAULT_CUSTOMIZATION: SignatureCustomization = {
  showBestRegards: true,
  bestRegardsText: 'Best Regards,',
  bestRegardsColor: '#7D0727',
  bestRegardsFontSize: 14,
  bestRegardsFontWeight: '700',
  bestRegardsX: 0,
  bestRegardsY: 0,
  bestRegardsSpaceBelow: 10,

  showLogo: true,
  logoScale: 100, // 100% = 140px width (Image 3 exact size)
  logoX: 0,
  logoY: 0,
  logoSpaceBelowRegards: 0,
  logoSpaceToDivider: 8,

  showSocialIcons: false
};

/**
 * Formats the official address with specific bold words matching Master Image 3:
 *  - "SAUDI ARABIA" in bold
 *  - "King Abdul Aziz Road" in bold
 *  - Preserves exact line break boundaries matching Image 3
 */
export function formatOfficialAddressHtml(): string {
  return `A company, incorporated/registered under the Laws of <strong style="color: #222222; font-weight: 700;">SAUDI ARABIA</strong>, having its registered office at<br /><strong style="color: #222222; font-weight: 700;">King Abdul Aziz Road</strong>, Near Dammam Sea Port, P.O. Box 2791, Dammam 32213, Eastern Province,<br />Kingdom of Saudi Arabia.`;
}

/**
 * Generates the official email-safe HTML signature matching Master Image 3 exactly.
 *
 * MASTER STRUCTURE (Image 3 Source of Truth):
 *
 *  ROW 1 (sits above logo and divider):
 *  Best Regards,
 *
 *  ROW 2:
 *  [LOGO] (140px) │ [BURGUNDY DIVIDER] │ [EMPLOYEE NAME (uppercase)]
 *                 │                      │ [Job Title]
 *                 │                      │ [T: | E: | W:]
 *                 │                      │ [Address with bold SAUDI ARABIA & King Abdul Aziz Road]
 *                 │                      │ [Dammam | Jeddah | Bahrain | India]
 *                 │                      │ [COMPANY NAME (uppercase bold burgundy)]
 *
 * Compatibility:
 *  - Pure table layout (no flex, no grid, no position:absolute, no CSS transforms)
 *  - Inline CSS only
 *  - Microsoft Outlook Desktop (Word rendering engine) safe
 *  - Gmail Web safe
 *  - Apple Mail safe
 */
export function generateOfficialSignatureHtml(
  employee: Employee,
  logoUrl: string = CENTRAL_ORIGINAL_LOGO,
  customization: SignatureCustomization = DEFAULT_CUSTOMIZATION
): string {
  const c = { ...DEFAULT_CUSTOMIZATION, ...customization };
  const logoWidth = Math.round(140 * ((c.logoScale || 100) / 100));

  // Company name is dynamic — comes from employee record, falling back to COMPANY_DETAILS
  const companyName = employee.companyName || COMPANY_DETAILS.name;

  // Best regards row: sits above logo and divider, left-aligned
  const bestRegardsRow = c.showBestRegards
    ? `  <tr>
    <td colspan="3" align="left" style="padding: ${c.bestRegardsY || 0}px 0 ${c.bestRegardsSpaceBelow ?? 10}px ${c.bestRegardsX || 0}px; font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: ${c.bestRegardsFontSize || 14}px; font-weight: ${c.bestRegardsFontWeight || '700'}; color: ${c.bestRegardsColor || '#7D0727'}; line-height: 1.2; mso-line-height-rule: exactly;">
      ${c.bestRegardsText || 'Best Regards,'}
    </td>
  </tr>\n`
    : '';

  // Logo block
  const logoBlock = c.showLogo
    ? `<img src="${logoUrl}" alt="${companyName}" width="${logoWidth}" style="display: block; width: ${logoWidth}px; max-width: ${logoWidth}px; height: auto; border: 0; outline: none; text-decoration: none;" />`
    : '';

  // Formatted locations with styled pipe separators
  const locationsHtml = employee.locations
    ? employee.locations.split('|').map(l => l.trim()).join(' <span style="color: #94A3B8;">|</span> ')
    : 'Dammam <span style="color: #94A3B8;">|</span> Jeddah <span style="color: #94A3B8;">|</span> Bahrain <span style="color: #94A3B8;">|</span> India';

  // Social icons (optional)
  const socialIconsHtml = c.showSocialIcons
    ? `<div style="margin-top: 8px; padding-top: 6px; font-size: 11px; color: #64748B; font-family: 'Segoe UI', Arial, Helvetica, sans-serif;">
        <a href="https://linkedin.com" target="_blank" style="color: #0B2A55; text-decoration: none; font-weight: 600; margin-right: 10px;">LinkedIn</a>
        <a href="https://youtube.com" target="_blank" style="color: #0B2A55; text-decoration: none; font-weight: 600; margin-right: 10px;">YouTube</a>
        <a href="https://instagram.com" target="_blank" style="color: #0B2A55; text-decoration: none; font-weight: 600;">Instagram</a>
      </div>`
    : '';

  // ── MASTER TABLE (Image 3 visual replica) ────────────────────────
  return `<!-- ALAM ENGAZ - OFFICIAL MASTER EMAIL SIGNATURE -->
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.4; color: #1f2937; background-color: #ffffff; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
${bestRegardsRow}  <tr>
    <!-- LEFT COLUMN: Logo -->
    <td valign="top" style="vertical-align: top; padding: ${c.logoY || 0}px ${c.logoSpaceToDivider ?? 8}px 0 ${c.logoX || 0}px; width: ${logoWidth}px; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
      ${logoBlock}
    </td>
    <!-- CENTER COLUMN: Thin Burgundy Divider (border-left, Outlook-safe) -->
    <td valign="top" style="vertical-align: top; width: 1px; border-left: 1.5px solid #7D0727; padding: 0; font-size: 0; line-height: 0; mso-line-height-rule: exactly;">
      &nbsp;
    </td>
    <!-- RIGHT COLUMN: Employee Information -->
    <td valign="top" style="vertical-align: top; padding: 4px 0 0 15px; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
      <div style="font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 14.5px; font-weight: 800; color: #7D0727; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; line-height: 1; mso-line-height-rule: exactly;">
        ${employee.name}
      </div>
      <div style="font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 400; color: #4B5563; margin-bottom: 8px; line-height: 1; mso-line-height-rule: exactly;">
        ${employee.jobTitle}
      </div>
      <div style="font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 11px; margin-bottom: 10px; line-height: 1.2; white-space: nowrap;">
        <strong style="color: #7D0727;">T:</strong> <a href="tel:${employee.phone.replace(/\s/g, '')}" style="color: #222222; text-decoration: none;">${employee.phone}</a>
        &nbsp;<span style="color: #7D0727; font-weight: 700;">|</span>&nbsp;
        <strong style="color: #7D0727;">E:</strong> <a href="mailto:${employee.email}" style="color: #7D0727; text-decoration: none;">${employee.email}</a>
        &nbsp;<span style="color: #7D0727; font-weight: 700;">|</span>&nbsp;
        <strong style="color: #7D0727;">W:</strong> <a href="https://${employee.website.replace(/^https?:\/\//, '')}" target="_blank" style="color: #7D0727; text-decoration: none;">${employee.website}</a>
      </div>
      <div style="font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 10px; line-height: 1.4; color: #555555; margin-bottom: 8px; max-width: 475px;">
        A company, incorporated/registered under the Laws of <strong style="color: #222222; font-weight: 700;">SAUDI ARABIA</strong>, having its registered office at<br /><strong style="color: #222222; font-weight: 700;">King Abdul Aziz Road</strong>, Near Dammam Sea Port, P.O. Box 2791, Dammam 32213, Eastern Province,<br />Kingdom of Saudi Arabia.
      </div>
      <div style="font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 10.5px; font-weight: 500; color: #64748B; margin-bottom: 8px; line-height: 1;">
        ${locationsHtml}
      </div>
      <div style="font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 800; color: #7D0727; letter-spacing: 0.6px; text-transform: uppercase; line-height: 1;">
        ${companyName}
      </div>
      ${socialIconsHtml}
    </td>
  </tr>
</table>`;
}

/**
 * Copies the signature as rich HTML to the clipboard.
 * Primary: Clipboard API with text/html + text/plain MIME types.
 * Fallback: execCommand('copy') for older browsers.
 */
export async function copySignatureRichText(html: string, plainText: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const blobHtml = new Blob([html], { type: 'text/html' });
      const blobPlain = new Blob([plainText], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobPlain
      });
      await navigator.clipboard.write([item]);
      return true;
    } else {
      // Fallback: execCommand for Safari / older browsers
      const container = document.createElement('div');
      container.innerHTML = html;
      container.style.position = 'fixed';
      container.style.pointerEvents = 'none';
      container.style.opacity = '0';
      document.body.appendChild(container);

      const range = document.createRange();
      range.selectNode(container);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('copy');
        selection.removeAllRanges();
      }
      document.body.removeChild(container);
      return true;
    }
  } catch (err) {
    console.error('Clipboard copy error:', err);
    return false;
  }
}

/**
 * Downloads the signature as a standalone HTML file.
 * The file contains the same email-safe HTML used for copy/paste.
 */
export function downloadSignatureHtml(employee: Employee, html: string): void {
  const companyName = employee.companyName || COMPANY_DETAILS.name;
  const fullDocument = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Email Signature — ${employee.name} | ${companyName}</title>
</head>
<body style="margin: 32px; font-family: 'Segoe UI', Arial, Helvetica, sans-serif; background: #ffffff;">
${html}
</body>
</html>`;
  const blob = new Blob([fullDocument], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const cleanName = (employee.name || 'Employee')
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('-');
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ALAM-ENGAZ-${cleanName}-Signature.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
