// ============================================================
// VIEWER — Слайд-шоу приглашения
// ============================================================

document.addEventListener('DOMContentLoaded', function() {

    const container = document.getElementById('viewerContent');
    const hash = window.location.hash;

    // --- ПРОВЕРКА ДАННЫХ ---
    if (!hash || !hash.startsWith('#data=')) {
        container.innerHTML = `
            <div class="error-box">
                <h2>❌ Нет данных</h2>
                <p>Ссылка не содержит приглашения.</p>
            </div>
        `;
        return;
    }

    let data = null;
    try {
        const encoded = hash.substring(6);
        const decoded = decodeURIComponent(escape(atob(encoded)));
        data = JSON.parse(decoded);
    } catch (error) {
        container.innerHTML = `
            <div class="error-box">
                <h2>⚠️ Ошибка</h2>
                <p>Ссылка повреждена.</p>
            </div>
        `;
        return;
    }

    // --- ПРИМЕНЯЕМ СТИЛЬ ---
    if (data.style) {
        document.body.className = 'style-' + data.style;
    }

    // --- ЦВЕТА ДЛЯ СТИЛЕЙ ---
    const styleColors = {
        romantic: { bg: '#fce4ec', accent: '#d4617e', text: '#2d1b3d' },
        party: { bg: '#fef2d6', accent: '#e5a500', text: '#2d1b3d' },
        business: { bg: '#dce5f2', accent: '#1f5090', text: '#1c0f27' }
    };

    const colors = styleColors[data.style] || styleColors.romantic;
    const anim1Class = data.btn1Animation && data.btn1Animation !== 'none' ? data.btn1Animation : '';
    const anim2Class = data.btn2Animation && data.btn2Animation !== 'none' ? data.btn2Animation : '';
    const isEnvelope = data.mode === 'envelope';
    const btn2Enabled = data.btn2Enabled !== undefined ? data.btn2Enabled : true;
    const btn2Trap = data.btn2Trap || 'none';

    // --- Стили для кнопки 2 (если заблокирована) ---
    let btn2TrapStyle = '';
    let btn2DisabledAttr = '';
    if (!btn2Enabled) {
        btn2DisabledAttr = 'disabled';
        switch (btn2Trap) {
            case 'fade':
                btn2TrapStyle = 'opacity:0.3; transition: opacity 0.3s; cursor:not-allowed;';
                break;
            case 'shake':
                btn2TrapStyle = 'cursor:not-allowed; animation: shake 0.5s ease-in-out infinite;';
                break;
            case 'push':
                btn2TrapStyle = 'cursor:not-allowed; transition: transform 0.2s;';
                break;
            default:
                btn2TrapStyle = 'cursor:not-allowed; opacity:0.5;';
        }
    }

    // --- СОСТОЯНИЕ ---
    let currentSlide = 0;
    let isEnvelopeOpen = false;
    let slides = [];

    // ============================================================
    // TOAST-СИСТЕМА
    // ============================================================
    function showToast(message, type) {
        type = type || 'info';
        
        const oldToasts = document.querySelectorAll('.viewer-toast');
        oldToasts.forEach(function(t) { t.remove(); });

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const toast = document.createElement('div');
        toast.className = 'viewer-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: #1c0f27;
            color: white;
            padding: 12px 28px;
            border-radius: 40px;
            font-weight: 500;
            font-size: 0.95rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: toastIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            border: 1px solid rgba(255, 255, 255, 0.08);
            max-width: 90%;
            pointer-events: none;
        `;
        toast.innerHTML = `
            <span style="font-size:1.2rem;">${icons[type] || 'ℹ️'}</span>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);

        setTimeout(function() {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 2000);
    }

    // Стили для тостов
    const toastStyles = document.createElement('style');
    toastStyles.textContent = `
        @keyframes toastIn {
            from { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes toastOut {
            from { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
            to { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.95); }
        }
        @keyframes pushAway {
            0% { transform: translateX(0); }
            50% { transform: translateX(-20px); }
            100% { transform: translateX(0); }
        }
    `;
    document.head.appendChild(toastStyles);

    // ============================================================
    // ФУНКЦИЯ ДЛЯ ПЕРЕКЛЮЧЕНИЯ СЛАЙДОВ
    // ============================================================
    function goToSlide(index) {
        if (index < 0 || index >= slides.length) return;

        if (isEnvelope && !isEnvelopeOpen && index > 0) {
            showToast('📩 Сначала открой конверт!', 'warning');
            return;
        }

        slides.forEach(function(s, i) {
            s.classList.toggle('active', i === index);
        });

        currentSlide = index;
        container.scrollTop = 0;
    }

    // ============================================================
    // СОЗДАНИЕ СЛАЙДОВ
    // ============================================================

    // --- СЛАЙД 1: КОНВЕРТ ИЛИ ПРИГЛАШЕНИЕ ---
    const slide1 = document.createElement('div');
    slide1.className = 'slide active';
    slide1.dataset.slide = '0';

    // Эффект push для кнопки 2
    let pushEffect = '';
    if (!btn2Enabled && btn2Trap === 'push') {
        pushEffect = `
            onmouseenter="this.style.animation='pushAway 0.4s ease'"
            onmouseleave="this.style.animation=''"
        `;
    }

    if (isEnvelope) {
        slide1.innerHTML = `
            <div class="envelope-container" id="envelopeContainer">
                <div class="envelope-flap" id="envelopeFlap"></div>
                <div class="envelope-body" style="background: ${colors.bg}; cursor:pointer;" id="envelopeBody">
                    <div class="envelope-seal">✉️</div>
                    <div class="envelope-hint">👆 Нажми на конверт</div>
                </div>
            </div>
            <div class="slide-content" id="slideContent" style="display:none;">
                <div class="slide-icon">${data.coverImage || '🎉'}</div>
                <div class="slide-title">${escapeHtml(data.mainTitle || 'Приглашаю тебя!')}</div>
                <div class="slide-buttons">
                    <button class="slide-btn slide-btn-primary ${anim1Class}" data-action="agree" style="background: ${colors.accent};">
                        ${escapeHtml(data.btn1Text || '💖 Согласен')}
                    </button>
                    <button class="slide-btn slide-btn-secondary ${anim2Class}" data-action="maybe" ${btn2DisabledAttr} style="background:#ede8f2; border:none; padding:10px 24px; border-radius:40px; font-weight:600; font-size:1rem; cursor:default; color:#2d1b3d; ${btn2TrapStyle}" ${pushEffect}>
                        ${escapeHtml(data.btn2Text || '🤔 Подумаю')}
                    </button>
                </div>
            </div>
        `;
    } else {
        slide1.innerHTML = `
            <div class="slide-icon">${data.coverImage || '🎉'}</div>
            <div class="slide-title">${escapeHtml(data.mainTitle || 'Приглашаю тебя!')}</div>
            <div class="slide-buttons">
                <button class="slide-btn slide-btn-primary ${anim1Class}" data-action="agree" style="background: ${colors.accent};">
                    ${escapeHtml(data.btn1Text || '💖 Согласен')}
                </button>
                <button class="slide-btn slide-btn-secondary ${anim2Class}" data-action="maybe" ${btn2DisabledAttr} style="background:#ede8f2; border:none; padding:10px 24px; border-radius:40px; font-weight:600; font-size:1rem; cursor:default; color:#2d1b3d; ${btn2TrapStyle}" ${pushEffect}>
                    ${escapeHtml(data.btn2Text || '🤔 Подумаю')}
                </button>
            </div>
        `;
    }

    // --- СЛАЙД 2: ПОДТВЕРЖДЕНИЕ ---
    const slide2 = document.createElement('div');
    slide2.className = 'slide';
    slide2.dataset.slide = '1';
    slide2.innerHTML = `
        <div class="slide-icon">${data.confirmImage || '🎊'}</div>
        <div class="slide-title">${escapeHtml(data.confirmTitle || 'Отлично! Жду тебя!')}</div>
        <div class="slide-datetime">📅 ${formatDate(data.eventDate || '2026-09-15')} в ${escapeHtml(data.eventTime || '19:00')}</div>
    `;

    container.appendChild(slide1);
    container.appendChild(slide2);
    slides = [slide1, slide2];

    // ============================================================
    // ЛОГИКА КОНВЕРТА
    // ============================================================
    if (isEnvelope) {
        const envelopeBody = document.getElementById('envelopeBody');
        const envelopeContainer = document.getElementById('envelopeContainer');
        const slideContent = document.getElementById('slideContent');
        const flap = document.getElementById('envelopeFlap');

        if (envelopeBody) {
            // Эффект тряски при наведении
            envelopeBody.addEventListener('mouseenter', function() {
                this.style.animation = 'shake 0.5s ease-in-out';
            });
            envelopeBody.addEventListener('mouseleave', function() {
                this.style.animation = '';
            });

            // Открытие по клику
            envelopeBody.addEventListener('click', function(e) {
                e.stopPropagation();

                if (isEnvelopeOpen) return;
                isEnvelopeOpen = true;

                if (flap) {
                    flap.classList.add('open');
                }

                setTimeout(function() {
                    envelopeContainer.style.display = 'none';
                    slideContent.style.display = 'block';
                    slideContent.style.animation = 'fadeIn 0.6s ease';
                }, 800);
            });
        }
    }

    // ============================================================
    // ОБРАБОТКА КНОПОК
    // ============================================================
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.slide-btn');
        if (!btn) return;

        // Если кнопка заблокирована — игнорируем клик
        if (btn.disabled) {
            // Эффект push при клике на заблокированную кнопку
            if (btn2Trap === 'push') {
                btn.style.animation = 'pushAway 0.4s ease';
                setTimeout(function() {
                    btn.style.animation = '';
                }, 400);
            }
            return;
        }

        const action = btn.dataset.action;

        if (action === 'agree') {
            showToast('🎉 Отлично! Переходим к деталям...', 'success');
            setTimeout(function() {
                goToSlide(1);
            }, 600);
        } else if (action === 'maybe') {
            showToast('🤔 Хорошо, подумай. Но не затягивай! 😉', 'info');
        }
    });

    // ============================================================
    // ДОБАВЛЯЕМ СТИЛЬ ДЛЯ АНИМАЦИЙ
    // ============================================================
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-3deg); }
            75% { transform: rotate(3deg); }
        }
        .envelope-hint {
            font-size: 0.8rem;
            color: #7a6990;
            margin-top: 12px;
            animation: pulseText 2s ease-in-out infinite;
        }
        @keyframes pulseText {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
        }
        .slide-btn:disabled {
            pointer-events: auto !important;
            cursor: not-allowed !important;
        }
    `;
    document.head.appendChild(style);

    // ============================================================
    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ============================================================
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================================================
    // ФОРМАТИРОВАНИЕ ДАТЫ (2026-09-15 → 15.09.2026)
    // ============================================================
    function formatDate(isoDate) {
        if (!isoDate) return '';
        const parts = isoDate.split('-'); // [2026, 09, 15]
        if (parts.length !== 3) return isoDate;
        return parts[2] + '.' + parts[1] + '.' + parts[0];
    }

    console.log('✅ Приглашение загружено!', data);

});