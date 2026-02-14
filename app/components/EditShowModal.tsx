'use client';

import { useEffect, useState } from 'react';

import RatingInput from '@/components/RatingInput';
import VenueAutocomplete from '@/components/VenueAutocomplete';
import { Button } from '@/components/ui/button';
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
import type { UserShowWithDetails } from '@/types/show';
import type { RatingSystemConfig } from '@/types/rating';

interface EditShowModalProps {
  open: boolean;
  show: UserShowWithDetails | null;
  onClose: () => void;
  onSuccess: () => void;
  ratingSystemConfig?: RatingSystemConfig | null;
}

export default function EditShowModal({
  open,
  show,
  onClose,
  onSuccess,
  ratingSystemConfig = null,
}: EditShowModalProps) {
  const [date, setDate] = useState('');
  const [artists, setArtists] = useState(['']);
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<{
    name: string;
    city: string | null;
    state: string | null;
    country: string;
    formattedAddress: string;
  } | null>(null);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleVenueSelect = (place: {
    name: string;
    city: string | null;
    state: string | null;
    country: string;
    placeId: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
  }) => {
    setSelectedVenue({
      name: place.name,
      city: place.city,
      state: place.state,
      country: place.country,
      formattedAddress: place.formattedAddress,
    });
    setVenue(place.name);
    setCity(place.city || '');
    setState(place.state || '');
    setCountry(place.country);
  };

  // Populate form when show changes
  useEffect(() => {
    if (show && show.shows.length > 0) {
      const firstShow = show.shows[0];
      setDate(firstShow.date);
      setArtists(show.shows.length > 0 ? show.shows.map(s => s.artist) : ['']);
      setVenue(firstShow.venue?.name || '');
      setCity(firstShow.venue?.city || '');
      setState(firstShow.venue?.state || '');
      setCountry(firstShow.venue?.country || '');
      
      // Set selected venue for display
      if (firstShow.venue) {
        setSelectedVenue({
          name: firstShow.venue.name,
          city: firstShow.venue.city,
          state: firstShow.venue.state,
          country: firstShow.venue.country,
          formattedAddress: [
            firstShow.venue.city,
            firstShow.venue.state,
            firstShow.venue.country
          ].filter(Boolean).join(', '),
        });
      } else {
        setSelectedVenue(null);
      }
      
      setNotes(show.notes || '');
      setRating(show.rating || null);
      setError('');
    }
  }, [show]);

  const handleAddArtist = () => {
    setArtists([...artists, '']);
  };

  const handleRemoveArtist = (index: number) => {
    if (artists.length > 1) {
      setArtists(artists.filter((_, i) => i !== index));
    }
  };

  const handleArtistChange = (index: number, value: string) => {
    const newArtists = [...artists];
    newArtists[index] = value;
    setArtists(newArtists);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!show) return;

    // Validate
    if (!date) {
      setError('Date is required');
      return;
    }

    const filteredArtists = artists.filter((a) => a.trim() !== '');
    if (filteredArtists.length === 0) {
      setError('At least one artist is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/shows/${show.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          artists: filteredArtists,
          venue: venue || null,
          city: city || null,
          state: state || null,
          country: country || null,
          notes: notes.trim() || null,
          rating: rating || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update show');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update show');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="font-mono border-2 border-black max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Show</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {error && (
              <div className="border border-black bg-red-50 p-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="font-mono border-black"
                required
              />
            </div>

            <div>
              <Label>Artists *</Label>
              <div className="space-y-2">
                {artists.map((artist, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={artist}
                      onChange={(e) => handleArtistChange(index, e.target.value)}
                      placeholder={`Artist ${index + 1}`}
                      className="font-mono border-black"
                    />
                    {artists.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => handleRemoveArtist(index)}
                        variant="outline"
                        className="border-black"
                      >
                        X
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={handleAddArtist}
                  variant="outline"
                  className="border-black w-full"
                >
                  + Add Artist
                </Button>
              </div>
            </div>

            <div>
              <Label>Venue</Label>
              <VenueAutocomplete
                onSelect={handleVenueSelect}
                initialValue={venue}
                className="font-mono border-black px-3 py-2 rounded-md w-full"
                placeholder="Search for a venue..."
              />
              {selectedVenue && (
                <div className="mt-2 text-sm border border-black p-2 bg-gray-50">
                  <div className="font-medium">{selectedVenue.name}</div>
                  <div className="text-gray-600">{selectedVenue.formattedAddress}</div>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="notes">Notes</Label>
                <span className="text-xs text-gray-600 font-mono">
                  {notes.length}/4096
                </span>
              </div>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 4096) {
                    setNotes(value);
                  }
                }}
                placeholder="Add notes about this show (optional)"
                className="font-mono border-black resize-none"
                rows={4}
              />
            </div>

            {ratingSystemConfig && (
              <RatingInput
                value={rating}
                config={ratingSystemConfig}
                onChange={setRating}
              />
            )}
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
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
