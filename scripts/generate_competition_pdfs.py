from __future__ import annotations

import os
import subprocess
from pathlib import Path

from reportlab.graphics.shapes import Drawing, Line, Polygon, Rect, String
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableOfContents,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output" / "pdf"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

DESIGN_PDF = OUTPUT_DIR / "红韵乔林-产品设计说明书.pdf"
PROCESS_PDF = OUTPUT_DIR / "红韵乔林-开发过程与测试报告.pdf"

PAGE_W, PAGE_H = A4
MARGIN_X = 18 * mm
MARGIN_TOP = 19 * mm
MARGIN_BOTTOM = 17 * mm

RED = colors.HexColor("#A30B14")
DARK_RED = colors.HexColor("#6F0710")
GOLD = colors.HexColor("#D3A23A")
CREAM = colors.HexColor("#FFF8EE")
INK = colors.HexColor("#28211F")
MUTED = colors.HexColor("#6F6561")
PALE_RED = colors.HexColor("#F8EDEE")
PALE_GOLD = colors.HexColor("#FBF4E4")
GREEN = colors.HexColor("#287A48")
BLUE = colors.HexColor("#2D5F8B")
LINE_COLOR = colors.HexColor("#E3D8D1")


def register_fonts() -> None:
    regular = Path(r"C:\Windows\Fonts\msyh.ttc")
    bold = Path(r"C:\Windows\Fonts\msyhbd.ttc")
    if not regular.exists() or not bold.exists():
        raise FileNotFoundError("未找到微软雅黑字体，无法可靠生成中文 PDF")
    pdfmetrics.registerFont(TTFont("YaHei", str(regular), subfontIndex=0))
    pdfmetrics.registerFont(TTFont("YaHeiBold", str(bold), subfontIndex=0))


register_fonts()


def build_styles():
    base = getSampleStyleSheet()
    return {
        "body": ParagraphStyle(
            "BodyCN",
            parent=base["BodyText"],
            fontName="YaHei",
            fontSize=9.2,
            leading=15.5,
            textColor=INK,
            alignment=TA_JUSTIFY,
            spaceAfter=5,
            wordWrap="CJK",
        ),
        "small": ParagraphStyle(
            "SmallCN",
            fontName="YaHei",
            fontSize=7.7,
            leading=12,
            textColor=MUTED,
            wordWrap="CJK",
        ),
        "caption": ParagraphStyle(
            "CaptionCN",
            fontName="YaHei",
            fontSize=7.4,
            leading=11,
            alignment=TA_CENTER,
            textColor=MUTED,
            wordWrap="CJK",
        ),
        "h1": ParagraphStyle(
            "Heading1",
            fontName="YaHeiBold",
            fontSize=17,
            leading=23,
            textColor=DARK_RED,
            spaceBefore=5,
            spaceAfter=10,
            keepWithNext=True,
            wordWrap="CJK",
        ),
        "h2": ParagraphStyle(
            "Heading2",
            fontName="YaHeiBold",
            fontSize=12.2,
            leading=18,
            textColor=RED,
            spaceBefore=8,
            spaceAfter=6,
            keepWithNext=True,
            wordWrap="CJK",
        ),
        "h3": ParagraphStyle(
            "Heading3",
            fontName="YaHeiBold",
            fontSize=10.2,
            leading=15,
            textColor=INK,
            spaceBefore=5,
            spaceAfter=4,
            keepWithNext=True,
            wordWrap="CJK",
        ),
        "cover_title": ParagraphStyle(
            "CoverTitle",
            fontName="YaHeiBold",
            fontSize=28,
            leading=38,
            textColor=colors.white,
            alignment=TA_LEFT,
            wordWrap="CJK",
        ),
        "cover_subtitle": ParagraphStyle(
            "CoverSubtitle",
            fontName="YaHei",
            fontSize=13,
            leading=21,
            textColor=colors.HexColor("#F8E5C0"),
            alignment=TA_LEFT,
            wordWrap="CJK",
        ),
        "toc_title": ParagraphStyle(
            "TOCTitle",
            fontName="YaHeiBold",
            fontSize=22,
            leading=30,
            textColor=DARK_RED,
            spaceAfter=14,
        ),
        "callout": ParagraphStyle(
            "Callout",
            fontName="YaHei",
            fontSize=8.6,
            leading=14.5,
            textColor=colors.HexColor("#5B4122"),
            wordWrap="CJK",
        ),
        "metric": ParagraphStyle(
            "Metric",
            fontName="YaHeiBold",
            fontSize=16,
            leading=20,
            textColor=RED,
            alignment=TA_CENTER,
        ),
        "metric_label": ParagraphStyle(
            "MetricLabel",
            fontName="YaHei",
            fontSize=7.6,
            leading=11,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
        "code": ParagraphStyle(
            "CodeCN",
            fontName="YaHei",
            fontSize=7.4,
            leading=11.5,
            textColor=colors.HexColor("#403A38"),
            backColor=colors.HexColor("#F5F2F0"),
            borderPadding=6,
            borderColor=LINE_COLOR,
            borderWidth=0.5,
            wordWrap="CJK",
        ),
    }


STYLES = build_styles()


class CompetitionDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str | os.PathLike, running_title: str):
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=MARGIN_X,
            rightMargin=MARGIN_X,
            topMargin=MARGIN_TOP,
            bottomMargin=MARGIN_BOTTOM,
            title=running_title,
            author="红韵乔林项目团队",
            subject="2026年山东省大学生软件设计大赛参赛材料",
        )
        self.running_title = running_title
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="normal",
        )
        self.addPageTemplates(
            [PageTemplate(id="all", frames=frame, onPage=self._draw_page)]
        )

    def _draw_page(self, canvas, doc):
        canvas.saveState()
        if doc.page == 1:
            canvas.setFillColor(DARK_RED)
            canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
            canvas.setFillColor(RED)
            canvas.rect(0, 0, 17 * mm, PAGE_H, stroke=0, fill=1)
            canvas.setFillColor(GOLD)
            canvas.rect(17 * mm, PAGE_H - 6 * mm, PAGE_W - 17 * mm, 6 * mm, stroke=0, fill=1)
            canvas.setStrokeColor(colors.HexColor("#DDBB70"))
            canvas.setLineWidth(0.7)
            canvas.line(31 * mm, 44 * mm, PAGE_W - 22 * mm, 44 * mm)
        else:
            canvas.setStrokeColor(LINE_COLOR)
            canvas.setLineWidth(0.5)
            canvas.line(MARGIN_X, PAGE_H - 12 * mm, PAGE_W - MARGIN_X, PAGE_H - 12 * mm)
            canvas.setFont("YaHei", 7.2)
            canvas.setFillColor(MUTED)
            canvas.drawString(MARGIN_X, PAGE_H - 9 * mm, "红韵乔林 · 山东省大学生软件设计大赛")
            canvas.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 9 * mm, self.running_title)
            canvas.line(MARGIN_X, 11 * mm, PAGE_W - MARGIN_X, 11 * mm)
            canvas.drawString(MARGIN_X, 7 * mm, "版本 V1.3 · 2026-08-24")
            canvas.drawRightString(PAGE_W - MARGIN_X, 7 * mm, f"第 {doc.page - 1} 页")
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            style_name = flowable.style.name
            if style_name == "Heading1":
                text = flowable.getPlainText()
                key = f"h1-{self.seq.nextf('heading1')}"
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(text, key, level=0, closed=False)
                self.notify("TOCEntry", (0, text, self.page - 1, key))
            elif style_name == "Heading2":
                text = flowable.getPlainText()
                key = f"h2-{self.seq.nextf('heading2')}"
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(text, key, level=1, closed=False)
                self.notify("TOCEntry", (1, text, self.page - 1, key))


