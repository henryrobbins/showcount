'use client';

import { useState } from 'react';

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

interface AddShowModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface DuplicateShow {
  artist: string;
  date: string;
  venue: {
    name: string;
    city: string | null;
    state: string | null;
    country: string;
  };
}

export default function AddShowModal({
  open,
  onClose,
  onSuccess,
}: AddShowModalProps) {
  const [date, setDate] = useState('');
  const [artists, setArtists] = useState(['']);
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [duplicateShow, setDuplicateShow] = useState<DuplicateShow | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent, allowDuplicate = false) => {
    e.preventDefault();
    setError('');

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
      const response = await fetch('/api/shows', {
        method: 'POST',
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
          allowDuplicate,
        }),
      });

      if (response.status === 409) {
        // Duplicate detected
        const errorData = await response.json();
        if (errorData.existingShow) {
          setDuplicateShow({
            artist: errorData.existingShow.artist,
            date: errorData.existingShow.date,
            venue: errorData.existingShow.venue,
          });
          setShowDuplicateDialog(true);
          setIsSubmitting(false);
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add show');
      }

      // Reset form
      setDate('');
      setArtists(['']);
      setVenue('');
      setCity('');
      setState('');
      setCountry('');
      setNotes('');
      setDuplicateShow(null);
      setShowDuplicateDialog(false);
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add show');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDuplicate = (e: React.FormEvent) => {
    setShowDuplicateDialog(false);
    handleSubmit(e, true);
  };

  const handleCancelDuplicate = () => {
    setShowDuplicateDialog(false);
    setDuplicateShow(null);
    setIsSubmitting(false);
  };

  return (
    <>
      <Dialog open={open && !showDuplicateDialog} onOpenChange={onClose}>
        <DialogContent className="font-mono border-2 border-black max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add Show</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => handleSubmit(e, false)}>
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
                {isSubmitting ? 'Adding...' : 'Add Show'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Duplicate Confirmation Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={handleCancelDuplicate}>
        <DialogContent className="font-mono border-2 border-black max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Duplicate Show Detected</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">
              A show with this artist, date, and venue already exists in your collection:
            </p>
            {duplicateShow && (
              <div className="border border-black p-4 bg-gray-50">
                <div className="space-y-1 text-sm">
                  <div><strong>Artist:</strong> {duplicateShow.artist}</div>
                  <div><strong>Date:</strong> {duplicateShow.date}</div>
                  <div><strong>Venue:</strong> {duplicateShow.venue.name}</div>
                  <div>
                    <strong>Location:</strong> {duplicateShow.venue.city && `${duplicateShow.venue.city}, `}
                    {duplicateShow.venue.state && `${duplicateShow.venue.state}, `}
                    {duplicateShow.venue.country}
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm">
              Was this a separate show at the same venue on the same day?
            </p>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              onClick={handleCancelDuplicate}
              variant="outline"
              className="border-black"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDuplicate}
              className="bg-black text-white hover:bg-gray-800 border-black"
            >
              Yes, Create Separate Show
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
