import argparse
import os
import re
import sys
import tempfile
import subprocess
from pathlib import Path

# Optional imports are handled inside functions so the script runs even if some packages are missing
def extract_video_id(url: str) -> str:
    # Handles common YouTube URL formats
    patterns = [
        r"youtu\.be/([A-Za-z0-9_-]{6,})",
        r"youtube\.com/watch\?v=([A-Za-z0-9_-]{6,})",
        r"youtube\.com/embed/([A-Za-z0-9_-]{6,})",
        r"youtube\.com/shorts/([A-Za-z0-9_-]{6,})",
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    # As a last resort, accept raw IDs
    if re.fullmatch(r"[A-Za-z0-9_-]{6,}", url):
        return url
    raise ValueError("Could not parse a YouTube video ID from the link")

def try_fetch_youtube_transcript(video_id: str, languages=None):
    try:
        from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
    except ImportError:
        return None, "youtube-transcript-api not installed"
    try:
        transcript = YouTubeTranscriptApi.get_transcript(
            video_id, languages=languages or ["en", "en-US", "en-GB"]
        )
        return transcript, None
    except TranscriptsDisabled:
        return None, "Transcripts are disabled"
    except NoTranscriptFound:
        return None, "No transcript found for the requested languages"
    except Exception as e:
        return None, f"Transcript fetch failed: {e}"

def write_plain_script_from_segments(segments, out_txt: Path):
    # segments is a list of dicts with "text"
    with out_txt.open("w", encoding="utf-8") as f:
        for seg in segments:
            f.write(seg["text"].strip() + "\n")
    return out_txt

def write_srt_from_segments(segments, out_srt: Path):
    def fmt_time(t):
        # t is seconds, convert to SRT time
        hrs = int(t // 3600)
        mins = int((t % 3600) // 60)
        secs = int(t % 60)
        ms = int((t - int(t)) * 1000)
        return f"{hrs:02}:{mins:02}:{secs:02},{ms:03}"

    with out_srt.open("w", encoding="utf-8") as f:
        for idx, seg in enumerate(segments, start=1):
            start = seg.get("start", 0.0)
            dur = seg.get("duration", 0.0)
            end = start + dur
            text = seg.get("text", "").strip()
            f.write(f"{idx}\n")
            f.write(f"{fmt_time(start)} --> {fmt_time(end)}\n")
            f.write(text + "\n\n")
    return out_srt

def download_audio(url: str, out_dir: Path) -> Path:
    # Uses yt-dlp to extract audio as WAV
    # Requires ffmpeg on PATH
    audio_template = str(out_dir / "audio.%(ext)s")
    cmd = [
        "yt-dlp",
        "-f", "bestaudio/best",
        "--extract-audio",
        "--audio-format", "wav",
        "--audio-quality", "0",
        "-o", audio_template,
        url,
    ]
    try:
        subprocess.check_call(cmd)
    except FileNotFoundError:
        raise RuntimeError("yt-dlp is not installed or not on PATH")
    # Find produced WAV
    for p in out_dir.glob("audio.*"):
        return p
    raise RuntimeError("Audio download failed")

def transcribe_with_faster_whisper(audio_path: Path, model_size: str = "medium"):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        return None, "faster-whisper not installed"

    # device and compute type auto selection for simplicity
    try:
        model = WhisperModel(model_size, device="auto", compute_type="auto")
    except Exception as e:
        return None, f"Model load failed: {e}"

    segments_out = []
    try:
        segments, info = model.transcribe(
            str(audio_path),
            beam_size=5,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
        )
        for seg in segments:
            segments_out.append({
                "start": seg.start,
                "duration": seg.end - seg.start,
                "text": seg.text.strip(),
            })
        return segments_out, None
    except Exception as e:
        return None, f"Transcription failed: {e}"

def transcribe_with_openai_whisper(audio_path: Path, model_size: str = "medium"):
    try:
        import whisper
    except ImportError:
        return None, "openai-whisper not installed"
    try:
        model = whisper.load_model(model_size)
        result = model.transcribe(str(audio_path))
        segments_out = []
        for seg in result.get("segments", []):
            segments_out.append({
                "start": float(seg.get("start", 0.0)),
                "duration": float(seg.get("end", 0.0)) - float(seg.get("start", 0.0)),
                "text": seg.get("text", "").strip(),
            })
        return segments_out, None
    except Exception as e:
        return None, f"Whisper transcription failed: {e}"

def main():
    parser = argparse.ArgumentParser(description="Convert a YouTube video to a text script")
    parser.add_argument("url", help="YouTube video URL or raw video ID")
    parser.add_argument("--model", default="medium", help="Whisper model size for offline transcription")
    parser.add_argument("--lang", default="en", help="Preferred language code for transcript lookup")
    parser.add_argument("--out", default="script.txt", help="Output plain text file")
    parser.add_argument("--srt", default="script.srt", help="Optional SRT subtitle output")
    parser.add_argument("--force_offline", action="store_true", help="Skip YouTube transcript and force offline transcription")
    args = parser.parse_args()

    out_txt = Path(args.out).resolve()
    out_srt = Path(args.srt).resolve()

    try:
        video_id = extract_video_id(args.url)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(2)

    segments = None
    reason = None

    if not args.force_offline:
        segs, err = try_fetch_youtube_transcript(video_id, languages=[args.lang, "en", "en-US", "en-GB"])
        if segs:
            # YouTube transcript segments already have start and duration
            segments = segs
        else:
            reason = err

    if segments is None:
        # Fallback to audio download then offline transcription
        print("Falling back to offline transcription" + (f" ({reason})" if reason else ""))
        with tempfile.TemporaryDirectory() as td:
            td_path = Path(td)
            try:
                audio_path = download_audio(args.url, td_path)
            except Exception as e:
                print(f"Audio download failed: {e}")
                sys.exit(3)

            segs, err = transcribe_with_faster_whisper(audio_path, model_size=args.model)
            if not segs:
                # Try openai-whisper as a fallback
                print(f"faster-whisper not available or failed: {err}")
                segs, err2 = transcribe_with_openai_whisper(audio_path, model_size=args.model)
                if not segs:
                    print(f"openai-whisper failed: {err2}")
                    sys.exit(4)
            segments = segs

    write_plain_script_from_segments(segments, out_txt)
    try:
        write_srt_from_segments(segments, out_srt)
        print(f"Wrote {out_txt} and {out_srt}")
    except Exception:
        print(f"Wrote {out_txt}")

if __name__ == "__main__":
    main()
