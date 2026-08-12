from pathlib import Path
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output" / "pdf"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT = OUT_DIR / "voice-agent-beauty-salon-guide.pdf"
pdfmetrics.registerFont(TTFont("IA", "/System/Library/Fonts/Supplemental/Arial.ttf"))
pdfmetrics.registerFont(TTFont("IA-Bold", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"))

INK, PURPLE, TEAL, MUTED, PAPER = map(HexColor, ["#17131D", "#7838A7", "#0F9F95", "#696171", "#F7F3F9"])
base = getSampleStyleSheet()
title = ParagraphStyle("title", parent=base["Title"], fontName="IA-Bold", fontSize=29, leading=32, textColor=INK, alignment=TA_LEFT, spaceAfter=14)
h1 = ParagraphStyle("h1", parent=base["Heading1"], fontName="IA-Bold", fontSize=20, leading=24, textColor=PURPLE, spaceAfter=11)
h2 = ParagraphStyle("h2", parent=base["Heading2"], fontName="IA-Bold", fontSize=13, leading=17, textColor=INK, spaceBefore=8, spaceAfter=6)
body = ParagraphStyle("body", parent=base["BodyText"], fontName="IA", fontSize=10, leading=15, textColor=INK, spaceAfter=7)
small = ParagraphStyle("small", parent=body, fontSize=8, leading=11, textColor=MUTED)
callout = ParagraphStyle("callout", parent=body, backColor=PAPER, borderColor=HexColor("#D9CCDF"), borderWidth=.7, borderPadding=9, spaceBefore=7, spaceAfter=10)

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(HexColor("#DDD5E1")); canvas.line(18*mm, 15*mm, 192*mm, 15*mm)
    canvas.setFont("IA", 8); canvas.setFillColor(MUTED)
    canvas.drawString(18*mm, 10*mm, "AI Insider Academy · Voice Agent Kit v1.1.0")
    canvas.drawRightString(192*mm, 10*mm, str(doc.page)); canvas.restoreState()

def table(rows, widths):
    t = Table(rows, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), INK), ("TEXTCOLOR", (0,0), (-1,0), HexColor("#FFFFFF")),
        ("FONTNAME", (0,0), (-1,0), "IA-Bold"), ("FONTNAME", (0,1), (-1,-1), "IA"),
        ("FONTSIZE", (0,0), (-1,-1), 8.5), ("LEADING", (0,0), (-1,-1), 11),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [HexColor("#FFFFFF"), PAPER]),
        ("GRID", (0,0), (-1,-1), .4, HexColor("#D9D1DD")), ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("TOPPADDING", (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7),
    ])); return t

