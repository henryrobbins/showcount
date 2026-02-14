'use client';

import { useEffect, useState } from 'react';

import RatingSystemConfig from '@/components/RatingSystemConfig';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { UserProfile } from '@/types/profile';
import type { RatingSystemConfig as RatingSystemConfigType, RatingSystemType } from '@/types/rating';

interface EditProfileModalProps {
  open: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditProfileModal({
  open,
  profile,
  onClose,
  onSuccess,
}: EditProfileModalProps) {
  const [caption, setCaption] = useState('');
  const [city, setCity] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [songChasing, setSongChasing] = useState('');
  const [bandChasing, setBandChasing] = useState('');
  const [favoriteShow, setFavoriteShow] = useState('');
  const [favoriteVenue, setFavoriteVenue] = useState('');
  const [cashortradeUsername, setCashortradeUsername] = useState('');
  const [instagramUsername, setInstagramUsername] = useState('');
  const [xUsername, setXUsername] = useState('');
  const [facebookUsername, setFacebookUsername] = useState('');
  const [ratingsEnabled, setRatingsEnabled] = useState(false);
  const [ratingSystemType, setRatingSystemType] = useState<RatingSystemType | null>(null);
  const [ratingSystemConfig, setRatingSystemConfig] = useState<RatingSystemConfigType | null>(null);
  const [originalRatingSystemType, setOriginalRatingSystemType] = useState<RatingSystemType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Populate form when profile changes
  useEffect(() => {
    if (profile) {
      setCaption(profile.caption || '');
      setCity(profile.city || '');
      setShowEmail(profile.show_email);
      setSongChasing(profile.song_chasing || '');
      setBandChasing(profile.band_chasing || '');
      setFavoriteShow(profile.favorite_show || '');
      setFavoriteVenue(profile.favorite_venue || '');
      setCashortradeUsername(profile.cashortrade_username || '');
      setInstagramUsername(profile.instagram_username || '');
      setXUsername(profile.x_username || '');
      setFacebookUsername(profile.facebook_username || '');
      setRatingsEnabled(profile.ratings_enabled || false);
      setRatingSystemType(profile.rating_system_type || null);
      setRatingSystemConfig(profile.rating_system_config || null);
      setOriginalRatingSystemType(profile.rating_system_type || null);
      setError('');
    } else {
      // Reset for new profile
      setCaption('');
      setCity('');
      setShowEmail(false);
      setSongChasing('');
      setBandChasing('');
      setFavoriteShow('');
      setFavoriteVenue('');
      setCashortradeUsername('');
      setInstagramUsername('');
      setXUsername('');
      setFacebookUsername('');
      setRatingsEnabled(false);
      setRatingSystemType(null);
      setRatingSystemConfig(null);
      setOriginalRatingSystemType(null);
      setError('');
    }
  }, [profile]);

  const handleRatingConfigChange = (type: RatingSystemType, config: RatingSystemConfigType) => {
    setRatingSystemType(type);
    setRatingSystemConfig(config);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate rating system if enabled
    if (ratingsEnabled && (!ratingSystemType || !ratingSystemConfig)) {
      setError('Please configure your rating system before enabling ratings');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user is switching rating systems
      const isSwitchingSystem = originalRatingSystemType !== null && 
                                ratingSystemType !== null && 
                                originalRatingSystemType !== ratingSystemType;

      // If switching systems, clear all ratings first
      if (isSwitchingSystem) {
        const clearResponse = await fetch('/api/shows/clear-ratings', {
          method: 'POST',
        });

        if (!clearResponse.ok) {
          throw new Error('Failed to clear existing ratings');
        }
      }

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caption: caption.trim() || null,
          city: city.trim() || null,
          show_email: showEmail,
          song_chasing: songChasing.trim() || null,
          band_chasing: bandChasing.trim() || null,
          favorite_show: favoriteShow.trim() || null,
          favorite_venue: favoriteVenue.trim() || null,
          cashortrade_username: cashortradeUsername.trim() || null,
          instagram_username: instagramUsername.trim() || null,
          x_username: xUsername.trim() || null,
          facebook_username: facebookUsername.trim() || null,
          ratings_enabled: ratingsEnabled,
          rating_system_type: ratingsEnabled ? ratingSystemType : null,
          rating_system_config: ratingsEnabled ? ratingSystemConfig : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="font-mono border-2 border-black max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {error && (
              <div className="border border-black bg-red-50 p-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="caption">Caption</Label>
                <span className="text-xs text-gray-600 font-mono">
                  {caption.length}/280
                </span>
              </div>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 280) {
                    setCaption(value);
                  }
                }}
                placeholder="A short bio about yourself"
                className="font-mono border-black resize-none"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., San Francisco"
                className="font-mono border-black"
              />
            </div>

