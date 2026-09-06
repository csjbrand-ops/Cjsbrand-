// main.js — CSJ public website
import {
  db,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
  WHATSAPP_NUMBER
} from "./firebase-config.js";
import { DEFAULT_SITE_SETTINGS } from "./seed-data.js";

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------
let products = [];          // the single source of truth once Firestore replies
let productsLoaded = false;
let activeCategory = "All";
let cart = loadCart();      // [{ productId, name, price, image, color, qty }]

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindStaticEvents();
  renderCart();
  loadSettings();
  loadProducts();
});

function cacheElements() {
  els.year = document.getElementById("year");
  els.announcementBar = document.getElementById("announcementBar");
  els.heroTitle = document.getElementById("heroTitle");
  els.heroSubtitle = document.getElementById("heroSubtitle");
  els.contactInfo = document.getElementById("contactInfo");
  els.shippingInfo = document.getElementById("shippingInfo");
  els.productGrid = document.getElementById("productGrid");
  els.filterBar = document.getElementById("filterBar");
  els.gridStatus = document.getElementById("gridStatus");

  els.cartToggle = document.getElementById("cartToggle");
  els.cartCount = document.getElementById("cartCount");
  els.cartDrawer = document.getElementById("cartDrawer");
  els.cartOverlay = document.getElementById("cartOverlay");
  els.cartClose = document.getElementById("cartClose");
  els.cartItems = document.getElementById("cartItems");
  els.cartEmpty = document.getElementById("cartEmpty");
  els.cartSubtotal = document.getElementById("cartSubtotal");
  els.checkoutBtn = document.getElementById("checkoutBtn");

  els.productModal = document.getElementById("productModal");
  els.productModalBody = document.getElementById("productModalBody");
  els.productModalClose = document.getElementById("productModalClose");

  els.checkoutModal = document.getElementById("checkoutModal");
  els.checkoutModalClose = document.getElementById("checkoutModalClose");
  els.checkoutForm = document.getElementById("checkoutForm");
  els.checkoutSummary = document.getElementById("checkoutSummary");
  els.checkoutTotal = document.getElementById("checkoutTotal");
  els.checkoutWarning = document.getElementById("checkoutWarning");
  els.placeOrderBtn = document.getElementById("placeOrderBtn");

  els.confirmModal = document.getElementById("confirmModal");
  els.confirmModalClose = document.getElementById("confirmModalClose");
  els.confirmOrderId = document.getElementById("confirmOrderId");
  els.confirmWhatsappLink = document.getElementById("confirmWhatsappLink");
}

function bindStaticEvents() {
  if (els.year) els.year.textContent = new Date().getFullYear();

  els.cartToggle?.addEventListener("click", () => openDrawer(els.cartDrawer, els.cartOverlay));
  els.cartClose?.addEventListener("click", () => closeDrawer(els.cartDrawer, els.cartOverlay));
  els.cartOverlay?.addEventListener("click", () => closeDrawer(els.cartDrawer, els.cartOverlay));

  els.productModalClose?.addEventListener("click", () => closeModal(els.productModal));
  els.productModal?.addEventListener("click", (e) => {
    if (e.target === els.productModal) closeModal(els.productModal);
  });

  els.checkoutModalClose?.addEventListener("click", () => closeModal(els.checkoutModal));
  els.checkoutModal?.addEventListener("click", (e) => {
    if (e.target === els.checkoutModal) closeModal(els.checkoutModal);
  });

  els.confirmModalClose?.addEventListener("click", () => closeModal(els.confirmModal));
  els.confirmModal?.addEventListener("click", (e) => {
    if (e.target === els.confirmModal) closeModal(els.confirmModal);
  });

  els.checkoutBtn?.addEventListener("click", openCheckout);
  els.checkoutForm?.addEventListener("submit", handlePlaceOrder);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal(els.productModal);
      closeModal(els.checkoutModal);
      closeModal(els.confirmModal);
      closeDrawer(els.cartDrawer, els.cartOverlay);
    }
  });
}

