// ==========================================================================
// ALAM ENGAZ EMAIL SIGNATURE HUB — UNIFIED WEBSITE CONTENT & CMS SERVICE
// Persistent Firestore-ready data store for public website & admin modules
// ==========================================================================
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface HomepageContent {
  heroPreheading: string;
  heroHeading: string;
  heroTagline: string;
  heroSubtext: string;
  heroBackgroundImage: string;
  cta1Text: string;
  cta1Link: string;
  cta2Text: string;
  cta2Link: string;
  sloganText: string;
  locationsText: string;
  portalSectionTitle: string;
  portalSectionSubtitle: string;
  splitSectionTitle: string;
  splitSectionText: string;
}

export interface AboutContent {
  pagePreheading: string;
  pageTitle: string;
  pageSubtext: string;
  companyDescription: string;
  mission: string;
  vision: string;
  values: string;
  portsServed: string;
  vesselsHandled: string;
  teamMembers: string;
  uptime: string;
  brochureUrl: string;
}

export interface InstallationGuideContent {
  heroPreheading: string;
  heroTitle: string;
  heroSubtext: string;
  gmailGuidePublished: boolean;
  outlookWebPublished: boolean;
  outlookDesktopPublished: boolean;
  mobilePublished: boolean;
  troubleshootingPublished: boolean;
  tipsPublished: boolean;
  faqPublished: boolean;
}

export interface FooterContent {
  companyName: string;
  tagline: string;
  locations: string;
  websiteUrl: string;
  supportEmail: string;
  phone: string;
  socialLinkedin: string;
  socialYoutube: string;
  socialInstagram: string;
  privacyPolicyText: string;
  termsOfUseText: string;
  copyrightText: string;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/svg+xml';
  size: string;
  dimensions?: string;
  uploadedDate: string;
  uploadedBy: string;
  category: 'Logos' | 'Banners' | 'Avatars' | 'Port Photos';
  isOfficialLogo?: boolean;
}

export interface PdfGuideItem {
  id: string;
  title: string;
  category: string;
  description: string;
  pages: number;
  fileSize: string;
  version: string;
  uploadDate: string;
  isPublished: boolean;
  status: 'AVAILABLE' | 'COMING_SOON';
  downloadUrl?: string;
}

export interface VideoTutorialItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: 'Getting Started' | 'Studio' | 'Email Clients' | 'Security';
  status: 'Active' | 'Draft' | 'Archived';
}

export interface ExtendedAdminUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'CONTENT_ADMIN' | 'EMPLOYEE_ADMIN';
  status: 'Active' | 'Inactive' | 'Suspended';
  lastLogin: string;
  createdAt: string;
  department?: string;
}

export interface AuditActivityLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  module: 'Employees' | 'Signatures' | 'Guides' | 'Website' | 'Media' | 'Admin' | 'Security';
  target: string;
  details: string;
  ipAddress: string;
  status: 'Success' | 'Failed' | 'Warning';
}

export interface MasterWebsiteData {
  homepage: HomepageContent;
  about: AboutContent;
  installation: InstallationGuideContent;
  footer: FooterContent;
  activeLogoUrl: string;
  activeFaviconUrl: string;
  mediaItems: MediaItem[];
  pdfGuides: PdfGuideItem[];
  videoTutorials: VideoTutorialItem[];
  adminUsers: ExtendedAdminUser[];
  auditLogs: AuditActivityLog[];
}

const STORAGE_KEY = 'alamengaz_master_website_cms_v1';

