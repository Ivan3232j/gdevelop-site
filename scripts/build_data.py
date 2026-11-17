#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт генерации js/lessons-data.js из оригинальных Markdown файлов курса по GDevelop.
Сохраняет 100% оригинальный текст без единого изменения, а также структурирует данные для
интерактивных элементов сайта (чек-листы, таймлайн, база частых ошибок, быстрые задания).
"""

import os
import re
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LESSONS_DIR = os.path.join(BASE_DIR, "lessons")

LESSONS_CONFIG = [
    {
        "id": "standard",
        "category": "methodology",
        "moduleId": "standard",
        "moduleTitle": "Стандарт и методология разработки курсов",
        "moduleShort": "Стандарт курса",
        "lessonNum": 0,
        "title": "Стандарт и методология разработки курсов по GDevelop",
        "shortTitle": "Методология и стандарт курса",
        "topic": "Стандарт разработки курсов",
        "path": "standard/standard.md"
    },
    {
        "id": "m2-1",
        "category": "m2",
        "moduleId": "m2",
        "moduleTitle": "Модуль 2: 2D Раннер",
        "moduleShort": "2D Раннер",
        "lessonNum": 1,
        "title": "Раннер · Урок 1: Бесконечная дорога и три полосы",
        "shortTitle": "Урок 1: Бесконечная дорога и три полосы",
        "topic": "Бесконечная дорога и три полосы",
        "path": "m2/lesson-1.md"
    },
    {
        "id": "m2-2",
        "category": "m2",
        "moduleId": "m2",
        "moduleTitle": "Модуль 2: 2D Раннер",
        "moduleShort": "2D Раннер",
        "lessonNum": 2,
        "title": "Раннер · Урок 2: Препятствия",
        "shortTitle": "Урок 2: Препятствия",
        "topic": "Препятствия",
        "path": "m2/lesson-2.md"
    },
    {
        "id": "m2-3",
        "category": "m2",
        "moduleId": "m2",
        "moduleTitle": "Модуль 2: 2D Раннер",
        "moduleShort": "2D Раннер",
        "lessonNum": 3,
        "title": "Раннер · Урок 3: Монеты, счёт и рекорд",
        "shortTitle": "Урок 3: Монеты, счёт и рекорд",
        "topic": "Монеты, счёт и рекорд",
        "path": "m2/lesson-3.md"
    },
    {
        "id": "m2-4",
        "category": "m2",
        "moduleId": "m2",
        "moduleTitle": "Модуль 2: 2D Раннер",
        "moduleShort": "2D Раннер",
        "lessonNum": 4,
        "title": "Раннер · Урок 4: Прыжок, проигрыш и ускорение",
        "shortTitle": "Урок 4: Прыжок, проигрыш и ускорение",
        "topic": "Прыжок, проигрыш и ускорение",
        "path": "m2/lesson-4.md"
    },
    {
        "id": "m2-5",
        "category": "m2",
        "moduleId": "m2",
        "moduleTitle": "Модуль 2: 2D Раннер",
        "moduleShort": "2D Раннер",
        "lessonNum": 5,
        "title": "Раннер · Урок 5: Сочность и публикация",
        "shortTitle": "Урок 5: Сочность и публикация",
        "topic": "Сочность и публикация",
        "path": "m2/lesson-5.md"
    },
    {
        "id": "m3-1",
        "category": "m3",
        "moduleId": "m3",
        "moduleTitle": "Модуль 3: Топдаун Шутер",
        "moduleShort": "Топдаун Шутер",
        "lessonNum": 1,
        "title": "Топдаун Шутер · Урок 1: Движение, прицеливание и камера",
        "shortTitle": "Урок 1: Движение, прицеливание и камера",
        "topic": "Движение, прицеливание и камера",
        "path": "m3/lesson-1.md"
    },
    {
        "id": "m3-2",
        "category": "m3",
        "moduleId": "m3",
        "moduleTitle": "Модуль 3: Топдаун Шутер",
        "moduleShort": "Топдаун Шутер",
        "lessonNum": 2,
        "title": "Топдаун Шутер · Урок 2: Стрельба и снаряды",
        "shortTitle": "Урок 2: Стрельба и снаряды",
        "topic": "Стрельба и снаряды",
        "path": "m3/lesson-2.md"
    },
    {
        "id": "m3-3",
        "category": "m3",
        "moduleId": "m3",
        "moduleTitle": "Модуль 3: Топдаун Шутер",
        "moduleShort": "Топдаун Шутер",
        "lessonNum": 3,
        "title": "Топдаун Шутер · Урок 3: Враги и здоровье",
        "shortTitle": "Урок 3: Враги и здоровье",
        "topic": "Враги и здоровье",
        "path": "m3/lesson-3.md"
    },
    {
        "id": "m3-4",
        "category": "m3",
        "moduleId": "m3",
        "moduleTitle": "Модуль 3: Топдаун Шутер",
        "moduleShort": "Топдаун Шутер",
        "lessonNum": 4,
        "title": "Топдаун Шутер · Урок 4: Интерфейс, урон и Game Over",
        "shortTitle": "Урок 4: Интерфейс, урон и Game Over",
        "topic": "Интерфейс, урон и Game Over",
        "path": "m3/lesson-4.md"
    },
    {
        "id": "m3-5",
        "category": "m3",
        "moduleId": "m3",
        "moduleTitle": "Модуль 3: Топдаун Шутер",
        "moduleShort": "Топдаун Шутер",
        "lessonNum": 5,
        "title": "Топдаун Шутер · Урок 5: Сочность, спецэффекты и публикация",
        "shortTitle": "Урок 5: Сочность, спецэффекты и публикация",
        "topic": "Сочность, спецэффекты и публикация",
        "path": "m3/lesson-5.md"
    }
]

def build():
    all_errors = []
    processed_lessons = []

    for cfg in LESSONS_CONFIG:
        file_path = os.path.join(LESSONS_DIR, cfg["path"])
        with open(file_path, "r", encoding="utf-8") as f:
            raw = f.read()

        lesson_data = dict(cfg)
        lesson_data["rawMarkdown"] = raw

        if cfg["category"] == "methodology":
            lesson_data["date"] = "Nov 2026"
            lesson_data["author"] = "@Иван Денисов"
            lesson_data["goalSummary"] = "Стандарт разработки учебных программ, модулей и поурочных планов по визуальному движку GDevelop 5 для детей и подростков."
            lesson_data["timings"] = []
            lesson_data["errors"] = []
            lesson_data["checklist"] = []
            lesson_data["challenges"] = []
            lesson_data["sources"] = []
            processed_lessons.append(lesson_data)
            continue

        # Date and Author
        dm = re.search(r"^([A-Za-z]{3}\s+\d{1,2},\s+\d{4})\s*·\s*(@[^\n]+)", raw, re.M)
        lesson_data["date"] = dm.group(1).strip() if dm else ""
        lesson_data["author"] = dm.group(2).strip() if dm else "@Иван Денисов"

        # Goal Summary
        gm = re.search(r"## Цель и подготовка\s*\n\s*(.+?)(?=\n\n|\n\*)", raw, re.S)
        lesson_data["goalSummary"] = gm.group(1).strip().replace("\n", " ") if gm else ""

        # Main Idea
        im = re.search(r"\*\*Главная идея урока для детей:\*\*\s*(.+?)(?=\n\n|\n\*)", raw, re.S)
        lesson_data["mainIdea"] = im.group(1).strip() if im else ""

        # New Concepts
        cm = re.search(r"\*\*Новые понятия:\*\*\s*(.+?)(?=\n\n|\n\*)", raw, re.S)
        lesson_data["newConcepts"] = cm.group(1).strip() if cm else ""

        # Teacher prep
        pm = re.search(r"\*\*Подготовить заранее:\*\*\s*\n((?:- \[ \].*\n?)+)", raw)
        if pm:
            lesson_data["teacherPrep"] = [l.replace("- [ ]", "").strip() for l in pm.group(1).strip().splitlines() if l.strip()]
        else:
            lesson_data["teacherPrep"] = []

        # Timings
        tm = re.search(r"## Тайминг 90 минут\s*\n\s*(?:.*?\n)?\s*\|[^\n]+\|\s*\n\s*\|[^\n]+\|\s*\n((?:\|[^\n]+\|\s*\n?)+)", raw)
        timings = []
        if tm:
            for line in tm.group(1).strip().splitlines():
                cols = [c.strip() for c in line.split("|")[1:-1]]
                if len(cols) >= 3:
                    timings.append({"time": cols[0], "block": cols[1], "activity": cols[2]})
        lesson_data["timings"] = timings

        # Errors
        em = re.search(r"## Частые ошибки и быстрые решения\s*\n\s*\|[^\n]+\|\s*\n\s*\|[^\n]+\|\s*\n((?:\|[^\n]+\|\s*\n)+)", raw)
        errors = []
        if em:
            for line in em.group(1).strip().splitlines():
                cols = [c.strip() for c in line.split("|")[1:-1]]
                if len(cols) >= 3:
                    err_idx = len(errors) + 1
                    err_id = f"{cfg['id']}-err-{err_idx}"
                    err_obj = {
                        "id": err_id,
                        "lessonId": cfg["id"],
                        "lessonTitle": cfg["shortTitle"],
                        "moduleId": cfg["moduleId"],
                        "moduleTitle": cfg["moduleTitle"],
                        "symptom": cols[0],
                        "cause": cols[1],
                        "solution": cols[2]
                    }
                    errors.append(err_obj)
                    all_errors.append(err_obj)
        lesson_data["errors"] = errors

        # Checklist
        chkm = re.search(r"\*\*(?:Урок|Модуль) (?:пройден|завершен), если у ребёнка:\*\*\s*\n((?:- \[ \].*\n?)+)", raw)
        if chkm:
            lesson_data["checklist"] = [l.replace("- [ ]", "").strip() for l in chkm.group(1).strip().splitlines() if l.strip()]
        else:
            lesson_data["checklist"] = []

        # Challenges
        chal_m = re.search(r"\*\*Задания для быстрых [^:]*:\*\*\s*\n((?:\d+\..*?(?=\n\n|\n\*\*|\Z)))", raw, re.S)
        challenges = []
        if chal_m:
            raw_challenges = re.split(r"\n(?=\d+\.)", chal_m.group(1).strip())
            for rc in raw_challenges:
                nm = re.match(r"^(\d+)\.\s*(.*)", rc, re.S)
                if nm:
                    challenges.append({"num": int(nm.group(1)), "text": nm.group(2).strip()})
        lesson_data["challenges"] = challenges

        # Sources
        sm = re.search(r"\*\*Источники \(официальная документация GDevelop\):\*\*\s*(.+)$", raw, re.M)
        sources = []
        if sm:
            links = re.findall(r"\[(.*?)\]\((.*?)\)", sm.group(1))
            for lt, lu in links:
                sources.append({"title": lt, "url": lu})
        lesson_data["sources"] = sources

        processed_lessons.append(lesson_data)

    data_bundle = {
        "author": "Иван Денисов",
        "updatedAt": "2026-11-17",
        "courseTitle": "Курс разработки игр на GDevelop 5",
        "subtitle": "Поурочные планы, иллюзии механик, разбор ошибок и задания для быстрых",
        "modules": [
            {
                "id": "m2",
                "title": "Модуль 2: 2D Раннер",
                "shortTitle": "2D Раннер",
                "badge": "Subway Surfers стиль",
                "icon": "gamepad-2",
                "color": "#6366f1",
                "lessonsCount": 5,
                "description": "Создаём бесконечный 2D раннер на 3 полосы: иллюзия бегущего мира, процедурные препятствия, монеты, прыжок и физика, таблица рекордов и публикация на gd.games."
            },
            {
                "id": "m3",
                "title": "Модуль 3: Топдаун Шутер",
                "shortTitle": "Топдаун Шутер",
                "badge": "Top-Down Action",
                "icon": "crosshair",
                "color": "#0ea5e9",
                "lessonsCount": 5,
                "description": "Создаём динамичный 2D шутер с видом сверху: Top-Down Movement, прицеливание за мышью, баллистика снарядов, Health-поведение врагов, волны монстров, сочные спецэффекты взрывов и релиз."
            },
            {
                "id": "standard",
                "title": "Методология и стандарт",
                "shortTitle": "Стандарт курса",
                "badge": "Для преподавателя",
                "icon": "book-open",
                "color": "#8b5cf6",
                "lessonsCount": 1,
                "description": "Педагогическая философия («Всё создаём сами», Zero External Assets), стек Piskel + jfxr, хронометраж 90 минут, шаблон урока и правила именования событий."
            }
        ],
        "lessons": processed_lessons,
        "allErrors": all_errors
    }

    output_path = os.path.join(BASE_DIR, "js", "lessons-data.js")
    js_content = "window.GDEV_DATA = " + json.dumps(data_bundle, ensure_ascii=False, indent=2) + ";\n"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(js_content)

    print(f"OK! Generated {output_path}")
    print(f"Total lessons: {len(processed_lessons)}")
    print(f"Total troubleshooting errors: {len(all_errors)}")
    print(f"File size: {os.path.getsize(output_path)} bytes")

if __name__ == "__main__":
    build()
