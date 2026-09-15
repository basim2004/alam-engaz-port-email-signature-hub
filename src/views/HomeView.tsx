import React from 'react';
import { PageRoute } from '../types';
import { HeroSection } from '../components/HeroSection';
import { LoginCtaSection } from '../components/LoginCtaSection';
import { SplitSection } from '../components/SplitSection';

interface HomeViewProps {
  onNavigate: (route: PageRoute) => void;
  onOpenLoginModal: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenLoginModal }) => {
  return (
    <div className="home-view-wrap">
      {/* 1. HERO SECTION - Exact Approved Reference Match */}
      <HeroSection onNavigate={onNavigate} />

      {/* 2. CORPORATE ACCESS SECTION - Single Clean LOGIN CTA (Requirement #1) */}
      <LoginCtaSection onOpenLogin={onOpenLoginModal} />

      {/* 3. PROFESSIONAL COMMUNICATION SPLIT SECTION - Slanted Visual Division Match */}
      <SplitSection />
    </div>
  );
};
