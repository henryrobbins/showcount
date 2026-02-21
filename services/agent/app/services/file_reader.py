from pathlib import Path

import openpyxl


def read_file(path: Path) -> str:
    """Read file contents as text for Claude to parse."""
    suffix = path.suffix.lower()

    if suffix in (".txt", ".md", ".csv"):
        return path.read_text(encoding="utf-8")

    if suffix == ".xlsx":
        return _xlsx_to_text(path)

    raise ValueError(f"Unsupported file type: {suffix}")


def _xlsx_to_text(path: Path) -> str:
    """Convert Excel file to pipe-delimited text."""
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    lines: list[str] = []

    for sheet in wb.worksheets:
        for row in sheet.iter_rows(values_only=True):
            cells = [str(cell) if cell is not None else "" for cell in row]
            lines.append(" | ".join(cells))

    wb.close()
    return "\n".join(lines)
