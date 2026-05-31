#!/usr/bin/env python3
import json
import re
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

COURSE_IDS = {
    'AI User Pro': 'ai-user-pro',
    'AI Content Creator': 'ai-content-creator',
    'No-Code Automation Engineer': 'no-code-automation',
    'AI Chatbot Developer': 'ai-chatbot-developer',
    'AI Voice Agent Developer': 'ai-voice-developer',
    'AI Agent Architect': 'ai-agent-architect',
    'AI Agency Builder': 'ai-agency-builder',
}


def parse_docx(docx_path: Path) -> dict:
    with zipfile.ZipFile(docx_path) as z:
        xml = z.read('word/document.xml').decode('utf-8')

    text = re.sub(r'</w:p>', '\n', xml)
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
    lines = [ln.strip() for ln in text.split('\n') if ln.strip()]

    courses = {}
    current_course = None
    current_week = None
    i = 0

    while i < len(lines):
        ln = lines[i]
        if ln in COURSE_IDS:
            current_course = COURSE_IDS[ln]
            courses[current_course] = {'meta': {}, 'lessons': []}
            current_week = None
            i += 1
            continue

        if current_course:
            if ln.startswith('Цена:'):
                courses[current_course]['meta']['price'] = ln.replace('Цена:', '').strip()
            elif ln.startswith('Количество видео:'):
                courses[current_course]['meta']['videoCount'] = int(
                    ln.replace('Количество видео:', '').strip()
                )
            elif ln.startswith('Длительность видео:'):
                courses[current_course]['meta']['videoDuration'] = ln.replace(
                    'Длительность видео:', ''
                ).strip()
            elif ln.startswith('Итоговый результат:'):
                courses[current_course]['meta']['finalResult'] = ln.replace(
                    'Итоговый результат:', ''
                ).strip()
            elif re.match(r'^Неделя \d+$', ln):
                current_week = int(ln.split()[1])
            elif ln.startswith('Видео '):
                m = re.match(r'^Видео (\d+)\.\s*(.+)$', ln)
                if m:
                    lesson = {
                        'number': int(m.group(1)),
                        'week': current_week or 1,
                        'title': m.group(2).strip(),
                        'duration': '',
                        'goal': '',
                        'topics': '',
                        'demo': '',
                        'tools': '',
                        'result': '',
                        'homework': '',
                        'criteria': '',
                    }
                    j = i + 1
                    while j < len(lines) and not (
                        lines[j].startswith('Видео ')
                        or lines[j] in COURSE_IDS
                        or re.match(r'^Неделя \d+$', lines[j])
                    ):
                        l2 = lines[j]
                        for key, prefix in [
                            ('duration', 'Длительность:'),
                            ('goal', 'Цель урока:'),
                            ('topics', 'Темы урока:'),
                            ('demo', 'Практическая демонстрация:'),
                            ('tools', 'Инструменты:'),
                            ('result', 'Результат урока:'),
                            ('homework', 'Домашнее задание:'),
                            ('criteria', 'Критерии проверки:'),
                        ]:
                            if l2.startswith(prefix):
                                lesson[key] = l2.replace(prefix, '').strip()
                        j += 1
                    courses[current_course]['lessons'].append(lesson)
                    i = j
                    continue
        i += 1

    for data in courses.values():
        by_week = defaultdict(list)
        for lesson in data['lessons']:
            by_week[lesson['week']].append(lesson)

        weeks = []
        for wnum in sorted(by_week.keys()):
            vids = by_week[wnum]
            titles = [v['title'] for v in vids]
            topics = []
            for v in vids:
                topics.extend([t.strip() for t in v.get('topics', '').split(';') if t.strip()])
            weeks.append(
                {
                    'number': wnum,
                    'title': titles[0]
                    if len(titles) == 1
                    else f'{len(vids)} видео',
                    'titleEn': titles[0]
                    if len(titles) == 1
                    else f'{len(vids)} videos',
                    'goal': vids[0].get('goal', ''),
                    'goalEn': vids[0].get('goal', ''),
                    'skills': topics[:8],
                    'skillsEn': topics[:8],
                    'outcome': vids[-1].get('result', ''),
                    'outcomeEn': vids[-1].get('result', ''),
                    'videoTitles': titles,
                }
            )
        data['weeks'] = weeks

    return courses


if __name__ == '__main__':
    docx = Path(sys.argv[1])
    print(json.dumps(parse_docx(docx), ensure_ascii=False))
