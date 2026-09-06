// admin.js — CSJ admin panel
import {
  auth,
  db,
  ADMIN_UID,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from "./firebase-config.js";
import { SEED_PRODUCTS, DEFAULT_SITE_SETTINGS } from "./seed-data.js";

const els = {};
let products = [];      // ALL products (active + inactive) — the admin's source of truth
let orders = [];        // ALL orders, all statuses
let currentOrderTab = "pending";
let settingsDocId = null;

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  watchAuth();
});

function cacheElements() {
  els.loginScreen = document.getElementById("loginScreen");
  els.deniedScreen = document.getElementById("deniedScreen");
  els.adminApp = document.getElementById("adminApp");
  els.loginForm = document.getElementById("loginForm");
  els.loginEmail = document.getElementById("loginEmail");
  els.loginPassword = document.getElementById("loginPassword");
  els.loginError = document.getElementById("loginError");
  els.loginBtn = document.getElementById("loginBtn");
  els.deniedLogoutBtn = document.getElementById("deniedLogoutBtn");
  els.logoutBtn = document.getElementById("logoutBtn");

  els.adminTabs = document.getElementById("adminTabs");
  els.orderTabs = document.getElementById("orderTabs");

  els.productsStatus = document.getElementById("productsStatus");
  els.productsTableBody = document.getElementById("productsTableBody");
  els.addProductBtn = document.getElementById("addProductBtn");

  els.ordersStatus = document.getElementById("ordersStatus");
  els.ordersList = document.getElementById("ordersList");

  els.settingsForm = document.getElementById("settingsForm");
  els.settingsStatus = document.getElementById("settingsStatus");

  els.productModal = document.getElementById("productModal");
  els.productModalClose = document.getElementById("productModalClose");
  els.productModalTitle = document.getElementById("productModalTitle");
  els.productForm = document.getElementById("productForm");
  els.productFormWarning = document.getElementById("productFormWarning");
}

function bindEvents() {
  els.loginForm.addEventListener("submit", handleLogin);
  els.deniedLogoutBtn.addEventListener("click", () => signOut(auth));
  els.logoutBtn.addEventListener("click", () => signOut(auth));

  els.adminTabs.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tab]");
    if (!btn) return;
    switchTab(btn.dataset.tab);
  });

  els.orderTabs.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-order-tab]");
    if (!btn) return;
    currentOrderTab = btn.dataset.orderTab;
    [...els.orderTabs.children].forEach((c) => c.classList.toggle("is-active", c === btn));
    renderOrders();
  });

  els.addProductBtn.addEventListener("click", () => openProductForm(null));
  els.productModalClose.addEventListener("click", () => closeModal(els.productModal));
  els.productModal.addEventListener("click", (e) => {
    if (e.target === els.productModal) closeModal(els.productModal);
  });
  els.productForm.addEventListener("submit", handleProductFormSubmit);

  els.settingsForm.addEventListener("submit", handleSettingsSave);
}

// ---------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------
function watchAuth() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      showScreen("login");
      return;
    }
    if (user.uid !== ADMIN_UID) {
      showScreen("denied");
      return;
    }
    showScreen("app");
    await ensureProductsSeeded();
    await Promise.all([loadProducts(), loadOrders(), loadSettings()]);
  });
}

async function handleLogin(e) {
  e.preventDefault();
  els.loginError.style.display = "none";
  els.loginBtn.disabled = true;
  els.loginBtn.textContent = "Signing in…";
  try {
    await signInWithEmailAndPassword(auth, els.loginEmail.value.trim(), els.loginPassword.value);
    // onAuthStateChanged takes over from here — it checks the UID.
  } catch (err) {
    console.error("Login failed:", err);
    els.loginError.textContent = "Incorrect email or password.";
    els.loginError.style.display = "block";
  }
  els.loginBtn.disabled = false;
  els.loginBtn.textContent = "Sign in";
}

function showScreen(which) {
  els.loginScreen.style.display = which === "login" ? "flex" : "none";
  els.deniedScreen.style.display = which === "denied" ? "flex" : "none";
  els.adminApp.style.display = which === "app" ? "block" : "none";
}

function switchTab(tab) {
  [...els.adminTabs.children].forEach((btn) =>
    btn.classList.toggle("is-active", btn.dataset.tab === tab)
  );
  document.querySelectorAll(".admin-panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === `panel-${tab}`);
  });
}

// ---------------------------------------------------------------------
// One-time product import
// ---------------------------------------------------------------------
async function ensureProductsSeeded() {
  try {
    const snap = await getDocs(collection(db, "products"));
    if (!snap.empty) return; // already seeded — never duplicate
    const batch = writeBatch(db);
    SEED_PRODUCTS.forEach((product) => {
      const { id, ...data } = product;
      batch.set(doc(db, "products", id), data);
    });
    await batch.commit();
    console.log("Imported the 9 launch products into Firestore.");
  } catch (err) {
    console.error("Could not check/seed products:", err);
  }
}