// ---------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------
async function loadSettings() {
  let settings = DEFAULT_SITE_SETTINGS;
  try {
    const snap = await getDocs(collection(db, "siteSettings"));
    if (!snap.empty) {
      settings = { ...DEFAULT_SITE_SETTINGS, ...snap.docs[0].data() };
    }
  } catch (err) {
    console.error("Could not load site settings, using defaults:", err);
  }
  applySettings(settings);
}

function applySettings(settings) {
  if (els.announcementBar) els.announcementBar.textContent = settings.announcementText || "";
  if (els.heroTitle) els.heroTitle.textContent = settings.heroTitle || "";
  if (els.heroSubtitle) els.heroSubtitle.textContent = settings.heroSubtitle || "";
  if (els.contactInfo) els.contactInfo.textContent = settings.contactInfo || "";
  if (els.shippingInfo) els.shippingInfo.textContent = settings.shippingInfo || "";
  document.querySelectorAll("[data-store-name]").forEach((elm) => {
    elm.textContent = settings.storeName || "CSJ";
  });
}

// ---------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------
async function loadProducts() {
  if (els.gridStatus) els.gridStatus.textContent = "Loading the collection…";
  try {
    const q = query(collection(db, "products"), where("active", "==", true));
    const snap = await getDocs(q);
    const loaded = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      loaded.push({ id: docSnap.id, ...data });
    });
    // Sort client-side so we never need a composite index for this query.
    loaded.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    products = loaded;
    productsLoaded = true;

    if (products.length === 0) {
      if (els.gridStatus) {
        els.gridStatus.textContent =
          "The catalogue is empty right now — please check back soon.";
      }
    } else if (els.gridStatus) {
      els.gridStatus.textContent = "";
    }

    renderFilterBar();
    renderProducts();
  } catch (err) {
    console.error("Failed to load products:", err);
    if (els.gridStatus) {
      els.gridStatus.textContent =
        "We couldn't load the collection just now. Please refresh the page in a moment.";
    }
  }
}

function getProductById(productId) {
  const product = products.find((p) => String(p.id) === String(productId));
  if (!product) {
    console.error("Product not found:", productId);
    return null;
  }
  return product;
}

function renderFilterBar() {
  if (!els.filterBar) return;
  const categories = ["All", ...new Set(products.map((p) => p.category).filter(Boolean))];
  els.filterBar.innerHTML = "";
  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "filter-pill" + (cat === activeCategory ? " is-active" : "");
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      activeCategory = cat;
      renderFilterBar();
      renderProducts();
    });
    els.filterBar.appendChild(btn);
  });
}

function renderProducts() {
  if (!els.productGrid) return;
  const visible =
    activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory);

  els.productGrid.innerHTML = "";

  if (visible.length === 0 && productsLoaded) {
    const empty = document.createElement("p");
    empty.className = "grid-empty";
    empty.textContent = "Nothing in this category right now.";
    els.productGrid.appendChild(empty);
    return;
  }

  visible.forEach((product) => {
    els.productGrid.appendChild(buildProductCard(product));
  });
}

function buildProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";

  const priceHtml = product.oldPrice
    ? `<span class="price-old">Rs ${formatPrice(product.oldPrice)}</span>
       <span class="price-now">Rs ${formatPrice(product.price)}</span>`
    : `<span class="price-now">Rs ${formatPrice(product.price)}</span>`;

  const tagHtml = product.tag
    ? `<span class="product-tag">${escapeHtml(product.tag)}</span>`
    : "";

  const swatches = (product.colors || [])
    .slice(0, 5)
    .map((c) => `<span class="swatch" style="background:${escapeHtml(c.hex)}" title="${escapeHtml(c.name)}"></span>`)
    .join("");

  card.innerHTML = `
    ${tagHtml}
    <button type="button" class="product-media" data-open="${product.id}" aria-label="View ${escapeHtml(product.name)}">
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.onerror=null;this.src='images/fallback.svg';">
    </button>
    <div class="product-info">
      <p class="product-category">${escapeHtml(product.category || "")}</p>
      <h3 class="product-name"><button type="button" data-open="${product.id}">${escapeHtml(product.name)}</button></h3>
      <div class="product-swatches">${swatches}</div>
      <div class="product-price">${priceHtml}</div>
      <div class="product-actions">
        <button type="button" class="btn btn-ghost" data-add="${product.id}">Add to cart</button>
        <button type="button" class="btn btn-primary" data-buy="${product.id}">Buy now</button>
      </div>
    </div>
  `;

  card.querySelectorAll("[data-open]").forEach((btn) =>
    btn.addEventListener("click", () => openProduct(product.id))
  );
  card.querySelector("[data-add]")?.addEventListener("click", () => quickAdd(product.id));
  card.querySelector("[data-buy]")?.addEventListener("click", () => quickBuy(product.id));

  return card;
}

