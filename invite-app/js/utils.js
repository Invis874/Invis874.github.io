// ============================================================
// UTILS — Общие утилиты для всего проекта
// ============================================================

const Utils = (function() {

    // ============================================================
    // ФОРМАТИРОВАНИЕ ДАТЫ (YYYY-MM-DD → DD.MM.YYYY)
    // ============================================================
    function formatDate(isoDate) {
        if (!isoDate) return '';
        const parts = isoDate.split('-'); // [yyyy, mm, dd]
        if (parts.length !== 3) return isoDate;
        return parts[2] + '.' + parts[1] + '.' + parts[0];
    }

    // ============================================================
    // ФОРМА ГРАНЕЙ → CSS RADIUS
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

    // ============================================================
    // HSL-КОРРЕКЦИЯ ЦВЕТА (сохраняет оттенок)
    // ============================================================
    function adjustColorHSL(hex, lightnessDelta, saturationDelta) {
        hex = hex.replace('#', '');
        let r = parseInt(hex.substring(0, 2), 16) / 255;
        let g = parseInt(hex.substring(2, 4), 16) / 255;
        let b = parseInt(hex.substring(4, 6), 16) / 255;

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

        l = Math.max(0, Math.min(1, l + lightnessDelta / 100));
        s = Math.max(0, Math.min(1, s + saturationDelta / 100));

        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        let r2, g2, b2;
        if (s === 0) {
            r2 = g2 = b2 = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r2 = hue2rgb(p, q, h + 1 / 3);
            g2 = hue2rgb(p, q, h);
            b2 = hue2rgb(p, q, h - 1 / 3);
        }

        return '#' + [r2, g2, b2].map(function(c) {
            const v = Math.round(c * 255).toString(16);
            return v.length === 1 ? '0' + v : v;
        }).join('');
    }

    // ============================================================
    // ЭФФЕКТ "СОТРИ ФОН" (SCRATCH)
    // ============================================================
    function initScratchEffect(overlayColor, onComplete) {
        const canvas = document.getElementById('scratchCanvasOverlay');
        if (!canvas) return;

        // Размер canvas = размер экрана
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const ctx = canvas.getContext('2d');

        // ============================================================
        // РИСУЕМ ФОН
        // ============================================================
        ctx.fillStyle = overlayColor || '#2d1b3d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // ============================================================
        // РИСУЕМ ТЕКСТ ПОДСКАЗКИ ПРЯМО НА CANVAS
        // ============================================================
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧽 Сотри фон', canvas.width / 2, canvas.height / 2 - 20);

        ctx.font = '500 15px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('чтобы увидеть приглашение', canvas.width / 2, canvas.height / 2 + 15);

        // ============================================================
        // РИСУЕМ УЗОР (эмодзи по всему экрану)
        // ============================================================
        ctx.font = 'bold 30px system-ui';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let y = 60; y < canvas.height; y += 100) {
            for (let x = 60; x < canvas.width; x += 130) {
                ctx.fillText('🧽', x, y);
            }
        }

        // ============================================================
        // РЕЖИМ СТИРАНИЯ
        // ============================================================
        ctx.globalCompositeOperation = 'destination-out';

        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;

        // Кисть: большой радиус + размытие
        const BRUSH_RADIUS = 55;

        function getCoords(e) {
            const r = canvas.getBoundingClientRect();
            const touch = e.touches ? e.touches[0] : e;
            return {
                x: (touch.clientX - r.left) * (canvas.width / r.width),
                y: (touch.clientY - r.top) * (canvas.height / r.height)
            };
        }

        function scratchAt(x, y) {
            // Мягкая кисть через радиальный градиент
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, BRUSH_RADIUS);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');       // центр — полное стирание
            gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.9)');   // чуть от центра
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');       // край — плавное исчезновение

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
            ctx.fill();

            // Соединяем точки линией (для плавности при быстром движении)
            if (lastX !== 0 && lastY !== 0) {
                const dist = Math.sqrt((x - lastX) ** 2 + (y - lastY) ** 2);
                const steps = Math.ceil(dist / 10);
                
                for (let i = 1; i < steps; i++) {
                    const px = lastX + (x - lastX) * (i / steps);
                    const py = lastY + (y - lastY) * (i / steps);
                    
                    const g = ctx.createRadialGradient(px, py, 0, px, py, BRUSH_RADIUS);
                    g.addColorStop(0, 'rgba(0, 0, 0, 1)');
                    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(px, py, BRUSH_RADIUS, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        function scratch(e) {
            if (!isDrawing) return;
            e.preventDefault();

            const coords = getCoords(e);
            scratchAt(coords.x, coords.y);

            lastX = coords.x;
            lastY = coords.y;

            // Проверяем прогресс (не каждый раз — для производительности)
            if (Math.random() < 0.15) {
                checkScratchProgress();
            }
        }

        // ============================================================
        // ПРОВЕРКА ПРОГРЕССА (30%)
        // ============================================================
        function checkScratchProgress() {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const dataArr = imageData.data;
            let transparent = 0;
            let total = 0;

            // Считаем каждый 16-й пиксель (для скорости)
            for (let i = 3; i < dataArr.length; i += 64) {
                total++;
                if (dataArr[i] < 128) transparent++;
            }

            const percent = (transparent / total) * 100;

            // Порог: 30%
            if (percent > 30) {
                canvas.style.transition = 'opacity 0.6s ease';
                canvas.style.opacity = '0';
                canvas.style.pointerEvents = 'none';

                setTimeout(function() {
                    canvas.remove();
                    if (typeof onComplete === 'function') {
                        onComplete();
                    }
                }, 600);
            }
        }

        // ============================================================
        // СОБЫТИЯ МЫШИ
        // ============================================================
        canvas.addEventListener('mousedown', function(e) {
            isDrawing = true;
            lastX = 0;
            lastY = 0;
            scratch(e);
        });

        canvas.addEventListener('mousemove', scratch);

        canvas.addEventListener('mouseup', function() {
            isDrawing = false;
            lastX = 0;
            lastY = 0;
            checkScratchProgress();
        });

        canvas.addEventListener('mouseleave', function() {
            isDrawing = false;
            lastX = 0;
            lastY = 0;
        });

        // ============================================================
        // СОБЫТИЯ ТАЧА
        // ============================================================
        canvas.addEventListener('touchstart', function(e) {
            isDrawing = true;
            lastX = 0;
            lastY = 0;
            scratch(e);
        }, { passive: false });

        canvas.addEventListener('touchmove', scratch, { passive: false });

        canvas.addEventListener('touchend', function() {
            isDrawing = false;
            lastX = 0;
            lastY = 0;
            checkScratchProgress();
        });
    }

    // ============================================================
    // ПИНКОД (PIN)
    // ============================================================
    function initPinCode(correctPin, onComplete) {
        const dots = document.querySelectorAll('.invite-pin-dot');
        const keyboard = document.getElementById('pinKeyboard');
        const pinScreen = document.querySelector('.invite-pin-screen');
        
        if (!keyboard) return;
        
        let enteredPin = '';
        
        function updateDots() {
            dots.forEach(function(dot, i) {
                dot.classList.toggle('filled', i < enteredPin.length);
            });
        }
        
        function checkPin() {
            if (enteredPin === correctPin) {
                // Правильный пинкод
                if (pinScreen) {
                    pinScreen.style.animation = 'fadeOut 0.5s ease forwards';
                    setTimeout(function() {
                        pinScreen.remove();
                        // Показываем приглашение через колбэк
                        if (typeof onComplete === 'function') {
                            onComplete();
                        }
                    }, 500);
                }
            } else {
                // Неправильный пинкод
                dots.forEach(function(dot) {
                    dot.style.background = '#e74c3c';
                    dot.style.borderColor = '#e74c3c';
                });
                
                Toast.error('Неверный пинкод');
                
                setTimeout(function() {
                    enteredPin = '';
                    updateDots();
                    dots.forEach(function(dot) {
                        dot.style.background = '';
                        dot.style.borderColor = '';
                    });
                }, 500);
            }
        }
        
        keyboard.addEventListener('click', function(e) {
            const key = e.target.closest('.invite-pin-key');
            if (!key || key.classList.contains('empty')) return;
            
            const keyValue = key.dataset.key;
            
            if (keyValue === 'delete') {
                enteredPin = enteredPin.slice(0, -1);
                updateDots();
            } else if (enteredPin.length < correctPin.length) {
                enteredPin += keyValue;
                updateDots();
                
                // Если достигли длины пинкода — проверяем
                if (enteredPin.length === correctPin.length) {
                    setTimeout(checkPin, 200);
                }
            }
        });
    }

    // ============================================================
    // ЭФФЕКТ "СБЕГАЕТ" — ОТСЛЕЖИВАНИЕ МЫШКИ
    // ============================================================
    function initRunawayButtons() {
        if (window._runawayInit === true) return;
        window._runawayInit = true;

        document.addEventListener('pointerdown', function(e) {
            const btn = e.target.closest('.trap-run');
            if (!btn) return;

            e.preventDefault();

            const slide = btn.closest('.invite-slide')
                       || btn.closest('.invite-envelope-screen')
                       || btn.parentElement;
            if (!slide) return;

            const slideRect = slide.getBoundingClientRect();
            const btnRect = btn.getBoundingClientRect();

            const btnWidth = btnRect.width;
            const btnHeight = btnRect.height;

            const PADDING = 12;

            // === НАКОПЛЕННОЕ СМЕЩЕНИЕ ===
            let currentTranslateX = parseFloat(btn.dataset.translateX || 0);
            let currentTranslateY = parseFloat(btn.dataset.translateY || 0);

            // === ИСХОДНАЯ ПОЗИЦИЯ КНОПКИ (без transform) ===
            const baseLeft = btnRect.left - slideRect.left - currentTranslateX;
            const baseTop = btnRect.top - slideRect.top - currentTranslateY;

            // === ГРАНИЦЫ ДЛЯ СМЕЩЕНИЯ ===
            const minTranslateX = PADDING - baseLeft;
            const maxTranslateX = slideRect.width - btnWidth - PADDING - baseLeft;
            const minTranslateY = PADDING - baseTop;
            const maxTranslateY = slideRect.height - btnHeight - PADDING - baseTop;

            // === СЛУЧАЙНАЯ ЦЕЛЬ В ГРАНИЦАХ ===
            const targetTranslateX = minTranslateX + Math.random() * (maxTranslateX - minTranslateX);
            const targetTranslateY = minTranslateY + Math.random() * (maxTranslateY - minTranslateY);

            // === СМЕЩЕНИЕ ===
            let offsetX = targetTranslateX - currentTranslateX;
            let offsetY = targetTranslateY - currentTranslateY;

            // === МИНИМАЛЬНАЯ ДИСТАНЦИЯ ===
            const MIN_DISTANCE = 80;
            const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);

            if (distance < MIN_DISTANCE) {
                const angle = Math.random() * Math.PI * 2;
                offsetX = Math.cos(angle) * MIN_DISTANCE;
                offsetY = Math.sin(angle) * MIN_DISTANCE;
            }

            // === НОВОЕ НАКОПЛЕННОЕ СМЕЩЕНИЕ ===
            let newTranslateX = currentTranslateX + offsetX;
            let newTranslateY = currentTranslateY + offsetY;

            // === ОБРЕЗАЕМ ПО ГРАНИЦАМ ===
            newTranslateX = Math.max(minTranslateX, Math.min(maxTranslateX, newTranslateX));
            newTranslateY = Math.max(minTranslateY, Math.min(maxTranslateY, newTranslateY));

            // === СОХРАНЯЕМ И ПРИМЕНЯЕМ ===
            btn.dataset.translateX = newTranslateX;
            btn.dataset.translateY = newTranslateY;

            btn.style.transform = `translate(${newTranslateX}px, ${newTranslateY}px)`;
        });
    }
    // ============================================================
    // КОДИРОВАНИЕ PAYLOAD В BASE64 (для URL)
    // ============================================================
    function encodePayload(payload) {
        const jsonString = JSON.stringify(payload);
        return btoa(unescape(encodeURIComponent(jsonString)));
    }

    // ============================================================
    // ПОСТРОЕНИЕ ССЫЛКИ НА INVITE.HTML
    // ============================================================
    function buildInviteLink(encodedData) {
        const currentPath = window.location.pathname;
        const baseUrl = window.location.origin + currentPath.replace(/\/[^/]*$/, '/invite.html');
        return baseUrl + '#data=' + encodedData;
    }

    // ============================================================
    // КОПИРОВАНИЕ В БУФЕР ОБМЕНА
    // ============================================================
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        return new Promise(function(resolve, reject) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textarea);
                resolve();
            } catch (err) {
                document.body.removeChild(textarea);
                reject(err);
            }
        });
    }

    // ============================================================
    // ЭКРАНИРОВАНИЕ HTML (защита от XSS)
    // ============================================================
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================================================
    // ПУБЛИЧНОЕ API
    // ============================================================
    return {
        formatDate: formatDate,
        getShapeRadius: getShapeRadius,
        adjustColorHSL: adjustColorHSL,
        initScratchEffect: initScratchEffect,
        initPinCode: initPinCode,
        initRunawayButtons: initRunawayButtons,
        encodePayload: encodePayload,
        buildInviteLink: buildInviteLink,
        copyToClipboard: copyToClipboard,
        escapeHtml: escapeHtml
    };

})();