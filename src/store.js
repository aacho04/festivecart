/**
 * store.js — Reactive shared store for FestiveCart.
 *
 * Persists Admin changes (products, festive theme settings, payment methods, orders)
 * in localStorage AND broadcasts updates across all open tabs via BroadcastChannel
 * + the native `storage` event so every open Customer/Admin tab updates instantly.
 */

import { PRODUCTS as DEFAULT_PRODUCTS } from "./products.js";

const KEYS = {
  PRODUCTS: "fc_store_products_v1",
  THEME:    "fc_store_theme_v1",
  PAYMENTS: "fc_store_payments_v1",
  ORDERS:   "fc_store_orders_v1",
};

const CHANNEL_NAME = "festivecart_sync_v1";
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL_NAME) : null;
const listeners = new Set();

function notifyListeners(area = "all") {
  listeners.forEach((fn) => {
    try { fn(area); } catch (err) { console.error("[Store] listener error:", err); }
  });
}

function broadcast(area) {
  notifyListeners(area);
  channel?.postMessage({ area, ts: Date.now() });
}

if (channel) {
  channel.onmessage = (e) => notifyListeners(e.data?.area ?? "all");
}

window.addEventListener("storage", (e) => {
  if (Object.values(KEYS).includes(e.key)) {
    notifyListeners("all");
  }
});

/** Subscribe to any store change (local or from another open tab). Returns unsubscribe fn. */
export function subscribeStore(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, val, area) {
  localStorage.setItem(key, JSON.stringify(val));
  broadcast(area);
}

/* ─── PRODUCTS ──────────────────────────────────────────────────────────── */
export function getProducts() {
  const list = readJSON(KEYS.PRODUCTS, null);
  if (Array.isArray(list) && list.length > 0) return list;
  return DEFAULT_PRODUCTS.map((p) => ({ ...p }));
}

export function addProduct(product) {
  const list = getProducts();
  const nextId = list.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1;
  const created = {
    id: nextId,
    inStock: true,
    rating: 4.5,
    reviews: 1,
    delivery: "🚚 Free delivery",
    ...product,
  };
  list.unshift(created);
  writeJSON(KEYS.PRODUCTS, list, "products");
  return created;
}

export function toggleProductStock(id) {
  const list = getProducts().map((p) =>
    p.id === id ? { ...p, inStock: p.inStock === false ? true : false } : p
  );
  writeJSON(KEYS.PRODUCTS, list, "products");
}

export function deleteProduct(id) {
  const list = getProducts().filter((p) => p.id !== id);
  writeJSON(KEYS.PRODUCTS, list, "products");
}

export function resetProducts() {
  writeJSON(KEYS.PRODUCTS, DEFAULT_PRODUCTS.map((p) => ({ ...p })), "products");
}

/* ─── THEME & FLAGSMITH OVERRIDES ───────────────────────────────────────── */
const DEFAULT_THEME = {
  festiveOverride: null,   // null = use Flagsmith; true/false = admin override
  simulatedDate: null,     // null = today; "YYYY-MM-DD" = simulated date
  variationOverride: null, // null = Flagsmith/auto; "control" | "festive"
};

export function getThemeSettings() {
  return { ...DEFAULT_THEME, ...readJSON(KEYS.THEME, {}) };
}

export function setThemeSettings(partial) {
  const next = { ...getThemeSettings(), ...partial };
  writeJSON(KEYS.THEME, next, "theme");
  return next;
}

/* ─── PAYMENT & STORE SETTINGS ──────────────────────────────────────────── */
const DEFAULT_PAYMENTS = {
  upi: true,
  card: true,
  netbanking: true,
  cod: true,
  freeDeliveryThreshold: 499,
};

export function getPaymentSettings() {
  return { ...DEFAULT_PAYMENTS, ...readJSON(KEYS.PAYMENTS, {}) };
}

export function setPaymentSettings(partial) {
  const next = { ...getPaymentSettings(), ...partial };
  writeJSON(KEYS.PAYMENTS, next, "payments");
  return next;
}

/* ─── ORDERS ────────────────────────────────────────────────────────────── */
export function getOrders() {
  return readJSON(KEYS.ORDERS, []);
}

export function addOrder(order) {
  const orders = getOrders();
  orders.unshift({ ...order, status: "Processing", createdAt: new Date().toISOString() });
  writeJSON(KEYS.ORDERS, orders, "orders");
}

export function updateOrderStatus(orderId, status) {
  const orders = getOrders().map((o) => (o.orderId === orderId ? { ...o, status } : o));
  writeJSON(KEYS.ORDERS, orders, "orders");
}

