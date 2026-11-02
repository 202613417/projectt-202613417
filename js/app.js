const SUPABASE_URL = "https://cwlzsjbzxsbpkokgnlhr.supabase.co/";
const SUPABASE_KEY = "sb_publishable_PEWlEp2pD8obpUe9S8NFpA_AhZU8qF7";

let products = [];
let searchTerm = "";
let selectedCategory = "All";
let sortOrder = "default";

// Load products from Supabase
async function loadProducts() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/product?select=*,category(category_name)&order=product_id.asc`,
      {
        headers: {
          apikey: SUPABASE_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error("Failed to load products");
    }

    const data = await response.json();

    products = data.map(p => ({
      id: p.product_id,
      name: p.name,
      category: p.category?.category_name || "Other",
      price: Number(p.price),
      stock: p.stock
    }));

    updateProducts();

  } catch (error) {
    console.error(error);
    const container = document.getElementById("product-list")
      || document.getElementById("featured-products");

    if (container) {
      container.textContent = "Unable to load products.";
    }
  }
}

// Display products
function renderProducts(list) {
  const container = document.getElementById("product-list")
    || document.getElementById("featured-products");

  if (!container) return;

  container.innerHTML = "";

  if (list.length === 0) {
    container.textContent = "No products found.";
    return;
  }

  list.forEach(product => {
    const card = document.createElement("div");
    card.className = "product";

    const title = document.createElement("h3");
    title.textContent = product.name;

    const category = document.createElement("p");
    category.textContent = "Category: " + product.category;

    const price = document.createElement("p");
    price.textContent = "AED " + product.price.toLocaleString();

    const stock = document.createElement("p");
    stock.textContent = product.stock > 0
      ? "In Stock"
      : "Out of Stock";

    const button = document.createElement("button");
    button.textContent = "Add to Cart";
    button.disabled = product.stock <= 0;

    button.addEventListener("click", () => {
  if (typeof addToCart === "function") {
    addToCart(product);
  } else {
    alert("Shopping cart is not ready.");
  }
});

  

    card.append(title, category, price, stock, button);
    container.appendChild(card);
  });
}

// Search, filter and sort products
function updateProducts() {
  let filtered = products.filter(product => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (sortOrder === "low-high") {
    filtered.sort((a, b) => a.price - b.price);
  }

  if (sortOrder === "high-low") {
    filtered.sort((a, b) => b.price - a.price);
  }

  renderProducts(filtered);
}

// Setup search and filters
function setupProducts() {
  const searchBox = document.getElementById("search-box");

  if (searchBox) {
    searchBox.addEventListener("input", e => {
      searchTerm = e.target.value;
      updateProducts();
    });
  }

  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedCategory = btn.dataset.category || "All";
      updateProducts();
    });
  });

  const sortSelect = document.getElementById("sort-select");

  if (sortSelect) {
    sortSelect.addEventListener("change", e => {
      sortOrder = e.target.value;
      updateProducts();
    });
  }

  loadProducts();
}

// Start application
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupProducts);
} else {
  setupProducts();
}



