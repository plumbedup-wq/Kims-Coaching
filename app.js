const CART_KEY = "kims_cart";
const STRIPE_KEY = "kims_stripe_link";

const cartItemsEl = document.getElementById("cart-items");
const subtotalEl = document.getElementById("subtotal");
const taxEl = document.getElementById("tax");
const totalEl = document.getElementById("total");
const stripeInputEl = document.getElementById("stripe-link");
const checkoutBtnEl = document.getElementById("checkout-btn");
const clearCartBtnEl = document.getElementById("clear-cart-btn");

function loadCart() {
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function money(value) {
  return `$${value.toFixed(2)}`;
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
              <p>${money(item.price)} each</p>
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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  subtotalEl.textContent = money(subtotal);
  taxEl.textContent = money(tax);
  totalEl.textContent = money(total);
}

function addToCart(product) {
  const cart = loadCart();
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart(cart);
  renderCart();
}

function updateQuantity(productId, action) {
  const cart = loadCart();
  const item = cart.find((entry) => entry.id === productId);

  if (!item) return;
  item.quantity += action === "increase" ? 1 : -1;

  const next = cart.filter((entry) => entry.quantity > 0);
  saveCart(next);
  renderCart();
}

function loadStripeLink() {
  stripeInputEl.value = localStorage.getItem(STRIPE_KEY) || "";
}

function saveStripeLink() {
  localStorage.setItem(STRIPE_KEY, stripeInputEl.value.trim());
}

document.querySelectorAll(".add-to-cart").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".product-card");
    addToCart({
      id: card.dataset.id,
      name: card.dataset.name,
      price: Number(card.dataset.price)
    });
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

  if (!cart.length) {
    alert("Your cart is empty. Add items before checkout.");
    return;
  }

  if (!link) {
    alert("Please add your Stripe checkout link first.");
    stripeInputEl.focus();
    return;
  }

  window.location.href = link;
});

loadStripeLink();
renderCart();
