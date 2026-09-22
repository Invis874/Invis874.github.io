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
    // ОПРЕДЕЛЯЕМ РЕЖИМ
    // ============================================================
    const isEnvelope = data.mode === 'envelope';
    const isScratch = data.mode === 'scratch';
    const isPin = data.mode === 'pin';
    const pinCode = data.pinCode || '';

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

    const slideRadius = Utils.getShapeRadius(data.shape);

    // Вычисляем оттенки
    const pageBg = colors.bg;
    const envelopeBg = Utils.adjustColorHSL(colors.bg, -3, +5);  // темнее на 3%, насыщеннее на 5%
    const flapBg     = Utils.adjustColorHSL(colors.bg, -6, +8);   // клапан — темнее
    const sheetBg = Utils.adjustColorHSL(colors.bg, -6, +10);   // темнее на 6%, насыщеннее на 10%

    // ============================================================
    // ПРИМЕНЯЕМ ФОН СТРАНИЦЫ (по цвету)
    // ============================================================
    document.body.style.background = `linear-gradient(145deg, ${pageBg}, ${pageBg}dd)`;

    const anim1Class = data.btn1Animation && data.btn1Animation !== 'none' ? data.btn1Animation : '';
    const btn2Enabled = data.btn2Enabled !== undefined ? data.btn2Enabled : true;
    const btn2Trap = data.btn2Trap || 'none';

    // ============================================================
    // КНОПКА 2 — РАЗНАЯ ЛОГИКА ДЛЯ АКТИВНОЙ И ЗАБЛОКИРОВАННОЙ
    // ============================================================
    let btn2Class = '';
    let btn2DisabledAttr = '';

    if (btn2Enabled) {
        btn2Class = data.btn2Animation && data.btn2Animation !== 'none' ? data.btn2Animation : '';
    } else {
        btn2DisabledAttr = 'disabled';
        
        switch (btn2Trap) {
            case 'fade':
                btn2Class = 'trap-fade';
                break;
            case 'run':
                btn2Class = 'trap-run';
                break;
            case 'push':
                btn2Class = 'trap-push';
                break;
            default:
                btn2Class = 'trap-none';
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
    // СОЗДАНИЕ СЛАЙДОВ
    // ============================================================

    // --- СЛАЙД 1: ПРИГЛАШЕНИЕ (лист) ---
    const slide1 = document.createElement('div');
    slide1.className = 'invite-slide';
    slide1.dataset.slide = '0';
    slide1.style.borderRadius = slideRadius;
    slide1.style.background = sheetBg;

    slide1.innerHTML = `
        <div class="invite-slide-icon">
            <img src="${data.coverImage || 'assets/images/covers/1.png'}" alt="" />
        </div>
        <div class="invite-slide-title" style="color: ${colors.text};">${Utils.escapeHtml(data.mainTitle || 'Приглашаю тебя!')}</div>
        <div class="invite-buttons">
            <button class="invite-btn invite-btn-primary ${anim1Class}" data-action="agree" style="background: ${colors.accent};">
                ${Utils.escapeHtml(data.btn1Text || '💖 Согласен')}
            </button>
            <button class="invite-btn invite-btn-secondary ${btn2Class}" data-action="maybe" ${btn2DisabledAttr}>
                ${Utils.escapeHtml(data.btn2Text || '🤔 Подумаю')}
            </button>
        </div>
    `;

    // --- СЛАЙД 2: ПОДТВЕРЖДЕНИЕ ---
    const slide2 = document.createElement('div');
    slide2.className = 'invite-slide';
    slide2.dataset.slide = '1';
    slide2.style.borderRadius = slideRadius;
    slide2.style.background = sheetBg;

    slide2.innerHTML = `
        <div class="invite-slide-icon">
            <img src="${data.confirmImage || 'assets/images/confirms/1.png'}" alt="" />
        </div>
        <div class="invite-slide-title" style="color: ${colors.text};">${Utils.escapeHtml(data.confirmTitle || 'Отлично! Жду тебя!')}</div>
        <div class="invite-slide-datetime">📅 ${Utils.formatDate(data.eventDate || '2026-09-15')} в ${Utils.escapeHtml(data.eventTime || '19:00')}</div>
    `;

    slides = [slide1, slide2];

    // ============================================================
    // ДОБАВЛЯЕМ В DOM
    // ============================================================

    if (isEnvelope) {
        // === РЕЖИМ КОНВЕРТА ===
        // Создаём отдельный экран конверта
        const envelopeScreen = document.createElement('div');
        envelopeScreen.className = 'invite-envelope-screen';
        envelopeScreen.id = 'envelopeScreen';

        envelopeScreen.innerHTML = `
            <div class="invite-envelope-container" id="envelopeContainer">
                <!-- Тело конверта -->
                <div class="invite-envelope-letter" id="envelopeLetter" 
                     style="background: ${sheetBg}; border-radius: ${slideRadius};">
                    <div class="invite-envelope-letter-icon">
                        <img src="${data.coverImage || 'assets/images/covers/1.png'}" alt="" />
                    </div>
                    <div class="invite-envelope-letter-title" style="color: ${colors.text};">
                        ${Utils.escapeHtml(data.mainTitle || 'Приглашаю тебя!')}
                    </div>
                </div>

                <!-- Тело конверта -->
                <div class="invite-envelope-body" id="envelopeBody" style="background: ${envelopeBg};"></div>

                <!-- Треугольный клапан -->
                <div class="invite-envelope-flap" id="envelopeFlap" style="background: ${flapBg};"></div>
            </div>
            <div class="invite-envelope-hint">👆 Нажми на конверт</div>
        `;

        container.appendChild(envelopeScreen);
        container.appendChild(slide1);
        container.appendChild(slide2);

        // === ЛОГИКА ОТКРЫТИЯ КОНВЕРТА ===
        const envelopeContainer = document.getElementById('envelopeContainer');
        const flap = document.getElementById('envelopeFlap');
        const letter = document.getElementById('envelopeLetter');

        if (envelopeContainer) {
            envelopeContainer.addEventListener('click', function(e) {
                e.stopPropagation();
                if (envelopeContainer.dataset.opened === 'true') return;
                envelopeContainer.dataset.opened = 'true';

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
    } else if (isScratch) {
        // === СОТРИ ФОН ===
        // Показываем slide1 как обычно
        slide1.classList.add('active');
        container.appendChild(slide1);
        container.appendChild(slide2);
        
        // Поверх всего — добавляем canvas на весь экран
        const scratchOverlay = document.createElement('canvas');
        scratchOverlay.className = 'invite-scratch-overlay';
        scratchOverlay.id = 'scratchCanvasOverlay';
        document.body.appendChild(scratchOverlay);
        
        // Инициализация scratch-эффекта
        setTimeout(function() {
            Utils.initScratchEffect(
                'scratchCanvasOverlay',                       // ← ID canvas
                Utils.adjustColorHSL(colors.bg, -25, +20),    // ← цвет
                function() {                                  // ← колбэк
                    const canvas = document.getElementById('scratchCanvasOverlay');
                    if (canvas) {
                        canvas.style.transition = 'opacity 0.6s ease';
                        canvas.style.opacity = '0';
                        setTimeout(function() {
                            canvas.remove();
                        }, 600);
                    }
                },
                55  
            );
        }, 100);
    } else if (isPin) {
        // === ПИНКОД ===
        const pinScreen = document.createElement('div');
        pinScreen.className = 'invite-pin-overlay';
        pinScreen.id = 'pinOverlay';
        
        // HTML пинкода — прямо здесь (для viewer'а)
        pinScreen.innerHTML = `
            <div class="invite-pin-screen">
                <div class="invite-pin-icon">🔒</div>
                <div class="invite-pin-title">Введите пинкод</div>
                <div class="invite-pin-hint">Приглашение защищено</div>
                <div class="invite-pin-inputs" style="--pin-accent: ${colors.accent}; --pin-bg: ${colors.bg};">
                    <div class="invite-pin-dot"></div>
                    <div class="invite-pin-dot"></div>
                    <div class="invite-pin-dot"></div>
                    <div class="invite-pin-dot"></div>
                </div>
                <div class="invite-pin-keyboard" style="--pin-accent: ${colors.accent}; --pin-bg: ${colors.bg};">
                    ${[1,2,3,4,5,6,7,8,9].map(n => `
                        <div class="invite-pin-key" data-key="${n}">${n}</div>
                    `).join('')}
                    <div class="invite-pin-key empty"></div>
                    <div class="invite-pin-key" data-key="0">0</div>
                    <div class="invite-pin-key" data-key="delete">⌫</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(pinScreen);
        
        // Показываем slide1 под overlay
        slide1.classList.add('active');
        container.appendChild(slide1);
        container.appendChild(slide2);
        
        // Инициализация логики
        Utils.initPinCode(pinScreen, {
            pinCode: pinCode,
            isPreview: false,
            onSuccess: function() {
                pinScreen.remove();
            }
        });
        
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
    document.addEventListener('pointerdown', function(e) {
        const btn = e.target.closest('.invite-btn');
        if (!btn) return;

        // Если это trap-run — пропускаем (обрабатывается в utils.js)
        if (btn.classList.contains('trap-run')) return;

        // Если кнопка заблокирована — игнорируем клик
        if (btn.disabled) {
            if (btn.classList.contains('trap-none')) {
                Toast.warning('😏 Ой, не нажимается!');
            } else if (btn.classList.contains('trap-fade')) {
                Toast.info('👻 Ой, исчезла!');
            } else if (btn.classList.contains('trap-push')) {
                Toast.warning('😈 Не так просто! Соглашайся!');
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

    Utils.initRunawayButtons();
    console.log('✅ Приглашение загружено!', data);

});