// Default initial state matching approved ALAM ENGAZ design
export const DEFAULT_MASTER_DATA: MasterWebsiteData = {
  homepage: {
    heroPreheading: 'ALAM ENGAZ PORT SERVICES CO.',
    heroHeading: 'EMAIL SIGNATURE HUB',
    heroTagline: 'One Port. One Team. One Professional Identity.',
    heroSubtext: 'Official email signatures for the ALAM ENGAZ team.',
    heroBackgroundImage: '/assets/hero-ship.jpg',
    cta1Text: 'Browse Employee',
    cta1Link: 'employees',
    cta2Text: 'Signature Studio',
    cta2Link: 'signature-studio',
    sloganText: 'MOVING BUSINESS FURTHER',
    locationsText: 'Dammam | Jeddah | Bahrain | India',
    portalSectionTitle: 'Access Your Portal',
    portalSectionSubtitle: 'Secure role-based access for employees, management, and administrative personnel.',
    splitSectionTitle: 'One Professional Identity Across Every Port',
    splitSectionText: 'Ensure unified corporate presence across all maritime communications with certified signature templates and guidelines.'
  },
  about: {
    pagePreheading: 'PEOPLE . PORTS . POSSIBILITIES',
    pageTitle: 'ABOUT ALAM ENGAZ',
    pageSubtext: 'A trusted name in port services, built on commitment, expertise and global connections.',
    companyDescription: 'ALAM ENGAZ PORT SERVICES CO. is a distinguished maritime logistics, cargo agency, and port operations company incorporated in Saudi Arabia, serving Dammam Sea Port, Jeddah Islamic Port, Bahrain, and India.',
    mission: 'To empower maritime commerce with uncompromising operational precision, standardized corporate identities, and certified port agency services.',
    vision: 'To remain the most reliable benchmark of operational integrity and digital standardization across Middle Eastern maritime logistics.',
    values: 'Operational Integrity, Maritime Precision, Verified Identity, Global Connectivity, and Team Dedication.',
    portsServed: '4 Major Ports',
    vesselsHandled: '1,200+ Annually',
    teamMembers: '500+ Specialists',
    uptime: '99.98% Service Uptime',
    brochureUrl: '/assets/guides/alamengaz-corporate-brochure.pdf'
  },
  installation: {
    heroPreheading: 'SETUP · USE · STAY PROFESSIONAL',
    heroTitle: 'INSTALLATION GUIDE',
    heroSubtext: 'Step-by-step instructions to set up your ALAM ENGAZ email signature in Gmail, Outlook and other email clients.',
    gmailGuidePublished: true,
    outlookWebPublished: true,
    outlookDesktopPublished: true,
    mobilePublished: true,
    troubleshootingPublished: true,
    tipsPublished: true,
    faqPublished: true
  },
  footer: {
    companyName: 'ALAM ENGAZ PORT SERVICES CO.',
    tagline: 'MOVING BUSINESS FURTHER',
    locations: 'Dammam | Jeddah | Bahrain | India',
    websiteUrl: 'www.alamengaz.com',
    supportEmail: 'it@alamengaz.com',
    phone: '+966 54 69 79 474',
    socialLinkedin: 'https://linkedin.com',
    socialYoutube: 'https://youtube.com',
    socialInstagram: 'https://instagram.com',
    privacyPolicyText: 'Privacy Policy: All corporate signature data encrypted and audited.',
    termsOfUseText: 'Terms of Use: ALAM ENGAZ Port Services Co.',
    copyrightText: '© 2026 ALAM ENGAZ PORT SERVICES CO. All rights reserved.'
  },
  activeLogoUrl: '/assets/logo.png',
  activeFaviconUrl: '/assets/logo.png',
  mediaItems: [
    {
      id: 'med-01',
      name: 'ALAM ENGAZ Official Primary Logo',
      url: '/assets/logo.png',
      type: 'image/png',
      size: '24.8 KB',
      dimensions: '300 × 75 px',
      uploadedDate: '2026-01-10',
      uploadedBy: 'Basim Aslam (Super Admin)',
      category: 'Logos',
      isOfficialLogo: true
    },
    {
      id: 'med-02',
      name: 'Container Terminal Port View',
      url: '/assets/container-terminal.jpg',
      type: 'image/jpeg',
      size: '184.2 KB',
      dimensions: '1920 × 1080 px',
      uploadedDate: '2026-02-15',
      uploadedBy: 'Content Admin',
      category: 'Port Photos'
    },
    {
      id: 'med-03',
      name: 'Maritime Cargo Ship at Sunset',
      url: '/assets/hero-ship.jpg',
      type: 'image/jpeg',
      size: '210.5 KB',
      dimensions: '1920 × 1080 px',
      uploadedDate: '2026-02-18',
      uploadedBy: 'Content Admin',
      category: 'Banners'
    },
    {
      id: 'med-04',
      name: 'Port Logistics Team in Action',
      url: '/assets/team-hero.jpg',
      type: 'image/jpeg',
      size: '195.0 KB',
      dimensions: '1600 × 900 px',
      uploadedDate: '2026-03-01',
      uploadedBy: 'Content Admin',
      category: 'Port Photos'
    },
    {
      id: 'med-05',
      name: 'Official Mobile App Icon',
      url: '/assets/app-icon.png',
      type: 'image/png',
      size: '18.4 KB',
      dimensions: '192 × 192 px',
      uploadedDate: '2026-03-05',
      uploadedBy: 'Basim Aslam (Super Admin)',
      category: 'Logos'
    }
  ],
  pdfGuides: [
    {
      id: 'guide-01',
      title: 'Complete Website & Portal User Guide',
      category: 'Master Guide',
      description: 'Comprehensive operational manual covering all employee and executive hub tools.',
      pages: 18,
      fileSize: '2.4 MB',
      version: 'v1.4',
      uploadDate: '2026-08-15',
      isPublished: true,
      status: 'AVAILABLE',
      downloadUrl: '/assets/guides/complete-website-guide.pdf'
    },
    {
      id: 'guide-02',
      title: 'Signature Studio Quick-Start Guide',
      category: 'Studio Guide',
      description: 'Step-by-step visual walkthrough to generate, customize, and export verified signatures.',
      pages: 8,
      fileSize: '1.2 MB',
      version: 'v1.2',
      uploadDate: '2026-08-20',
      isPublished: true,
      status: 'AVAILABLE',
      downloadUrl: '/assets/guides/signature-studio-guide.pdf'
    },
    {
      id: 'guide-03',
      title: 'Universal Installation & Setup Manual',
      category: 'Installation Guide',
      description: 'Clear instructions for desktop clients, web portals, and mobile configurations.',
      pages: 14,
      fileSize: '1.8 MB',
      version: 'v2.0',
      uploadDate: '2026-08-22',
      isPublished: true,
      status: 'AVAILABLE',
      downloadUrl: '/assets/guides/installation-guide.pdf'
    },
    {
      id: 'guide-04',
      title: 'Gmail Web & Mobile App Setup Guide',
      category: 'Email Client Guide',
      description: 'Detailed instructions to paste and align HTML email signatures in Google Workspace.',
      pages: 6,
      fileSize: '890 KB',
      version: 'v1.1',
      uploadDate: '2026-08-25',
      isPublished: true,
      status: 'AVAILABLE',
      downloadUrl: '/assets/guides/gmail-guide.pdf'
    },
    {
      id: 'guide-05',
      title: 'Microsoft Outlook 365 & Desktop Client Guide',
      category: 'Email Client Guide',
      description: 'Configuration for Outlook desktop application (Windows & Mac) with automatic rendering.',
      pages: 10,
      fileSize: '1.5 MB',
      version: 'v1.3',
      uploadDate: '2026-08-28',
      isPublished: true,
      status: 'AVAILABLE',
      downloadUrl: '/assets/guides/outlook-guide.pdf'
    },
    {
      id: 'guide-06',
      title: 'Mobile OS Configuration Guide (iOS & Android)',
      category: 'Mobile Guide',
      description: 'Native Mail app instructions for iPhone, iPad, Samsung Mail, and Gmail mobile apps.',
      pages: 7,
      fileSize: '1.1 MB',
      version: 'v1.0',
      uploadDate: '2026-09-01',
      isPublished: true,
      status: 'AVAILABLE',
      downloadUrl: '/assets/guides/mobile-guide.pdf'
    },
    {
      id: 'guide-07',
      title: 'Corporate Signature Troubleshooting Handbook',
      category: 'Support Guide',
      description: 'Resolutions for missing images, font scaling, mobile rendering glitches, and Outlook spacing.',
      pages: 12,
      fileSize: '1.6 MB',
      version: 'v1.5',
      uploadDate: '2026-09-05',
      isPublished: true,
      status: 'AVAILABLE',
      downloadUrl: '/assets/guides/troubleshooting-guide.pdf'
    },
    {
      id: 'guide-08',
      title: 'ALAM ENGAZ Brand & Usage Guidelines',
      category: 'Branding Guide',
      description: 'Official typography, color codes, logo clear-space rules, and email etiquette standards.',
      pages: 16,
      fileSize: '3.1 MB',
      version: 'v2.1',
      uploadDate: '2026-09-10',
      isPublished: false,
      status: 'COMING_SOON'
    }
  ],
  videoTutorials: [
    {
      id: 'vid-01',
      title: 'Signature Studio Walkthrough',
      description: 'Comprehensive 4-minute tutorial demonstrating how to select employee details, preview live signatures, and copy clean HTML.',
      duration: '4:15',
      videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      thumbnailUrl: '/assets/hero-ship.jpg',
      category: 'Studio',
      status: 'Active'
    },
    {
      id: 'vid-02',
      title: 'Configuring Outlook Desktop Client',
      description: 'Visual step-by-step setup in Outlook 365 on Windows without font scaling or line-break distortion.',
      duration: '3:20',
      videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      thumbnailUrl: '/assets/container-terminal.jpg',
      category: 'Email Clients',
      status: 'Active'
    },
    {
      id: 'vid-03',
      title: 'Gmail Web Client Setup',
      description: 'Learn how to insert your verified ALAM ENGAZ HTML signature into Gmail settings in less than 2 minutes.',
      duration: '2:10',
      videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      thumbnailUrl: '/assets/team-hero.jpg',
      category: 'Email Clients',
      status: 'Active'
    },
    {
      id: 'vid-04',
      title: 'Mobile Setup on iPhone & Android',
      description: 'Quick walkthrough showing how to send the signature via email and paste it into native mobile mail settings.',
      duration: '3:45',
      videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      thumbnailUrl: '/assets/container-terminal.jpg',
      category: 'Getting Started',
      status: 'Active'
    }
  ],
  adminUsers: [
    {
      id: 'adm-root',
      name: 'Basim Aslam',
      email: 'basim@alamengaz.com',
      role: 'SUPER_ADMIN',
      status: 'Active',
      lastLogin: 'Today at 03:15 PM',
      createdAt: '2026-01-10',
      department: 'Executive Operations'
    },
    {
      id: 'adm-02',
      name: 'Tariq Al-Harbi',
      email: 'tariq@alamengaz.com',
      role: 'CONTENT_ADMIN',
      status: 'Active',
      lastLogin: 'Yesterday at 05:20 PM',
      createdAt: '2026-02-01',
      department: 'Corporate Communications'
    },
    {
      id: 'adm-03',
      name: 'Fahad Al-Otaibi',
      email: 'fahad@alamengaz.com',
      role: 'EMPLOYEE_ADMIN',
      status: 'Active',
      lastLogin: '2 days ago',
      createdAt: '2026-02-15',
      department: 'Human Resources'
    }
  ],
  auditLogs: [
    {
      id: 'AUD-101',
      timestamp: '2026-09-13 14:15:22',
      user: 'Basim Aslam',
      role: 'SUPER_ADMIN',
      action: 'Website Content Updated',
      module: 'Website',
      target: 'Homepage Hero & Portals',
      details: 'Updated tagline and synchronized port locations across Saudi Arabia, Bahrain, and India.',
      ipAddress: '192.168.1.104 (Dammam HQ)',
      status: 'Success'
    },
    {
      id: 'AUD-102',
      timestamp: '2026-09-13 13:40:05',
      user: 'Tariq Al-Harbi',
      role: 'CONTENT_ADMIN',
      action: 'Guide Published',
      module: 'Guides',
      target: 'Universal Installation Manual (v2.0)',
      details: 'Published verified PDF guide with updated Outlook 365 screenshots.',
      ipAddress: '192.168.1.112 (Operations)',
      status: 'Success'
    },
    {
      id: 'AUD-103',
      timestamp: '2026-09-13 11:20:19',
      user: 'Basim Aslam',
      role: 'SUPER_ADMIN',
      action: 'Media Asset Registered',
      module: 'Media',
      target: 'Official ALAM ENGAZ Logo',
      details: 'Verified high-resolution PNG asset as active corporate logo.',
      ipAddress: '192.168.1.104 (Dammam HQ)',
      status: 'Success'
    },
    {
      id: 'AUD-104',
      timestamp: '2026-09-13 09:12:45',
      user: 'Fahad Al-Otaibi',
      role: 'EMPLOYEE_ADMIN',
      action: 'Employee Verified',
      module: 'Employees',
      target: 'MUHAMMED NASEEH (AE-1037)',
      details: 'Validated official designation: Accountant (Finance & Accounts).',
      ipAddress: '192.168.1.120 (HR Dept)',
      status: 'Success'
    },
    {
      id: 'AUD-105',
      timestamp: '2026-09-12 16:30:10',
      user: 'Basim Aslam',
      role: 'SUPER_ADMIN',
      action: 'Security Audit Verification',
      module: 'Security',
      target: 'Authentication & Session Policies',
      details: 'Confirmed 2FA policies and 8-hour session timeout across administrative consoles.',
      ipAddress: '192.168.1.104 (Dammam HQ)',
      status: 'Success'
    }
  ]
};

