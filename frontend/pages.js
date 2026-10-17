const API_BASE = (window.STORE_API_URL || '/api').replace(/\/+$/, '');
const USER_KEY = 'haven-market-user';
const CART_KEY = 'haven-market-cart';
const $ = (selector) => document.querySelector(selector);

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

let user = readStorage(USER_KEY, null);

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (user?.token) headers.Authorization = `Bearer ${user.token}`;
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error('Could not connect to the store server. Check that the backend is running and try again.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && user) {
      user = null;
      localStorage.removeItem(USER_KEY);
    }
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

function showMessage(target, message, isError = false) {
  if (!target) return;
  target.textContent = message;
  target.classList.toggle('is-error', isError);
  target.classList.toggle('is-success', !isError && Boolean(message));
}

function setCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function signInPath() {
  const page = document.body.dataset.page || 'profile';
  return `login.html?return=${encodeURIComponent(page)}`;
}

function redirectAfterAuth() {
  const page = new URLSearchParams(location.search).get('return');
  const allowed = ['checkout', 'profile', 'orders', 'admin', 'cart'];
  location.href = allowed.includes(page) ? `${page}.html` : 'index.html';
}

async function loadProductPage() {
  const root = $('#product-detail');
  const id = new URLSearchParams(location.search).get('id');
  if (!id) throw new Error('Choose a product from the collection to view its details.');
  const product = await request(`/products/${encodeURIComponent(id)}`);
  root.innerHTML = `
    <div class="detail-image"><img src="${escapeHTML(product.image || '')}" alt="${escapeHTML(product.name)}"></div>
    <div class="detail-copy"><p class="eyebrow">${escapeHTML(product.brand || product.category || 'Haven pick')}</p>
    <h1>${escapeHTML(product.name)}</h1><p class="detail-rating">★ ${Number(product.rating || 0).toFixed(1)}</p>
    <p>${escapeHTML(product.description || 'A thoughtful find for everyday living.')}</p>
    <p class="detail-price">${money(product.price)} ${product.oldPrice ? `<del>${money(product.oldPrice)}</del>` : ''}</p>
    <p class="stock-copy">${Number(product.stock) > 0 ? `${Number(product.stock)} in stock` : 'Currently out of stock'}</p>
    <button class="primary-button" id="add-detail" type="button" ${Number(product.stock) < 1 ? 'disabled' : ''}>Add to bag</button></div>`;
  $('#add-detail').addEventListener('click', () => {
    const cart = readStorage(CART_KEY, []);
    const item = cart.find((entry) => entry.productId === product._id);
    if (item) {
      if (item.qty >= product.stock) {
        showMessage($('#page-message'), `Only ${product.stock} available.`);
        return;
      }
      item.qty += 1;
    } else cart.push({ productId: product._id, qty: 1 });
    setCart(cart);
    showMessage($('#page-message'), 'Added to your bag.');
  });
}

async function loadCartPage() {
  const list = $('#cart-page-items');
  const cart = readStorage(CART_KEY, []);
  const products = await request('/products');
  const entries = cart.map((item) => ({
    ...item,
    product: products.find((product) => product._id === item.productId),
  })).filter((item) => item.product);
  const render = () => {
    if (!entries.length) {
      list.innerHTML = '<div class="empty-state"><span>♡</span><h3>Your bag is empty</h3><p>Browse the collection to find something lovely.</p><a class="primary-button" href="index.html#collection">Shop the collection</a></div>';
      $('#cart-page-total').textContent = money(0);
      $('#cart-page-checkout').classList.add('hidden');
      return;
    }
    list.innerHTML = entries.map(({ product, qty }) => `
      <article class="page-cart-item"><img src="${escapeHTML(product.image || '')}" alt="">
        <div><a href="product.html?id=${encodeURIComponent(product._id)}"><strong>${escapeHTML(product.name)}</strong></a><p>${money(product.price)}</p>
          <div class="quantity-controls"><button type="button" data-cart-change="${escapeHTML(product._id)}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${qty}</span><button type="button" data-cart-change="${escapeHTML(product._id)}" data-delta="1" aria-label="Increase quantity">+</button></div>
        </div><button class="remove-item" type="button" data-cart-remove="${escapeHTML(product._id)}" aria-label="Remove item">Remove</button>
      </article>`).join('');
    $('#cart-page-total').textContent = money(entries.reduce((total, item) => total + item.product.price * item.qty, 0));
    $('#cart-page-checkout').classList.remove('hidden');
    list.querySelectorAll('[data-cart-change]').forEach((button) => button.addEventListener('click', () => {
      const entry = entries.find((item) => item.product._id === button.dataset.cartChange);
      entry.qty += Number(button.dataset.delta);
      if (entry.qty < 1) entries.splice(entries.indexOf(entry), 1);
      if (entry && entry.qty > entry.product.stock) {
        entry.qty = entry.product.stock;
        showMessage($('#page-message'), `Only ${entry.product.stock} available.`);
      }
      setCart(entries.map(({ product, qty }) => ({ productId: product._id, qty })));
      render();
    }));
    list.querySelectorAll('[data-cart-remove]').forEach((button) => button.addEventListener('click', () => {
      const index = entries.findIndex((item) => item.product._id === button.dataset.cartRemove);
      entries.splice(index, 1);
      setCart(entries.map(({ product, qty }) => ({ productId: product._id, qty })));
      render();
    }));
  };
  render();
}

