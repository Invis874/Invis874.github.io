// ============================================================
// TOAST — Система всплывающих уведомлений
// ============================================================

const Toast = (function() {

    // Контейнер для уведомлений (создаётся один раз)
    let container = null;

    // Стили (добавляются один раз)
    function ensureStyles() {
        if (document.getElementById('toast-styles')) return;

        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast-wrapper {
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                align-items: center;
                pointer-events: none;
                max-width: 90vw;
            }

            .toast-item {
                background: #1c0f27;
                color: white;
                padding: 14px 24px;
                border-radius: 40px;
                font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
                font-weight: 500;
                font-size: 0.95rem;
                line-height: 1.3;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                gap: 10px;
                border: 1px solid rgba(255, 255, 255, 0.08);
                max-width: 90vw;
                pointer-events: auto;
                animation: toastIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                word-wrap: break-word;
            }

            .toast-item.success { background: #1a6d3c; }
            .toast-item.error   { background: #b13a3a; }
            .toast-item.warning { background: #a67c1e; }
            .toast-item.info    { background: #1c0f27; }

            .toast-item.hiding {
                animation: toastOut 0.3s ease forwards;
            }

            .toast-icon {
                font-size: 1.2rem;
                flex-shrink: 0;
            }

            @keyframes toastIn {
                from { opacity: 0; transform: translateY(20px) scale(0.95); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
            }

            @keyframes toastOut {
                from { opacity: 1; transform: translateY(0) scale(1); }
                to   { opacity: 0; transform: translateY(20px) scale(0.95); }
            }
        `;
        document.head.appendChild(style);
    }

    // Создать контейнер
    function ensureContainer() {
        if (container) return container;

        container = document.createElement('div');
        container.className = 'toast-wrapper';
        document.body.appendChild(container);

        return container;
    }

    // Показать уведомление
    function show(message, type, duration) {
        type = type || 'info';
        duration = duration || 2000;

        ensureStyles();
        ensureContainer();

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const toast = document.createElement('div');
        toast.className = 'toast-item ' + type;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(function() {
            toast.classList.add('hiding');
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    // Публичное API
    return {
        show: show,
        success: function(msg) { show(msg, 'success'); },
        error:   function(msg) { show(msg, 'error'); },
        warning: function(msg) { show(msg, 'warning'); },
        info:    function(msg) { show(msg, 'info'); }
    };

})();