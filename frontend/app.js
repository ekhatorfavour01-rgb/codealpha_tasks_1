const API_BASE = (window.STORE_API_URL || 'https://ecommerce-store-codealpha.onrender.com/api').replace(/\/+$/, '');
const CART_KEY = 'haven-market-cart';
const USER_KEY = 'haven-market-user';

const state = {
  products: [],
  categories: [],
  category: 'all',
  search: '',
  sort: 'featured',
  cart: readStorage(CART_KEY, []),
  user: readStorage(USER_KEY, null),
  favorites: readStorage('haven-market-favorites', []),
  pendingOrderId: null,
  toastTimer: null,
};

const $ = (selector) => document.querySelector(selector);
const productGrid = $('#product-grid');
const loadingState = $('#loading-state');
const apiError = $('#api-error');
const emptyState = $('#empty-state');

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function money(value) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2600);
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (state.user?.token) headers.Authorization = `Bearer ${state.user.token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error('Could not connect to the store server. Check that the backend is running and try again.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && state.user) {
      state.user = null;
      localStorage.removeItem(USER_KEY);
      renderAccount();
    }
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

async function loadCatalog() {
  loadingState.classList.remove('hidden');
  apiError.classList.add('hidden');
  productGrid.innerHTML = '';
  try {
    const [products, categories] = await Promise.all([
      request('/products'),
      request('/products/categories'),
    ]);
    state.products = products;
    state.categories = categories;
    renderCategories();
    renderProducts();
    renderCart();
  } catch (error) {
    apiError.innerHTML = `${escapeHTML(error.message)} <button class="secondary-button" id="retry-load" type="button">Try again</button>`;
    apiError.classList.remove('hidden');
    $('#retry-load').addEventListener('click', loadCatalog);
  } finally {
    loadingState.classList.add('hidden');
  }
}

function renderCategories() {
  const categories = ['all', ...state.categories];
  $('#category-list').innerHTML = categories.map((category) => `
    <button class="category-button ${category === state.category ? 'active' : ''}" type="button" data-category="${escapeHTML(category)}">
      ${category === 'all' ? 'Everything' : escapeHTML(category)}
    </button>`).join('');
  $('#category-list').querySelectorAll('[data-category]').forEach((button) => {
    button.addEventListener('click', () => {
      state.category = button.dataset.category;
      renderCategories();
      renderProducts();
    });
  });
}

function matchingProducts() {
  const search = state.search.trim().toLowerCase();
  const filtered = state.products.filter((product) => {
    const categoryMatch = state.category === 'all' || product.category === state.category;
    const textMatch = !search || [product.name, product.brand, product.description, product.category]
      .some((value) => String(value || '').toLowerCase().includes(search));
    return categoryMatch && textMatch;
  });
  const sorters = {
    'price-low': (a, b) => a.price - b.price,
    'price-high': (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating,
  };
  return sorters[state.sort] ? filtered.sort(sorters[state.sort]) : filtered;
}

function renderProducts() {
  const products = matchingProducts();
  $('#result-message').textContent = `${products.length} ${products.length === 1 ? 'lovely find' : 'lovely finds'}`;
  emptyState.classList.toggle('hidden', products.length > 0);
  productGrid.classList.toggle('hidden', products.length === 0);
  productGrid.innerHTML = products.map((product) => {
    const id = escapeHTML(product._id);
    const image = product.image || 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=700&q=80';
    const favorite = state.favorites.includes(product._id);
    const soldOut = Number(product.stock) < 1;
    return `
      <article class="product-card">
        <div class="product-image-wrap">
          <img class="product-image" src="${escapeHTML(image)}" alt="${escapeHTML(product.name)}" loading="lazy">
          ${product.badge ? `<span class="product-badge">${escapeHTML(product.badge)}</span>` : ''}
          <button class="favorite-button ${favorite ? 'active' : ''}" type="button" data-favorite="${id}" aria-label="${favorite ? 'Remove from' : 'Add to'} favorites">${favorite ? '♥' : '♡'}</button>
        </div>
        <div class="product-info">
          <div class="product-topline"><span>${escapeHTML(product.brand || product.category || 'Haven pick')}</span><span class="product-rating">★ ${Number(product.rating || 0).toFixed(1)}</span></div>
          <h3 class="product-name" title="${escapeHTML(product.name)}"><a href="product.html?id=${encodeURIComponent(product._id)}">${escapeHTML(product.name)}</a></h3>
          <div class="product-bottom">
            <span class="price-wrap"><strong class="price">${money(product.price)}</strong>${product.oldPrice ? `<del class="old-price">${money(product.oldPrice)}</del>` : ''}</span>
            <button class="add-button" type="button" data-add="${id}" ${soldOut ? 'disabled aria-label="Out of stock"' : 'aria-label="Add to bag"'}>${soldOut ? '–' : '+'}</button>
          </div>
        </div>
      </article>`;
  }).join('');

  productGrid.querySelectorAll('[data-add]').forEach((button) => button.addEventListener('click', () => addToCart(button.dataset.add)));
  productGrid.querySelectorAll('[data-favorite]').forEach((button) => button.addEventListener('click', () => toggleFavorite(button.dataset.favorite)));
}

function toggleFavorite(id) {
  state.favorites = state.favorites.includes(id)
    ? state.favorites.filter((favorite) => favorite !== id)
    : [...state.favorites, id];
  localStorage.setItem('haven-market-favorites', JSON.stringify(state.favorites));
  renderProducts();
}

function addToCart(id) {
  const product = state.products.find((item) => item._id === id);
  if (!product) return;
  const existing = state.cart.find((item) => item.productId === id);
  if (existing) {
    if (existing.qty >= product.stock) {
      showToast(`Only ${product.stock} available for ${product.name}.`);
      return;
    }
    existing.qty += 1;
  } else {
    state.cart.push({ productId: id, qty: 1 });
  }
  saveCart();
  showToast(`${product.name} added to your bag.`);
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  renderCart();
}

function cartProducts() {
  return state.cart.map((item) => ({
    ...item,
    product: state.products.find((product) => product._id === item.productId),
  })).filter((item) => item.product);
}

function renderCart() {
  const products = cartProducts();
  const quantity = products.reduce((sum, item) => sum + item.qty, 0);
  const total = products.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  $('#cart-count').textContent = quantity;
  $('#drawer-count').textContent = `(${quantity})`;
  $('#cart-subtotal').textContent = money(total);
  $('#cart-empty').classList.toggle('hidden', products.length > 0);
  $('#cart-footer').classList.toggle('hidden', products.length === 0);
  $('#cart-items').innerHTML = products.map(({ product, qty }) => `
    <div class="cart-item">
      <img src="${escapeHTML(product.image || '')}" alt="${escapeHTML(product.name)}">
      <div><h3>${escapeHTML(product.name)}</h3><span class="cart-item-price">${money(product.price)}</span>
        <div class="quantity-controls">
          <button type="button" data-quantity="${escapeHTML(product._id)}" data-change="-1" aria-label="Decrease quantity">−</button>
          <span>${qty}</span>
          <button type="button" data-quantity="${escapeHTML(product._id)}" data-change="1" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <button class="remove-item" type="button" data-remove="${escapeHTML(product._id)}" aria-label="Remove ${escapeHTML(product.name)}">×</button>
    </div>`).join('');
  $('#cart-items').querySelectorAll('[data-quantity]').forEach((button) => {
    button.addEventListener('click', () => changeQuantity(button.dataset.quantity, Number(button.dataset.change)));
  });
  $('#cart-items').querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      state.cart = state.cart.filter((item) => item.productId !== button.dataset.remove);
      saveCart();
    });
  });
}

function changeQuantity(id, change) {
  const item = state.cart.find((entry) => entry.productId === id);
  const product = state.products.find((entry) => entry._id === id);
  if (!item || !product) return;
  item.qty += change;
  if (item.qty < 1) state.cart = state.cart.filter((entry) => entry.productId !== id);
  else if (item.qty > product.stock) {
    item.qty = product.stock;
    showToast(`Only ${product.stock} available for ${product.name}.`);
  }
  saveCart();
}

function openCart() {
  $('#overlay').classList.add('visible');
  $('#overlay').classList.remove('hidden');
  requestAnimationFrame(() => $('#cart-drawer').classList.add('open'));
  $('#cart-drawer').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  $('#cart-drawer').classList.remove('open');
  $('#cart-drawer').setAttribute('aria-hidden', 'true');
  $('#overlay').classList.remove('visible');
  window.setTimeout(() => $('#overlay').classList.add('hidden'), 250);
  document.body.style.overflow = '';
}

function renderAccount() {
  $('#account-label').textContent = state.user?.name?.split(' ')[0] || 'Sign in';
  $('#account-button').title = state.user ? `Signed in as ${state.user.email}` : 'Sign in or create an account';
}

function openAuth() {
  if (state.user) {
    $('#orders-button').classList.remove('hidden');
    $('#profile-link').classList.remove('hidden');
    $('#admin-link').classList.toggle('hidden', state.user.role !== 'admin');
    $('#auth-form').classList.add('hidden');
    $('.switch-auth').classList.add('hidden');
    $('#auth-title').textContent = `Hello, ${state.user.name.split(' ')[0]}.`;
    $('#auth-copy').textContent = `${state.user.email} · ${state.user.role}`;
  } else {
    $('#orders-button').classList.add('hidden');
    $('#profile-link').classList.add('hidden');
    $('#admin-link').classList.add('hidden');
    $('#auth-form').classList.remove('hidden');
    $('.switch-auth').classList.remove('hidden');
  }
  $('#auth-modal').showModal();
}

function setAuthMode(register) {
  $('#auth-title').textContent = register ? 'Make yourself at home.' : 'Come on in.';
  $('#auth-copy').textContent = register ? 'Create an account to keep track of your lovely finds.' : 'Sign in to see your orders and make checkout a little easier.';
  $('#name-field').classList.toggle('hidden', !register);
  $('#name-field input').required = register;
  $('#auth-submit').textContent = register ? 'Create account' : 'Sign in';
  $('#switch-auth-copy').textContent = register ? 'Already have an account?' : 'New around here?';
  $('#switch-auth').textContent = register ? 'Sign in' : 'Create an account';
  $('#auth-form').dataset.mode = register ? 'register' : 'login';
  $('#auth-message').textContent = '';
  $('#auth-form').reset();
}

async function submitAuth(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const mode = event.currentTarget.dataset.mode || 'login';
  const button = $('#auth-submit');
  button.disabled = true;
  $('#auth-message').textContent = '';
  try {
    const user = await request(`/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify({
        name: form.get('name'),
        email: form.get('email'),
        password: form.get('password'),
      }),
    });
    state.user = user;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    renderAccount();
    $('#auth-modal').close();
    showToast(`Welcome${user.name ? `, ${user.name.split(' ')[0]}` : ''}!`);
  } catch (error) {
    $('#auth-message').textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

async function checkout(event) {
  event.preventDefault();
  const checkoutForm = event.currentTarget;
  const form = new FormData(checkoutForm);
  const cardNumber = String(form.get('cardNumber')).replace(/\s/g, '');
  const button = $('#place-order-button');
  button.disabled = true;
  $('#checkout-message').textContent = '';
  try {
    if (!state.user) {
      $('#checkout-modal').close();
      openAuth();
      showToast('Sign in first, then your bag will be right here.');
      return;
    }
    const items = cartProducts().map(({ productId, qty }) => ({ productId, qty }));
    if (!items.length) throw new Error('Your bag is empty.');
    const order = state.pendingOrderId
      ? { _id: state.pendingOrderId }
      : await request('/orders', {
        method: 'POST',
        body: JSON.stringify({ items, shippingAddress: form.get('shippingAddress') }),
      });
    state.pendingOrderId = order._id;
    try {
      await request(`/payments/${order._id}/pay`, {
        method: 'POST',
        body: JSON.stringify({ cardNumber }),
      });
      state.cart = [];
      state.pendingOrderId = null;
      saveCart();
      $('#checkout-modal').close();
      closeCart();
      checkoutForm.reset();
      showToast('Your order is on its way. Thanks for shopping with us!');
    } catch (error) {
      $('#checkout-message').textContent = `Order ${order._id} was created, but payment did not complete: ${error.message}. Sign in and try a new checkout.`;
    }
  } catch (error) {
    $('#checkout-message').textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

async function loadOrders() {
  $('#orders-list').innerHTML = '<div class="loading-state"><span class="loader"></span><p>Gathering your orders...</p></div>';
  $('#orders-modal').showModal();
  try {
    const orders = await request('/orders/mine');
    $('#orders-list').innerHTML = orders.length ? orders.map((order) => `
      <article class="order-card">
        <div class="order-card-top"><span>Order ${escapeHTML(order._id.slice(-8).toUpperCase())}</span><span class="order-status">${escapeHTML(order.status)}</span></div>
        <p>${new Date(order.createdAt).toLocaleDateString()} · ${order.items.reduce((sum, item) => sum + item.qty, 0)} items · ${money(order.total)}</p>
      </article>`).join('') : '<div class="empty-state"><span>♡</span><h3>No orders yet</h3><p>Your next good find is just around the corner.</p></div>';
  } catch (error) {
    $('#orders-list').innerHTML = `<p class="form-message">${escapeHTML(error.message)}</p>`;
  }
}

$('#search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  state.search = $('#search-input').value;
  renderProducts();
  $('#collection').scrollIntoView({ behavior: 'smooth' });
});
$('#search-input').addEventListener('input', () => {
  state.search = $('#search-input').value;
  renderProducts();
});
$('#sort-select').addEventListener('change', (event) => {
  state.sort = event.currentTarget.value;
  renderProducts();
});
$('#clear-filters').addEventListener('click', () => {
  state.category = 'all';
  state.search = '';
  $('#search-input').value = '';
  renderCategories();
  renderProducts();
});
$('#cart-button').addEventListener('click', openCart);
$('#close-cart').addEventListener('click', closeCart);
$('#continue-shopping').addEventListener('click', closeCart);
$('#overlay').addEventListener('click', closeCart);
$('#account-button').addEventListener('click', openAuth);
$('#auth-form').addEventListener('submit', submitAuth);
$('#switch-auth').addEventListener('click', () => setAuthMode($('#auth-form').dataset.mode !== 'register'));
$('#orders-button').addEventListener('click', () => {
  $('#auth-modal').close();
  loadOrders();
});
$('#checkout-button').addEventListener('click', () => {
  closeCart();
  if (!state.user) {
    openAuth();
    showToast('Sign in to continue with checkout.');
    return;
  }
  $('#checkout-modal').showModal();
});
$('#checkout-form').addEventListener('submit', checkout);
document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => $(`#${button.dataset.close}`).close());
});
document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});
$('#newsletter-form').addEventListener('submit', (event) => {
  event.preventDefault();
  event.currentTarget.reset();
  showToast('Newsletter sign-up is coming soon; it is not connected to the store API yet.');
});
$('#year').textContent = new Date().getFullYear();
renderAccount();
renderCart();
loadCatalog();
