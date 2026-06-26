/* ============================================================
   IGNIS — store.js
   Общий модуль: загрузка товаров (products.json) + корзина (localStorage).
   Подключается на каталоге, странице товара, в корзине и checkout.
   ============================================================ */

const IGNIS_STORE = (() => {

  const CART_KEY = 'ignis_cart';   // ключ в localStorage
  let _productsCache = null;       // кэш products.json в рамках страницы

  /* ---------- Товары ---------- */

  // Загружает products.json (один раз за страницу)
  async function fetchProducts() {
    if (_productsCache) return _productsCache;
    const res = await fetch('products.json');
    if (!res.ok) throw new Error('Не удалось загрузить products.json');
    const data = await res.json();
    _productsCache = data.products || [];
    return _productsCache;
  }

  // Возвращает один товар по id
  async function getProduct(id) {
    const products = await fetchProducts();
    return products.find(p => p.id === id) || null;
  }

  /* ---------- Корзина (localStorage) ----------
     Формат: [{ id, size, qty }, ...] */

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    // оповещаем интерфейс (счётчик в шапке и т.д.)
    document.dispatchEvent(new CustomEvent('ignis:cart-changed'));
  }

  // Добавить товар. Если такой id+size уже есть — увеличиваем количество.
  function addItem(id, size, qty = 1) {
    const cart = getCart();
    const existing = cart.find(item => item.id === id && item.size === size);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ id, size, qty });
    }
    saveCart(cart);
  }

  function updateQty(index, qty) {
    const cart = getCart();
    if (!cart[index]) return;
    cart[index].qty = Math.max(1, qty);
    saveCart(cart);
  }

  function removeItem(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
  }

  function clearCart() {
    localStorage.removeItem(CART_KEY);
    document.dispatchEvent(new CustomEvent('ignis:cart-changed'));
  }

  // Суммарное количество единиц (для счётчика в шапке)
  function count() {
    return getCart().reduce((sum, item) => sum + item.qty, 0);
  }

  /* ---------- Утилиты ---------- */

  // 6000 -> "6 000 ₽"
  function formatPrice(value, currency = 'RUB') {
    const symbol = currency === 'RUB' ? '₽' : currency;
    return value.toLocaleString('ru-RU') + ' ' + symbol;
  }

  // Текст статуса дропа
  function statusLabel(status) {
    switch (status) {
      case 'available': return 'Предзаказ';
      case 'closed':    return 'Дроп завершён';
      case 'upcoming':  return 'Скоро';
      default:          return '';
    }
  }

  return {
    fetchProducts, getProduct,
    getCart, addItem, updateQty, removeItem, clearCart, count,
    formatPrice, statusLabel
  };

})();