// ---------------------------------------------------------------------
// Product detail modal
// ---------------------------------------------------------------------
function openProduct(productId) {
  const product = getProductById(productId);
  if (!product) {
    alert("Sorry, that product isn't available right now.");
    return;
  }

  const colorOptions = (product.colors || [])
    .map(
      (c, i) =>
        `<label class="color-option">
          <input type="radio" name="modalColor" value="${escapeHtml(c.name)}" ${i === 0 ? "checked" : ""}>
          <span class="swatch swatch-lg" style="background:${escapeHtml(c.hex)}"></span>
          <span>${escapeHtml(c.name)}</span>
        </label>`
    )
    .join("");

  els.productModalBody.innerHTML = `
    <div class="modal-media">
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" onerror="this.onerror=null;this.src='images/fallback.svg';">
    </div>
    <div class="modal-info">
      <p class="product-category">${escapeHtml(product.category || "")}</p>
      <h2>${escapeHtml(product.name)}</h2>
      <div class="product-price">
        ${product.oldPrice ? `<span class="price-old">Rs ${formatPrice(product.oldPrice)}</span>` : ""}
        <span class="price-now">Rs ${formatPrice(product.price)}</span>
      </div>
      <p class="modal-desc">${escapeHtml(product.description || "")}</p>
      <div class="color-picker">
        <p class="field-label">Colour set</p>
        <div class="color-options">${colorOptions}</div>
      </div>
      <div class="qty-row">
        <p class="field-label">Quantity</p>
        <div class="qty-stepper">
          <button type="button" id="modalQtyMinus" aria-label="Decrease quantity">−</button>
          <span id="modalQtyValue">1</span>
          <button type="button" id="modalQtyPlus" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" id="modalAddBtn">Add to cart</button>
        <button type="button" class="btn btn-primary" id="modalBuyBtn">Buy now</button>
      </div>
    </div>
  `;

  let qty = 1;
  const qtyValueEl = els.productModalBody.querySelector("#modalQtyValue");
  els.productModalBody.querySelector("#modalQtyMinus").addEventListener("click", () => {
    qty = Math.max(1, qty - 1);
    qtyValueEl.textContent = qty;
  });
  els.productModalBody.querySelector("#modalQtyPlus").addEventListener("click", () => {
    qty = Math.min(20, qty + 1);
    qtyValueEl.textContent = qty;
  });

  const getSelectedColor = () =>
    els.productModalBody.querySelector('input[name="modalColor"]:checked')?.value ||
    (product.colors && product.colors[0]?.name) ||
    "";

  els.productModalBody.querySelector("#modalAddBtn").addEventListener("click", () => {
    addToCart(product, getSelectedColor(), qty);
    closeModal(els.productModal);
    openDrawer(els.cartDrawer, els.cartOverlay);
  });
  els.productModalBody.querySelector("#modalBuyBtn").addEventListener("click", () => {
    addToCart(product, getSelectedColor(), qty);
    closeModal(els.productModal);
    openCheckout();
  });

  openModal(els.productModal);
}

function quickAdd(productId) {
  const product = getProductById(productId);
  if (!product) {
    alert("Sorry, that product isn't available right now.");
    return;
  }
  const defaultColor = product.colors && product.colors[0] ? product.colors[0].name : "";
  addToCart(product, defaultColor, 1);
  openDrawer(els.cartDrawer, els.cartOverlay);
}

