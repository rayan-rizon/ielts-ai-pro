#!/usr/bin/env python3

"""Extract numbered green answer-evidence phrases from transcript images."""

from __future__ import annotations

import argparse
import csv
import io
import json
import os
import re
import subprocess
import tempfile
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
TRANSCRIPT_ROOT = ROOT / "transcript"


def connected_badges(image: Image.Image) -> list[tuple[int, int, int, int]]:
    pixels = np.asarray(image.convert("RGB"))
    red, green, blue = pixels[:, :, 0], pixels[:, :, 1], pixels[:, :, 2]
    mask = (green > 50) & (green > red * 1.12) & (green > blue * 1.12) & (red < 120)
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    badges: list[tuple[int, int, int, int]] = []

    for start_y, start_x in zip(*np.nonzero(mask)):
        if seen[start_y, start_x]:
            continue
        queue = deque([(int(start_y), int(start_x))])
        seen[start_y, start_x] = True
        xs: list[int] = []
        ys: list[int] = []
        while queue:
            y, x = queue.pop()
            xs.append(x)
            ys.append(y)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                next_y, next_x = y + dy, x + dx
                if (
                    0 <= next_y < height
                    and 0 <= next_x < width
                    and mask[next_y, next_x]
                    and not seen[next_y, next_x]
                ):
                    seen[next_y, next_x] = True
                    queue.append((next_y, next_x))

        if len(xs) < 40:
            continue
        x1, x2 = min(xs), max(xs) + 1
        y1, y2 = min(ys), max(ys) + 1
        box_width, box_height = x2 - x1, y2 - y1
        fill = len(xs) / max(1, box_width * box_height)
        if (
            8 <= box_width <= max(80, int(width * 0.06))
            and 8 <= box_height <= 80
            and 0.55 <= box_width / box_height <= 1.6
            and fill >= 0.42
        ):
            badges.append((x1, y1, x2, y2))

    return sorted(badges, key=lambda box: (box[1], box[0]))


