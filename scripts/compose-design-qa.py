#!/usr/bin/env python3
"""Compose reference and implementation boards for visual QA."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "design-qa"

FONT_CANDIDATES = (
    Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
    Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
)


def get_font(size: int):
    for path in FONT_CANDIDATES:
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def implementation_board(files: list[str], labels: list[str], output: str, size=(1654, 1066)):
    width, height = size
    gutter = 18
    cell_w = (width - gutter * 3) // 2
    cell_h = (height - gutter * 3) // 2
    board = Image.new("RGB", size, "#05070b")
    draw = ImageDraw.Draw(board)
    font = get_font(22)

    for index, (filename, label) in enumerate(zip(files, labels)):
        row, col = divmod(index, 2)
        x = gutter + col * (cell_w + gutter)
        y = gutter + row * (cell_h + gutter)
        image = Image.open(OUT / filename).convert("RGB")
        image = ImageOps.fit(image, (cell_w, cell_h), method=Image.Resampling.LANCZOS, centering=(0.5, 0.45))
        board.paste(image, (x, y))
        draw.rounded_rectangle((x + 12, y + 12, x + 190, y + 48), radius=14, fill=(8, 9, 15, 220))
        draw.text((x + 24, y + 19), label, font=font, fill="#b89cff")

    path = OUT / output
    board.save(path, quality=95)
    return path


def compare(reference: str, implementation: Path, output: str):
    ref = Image.open(reference).convert("RGB")
    impl = Image.open(implementation).convert("RGB")
    target = (1654, 1066)
    ref = ImageOps.fit(ref, target, method=Image.Resampling.LANCZOS)
    impl = ImageOps.fit(impl, target, method=Image.Resampling.LANCZOS)
    gap = 28
    canvas = Image.new("RGB", (target[0] * 2 + gap, target[1]), "#11131a")
    canvas.paste(ref, (0, 0))
    canvas.paste(impl, (target[0] + gap, 0))
    canvas.save(OUT / output, quality=95)


BOARDS = [
    {
        "name": "commerce",
        "reference": "/Users/vladyslav.katash/.codex/generated_images/019f5c3c-1f1b-78b0-b635-e5ac83e0e7f4/exec-c16791db-43e0-4490-a863-7ebdc3d66e1d.png",
        "files": ["commerce-home.png", "commerce-courses.png", "commerce-course.png", "commerce-memberships.png"],
        "labels": ["01 HOME", "02 CATALOG", "03 COURSE", "04 MEMBERSHIPS"],
    },
    {
        "name": "learning",
        "reference": "/Users/vladyslav.katash/.codex/generated_images/019f5c3c-1f1b-78b0-b635-e5ac83e0e7f4/exec-7f9780bf-8ca6-4d65-9aaa-81315115635e.png",
        "files": ["learning-cabinet.png", "learning-map.png", "learning-lesson.png", "learning-practice.png"],
        "labels": ["01 CABINET", "02 LEARNING MAP", "03 LESSON", "04 PRACTICE"],
    },
    {
        "name": "marketplace",
        "reference": "/Users/vladyslav.katash/.codex/generated_images/019f5c3c-1f1b-78b0-b635-e5ac83e0e7f4/exec-b27b2f0a-153a-4e64-9317-b748ab1e95ef.png",
        "files": ["marketplace-home.png", "marketplace-product.png", "marketplace-checkout.png", "marketplace-events.png"],
        "labels": ["01 MARKETPLACE", "02 PRODUCT", "03 CHECKOUT", "04 EVENTS"],
    },
    {
        "name": "account",
        "reference": "/Users/vladyslav.katash/.codex/generated_images/019f5c3c-1f1b-78b0-b635-e5ac83e0e7f4/exec-3562a326-fd5a-4581-96de-3071b9c4c959.png",
        "files": ["account-login.png", "account-onboarding.png", "account-events.png", "account-settings.png"],
        "labels": ["01 LOGIN", "02 ONBOARDING", "03 EVENTS", "04 ACCOUNT"],
    },
]


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for board in BOARDS:
        impl = implementation_board(
            board["files"],
            board["labels"],
            f"{board['name']}-implementation-board.png",
        )
        compare(board["reference"], impl, f"{board['name']}-comparison.png")
        print(f"created {board['name']}")