function quickBuy(productId) {
  const product = getProductById(productId);
  if (!product) {
    alert("Sorry, that product isn't available right now.");
    return;
  }
  const defaultColor = product.colors && product.colors[0] ? product.colors[0].name : "";
  addToCart(product, defaultColor, 1);
  openCheckout();
}

// ---------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------
function loadCart() {
  try {
    const raw = localStorage.getItem("csj_cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem("csj_cart", JSON.stringify(cart));
  } catch (err) {
    console.error("Could not persist cart:", err);
  }
}

function addToCart(product, color, qty) {
  if (!product) return;
  const existing = cart.find((item) => item.productId === product.id && item.color === color);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      color,
      qty
    });
  }
  saveCart();
  renderCart();
}

function updateCartQty(productId, color, delta) {
  const item = cart.find((i) => i.productId === productId && i.color === color);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((i) => i !== item);
  }
  saveCart();
  renderCart();
}

function removeCartItem(productId, color) {
  cart = cart.filter((i) => !(i.productId === productId && i.color === color));
  saveCart();
  renderCart();
}

function cartSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function renderCart() {
  if (!els.cartItems) return;
  const count = cart.reduce((n, i) => n + i.qty, 0);
  if (els.cartCount) els.cartCount.textContent = count;

  els.cartItems.innerHTML = "";
  if (cart.length === 0) {
    if (els.cartEmpty) els.cartEmpty.style.display = "block";
  } else {
    if (els.cartEmpty) els.cartEmpty.style.display = "none";
    cart.forEach((item) => {
      const row = document.createElement("div");
      row.className = "cart-row";
      row.innerHTML = `
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" onerror="this.onerror=null;this.src='images/fallback.svg';">
        <div class="cart-row-info">
          <p class="cart-row-name">${escapeHtml(item.name)}</p>
          <p class="cart-row-color">${escapeHtml(item.color || "")}</p>
          <div class="qty-stepper qty-stepper-sm">
            <button type="button" data-qty-minus>−</button>
            <span>${item.qty}</span>
            <button type="button" data-qty-plus>+</button>
          </div>
        </div>
        <div class="cart-row-end">
          <p class="cart-row-price">Rs ${formatPrice(item.price * item.qty)}</p>
          <button type="button" class="cart-row-remove" data-remove>Remove</button>
        </div>
      `;
      row.querySelector("[data-qty-minus]").addEventListener("click", () =>
        updateCartQty(item.productId, item.color, -1)
      );
      row.querySelector("[data-qty-plus]").addEventListener("click", () =>
        updateCartQty(item.productId, item.color, 1)
      );
      row.querySelector("[data-remove]").addEventListener("click", () =>
        removeCartItem(item.productId, item.color)
      );
      els.cartItems.appendChild(row);
    });
  }

  if (els.cartSubtotal) els.cartSubtotal.textContent = `Rs ${formatPrice(cartSubtotal())}`;
  if (els.checkoutBtn) els.checkoutBtn.disabled = cart.length === 0;
}

// ---------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------
const SHIPPING_FLAT_RATE = 0; // free delivery, matches announcement copy

function openCheckout() {
  if (cart.length === 0) return;
  closeDrawer(els.cartDrawer, els.cartOverlay);

  const subtotal = cartSubtotal();
  const shipping = SHIPPING_FLAT_RATE;
  const total = subtotal + shipping;

  els.checkoutSummary.innerHTML = cart
    .map(
      (item) => `
      <div class="summary-row">
        <span>${escapeHtml(item.name)} (${escapeHtml(item.color || "")}) × ${item.qty}</span>
        <span>Rs ${formatPrice(item.price * item.qty)}</span>
      </div>`
    )
    .join("");
  els.checkoutSummary.innerHTML += `
    <div class="summary-row"><span>Subtotal</span><span>Rs ${formatPrice(subtotal)}</span></div>
    <div class="summary-row"><span>Shipping</span><span>${shipping ? "Rs " + formatPrice(shipping) : "Free"}</span></div>
  `;
  els.checkoutTotal.textContent = `Rs ${formatPrice(total)}`;
  els.checkoutWarning.style.display = "none";
  els.checkoutWarning.textContent = "";

  openModal(els.checkoutModal);
}

