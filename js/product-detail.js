// Added 9 November 2026. Reads the existing catalogue; no database writes.
async function loadProductDetail() {
  const message = document.getElementById("detail-message");
  const id = new URLSearchParams(window.location.search).get("id");
  if (!/^[1-9]\d*$/.test(id || "")) {
    message.textContent = "Invalid product number.";
    return;
  }
  try {
    const { data: product, error } = await authClient.from("product")
      .select("*, category(category_name)").eq("product_id", id).single();
    if (error || !product) {
      message.textContent = "Product not found or unavailable.";
      return;
    }
    const stock = Number(product.stock);
    document.title = product.name + " - ShopNow";
    document.getElementById("product-name").textContent = product.name;
    document.getElementById("product-description").textContent =
      product.description || "No product description has been provided.";
    document.getElementById("product-category").textContent =
      "Category: " + (product.category?.category_name || "Other");
    document.getElementById("product-price").textContent =
      "AED " + Number(product.price).toFixed(2);
    document.getElementById("product-stock").textContent =
      (stock <= 0 ? "Out of Stock" : stock <= 5 ? "Low Stock" : "In Stock") +
      " | Available: " + stock;
    const button = document.getElementById("detail-add");
    button.disabled = stock <= 0;
    button.addEventListener("click", () => {
      const before = cart.reduce((sum, item) => sum + item.quantity, 0);
      addToCart({ id: product.product_id, name: product.name,
        price: Number(product.price), stock });
      const after = cart.reduce((sum, item) => sum + item.quantity, 0);
      document.getElementById("detail-cart-message").textContent =
        after > before ? "Added to cart." : "Cart quantity unchanged.";
    });
    document.getElementById("detail").hidden = false;
    message.textContent = "";
  } catch (error) {
    message.textContent = "Unable to load this product. Please try again.";
    console.error("Product detail loading failed:", error);
  }
}
loadProductDetail();
