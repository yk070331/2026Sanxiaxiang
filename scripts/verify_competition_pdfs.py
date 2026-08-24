from pathlib import Path

import pdfplumber
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / "output" / "pdf"

EXPECTED = {
    "红韵乔林-产品设计说明书.pdf": {
        "pages": 9,
        "headings": [
            "项目概述与参赛定位",
            "技术架构设计",
            "数据模型、权限与合规",
            "当前完成度与上线准备",
        ],
    },
    "红韵乔林-开发过程与测试报告.pdf": {
        "pages": 7,
        "headings": [
            "开发过程概览",
            "关键问题与解决过程",
            "自动化测试结果",
            "风险与后续迭代",
        ],
    },
}


for filename, checks in EXPECTED.items():
    path = PDF_DIR / filename
    assert path.exists(), f"missing PDF: {filename}"
    assert 100_000 < path.stat().st_size < 10_000_000, f"unexpected size: {filename}"

    reader = PdfReader(str(path))
    assert len(reader.pages) == checks["pages"], f"unexpected page count: {filename}"
    assert reader.metadata.title, f"missing PDF title metadata: {filename}"
    extracted = "\n".join(page.extract_text() or "" for page in reader.pages)
    assert "�" not in extracted, f"replacement character found: {filename}"
    for heading in checks["headings"]:
        assert heading in extracted, f"missing heading {heading}: {filename}"

    with pdfplumber.open(path) as document:
        for page_number, page in enumerate(document.pages, start=1):
            assert page.width > 500 and page.height > 800, f"invalid page size: {filename} p{page_number}"
            for char in page.chars:
                assert -0.5 <= char["x0"] <= page.width + 0.5, f"text x0 clipped: {filename} p{page_number}"
                assert -0.5 <= char["x1"] <= page.width + 0.5, f"text x1 clipped: {filename} p{page_number}"
                assert -0.5 <= char["top"] <= page.height + 0.5, f"text top clipped: {filename} p{page_number}"
                assert -0.5 <= char["bottom"] <= page.height + 0.5, f"text bottom clipped: {filename} p{page_number}"

    print(f"{filename}: {checks['pages']} pages, text and bounds verified")
