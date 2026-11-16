const SUPABASE_URL = "https://cwlzsjbzxsbpkokgnlhr.supabase.co/";
const SUPABASE_KEY = "sb_publishable_PEWlEp2pD8obpUe9S8NFpA_AhZU8qF7";

// Existing Lab 1 images, matched to the catalogue products they illustrate.
const productImages = {
  1: ["images/download.webp", "Illustrative smartphone photo"],
  2: ["images/download.webp", "Illustrative smartphone photo"],
  3: ["images/download.webp", "Illustrative smartphone photo"],
  10: ["images/OIP (2).webp", "Illustrative tablet photo"],
  11: ["images/OIP (1).webp", "Illustrative laptop photo"],
  12: ["images/OIP (3).webp", "Illustrative monitor photo"]
};

let products = [];
let catalogueStatus = "loading";
let searchTerm = "";
let selectedCategory = "All";
let sortOrder = "default";

// Load products from Supabase
async function loadProducts() {
  try {
    const { data, error } = await authClient
      .from("product")
      .select("*, category(category_name)")
      .order("product_id");
    if (error) throw error;

    products = data.map(p => ({
      id: p.product_id,
      name: p.name,
      description: p.description,
      category: p.category?.category_name || "Other",
      price: Number(p.price),
      stock: p.stock
    }));

    catalogueStatus = "ready";
    updateProducts();
    updateSmartResults();

  } catch (error) {
    console.error(error);
    catalogueStatus = "error";
    updateSmartResults();
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

    const image = productImages[product.id];
    if (image) {
      const photo = document.createElement("img");
      photo.src = image[0];
      photo.alt = image[1];
      card.appendChild(photo);
    }

    const title = document.createElement("h3");
    title.textContent = product.name;

    const category = document.createElement("p");
    category.textContent = "Category: " + product.category;

    const price = document.createElement("p");
    price.textContent = "AED " + product.price.toLocaleString();

    const stock = document.createElement("p");
    stock.textContent = product.stock <= 0 ? "Out of Stock"
      : product.stock <= 5 ? "Low Stock" : "In Stock";

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

  

    const details = document.createElement("a");
    details.href = "product-detail.html?id=" + encodeURIComponent(product.id);
    details.textContent = "View details";
    card.append(title, category, price, stock, details, button);
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

function updateSmartResults() {
  const input = document.getElementById("smart-search");
  const results = document.getElementById("smart-results");
  if (!input || !results) return;

  const query = input.value.trim();
  results.textContent = "";
  if (query.length < 3) return;
  if (catalogueStatus !== "ready") {
    results.textContent = catalogueStatus === "loading"
      ? "Loading catalogue…"
      : "Unable to load the catalogue. Reload the page to try again.";
    return;
  }

  const matches = smartSearch(query, products);
  if (!matches.length) {
    results.textContent = "No matches. Try different words.";
    return;
  }

  const list = document.createElement("ul");
  for (const product of matches) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = "product-detail.html?id=" + encodeURIComponent(product.id);
    link.textContent = product.name;
    item.append(link, " — AED " + product.price.toLocaleString());
    list.append(item);
  }
  results.append(list);
}

// Setup search and filters
function setupProducts() {
  const searchBox = document.getElementById("search-box");
  document.getElementById("smart-search")?.addEventListener("input", updateSmartResults);

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