// Listeners for reactivity across public website components
type ListenerCallback = (data: MasterWebsiteData) => void;
const listeners: Set<ListenerCallback> = new Set();

export function subscribeToWebsiteData(cb: ListenerCallback): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notifyListeners(data: MasterWebsiteData) {
  listeners.forEach(cb => {
    try {
      cb(data);
    } catch (e) {
      console.error('Error notifying website data listener:', e);
    }
  });
}

// Live Firestore synchronization
if (typeof window !== 'undefined') {
  try {
    const docRef = doc(db, 'companySettings', 'masterWebsiteData');
    onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const liveData = snap.data() as MasterWebsiteData;
        const merged: MasterWebsiteData = {
          ...DEFAULT_MASTER_DATA,
          ...liveData,
          homepage: { ...DEFAULT_MASTER_DATA.homepage, ...(liveData.homepage || {}) },
          about: { ...DEFAULT_MASTER_DATA.about, ...(liveData.about || {}) },
          installation: { ...DEFAULT_MASTER_DATA.installation, ...(liveData.installation || {}) },
          footer: { ...DEFAULT_MASTER_DATA.footer, ...(liveData.footer || {}) }
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch {}
        notifyListeners(merged);
      }
    }, (err) => {
      console.warn('Firestore onSnapshot error on masterWebsiteData:', err);
    });
  } catch (e) {
    console.warn('Could not attach Firestore onSnapshot for masterWebsiteData:', e);
  }
}

