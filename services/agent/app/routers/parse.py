import json
import logging
import uuid
from collections.abc import AsyncGenerator
from pathlib import Path

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import StreamingResponse

from app.config import settings
from app.services.file_reader import read_file
from app.services.pipeline import process_shows

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_EXTENSIONS = {".txt", ".md", ".csv", ".xlsx"}


def _error_response(message: str) -> StreamingResponse:
    async def stream() -> AsyncGenerator[str, None]:
        payload = json.dumps({"message": message})
        yield f"event: error\ndata: {payload}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


@router.post("/parse")
async def parse_file(
    file: UploadFile = File(...),
    prompt: str = Form(""),
) -> StreamingResponse:
    """Parse an uploaded file into structured show data via SSE."""
    filename = file.filename or "upload.txt"
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        return _error_response(f"Unsupported file type: {suffix}")

    # Save to temp directory
    session_id = str(uuid.uuid4())
    work_dir = Path(settings.work_dir) / session_id
    work_dir.mkdir(parents=True, exist_ok=True)
    file_path = work_dir / filename

    content_bytes = await file.read()
    file_path.write_bytes(content_bytes)

    try:
        content = read_file(file_path)
    except ValueError as e:
        return _error_response(str(e))

    async def event_stream() -> AsyncGenerator[str, None]:
        try:
            async for show in process_shows(content, prompt):
                data = show.model_dump_json()
                yield f"event: show\ndata: {data}\n\n"
            yield "event: done\ndata: {}\n\n"
        except Exception as exc:
            logger.exception("Pipeline error: %s", session_id)
            payload = json.dumps({"message": str(exc)})
            yield f"event: error\ndata: {payload}\n\n"

    return StreamingResponse(
        event_stream(), media_type="text/event-stream"
    )
