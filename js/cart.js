
const CART_STORAGE_KEY = "shopnow_cart";

let cart = [];

try {
  const saved = JSON.parse(
    localStorage.getItem(CART_STORAGE_KEY) || "[]"
  );
  cart = Array.isArray(saved) ? saved : [];
} catch {
  cart = [];
}

// Save cart to localStorage
function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

// Add product to cart
function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);
  const currentQuantity = existing ? existing.quantity : 0;

  if (currentQuantity >= Number(product.stock)) {
    alert("Not enough stock available.");
    return;
  }

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      stock: Number(product.stock),
      quantity: 1
    });
  }

  saveCart();
  renderCart();
}

// Increase or decrease quantity
function changeQuantity(id, change) {
  const item = cart.find(p => p.id === id);
  if (!item) return;

  if (change > 0) {
    const product = typeof products !== "undefined"
      ? products.find(p => p.id === id)
      : null;

    const availableStock = product
      ? Number(product.stock)
      : Number(item.stock);

    if (!Number.isFinite(availableStock)) {
      alert("Stock information is unavailable.");
      return;
    }

    if (item.quantity >= availableStock) {
      alert("Not enough stock available.");
      return;
    }
  }

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter(p => p.id !== id);
  }

  saveCart();
  renderCart();
}

// Remove product
function removeFromCart(id) {
  cart = cart.filter(p => p.id !== id);
  saveCart();
  renderCart();
}

// Display cart and calculate totals
function renderCart() {
  const container = document.getElementById("cart-items");
  const count = document.getElementById("cart-count");
  const totalElement = document.getElementById("cart-total");
  const subtotalElement = document.getElementById("subtotal");
  const checkout = document.getElementById("checkout-button");

  const quantity = cart.reduce(
    (sum, item) => sum + item.quantity, 0
  );

  if (count) {
    count.textContent = quantity;
  }

  let total = 0;

  if (container) {
    container.replaceChildren();

    if (cart.length === 0) {
      container.textContent = "Your cart is empty.";
    }

    cart.forEach(item => {
      const price = Number(item.price);
      const lineTotal = price * item.quantity;
      total += lineTotal;

      const row = document.createElement("div");
      row.className = "cart-row";

      const details = document.createElement("span");
      details.textContent =
        `${item.name} | AED ${price.toFixed(2)} each | ` +
        `Quantity: ${item.quantity} | ` +
        `Line Total: AED ${lineTotal.toFixed(2)}`;

      const controls = document.createElement("div");

      const minus = document.createElement("button");
      minus.textContent = "−";
      minus.addEventListener("click", () => {
        changeQuantity(item.id, -1);
      });

      const amount = document.createElement("span");
      amount.textContent = ` ${item.quantity} `;

      const plus = document.createElement("button");
      plus.textContent = "+";
      plus.addEventListener("click", () => {
        changeQuantity(item.id, 1);
      });

      const remove = document.createElement("button");
      remove.textContent = "Remove";
      remove.addEventListener("click", () => {
        removeFromCart(item.id);
      });

      controls.append(minus, amount, plus, remove);
      row.append(details, controls);
      container.appendChild(row);
    });
  } else {
    total = cart.reduce(
      (sum, item) =>
        sum + Number(item.price) * item.quantity,
      0
    );
  }

  if (totalElement) {
    totalElement.textContent = total.toFixed(2);
  }

  if (subtotalElement) {
    subtotalElement.textContent = total.toFixed(2);
  }

  if (checkout) {
    checkout.disabled = cart.length === 0;
  }
}

// Check login before checkout
async function proceedToCheckout() {
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  if (
    typeof authClient === "undefined" ||
    !authClient
  ) {
    alert("Authentication is unavailable. Please reload the page.");
    return;
  }

  try {
    const { data, error } = await authClient.auth.getUser();

    if (error || !data.user) {
      alert("Please login before checkout.");
      window.location.href = "login.html";
      return;
    }

    window.location.href = "checkout.html";
  } catch (error) {
    console.error("Checkout authentication error:", error);
    alert("Unable to verify login. Please try again.");
  }
}

// Setup cart buttons
function setupCart() {
  const toggle = document.getElementById("cart-toggle");
  const panel = document.getElementById("cart-panel");
  const checkout = document.getElementById("checkout-button");

  if (toggle && panel) {
    toggle.addEventListener("click", () => {
      panel.hidden = !panel.hidden;

      if (!panel.hidden) {
        renderCart();
        panel.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  if (checkout) {
    checkout.addEventListener("click", proceedToCheckout);
  }

  renderCart();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupCart);
} else {
  setupCart();
}
