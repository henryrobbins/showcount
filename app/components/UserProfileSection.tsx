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
}

export default function UserProfileSection({
  profile,
  userEmail,
  isOwnProfile,
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

      {(localProfile ||
        (isOwnProfile && !localProfile)) && (
        <div className="mb-8">
          {isOwnProfile && (
            <div className="flex justify-end mb-4">
              <Button
                onClick={handleEditClick}
                variant="outline"
                className="border-black font-mono"
              >
                Edit Profile
              </Button>
            </div>
          )}
          <ProfileDisplay profile={localProfile} userEmail={userEmail} />
        </div>
      )}

      <EditProfileModal
        open={showEditModal}
        profile={localProfile}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleProfileUpdate}
      />
    </>
  );
}