// ---------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------
async function loadProducts() {
  els.productsStatus.textContent = "Loading products…";
  try {
    const snap = await getDocs(collection(db, "products"));
    products = [];
    snap.forEach((docSnap) => products.push({ id: docSnap.id, ...docSnap.data() }));
    products.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    els.productsStatus.textContent = "";
    renderProductsTable();
  } catch (err) {
    console.error("Failed to load products:", err);
    els.productsStatus.textContent = "Could not load products. Please refresh.";
  }
}

function renderProductsTable() {
  els.productsTableBody.innerHTML = "";
  products.forEach((product) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img src="${escapeHtml(product.image)}" alt="" onerror="this.style.visibility='hidden';"></td>
      <td>${escapeHtml(product.name)}</td>
      <td>${escapeHtml(product.category || "")}</td>
      <td>${escapeHtml(product.tag || "—")}</td>
      <td>Rs ${formatPrice(product.price)}</td>
      <td>${escapeHtml(product.displayOrder ?? "")}</td>
      <td><span class="status-pill ${product.active ? "status-active" : "status-hidden"}">${product.active ? "Active" : "Hidden"}</span></td>
      <td class="row-actions">
        <button type="button" class="btn btn-sm" data-edit="${product.id}">Edit</button>
        <button type="button" class="btn btn-sm" data-toggle="${product.id}">${product.active ? "Hide" : "Show"}</button>
        <button type="button" class="btn btn-sm" data-delete="${product.id}">Delete</button>
      </td>
    `;
    tr.querySelector("[data-edit]").addEventListener("click", () => openProductForm(product));
    tr.querySelector("[data-toggle]").addEventListener("click", () => toggleActive(product));
    tr.querySelector("[data-delete]").addEventListener("click", () => deleteProduct(product));
    els.productsTableBody.appendChild(tr);
  });
}

function openProductForm(product) {
  els.productFormWarning.style.display = "none";
  els.productForm.reset();
  els.productModalTitle.textContent = product ? "Edit product" : "Add product";

  const form = els.productForm;
  form.elements.id.value = product ? product.id : "";
  form.elements.name.value = product ? product.name : "";
  form.elements.price.value = product ? product.price : "";
  form.elements.oldPrice.value = product && product.oldPrice ? product.oldPrice : "";
  form.elements.category.value = product ? product.category || "" : "";
  form.elements.tag.value = product && product.tag ? product.tag : "";
  form.elements.image.value = product ? product.image || "" : "";
  form.elements.description.value = product ? product.description || "" : "";
  form.elements.colorsText.value = product
    ? (product.colors || []).map((c) => `${c.name}, ${c.hex}`).join("\n")
    : "";
  form.elements.displayOrder.value = product ? product.displayOrder : products.length + 1;
  form.elements.active.checked = product ? !!product.active : true;

  openModal(els.productModal);
}

async function handleProductFormSubmit(e) {
  e.preventDefault();
  const form = els.productForm;
  const id = form.elements.id.value.trim() || String(Date.now());

  const colors = form.elements.colorsText.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, hex] = line.split(",").map((s) => s.trim());
      return { name: name || "Colour", hex: hex || "#000000" };
    });

  const data = {
    name: form.elements.name.value.trim(),
    price: Number(form.elements.price.value) || 0,
    oldPrice: form.elements.oldPrice.value ? Number(form.elements.oldPrice.value) : null,
    category: form.elements.category.value.trim(),
    tag: form.elements.tag.value.trim() || null,
    image: form.elements.image.value.trim(),
    description: form.elements.description.value.trim(),
    colors,
    displayOrder: Number(form.elements.displayOrder.value) || 0,
    active: form.elements.active.checked
  };

  try {
    await setDoc(doc(db, "products", id), data, { merge: true });
    closeModal(els.productModal);
    await loadProducts();
  } catch (err) {
    console.error("Could not save product:", err);
    els.productFormWarning.textContent = "Could not save this product. Please try again.";
    els.productFormWarning.style.display = "block";
  }
}

async function toggleActive(product) {
  try {
    await updateDoc(doc(db, "products", product.id), { active: !product.active });
    await loadProducts();
  } catch (err) {
    console.error("Could not update product status:", err);
    alert("Could not update this product's status. Please try again.");
  }
}

async function deleteProduct(product) {
  if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
  try {
    await deleteDoc(doc(db, "products", product.id));
    await loadProducts();
  } catch (err) {
    console.error("Could not delete product:", err);
    alert("Could not delete this product. Please try again.");
  }
}

// ---------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------
async function loadOrders() {
  els.ordersStatus.textContent = "Loading orders…";
  try {
    const snap = await getDocs(collection(db, "orders"));
    orders = [];
    snap.forEach((docSnap) => orders.push({ id: docSnap.id, ...docSnap.data() }));
    orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    els.ordersStatus.textContent = "";
    renderOrders();
  } catch (err) {
    console.error("Failed to load orders:", err);
    els.ordersStatus.textContent = "Could not load orders. Please refresh.";
  }
}

function renderOrders() {
  const filtered = orders.filter((o) => (o.status || "pending") === currentOrderTab);
  els.ordersList.innerHTML = "";

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "panel-status";
    empty.textContent = `No ${currentOrderTab} orders.`;
    els.ordersList.appendChild(empty);
    return;
  }

  filtered.forEach((order) => {
    const card = document.createElement("article");
    card.className = "order-card";

    const itemsHtml = (order.items || [])
      .map(
        (item) => `<li>${escapeHtml(item.name)} — ${escapeHtml(item.color || "no colour")}${item.size ? ", " + escapeHtml(item.size) : ""} × ${item.qty} — Rs ${formatPrice(item.lineTotal ?? item.price * item.qty)} (Product ID: ${escapeHtml(item.productId)})</li>`
      )
      .join("");

    const actionsHtml =
      currentOrderTab === "pending"
        ? `<div class="order-actions">
             <button type="button" class="btn btn-sm btn-primary" data-complete>Mark completed</button>
             <button type="button" class="btn btn-sm" data-reject>Reject</button>
           </div>`
        : "";

    card.innerHTML = `
      <div class="order-card-head">
        <h3>${escapeHtml(order.orderId || order.id)}</h3>
        <span class="status-pill ${order.status === "completed" ? "status-active" : order.status === "rejected" ? "status-hidden" : ""}">${escapeHtml(order.status || "pending")}</span>
      </div>
      <p class="order-meta">
        ${escapeHtml(order.customerName)} · ${escapeHtml(order.phone)} · ${escapeHtml(order.city)}<br>
        ${escapeHtml(order.address)}<br>
        ${order.notes ? "Notes: " + escapeHtml(order.notes) + "<br>" : ""}
        Placed ${escapeHtml(order.orderDate || "")} at ${escapeHtml(order.orderTime || "")}
      </p>
      <ul class="order-items">${itemsHtml}</ul>
      <p class="order-totals">
        Subtotal: Rs ${formatPrice(order.subtotal)} &nbsp;·&nbsp;
        Shipping: ${order.shipping ? "Rs " + formatPrice(order.shipping) : "Free"} &nbsp;·&nbsp;
        <strong>Total: Rs ${formatPrice(order.total)}</strong>
      </p>
      ${actionsHtml}
    `;

    card.querySelector("[data-complete]")?.addEventListener("click", () => setOrderStatus(order, "completed"));
    card.querySelector("[data-reject]")?.addEventListener("click", () => setOrderStatus(order, "rejected"));

    els.ordersList.appendChild(card);
  });
}

async function setOrderStatus(order, status) {
  try {
    await updateDoc(doc(db, "orders", order.id), { status });
    await loadOrders();
  } catch (err) {
    console.error("Could not update order status:", err);
    alert("Could not update this order. Please try again.");
  }
}

// ---------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------
async function loadSettings() {
  els.settingsStatus.textContent = "";
  try {
    const snap = await getDocs(collection(db, "siteSettings"));
    let data = DEFAULT_SITE_SETTINGS;
    if (!snap.empty) {
      settingsDocId = snap.docs[0].id;
      data = { ...DEFAULT_SITE_SETTINGS, ...snap.docs[0].data() };
    } else {
      settingsDocId = "main";
    }
    const form = els.settingsForm;
    Object.keys(DEFAULT_SITE_SETTINGS).forEach((key) => {
      if (form.elements[key]) form.elements[key].value = data[key] ?? "";
    });
  } catch (err) {
    console.error("Failed to load settings:", err);
    els.settingsStatus.textContent = "Could not load settings.";
  }
}

async function handleSettingsSave(e) {
  e.preventDefault();
  const form = els.settingsForm;
  const data = {};
  Object.keys(DEFAULT_SITE_SETTINGS).forEach((key) => {
    data[key] = form.elements[key] ? form.elements[key].value.trim() : "";
  });
  els.settingsStatus.textContent = "Saving…";
  try {
    await setDoc(doc(db, "siteSettings", settingsDocId || "main"), data, { merge: true });
    els.settingsStatus.textContent = "Saved.";
  } catch (err) {
    console.error("Could not save settings:", err);
    els.settingsStatus.textContent = "Could not save settings. Please try again.";
  }
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
function openModal(modal) { modal.classList.add("is-open"); }
function closeModal(modal) { modal.classList.remove("is-open"); }
function formatPrice(n) { return (Number(n) || 0).toLocaleString("en-PK"); }
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
