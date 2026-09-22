// ============================================================
// IMAGE PICKER — Компонент выбора картинок
// ============================================================

const ImagePicker = (function() {

    // ============================================================
    // КОНФИГУРАЦИЯ — здесь меняешь картинки
    // ============================================================
    const IMAGES = {
        covers: [
            { src: 'assets/images/covers/1.png',      alt: '1' },
            { src: 'assets/images/covers/2.png',      alt: '2' },
            { src: 'assets/images/covers/3.gif',      alt: '3' },
            { src: 'assets/images/covers/4.gif',      alt: '4' }
        ],
        confirms: [
            { src: 'assets/images/confirms/1.png',     alt: '1' },
            { src: 'assets/images/confirms/2.png',     alt: '2' },
            { src: 'assets/images/confirms/3.gif',     alt: '3' },
            { src: 'assets/images/confirms/4.gif',     alt: '4' }
        ]
    };

    // ============================================================
    // ЛОГИКА — рендер пикера
    // ============================================================
    function render(pickerId, hiddenInputId, images, onUpdate) {
        const picker = document.getElementById(pickerId);
        const hiddenInput = document.getElementById(hiddenInputId);
        if (!picker || !hiddenInput) return;

        // Рендерим HTML
        picker.innerHTML = images.map(function(img, index) {
            const activeClass = index === 0 ? 'active' : '';
            return `
                <div class="image-option ${activeClass}" data-image="${img.src}">
                    <img src="${img.src}" alt="${img.alt}" />
                </div>
            `;
        }).join('');

        // Устанавливаем значение по умолчанию
        if (images.length > 0) {
            hiddenInput.value = images[0].src;
        }

        // Навешиваем обработчики
        picker.querySelectorAll('.image-option').forEach(function(option) {
            option.addEventListener('click', function() {
                picker.querySelectorAll('.image-option').forEach(function(opt) {
                    opt.classList.remove('active');
                });
                this.classList.add('active');
                hiddenInput.value = this.dataset.image;
                if (typeof onUpdate === 'function') onUpdate();
            });
        });
    }

    // ============================================================
    // ПУБЛИЧНОЕ API
    // ============================================================
    return {
        // Рендер пикера обложек
        renderCovers: function(pickerId, hiddenInputId, onUpdate) {
            render(pickerId, hiddenInputId, IMAGES.covers, onUpdate);
        },

        // Рендер пикера подтверждений
        renderConfirms: function(pickerId, hiddenInputId, onUpdate) {
            render(pickerId, hiddenInputId, IMAGES.confirms, onUpdate);
        }
    };

})();