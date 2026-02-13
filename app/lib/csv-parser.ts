import Papa from 'papaparse';

import type {
  CSVRow,
  ParsedCSVData,
  ShowInsert,
  ValidationResult,
} from '@/types/show';

export async function parseCSV(file: File): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim(),
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
}

export function validateCSVSchema(rows: CSVRow[]): ValidationResult {
  const errors: string[] = [];

  if (rows.length === 0) {
    errors.push('CSV file is empty');
    return { valid: false, errors };
  }

  const requiredHeaders = [
    'date',
    'artist',
    'venue',
    'city',
    'state',
    'country',
  ];
  const firstRow = rows[0];
  const headers = Object.keys(firstRow);

  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      errors.push(`Missing required header: ${required}`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2;

    if (!row.date || row.date.trim() === '') {
      errors.push(`Row ${rowNumber}: Missing required field 'date'`);
    } else {
      const dateValidation = validateDate(row.date);
      if (!dateValidation.valid) {
        errors.push(`Row ${rowNumber}: ${dateValidation.error}`);
      }
    }

    if (!row.artist || row.artist.trim() === '') {
      errors.push(`Row ${rowNumber}: Missing required field 'artist'`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function parseDate(dateString: string): Date | null {
  const trimmed = dateString.trim();
  const parts = trimmed.split(/[-/]/);

  if (parts.length !== 3) {
    return null;
  }

  const [month, day, year] = parts.map((p) => Number.parseInt(p, 10));

  if (Number.isNaN(month) || Number.isNaN(day) || Number.isNaN(year)) {
    return null;
  }

  const fullYear = year < 100 ? 2000 + year : year;

  const date = new Date(fullYear, month - 1, day);

  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function validateDate(dateString: string): { valid: boolean; error?: string } {
  const date = parseDate(dateString);
  if (!date) {
    return {
      valid: false,
      error: `Invalid date format '${dateString}'. Expected MM-DD-YY or MM/DD/YY`,
    };
  }
  return { valid: true };
}

export function parseArtists(artistString: string): string[] {
  return artistString
    .split('+')
    .map((artist) => artist.trim())
    .filter((artist) => artist.length > 0);
}

export function transformCSVToShows(
  rows: CSVRow[],
  userId: string
): ShowInsert[] {
  return rows.map((row) => {
    const date = parseDate(row.date);
    const dateString = date ? date.toISOString().split('T')[0] : '';

    return {
      clerk_user_id: userId,
      date: dateString,
      artists: parseArtists(row.artist),
      venue: row.venue?.trim() || null,
      city: row.city?.trim() || null,
      state: row.state?.trim() || null,
      country: row.country?.trim() || null,
    };
  });
}

export interface ParseResult {
  success: boolean;
  data?: ParsedCSVData;
  error?: string;
}

export async function parseAndValidateCSV(
  file: File,
  userId: string
): Promise<ParseResult> {
  try {
    const rows = await parseCSV(file);

    const validation = validateCSVSchema(rows);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join('\n'),
      };
    }

    const shows = transformCSVToShows(rows, userId);

    return {
      success: true,
      data: {
        shows,
        totalRows: rows.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error parsing CSV',
    };
  }
}
