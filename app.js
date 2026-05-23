const CART_KEY = "kims_cart";
const STRIPE_KEY = "kims_stripe_link";
const PRODUCTS_KEY = "kims_products";
const OWNER_AUTH_KEY = "kims_owner_authenticated";
const OWNER_PASSCODE = "coach-admin-2026";

const defaultProducts = [
  { id: "agility-kit", name: "Speed Agility Kit", price: 59.99, description: "Cones, ladder, and bands for movement sessions." },
  { id: "power-bands", name: "Resistance Power Bands", price: 29.99, description: "Warmup and strength band set." },
  { id: "recovery-roller", name: "Recovery Roller", price: 34.99, description: "Compact roller for post-session recovery." }
];

const productListEl = document.getElementById("product-list");
const cartItemsEl = document.getElementById("cart-items");
const subtotalEl = document.getElementById("subtotal");
const taxEl = document.getElementById("tax");
const totalEl = document.getElementById("total");
const stripeInputEl = document.getElementById("stripe-link");
const checkoutBtnEl = document.getElementById("checkout-btn");
const clearCartBtnEl = document.getElementById("clear-cart-btn");

const ownerLoginFormEl = document.getElementById("owner-login-form");
const ownerPasscodeEl = document.getElementById("owner-passcode");
const ownerStatusEl = document.getElementById("owner-status");
const ownerPanelEl = document.getElementById("owner-panel");
const ownerAddFormEl = document.getElementById("owner-add-form");
const ownerProductNameEl = document.getElementById("owner-product-name");
const ownerProductPriceEl = document.getElementById("owner-product-price");
const ownerProductDescEl = document.getElementById("owner-product-desc");
const ownerProductsListEl = document.getElementById("owner-products-list");
const ownerLogoutBtnEl = document.getElementById("owner-logout-btn");

function money(value) {
  return `$${value.toFixed(2)}`;
}

function loadProducts() {
  const raw = localStorage.getItem(PRODUCTS_KEY);
  if (!raw) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(defaultProducts));
    return [...defaultProducts];
  }
  return JSON.parse(raw);
}

function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function loadCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function renderProducts() {
  const products = loadProducts();
  productListEl.innerHTML = products
    .map(
      (p) => `
        <article class="product-card" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">
          <h3>${p.name}</h3>
          <p>${p.description || "Product description"}</p>
          <p class="price">${money(Number(p.price))}</p>
          <button class="btn btn-primary add-to-cart">Add to Cart</button>
        </article>
      `
    )
    .join("");
}

function renderCart() {
  const cart = loadCart();

  if (!cart.length) {
    cartItemsEl.innerHTML = `<p class="empty-cart">Your cart is empty. Add a SportsCo product above.</p>`;
  } else {
    cartItemsEl.innerHTML = cart
      .map(
        (item) => `
          <div class="cart-item">
            <div>
              <h4>${item.name}</h4>
              <p>${money(Number(item.price))} each</p>
            </div>
            <div class="qty-controls">
              <button class="qty-btn" data-action="decrease" data-id="${item.id}">−</button>
              <span>${item.quantity}</span>
              <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
            </div>
          </div>
        `
      )
      .join("");
  }

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  subtotalEl.textContent = money(subtotal);
  taxEl.textContent = money(tax);
  totalEl.textContent = money(total);
}

function addToCart(product) {
  const cart = loadCart();
  const existing = cart.find((item) => item.id === product.id);
  if (existing) existing.quantity += 1;
  else cart.push({ ...product, quantity: 1 });
  saveCart(cart);
  renderCart();
}

function updateQuantity(productId, action) {
  const cart = loadCart();
  const item = cart.find((entry) => entry.id === productId);
  if (!item) return;

  item.quantity += action === "increase" ? 1 : -1;
  saveCart(cart.filter((entry) => entry.quantity > 0));
  renderCart();
}

function loadStripeLink() {
  stripeInputEl.value = localStorage.getItem(STRIPE_KEY) || "";
}

function saveStripeLink() {
  localStorage.setItem(STRIPE_KEY, stripeInputEl.value.trim());
}

function isOwnerAuthed() {
  return localStorage.getItem(OWNER_AUTH_KEY) === "true";
}