async function loadCheckoutPage() {
  if (!user?.token) {
    location.replace(signInPath());
    return;
  }
  const cart = readStorage(CART_KEY, []);
  if (!cart.length) {
    showMessage($('#page-message'), 'Your bag is empty. Add a product before checking out.', true);
    $('#checkout-submit').disabled = true;
    return;
  }
  const [profile, products] = await Promise.all([request('/users/profile'), request('/products')]);
  $('#shipping-address').value = profile.address || '';
  const validItems = cart.map((item) => ({ ...item, product: products.find((p) => p._id === item.productId) })).filter((item) => item.product);
  $('#checkout-summary').innerHTML = validItems.map(({ product, qty }) => `<div class="summary-line"><span>${escapeHTML(product.name)} × ${qty}</span><strong>${money(product.price * qty)}</strong></div>`).join('')
    + `<div class="summary-line summary-total"><span>Total</span><strong>${money(validItems.reduce((sum, item) => sum + item.product.price * item.qty, 0))}</strong></div>`;
  $('#checkout-page-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const button = $('#checkout-submit');
    button.disabled = true;
    showMessage($('#page-message'), '');
    try {
      let orderId = sessionStorage.getItem('haven-market-pending-order');
      if (!orderId) {
        const order = await request('/orders', {
          method: 'POST',
          body: JSON.stringify({
            items: validItems.map(({ product, qty }) => ({ productId: product._id, qty })),
            shippingAddress: form.get('shippingAddress'),
          }),
        });
        orderId = order._id;
        sessionStorage.setItem('haven-market-pending-order', orderId);
      }
      await request(`/payments/${encodeURIComponent(orderId)}/pay`, {
        method: 'POST',
        body: JSON.stringify({ cardNumber: String(form.get('cardNumber')).replace(/\s/g, '') }),
      });
      setCart([]);
      sessionStorage.removeItem('haven-market-pending-order');
      location.href = 'orders.html?placed=1';
    } catch (error) {
      showMessage($('#page-message'), error.message, true);
    } finally {
      button.disabled = false;
    }
  });
}

async function loadProfilePage() {
  if (!user?.token) {
    location.replace(signInPath());
    return;
  }
  const profile = await request('/users/profile');
  const form = $('#profile-form');
  form.elements.name.value = profile.name || '';
  form.elements.email.value = profile.email || '';
  form.elements.phone.value = profile.phone || '';
  form.elements.address.value = profile.address || '';
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = {
      name: data.get('name'),
      phone: data.get('phone'),
      address: data.get('address'),
    };
    if (data.get('password')) payload.password = data.get('password');
    const button = $('#profile-submit');
    button.disabled = true;
    showMessage($('#page-message'), '');
    try {
      const updated = await request('/users/profile', { method: 'PUT', body: JSON.stringify(payload) });
      user = { ...user, ...updated };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      form.elements.password.value = '';
      showMessage($('#page-message'), 'Your profile has been updated.');
    } catch (error) {
      showMessage($('#page-message'), error.message, true);
    } finally {
      button.disabled = false;
    }
  });
}

