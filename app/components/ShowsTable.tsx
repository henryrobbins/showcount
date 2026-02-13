'use client';

import { useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Show } from '@/types/show';

interface ShowsTableProps {
  shows: Show[];
  editable?: boolean;
  selectedIds?: Set<string>;
  onRowClick?: (show: Show) => void;
  onSelectionChange?: (id: string, selected: boolean) => void;
}

export default function ShowsTable({
  shows,
  editable = false,
  selectedIds = new Set(),
  onRowClick,
  onSelectionChange,
}: ShowsTableProps) {
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
    });
  };

  const toggleNotes = (showId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(showId)) {
        newSet.delete(showId);
      } else {
        newSet.add(showId);
      }
      return newSet;
    });
  };

  const renderNotes = (show: Show) => {
    if (!show.notes) {
      return '-';
    }

    const isExpanded = expandedNotes.has(show.id);
    const needsTruncation = show.notes.length > 100;
    const displayNotes = isExpanded || !needsTruncation 
      ? show.notes 
      : show.notes.slice(0, 100) + '...';

    if (!needsTruncation) {
      return <span>{show.notes}</span>;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              onClick={(e) => toggleNotes(show.id, e)}
              className="cursor-pointer hover:bg-gray-100"
            >
              {displayNotes}
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-md font-mono text-xs">
            <p className="whitespace-pre-wrap">{show.notes}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const sortedShows = [...shows].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="w-full border border-black">
      <table className="w-full font-mono text-sm">
        <thead>
          <tr className="border-b-2 border-black">
            {editable && (
              <th className="w-12 p-3 border-r border-black" />
            )}
            <th className="text-left p-3 border-r border-black">Date</th>
            <th className="text-left p-3 border-r border-black">Artists</th>
            <th className="text-left p-3 border-r border-black">Venue</th>
            <th className="text-left p-3 border-r border-black">City</th>
            <th className="text-left p-3 border-r border-black">State</th>
            <th className="text-left p-3 border-r border-black">Country</th>
            <th className="text-left p-3">Notes</th>
          </tr>
        </thead>
        <tbody>
          {sortedShows.map((show) => {
            const isSelected = selectedIds.has(show.id);
            return (
              <tr
                key={show.id}
                className={`border-b border-black last:border-b-0 ${
                  editable
                    ? 'cursor-pointer hover:bg-gray-50'
                    : ''
                } ${isSelected ? 'bg-gray-100' : ''}`}
                onClick={
                  editable && onRowClick ? () => onRowClick(show) : undefined
                }
              >
                {editable && (
                  <td
                    className="p-3 border-r border-black"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (onSelectionChange) {
                          onSelectionChange(show.id, checked === true);
                        }
                      }}
                    />
                  </td>
                )}
                <td className="p-3 border-r border-black whitespace-nowrap">
                  {formatDate(show.date)}
                </td>
                <td className="p-3 border-r border-black">
                  {show.artists.map((artist) => (
                    <div key={artist}>{artist}</div>
                  ))}
                </td>
                <td className="p-3 border-r border-black">{show.venue || '-'}</td>
                <td className="p-3 border-r border-black">{show.city || '-'}</td>
                <td className="p-3 border-r border-black">{show.state || '-'}</td>
                <td className="p-3 border-r border-black">{show.country || '-'}</td>
                <td className="p-3">{renderNotes(show)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
