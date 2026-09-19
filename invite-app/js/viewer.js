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

    // ============================================================
    // ФОРМАТИРОВАНИЕ ДАТЫ (2026-09-15 → 15.09.2026)
    // ============================================================
    function formatDate(isoDate) {
        if (!isoDate) return '';
        const parts = isoDate.split('-'); // [2026, 09, 15]
        if (parts.length !== 3) return isoDate;
        return parts[2] + '.' + parts[1] + '.' + parts[0];
    }

    // ============================================================
    // ЦВЕТА (палитры)
    // ============================================================
    const colorPalettes = {
        rose:     { bg: '#fce4ec', accent: '#d4617e', text: '#2d1b3d', dark: '#b14a63' },
        gold:     { bg: '#fff3d6', accent: '#e5a500', text: '#2d1b3d', dark: '#b88200' },
        ocean:    { bg: '#dce5f2', accent: '#1f5090', text: '#1c0f27', dark: '#14376a' },
        mint:     { bg: '#d6f5e6', accent: '#2e9c6a', text: '#1c3d2d', dark: '#1f7050' },
        lavender: { bg: '#ede5f5', accent: '#7c5b9a', text: '#2d1b3d', dark: '#5f4379' },
        peach:    { bg: '#ffe8d6', accent: '#e07b39', text: '#3d241c', dark: '#b85e25' }
    };

    const colors = colorPalettes[data.color] || colorPalettes.rose;

    // ============================================================
    // ФОРМА ГРАНЕЙ (radius)
    // ============================================================
    function getShapeRadius(shape) {
        switch (shape) {
            case 'rounded':  return '20px';
            case 'soft':     return '32px';
            case 'sharp':    return '0px';
            case 'wave':     return '50% 50% 50% 50% / 20% 20% 20% 20%';
            default:         return '20px';
        }
    }

    const slideRadius = getShapeRadius(data.shape);

    // ============================================================
    // ОТТЕНОК ЧЕРЕЗ HSL (сохраняет насыщенность)
    // ============================================================
    function adjustColorHSL(hex, lightnessDelta, saturationDelta) {
        // Hex → RGB
        hex = hex.replace('#', '');
        let r = parseInt(hex.substring(0, 2), 16) / 255;
        let g = parseInt(hex.substring(2, 4), 16) / 255;
        let b = parseInt(hex.substring(4, 6), 16) / 255;
        
        // RGB → HSL
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        // Меняем L и S
        l = Math.max(0, Math.min(1, l + lightnessDelta / 100));
        s = Math.max(0, Math.min(1, s + saturationDelta / 100));
        
        // HSL → RGB
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }
        
        let r2, g2, b2;
        if (s === 0) {
            r2 = g2 = b2 = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r2 = hue2rgb(p, q, h + 1/3);
            g2 = hue2rgb(p, q, h);
            b2 = hue2rgb(p, q, h - 1/3);
        }
        
        // RGB → Hex
        return '#' + [r2, g2, b2].map(function(c) {
            const v = Math.round(c * 255).toString(16);
            return v.length === 1 ? '0' + v : v;
        }).join('');
    }

    // Вычисляем оттенки
    const pageBg = colors.bg;
    const envelopeBg = adjustColorHSL(colors.bg, -3, +5);  // темнее на 3%, насыщеннее на 5%
    const flapBg     = adjustColorHSL(colors.bg, -6, +8);   // клапан — темнее
    const sheetBg = adjustColorHSL(colors.bg, -6, +10);   // темнее на 6%, насыщеннее на 10%

    // ============================================================
    // ПРИМЕНЯЕМ ФОН СТРАНИЦЫ (по цвету)
    // ============================================================
    document.body.style.background = `linear-gradient(145deg, ${pageBg}, ${pageBg}dd)`;

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
    // ФУНКЦИЯ ДЛЯ ПЕРЕКЛЮЧЕНИЯ СЛАЙДОВ
    // ============================================================
    function goToSlide(index) {
        if (index < 0 || index >= slides.length) return;

        slides.forEach(function(s, i) {
            s.classList.toggle('active', i === index);
        });

        currentSlide = index;
        container.scrollTop = 0;
    }

    // ============================================================
    // ЭФФЕКТ PUSH
    // ============================================================

    let pushEffect = '';
    if (!btn2Enabled && btn2Trap === 'push') {
        pushEffect = `
            onmouseenter="this.style.animation='pushAway 0.4s ease'"
            onmouseleave="this.style.animation=''"
        `;
    }

    // ============================================================
    // СОЗДАНИЕ СЛАЙДОВ
    // ============================================================

    // --- СЛАЙД 1: ПРИГЛАШЕНИЕ (лист) ---
    const slide1 = document.createElement('div');
    slide1.className = 'slide';
    slide1.dataset.slide = '0';
    slide1.style.borderRadius = slideRadius;
    slide1.style.background = sheetBg;

    slide1.innerHTML = `
        <div class="slide-icon">
            <img src="${data.coverImage || 'assets/images/covers/1.png'}" alt="" />
        </div>
        <div class="slide-title" style="color: ${colors.text};">${escapeHtml(data.mainTitle || 'Приглашаю тебя!')}</div>
        <div class="slide-buttons">
            <button class="slide-btn slide-btn-primary ${anim1Class}" data-action="agree" style="background: ${colors.accent};">
                ${escapeHtml(data.btn1Text || '💖 Согласен')}
            </button>
            <button class="slide-btn slide-btn-secondary ${anim2Class}" data-action="maybe" ${btn2DisabledAttr} style="background:#ede8f2; color:#2d1b3d; ${btn2TrapStyle}" ${pushEffect}>
                ${escapeHtml(data.btn2Text || '🤔 Подумаю')}
            </button>
        </div>
    `;

    // --- СЛАЙД 2: ПОДТВЕРЖДЕНИЕ ---
    const slide2 = document.createElement('div');
    slide2.className = 'slide';
    slide2.dataset.slide = '1';
    slide2.style.borderRadius = slideRadius;
    slide2.style.background = sheetBg;

    slide2.innerHTML = `
        <div class="slide-icon">
            <img src="${data.confirmImage || 'assets/images/confirms/1.png'}" alt="" />
        </div>
        <div class="slide-title" style="color: ${colors.text};">${escapeHtml(data.confirmTitle || 'Отлично! Жду тебя!')}</div>
        <div class="slide-datetime">📅 ${formatDate(data.eventDate || '2026-09-15')} в ${escapeHtml(data.eventTime || '19:00')}</div>
    `;

    slides = [slide1, slide2];

    // ============================================================
    // ДОБАВЛЯЕМ В DOM
    // ============================================================

    if (isEnvelope) {
        // === РЕЖИМ КОНВЕРТА ===
        // Создаём отдельный экран конверта
        const envelopeScreen = document.createElement('div');
        envelopeScreen.className = 'envelope-screen';
        envelopeScreen.id = 'envelopeScreen';

        envelopeScreen.innerHTML = `
            <div class="envelope-container" id="envelopeContainer">
                <!-- Тело конверта -->
                <div class="envelope-letter" id="envelopeLetter" 
                     style="background: ${sheetBg}; border-radius: ${slideRadius};"">
                    <div class="envelope-letter-icon">
                        <img src="${data.coverImage || 'assets/images/covers/1.png'}" alt="" />
                    </div>
                    <div class="envelope-letter-title" style="color: ${colors.text};">
                        ${escapeHtml(data.mainTitle || 'Приглашаю тебя!')}
                    </div>
                </div>

                <!-- Тело конверта -->
                <div class="envelope-body" id="envelopeBody" style="background: ${envelopeBg};"></div>

                <!-- Треугольный клапан -->
                <div class="envelope-flap" id="envelopeFlap" style="background: ${flapBg};"></div>
            </div>
            <div class="envelope-hint">👆 Нажми на конверт</div>
        `;

        container.appendChild(envelopeScreen);
        container.appendChild(slide1);
        container.appendChild(slide2);

        // === ЛОГИКА ОТКРЫТИЯ КОНВЕРТА ===
        const envelopeBody = document.getElementById('envelopeBody');
        const flap = document.getElementById('envelopeFlap');
        const letter = document.getElementById('envelopeLetter');

        if (envelopeBody) {
            envelopeBody.addEventListener('click', function(e) {
                e.stopPropagation();

                // Защита от повторного клика
                if (envelopeBody.dataset.opened === 'true') return;
                envelopeBody.dataset.opened = 'true';

                // 1. Открываем клапан (0.8 сек)
                if (flap) flap.classList.add('open');

                // 2. Через 0.8 сек — выезжает мини-слайд
                setTimeout(function() {
                    if (letter) letter.classList.add('show');
                }, 800);

                // 3. Через 1.8 сек — всё исчезает
                setTimeout(function() {
                    envelopeScreen.style.animation = 'fadeOut 0.5s ease forwards';
                }, 1800);

                // 4. Через 2.3 сек — показываем настоящий slide1
                setTimeout(function() {
                    envelopeScreen.remove();
                    slide1.classList.add('active');
                }, 2300);
            });
        }

    } else {
        // === РЕЖИМ "СРАЗУ ПОКАЗАТЬ" ===
        // Сразу показываем слайд 1
        slide1.classList.add('active');
        container.appendChild(slide1);
        container.appendChild(slide2);
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
            Toast.success('🎉 Отлично! Переходим к деталям...');
            setTimeout(function() {
                goToSlide(1);
            }, 600);
        } else if (action === 'maybe') {
            Toast.info('🤔 Хорошо, подумай. Но не затягивай! 😉');
        }
    });

    // ============================================================
    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ============================================================
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    console.log('✅ Приглашение загружено!', data);

});