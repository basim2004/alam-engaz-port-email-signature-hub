export interface GuideItem {
  id: string;
  title: string;
  description: string;
  pages: number;
  iconType: 'studio' | 'install' | 'gmail' | 'outlook' | 'mobile' | 'troubleshoot' | 'brand';
  fileSize?: string;
  version?: string;
  isPublished: boolean;
  pdfUrl?: string | null;
}

export interface VideoItem {
  id: string;
  title: string;
  duration: string;
  isFeatured?: boolean;
  thumbnailUrl?: string;
  isPublished: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  isPublished: boolean;
}

export interface SupportContactInfo {
  email: string;
  hoursDays: string;
  hoursTime: string;
  liveChatAvailable: boolean;
}

export const DEFAULT_FEATURED_GUIDE = {
  title: 'COMPLETE WEBSITE GUIDE',
  badge: 'RECOMMENDED',
  description: 'Complete user guide for the ALAM ENGAZ Email Signature Hub, covering employees, signature creation, Signature Studio, logo and Best Regards settings, Gmail/Outlook installation, support features and troubleshooting.',
  sectionsCount: '26 Sections',
  pagesCount: '120+ Pages',
  format: 'Step-by-Step',
  updatedStatus: 'Always Updated',
  checklist: [
    'Complete Website Overview',
    'Feature-wise Instructions',
    'Screenshots & Examples',
    'Installation for All Platforms',
    'Troubleshooting & FAQ',
    'Best Practices',
    'Support Information'
  ],
  version: '1.0',
  pdfUrl: null as string | null
};

export const DEFAULT_GUIDES: GuideItem[] = [
  {
    id: 'guide-1',
    title: 'Signature Studio Guide',
    description: 'Learn how to create, customize and download your email signature.',
    pages: 12,
    iconType: 'studio',
    fileSize: '2.4 MB',
    version: '1.0',
    isPublished: true,
    pdfUrl: null
  },
  {
    id: 'guide-2',
    title: 'Installation Guide',
    description: 'Step-by-step instructions for Gmail, Outlook and mobile devices.',
    pages: 18,
    iconType: 'install',
    fileSize: '3.1 MB',
    version: '1.0',
    isPublished: true,
    pdfUrl: null
  },
  {
    id: 'guide-3',
    title: 'Gmail Guide',
    description: 'Set up your signature in Gmail Web and Gmail Mobile.',
    pages: 14,
    iconType: 'gmail',
    fileSize: '2.8 MB',
    version: '1.0',
    isPublished: true,
    pdfUrl: null
  },
  {
    id: 'guide-4',
    title: 'Outlook Guide',
    description: 'Install your signature in Outlook Web and Desktop.',
    pages: 14,
    iconType: 'outlook',
    fileSize: '2.9 MB',
    version: '1.0',
    isPublished: true,
    pdfUrl: null
  },
  {
    id: 'guide-5',
    title: 'Mobile Guide',
    description: 'Use your signature on iPhone and Android devices.',
    pages: 10,
    iconType: 'mobile',
    fileSize: '1.9 MB',
    version: '1.0',
    isPublished: true,
    pdfUrl: null
  },
  {
    id: 'guide-6',
    title: 'Troubleshooting Guide',
    description: 'Common issues and easy solutions.',
    pages: 8,
    iconType: 'troubleshoot',
    fileSize: '1.5 MB',
    version: '1.0',
    isPublished: true,
    pdfUrl: null
  },
  {
    id: 'guide-7',
    title: 'Brand & Usage Guidelines',
    description: 'Logo usage, brand identity and design standards.',
    pages: 14,
    iconType: 'brand',
    fileSize: '3.5 MB',
    version: '1.0',
    isPublished: true,
    pdfUrl: null
  }
];

