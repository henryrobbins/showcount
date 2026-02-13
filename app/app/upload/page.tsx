"use client";

import { useState } from "react";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { parseAndValidateCSV } from "@/lib/csv-parser";
import type { ShowInsert } from "@/types/show";

interface ProgressItem {
  showNumber: number;
  date: string;
  artists: string[];
  venue?: string;
  venueStatus:
    | "existing"
    | "created_with_osm"
    | "created_without_osm"
    | "failed"
    | "none";
}

export default function UploadPage() {
  const router = useRouter();
  const { user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState<ShowInsert[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<ProgressItem[]>([]);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError("");
    setPreviews([]);
    setLoading(true);

    if (!user?.id) {
      setError("You must be signed in to upload shows");
      setLoading(false);
      return;
    }

    try {
      const result = await parseAndValidateCSV(selectedFile, user.id);

      if (!result.success) {
        setError(result.error || "Failed to parse CSV");
        setLoading(false);
        return;
      }

      if (result.data) {
        setPreviews(result.data.shows);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (previews.length === 0) return;

    setUploading(true);
    setError("");
    setUploadProgress([]);
    setUploadComplete(false);

    try {
      const response = await fetch("/api/shows/upload-with-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shows: previews }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload shows");
      }

      // Read the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response stream");
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            if (data.type === "progress" && data.showInfo) {
              setUploadProgress((prev) => [
                ...prev,
                {
                  showNumber: data.currentShow,
                  date: data.showInfo.date,
                  artists: data.showInfo.artists,
                  venue: data.showInfo.venue,
                  venueStatus: data.venueStatus,
                },
              ]);
            } else if (data.type === "complete") {
              setUploadComplete(true);
              setTimeout(() => {
                router.push(`/user/${user?.username || user?.id}`);
              }, 2000);
            } else if (data.type === "error") {
              throw new Error(data.error || "Upload failed");
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload shows");
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 font-mono">Import Show Data</h1>

      <div className="mb-8 border border-black p-8">
        <div className="mb-4">
          <label
            htmlFor="csv-upload"
            className="block text-sm font-mono font-medium mb-2"
          >
            Select CSV File
          </label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={loading || uploading}
            className="block w-full text-sm font-mono
                     file:mr-4 file:py-2 file:px-4
                     file:border file:border-black
                     file:text-sm file:font-mono
                     file:bg-white file:text-black
                     hover:file:bg-gray-100
                     cursor-pointer"
          />
        </div>

        <div className="text-xs font-mono text-gray-600 space-y-1">
          <p>Required CSV format:</p>
          <p className="ml-4">
            • Headers: date, artist, venue, city, state, country
          </p>
          <p className="ml-4">• Optional header: notes (max 4096 characters)</p>
          <p className="ml-4">• Date format: MM-DD-YY or MM/DD/YY</p>
          <p className="ml-4">• Multiple artists: separated by '+'</p>
          <p className="ml-4">• Required fields: date and artist</p>
        </div>
      </div>

      {error && (
        <div className="mb-8 border-2 border-black p-4 bg-red-50">
          <h3 className="font-mono font-bold mb-2">Error:</h3>
          <pre className="font-mono text-sm whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {loading && (
        <div className="mb-8 border border-black p-4">
          <p className="font-mono">Parsing CSV file...</p>
        </div>
      )}

      {uploading && (
        <div className="mb-8 border-2 border-black p-6">
          <h2 className="text-xl font-mono font-bold mb-4">Upload Progress</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {uploadProgress.map((item, index) => {
              let statusText = "";
              let statusColor = "";

              switch (item.venueStatus) {
                case "existing":
                  statusText = "✓ Venue found in database";
                  statusColor = "text-green-700";
                  break;
                case "created_with_osm":
                  statusText = "✓ Venue geocoded with OpenStreetMap";
                  statusColor = "text-blue-700";
                  break;
                case "created_without_osm":
                  statusText = "⚠ Location data not found";
                  statusColor = "text-yellow-700";
                  break;
                case "failed":
                  statusText = "✗ Failed to create venue";
                  statusColor = "text-red-700";
                  break;
                case "none":
                  statusText = "- No venue specified";
                  statusColor = "text-gray-600";
                  break;
              }

              return (
                <div
                  key={index}
                  className="border-b border-gray-300 pb-2 font-mono text-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-bold">
                        Show {item.showNumber}: {formatDate(item.date)}
                      </div>
                      <div className="text-gray-700">
                        {item.artists.join(", ")}
                      </div>
                      {item.venue && (
                        <div className="text-gray-600">Venue: {item.venue}</div>
                      )}
                    </div>
                    <div className={`text-right ${statusColor}`}>
                      {statusText}
                    </div>
                  </div>
                </div>
              );
            })}
            {uploadComplete && (
              <div className="mt-4 p-4 border border-green-700 bg-green-50">
                <p className="font-mono font-bold text-green-700">
                  ✓ Upload complete! Redirecting...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {previews.length > 0 && !uploading && (
        <>
          <div className="mb-4">
            <h2 className="text-xl font-mono font-bold">
              Preview ({previews.length} shows)
            </h2>
          </div>

          <div className="border border-black mb-8 overflow-x-auto">
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left p-2 border-r border-black">Date</th>
                  <th className="text-left p-2 border-r border-black">
                    Artists
                  </th>
                  <th className="text-left p-2 border-r border-black">Venue</th>
                  <th className="text-left p-2 border-r border-black">City</th>
                  <th className="text-left p-2 border-r border-black">State</th>
                  <th className="text-left p-2 border-r border-black">
                    Country
                  </th>
                  <th className="text-left p-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {previews.slice(0, 10).map((show) => {
                  const key = `${show.date}-${show.artists.join("-")}-${
                    show.venue || ""
                  }`;
                  const truncatedNotes =
                    show.notes && show.notes.length > 100
                      ? show.notes.slice(0, 100) + "..."
                      : show.notes;
                  return (
                    <tr key={key} className="border-b border-black">
                      <td className="p-2 border-r border-black">
                        {formatDate(show.date)}
                      </td>
                      <td className="p-2 border-r border-black">
                        {show.artists.join(", ")}
                      </td>
                      <td className="p-2 border-r border-black">
                        {show.venue || "-"}
                      </td>
                      <td className="p-2 border-r border-black">
                        {show.city || "-"}
                      </td>
                      <td className="p-2 border-r border-black">
                        {show.state || "-"}
                      </td>
                      <td className="p-2 border-r border-black">
                        {show.country || "-"}
                      </td>
                      <td className="p-2">{truncatedNotes || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {previews.length > 10 && (
            <p className="font-mono text-sm mb-4 text-gray-600">
              Showing first 10 of {previews.length} shows
            </p>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="px-6 py-3 border-2 border-black bg-black text-white
                       font-mono hover:bg-gray-800 disabled:opacity-50
                       disabled:cursor-not-allowed"
            >
              {uploading
                ? "Uploading..."
                : `Confirm Upload (${previews.length} shows)`}
            </button>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreviews([]);
                setError("");
              }}
              disabled={uploading}
              className="px-6 py-3 border-2 border-black bg-white text-black
                       font-mono hover:bg-gray-100 disabled:opacity-50
                       disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
