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
        encodePayload: encodePayload,
        buildInviteLink: buildInviteLink,
        copyToClipboard: copyToClipboard,
        escapeHtml: escapeHtml
    };

})();