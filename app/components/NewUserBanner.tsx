'use client';

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import type { UserProfile } from '@/types/profile';

interface NewUserBannerProps {
  profile: UserProfile | null;
  onEditClick: () => void;
}

export default function NewUserBanner({
  profile,
  onEditClick,
}: NewUserBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner
    const dismissed = localStorage.getItem('profile-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('profile-banner-dismissed', 'true');
    setIsDismissed(true);
  };

  // Check if profile is mostly empty
  const isProfileEmpty =
    !profile ||
    (!profile.caption &&
      !profile.city &&
      !profile.song_chasing &&
      !profile.band_chasing &&
      !profile.favorite_show &&
      !profile.favorite_venue &&
      !profile.cashortrade_username &&
      !profile.instagram_username &&
      !profile.x_username &&
      !profile.facebook_username);

  // Don't show banner if dismissed or profile is complete
  if (isDismissed || !isProfileEmpty) {
    return null;
  }

  return (
    <div className="border-2 border-black bg-gray-50 p-6 mb-8 font-mono">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-2">Complete Your Profile</h3>
          <p className="text-sm mb-4">
            Complete your profile to help others learn more about you
          </p>
          <Button
            onClick={onEditClick}
            className="bg-black text-white hover:bg-gray-800 border-black"
          >
            Edit Profile
          </Button>
        </div>
        <button
          onClick={handleDismiss}
          className="text-black hover:text-gray-600 text-xl font-bold ml-4"
          aria-label="Dismiss banner"
        >
          ×
        </button>
      </div>
    </div>
  );
}