async function loadOrdersPage() {
  if (!user?.token) {
    location.replace(signInPath());
    return;
  }
  if (new URLSearchParams(location.search).has('placed')) showMessage($('#page-message'), 'Payment complete. Your order has been placed.');
  const orders = await request('/orders/mine');
  const root = $('#orders-page-list');
  root.innerHTML = orders.length ? orders.map((order) => `
    <article class="order-card page-order-card">
      <div class="order-card-top"><strong>Order ${escapeHTML(order._id.slice(-8).toUpperCase())}</strong><span class="order-status">${escapeHTML(order.status)}</span></div>
      <p>${new Date(order.createdAt).toLocaleDateString()} · ${order.items.reduce((sum, item) => sum + item.qty, 0)} items · ${money(order.total)}</p>
      <p><strong>Delivery:</strong> ${escapeHTML(order.shippingAddress)}</p>
      <div class="order-lines">${order.items.map((item) => `<span>${escapeHTML(item.name)} × ${item.qty} <strong>${money(item.price * item.qty)}</strong></span>`).join('')}</div>
      <p>Payment: ${escapeHTML(order.paymentStatus)}</p>
    </article>`).join('') : '<div class="empty-state"><span>♡</span><h3>No orders yet</h3><p>Your orders will appear here after checkout.</p><a class="primary-button" href="index.html#collection">Explore products</a></div>';
}

async function handleAuthPage() {
  const form = $('#auth-page-form');
  const register = document.body.dataset.page === 'register';
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const button = $('#auth-page-submit');
    button.disabled = true;
    showMessage($('#page-message'), '');
    try {
      user = await request(`/auth/${register ? 'register' : 'login'}`, {
        method: 'POST',
        body: JSON.stringify({
          ...(register ? { name: data.get('name') } : {}),
          email: data.get('email'),
          password: data.get('password'),
        }),
      });
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      redirectAfterAuth();
    } catch (error) {
      showMessage($('#page-message'), error.message, true);
    } finally {
      button.disabled = false;
    }
  });
}

