from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "marketplace-products/voice-agent-beauty-salon/voice-agent-beauty-salon-preview.pdf"
font = "/System/Library/Fonts/Supplemental/Arial.ttf"
bold = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
pdfmetrics.registerFont(TTFont("AIA", font))
pdfmetrics.registerFont(TTFont("AIA-Bold", bold))

styles = getSampleStyleSheet()
title = ParagraphStyle("Title", parent=styles["Title"], fontName="AIA-Bold", fontSize=31, leading=34, textColor=HexColor("#17131d"), alignment=TA_LEFT, spaceAfter=18)
h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="AIA-Bold", fontSize=18, leading=22, textColor=HexColor("#6d35a5"), spaceBefore=12, spaceAfter=10)
body = ParagraphStyle("Body", parent=styles["BodyText"], fontName="AIA", fontSize=10.5, leading=16, textColor=HexColor("#302b35"), spaceAfter=8)
small = ParagraphStyle("Small", parent=body, fontSize=8.5, leading=12, textColor=HexColor("#716979"))

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("AIA", 8)
    canvas.setFillColor(HexColor("#756d7c"))
    canvas.drawString(42, 28, "AI Insider Academy - Voice Agent Kit v1.0.0")
    canvas.drawRightString(A4[0] - 42, 28, str(doc.page))
    canvas.restoreState()

doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=42, leftMargin=42, topMargin=48, bottomMargin=48)
story = [
    Paragraph("VOICE AGENT KIT / BEAUTY SALON", small),
    Paragraph("Booking agent that can be tested before deployment", title),
    Paragraph("A provider-neutral starter kit for Vapi, Retell and ElevenLabs. Includes dialog policy, calendar tools, privacy defaults, test cases and rollback checklist.", body),
    Spacer(1, 12),
]
data = [["Included", "Proof in package"], ["Agent policy", "agent-config.json"], ["Calendar and handoff tools", "tools.json"], ["Test conversation", "sample-call.txt"], ["Launch and rollback", "deployment-checklist.md"]]
table = Table(data, colWidths=[210, 290])
table.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), HexColor("#17131d")), ("TEXTCOLOR", (0,0), (-1,0), HexColor("#ffffff")), ("FONTNAME", (0,0), (-1,0), "AIA-Bold"), ("FONTNAME", (0,1), (-1,-1), "AIA"), ("FONTSIZE", (0,0), (-1,-1), 9.5), ("GRID", (0,0), (-1,-1), .5, HexColor("#d8d0dd")), ("BACKGROUND", (0,1), (-1,-1), HexColor("#f7f4f9")), ("VALIGN", (0,0), (-1,-1), "MIDDLE"), ("TOPPADDING", (0,0), (-1,-1), 10), ("BOTTOMPADDING", (0,0), (-1,-1), 10)]))
story += [table, Spacer(1, 18), Paragraph("Call flow", h2), Paragraph("1. Disclose recording and identify intent. 2. Collect service and preferred time. 3. Check calendar. 4. Offer up to two alternatives. 5. Repeat booking details and request explicit confirmation. 6. Create one idempotent booking. 7. Send confirmation or transfer to a person.", body), Paragraph("Safety defaults", h2), Paragraph("No medical advice. Minimum data collection. Human handoff for complaints, payment disputes, medical questions and tool failures. API keys stay outside distributed JSON files.", body), PageBreak(), Paragraph("TEST LEDGER", small), Paragraph("Acceptance scenarios", title)]
tests = [["Scenario", "Expected result"], ["Available slot", "One confirmed booking"], ["Occupied slot", "Two alternatives"], ["Duplicate webhook", "No duplicate booking"], ["Calendar timeout", "Human handoff"], ["Medical question", "No advice; handoff"], ["Cancellation", "Explicit confirmation"]]
t2 = Table(tests, colWidths=[190, 310])
t2.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), HexColor("#6d35a5")), ("TEXTCOLOR", (0,0), (-1,0), HexColor("#ffffff")), ("FONTNAME", (0,0), (-1,0), "AIA-Bold"), ("FONTNAME", (0,1), (-1,-1), "AIA"), ("FONTSIZE", (0,0), (-1,-1), 9.5), ("GRID", (0,0), (-1,-1), .5, HexColor("#d8d0dd")), ("ROWBACKGROUNDS", (0,1), (-1,-1), [HexColor("#ffffff"), HexColor("#f7f4f9")]), ("TOPPADDING", (0,0), (-1,-1), 10), ("BOTTOMPADDING", (0,0), (-1,-1), 10)]))
story += [t2, Spacer(1, 20), Paragraph("Release notes", h2), Paragraph("Version 1.0.0 - initial Beauty Salon booking workflow, provider-neutral schemas, privacy defaults and restore checklist. Tested integrations listed as compatible templates; live provider credentials and salon-specific calendar setup are not bundled.", body)]
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT)
