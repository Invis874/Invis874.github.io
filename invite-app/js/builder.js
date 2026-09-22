// ============================================================
// BUILDER — Визуальный конструктор с превью и тостами
// ============================================================

document.addEventListener('DOMContentLoaded', function() {

    // --- ЭЛЕМЕНТЫ ---
    const steps = document.querySelectorAll('.step');
    const previewContent = document.getElementById('previewContent');
    const previewBadge = document.getElementById('previewBadge');
    const resultOverlay = document.getElementById('resultOverlay');
    const resultLinkInput = document.getElementById('resultLinkInput');
    const copyBtn = document.getElementById('copyBtn');
    const closeResult = document.getElementById('closeResult');

    const previewProgress = document.getElementById('previewProgress');
    let currentStep = 1; // текущий шаг
    let pinCodeInstance = null;

    // --- МАППИНГ ---
    let selectedShape = 'rounded';
    let selectedColor = 'rose';

    const modeMap = {
        instant: '✨ Сразу показать',
        envelope: '📩 Конверт',
        scratch:  '🧽 Сотри фон',
        pin:      '🔢 Пинкод'
    };

    // ============================================================
    // ПЕРЕКЛЮЧЕНИЕ ШАГОВ
    // ============================================================
    document.querySelectorAll('.btn-next').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const next = parseInt(this.dataset.next);
            showStep(next);
        });
    });

    document.querySelectorAll('.btn-prev').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const prev = parseInt(this.dataset.prev);
            showStep(prev);
        });
    });

    // ============================================================
    // ОБНОВЛЕНИЕ ПРОГРЕСС-ПОЛЗУНКА
    // ============================================================
    function updateProgress(step) {
        if (!previewProgress) return;

        const progressSteps = previewProgress.querySelectorAll('.progress-step');
        const progressLines = previewProgress.querySelectorAll('.progress-line');

        progressSteps.forEach(function(el) {
            const elStep = parseInt(el.dataset.step);
            
            el.classList.toggle('active', elStep === step);
            el.classList.toggle('completed', elStep < step);
        });

        // Линии между шагами
        progressLines.forEach(function(line, index) {
            // Линия считается completed, если следующий шаг уже достигнут
            // index 0 — линия между шагом 1 и 2
            // index 1 — линия между шагом 2 и 3
            const nextStep = index + 2;
            line.classList.toggle('completed', step >= nextStep);
        });
    }

    function showStep(num) {
        currentStep = num; // ← запоминаем текущий шаг
        steps.forEach(function(step) {
            const stepNum = parseInt(step.dataset.step);
            step.classList.toggle('active', stepNum === num);
        });
        updateProgress(num);
        updatePreview();
    }

    // ============================================================
    // ВЫБОР РЕЖИМА ПОКАЗА (Шаг 1)
    // ============================================================
    document.querySelectorAll('.mode-option').forEach(function(el) {
        el.addEventListener('click', function() {
            document.querySelectorAll('.mode-option').forEach(function(opt) {
                opt.classList.remove('active');
            });
            this.classList.add('active');
            const mode = this.dataset.mode;
            document.getElementById('selectedMode').value = mode;
            previewBadge.textContent = modeMap[mode] || mode;
            
            // Показываем/скрываем настройки пинкода
            const pinGroup = document.getElementById('pinSettingsGroup');
            if (pinGroup) {
                pinGroup.style.display = mode === 'pin' ? 'block' : 'none';
            }
            
            updatePreview();
        });
    });

    // ============================================================
    // ВЫБОР ВИДА ГРАНЕЙ (Шаг 2)
    // ============================================================
    document.querySelectorAll('.shape-option').forEach(function(el) {
        el.addEventListener('click', function() {
            document.querySelectorAll('.shape-option').forEach(function(opt) {
                opt.classList.remove('active');
            });
            this.classList.add('active');
            selectedShape = this.dataset.shape;
            document.getElementById('selectedShape').value = selectedShape;
            updatePreview();
        });
    });

    // ============================================================
    // ВЫБОР ЦВЕТА
    // ============================================================
    document.querySelectorAll('.color-option').forEach(function(el) {
        el.addEventListener('click', function() {
            document.querySelectorAll('.color-option').forEach(function(opt) {
                opt.classList.remove('active');
            });
            this.classList.add('active');
            selectedColor = this.dataset.color;
            document.getElementById('selectedColor').value = selectedColor;
            updatePreview();
        });
    });


    // ============================================================
    // ЗАГРУЗКА СВОИХ КАРТИНОК
    // ============================================================
    const MAX_FILE_SIZE = 50 * 1024; // 450 КБ

    function setupImageUpload(uploadId, previewId, previewImgId, removeId, pickerId, hiddenInputId) {
        const upload = document.getElementById(uploadId);
        const preview = document.getElementById(previewId);
        const previewImg = document.getElementById(previewImgId);
        const removeBtn = document.getElementById(removeId);
        const picker = document.getElementById(pickerId);
        const hiddenInput = document.getElementById(hiddenInputId);

        if (!upload) return;

        upload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            // Проверка размера
            if (file.size > MAX_FILE_SIZE) {
                Toast.warning('Файл слишком большой. Максимум 50 КБ');
                upload.value = '';
                return;
            }

            // Проверка типа
            if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) {
                Toast.warning('Поддерживаются только PNG, JPG, GIF');
                upload.value = '';
                return;
            }

            // Читаем файл как Data URL
            const reader = new FileReader();
            reader.onload = function(event) {
                const dataUrl = event.target.result;

                // Показываем превью
                previewImg.src = dataUrl;
                preview.style.display = 'inline-block';

                // Снимаем активность со всех готовых картинок
                picker.querySelectorAll('.image-option').forEach(function(opt) {
                    opt.classList.remove('active');
                });

                // Сохраняем в hidden input
                hiddenInput.value = dataUrl;
                updatePreview();

                Toast.success('Картинка загружена!');
            };
            reader.readAsDataURL(file);
        });

        removeBtn.addEventListener('click', function() {
            upload.value = '';
            preview.style.display = 'none';
            previewImg.src = '';

            // Возвращаем первую готовую картинку
            const firstOption = picker.querySelector('.image-option');
            if (firstOption) {
                firstOption.classList.add('active');
                hiddenInput.value = firstOption.dataset.image;
            }
            updatePreview();
        });
    }

    setupImageUpload(
        'coverUpload',
        'coverUploadPreview',
        'coverUploadImg',
        'coverUploadRemove',
        'coverImagePicker',
        'coverImage'
    );

    setupImageUpload(
        'confirmUpload',
        'confirmUploadPreview',
        'confirmUploadImg',
        'confirmUploadRemove',
        'confirmImagePicker',
        'confirmImage'
    );

    // ============================================================
    // ВЫБОР АНИМАЦИЙ (Шаг 2)
    // ============================================================
    // Анимация для кнопки 1
    document.querySelectorAll('.anim-option[data-target="btn1"]').forEach(function(el) {
        el.addEventListener('click', function() {
            document.querySelectorAll('.anim-option[data-target="btn1"]').forEach(function(opt) {
                opt.classList.remove('active');
            });
            this.classList.add('active');
            document.getElementById('btn1Animation').value = this.dataset.anim;
            updatePreview();
        });
    });

    // Анимация для кнопки 2
    document.querySelectorAll('.anim-option[data-target="btn2"]').forEach(function(el) {
        el.addEventListener('click', function() {
            document.querySelectorAll('.anim-option[data-target="btn2"]').forEach(function(opt) {
                opt.classList.remove('active');
            });
            this.classList.add('active');
            document.getElementById('btn2Animation').value = this.dataset.anim;
            updatePreview();
        });
    });

    // Trap-эффекты для заблокированной кнопки 2
    document.querySelectorAll('.trap-option').forEach(function(el) {
        el.addEventListener('click', function() {
            document.querySelectorAll('.trap-option').forEach(function(opt) {
                opt.classList.remove('active');
            });
            this.classList.add('active');
            document.getElementById('btn2Trap').value = this.dataset.trap;
            updatePreview();
        });
    });

    // ============================================================
    // ВКЛЮЧЕНИЕ/ВЫКЛЮЧЕНИЕ КНОПКИ 2
    // ============================================================
    document.getElementById('btn2Enabled').addEventListener('change', function() {
        const btn2AnimationGroup = document.getElementById('btn2AnimationGroup');
        const btn2TrapGroup = document.getElementById('btn2TrapGroup');
        
        if (this.checked) {
            btn2AnimationGroup.style.display = 'block';
            btn2TrapGroup.style.display = 'none';
        } else {
            btn2AnimationGroup.style.display = 'none';
            btn2TrapGroup.style.display = 'block';
        }
        updatePreview();
    });

    // ============================================================
    // ОБНОВЛЕНИЕ ПРЕВЬЮ ПРИ ИЗМЕНЕНИИ ПОЛЕЙ
    // ============================================================
    document.querySelectorAll('input, select').forEach(function(input) {
        if (input.id === 'pinCode') return;

        input.addEventListener('input', updatePreview);
        input.addEventListener('change', updatePreview);
    });

    // ============================================================
    // ОБНОВЛЕНИЕ ПРЕВЬЮ ПИНКОДА ПРИ ВВОДЕ В ПОЛЕ
    // ============================================================
    const pinCodeInput = document.getElementById('pinCode');
    if (pinCodeInput) {
        pinCodeInput.addEventListener('input', function() {
            // Ограничиваем только цифрами
            this.value = this.value.replace(/\D/g, '');
           
            // Обновляем превью через инстанс
            if (pinCodeInstance) {
                // Меняем правильный пинкод → меняется длина → меняются точки
                pinCodeInstance.setCorrectPin(this.value);
            }
        });
    }

    // ============================================================
    // ОБНОВЛЕНИЕ ПРЕВЬЮ ПИНКОДА (при вводе в input)
    // ============================================================
    function createPinScreen(colors) {
        return `
            <div class="invite-pin-screen">
                <div class="invite-pin-icon">🔒</div>
                <div class="invite-pin-title">Введите пинкод</div>
                <div class="invite-pin-hint">Приглашение защищено</div>
                <div class="invite-pin-inputs" style="--pin-accent: ${colors.accent}; --pin-bg: ${colors.bg};"></div>  
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
    }

    // ============================================================
    // ФУНКЦИЯ ОБНОВЛЕНИЯ ПРЕВЬЮ
    // ============================================================
    function updatePreview() {
        const mode = document.getElementById('selectedMode').value || 'instant';
        const shape = document.getElementById('selectedShape').value || 'rounded';
        const color = document.getElementById('selectedColor').value || 'rose';
        const coverImage = document.getElementById('coverImage').value || 'assets/images/covers/1.png';
        const mainTitle = document.getElementById('mainTitle').value || 'Приглашаю тебя!';
        const btn1Text = document.getElementById('btn1Text').value || '💖 Согласен';
        const btn2Text = document.getElementById('btn2Text').value || '🤔 Подумаю';
        const btn1Animation = document.getElementById('btn1Animation').value || 'none';
        const btn2Animation = document.getElementById('btn2Animation').value || 'none';
        const btn2Enabled = document.getElementById('btn2Enabled').checked;
        const btn2Trap = document.getElementById('btn2Trap').value || 'none';
        const confirmImage = document.getElementById('confirmImage').value || 'assets/images/confirms/1.png';
        const confirmTitle = document.getElementById('confirmTitle').value || 'Отлично!';
        const eventDate = document.getElementById('eventDate').value || '2026-09-15';
        const eventTime = document.getElementById('eventTime').value || '19:00';

        const oldCanvas = document.getElementById('previewScratchCanvas');
        if (oldCanvas) oldCanvas.remove(); // Убираем старый CANVAS "СОТРИ ФОН"

        const oldPinOverlay = document.getElementById('previewPinOverlay');
        if (oldPinOverlay) oldPinOverlay.remove();

        // Стили для превью
        const colorPalettes = {
            rose:     { bg: '#fce4ec', accent: '#d4617e', text: '#2d1b3d', dark: '#b14a63' },
            gold:     { bg: '#fff3d6', accent: '#e5a500', text: '#2d1b3d', dark: '#b88200' },
            ocean:    { bg: '#dce5f2', accent: '#1f5090', text: '#1c0f27', dark: '#14376a' },
            mint:     { bg: '#d6f5e6', accent: '#2e9c6a', text: '#1c3d2d', dark: '#1f7050' },
            lavender: { bg: '#ede5f5', accent: '#7c5b9a', text: '#2d1b3d', dark: '#5f4379' },
            peach:    { bg: '#ffe8d6', accent: '#e07b39', text: '#3d241c', dark: '#b85e25' }
        };

        const colors = colorPalettes[color] || colorPalettes.rose;

        // ============================================================
        // ФОН ПРЕВЬЮ (как в реальном viewer)
        // ============================================================
        const previewPhoneBg = document.getElementById('previewPhoneBg');
        if (previewPhoneBg) {
            const pageBg = colors.bg;
            previewPhoneBg.style.background = `linear-gradient(145deg, ${pageBg}, ${pageBg}dd)`;
        }

        const anim1Class = btn1Animation !== 'none' ? btn1Animation : '';

        const isEnvelope = mode === 'envelope';
        const isScratch = mode === 'scratch';
        const isPin = mode === 'pin';

        // Пинкод
        const pinCode = document.getElementById('pinCode')?.value || '';

        // ============================================================
        // КНОПКА 2 — РАЗНАЯ ЛОГИКА ДЛЯ АКТИВНОЙ И ЗАБЛОКИРОВАННОЙ
        // ============================================================
        let btn2Class = '';
        let btn2DisabledAttr = '';

        if (btn2Enabled) {
            // Кнопка АКТИВНА → используем анимацию кнопки 2
            btn2Class = btn2Animation !== 'none' ? btn2Animation : '';
        } else {
            // Кнопка ЗАБЛОКИРОВАНА → используем trap-эффекты
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

        const baseSlideStyle = `background: ${colors.bg}; border-radius: 20px; padding: 30px 24px; text-align: center;`;
        
        // ============================================================
        // ХЕЛПЕР: обёртка слайда
        // ============================================================
        function wrapSlide(content) {
            const radius = Utils.getShapeRadius(shape);
            return `
                <div class="invite-slide active" style="
                    background: ${Utils.adjustColorHSL(colors.bg, -6, +10)};
                    border-radius: ${radius};
                ">
                    ${content}
                </div>
            `;
        }

        let html = '';

        // ============================================================
        // ШАГ 1: СПОСОБ ПОКАЗА — только конверт ИЛИ приглашение
        // ============================================================
        if (currentStep === 1) {
            if (isEnvelope) {
                // Показываем конверт
                const pageBg = colors.bg;
                const envelopeBg = Utils.adjustColorHSL(colors.bg, -3, +5);
                const flapBg = Utils.adjustColorHSL(colors.bg, -6, +8);

                html = `
                    <div class="invite-envelope-screen">
                        <div class="invite-envelope-container">
                            <!-- Тело конверта -->
                            <div class="invite-envelope-body" style="background: ${envelopeBg}; border-radius: 12px;"></div>

                            <!-- Треугольный клапан -->
                            <div class="invite-envelope-flap" style="background: ${flapBg};"></div>
                        </div>
                        <div class="invite-envelope-hint">👆 Нажми на конверт</div>
                    </div>
                `;
            } else {
                // Показываем сразу приглашение
                html = wrapSlide(`
                    <div class="invite-slide-icon">
                        <img src="${coverImage}" alt="" />
                    </div>
                    <div class="invite-slide-title">${mainTitle}</div>
                    <div class="invite-buttons">
                        <button class="invite-btn invite-btn-primary ${anim1Class}" style="background: ${colors.accent};">${btn1Text}</button>
                        <button class="invite-btn invite-btn-secondary ${btn2Class}" ${btn2DisabledAttr}>${btn2Text}</button>
                    </div>
                `);
            }
        }

        // ============================================================
        // ШАГ 2: ОСНОВНОЙ ЭКРАН — только приглашение с кнопками
        // ============================================================
        else if (currentStep === 2) {
            html = wrapSlide(`
                <div class="invite-slide-icon">
                    <img src="${coverImage}" alt="" />
                </div>
                <div class="invite-slide-title" style="color: ${colors.text};">${mainTitle}</div>
                <div class="invite-buttons">
                    <button class="invite-btn invite-btn-primary ${anim1Class}" style="background: ${colors.accent};">${btn1Text}</button>
                    <button class="invite-btn invite-btn-secondary ${btn2Class}" ${btn2DisabledAttr}>${btn2Text}</button>
                </div>
            `);
        }

        // ============================================================
        // ШАГ 3: ПОДТВЕРЖДЕНИЕ — только экран подтверждения
        // ============================================================
        else if (currentStep === 3) {
            html = wrapSlide(`
                <div style="display:flex; justify-content:center; margin:8px 0;">
                    <img src="${confirmImage}" style="width:160px; height:160px; object-fit:contain;" alt="" />
                </div>
                <div class="invite-slide-title" style="color:${colors.text};">${confirmTitle}</div>
                <div class="invite-slide-datetime">📅 ${Utils.formatDate(eventDate)} в ${eventTime}</div>
            `);
        }

        previewContent.innerHTML = html;

        // ============================================================
        // ИНИЦИАЛИЗАЦИЯ ПРЕВЬЮ "СОТРИ ФОН"
        // ============================================================
        if (isScratch && currentStep === 1) {
            const previewPhoneBg = document.getElementById('previewPhoneBg');
    
            // Убираем старый canvas
            const oldCanvas = document.getElementById('previewScratchCanvas');
            if (oldCanvas) oldCanvas.remove();
            
            if (previewPhoneBg) {
                // Создаём canvas и накладываем на экран телефона
                const canvas = document.createElement('canvas');
                canvas.className = 'preview-scratch-canvas';
                canvas.id = 'previewScratchCanvas';
                previewPhoneBg.appendChild(canvas);
                
                setTimeout(function() {
                    Utils.initScratchEffect(
                        'previewScratchCanvas',
                        Utils.adjustColorHSL(colors.bg, -25, +20),
                        null,
                        30
                    );
                }, 50);
            }
        }

        // ============================================================
        // ИНИЦИАЛИЗАЦИЯ ПРЕВЬЮ "ПИНКОД"
        // ============================================================
        if (isPin && currentStep === 1) {
            const previewPhoneBg = document.getElementById('previewPhoneBg');
            if (previewPhoneBg) {
                const overlay = document.createElement('div');
                overlay.className = 'preview-pin-overlay';
                overlay.id = 'previewPinOverlay';
                overlay.innerHTML = createPinScreen(colors);
                
                previewPhoneBg.appendChild(overlay);
                
                // ← ПРАВИЛЬНЫЙ ПИНКОД
                const correctPin = document.getElementById('pinCode')?.value || '';
                
                setTimeout(function() {
                    pinCodeInstance = Utils.initPinCode(overlay, {
                        pinCode: correctPin,      // ← длина = длина пинкода
                        isPreview: true
                    });
                }, 50);
            }
        } else {
            pinCodeInstance = null;
        }

    }

    // ============================================================
    // ГЕНЕРАЦИЯ ССЫЛКИ
    // ============================================================
    document.querySelector('.btn-generate').addEventListener('click', function() {
        const payload = {
            mode: document.getElementById('selectedMode').value || 'instant',
            shape: document.getElementById('selectedShape').value || 'rounded',
            color: document.getElementById('selectedColor').value || 'rose',
            coverImage: document.getElementById('coverImage').value || 'assets/images/covers/1.png',
            mainTitle: document.getElementById('mainTitle').value || 'Приглашаю тебя!',
            btn1Text: document.getElementById('btn1Text').value || '💖 Согласен',
            btn2Text: document.getElementById('btn2Text').value || '🤔 Подумаю',
            btn1Animation: document.getElementById('btn1Animation').value || 'none',
            btn2Animation: document.getElementById('btn2Animation').value || 'none',
            btn2Enabled: document.getElementById('btn2Enabled').checked,
            btn2Trap: document.getElementById('btn2Trap').value || 'none',
            confirmImage: document.getElementById('confirmImage').value || 'assets/images/confirms/1.png',
            confirmTitle: document.getElementById('confirmTitle').value || 'Отлично!',
            eventDate: document.getElementById('eventDate').value || '2026-09-15',
            eventTime: document.getElementById('eventTime').value || '19:00',
            pinCode: document.getElementById('pinCode')?.value || ''
        };

        // ============================================================
        // ВАЛИДАЦИЯ
        // ============================================================
        const errors = [];
        const mode = payload.mode;
        
        // Проверка пинкода
        if (mode === 'pin') {
            const pinCode = document.getElementById('pinCode')?.value || '';
            if (!/^\d{1,6}$/.test(pinCode)) {
                errors.push('Пинкод должен содержать от 1 до 6 цифр');
            }
        }

        if (errors.length > 0) {
            Toast.error(errors[0]);
            return;
        }

        try {
            const encoded = Utils.encodePayload(payload);
            const link = Utils.buildInviteLink(encoded);

            resultLinkInput.value = link;
            resultOverlay.classList.add('show');
            Toast.success('Ссылка успешно создана!');
        } catch (error) {
            console.error('Ошибка:', error);
            Toast.error('Ошибка при создании ссылки');
        }
    });

    // ============================================================
    // КОПИРОВАНИЕ
    // ============================================================
    copyBtn.addEventListener('click', function() {
        const text = resultLinkInput.value;
        if (!text) return;

        Utils.copyToClipboard(text)
            .then(function() {
                Toast.success('Ссылка скопирована в буфер!');
            })
            .catch(function() {
                resultLinkInput.select();
                document.execCommand('copy');
                Toast.success('Ссылка скопирована в буфер!');
            });
    });

    // ============================================================
    // ЗАКРЫТИЕ МОДАЛКИ
    // ============================================================
    closeResult.addEventListener('click', function() {
        resultOverlay.classList.remove('show');
    });

    resultOverlay.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('show');
        }
    });

    // ============================================================
    // ПЕРВОНАЧАЛЬНОЕ ОБНОВЛЕНИЕ
    // ============================================================
    updatePreview();

    // ============================================================
    // РЕНДЕР ПИКЕРОВ КАРТИНОК (через компонент)
    // ============================================================
    ImagePicker.renderCovers('coverImagePicker', 'coverImage', updatePreview);
    ImagePicker.renderConfirms('confirmImagePicker', 'confirmImage', updatePreview);

    // ============================================================
    // МОБИЛЬНЫЕ ТАБЫ — ПЕРЕКЛЮЧЕНИЕ ПАНЕЛЕЙ
    // ============================================================
    const mobileTabs = document.getElementById('mobileTabs');
    const panelLeft = document.querySelector('.panel-left');
    const panelRight = document.querySelector('.panel-right');

    if (mobileTabs) {
        const tabs = mobileTabs.querySelectorAll('.mobile-tab');

        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                const target = this.dataset.tab;

                // Снимаем активность со всех
                tabs.forEach(function(t) {
                    t.classList.remove('active');
                });
                this.classList.add('active');

                // Переключаем панели
                if (target === 'builder') {
                    panelLeft.classList.add('active');
                    panelRight.classList.remove('active');
                } else if (target === 'preview') {
                    panelLeft.classList.remove('active');
                    panelRight.classList.add('active');

                    // Пересоздаём canvas после переключения
                    setTimeout(function() {
                        const mode = document.getElementById('selectedMode').value;
                        if (mode === 'scratch' && currentStep === 1) {
                            updatePreview();
                        }
                    }, 100);
                }

                // Скролл вверх
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        // По умолчанию — активна панель "Настройки"
        panelLeft.classList.add('active');
    }

    // Инициализируем эффект "сбегает" для новых кнопок
    Utils.initRunawayButtons();

});