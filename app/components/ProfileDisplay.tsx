'use client';

import type { UserProfile } from '@/types/profile';

interface ProfileDisplayProps {
  profile: UserProfile | null;
  userEmail?: string | null;
  displayName: string;
  showCount: number;
  isOwnProfile: boolean;
  onEditClick: () => void;
}

export default function ProfileDisplay({
  profile,
  userEmail,
  displayName,
  showCount,
  isOwnProfile,
  onEditClick,
}: ProfileDisplayProps) {
  const hasAnyContent =
    profile?.caption ||
    profile?.city ||
    (profile?.show_email && userEmail) ||
    profile?.song_chasing ||
    profile?.band_chasing ||
    profile?.favorite_show ||
    profile?.favorite_venue ||
    profile?.cashortrade_username ||
    profile?.instagram_username ||
    profile?.x_username ||
    profile?.facebook_username;

  return (
    <div className="border-2 border-black p-6 font-mono mb-8">
      {/* Username and show count header */}
      <div className={hasAnyContent ? 'mb-4 pb-4 border-b border-black' : ''}>
        <h1 className="text-lg font-bold tracking-wider mb-1">
          @{displayName}
        </h1>
        <p className="text-sm text-gray-600">
          {showCount} shows attended
        </p>
      </div>

      {/* Profile information */}
      {hasAnyContent && (
        <>
          {profile?.caption && (
            <div className="mb-4 pb-4 border-b border-black">
              <p className="text-sm whitespace-pre-wrap">{profile.caption}</p>
            </div>
          )}

          <div className="space-y-3 text-sm">
            {profile?.city && (
              <div className="flex">
                <span className="font-bold w-32 flex-shrink-0">Location:</span>
                <span>{profile.city}</span>
              </div>
            )}

            {profile?.show_email && userEmail && (
              <div className="flex">
                <span className="font-bold w-32 flex-shrink-0">Email:</span>
                <a
                  href={`mailto:${userEmail}`}
                  className="underline hover:no-underline"
                >
                  {userEmail}
                </a>
              </div>
            )}

            {(profile?.song_chasing ||
              profile?.band_chasing ||
              profile?.favorite_show ||
              profile?.favorite_venue) && (
              <div className="border-t border-black pt-3 mt-3">
                {profile?.song_chasing && (
                  <div className="flex mb-2">
                    <span className="font-bold w-32 flex-shrink-0">
                      Song Chasing:
                    </span>
                    <span>{profile.song_chasing}</span>
                  </div>
                )}

                {profile?.band_chasing && (
                  <div className="flex mb-2">
                    <span className="font-bold w-32 flex-shrink-0">
                      Band Chasing:
                    </span>
                    <span>{profile.band_chasing}</span>
                  </div>
                )}

                {profile?.favorite_show && (
                  <div className="flex mb-2">
                    <span className="font-bold w-32 flex-shrink-0">
                      Favorite Show:
                    </span>
                    <span>{profile.favorite_show}</span>
                  </div>
                )}

                {profile?.favorite_venue && (
                  <div className="flex mb-2">
                    <span className="font-bold w-32 flex-shrink-0">
                      Favorite Venue:
                    </span>
                    <span>{profile.favorite_venue}</span>
                  </div>
                )}
              </div>
            )}

            {(profile?.cashortrade_username ||
              profile?.instagram_username ||
              profile?.x_username ||
              profile?.facebook_username) && (
              <div className="border-t border-black pt-3 mt-3">
                <div className="font-bold mb-2">Find me on:</div>
                <div className="space-y-1 ml-4">
                  {profile?.cashortrade_username && (
                    <div>
                      <a
                        href={`https://cashortrade.org/profile/${profile.cashortrade_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        CashOrTrade: {profile.cashortrade_username}
                      </a>
                    </div>
                  )}

                  {profile?.instagram_username && (
                    <div>
                      <a
                        href={`https://instagram.com/${profile.instagram_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        Instagram: @{profile.instagram_username}
                      </a>
                    </div>
                  )}

                  {profile?.x_username && (
                    <div>
                      <a
                        href={`https://x.com/${profile.x_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        X: @{profile.x_username}
                      </a>
                    </div>
                  )}

                  {profile?.facebook_username && (
                    <div>
                      <a
                        href={`https://facebook.com/${profile.facebook_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        Facebook: {profile.facebook_username}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Action buttons */}
      <div className={`flex gap-3 ${hasAnyContent ? 'mt-4 pt-4 border-t border-black' : ''}`}>
        {isOwnProfile && (
          <button
            onClick={onEditClick}
            className="flex-1 px-4 py-2 border border-black bg-white text-black 
                     font-mono text-sm hover:bg-gray-100 transition-colors"
          >
            Edit Profile
          </button>
        )}
        <button
          onClick={() => {
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(() => {
              // Optional: Could add a toast notification here
              alert('Profile link copied to clipboard!');
            });
          }}
          className="flex-1 px-4 py-2 border border-black bg-white text-black 
                   font-mono text-sm hover:bg-gray-100 transition-colors"
        >
          Share Profile
        </button>
      </div>
    </div>
  );
}
