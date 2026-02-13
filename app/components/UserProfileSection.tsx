'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import EditProfileModal from '@/components/EditProfileModal';
import NewUserBanner from '@/components/NewUserBanner';
import ProfileDisplay from '@/components/ProfileDisplay';
import type { UserProfile } from '@/types/profile';

interface UserProfileSectionProps {
  profile: UserProfile | null;
  userEmail: string | null;
  isOwnProfile: boolean;
  displayName: string;
  showCount: number;
}

export default function UserProfileSection({
  profile,
  userEmail,
  isOwnProfile,
  displayName,
  showCount,
}: UserProfileSectionProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(profile);

  const handleProfileUpdate = async () => {
    // Refetch profile data after update
    window.location.reload();
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  return (
    <>
      {isOwnProfile && (
        <NewUserBanner profile={localProfile} onEditClick={handleEditClick} />
      )}

      <ProfileDisplay 
        profile={localProfile} 
        userEmail={userEmail}
        displayName={displayName}
        showCount={showCount}
        isOwnProfile={isOwnProfile}
        onEditClick={handleEditClick}
      />

      <EditProfileModal
        open={showEditModal}
        profile={localProfile}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleProfileUpdate}
      />
    </>
  );
}
