import React, { useState, useEffect } from 'react';
import { CENTRAL_ORIGINAL_LOGO } from '../constants/assets';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallAppButtonProps {
  variant?: 'header' | 'banner' | 'menu';
  className?: string;
  onInstalled?: () => void;
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({
  variant = 'header',
  className = '',
  onInstalled
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Detect if running inside installed standalone PWA
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isStandaloneNav = (window.navigator as any).standalone === true;
      const standalone = isStandaloneMedia || isStandaloneNav;
      setIsStandalone(standalone);
      if (standalone) {
        setIsInstalled(true);
      }
    };

    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    // 2. Detect iOS / Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // 3. Listen for Chromium/Edge/Android beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (onInstalled) onInstalled();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstalled]);

  const handleInstallClick = async () => {
    if (isStandalone || isInstalled) {
      return;
    }

    // iOS Safari Flow: Show instructions modal
    if (isIos && !deferredPrompt) {
      setShowIosModal(true);
      return;
    }

    // Android / Desktop Chrome / Edge Flow: Trigger native prompt
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.warn('[PWA] Error launching install prompt:', err);
      }
      return;
    }

    // Fallback: If browser supports PWA but event hasn't fired yet or desktop unsupported
    setShowIosModal(true);
  };

  // If already running in standalone mode, show clean installed state or hide
  if (isStandalone) {
    if (variant === 'banner') {
      return (
        <div className="pwa-installed-pill" title="Running in Standalone App Mode">
          <span className="pwa-dot-live" />
          <span>ALAM ENGAZ Hub Active</span>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      <button
        type="button"
        className={`btn-install-pwa ${variant === 'menu' ? 'btn-install-pwa-menu' : ''} ${className}`}
        onClick={handleInstallClick}
        title="Install ALAM ENGAZ Hub to your device"
        id="pwa-install-btn"
      >
        <svg
          className="pwa-install-icon"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span className="pwa-install-label">
          {isInstalled ? 'App Installed' : 'Install ALAM ENGAZ Hub'}
        </span>
      </button>

      {/* iPhone / iPad Safari Instruction Modal */}
      {showIosModal && (
        <div className="pwa-modal-backdrop" onClick={() => setShowIosModal(false)}>
          <div className="pwa-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pwa-modal-header">
              <div className="pwa-modal-brand">
                <img
                  src="/assets/icon-192.png"
                  alt="ALAM ENGAZ App Icon"
                  className="pwa-modal-icon"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = CENTRAL_ORIGINAL_LOGO;
                  }}
                />
                <div>
                  <h3 className="pwa-modal-title">Add ALAM ENGAZ Hub to your Home Screen</h3>
                  <span className="pwa-modal-subtitle">Official Progressive Web App</span>
                </div>
              </div>
              <button
                type="button"
                className="pwa-modal-close"
                onClick={() => setShowIosModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="pwa-modal-body">
              <p className="pwa-modal-desc">
                Install this app on your device for fast access, offline availability, and a full standalone experience without browser toolbars.
              </p>

              {isIos ? (
                <div className="pwa-steps-list">
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">1</span>
                    <div className="pwa-step-content">
                      <span>Tap the <strong>Share</strong> button</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#0284C7', verticalAlign: 'middle', marginLeft: '6px' }}>
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                        <polyline points="16 6 12 2 8 6"></polyline>
                        <line x1="12" y1="2" x2="12" y2="15"></line>
                      </svg>
                      <span className="pwa-step-sub"> in the bottom Safari toolbar.</span>
                    </div>
                  </div>

                  <div className="pwa-step-item">
                    <span className="pwa-step-num">2</span>
                    <div className="pwa-step-content">
                      <span>Scroll down and tap <strong>Add to Home Screen</strong></span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#16A34A', verticalAlign: 'middle', marginLeft: '6px' }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                    </div>
                  </div>

                  <div className="pwa-step-item">
                    <span className="pwa-step-num">3</span>
                    <div className="pwa-step-content">
                      <span>Tap <strong>Add</strong> in the top right corner.</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pwa-steps-list">
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">1</span>
                    <div className="pwa-step-content">
                      <span>In your browser menu, select <strong>Install ALAM ENGAZ Hub</strong> or <strong>Add to Desktop</strong>.</span>
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">2</span>
                    <div className="pwa-step-content">
                      <span>Confirm the installation to launch as a standalone application.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pwa-modal-footer">
              <button
                type="button"
                className="btn-pwa-modal-dismiss"
                onClick={() => setShowIosModal(false)}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
