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
        initRunawayButtons: initRunawayButtons,
        encodePayload: encodePayload,
        buildInviteLink: buildInviteLink,
        copyToClipboard: copyToClipboard,
        escapeHtml: escapeHtml
    };

})();