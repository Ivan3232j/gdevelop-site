/**
 * GDevelop Академия — Интерактивное приложение курса
 * Работает автономно (без сервера и внешних зависимостей), совместимо с GitHub Pages.
 */

(function () {
  'use strict';

  // Безопасная работа с localStorage (защита от приватного режима браузера)
  const storage = {
    getItem: function (key) {
      try { return typeof localStorage !== 'undefined' && localStorage.getItem(key); } catch (e) { return null; }
    },
    setItem: function (key, val) {
      try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, val); } catch (e) {}
    },
    removeItem: function (key) {
      try { if (typeof localStorage !== 'undefined') localStorage.removeItem(key); } catch (e) {}
    },
    keys: function () {
      try { return typeof localStorage !== 'undefined' ? Object.keys(localStorage) : []; } catch (e) { return []; }
    }
  };

  // Состояние приложения
  const state = {
    currentRoute: 'm2-1',
    theme: storage.getItem('gdev_theme') || 'dark',
    searchQuery: '',
    errorFilter: 'all',
    errorSearch: ''
  };

  // Инициализация темы
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('data-theme', state.theme);
  }

  // Доступ к данным
  const data = window.GDEV_DATA;
  if (!data) {
    console.error('Ошибка: данные GDEV_DATA не загружены!');
    return;
  }

  // Кеш элементов DOM
  const elements = {
    sidebarNav: document.getElementById('sidebar-nav'),
    mainContent: document.getElementById('main-content'),
    progressFill: document.getElementById('progress-bar-fill'),
    progressScore: document.getElementById('progress-score-text'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    sidebar: document.getElementById('sidebar'),
    sidebarBackdrop: document.getElementById('sidebar-backdrop'),
    searchModal: document.getElementById('search-modal'),
    searchModalInput: document.getElementById('search-modal-input'),
    searchModalResults: document.getElementById('search-modal-results'),
    searchTriggerBtn: document.getElementById('search-trigger-btn'),
    searchModalClose: document.getElementById('search-modal-close'),
    toast: document.getElementById('toast-msg')
  };

  /**
   * Показать всплывающее уведомление (Toast)
   */
  function showToast(text, duration = 2500) {
    if (!elements.toast) return;
    elements.toast.textContent = text;
    elements.toast.classList.add('show');
    clearTimeout(elements.toast._timer);
    elements.toast._timer = setTimeout(() => {
      elements.toast.classList.remove('show');
    }, duration);
  }

  /**
   * Копирование текста в буфер обмена
   */
  async function copyToClipboard(text, message = 'Скопировано в буфер обмена') {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast(`✓ ${message}`);
    } catch (e) {
      console.warn('Не удалось скопировать:', e);
      showToast('Не удалось скопировать');
    }
  }

  /**
   * Подсчёт общего прогресса ученика (по всем чек-листам)
   */
  function calculateTotalProgress() {
    let totalCriteria = 0;
    let completedCriteria = 0;

    data.lessons.forEach(lesson => {
      if (lesson.checklist && lesson.checklist.length > 0) {
        lesson.checklist.forEach((_, idx) => {
          totalCriteria++;
          const key = `gdev_check_${lesson.id}_${idx}`;
          if (storage.getItem(key) === 'true') {
            completedCriteria++;
          }
        });
      }
    });

    const percent = totalCriteria > 0 ? Math.round((completedCriteria / totalCriteria) * 100) : 0;
    return { total: totalCriteria, completed: completedCriteria, percent };
  }

  /**
   * Обновление индикатора прогресса в сайдбаре
   */
  function updateProgressUI() {
    const { total, completed, percent } = calculateTotalProgress();
    if (elements.progressFill) {
      elements.progressFill.style.width = `${percent}%`;
    }
    if (elements.progressScore) {
      elements.progressScore.textContent = `${completed}/${total} (${percent}%)`;
    }

    // Обновляем галочки у ссылок в сайдбаре
    data.lessons.forEach(lesson => {
      const link = document.querySelector(`.nav-link[data-id="${lesson.id}"]`);
      if (!link) return;
      if (!lesson.checklist || lesson.checklist.length === 0) return;

      const isAllChecked = lesson.checklist.every((_, idx) => {
        return storage.getItem(`gdev_check_${lesson.id}_${idx}`) === 'true';
      });

      if (isAllChecked) {
        link.classList.add('completed');
      } else {
        link.classList.remove('completed');
      }
    });
  }

  /**
   * Генерация сайдбара с модулями и уроками
   */
  function renderSidebar() {
    if (!elements.sidebarNav) return;

    let html = '';

    // Группируем уроки по модулям
    data.modules.forEach(mod => {
      const modLessons = data.lessons.filter(l => l.moduleId === mod.id);

      html += `
        <div class="nav-section">
          <div class="nav-section-title">
            <span>${mod.shortTitle}</span>
            <span class="nav-section-badge">${mod.badge}</span>
          </div>
      `;

      modLessons.forEach(l => {
        const numLabel = l.lessonNum > 0 ? l.lessonNum : '★';
        html += `
          <a href="#${l.id}" class="nav-link" data-id="${l.id}">
            <span class="nav-num">${numLabel}</span>
            <span class="nav-title">${l.shortTitle}</span>
            <span class="nav-check-icon">✓</span>
          </a>
        `;
      });

      html += `</div>`;
    });

    // Дополнительный блок инструментов
    html += `
      <div class="nav-section">
        <div class="nav-section-title">
          <span>Инструменты</span>
        </div>
        <a href="#progress" class="nav-link" data-id="progress">
          <span class="nav-num" style="background: rgba(16, 185, 129, 0.2); color: #34d399;">🏆</span>
          <span class="nav-title">Мои достижения</span>
        </a>
      </div>
    `;

    elements.sidebarNav.innerHTML = html;
  }

  /**
   * Обновление активного пункта меню в сайдбаре
   */
  function updateActiveNavLink(route) {
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.dataset.id === route) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Форматирование HTML из Markdown с сохранением 100% авторского контента
   */
  function parseAndEnhanceMarkdown(rawMarkdown, lessonId) {
    if (typeof marked === 'undefined') {
      console.error('Библиотека marked.js не найдена!');
      return `<pre>${rawMarkdown}</pre>`;
    }

    // Удаляем любые строки с датой и автором
    const cleanedMarkdown = rawMarkdown.replace(/^[A-Za-z]{3}\s+\d{1,2},\s+\d{4}\s*·\s*@[^\n]+\n*/m, '');

    // Настраиваем marked
    marked.setOptions({
      gfm: true,
      breaks: true
    });

    let rendered = marked.parse(cleanedMarkdown);

    // Оборачиваем в контейнер
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rendered;

    // 1. Стилизуем таблицы условий и действий GDevelop
    tempDiv.querySelectorAll('table').forEach(table => {
      const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim().toLowerCase());
      const hasCondition = headers.some(h => h.includes('услови'));
      const hasAction = headers.some(h => h.includes('действи'));

      if (hasCondition && hasAction) {
        table.classList.add('events-table');
        // Добавляем бейджи к заголовкам
        table.querySelectorAll('th').forEach((th, i) => {
          if (th.textContent.toLowerCase().includes('услови')) {
            th.innerHTML = `⚡ ${th.innerHTML}`;
          } else if (th.textContent.toLowerCase().includes('действи')) {
            th.innerHTML = `▶ ${th.innerHTML}`;
          }
        });
      }
    });

    // 2. Добавляем ID ко всем H2 заголовкам для быстрой навигации
    tempDiv.querySelectorAll('h2').forEach((h2, idx) => {
      const text = h2.textContent.trim();
      let anchor = `section-${idx}`;
      if (text.includes('Цель')) anchor = 'goal';
      else if (text.includes('Тайминг')) anchor = 'timing';
      else if (text.includes('Блок 1')) anchor = 'block-1';
      else if (text.includes('Блок 2')) anchor = 'block-2';
      else if (text.includes('Блок 3')) anchor = 'block-3';
      else if (text.includes('Блок 4')) anchor = 'block-4';
      else if (text.includes('Блок 5')) anchor = 'block-5';
      else if (text.includes('Частые ошибки')) anchor = 'errors';
      else if (text.includes('Проверка') || text.includes('Итог')) anchor = 'checklist';
      h2.id = anchor;
    });

    // 3. Интерактивные чекбоксы под секцией "Проверка результата"
    const checklistHeader = Array.from(tempDiv.querySelectorAll('h2')).find(
      h => h.textContent.includes('Проверка') || h.textContent.includes('Итог модуля')
    );

    if (checklistHeader) {
      let nextElem = checklistHeader.nextElementSibling;
      while (nextElem && nextElem.tagName !== 'H2') {
        if (nextElem.tagName === 'UL') {
          const listItems = Array.from(nextElem.querySelectorAll('li'));
          const isChecklist = listItems.some(li => li.textContent.includes('[ ]') || li.textContent.includes('[x]'));

          if (isChecklist) {
            const checklistContainer = document.createElement('div');
            checklistContainer.className = 'interactive-checklist-group';

            listItems.forEach((li, idx) => {
              const rawText = li.innerHTML.replace(/\[\s?\]/g, '').replace(/\[x\]/g, '').trim();
              const key = `gdev_check_${lessonId}_${idx}`;
              const isChecked = storage.getItem(key) === 'true';

              const itemDiv = document.createElement('div');
              itemDiv.className = `checklist-item ${isChecked ? 'checked' : ''}`;
              itemDiv.dataset.lessonId = lessonId;
              itemDiv.dataset.checkIdx = idx;
              itemDiv.innerHTML = `
                <div class="checklist-checkbox">${isChecked ? '✓' : ''}</div>
                <div class="checklist-text">${rawText}</div>
              `;

              itemDiv.addEventListener('click', () => {
                const newState = !itemDiv.classList.contains('checked');
                itemDiv.classList.toggle('checked', newState);
                itemDiv.querySelector('.checklist-checkbox').textContent = newState ? '✓' : '';
                storage.setItem(key, newState ? 'true' : 'false');
                updateProgressUI();

                // Проверяем, завершён ли весь урок
                checkLessonCompletion(lessonId);
              });

              checklistContainer.appendChild(itemDiv);
            });

            nextElem.replaceWith(checklistContainer);
            nextElem = checklistContainer;
          }
        }
        nextElem = nextElem ? nextElem.nextElementSibling : null;
      }
    }

    // 4. Кнопки копирования для блоков кода (pre code)
    tempDiv.querySelectorAll('pre').forEach(pre => {
      const code = pre.querySelector('code');
      if (code) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-badge-btn';
        copyBtn.innerHTML = `<span>📋 Копировать</span>`;
        copyBtn.addEventListener('click', () => {
          copyToClipboard(code.textContent, 'Код скопирован');
        });
        pre.appendChild(copyBtn);
      }
    });

    // 5. Кнопки копирования по клику на инлайн-код
    tempDiv.querySelectorAll('code:not(pre code)').forEach(codeSpan => {
      codeSpan.title = 'Нажмите, чтобы скопировать';
      codeSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        copyToClipboard(codeSpan.textContent, `Формула скопирована: ${codeSpan.textContent}`);
      });
    });

    // 6. Ссылки на внешнюю документацию — открывать в новой вкладке
    tempDiv.querySelectorAll('a').forEach(a => {
      if (a.href.startsWith('http')) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.innerHTML += ' ↗';
      }
    });

    return tempDiv.innerHTML;
  }

  /**
   * Проверка завершения всех критериев урока (запуск салюта из конфетти)
   */
  function checkLessonCompletion(lessonId) {
    const lesson = data.lessons.find(l => l.id === lessonId);
    if (!lesson || !lesson.checklist || lesson.checklist.length === 0) return;

    const allChecked = lesson.checklist.every((_, idx) => {
      return storage.getItem(`gdev_check_${lessonId}_${idx}`) === 'true';
    });

    if (allChecked) {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      showToast('🎉 Урок пройден на 100%! Отличная работа!', 4000);
    }
  }

  /**
   * Рендеринг страницы конкретного урока
   */
  function renderLessonView(lesson) {
    // Находим соседние уроки для нижней навигации
    const lessonList = data.lessons.filter(l => l.category !== 'methodology');
    const currentIndex = lessonList.findIndex(l => l.id === lesson.id);
    const prevLesson = currentIndex > 0 ? lessonList[currentIndex - 1] : null;
    const nextLesson = currentIndex < lessonList.length - 1 ? lessonList[currentIndex + 1] : null;

    // Генерация сегментов таймлайна
    let timelineHtml = '';
    if (lesson.timings && lesson.timings.length > 0) {
      const colors = ['seg-intro', 'seg-draw', 'seg-mech1', 'seg-mech2', 'seg-test', 'seg-wrap'];
      const segmentsHtml = lesson.timings.map((t, i) => {
        const colorClass = colors[i % colors.length];
        return `
          <div class="timeline-segment ${colorClass}" title="${t.block}: ${t.activity}" onclick="document.getElementById('timing')?.scrollIntoView({behavior: 'smooth'})">
            <span class="timeline-seg-time">${t.time}м</span>
            <span class="timeline-seg-label">${t.block}</span>
          </div>
        `;
      }).join('');

      timelineHtml = `
        <div class="timeline-card">
          <div class="timeline-title">
            <span>⏱️ Карта 90 минут занятия</span>
            <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-muted);">(кликните на блок, чтобы перейти к таймингу)</span>
          </div>
          <div class="timeline-bar-segments">
            ${segmentsHtml}
          </div>
        </div>
      `;
    }

    // Быстрые ссылки по разделам урока
    const quickNavPills = lesson.category !== 'methodology' ? `
      <div class="lesson-nav-pills">
        <a href="#goal" class="nav-pill" onclick="event.preventDefault(); document.getElementById('goal')?.scrollIntoView({behavior: 'smooth'})">🎯 Цель</a>
        <a href="#timing" class="nav-pill" onclick="event.preventDefault(); document.getElementById('timing')?.scrollIntoView({behavior: 'smooth'})">⏱️ Тайминг</a>
        <a href="#block-1" class="nav-pill" onclick="event.preventDefault(); document.getElementById('block-1')?.scrollIntoView({behavior: 'smooth'})">🎨 Арт</a>
        <a href="#block-2" class="nav-pill" onclick="event.preventDefault(); document.getElementById('block-2')?.scrollIntoView({behavior: 'smooth'})">⚡ Механика</a>
        <a href="#errors" class="nav-pill" onclick="event.preventDefault(); document.getElementById('errors')?.scrollIntoView({behavior: 'smooth'})">⚠️ Ошибки</a>
        <a href="#checklist" class="nav-pill" onclick="event.preventDefault(); document.getElementById('checklist')?.scrollIntoView({behavior: 'smooth'})">✅ Чек-лист</a>
      </div>
    ` : '';

    // Нижняя навигация между уроками
    let footerNavHtml = '';
    if (prevLesson || nextLesson) {
      footerNavHtml = `
        <div class="lesson-footer-nav">
          ${prevLesson ? `
            <a href="#${prevLesson.id}" class="nav-card-btn prev">
              <span class="nav-card-dir">← Предыдущий урок</span>
              <span class="nav-card-title">${prevLesson.shortTitle}</span>
            </a>
          ` : `<div></div>`}
          ${nextLesson ? `
            <a href="#${nextLesson.id}" class="nav-card-btn next">
              <span class="nav-card-dir">Следующий урок →</span>
              <span class="nav-card-title">${nextLesson.shortTitle}</span>
            </a>
          ` : `<div></div>`}
        </div>
      `;
    }

    // Рендерим Markdown
    const bodyHtml = parseAndEnhanceMarkdown(lesson.rawMarkdown, lesson.id);

    const fullHtml = `
      <div class="lesson-header-card">
        <div class="lesson-breadcrumbs">
          <span>Главная</span>
          <span class="breadcrumb-sep">/</span>
          <span>${lesson.moduleTitle}</span>
          <span class="breadcrumb-sep">/</span>
          <span style="color: var(--text-main);">${lesson.shortTitle}</span>
        </div>
        <h1 class="lesson-title-main">${lesson.title}</h1>
        <div class="lesson-meta-bar">
          <span class="meta-item"><span class="meta-badge">${lesson.moduleTitle}</span></span>
          <span class="meta-item">⏱️ 90 минут</span>
        </div>
        <div class="lesson-actions-bar">
          <button class="action-pill-btn" onclick="window.print()">
            <span>🖨️ Распечатать план</span>
          </button>
          <button class="action-pill-btn" onclick="navigator.clipboard.writeText(window.location.href); showToast('Ссылка скопирована');">
            <span>🔗 Поделиться ссылкой</span>
          </button>
        </div>
      </div>

      ${quickNavPills}
      ${timelineHtml}

      <div class="markdown-body">
        ${bodyHtml}
      </div>

      ${footerNavHtml}
    `;

    elements.mainContent.innerHTML = fullHtml;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Рендеринг базы частых ошибок (85 ошибок из всех уроков с мгновенным поиском)
   */
  function renderTroubleshootingView() {
    let filteredErrors = data.allErrors;

    // Фильтр по модулю
    if (state.errorFilter === 'm2') {
      filteredErrors = filteredErrors.filter(e => e.moduleId === 'm2');
    } else if (state.errorFilter === 'm3') {
      filteredErrors = filteredErrors.filter(e => e.moduleId === 'm3');
    }

    // Поиск по тексту
    if (state.errorSearch.trim()) {
      const q = state.errorSearch.toLowerCase();
      filteredErrors = filteredErrors.filter(e =>
        e.symptom.toLowerCase().includes(q) ||
        e.cause.toLowerCase().includes(q) ||
        e.solution.toLowerCase().includes(q) ||
        e.lessonTitle.toLowerCase().includes(q)
      );
    }

    const cardsHtml = filteredErrors.length > 0 ? filteredErrors.map(err => `
      <div class="error-card">
        <div class="error-card-header">
          <a href="#${err.lessonId}" class="error-lesson-badge">
            <span>📖 ${err.moduleTitle} · ${err.lessonTitle}</span>
          </a>
        </div>
        <div class="error-row">
          <div class="error-label label-symptom">Симптом</div>
          <div class="error-val-symptom">${err.symptom}</div>
        </div>
        <div class="error-row">
          <div class="error-label label-cause">Причина</div>
          <div class="error-val-cause">${err.cause}</div>
        </div>
        <div class="error-row">
          <div class="error-label label-fix">Решение</div>
          <div class="error-val-fix">${err.solution}</div>
        </div>
      </div>
    `).join('') : `
      <div style="text-align: center; padding: 48px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md);">
        <h3>Ничего не найдено</h3>
        <p>Попробуйте изменить поисковый запрос (например: «размытый», «пуля», «звук», «хитбокс»).</p>
      </div>
    `;

    const fullHtml = `
      <div class="troubleshooting-header">
        <h1 class="troubleshooting-title">
          <span>🚑 База скорой помощи: 85 частых ошибок</span>
        </h1>
        <p class="troubleshooting-subtitle">
          Что-то пошло не так в GDevelop? Найдите ваш симптом ниже — здесь собраны все решения из уроков!
        </p>
      </div>

      <div class="troubleshooting-filters">
        <button class="filter-btn ${state.errorFilter === 'all' ? 'active' : ''}" data-filter="all">
          Все ошибки (${data.allErrors.length})
        </button>
        <button class="filter-btn ${state.errorFilter === 'm2' ? 'active' : ''}" data-filter="m2">
          Модуль 2: Раннер (${data.allErrors.filter(e => e.moduleId === 'm2').length})
        </button>
        <button class="filter-btn ${state.errorFilter === 'm3' ? 'active' : ''}" data-filter="m3">
          Модуль 3: Топдаун Шутер (${data.allErrors.filter(e => e.moduleId === 'm3').length})
        </button>

        <div class="error-search-box">
          <span class="error-search-icon">🔍</span>
          <input type="text" class="error-search-input" id="error-filter-input" placeholder="Поиск проблемы: дёргается, звук, хитбокс..." value="${state.errorSearch}">
        </div>
      </div>

      <div class="errors-grid">
        ${cardsHtml}
      </div>
    `;

    elements.mainContent.innerHTML = fullHtml;

    // Вешаем слушатели фильтрации
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.errorFilter = btn.dataset.filter;
        renderTroubleshootingView();
      });
    });

    const filterInput = document.getElementById('error-filter-input');
    if (filterInput) {
      filterInput.focus();
      filterInput.setSelectionRange(filterInput.value.length, filterInput.value.length);
      filterInput.addEventListener('input', (e) => {
        state.errorSearch = e.target.value;
        renderTroubleshootingView();
      });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Рендеринг страницы «Мой прогресс и достижения»
   */
  function renderProgressView() {
    const { total, completed, percent } = calculateTotalProgress();

    // Считаем прогресс по модулям
    const m2Lessons = data.lessons.filter(l => l.moduleId === 'm2');
    const m3Lessons = data.lessons.filter(l => l.moduleId === 'm3');

    function getModuleStats(lessons) {
      let modTotal = 0;
      let modCompleted = 0;
      lessons.forEach(l => {
        (l.checklist || []).forEach((_, idx) => {
          modTotal++;
          if (storage.getItem(`gdev_check_${l.id}_${idx}`) === 'true') {
            modCompleted++;
          }
        });
      });
      const modPercent = modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0;
      return { total: modTotal, completed: modCompleted, percent: modPercent };
    }

    const m2Stats = getModuleStats(m2Lessons);
    const m3Stats = getModuleStats(m3Lessons);

    const fullHtml = `
      <div class="lesson-header-card">
        <h1 class="lesson-title-main">🏆 Мой прогресс обучения</h1>
        <p style="color: var(--text-muted); margin-bottom: 20px;">
          Отмечайте пункты в конце каждого урока, чтобы отслеживать свой путь от первых спрайтов до релизов на gd.games!
        </p>
        <div style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 10px;">
            <span>Общий прогресс по курсу:</span>
            <span style="color: var(--primary);">${completed} из ${total} критериев (${percent}%)</span>
          </div>
          <div class="progress-bar-bg" style="height: 12px;">
            <div class="progress-bar-fill" style="width: ${percent}%;"></div>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 32px;">
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 24px;">
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span>🏃 Модуль 2: 2D Раннер</span>
          </h2>
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 16px;">5 уроков: дорога, барьеры, монеты, прыжок, публикация</p>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 8px;">
            <span>Выполнено:</span>
            <span style="color: var(--primary);">${m2Stats.completed}/${m2Stats.total} (${m2Stats.percent}%)</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${m2Stats.percent}%;"></div>
          </div>
        </div>

        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 24px;">
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span>🎯 Модуль 3: Топдаун Шутер</span>
          </h2>
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 16px;">5 уроков: движение, выстрелы, враги, UI, сочность и эффекты</p>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 8px;">
            <span>Выполнено:</span>
            <span style="color: var(--secondary);">${m3Stats.completed}/${m3Stats.total} (${m3Stats.percent}%)</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${m3Stats.percent}%; background: linear-gradient(90deg, var(--secondary), #06b6d4);"></div>
          </div>
        </div>
      </div>

      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 16px;">Список уроков и статус</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${data.lessons.filter(l => l.category !== 'methodology').map(lesson => {
            const checklist = lesson.checklist || [];
            const doneCount = checklist.filter((_, idx) => storage.getItem(`gdev_check_${lesson.id}_${idx}`) === 'true').length;
            const isFinished = checklist.length > 0 && doneCount === checklist.length;

            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--bg-input); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <div>
                  <a href="#${lesson.id}" style="font-weight: 700; color: var(--text-main); text-decoration: none;">${lesson.shortTitle}</a>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">${lesson.moduleTitle}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 0.85rem; font-weight: 600; color: ${isFinished ? 'var(--success)' : 'var(--text-muted)'};">
                    ${doneCount}/${checklist.length}
                  </span>
                  <span style="font-size: 1.1rem;">${isFinished ? '✅' : '⏳'}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div style="margin-top: 24px; text-align: center;">
        <button class="action-pill-btn" style="margin: 0 auto; color: #f87171;" onclick="if(confirm('Сбросить все отметки прогресса?')) { window.resetProgress(); }">
          🗑️ Сбросить мой прогресс
        </button>
      </div>
    `;

    elements.mainContent.innerHTML = fullHtml;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Роутер приложения
   */
  function handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'm2-1';
    state.currentRoute = hash;

    // Закрываем мобильное меню при переходе
    closeMobileSidebar();

    // Обновляем сайдбар
    updateActiveNavLink(hash);

    if (hash === 'progress') {
      renderProgressView();
    } else {
      const lesson = data.lessons.find(l => l.id === hash);
      if (lesson) {
        renderLessonView(lesson);
      } else {
        // По умолчанию открываем первый урок
        window.location.hash = '#m2-1';
      }
    }
  }

  /**
   * Глобальный поиск
   */
  function performGlobalSearch(query) {
    if (!elements.searchModalResults) return;
    const q = query.trim().toLowerCase();

    if (!q) {
      elements.searchModalResults.innerHTML = `
        <div style="text-align: center; padding: 32px; color: var(--text-dim); font-size: 0.9rem;">
          Введите запрос: «TimeDelta», «Tween», «размытый», «монета», «хитбокс»...
        </div>
      `;
      return;
    }

    const results = [];

    // 1. Поиск по урокам и их содержимому
    data.lessons.forEach(lesson => {
      const titleMatch = lesson.title.toLowerCase().includes(q);
      const textMatch = lesson.rawMarkdown.toLowerCase().includes(q);

      if (titleMatch || textMatch) {
        // Извлекаем сниппет
        let snippet = '';
        const idx = lesson.rawMarkdown.toLowerCase().indexOf(q);
        if (idx !== -1) {
          const start = Math.max(0, idx - 40);
          const end = Math.min(lesson.rawMarkdown.length, idx + 80);
          snippet = '...' + lesson.rawMarkdown.substring(start, end).replace(/\n/g, ' ') + '...';
        }

        results.push({
          type: 'Урок',
          badge: lesson.moduleShort,
          title: lesson.shortTitle,
          link: `#${lesson.id}`,
          snippet: snippet
        });
      }
    });

    // 2. Поиск по ошибкам
    data.allErrors.forEach(err => {
      if (
        err.symptom.toLowerCase().includes(q) ||
        err.cause.toLowerCase().includes(q) ||
        err.solution.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Решение ошибки',
          badge: err.lessonTitle,
          title: err.symptom,
          link: `#${err.lessonId}`,
          snippet: `Причина: ${err.cause}. Решение: ${err.solution}`
        });
      }
    });

    if (results.length === 0) {
      elements.searchModalResults.innerHTML = `
        <div style="text-align: center; padding: 32px; color: var(--text-muted); font-size: 0.9rem;">
          Ничего не найдено по запросу «${query}».
        </div>
      `;
      return;
    }

    const resultsHtml = results.slice(0, 15).map(r => `
      <a href="${r.link}" class="search-result-item" onclick="closeSearchModal()">
        <div class="search-result-header">
          <span class="search-result-title">${r.title}</span>
          <span class="search-result-badge">${r.badge}</span>
        </div>
        ${r.snippet ? `<div class="search-result-snippet">${r.snippet}</div>` : ''}
      </a>
    `).join('');

    elements.searchModalResults.innerHTML = resultsHtml;
  }

  function openSearchModal() {
    if (!elements.searchModal) return;
    elements.searchModal.classList.add('open');
    if (elements.searchModalInput) {
      elements.searchModalInput.value = '';
      elements.searchModalInput.focus();
      performGlobalSearch('');
    }
  }

  function closeSearchModal() {
    if (!elements.searchModal) return;
    elements.searchModal.classList.remove('open');
  }

  // Управление мобильным сайдбаром
  function openMobileSidebar() {
    if (elements.sidebar) elements.sidebar.classList.add('open');
    if (elements.sidebarBackdrop) elements.sidebarBackdrop.classList.add('open');
  }

  function closeMobileSidebar() {
    if (elements.sidebar) elements.sidebar.classList.remove('open');
    if (elements.sidebarBackdrop) elements.sidebarBackdrop.classList.remove('open');
  }

  // Переключение темы (светлая/тёмная)
  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    storage.setItem('gdev_theme', state.theme);
    updateThemeIcon();
  }

  function updateThemeIcon() {
    if (!elements.themeToggleBtn) return;
    elements.themeToggleBtn.textContent = state.theme === 'dark' ? '🌙' : '☀️';
  }

  /**
   * Инициализация обработчиков событий
   */
  function initEvents() {
    // Хеш-роутинг
    window.addEventListener('hashchange', handleRoute);

    // Переключение темы
    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.addEventListener('click', toggleTheme);
      updateThemeIcon();
    }

    // Мобильное меню
    if (elements.mobileMenuBtn) {
      elements.mobileMenuBtn.addEventListener('click', openMobileSidebar);
    }
    if (elements.sidebarBackdrop) {
      elements.sidebarBackdrop.addEventListener('click', closeMobileSidebar);
    }

    // Поиск
    if (elements.searchTriggerBtn) {
      elements.searchTriggerBtn.addEventListener('click', openSearchModal);
    }
    if (elements.searchModalClose) {
      elements.searchModalClose.addEventListener('click', closeSearchModal);
    }
    if (elements.searchModal) {
      elements.searchModal.addEventListener('click', (e) => {
        if (e.target === elements.searchModal) closeSearchModal();
      });
    }
    if (elements.searchModalInput) {
      elements.searchModalInput.addEventListener('input', (e) => {
        performGlobalSearch(e.target.value);
      });
    }

    // Горячие клавиши (Cmd+K / Ctrl+K для поиска, Esc для закрытия)
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearchModal();
      }
      if (e.key === 'Escape') {
        closeSearchModal();
        closeMobileSidebar();
      }
    });
  }

  /**
   * Главный старт приложения
   */
  function init() {
    renderSidebar();
    updateProgressUI();
    initEvents();
    handleRoute();
  }

  // Запуск после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function resetProgress() {
    storage.keys().forEach(k => {
      if (k.startsWith('gdev_check_')) {
        storage.removeItem(k);
      }
    });
    location.reload();
  }

  // Делаем функции доступными глобально
  window.showToast = showToast;
  window.closeSearchModal = closeSearchModal;
  window.resetProgress = resetProgress;
})();