story = [
    Paragraph("VOICE AGENT KIT / BEAUTY SALON", small),
    Paragraph("Запись клиентов голосом — без хаоса в календаре", title),
    Paragraph("Production-minded комплект для Vapi, Retell AI и ElevenLabs Conversational AI. Диалоги, инструменты, n8n-workflow, тесты, безопасность, запуск и передача клиенту — в одном архиве.", body),
    Spacer(1, 8),
    table([["Версия", "Лицензия", "Время запуска"], ["1.1.0 · 12.08.2026", "1 коммерческий клиент", "4–8 часов после подключения аккаунтов"]], [55*mm, 60*mm, 60*mm]),
    Spacer(1, 14), Paragraph("Что покупатель получает", h1),
    table([["Блок", "Состав"], ["Agent layer", "3 provider-конфига, system prompt, dialog modules"], ["Automation", "Booking workflow + call summary workflow"], ["Operations", "Quick start, privacy, runbook, rollback, client handoff"], ["Quality", "12 acceptance-сценариев + launch scorecard"], ["Sales", "Discovery questionnaire, scope template, ROI calculator"]], [48*mm, 127*mm]),
    Paragraph("Важно: аккаунты провайдеров, номер телефона, календарь и usage fees не входят. Медицинские консультации, платежи по телефону и экстренные обращения запрещены.", callout),
    PageBreak(), Paragraph("01 · Архитектура", h1),
    Paragraph("Звонок → voice provider → system prompt → tool endpoint → calendar/CRM → подтверждение → redacted summary. Каждый mutating tool требует подтверждение. create_booking защищён idempotency key call_id:slot_id.", body),
    table([["Событие", "Действие", "Fallback"], ["Новый звонок", "Определить язык и намерение", "Оператор при непонимании"], ["Запрос времени", "check_slot", "Не обещать слот при timeout"], ["Подтверждение", "Повторить услугу, дату, цену", "Спросить явное «да»"], ["Запись", "create_booking один раз", "Handoff при конфликте"], ["После звонка", "Минимальный summary", "Редактировать чувствительные данные"]], [43*mm, 78*mm, 54*mm]),
    Paragraph("Провайдеры", h2), Paragraph("Файлы providers/*.json содержат переносимые настройки модели, голоса, latency, interruption policy и tool endpoints. Секреты вынесены в переменные окружения.", body),
    PageBreak(), Paragraph("02 · Запуск за один день", h1),
    table([["Шаг", "Готовность"], ["1. Discovery", "Заполнены услуги, длительность, цены, часы, политика отмены"], ["2. Provider", "Импортирован один provider config; выбран голос и номер"], ["3. Tools", "CALENDAR_API_URL и ключ заданы серверно"], ["4. Workflow", "Импортированы два n8n JSON; webhook защищён secret"], ["5. Tests", "12/12 сценариев пройдены на staging"], ["6. Pilot", "Включены logs, handoff, лимит звонков и rollback owner"]], [35*mm, 140*mm]),
    Paragraph("Go-live gate", h2), Paragraph("Нельзя запускать, если создаётся дубль записи, агент обещает неподтверждённый слот, раскрывает секреты, не переводит сложный звонок человеку или не удаётся отключить автоматику за 10 минут.", callout),
    PageBreak(), Paragraph("03 · Диалог и качество", h1),
    Paragraph("Тон: тёплый, короткий, без канцелярита. Одна реплика — максимум два предложения. Агент задаёт один вопрос за раз, не выдумывает цены и не скрывает, что он AI-ассистент.", body),
    table([["Сценарий", "Ожидаемый результат"], ["Свободный слот", "Одна подтверждённая запись"], ["Слот занят", "До двух реальных альтернатив"], ["Повтор webhook", "Ноль дублей"], ["Calendar timeout", "Handoff, запись не обещана"], ["Перенос/отмена", "Identity check + явное подтверждение"], ["Жалоба/медицинский вопрос", "Без советов; перевод человеку"]], [63*mm, 112*mm]),
    Paragraph("Файлы tests/acceptance-tests.json и tests/launch-scorecard.md дают повторяемую проверку. Результат теста фиксируется с датой, провайдером, версией prompt и ссылкой на redacted transcript.", body),
    PageBreak(), Paragraph("04 · Privacy и безопасность", h1),
    table([["Контроль", "Правило"], ["Секреты", "Только provider secret store / environment variables"], ["PII", "Собирать имя, телефон и данные записи — не больше"], ["Записи звонков", "Только с уведомлением и законным основанием"], ["Logs", "Редакция телефона, токенов и свободного текста"], ["Webhooks", "Signature/secret check, rate limit, replay protection"], ["Доступ", "Least privilege; отдельные staging/production credentials"], ["Retention", "Срок задаёт владелец салона; автоматическое удаление"]], [50*mm, 125*mm]),
    Paragraph("Перед запуском владелец бизнеса проверяет местные правила записи звонков и обработки персональных данных. Kit не заменяет юридическую консультацию.", callout),
    PageBreak(), Paragraph("05 · Эксплуатация и восстановление", h1),
    Paragraph("Каждую неделю: проверка failed calls, latency, handoff rate, booking duplicates и mismatch календаря. После изменения prompt/provider — повторить критические тесты.", body),
    table([["Сигнал", "Порог", "Действие"], ["Tool error rate", "> 3% / 30 мин", "Отключить booking tool; оставить handoff"], ["Duplicate booking", "> 0", "Стоп автоматизации; revoke webhook; расследование"], ["P95 latency", "> 2.5 сек", "Упростить prompt/model; проверить endpoint"], ["Handoff rate", "> 25%", "Разобрать intents и покрытие FAQ"]], [55*mm, 40*mm, 80*mm]),
    Paragraph("Rollback", h2), Paragraph("Отключить входящий номер от агента → revoke provider webhook → вернуть предыдущую версию workflow → проверить ручную линию → сохранить incident log → уведомить владельца. Полная инструкция: docs/04-rollback-recovery.md.", body),
    PageBreak(), Paragraph("06 · Передача клиенту", h1),
    Paragraph("Handoff считается завершённым, когда владелец получил доступы, знает аварийный номер, понимает лимиты, подтвердил retention и прошёл один тестовый звонок сам.", body),
    table([["Материал", "Где лежит"], ["Начало работы", "README.md + docs/01-quick-start.md"], ["Настройки", ".env.example + providers/"], ["Диалоги", "prompts/"], ["Автоматизация", "workflows/"], ["Контроль качества", "tests/"], ["Продажа и расчёт", "sales/"], ["Версии", "CHANGELOG.md + manifest.json"]], [58*mm, 117*mm]),
    Paragraph("Support boundary", h2), Paragraph("Покупатель получает шаблоны и документацию. Индивидуальная интеграция, telephony costs, CRM migration, юридическая проверка и постоянное сопровождение — отдельный scope.", body),
    Spacer(1, 16), Paragraph("AI Insider Academy · Release 1.1.0", small)
]

doc = SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=18*mm, rightMargin=18*mm, topMargin=18*mm, bottomMargin=21*mm, title="Voice Agent Kit: Beauty Salon — Guide", author="AI Insider Academy")
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT)