function setOwnerAuthed(value) {
  localStorage.setItem(OWNER_AUTH_KEY, value ? "true" : "false");
}

function renderOwnerProducts() {
  const products = loadProducts();
  ownerProductsListEl.innerHTML = products
    .map(
      (p) => `
      <div class="owner-product-row">
        <div>
          <strong>${p.name}</strong>
          <p>${p.description || "No description"}</p>
        </div>
        <div class="owner-row-actions">
          <label>Price</label>
          <input type="number" step="0.01" min="0" data-id="${p.id}" class="owner-price-input" value="${Number(p.price).toFixed(2)}" />
          <button class="btn btn-secondary owner-remove-btn" data-id="${p.id}">Remove</button>
        </div>
      </div>
    `
    )
    .join("");
}

function setOwnerUI() {
  const authed = isOwnerAuthed();
  ownerPanelEl.hidden = !authed;
  ownerLoginFormEl.hidden = authed;
  ownerStatusEl.textContent = authed
    ? "Owner mode active. You can add products and change pricing below."
    : "Use owner passcode to manage products.";

  if (authed) renderOwnerProducts();
}

productListEl.addEventListener("click", (event) => {
  const button = event.target.closest(".add-to-cart");
  if (!button) return;

  const card = button.closest(".product-card");
  addToCart({
    id: card.dataset.id,
    name: card.dataset.name,
    price: Number(card.dataset.price)
  });
});

cartItemsEl.addEventListener("click", (event) => {
  const button = event.target.closest(".qty-btn");
  if (!button) return;
  updateQuantity(button.dataset.id, button.dataset.action);
});

clearCartBtnEl.addEventListener("click", () => {
  saveCart([]);
  renderCart();
});

stripeInputEl.addEventListener("change", saveStripeLink);

checkoutBtnEl.addEventListener("click", () => {
  const cart = loadCart();
  const link = (localStorage.getItem(STRIPE_KEY) || "").trim();

  if (!cart.length) return alert("Your cart is empty. Add items before checkout.");
  if (!link) {
    alert("Please add your Stripe checkout link first.");
    stripeInputEl.focus();
    return;
  }
  window.location.href = link;
});

ownerLoginFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  if (ownerPasscodeEl.value === OWNER_PASSCODE) {
    setOwnerAuthed(true);
    ownerPasscodeEl.value = "";
    setOwnerUI();
  } else {
    alert("Incorrect passcode.");
  }
});

ownerLogoutBtnEl.addEventListener("click", () => {
  setOwnerAuthed(false);
  setOwnerUI();
});

ownerAddFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const products = loadProducts();

  const newProduct = {
    id: `prod-${Date.now()}`,
    name: ownerProductNameEl.value.trim(),
    price: Number(ownerProductPriceEl.value),
    description: ownerProductDescEl.value.trim()
  };

  if (!newProduct.name || Number.isNaN(newProduct.price) || newProduct.price < 0) {
    alert("Please enter a valid name and price.");
    return;
  }

  products.push(newProduct);
  saveProducts(products);
  ownerAddFormEl.reset();
  renderProducts();
  renderOwnerProducts();
});

ownerProductsListEl.addEventListener("change", (event) => {
  const input = event.target.closest(".owner-price-input");
  if (!input) return;

  const products = loadProducts();
  const target = products.find((p) => p.id === input.dataset.id);
  if (!target) return;

  const nextPrice = Number(input.value);
  if (Number.isNaN(nextPrice) || nextPrice < 0) return;

  target.price = nextPrice;
  saveProducts(products);
  renderProducts();
  renderCart();
});

ownerProductsListEl.addEventListener("click", (event) => {
  const button = event.target.closest(".owner-remove-btn");
  if (!button) return;

  const id = button.dataset.id;
  const nextProducts = loadProducts().filter((p) => p.id !== id);
  saveProducts(nextProducts);

  const nextCart = loadCart().filter((item) => item.id !== id);
  saveCart(nextCart);

  renderProducts();
  renderOwnerProducts();
  renderCart();
});

loadStripeLink();
renderProducts();
renderCart();
setOwnerUI();
