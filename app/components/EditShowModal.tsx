'use client';

import { useEffect, useState } from 'react';

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
import type { Show } from '@/types/show';

interface EditShowModalProps {
  open: boolean;
  show: Show | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditShowModal({
  open,
  show,
  onClose,
  onSuccess,
}: EditShowModalProps) {
  const [date, setDate] = useState('');
  const [artists, setArtists] = useState(['']);
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Populate form when show changes
  useEffect(() => {
    if (show) {
      setDate(show.date);
      setArtists(show.artists.length > 0 ? show.artists : ['']);
      setVenue(show.venue || '');
      setCity(show.city || '');
      setState(show.state || '');
      setCountry(show.country || '');
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
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="font-mono border-black"
              />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="font-mono border-black"
              />
            </div>

            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="font-mono border-black"
              />
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="font-mono border-black"
              />
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
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
