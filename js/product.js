/* ============================================================
   IGNIS — product.js
   Страница товара. Данные берутся из products.json по ?id=...
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('product-root');
  if (!root) return;

  // id из URL: product.html?id=shirt-001
  const id = new URLSearchParams(location.search).get('id');

  let product;
  try {
    product = await IGNIS_STORE.getProduct(id);
  } catch (err) {
    root.innerHTML = errorBlock('Не удалось загрузить товар. Откройте сайт через локальный сервер (см. README).');
    console.error(err);
    return;
  }

  if (!product) {
    root.innerHTML = errorBlock('Товар не найден. <a href="catalog.html" style="color:var(--color-chocolate)">Вернуться в каталог</a>.');
    return;
  }

  render(product);
});


function errorBlock(msg) {
  return `<p style="padding:60px 32px;color:var(--color-warm-gray)">${msg}</p>`;
}


function render(p) {
  const root = document.getElementById('product-root');
  document.title = `${p.name} — IGNIS`;

  const images = p.images && p.images.length ? p.images : [{ src: '', alt: p.name }];

  // --- Галерея ---
  const galleryHTML = `
    <div class="gallery">
      <div class="gallery__thumbs" id="thumbs">
        ${images.map((img, i) => `
          <button class="gallery__thumb ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Фото ${i + 1}">
            <img src="${img.src}" alt="${img.alt}" loading="lazy" />
          </button>`).join('')}
      </div>
      <div class="gallery__main">
        <img id="gallery-main-img" src="${images[0].src}" alt="${images[0].alt}" />
      </div>
    </div>`;

  // --- Статус дропа определяет блок действия ---
  const statusClass = p.status === 'closed' ? 'product-info__status--closed'
                    : p.status === 'upcoming' ? 'product-info__status--upcoming'
                    : '';

  let ctaHTML = '';
  if (p.status === 'available') {
    const sizes = p.sizes || ['S', 'M', 'L'];
    // если размер один — показываем минималистичную подпись, а не кнопки выбора
    const sizeHTML = sizes.length === 1
      ? `<span class="size-single" data-size="${sizes[0]}">${sizes[0]}</span>`
      : `<div class="size-options" id="size-options">
          ${sizes.map(s => `<button class="size-option" data-size="${s}">${s}</button>`).join('')}
        </div>`;

    ctaHTML = `
      <div class="size-select">
        <p class="size-select__label">Размер</p>
        ${sizeHTML}
      </div>
      <button class="btn" id="add-to-cart">Оформить предзаказ</button>
      <p class="product-cta__note">Предзаказ. Отправка через ${p.drop_eta || '2 недели'}</p>`;
  } else if (p.status === 'closed') {
    ctaHTML = `
      <button class="btn" disabled>Дроп завершён</button>
      <p class="product-cta__note">Этот дроп закрыт. Оставьте email — сообщим о следующем.</p>
      <form class="notify" id="notify-form">
        <input type="email" placeholder="email" required aria-label="email" />
        <button class="btn btn--ghost" style="width:auto;white-space:nowrap;" type="submit">Уведомить</button>
      </form>`;
  } else { // upcoming
    ctaHTML = `
      <button class="btn" disabled>Скоро</button>
      <p class="product-cta__note">Дроп ещё не открыт. Следите за анонсами.</p>`;
  }

  // --- Таблица замеров (гибкий формат: массив {label, value}) ---
  const measures = Array.isArray(p.measurements) ? p.measurements : [];
  const measuresHTML = `
    <table class="spec-table">
      ${measures.map(row => `<tr><td>${row.label}</td><td>${row.value}</td></tr>`).join('')}
    </table>`;

  // --- Информация о товаре ---
  const infoHTML = `
    <div class="product-info reveal">
      <h1 class="product-info__name">${p.name}</h1>
      <p class="product-info__price">${IGNIS_STORE.formatPrice(p.price, p.currency)}</p>
      <span class="product-info__status ${statusClass}">${IGNIS_STORE.statusLabel(p.status)}</span>

      <p class="product-info__desc">${p.description || ''}</p>

      ${ctaHTML}

      ${p.color ? `
      <div class="product-block">
        <p class="product-block__title">Цвет</p>
        <p class="product-block__text">${p.color}</p>
      </div>` : ''}

      <div class="product-block">
        <p class="product-block__title">Замеры</p>
        ${measuresHTML}
      </div>

      <div class="product-block">
        <p class="product-block__title">Состав</p>
        <p class="product-block__text">${p.composition || '—'}</p>
      </div>

      ${p.fit_note ? `
      <div class="product-block">
        <p class="product-block__title">О посадке</p>
        <p class="product-block__text">${p.fit_note}</p>
      </div>` : ''}
    </div>`;

  root.innerHTML = galleryHTML + infoHTML;

  initGallery();
  initInteractions(p);
}


/* ---------- Галерея: клик по превью меняет главное фото ---------- */
function initGallery() {
  const mainImg = document.getElementById('gallery-main-img');
  const thumbs = document.querySelectorAll('.gallery__thumb');

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const img = thumb.querySelector('img');
      mainImg.src = img.src;
      mainImg.alt = img.alt;
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  // reveal info-блока
  const info = document.querySelector('.product-info.reveal');
  if (info) requestAnimationFrame(() => info.classList.add('visible'));
}


/* ---------- Выбор размера, добавление в корзину, notify ---------- */
function initInteractions(p) {
  let selectedSize = null;

  // одиночный размер (One size) — выбран по умолчанию, выбирать нечего
  const single = document.querySelector('.size-single');
  if (single) selectedSize = single.dataset.size;

  // выбор размера (когда вариантов несколько)
  const sizeOptions = document.getElementById('size-options');
  if (sizeOptions) {
    sizeOptions.querySelectorAll('.size-option').forEach(btn => {
      btn.addEventListener('click', () => {
        sizeOptions.querySelectorAll('.size-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSize = btn.dataset.size;
      });
    });
  }

  // добавить в корзину
  const addBtn = document.getElementById('add-to-cart');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      if (!selectedSize) {
        showToast('Выберите размер');
        return;
      }
      IGNIS_STORE.addItem(p.id, selectedSize, 1);
      showToast('Добавлено в корзину');
    });
  }

  // форма "уведомить о следующем дропе" (для closed)
  const notifyForm = document.getElementById('notify-form');
  if (notifyForm) {
    notifyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // TODO: отправка email на бэкенд/рассылку — подключить webhook или email-сервис.
      const email = notifyForm.querySelector('input').value;
      console.log('[IGNIS] notify-запрос на следующий дроп:', email);
      notifyForm.innerHTML = '<p class="product-block__text">Спасибо — сообщим о следующем дропе.</p>';
    });
  }
}


/* ---------- Toast ---------- */
let toastTimer;
function showToast(text) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}