            <div className="flex items-center space-x-2 border-t border-black pt-4">
              <Checkbox
                id="show-email"
                checked={showEmail}
                onCheckedChange={(checked) => setShowEmail(checked as boolean)}
                className="border-black"
              />
              <Label
                htmlFor="show-email"
                className="text-sm font-normal cursor-pointer"
              >
                Show my email on my profile
              </Label>
            </div>

            <div className="border-t border-black pt-4 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wide">
                Favorites & Interests
              </h3>

              <div>
                <Label htmlFor="song-chasing">Song I'm Chasing</Label>
                <Input
                  id="song-chasing"
                  value={songChasing}
                  onChange={(e) => setSongChasing(e.target.value)}
                  placeholder="e.g., Terrapin Station"
                  className="font-mono border-black"
                />
              </div>

              <div>
                <Label htmlFor="band-chasing">Band I'm Chasing</Label>
                <Input
                  id="band-chasing"
                  value={bandChasing}
                  onChange={(e) => setBandChasing(e.target.value)}
                  placeholder="e.g., Phish"
                  className="font-mono border-black"
                />
              </div>

              <div>
                <Label htmlFor="favorite-show">Favorite Show</Label>
                <Input
                  id="favorite-show"
                  value={favoriteShow}
                  onChange={(e) => setFavoriteShow(e.target.value)}
                  placeholder="e.g., Dead & Company 7/4/2023"
                  className="font-mono border-black"
                />
              </div>

              <div>
                <Label htmlFor="favorite-venue">Favorite Venue</Label>
                <Input
                  id="favorite-venue"
                  value={favoriteVenue}
                  onChange={(e) => setFavoriteVenue(e.target.value)}
                  placeholder="e.g., Red Rocks Amphitheatre"
                  className="font-mono border-black"
                />
              </div>
            </div>

            <div className="border-t border-black pt-4 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wide">
                Social Links
              </h3>

              <div>
                <Label htmlFor="cashortrade">CashOrTrade Username</Label>
                <Input
                  id="cashortrade"
                  value={cashortradeUsername}
                  onChange={(e) => setCashortradeUsername(e.target.value)}
                  placeholder="username"
                  className="font-mono border-black"
                />
              </div>

              <div>
                <Label htmlFor="instagram">Instagram Username</Label>
                <Input
                  id="instagram"
                  value={instagramUsername}
                  onChange={(e) => setInstagramUsername(e.target.value)}
                  placeholder="username"
                  className="font-mono border-black"
                />
              </div>

              <div>
                <Label htmlFor="x">X Username</Label>
                <Input
                  id="x"
                  value={xUsername}
                  onChange={(e) => setXUsername(e.target.value)}
                  placeholder="username"
                  className="font-mono border-black"
                />
              </div>

              <div>
                <Label htmlFor="facebook">Facebook Username</Label>
                <Input
                  id="facebook"
                  value={facebookUsername}
                  onChange={(e) => setFacebookUsername(e.target.value)}
                  placeholder="username"
                  className="font-mono border-black"
                />
              </div>
            </div>

            <div className="border-t border-black pt-4 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wide">
                Rating System
              </h3>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ratings-enabled"
                  checked={ratingsEnabled}
                  onCheckedChange={(checked) => {
                    const isEnabled = checked === true;
                    setRatingsEnabled(isEnabled);
                    // Set default 5-star system if enabling for first time
                    if (isEnabled && !ratingSystemConfig) {
                      setRatingSystemType('ordered_list');
                      setRatingSystemConfig({
                        type: 'ordered_list',
                        config: { values: ['*****', '****', '***', '**', '*'] },
                      });
                    }
                  }}
                  className="border-black"
                />
                <Label
                  htmlFor="ratings-enabled"
                  className="text-sm font-normal cursor-pointer"
                >
                  Enable ratings for my shows
                </Label>
              </div>

              {ratingsEnabled && (
                <RatingSystemConfig
                  type={ratingSystemType}
                  config={ratingSystemConfig}
                  onChange={handleRatingConfigChange}
                  originalType={originalRatingSystemType}
                />
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-black"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-black text-white hover:bg-gray-800 border-black"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
