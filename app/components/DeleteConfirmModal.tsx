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
import type { UserShowWithDetails } from '@/types/show';

interface DeleteConfirmModalProps {
  open: boolean;
  shows: UserShowWithDetails[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteConfirmModal({
  open,
  shows,
  onClose,
  onSuccess,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
    });
  };

  const handleDelete = async () => {
    setError('');
    setIsDeleting(true);

    try {
      const showIds = shows.map((show) => show.id);
      const response = await fetch('/api/shows/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ showIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete shows');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete shows');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="font-mono border-2 border-black max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Delete Shows</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="border border-black bg-red-50 p-3 text-sm">
              {error}
            </div>
          )}

          <div className="border border-black bg-yellow-50 p-4">
            <p className="font-bold mb-2">
              Are you sure you want to delete {shows.length}{' '}
              {shows.length === 1 ? 'show' : 'shows'}?
            </p>
            <p className="text-sm">This action cannot be undone.</p>
          </div>

          <div className="max-h-60 overflow-y-auto border border-black p-3">
            <div className="space-y-2">
              {shows.map((show) => {
                const firstShow = show.shows[0];
                const artists = show.shows.map(s => s.artist).join(' + ');
                
                return (
                  <div key={show.id} className="text-sm border-b border-gray-300 pb-2 last:border-b-0">
                    <div className="font-bold">{firstShow ? formatDate(firstShow.date) : '-'}</div>
                    <div>{artists}</div>
                    {firstShow?.venue && <div className="text-gray-600">{firstShow.venue.name}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="border-black"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            className="bg-black text-white hover:bg-gray-800 border-black"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Shows'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