def read_badge_number(image: Image.Image, box: tuple[int, int, int, int], workdir: Path) -> int | None:
    x1, y1, x2, y2 = box
    crop = image.crop((x1, y1, x2, y2)).resize(((x2 - x1) * 10, (y2 - y1) * 10))
    array = np.asarray(crop.convert("RGB"))
    luminance = array.mean(axis=2)
    filename = f"badge-{x1}-{y1}.png"
    for threshold in (170, 145, 195):
        base_binary = Image.fromarray(np.where(luminance > threshold, 0, 255).astype("uint8")).filter(
            ImageFilter.MedianFilter(3)
        )
        for padded in (False, True):
            binary = (
                ImageOps.expand(base_binary, border=max(24, base_binary.width // 6), fill=255)
                if padded
                else base_binary
            )
            binary.save(workdir / filename)
            for page_mode in (10, 8, 13):
                result = subprocess.run(
                    [
                        "/opt/homebrew/bin/tesseract",
                        filename,
                        "stdout",
                        "--psm",
                        str(page_mode),
                        "-c",
                        "tessedit_char_whitelist=0123456789",
                    ],
                    cwd=workdir,
                    capture_output=True,
                    text=True,
                    check=False,
                )
                match = re.search(r"\d+", result.stdout)
                if match:
                    return int(match.group())
    return None


def ocr_words(image_path: Path, image: Image.Image) -> list[dict]:
    # Writing TSV to a file is important here. A small subset of the tall
    # transcript images causes Tesseract's stdout renderer to fold subsequent
    # TSV records into the final text field, which makes csv.DictReader treat
    # almost the whole page as one word. The file renderer remains well-formed.
    with tempfile.TemporaryDirectory(prefix="ielts-highlight-ocr-") as directory:
        workdir = Path(directory)
        subprocess.run(
            ["/opt/homebrew/bin/tesseract", str(image_path), "ocr", "tsv", "--psm", "3"],
            cwd=workdir,
            capture_output=True,
            text=True,
            check=True,
        )
        output = (workdir / "ocr.tsv").read_text(errors="replace")
    words: list[dict] = []
    # Tesseract does not quote TSV fields, so a recognised double quote must be
    # treated as ordinary text rather than as the start of a CSV quoted field.
    for row in csv.DictReader(io.StringIO(output), delimiter="\t", quoting=csv.QUOTE_NONE):
        text = (row.get("text") or "").strip()
        if not text:
            continue
        x, y, width, height = (int(row[name]) for name in ("left", "top", "width", "height"))
        crop = np.asarray(image.crop((x, y, x + width, y + height)).convert("RGB"))
        if not crop.size:
            continue
        red = crop[:, :, 0].astype(np.int16)
        green = crop[:, :, 1].astype(np.int16)
        blue = crop[:, :, 2].astype(np.int16)
        light_green = (
            (green > 225) & (green > red + 8) & (green > blue + 25) & (red > 160)
        ).mean()
        words.append(
            {
                "text": text,
                "x": x,
                "y": y,
                "width": width,
                "height": height,
                "center_y": y + height / 2,
                "line": (row["block_num"], row["par_num"], row["line_num"]),
                "highlighted": light_green >= 0.15,
            }
        )
    return words


def extract_image(image_path: Path) -> dict:
    image = Image.open(image_path).convert("RGB")
    words = ocr_words(image_path, image)
    line_words: dict[tuple[str, str, str], list[dict]] = {}
    for word in words:
        line_words.setdefault(word["line"], []).append(word)

    with tempfile.TemporaryDirectory(prefix="ielts-highlight-badges-") as directory:
        workdir = Path(directory)
        badge_events = []
        for box in connected_badges(image):
            number = read_badge_number(image, box, workdir)
            if number is None:
                continue
            x1, y1, x2, y2 = box
            badge_events.append(
                {"question_number": number, "x": x1, "center_y": (y1 + y2) / 2, "box": box}
            )

    phrases = []
    pending: list[str] = []
    ordered_lines = sorted(
        line_words.values(), key=lambda line: (min(word["y"] for word in line), min(word["x"] for word in line))
    )
    highlighted_lines = [line for line in ordered_lines if any(word["highlighted"] for word in line)]
    badges_by_line: dict[int, list[dict]] = {}
    for badge in badge_events:
        if not highlighted_lines:
            continue
        nearest_index, nearest_line = min(
            enumerate(highlighted_lines),
            key=lambda item: abs(
                badge["center_y"]
                - sum(word["center_y"] for word in item[1]) / len(item[1])
            ),
        )
        nearest_center = sum(word["center_y"] for word in nearest_line) / len(nearest_line)
        if abs(badge["center_y"] - nearest_center) <= 50:
            badges_by_line.setdefault(nearest_index, []).append(badge)

    for line_index, line in enumerate(highlighted_lines):
        events = [
            {"kind": "word", "x": word["x"], "word": word}
            for word in line
            if word["highlighted"]
        ]
        for badge in badges_by_line.get(line_index, []):
            line_center = sum(word["center_y"] for word in line) / len(line)
            line_height = max(word["height"] for word in line)
            event_x = (
                float("inf")
                if badge["center_y"] > line_center + max(3, line_height * 0.3)
                else badge["x"]
            )
            events.append({"kind": "badge", "x": event_x, "badge": badge})
        for event in sorted(events, key=lambda item: item["x"]):
            if event["kind"] == "word":
                pending.append(event["word"]["text"])
            elif pending:
                phrases.append(
                    {
                        "question_number": event["badge"]["question_number"],
                        "ocr_phrase": " ".join(pending).strip(),
                        "badge_box": event["badge"]["box"],
                    }
                )
                pending = []

    relative = image_path.relative_to(TRANSCRIPT_ROOT)
    return {
        "year": int(relative.parts[0]),
        "test": int(relative.parts[1]),
        "part": int(relative.stem),
        "image": str(relative),
        "badges_detected": len(badge_events),
        "phrases": phrases,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", action="append", help="year/test/part; may be repeated")
    parser.add_argument("--output", default="/tmp/listening-image-highlights.json")
    args = parser.parse_args()

    if args.target:
        images = [TRANSCRIPT_ROOT / f"{target}.png" for target in args.target]
    else:
        images = sorted(TRANSCRIPT_ROOT.glob("*/*/*.png"))
    with ThreadPoolExecutor(max_workers=min(6, max(1, len(images)))) as executor:
        results = list(executor.map(extract_image, images))
    Path(args.output).write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(
        json.dumps(
            {
                "images": len(results),
                "badges": sum(item["badges_detected"] for item in results),
                "phrases": sum(len(item["phrases"]) for item in results),
                "zero_phrase_images": [item["image"] for item in results if not item["phrases"]],
                "output": args.output,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