async function handlePlaceOrder(e) {
  e.preventDefault();
  if (cart.length === 0) return;

  const formData = new FormData(els.checkoutForm);
  const customerName = (formData.get("name") || "").toString().trim();
  const phone = (formData.get("phone") || "").toString().trim();
  const city = (formData.get("city") || "").toString().trim();
  const address = (formData.get("address") || "").toString().trim();
  const notes = (formData.get("notes") || "").toString().trim();

  if (!customerName || !phone || !city || !address) {
    els.checkoutWarning.style.display = "block";
    els.checkoutWarning.textContent = "Please fill in your name, phone, city and address.";
    return;
  }

  const subtotal = cartSubtotal();
  const shipping = SHIPPING_FLAT_RATE;
  const total = subtotal + shipping;

  const orderId = generateOrderId();
  const now = new Date();

  const orderPayload = {
    orderId,
    customerName,
    phone,
    city,
    address,
    notes,
    items: cart.map((item) => ({
      productId: item.productId,
      name: item.name,
      color: item.color || "",
      size: "",
      qty: item.qty,
      price: item.price,
      lineTotal: item.price * item.qty
    })),
    subtotal,
    shipping,
    total,
    status: "pending",
    orderDate: now.toLocaleDateString("en-GB"),
    orderTime: now.toLocaleTimeString("en-GB"),
    createdAt: serverTimestamp()
  };

  els.placeOrderBtn.disabled = true;
  els.placeOrderBtn.textContent = "Placing order…";

  let savedToFirestore = false;
  try {
    await addDoc(collection(db, "orders"), orderPayload);
    savedToFirestore = true;
  } catch (err) {
    console.error("Could not save order to Firestore:", err);
  }

  els.placeOrderBtn.disabled = false;
  els.placeOrderBtn.textContent = "Place order";

  if (!savedToFirestore) {
    els.checkoutWarning.style.display = "block";
    els.checkoutWarning.textContent =
      "We couldn't confirm your order with our system. Please try again, or send your order directly on WhatsApp using the button below.";
    // Still offer the WhatsApp fallback so the customer isn't stuck, but be
    // explicit that the order was not recorded on our side.
  }

  const whatsappUrl = buildWhatsAppUrl(orderPayload);

  if (savedToFirestore) {
    cart = [];
    saveCart();
    renderCart();
    closeModal(els.checkoutModal);
    els.checkoutForm.reset();

    els.confirmOrderId.textContent = orderId;
    els.confirmWhatsappLink.href = whatsappUrl;
    openModal(els.confirmModal);
    window.open(whatsappUrl, "_blank");
  } else {
    els.confirmWhatsappLink.href = whatsappUrl;
  }
}

function generateOrderId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CSJ-${stamp}-${rand}`;
}

function buildWhatsAppUrl(order) {
  const lines = [
    `New order: ${order.orderId}`,
    `Name: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `City: ${order.city}`,
    `Address: ${order.address}`,
    order.notes ? `Notes: ${order.notes}` : null,
    "",
    "Items:",
    ...order.items.map(
      (item) => `- ${item.name} (${item.color || "no colour noted"}) x${item.qty} — Rs ${formatPrice(item.lineTotal)}`
    ),
    "",
    `Subtotal: Rs ${formatPrice(order.subtotal)}`,
    `Shipping: ${order.shipping ? "Rs " + formatPrice(order.shipping) : "Free"}`,
    `Total: Rs ${formatPrice(order.total)}`
  ].filter((line) => line !== null);

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

// ---------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------
function openModal(modal) {
  if (!modal) return;
  modal.classList.add("is-open");
  document.body.classList.add("no-scroll");
}
function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
}
function openDrawer(drawer, overlay) {
  if (!drawer) return;
  drawer.classList.add("is-open");
  overlay?.classList.add("is-open");
  document.body.classList.add("no-scroll");
}
function closeDrawer(drawer, overlay) {
  if (!drawer) return;
  drawer.classList.remove("is-open");
  overlay?.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
}
function formatPrice(n) {
  const num = Number(n) || 0;
  return num.toLocaleString("en-PK");
}
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