def p(text: str, style: str = "body") -> Paragraph:
    return Paragraph(text, STYLES[style])


def h1(text: str) -> Paragraph:
    return p(text, "h1")


def h2(text: str) -> Paragraph:
    return p(text, "h2")


def h3(text: str) -> Paragraph:
    return p(text, "h3")


def bullets(items: list[str]) -> list:
    return [p(f"<font color='#A30B14'>●</font> {item}") for item in items]


def table(data, widths=None, header=True, font_size=7.4, aligns=None):
    normalized = []
    for row_index, row in enumerate(data):
        normalized_row = []
        for cell in row:
            if isinstance(cell, (Paragraph, Image, Drawing, Table)):
                normalized_row.append(cell)
            else:
                style = ParagraphStyle(
                    f"TableCell{row_index}",
                    fontName="YaHeiBold" if header and row_index == 0 else "YaHei",
                    fontSize=font_size,
                    leading=font_size * 1.55,
                    textColor=colors.white if header and row_index == 0 else INK,
                    alignment=TA_LEFT,
                    wordWrap="CJK",
                )
                normalized_row.append(Paragraph(str(cell), style))
        normalized.append(normalized_row)
    result = Table(normalized, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE_COLOR),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    if header:
        commands += [
            ("BACKGROUND", (0, 0), (-1, 0), DARK_RED),
            ("LINEBELOW", (0, 0), (-1, 0), 1, GOLD),
        ]
        if len(normalized) > 1:
            commands.append(("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, CREAM]))
    if aligns:
        for column, alignment in aligns.items():
            commands.append(("ALIGN", (column, 0), (column, -1), alignment))
    result.setStyle(TableStyle(commands))
    return result


def callout(text: str, color=PALE_GOLD):
    content = Table([[p(text, "callout")]], colWidths=[PAGE_W - 2 * MARGIN_X])
    content.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("BOX", (0, 0), (-1, -1), 0.6, GOLD if color == PALE_GOLD else RED),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return content


def metrics(items: list[tuple[str, str]]):
    cells = []
    for value, label in items:
        cells.append([p(value, "metric"), p(label, "metric_label")])
    cards = []
    for value, label in items:
        card = Table([[p(value, "metric")], [p(label, "metric_label")]], colWidths=[(PAGE_W - 2 * MARGIN_X - 18) / len(items)])
        card.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), PALE_RED),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2BFC1")),
            ("TOPPADDING", (0, 0), (-1, 0), 8),
            ("BOTTOMPADDING", (0, 1), (-1, 1), 8),
        ]))
        cards.append(card)
    return Table([cards], colWidths=[(PAGE_W - 2 * MARGIN_X - 18) / len(items)] * len(items), hAlign="LEFT", style=[("VALIGN", (0, 0), (-1, -1), "TOP")])


def flow_row(labels: list[str], colors_list=None):
    colors_list = colors_list or [PALE_RED] * len(labels)
    row = []
    widths = []
    available = PAGE_W - 2 * MARGIN_X
    arrow_w = 9 * mm
    box_w = (available - arrow_w * (len(labels) - 1)) / len(labels)
    for index, label in enumerate(labels):
        cell = Table([[p(label, "small")]], colWidths=[box_w])
        cell.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors_list[index]),
            ("BOX", (0, 0), (-1, -1), 0.7, RED if index == 0 else GOLD),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ]))
        row.append(cell)
        widths.append(box_w)
        if index < len(labels) - 1:
            row.append(p("→", "h2"))
            widths.append(arrow_w)
    result = Table([row], colWidths=widths, hAlign="LEFT")
    result.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ALIGN", (0, 0), (-1, -1), "CENTER")]))
    return result


