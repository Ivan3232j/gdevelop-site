#!/usr/bin/env bash
# ==============================================================================
# Скрипт подготовки и публикации сайта на GitHub Pages
# ==============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "1. Обновляем данные уроков из Markdown..."
python3 scripts/build_data.py

echo "2. Проверяем наличие ключевых файлов..."
[ -f "index.html" ] || { echo "Ошибка: index.html не найден!"; exit 1; }
[ -f ".nojekyll" ] || touch .nojekyll
[ -f "js/lessons-data.js" ] || { echo "Ошибка: js/lessons-data.js не найден!"; exit 1; }
[ -f "js/marked.min.js" ] || { echo "Ошибка: js/marked.min.js не найден!"; exit 1; }

echo "3. Готово!"
echo "Сайт собран и готов к работе."
echo "Чтобы отправить обновления на GitHub Pages, выполните:"
echo "  git add -A"
echo "  git commit -m 'Обновление материалов курса'"
echo "  git push"
