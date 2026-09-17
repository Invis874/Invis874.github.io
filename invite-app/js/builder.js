// ============================================================
// BUILDER — Визуальный конструктор с превью и тостами
// ============================================================

document.addEventListener('DOMContentLoaded', function() {

    // --- ЭЛЕМЕНТЫ ---
    const steps = document.querySelectorAll('.step');
    const previewContent = document.getElementById('previewContent');
    const previewBadge = document.getElementById('previewBadge');
    const styleBadge = document.getElementById('styleBadge');
    const resultOverlay = document.getElementById('resultOverlay');
    const resultLinkInput = document.getElementById('resultLinkInput');
    const copyBtn = document.getElementById('copyBtn');
    const closeResult = document.getElementById('closeResult');
    const toastContainer = document.getElementById('toastContainer');

    // ============================================================
    // ФОРМАТИРОВАНИЕ ДАТЫ (YYYY-MM-DD → DD.MM.YYYY)
    // ============================================================
    function formatDate(isoDate) {
        if (!isoDate) return '';
        const parts = isoDate.split('-'); // [yyyy, mm, dd]
        if (parts.length !== 3) return isoDate;
        return parts[2] + '.' + parts[1] + '.' + parts[0];
    }

    // --- МАППИНГ ---
    const styleMap = {
        romantic: '🌹 Романтичный',
        party: '🎉 Праздничный',
        business: '💼 Деловой'
    };

    const modeMap = {
        instant: '✨ Сразу показать',
        envelope: '📩 Конверт'
    };

    // ============================================================
    // TOAST-СИСТЕМА
    // ============================================================
    function showToast(message, type) {
        type = type || 'info';
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
            <span class="toast-message">${message}</span>
        `;

        toastContainer.appendChild(toast);

        setTimeout(function() {
            toast.classList.add('hiding');
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 2800);
    }

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

    function showStep(num) {
        steps.forEach(function(step) {
            const stepNum = parseInt(step.dataset.step);
            step.classList.toggle('active', stepNum === num);
        });
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
            updatePreview();
        });
    });

    // ============================================================
    // ВЫБОР СТИЛЯ (Шаг 2)
    // ============================================================
    document.querySelectorAll('.style-option').forEach(function(el) {
        el.addEventListener('click', function() {
            document.querySelectorAll('.style-option').forEach(function(opt) {
                opt.classList.remove('active');
            });
            this.classList.add('active');
            const style = this.dataset.style;
            document.getElementById('selectedStyle').value = style;
            styleBadge.textContent = styleMap[style] || style;
            updatePreview();
        });
    });


    // ============================================================
    // ЗАГРУЗКА СВОИХ КАРТИНОК
    // ============================================================
    const MAX_FILE_SIZE = 450 * 1024; // 450 КБ

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
                showToast('Файл слишком большой. Максимум 450 КБ', 'warning');
                upload.value = '';
                return;
            }

            // Проверка типа
            if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) {
                showToast('Поддерживаются только PNG, JPG, GIF', 'warning');
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

                showToast('Картинка загружена!', 'success');
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
        input.addEventListener('input', updatePreview);
        input.addEventListener('change', updatePreview);
    });

    // ============================================================
    // ФУНКЦИЯ ОБНОВЛЕНИЯ ПРЕВЬЮ
    // ============================================================
    function updatePreview() {
        const mode = document.getElementById('selectedMode').value || 'instant';
        const style = document.getElementById('selectedStyle').value || 'romantic';
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

        // Стили для превью
        const styleColors = {
            romantic: { bg: '#fce4ec', accent: '#d4617e', text: '#2d1b3d' },
            party: { bg: '#fef2d6', accent: '#e5a500', text: '#2d1b3d' },
            business: { bg: '#dce5f2', accent: '#1f5090', text: '#1c0f27' }
        };

        const colors = styleColors[style] || styleColors.romantic;
        const anim1Class = btn1Animation !== 'none' ? btn1Animation : '';
        const anim2Class = btn2Animation !== 'none' ? btn2Animation : '';
        const isEnvelope = mode === 'envelope';

        // Стили для кнопки 2 (если заблокирована)
        let btn2TrapStyle = '';
        if (!btn2Enabled) {
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

        const baseSlideStyle = `background: ${colors.bg}; border-radius: 20px; padding: 30px 24px; text-align: center;`;
        
        function createSlide(content, activeIndex, totalSlides, isLast) {
            const marginBottom = isLast ? '0' : '20px';
            let dots = '';
            for (let i = 0; i < totalSlides; i++) {
                const isActive = i === activeIndex;
                dots += `
                    <span class="preview-dot" style="
                        width: ${isActive ? '24px' : '8px'};
                        height: 8px;
                        border-radius: ${isActive ? '6px' : '50%'};
                        background: ${isActive ? '#7c5b9a' : '#d5c5e6'};
                        display: inline-block;
                        transition: all 0.3s;
                    "></span>
                `;
            }

            return `
                <div class="preview-slide" style="${baseSlideStyle} margin-bottom: ${marginBottom}; ${isEnvelope && activeIndex === 0 ? 'position:relative; overflow:hidden;' : ''}">
                    ${content}
                    <div style="display:flex; justify-content:center; gap:6px; margin-top:14px;">
                        ${dots}
                    </div>
                </div>
            `;
        }

        let html = '';
        const totalSlides = isEnvelope ? 3 : 2;
        let slideIndex = 0;

        // --- ОСНОВНОЙ СЛАЙД ---
        if (isEnvelope) {
            const mainContent = `
                <div style="padding-top:20px; cursor:pointer; transition: transform 0.2s;"
                     onmouseenter="this.style.transform='rotate(-2deg) scale(1.02)'"
                     onmouseleave="this.style.transform='rotate(0) scale(1)'"
                     onclick="this.style.transform='scale(0.95)'; setTimeout(()=>{this.style.transform='scale(1)'},200)">
                    <div style="font-size:3.6rem; margin-bottom:4px;">✉️</div>
                    <div style="font-size:0.8rem; color:#7a6990; margin-top:8px; animation: pulseText 2s ease-in-out infinite;">
                        👆 Нажми на конверт
                    </div>
                </div>
            `;
            html += createSlide(mainContent, slideIndex, totalSlides, false);
            slideIndex++;

            const contentSlide = `
                <div style="display:flex; justify-content:center; margin:8px 0;">
                    <img src="${coverImage}" style="width:160px; height:160px; object-fit:contain;" alt="" />
                </div>
                <div style="font-size:1.3rem; font-weight:700; color:#1c0f27; margin:6px 0;">${mainTitle}</div>
                <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:14px;">
                    <button class="preview-btn preview-btn-1 ${anim1Class}" style="background: ${colors.accent}; color:white; border:none; padding:10px 24px; border-radius:40px; font-weight:600; font-size:0.9rem; cursor:default;">${btn1Text}</button>
                    <button class="preview-btn preview-btn-2 ${anim2Class}" style="background:#ede8f2; border:none; padding:10px 24px; border-radius:40px; font-weight:600; font-size:0.9rem; cursor:default; color:#2d1b3d; ${btn2TrapStyle}">${btn2Text}</button>
                </div>
            `;
            html += createSlide(contentSlide, slideIndex, totalSlides, false);
            slideIndex++;

        } else {
            const mainContent = `
                <div style="display:flex; justify-content:center; margin:8px 0;">
                    <img src="${coverImage}" style="width:160px; height:160px; object-fit:contain;" alt="" />
                </div>
                <div style="font-size:1.3rem; font-weight:700; color:#1c0f27; margin:6px 0;">${mainTitle}</div>
                <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:14px;">
                    <button class="preview-btn preview-btn-1 ${anim1Class}" style="background: ${colors.accent}; color:white; border:none; padding:10px 24px; border-radius:40px; font-weight:600; font-size:0.9rem; cursor:default;">${btn1Text}</button>
                    <button class="preview-btn preview-btn-2 ${anim2Class}" style="background:#ede8f2; border:none; padding:10px 24px; border-radius:40px; font-weight:600; font-size:0.9rem; cursor:default; color:#2d1b3d; ${btn2TrapStyle}">${btn2Text}</button>
                </div>
            `;
            html += createSlide(mainContent, slideIndex, totalSlides, false);
            slideIndex++;
        }

        // --- ЭКРАН ПОДТВЕРЖДЕНИЯ ---
        const confirmContent = `
            <div style="display:flex; justify-content:center; margin:8px 0;">
                <img src="${confirmImage}" style="width:160px; height:160px; object-fit:contain;" alt="" />
            </div>
            <div style="font-size:1.3rem; font-weight:700; color:${colors.text}; margin:6px 0;">${confirmTitle}</div>
            <div style="color:#5b4a6b; font-size:0.95rem; margin:4px 0;">📅 ${formatDate(eventDate)} в ${eventTime}</div>
        `;
        html += createSlide(confirmContent, slideIndex, totalSlides, true);

        previewContent.innerHTML = html;
    }

    // ============================================================
    // ГЕНЕРАЦИЯ ССЫЛКИ
    // ============================================================
    document.querySelector('.btn-generate').addEventListener('click', function() {
        const payload = {
            mode: document.getElementById('selectedMode').value || 'instant',
            style: document.getElementById('selectedStyle').value || 'romantic',
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
            eventTime: document.getElementById('eventTime').value || '19:00'
        };

        try {
            const encoded = encodePayload(payload);
            const link = buildInviteLink(encoded);

            resultLinkInput.value = link;
            resultOverlay.classList.add('show');
            showToast('Ссылка успешно создана!', 'success');
        } catch (error) {
            console.error('Ошибка:', error);
            showToast('Ошибка при создании ссылки', 'error');
        }
    });

    // ============================================================
    // КОПИРОВАНИЕ
    // ============================================================
    copyBtn.addEventListener('click', function() {
        const text = resultLinkInput.value;
        if (!text) return;

        copyToClipboard(text)
            .then(function() {
                showToast('Ссылка скопирована в буфер!', 'success');
            })
            .catch(function() {
                resultLinkInput.select();
                document.execCommand('copy');
                showToast('Ссылка скопирована в буфер!', 'success');
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
    // УТИЛИТЫ
    // ============================================================
    function encodePayload(payload) {
        const jsonString = JSON.stringify(payload);
        return btoa(unescape(encodeURIComponent(jsonString)));
    }

    function buildInviteLink(encodedData) {
        const currentPath = window.location.pathname;
        const baseUrl = window.location.origin + currentPath.replace(/\/[^/]*$/, '/invite.html');
        return baseUrl + '#data=' + encodedData;
    }

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
    // ПЕРВОНАЧАЛЬНОЕ ОБНОВЛЕНИЕ
    // ============================================================
    updatePreview();

    // ============================================================
    // РЕНДЕР ПИКЕРОВ КАРТИНОК (через компонент)
    // ============================================================
    ImagePicker.renderCovers('coverImagePicker', 'coverImage', updatePreview);
    ImagePicker.renderConfirms('confirmImagePicker', 'confirmImage', updatePreview);

});