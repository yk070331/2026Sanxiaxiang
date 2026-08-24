from pathlib import Path
import shutil

import pypdfium2 as pdfium


ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / "output" / "pdf"
RENDER_ROOT = ROOT / "tmp" / "pdfs"


def render(pdf_path: Path) -> tuple[Path, int]:
    output_dir = RENDER_ROOT / pdf_path.stem
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    document = pdfium.PdfDocument(str(pdf_path))
    for page_index in range(len(document)):
        page = document[page_index]
        bitmap = page.render(scale=1.7)
        image = bitmap.to_pil()
        image.save(output_dir / f"page-{page_index + 1:02d}.png")
        page.close()
    document.close()
    return output_dir, page_index + 1


if __name__ == "__main__":
    for pdf_path in sorted(PDF_DIR.glob("*.pdf")):
        output_dir, page_count = render(pdf_path)
        print(f"{pdf_path.name}: {page_count} pages -> {output_dir}")
