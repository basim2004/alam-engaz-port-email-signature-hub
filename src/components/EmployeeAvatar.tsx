import React, { useState } from 'react';

interface EmployeeAvatarProps {
  name: string;
  photoUrl?: string;
  avatarUrl?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const EmployeeAvatar: React.FC<EmployeeAvatarProps> = ({
  name,
  photoUrl,
  avatarUrl,
  size = 40,
  className = '',
  style = {}
}) => {
  const [imageError, setImageError] = useState(false);
  const effectivePhoto = photoUrl || avatarUrl;

  const getInitials = (fullName: string): string => {
    if (!fullName) return 'AE';
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'AE';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (effectivePhoto && !imageError && !effectivePhoto.includes('logo.png')) {
    return (
      <div 
        className={`employee-avatar-wrap ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          border: '1.5px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style
        }}
      >
        <img 
          src={effectivePhoto} 
          alt={name} 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Clean initials fallback (clean initials avatar, no generic/fake faces)
  const initials = getInitials(name);
  return (
    <div 
      className={`employee-avatar-initials ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: '#0B2A55',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: `${Math.round(size * 0.38)}px`,
        letterSpacing: '0.05em',
        flexShrink: 0,
        border: '1.5px solid #E2E8F0',
        ...style
      }}
      title={name}
    >
      {initials}
    </div>
  );
};