async function loadAdminPage() {
  if (!user?.token) {
    location.replace('login.html?return=admin');
    return;
  }
  if (user.role !== 'admin') {
    showMessage($('#admin-message'), 'Admin access only. Sign in with an administrator account to manage the store.', true);
    $('#admin-content').classList.add('hidden');
    return;
  }
  const [stats, products, orders, users] = await Promise.all([
    request('/admin/stats'), request('/products'), request('/admin/orders'), request('/admin/users'),
  ]);
  $('#admin-stats').innerHTML = [
    ['Revenue', money(stats.revenue)], ['Orders', stats.orders], ['Products', stats.products], ['Customers', stats.users],
  ].map(([label, value]) => `<article class="stat-card"><span>${label}</span><strong>${value}</strong></article>`).join('');
  $('#admin-products').innerHTML = products.length ? products.map((product) => `
    <tr><td>${escapeHTML(product.name)}</td><td>${escapeHTML(product.category)}</td><td>${money(product.price)}</td><td>${product.stock}</td>
    <td><button type="button" class="table-action" data-edit-product="${escapeHTML(product._id)}">Edit</button> <button type="button" class="table-action danger-text" data-delete-product="${escapeHTML(product._id)}">Delete</button></td></tr>`).join('') : '<tr><td colspan="5">No products yet.</td></tr>';
  $('#admin-orders').innerHTML = orders.length ? orders.map((order) => `
    <tr><td>${escapeHTML(order._id.slice(-8).toUpperCase())}</td><td>${escapeHTML(order.user?.name || 'Customer')}</td><td>${money(order.total)}</td>
    <td><select data-order-status="${escapeHTML(order._id)}" aria-label="Order status">${['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'].map((status) => `<option ${status === order.status ? 'selected' : ''}>${status}</option>`).join('')}</select></td></tr>`).join('') : '<tr><td colspan="4">No orders yet.</td></tr>';
  $('#admin-users').innerHTML = users.length ? users.map((customer) => `
    <tr><td>${escapeHTML(customer.name)}</td><td>${escapeHTML(customer.email)}</td><td>${escapeHTML(customer.role)}</td><td>${customer._id === user._id ? 'You' : `<select data-user-role="${escapeHTML(customer._id)}" aria-label="Role for ${escapeHTML(customer.name)}"><option value="user" ${customer.role === 'user' ? 'selected' : ''}>User</option><option value="admin" ${customer.role === 'admin' ? 'selected' : ''}>Admin</option></select> <button type="button" class="table-action danger-text" data-delete-user="${escapeHTML(customer._id)}">Delete</button>`}</td></tr>`).join('') : '<tr><td colspan="4">No customers yet.</td></tr>';

  $('#product-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const id = form.dataset.productId;
    const button = $('#product-submit');
    button.disabled = true;
    try {
      const payload = new FormData(form);
      await request(id ? `/products/${encodeURIComponent(id)}` : '/products', {
        method: id ? 'PUT' : 'POST', body: payload,
      });
      location.reload();
    } catch (error) {
      showMessage($('#admin-message'), error.message, true);
    } finally {
      button.disabled = false;
    }
  });
  $('#product-reset').addEventListener('click', () => {
    $('#product-form').reset();
    delete $('#product-form').dataset.productId;
    $('#product-submit').textContent = 'Add product';
  });
  $('#admin-products').querySelectorAll('[data-edit-product]').forEach((button) => button.addEventListener('click', () => {
    const product = products.find((entry) => entry._id === button.dataset.editProduct);
    const form = $('#product-form');
    form.dataset.productId = product._id;
    ['name', 'brand', 'category', 'price', 'oldPrice', 'description', 'stock', 'imageUrl', 'image'].forEach((field) => {
      if (form.elements[field]) form.elements[field].value = field === 'image' ? '' : field === 'imageUrl' ? product.image || '' : product[field] ?? '';
    });
    $('#product-submit').textContent = 'Save product changes';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  $('#admin-products').querySelectorAll('[data-delete-product]').forEach((button) => button.addEventListener('click', async () => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await request(`/products/${encodeURIComponent(button.dataset.deleteProduct)}`, { method: 'DELETE' });
      location.reload();
    } catch (error) { showMessage($('#admin-message'), error.message, true); }
  }));
  $('#admin-orders').querySelectorAll('[data-order-status]').forEach((select) => select.addEventListener('change', async () => {
    try {
      await request(`/admin/orders/${encodeURIComponent(select.dataset.orderStatus)}/status`, {
        method: 'PUT', body: JSON.stringify({ status: select.value }),
      });
      showMessage($('#admin-message'), 'Order status updated.');
    } catch (error) { showMessage($('#admin-message'), error.message, true); }
  }));
  $('#admin-users').querySelectorAll('[data-user-role]').forEach((select) => select.addEventListener('change', async () => {
    try {
      await request(`/admin/users/${encodeURIComponent(select.dataset.userRole)}/role`, {
        method: 'PUT', body: JSON.stringify({ role: select.value }),
      });
      showMessage($('#admin-message'), 'User role updated.');
    } catch (error) { showMessage($('#admin-message'), error.message, true); }
  }));
  $('#admin-users').querySelectorAll('[data-delete-user]').forEach((button) => button.addEventListener('click', async () => {
    if (!window.confirm('Delete this user account?')) return;
    try {
      await request(`/admin/users/${encodeURIComponent(button.dataset.deleteUser)}`, { method: 'DELETE' });
      location.reload();
    } catch (error) { showMessage($('#admin-message'), error.message, true); }
  }));
}

async function initPage() {
  const handlers = {
    product: loadProductPage,
    cart: loadCartPage,
    checkout: loadCheckoutPage,
    profile: loadProfilePage,
    orders: loadOrdersPage,
    login: handleAuthPage,
    register: handleAuthPage,
    admin: loadAdminPage,
  };
  const handler = handlers[document.body.dataset.page];
  if (!handler) return;
  try {
    await handler();
  } catch (error) {
    showMessage($('#page-message') || $('#admin-message'), error.message, true);
  }
}

initPage();