/**
 * Load master website & CMS data from persistent storage
 */
export function getMasterWebsiteData(): MasterWebsiteData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_MASTER_DATA,
        ...parsed,
        homepage: { ...DEFAULT_MASTER_DATA.homepage, ...(parsed.homepage || {}) },
        about: { ...DEFAULT_MASTER_DATA.about, ...(parsed.about || {}) },
        installation: { ...DEFAULT_MASTER_DATA.installation, ...(parsed.installation || {}) },
        footer: { ...DEFAULT_MASTER_DATA.footer, ...(parsed.footer || {}) },
        activeLogoUrl: parsed.activeLogoUrl || DEFAULT_MASTER_DATA.activeLogoUrl,
        activeFaviconUrl: parsed.activeFaviconUrl || DEFAULT_MASTER_DATA.activeFaviconUrl,
        mediaItems: parsed.mediaItems && parsed.mediaItems.length > 0 ? parsed.mediaItems : DEFAULT_MASTER_DATA.mediaItems,
        pdfGuides: parsed.pdfGuides && parsed.pdfGuides.length > 0 ? parsed.pdfGuides : DEFAULT_MASTER_DATA.pdfGuides,
        videoTutorials: parsed.videoTutorials && parsed.videoTutorials.length > 0 ? parsed.videoTutorials : DEFAULT_MASTER_DATA.videoTutorials,
        adminUsers: parsed.adminUsers && parsed.adminUsers.length > 0 ? parsed.adminUsers : DEFAULT_MASTER_DATA.adminUsers,
        auditLogs: parsed.auditLogs && parsed.auditLogs.length > 0 ? parsed.auditLogs : DEFAULT_MASTER_DATA.auditLogs
      };
    }
  } catch (err) {
    console.warn('Could not read saved master website data, using defaults:', err);
  }
  return DEFAULT_MASTER_DATA;
}

/**
 * Save master website & CMS data to persistent storage and notify listeners
 */
export async function saveMasterWebsiteData(data: MasterWebsiteData): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
  notifyListeners(data);

  try {
    const docRef = doc(db, 'companySettings', 'masterWebsiteData');
    await setDoc(docRef, data, { merge: true });
  } catch (err) {
    console.warn('Error saving masterWebsiteData to Firestore:', err);
  }
}

/**
 * Append-only audit logger
 */
export async function logAuditEvent(
  user: string,
  role: string,
  action: string,
  module: AuditActivityLog['module'],
  target: string,
  details: string,
  status: 'Success' | 'Failed' | 'Warning' = 'Success'
): Promise<void> {
  const current = getMasterWebsiteData();
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const newLog: AuditActivityLog = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    timestamp: dateStr,
    user,
    role,
    action,
    module,
    target,
    details,
    ipAddress: '192.168.1.104 (Authorized Session)',
    status
  };

  const updated: MasterWebsiteData = {
    ...current,
    auditLogs: [newLog, ...current.auditLogs]
  };

  await saveMasterWebsiteData(updated);
}
