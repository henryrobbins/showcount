'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import AddShowModal from '@/components/AddShowModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import EditShowModal from '@/components/EditShowModal';
import ShowsTable from '@/components/ShowsTable';
import { Button } from '@/components/ui/button';
import type { Show } from '@/types/show';

interface EditClientProps {
  initialShows: Show[];
}

export default function EditClient({ initialShows }: EditClientProps) {
  const router = useRouter();
  const [shows, setShows] = useState<Show[]>(initialShows);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [editingShow, setEditingShow] = useState<Show | null>(null);

  // Update shows when initialShows changes (after router.refresh())
  useEffect(() => {
    setShows(initialShows);
  }, [initialShows]);

  const handleSelectionChange = (id: string, selected: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (selected) {
      newSelectedIds.add(id);
    } else {
      newSelectedIds.delete(id);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleRowClick = (show: Show) => {
    setEditingShow(show);
    setModalState('edit');
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(shows.map((show) => show.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSuccess = () => {
    // Clear selection after delete
    if (modalState === 'delete') {
      setSelectedIds(new Set());
    }

    // Close modal
    setModalState(null);
    
    // Refresh the page to get updated data from the server
    router.refresh();
  };

  const selectedShows = shows.filter((show) => selectedIds.has(show.id));

  return (
    <main className="min-h-screen bg-white text-black py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="border-2 border-black p-8 mb-8">
          <h1 className="text-4xl font-bold font-mono tracking-wider">
            Edit Shows
          </h1>
          <p className="font-mono text-sm mt-2 text-gray-600">
            {shows.length} shows total
          </p>
        </div>

        <div className="mb-4 flex gap-4 items-center flex-wrap">
          <Button
            onClick={() => setModalState('add')}
            className="bg-black text-white hover:bg-gray-800 border-black font-mono"
          >
            Add Show
          </Button>

          <Button
            onClick={() => setModalState('delete')}
            disabled={selectedIds.size === 0}
            variant="outline"
            className="border-black font-mono"
          >
            Delete Selected ({selectedIds.size})
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={handleSelectAll}
              variant="outline"
              className="border-black font-mono text-sm"
            >
              Select All
            </Button>
            <Button
              onClick={handleDeselectAll}
              variant="outline"
              className="border-black font-mono text-sm"
              disabled={selectedIds.size === 0}
            >
              Deselect All
            </Button>
          </div>
        </div>

        <ShowsTable
          shows={shows}
          editable={true}
          selectedIds={selectedIds}
          onRowClick={handleRowClick}
          onSelectionChange={handleSelectionChange}
        />

        <AddShowModal
          open={modalState === 'add'}
          onClose={() => setModalState(null)}
          onSuccess={handleSuccess}
        />

        <EditShowModal
          open={modalState === 'edit'}
          show={editingShow}
          onClose={() => {
            setModalState(null);
            setEditingShow(null);
          }}
          onSuccess={handleSuccess}
        />

        <DeleteConfirmModal
          open={modalState === 'delete'}
          shows={selectedShows}
          onClose={() => setModalState(null)}
          onSuccess={handleSuccess}
        />
      </div>
    </main>
  );
}
