/* ============================================================
   IGNIS — catalog.js
   Рендер сетки товаров на catalog.html из products.json.
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;

  try {
    const products = await IGNIS_STORE.fetchProducts();

    grid.innerHTML = products.map(p => {
      const cover = (p.images && p.images[0]) ? p.images[0] : { src: '', alt: p.name };
      const statusText = IGNIS_STORE.statusLabel(p.status);
      const statusClass = p.status === 'closed' ? 'product-card__status--closed'
                        : p.status === 'upcoming' ? 'product-card__status--upcoming'
                        : '';

      return `
        <a class="product-card reveal" href="product.html?id=${encodeURIComponent(p.id)}">
          <div class="product-card__img-wrap">
            <span class="product-card__status ${statusClass}">${statusText}</span>
            <img src="${cover.src}" alt="${cover.alt}" loading="lazy" />
          </div>
          <div class="product-card__caption">
            <span class="product-card__name">${p.name}</span>
            <span class="product-card__price">${IGNIS_STORE.formatPrice(p.price, p.currency)}</span>
          </div>
        </a>`;
    }).join('');

    // подключаем scroll-reveal к только что добавленным карточкам
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
    }, { threshold: 0.1 });
    grid.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  } catch (err) {
    grid.innerHTML = `<p style="color:var(--color-warm-gray)">Не удалось загрузить товары. Откройте сайт через локальный сервер (см. README).</p>`;
    console.error(err);
  }
});