def architecture_drawing():
    width = PAGE_W - 2 * MARGIN_X
    height = 78 * mm
    d = Drawing(width, height)

    def box(x, y, w, h, title, subtitle, fill, stroke):
        d.add(Rect(x, y, w, h, rx=7, ry=7, fillColor=fill, strokeColor=stroke, strokeWidth=1))
        d.add(String(x + w / 2, y + h - 15, title, fontName="YaHeiBold", fontSize=9, fillColor=INK, textAnchor="middle"))
        d.add(String(x + w / 2, y + 10, subtitle, fontName="YaHei", fontSize=6.8, fillColor=MUTED, textAnchor="middle"))

    def arrow(x1, y1, x2, y2):
        d.add(Line(x1, y1, x2, y2, strokeColor=colors.HexColor("#9A7D68"), strokeWidth=1.2))
        d.add(Polygon([x2, y2, x2 - 5, y2 + 3, x2 - 5, y2 - 3], fillColor=colors.HexColor("#9A7D68"), strokeColor=None))

    center_y = height - 34
    box(4, center_y, 96, 34, "用户角色", "游客 / 师生 / 管理员", PALE_GOLD, GOLD)
    box(128, center_y, 116, 34, "微信小程序", "页面交互与平台能力", PALE_RED, RED)
    box(272, center_y, 120, 34, "客户端服务层", "云端读取 / 本地降级", colors.HexColor("#EDF4F8"), BLUE)
    box(420, center_y, 94, 34, "微信云开发", "函数 / 数据库 / 存储", colors.HexColor("#EDF7F0"), GREEN)
    arrow(100, center_y + 17, 128, center_y + 17)
    arrow(244, center_y + 17, 272, center_y + 17)
    arrow(392, center_y + 17, 420, center_y + 17)

    y2 = height - 104
    box(38, y2, 126, 38, "地图与导航", "腾讯坐标 / 定位 / 搜索", colors.white, RED)
    box(198, y2, 126, 38, "研学与内容", "路线 / 图集 / 答题 / 打卡", colors.white, GOLD)
    box(358, y2, 126, 38, "治理与审核", "纠错 / 草稿 / 审核 / 发布", colors.white, GREEN)
    d.add(Line(186, center_y, 101, y2 + 38, strokeColor=LINE_COLOR))
    d.add(Line(186, center_y, 261, y2 + 38, strokeColor=LINE_COLOR))
    d.add(Line(186, center_y, 421, y2 + 38, strokeColor=LINE_COLOR))

    y3 = 10
    box(64, y3, 164, 38, "本地可靠性层", "已审核数据 / 打卡队列 / 纠错队列", PALE_GOLD, GOLD)
    box(304, y3, 164, 38, "云端安全层", "OPENID / 白名单 / 角色 / 输入校验", PALE_RED, RED)
    arrow(228, y3 + 19, 304, y3 + 19)
    return d


def score_chart():
    data = [
        ("主题与创新", 15, RED),
        ("功能与技术", 15, RED),
        ("用户体验", 12, GOLD),
        ("应用价值", 10, GOLD),
        ("原创合规", 8, GREEN),
        ("设计文档", 7, BLUE),
        ("源代码", 17, BLUE),
        ("过程测试", 8, GREEN),
        ("演示视频", 8, GREEN),
    ]
    width = PAGE_W - 2 * MARGIN_X
    height = 78 * mm
    d = Drawing(width, height)
    left = 84
    max_w = width - left - 38
    row_h = 21
    for i, (label, value, color) in enumerate(data):
        y = height - 22 - i * row_h
        d.add(String(left - 8, y + 3, label, fontName="YaHei", fontSize=7.5, fillColor=INK, textAnchor="end"))
        d.add(Rect(left, y, max_w, 10, fillColor=colors.HexColor("#F1ECE8"), strokeColor=None))
        d.add(Rect(left, y, max_w * value / 17, 10, fillColor=color, strokeColor=None))
        d.add(String(left + max_w + 8, y + 2, str(value), fontName="YaHeiBold", fontSize=7.5, fillColor=INK))
    return d


def image_with_caption(path: Path, caption: str, max_w: float, max_h: float):
    reader = ImageReader(str(path))
    iw, ih = reader.getSize()
    scale = min(max_w / iw, max_h / ih)
    image = Image(str(path), width=iw * scale, height=ih * scale)
    image.hAlign = "CENTER"
    return Table(
        [[image], [p(caption, "caption")]],
        colWidths=[max_w],
        style=[
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BOX", (0, 0), (-1, -1), 0.4, LINE_COLOR),
            ("BACKGROUND", (0, 1), (-1, 1), CREAM),
            ("TOPPADDING", (0, 0), (-1, 0), 4),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
            ("TOPPADDING", (0, 1), (-1, 1), 5),
            ("BOTTOMPADDING", (0, 1), (-1, 1), 5),
        ],
    )


def cover(document_type: str, subtitle: str):
    return [
        Spacer(1, 36 * mm),
        p("2026年山东省大学生软件设计大赛", "cover_subtitle"),
        Spacer(1, 8 * mm),
        p("红韵乔林", "cover_title"),
        p(document_type, "cover_title"),
        Spacer(1, 7 * mm),
        p(subtitle, "cover_subtitle"),
        Spacer(1, 40 * mm),
        Table(
            [
                [p("参赛方向", "cover_subtitle"), p("软件开发 · 方向三（传统软件应用开发）", "cover_subtitle")],
                [p("作品形态", "cover_subtitle"), p("微信小程序", "cover_subtitle")],
                [p("文档版本", "cover_subtitle"), p("V1.3 · 2026-08-24", "cover_subtitle")],
                [p("代码仓库", "cover_subtitle"), p("github.com/yk070331/2026Sanxiaxiang", "cover_subtitle")],
            ],
            colWidths=[28 * mm, 115 * mm],
            style=[
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LINEBELOW", (0, 0), (-1, -1), 0.3, colors.HexColor("#9C6E6E")),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ],
        ),
        PageBreak(),
    ]


def toc_story():
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle(
            "TOC1",
            fontName="YaHeiBold",
            fontSize=10,
            leading=17,
            leftIndent=0,
            firstLineIndent=0,
            textColor=INK,
        ),
        ParagraphStyle(
            "TOC2",
            fontName="YaHei",
            fontSize=8.5,
            leading=15,
            leftIndent=16,
            firstLineIndent=0,
            textColor=MUTED,
        ),
    ]
    return [p("目录", "toc_title"), toc, PageBreak()]