export const DEFAULT_VIDEOS: VideoItem[] = [
  {
    id: 'vid-featured',
    title: 'How to Create Your Email Signature',
    duration: '02:45',
    isFeatured: true,
    isPublished: true
  },
  {
    id: 'vid-1',
    title: 'Getting Started with Signature Studio',
    duration: '02:45',
    isPublished: true
  },
  {
    id: 'vid-2',
    title: 'Install in Gmail (Web)',
    duration: '03:12',
    isPublished: true
  },
  {
    id: 'vid-3',
    title: 'Install in Outlook (Desktop)',
    duration: '04:08',
    isPublished: true
  },
  {
    id: 'vid-4',
    title: 'Use on Mobile Devices',
    duration: '03:20',
    isPublished: true
  },
  {
    id: 'vid-5',
    title: 'Troubleshooting Tips',
    duration: '02:18',
    isPublished: true
  }
];

export const DEFAULT_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'How do I create my email signature?',
    answer: 'Navigate to Signature Studio from the main navigation. Your employee details (Full Name, Job Title, Phone, Email, and Website) are automatically synchronized. You can adjust Best Regards text, size, color, or logo placement using the independent positioning controls, then click "Copy HTML (For Email)" to copy your signature.',
    isPublished: true
  },
  {
    id: 'faq-2',
    question: 'How do I install it in Gmail?',
    answer: 'In Gmail, click the Settings Gear icon → "See all settings" → scroll down to the "Signature" section. Click "+ Create new", give it a name (e.g., "ALAM ENGAZ Official"), click inside the text editor box and press Ctrl+V (or Cmd+V) to paste the copied rich-text HTML signature. Save changes at the bottom.',
    isPublished: true
  },
  {
    id: 'faq-3',
    question: 'How do I install it in Outlook?',
    answer: 'In Outlook desktop, go to File → Options → Mail → Signatures. Click "New", enter a name, and press Ctrl+V directly into the Edit signature area. Ensure default signatures are set to your newly created ALAM ENGAZ template for both New messages and Replies/forwards.',
    isPublished: true
  },
  {
    id: 'faq-4',
    question: 'Can I use the signature on my mobile phone?',
    answer: 'Yes. In the Signature Studio, click "Copy HTML (For Email)" and send an email to yourself on your mobile device. Open that email on your phone, copy the formatted signature block, and paste it into iOS Mail (Settings → Mail → Signature) or Outlook Mobile app settings.',
    isPublished: true
  },
  {
    id: 'faq-5',
    question: 'How do I change my details later?',
    answer: 'To ensure corporate brand integrity, official employee details are managed through the central company directory. You can request profile updates via the Employee Portal or contact the IT Systems Administrator.',
    isPublished: true
  },
  {
    id: 'faq-6',
    question: 'What should I do if the signature is not showing?',
    answer: 'Ensure your email format is set to "HTML" rather than "Plain Text". In Outlook, go to File → Options → Mail → Compose messages in HTML format. In Gmail, ensure "Plain text mode" is unchecked in the composer bottom-right menu.',
    isPublished: true
  },
  {
    id: 'faq-7',
    question: 'Can I add social media icons?',
    answer: 'Yes! In Signature Studio Card 4 (Display Options), toggle "Show Social Media Icons" to ON. This will automatically include verified company LinkedIn, YouTube, and Instagram links within the signature table.',
    isPublished: true
  },
  {
    id: 'faq-8',
    question: 'Who can I contact for further support?',
    answer: 'You can contact the ALAM ENGAZ IT Support team directly by sending an email to it@alamengaz.com. Support hours are Sunday through Thursday, from 9:00 AM to 6:00 PM (KSA Time).',
    isPublished: true
  }
];

export const DEFAULT_SUPPORT_CONTACT: SupportContactInfo = {
  email: 'it@alamengaz.com',
  hoursDays: 'Sunday - Thursday',
  hoursTime: '9:00 AM - 6:00 PM (KSA Time)',
  liveChatAvailable: false
};