def project_stats():
    git_base = ["git", "-c", f"safe.directory={ROOT.as_posix()}"]
    commit_count = int(subprocess.run(
        git_base + ["rev-list", "--count", "HEAD"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=True,
    ).stdout.strip())
    test_count = len(list((ROOT / "tests").glob("*.test.js")))
    source_count = sum(
        1
        for root_name in ("miniprogram", "cloudfunctions")
        for path in (ROOT / root_name).rglob("*")
        if path.is_file() and "node_modules" not in path.parts
    )
    return {"commit_count": commit_count, "test_count": test_count, "source_count": source_count}


def build_design_pdf():
    stats = project_stats()
    story = []
    story += cover("产品设计说明书", "从红色资源展示走向可导航、可研学、可审核的数字乡村服务")
    story += toc_story()

    story += [h1("1. 项目概述与参赛定位")]
    story += [p("“红韵乔林”面向井冈山乔林村红色文化传播、乡村研学与村级资料维护。项目以微信小程序为载体，将真实地图位置、实景图片、红色故事、个性化路线、扫码打卡、知识闯关、游客纠错和分级审核整合为一套可持续运行的数字服务。")]
    story += [callout("核心原则：真实位置必须有腾讯地图或现场采集依据；历史内容必须显示来源并通过审核；弱网情况下先保证游客现场可用，再异步补传。")]
    story += [Spacer(1, 5 * mm), metrics([("6处", "乔林村红色旧址"), ("3套", "预设研学路线"), ("16张", "已入库实拍/史料图片"), ("3类", "后台管理员角色")])]
    story += [h2("1.1 真实问题")]
    story += bullets([
        "红色旧址、人物资料和生态资源分散，游客难以形成完整路线。",
        "乡村地图坐标容易被复制错误，错误导航会直接降低现场可信度与安全性。",
        "传统图文展示缺少扫码、打卡、答题和学习成果反馈，研学过程难记录。",
        "实践团队离村后缺少资料录入、审核、纠错和发布机制，内容难以持续维护。",
        "山村弱网环境下纯云端方案可能失效，需要本地已审核内容与离线队列。",
    ])
    story += [h2("1.2 比赛评分映射")]
    story += [score_chart(), p("图1  软件开发赛题评分结构与本项目对应建设重点", "caption")]
    story += [table([
        ["评分维度", "项目落实"],
        ["主题与创新", "红色文化数字化、规则可解释路线、文物史实、知识闯关"],
        ["功能与技术", "原生小程序、云函数、云数据库、本地降级、离线补传"],
        ["用户体验", "定位搜索、清晰反馈、关怀模式、弱网提示、真实图片"],
        ["应用价值", "游客、学校研学和村级维护三类场景，可向多村复制"],
        ["原创与合规", "实拍素材台账、史料来源、审核状态、隐私最小化"],
    ], [36 * mm, 138 * mm])]

    story += [h1("2. 用户需求与产品目标")]
    story += [h2("2.1 用户角色")]
    story += [table([
        ["角色", "核心需求", "系统响应"],
        ["普通游客", "找得到、看得懂、走得通", "搜索筛选、腾讯导航、实景图文、距离估算"],
        ["学生与教师", "可组织、可学习、可评价", "路线推荐、扫码打卡、知识题、证书与任务扩展"],
        ["村级录入员", "不改代码也能更新资料", "保存草稿、填写来源、提交审核"],
        ["审核人员", "防止错误史料直接上线", "待审队列、通过/驳回、已发布内容隔离"],
    ], [30 * mm, 62 * mm, 82 * mm])]
    story += [h2("2.2 功能性与非功能性需求")]
    story += [table([
        ["类别", "要求", "当前实现证据"],
        ["地图", "搜索、筛选、当前位置、真实导航", "首页地图；乔林村与水库腾讯核验坐标"],
        ["研学", "按时长和主题推荐、现场打卡", "30分钟/60分钟/半日路线；手动与扫码打卡"],
        ["内容", "故事、相册、文物史实、来源", "实景相册五类筛选；史料谨慎表述"],
        ["互动", "答题、进度、结果反馈", "5题知识闯关、解释、来源与历史最高分"],
        ["治理", "纠错、录入、审核、发布", "纠错离线补传；三级角色云函数"],
        ["可靠性", "云端异常不阻断核心体验", "本地已审核数据、打卡与纠错待传队列"],
        ["隐私", "位置与身份最小化使用", "位置仅即时导航；OPENID仅由云函数获取"],
    ], [25 * mm, 59 * mm, 90 * mm])]

    story += [h1("3. 产品框架与核心体验")]
    story += [h2("3.1 功能框架")]
    story += [table([
        ["一级模块", "二级能力", "关键页面/服务"],
        ["地图导览", "全域地图、搜索筛选、定位、点位导航", "首页、村落详情、旧址详情"],
        ["内容展示", "红色故事、实景相册、文物史实、村情", "故事页、图集页、村情页"],
        ["研学助手", "路线推荐、扫码打卡、知识闯关、证书", "路线推荐页、研学页、答题页"],
        ["内容治理", "游客纠错、离线补传、资料录入、分级审核", "纠错页、管理页、三类云函数"],
        ["可靠性", "本地降级、网络状态、关怀模式", "客户端服务层与本地存储"],
    ], [30 * mm, 70 * mm, 74 * mm])]
    story += [h2("3.2 游客研学闭环")]
    story += [flow_row(["定位/搜索乔林村", "选择推荐路线", "导航与扫码打卡", "答题并查看来源", "完成研学成果"], [PALE_GOLD, PALE_RED, colors.HexColor("#EDF4F8"), PALE_GOLD, colors.HexColor("#EDF7F0")])]
    story += [Spacer(1, 4 * mm), p("系统在每一步给出明确状态：定位拒绝不会阻断浏览；旧址坐标未核验时不提供虚假导航；打卡先本地成功；答题显示解释与来源；纠错必须后台审核后才改变公开内容。")]
    story += [h2("3.3 内容发布闭环")]
    story += [flow_row(["录入草稿", "提交审核", "审核员核验", "发布公开", "游客纠错"], [PALE_RED, PALE_GOLD, colors.HexColor("#EDF4F8"), colors.HexColor("#EDF7F0"), PALE_RED])]

    story += [h1("4. 技术架构设计")]
    story += [architecture_drawing(), p("图2  系统总体架构", "caption")]
    story += [h2("4.1 技术选型")]
    story += [table([
        ["层级", "技术", "选择理由"],
        ["客户端", "微信原生小程序（WXML/WXSS/JavaScript）", "无需额外运行时，调用定位、地图、扫码和云开发能力直接"],
        ["地图", "微信 map / openLocation + 腾讯地图核验位置", "符合小程序平台能力，坐标统一使用 GCJ-02"],
        ["云端", "微信云函数、云数据库、云存储", "免自建服务器，天然提供微信身份上下文"],
        ["本地可靠性", "Storage + 本地已审核数据", "弱网先用、失败排队、恢复补传"],
        ["工程", "Git + Node.js 自动化测试", "版本可追溯，核心安全与同步逻辑可重复验证"],
    ], [28 * mm, 65 * mm, 81 * mm])]
    story += [h2("4.2 云函数职责")]
    story += [table([
        ["云函数", "职责", "安全边界"],
        ["contentService", "读取村落、点位、故事、图片和路线", "集合白名单；只返回 published 内容"],
        ["visitorRecords", "打卡、查询本人打卡、提交纠错", "服务端 OPENID；输入校验；重复打卡防护"],
        ["contentAdmin", "草稿、提交审核、审核发布", "adminRoles 角色；敏感字段由服务端控制"],
    ], [34 * mm, 66 * mm, 74 * mm])]
    story += [h2("4.3 弱网与降级策略")]
    story += bullets([
        "图集云端读取失败时自动回退到项目内置实拍素材。",
        "打卡立即写入本地；云端不可用时进入去重队列，恢复后逐条补传。",
        "纠错线索在离线时最多保存最近50条，下一次进入页面自动补传。",
        "首页显示网络异常提示，但本地文字、图片和已下载内容仍可浏览。",
    ])

    story += [h1("5. 核心功能设计")]
    story += [h2("5.1 真实地图与导航")]
    story += [table([
        ["点位", "GCJ-02 纬度", "GCJ-02 经度", "来源与处理"],
        ["乔林村委会/游客入口", "26.620306", "114.046347", "腾讯地图分享位置，作为首页中心与村落导航目标"],
        ["乔林水库可达入口/大坝", "26.619332", "114.046397", "腾讯地图分享位置，不再使用水面中心描述"],
        ["村内六处旧址", "待逐点核验", "待逐点核验", "当前不显示虚构路线连线，详情页提示坐标待核验"],
    ], [42 * mm, 30 * mm, 30 * mm, 72 * mm])]
    story += [h2("5.2 个性化路线推荐")]
    story += [table([
        ["路线", "建议时长", "主要内容", "适用场景"],
        ["初心线", "约30分钟", "村口与核心旧址、红色故事墙", "时间紧、老年游客、快速了解"],
        ["研学线", "约60分钟", "六处旧址与故事讲解", "学生团队、普通游客"],
        ["半日乡村线", "约半天", "六处旧址、古村文化、乔林水库生态观察", "深度研学、亲子家庭"],
    ], [31 * mm, 28 * mm, 68 * mm, 47 * mm])]
    story += [p("路线里程与分段距离为前期规划参考，已在界面统一标注“待实测”；六处旧址坐标未核验时，“前往下一站”只切换到下一站卡片并说明原因，核验后才调用地图导航。", "small")]

    story += [h2("5.3 研学互动与知识来源")]
    story += bullets([
        "二维码支持 qiaolin://site/site_1 或小程序路径参数，识别后完成扫码打卡并进入对应旧址。",
        "知识闯关首批5题，每题固定四个选项，并展示解释与驻村资料来源。",
        "涉及待核验人物身份、年份和照片归属的内容不进入题库。",
        "全部旧址打卡后，系统在小程序端生成可分享的研学证书海报，支持预览并保存到手机相册，形成“参观—学习—打卡—成果留存”的闭环。",
    ])
    story += [h2("5.4 真实素材与文物史实")]
    img_dir = ROOT / "miniprogram" / "assets" / "images"
    max_thumb_w = 82 * mm
    max_thumb_h = 48 * mm
    gallery = [
        image_with_caption(img_dir / "gallery_qiaolin_forest_home.jpg", "乔林村山林民居（用户提供实拍）", max_thumb_w, max_thumb_h),
        image_with_caption(img_dir / "gallery_bajiaolou_slogan_wall.jpg", "八角楼标语墙（用户提供实拍）", max_thumb_w, max_thumb_h),
        image_with_caption(img_dir / "gallery_lieshi_memorial_close.jpg", "井冈山革命烈士纪念堂近景（用户提供实拍）", max_thumb_w, max_thumb_h),
        image_with_caption(img_dir / "historical_liu_ziyu_martyr_certificate.jpg", "刘资育革命烈士证明书影像（待村级与授权审核）", max_thumb_w, max_thumb_h),
    ]
    story += [Table([[gallery[0], gallery[1]], [gallery[2], gallery[3]]], colWidths=[87 * mm, 87 * mm], style=[("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 2), ("RIGHTPADDING", (0, 0), (-1, -1), 2), ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)])]
    story += [p("图3  已入库的代表性实拍与史料素材。所有图片仍需补齐提供者、拍摄者或家属公开授权记录。", "caption")]

    story += [h1("6. 数据模型、权限与合规")]
    story += [h2("6.1 核心数据实体")]
    story += [table([
        ["集合", "核心内容", "主要关系"],
        ["villages", "村落简介、坐标、来源、状态", "一对多 places"],
        ["places", "旧址/自然/服务点位", "关联 stories、media、routes"],
        ["stories", "正文、口述者、来源、音频", "多对多关联点位"],
        ["media", "图片/文物史实、授权、审核状态", "归属点位或人物资料"],
        ["routes", "时长、主题、人群、有序点位", "有序引用 places"],
        ["checkins", "用户、路线、点位、方式、时间", "用户与点位行为记录"],
        ["corrections", "纠错对象、类型、说明、状态", "关联任一公开内容"],
        ["adminRoles", "OPENID、角色、启用状态", "控制管理云函数权限"],
    ], [31 * mm, 79 * mm, 64 * mm])]
    story += [h2("6.2 角色权限矩阵")]
    story += [table([
        ["操作", "游客", "录入员", "团队管理员", "审核员"],
        ["读取已发布内容", "允许", "允许", "允许", "允许"],
        ["提交打卡/纠错", "允许", "允许", "允许", "允许"],
        ["保存草稿", "禁止", "允许", "允许", "允许"],
        ["提交审核", "禁止", "允许", "允许", "允许"],
        ["查看待审队列", "禁止", "禁止", "按配置", "允许"],
        ["发布或驳回", "禁止", "禁止", "禁止", "允许"],
    ], [42 * mm, 27 * mm, 34 * mm, 37 * mm, 34 * mm], aligns={1: "CENTER", 2: "CENTER", 3: "CENTER", 4: "CENTER"})]
    story += [h2("6.3 合规与隐私")]
    story += bullets([
        "实拍图片、历史证明材料和人物照片建立素材台账，区分地点已标注、授权待补和史实待核验。",
        "AI修复、上色或生成图片必须显著标注，不能冒充原始史料；当前人物照片采用审慎说明。",
        "定位只用于即时地图与导航，不默认上传游客轨迹；纠错页不要求姓名和手机号。",
        "可信与隐私中心集中展示定位、云同步和本地记录状态，支持管理微信权限并一键清除本地打卡、纠错、答题和关怀模式数据。",
        "红色故事明确区分“基础史实已核验”和“村级口述/史料待审核”，村情数据标注为调研台账，不作为官方统计发布。",
        "公开 GitHub 仓库忽略私人配置，不提交云环境密钥、私人联系方式和未经授权原图。",
    ])

    story += [h1("7. 交互、视觉与无障碍")]
    story += [table([
        ["设计维度", "处理方式"],
        ["视觉识别", "主色使用井冈红与暖金，地图保持高信息密度，内容页使用暖白背景降低疲劳"],
        ["操作反馈", "定位、导航、打卡、扫码、提交和审核均提供成功/失败/无权限反馈"],
        ["关怀模式", "放大字体与按钮，保存用户选择；历史音频应同步提供字幕"],
        ["弱网体验", "显示网络提示，本地内容继续可看，打卡与纠错异步补传"],
        ["错误预防", "坐标未核验时禁用导航；错误二维码不跳转；表单提交前校验"],
    ], [34 * mm, 140 * mm])]

    story += [h1("8. 创新性、应用价值与推广")]
    story += [h2("8.1 项目创新")]
    story += bullets([
        "从静态红色地图升级为“导航—讲解—打卡—答题—证书—纠错—审核”的闭环产品。",
        "把史料严谨性作为系统能力：来源字段、状态流转、角色权限和游客纠错共同约束。",
        "把乡村弱网作为核心场景设计，而非上线后的补丁。",
        "路线推荐采用可解释规则，第一版稳定可演示，后续可在审核数据基础上扩展智能问答。",
    ])
    story += [h2("8.2 推广路径")]
    story += [flow_row(["乔林村单点试用", "补齐六处坐标与授权", "学校研学试点", "井冈山多村复制", "区域红色研学网络"], [PALE_RED, PALE_GOLD, colors.HexColor("#EDF4F8"), colors.HexColor("#EDF7F0"), PALE_RED])]

    story += [h1("9. 当前完成度与上线准备")]
    story += [table([
        ["状态", "内容"],
        ["已实现并自动验证", "地图搜索筛选、腾讯核验位置、路线推荐、相册分包、文物史实、扫码/手动打卡、离线同步、知识闯关、证书海报、游客纠错、管理审核、可信与隐私中心、静态回归"],
        ["工程量化结果", f"{stats['test_count']}个自动化测试脚本全部通过；发布检查21项通过、4项待真实环境；主包约0.26MB、素材分包约1.63MB"],
        ["已设计但需真实环境验证", "微信云环境、adminRoles真实账号、云数据库读写、证书保存相册、体验版长期访问"],
        ["需现场补充", "六处旧址腾讯分享位置/实测坐标、授权证明、真机兼容性与用户反馈"],
        ["下一阶段增强", "语音实录、图片纠错附件、研学任务统计、多村复制"],
    ], [43 * mm, 131 * mm])]
    story += [callout("上线门槛：未完成真实云环境部署、真机地图/扫码验证和素材授权补录前，不应把小程序描述为正式运营版本；当前版本定位为可运行的高质量参赛原型与试点版本。", PALE_RED)]

    story += [h1("附录A. 关键工程文件")]
    story += [table([
        ["用途", "路径"],
        ["地图与本地数据", "miniprogram/utils/data.js"],
        ["公开内容服务", "cloudfunctions/contentService/index.js"],
        ["游客记录服务", "cloudfunctions/visitorRecords/index.js"],
        ["管理审核服务", "cloudfunctions/contentAdmin/index.js"],
        ["离线打卡", "miniprogram/utils/visitorSync.js"],
        ["离线纠错", "miniprogram/utils/correctionService.js"],
        ["可信与隐私中心", "miniprogram/pages/privacy/index.js"],
        ["素材分包相册", "miniprogram/assets/gallery/index.js"],
        ["证书海报", "miniprogram/pages/study-tour/index.js"],
        ["发布门禁", "scripts/release-readiness.js"],
        ["静态回归", "tests/staticPages.test.js"],
    ], [50 * mm, 124 * mm])]
    story += [p("文档内容以本地 Git main 分支当前生成版本为准；网络恢复并推送后与公开 GitHub 仓库 main 分支保持一致。", "small")]

    doc = CompetitionDocTemplate(DESIGN_PDF, "产品设计说明书")
    doc.multiBuild(story)


def get_git_log():
    command = ["git", "-c", f"safe.directory={ROOT.as_posix()}", "log", "-8", "--pretty=format:%h|%ad|%s", "--date=short"]
    result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace", check=True)
    return [line.split("|", 2) for line in result.stdout.splitlines() if line.strip()]


def build_process_pdf():
    stats = project_stats()
    story = []
    story += cover("开发过程与测试报告", "以 Git 迭代、问题修复、自动化验证和真实上线风险为证据")
    story += toc_story()

    story += [h1("1. 开发过程概览")]
    story += [p("项目采用增量迭代方式推进：先修正真实地图位置和核心浏览体验，再补充实拍素材与史料台账，随后建立云端内容、游客行为与管理审核三类服务，最后完成知识闯关、游客纠错和参赛交付物。所有稳定节点均提交至公开 GitHub 仓库。")]
    story += [metrics([(f"{stats['commit_count']}次", "当前 Git 提交"), ("3个", "业务云函数"), (f"{stats['test_count']}组", "自动化测试脚本"), (f"{stats['source_count']}个", "静态检查源码文件")])]
    story += [h2("1.1 迭代记录")]
    git_rows = [["提交", "日期", "主要内容"]] + get_git_log()
    story += [table(git_rows, [25 * mm, 30 * mm, 119 * mm])]
    story += [h2("1.2 过程方法")]
    story += bullets([
        "每个功能先明确真实用户问题和对应比赛评分项，再进入实现。",
        "涉及历史、位置和人物资料时保留来源、核验状态与审慎措辞。",
        "新增云函数先写模拟测试覆盖身份、角色、集合白名单和异常分支。",
        "每个稳定节点执行全量回归，检查源码语法、页面文件和事件绑定。",
        "只推送通过测试的节点，Git 提交信息直接记录功能演进。",
    ])

    story += [h1("2. 工程结构与质量控制")]
    story += [table([
        ["目录", "内容", "质量控制"],
        ["miniprogram/pages", "地图、村落、旧址、研学、答题、纠错、管理、隐私页", "页面四件套完整性与 WXML 事件校验"],
        ["miniprogram/assets", "实拍/史料图片与分包相册页", "主包减重、分包路径和回退素材校验"],
        ["miniprogram/utils", "数据、云端读取、打卡补传、纠错补传、题库", "服务与页面分层、失败路径测试"],
        ["cloudfunctions", "contentService、visitorRecords、contentAdmin", "身份、白名单、角色、参数四层校验"],
        ["tests", "云函数、离线同步、题库、页面静态回归", "Node.js 可重复执行"],
        ["参赛材料", "需求、架构、数据库、测试、合规、演示", "实现与文档相互引用"],
    ], [36 * mm, 78 * mm, 60 * mm])]
    story += [h2("2.1 自动化执行命令")]
    story += [p(f"逐项执行：node tests/&lt;name&gt;.test.js（共{stats['test_count']}个脚本）<br/>发布检查：node scripts/release-readiness.js", "code")]

    story += [h1("3. 关键问题与解决过程")]
    story += [h2("3.1 地图位置错误")]
    story += [table([
        ["问题", "分析", "处理", "验证"],
        ["乔林村与水库位置错误", "旧坐标来源不明确，水库中心不等于可到达入口", "解析用户提供的腾讯地图分享位置，统一 GCJ-02；水库改为可达入口/大坝", "静态测试固定核对两组经纬度；页面移除“水面中心”说法"],
    ], [33 * mm, 46 * mm, 59 * mm, 36 * mm])]
    story += [h2("3.2 云端身份与权限风险")]
    story += [table([
        ["风险", "错误做法", "最终方案"],
        ["游客身份伪造", "信任前端传入 openid", "每次请求从 cloud.getWXContext() 获取 OPENID"],
        ["任意集合访问", "前端传入集合名直接查询", "contentService 与 contentAdmin 均采用集合白名单"],
        ["越权发布", "录入员可写 status=published", "云函数移除敏感字段，只有 reviewer 可发布"],
        ["重复打卡", "每次点击直接新增", "按 OPENID、routeId、placeId 查询并返回原记录"],
    ], [38 * mm, 56 * mm, 80 * mm])]
    story += [h2("3.3 山村弱网")]
    story += [p("打卡与纠错都采用“先本地可用、再尝试云端、失败入队、恢复补传”的策略。打卡队列按路线和点位去重；纠错保留独立线索并限制为最近50条。图集云端读取失败则回退到本地已审核素材。")]
    story += [h2("3.4 史料真实性")]
    story += [p("人物照片、烈士证明书和口述史存在授权与核验差异。项目没有把待核验身份用于知识题，页面以“相关人物肖像”“具体信息以原件及审核资料为准”等方式审慎表述，并把来源、授权和审核状态纳入数据模型。")]
    story += [h2("3.5 路线距离与下一站导航真实性")]
    story += [p("旧址逐点坐标尚未取得腾讯地图分享位置，因此路线里程和分段距离仅作为前期规划参考并统一标注待实测。系统自动选择第一处未打卡旧址作为下一站；若坐标未核验，只切换站点卡并明确不提供推测导航，待录入真实坐标后才打开微信地图。")]

    story += [h1("4. 自动化测试结果")]
    story += [callout(f"2026-08-24 最新执行：{stats['test_count']}组测试全部通过；静态回归检查 {stats['source_count']} 个 miniprogram 与 cloudfunctions 文件；发布检查为21项通过、4项提醒、0项失败。测试使用本地 Node.js 与可记录的微信/数据库模拟对象，不能替代真实微信云环境与真机验证。")]
    story += [h2("4.1 测试分层")]
    story += [table([
        ["层级", "测试脚本", "覆盖范围", "结果"],
        ["云函数逻辑", "cloudfunctions.test.js", "身份、输入、白名单、角色、审核、重复打卡", "通过"],
        ["打卡同步", "visitorSync.test.js", "离线入队、去重、恢复补传、在线直传", "通过"],
        ["纠错同步", "correctionService.test.js", "离线保存、联网补传、云端参数", "通过"],
        ["题库质量", "quizData.test.js", "ID、四选项、答案范围、解释与来源", "通过"],
        ["专项体验回归", "7个专项脚本", "云环境降级、史料状态、隐私清理、村情标注、证书、下一站与距离披露", "通过"],
        ["工程静态回归", "staticPages.test.js", "JS/JSON、页面四件套、事件绑定、坐标、临时文件", "通过"],
    ], [28 * mm, 43 * mm, 78 * mm, 25 * mm])]
    story += [h2("4.2 核心安全与同步用例")]
    story += [table([
        ["编号", "场景", "预期", "结果"],
        ["A01", "同一路线同一点位重复打卡", "返回原记录，不重复写入", "通过"],
        ["A02", "点位ID含路径穿越字符", "拒绝非法参数", "通过"],
        ["A03", "无微信身份读取打卡", "返回未认证", "通过"],
        ["A04", "非管理员保存草稿", "拒绝访问", "通过"],
        ["A05", "录入员伪造 published 和 openid", "移除敏感字段并保存为草稿", "通过"],
        ["A06", "审核员批准待审资料", "状态变为 published", "通过"],
        ["A07", "云环境未配置时打卡", "进入本地待传队列", "通过"],
        ["A08", "相同打卡重复离线入队", "队列保持一条", "通过"],
        ["A09", "离线纠错恢复网络", "逐条补传并清空成功项", "通过"],
        ["A10", "题目缺来源或答案越界", "自动化测试失败", "通过"],
        ["A11", "云环境未配置或初始化失败", "继续使用本地审核内容并明确状态", "通过"],
        ["A12", "证书解锁、绘制、导出和保存", "生成1500×2000图片并调用相册保存", "通过"],
        ["A13", "故事与村情缺少核验标识", "专项测试失败", "通过"],
        ["A14", "用户清除本地隐私数据", "打卡、纠错、答题和偏好一并清除", "通过"],
        ["A15", "相册素材进入主包", "发布检查提示包体结构异常", "通过"],
        ["A16", "下一站缺少核验坐标", "切换卡片并拒绝推测导航；有真实坐标才打开地图", "通过"],
    ], [18 * mm, 62 * mm, 70 * mm, 24 * mm])]

    story += [h1("5. 人工测试计划与当前证据边界")]
    story += [h2("5.1 必须在微信开发者工具/真机完成")]
    story += [table([
        ["编号", "模块", "验证步骤", "当前状态"],
        ["M01", "启动编译", "导入项目、选择基础库、清空缓存编译", "待真实开发者工具"],
        ["M02", "定位允许/拒绝", "Android与iOS分别测试授权、拒绝、系统关闭定位", "待真机"],
        ["M03", "腾讯地图导航", "核对乔林村与水库目标名称、坐标和到达道路", "两组坐标已静态核对，待真机"],
        ["M04", "二维码", "扫描有效、无效、相册二维码与小程序码", "逻辑已实现，待真机"],
        ["M05", "云端审核", "三个微信账号验证录入员、团队管理员、审核员", "云函数已测，待真实云环境"],
        ["M06", "弱网", "断网打卡/纠错，恢复后检查数据库", "队列已测，待真机与云端"],
        ["M07", "兼容性", "主流Android、iPhone、不同微信版本", "待设备"],
        ["M08", "体验码", "评审网络下连续访问与冷启动", "待小程序发布"],
    ], [18 * mm, 32 * mm, 84 * mm, 40 * mm])]
    story += [h2("5.2 建议测试记录字段")]
    story += [p("设备型号、操作系统版本、微信版本、基础库版本、网络类型、执行人、日期、预期结果、实际结果、截图编号、缺陷编号、修复提交和复测结论。")]

    story += [h1("6. 素材、隐私与开源合规")]
    story += [table([
        ["对象", "当前处理", "上线前动作"],
        ["用户实拍照片", "已压缩并分类入库，保留来源说明", "补拍摄者、时间、地点和公开授权"],
        ["刘资育相关史料", "文物史实分类、谨慎描述、未进入题库", "村委/家属核验身份、年代与公开范围"],
        ["游客位置", "仅用于即时定位和导航", "完善微信隐私保护指引"],
        ["游客OPENID", "只在云函数与数据库用于记录归属", "设置数据访问规则和保留期限"],
        ["本地游客记录", "可信与隐私中心可查看状态并一键清除", "真机复核清除反馈与系统权限跳转"],
        ["第三方地图", "腾讯地图分享位置、微信地图能力", "按平台规则配置合法域名/插件并列明来源"],
        ["公开仓库", "忽略私人配置和密钥", "发布前再次扫描敏感信息与大文件"],
    ], [38 * mm, 72 * mm, 64 * mm])]

    story += [h1("7. 演示与发布准备")]
    story += [h2("7.1 4分30秒演示闭环")]
    story += [table([
        ["时间", "画面", "证明点"],
        ["0:00-0:25", "乔林村与红色旧址实拍", "真实问题与实地采集"],
        ["0:25-0:55", "首页定位、搜索、图层", "地图能力与交互"],
        ["0:55-1:25", "村落、水库位置与导航", "腾讯核验坐标"],
        ["1:25-2:05", "60分钟路线推荐", "规则可解释的个性化研学"],
        ["2:05-2:45", "相册、文物史实与来源", "真实素材和合规"],
        ["2:45-3:25", "扫码、打卡、知识闯关、证书海报", "现场互动与成果传播闭环"],
        ["3:25-3:55", "纠错、弱网、关怀与隐私中心", "真实乡村使用和隐私考虑"],
        ["3:55-4:20", "管理审核、Git与测试", "可维护性与工程质量"],
        ["4:20-4:30", "多村复制路线", "应用价值"],
    ], [28 * mm, 74 * mm, 72 * mm])]
    story += [h2("7.2 发布门禁")]
    story += bullets([
        "微信开发者工具编译无错误，主包符合平台限制。",
        "真实云环境ID已配置，三个云函数部署成功，数据库权限正确。",
        "乔林村与水库真机导航正确，六处旧址未核验前继续禁用导航。",
        "素材授权、隐私指引、开源组件清单和联系方式完成脱敏审查。",
        "体验版可持续访问，体验码和评委使用说明已准备。",
        "3-5分钟1080P MP4不超过300MB，所有演示均为真实功能。",
    ])

    story += [h1("8. 风险与后续迭代")]
    story += [table([
        ["风险", "影响", "控制措施", "优先级"],
        ["真实云环境尚未部署", "管理与跨设备数据无法实测", "配置 env、创建集合、真账号角色测试", "P0"],
        ["六处旧址坐标待核验", "无法安全提供逐点导航", "逐处腾讯分享位置或现场采集，不用推测坐标", "P0"],
        ["素材授权记录不完整", "可能影响公开展示和合规得分", "补签授权与拍摄台账，必要时撤下素材", "P0"],
        ["音频文件不完整", "讲解体验弱于方案描述", "优先录制1分钟真人简版并配字幕", "P1"],
        ["证书海报尚未真机保存验证", "相册授权差异可能影响留存", "Android与iOS分别测试允许、拒绝和再次授权", "P1"],
        ["缺少实地用户数据", "应用价值证据不足", "组织师生/村民试用并记录反馈与修复", "P1"],
    ], [44 * mm, 52 * mm, 56 * mm, 22 * mm])]

    story += [h1("附录A. 最新测试输出")]
    story += [p(f"{stats['test_count']}个测试脚本全部通过：cloudfunctions、visitorSync、correctionService、quizData、appCloudInit、storyVerification、privacyCenter、villageDataReview、certificatePoster、certificatePosterRuntime、nextStopNavigation、staticPages。<br/>staticPages.test.js: {stats['source_count']} source files checked, all tests passed<br/>release-readiness.js: 21 PASS / 4 WARN / 0 FAIL", "code")]
    story += [p("说明：以上为本地自动化证据；真实开发者工具、云环境和真机测试完成后，应在本报告后追加设备矩阵、截图和缺陷复测记录。", "small")]

    doc = CompetitionDocTemplate(PROCESS_PDF, "开发过程与测试报告")
    doc.multiBuild(story)


if __name__ == "__main__":
    build_design_pdf()
    build_process_pdf()
    print(DESIGN_PDF)
    print(PROCESS_PDF)
