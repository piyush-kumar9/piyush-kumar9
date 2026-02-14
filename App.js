import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

/* ----------------------------- Helpers ----------------------------- */
const money = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(n || 0));

const clampInt = (n, min, max) => {
  const v = Number.isFinite(n) ? n : min;
  return Math.max(min, Math.min(max, Math.floor(v)));
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 8+ chars, 1 lowercase, 1 uppercase, 1 number, 1 special
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
// Simple phone (India friendly)
const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;

/* ----------------------------- Data ----------------------------- */
const TOPPINGS = [
  { id: "pepperoni", name: "Pepperoni", price: 30 },
  { id: "sausage", name: "Sausage", price: 30 },
  { id: "mushrooms", name: "Mushrooms", price: 20 },
  { id: "green_peppers", name: "Green Peppers", price: 20 },
  { id: "onions", name: "Onions", price: 15 },
  { id: "black_olives", name: "Black Olives", price: 20 },
  { id: "extra_cheese", name: "Extra Cheese", price: 25 },
  { id: "bacon", name: "Bacon", price: 35 },
  { id: "ham", name: "Ham", price: 35 },
  { id: "pineapple", name: "Pineapple", price: 25 },
  { id: "jalapenos", name: "Jalapeños", price: 20 },
  { id: "tomatoes", name: "Tomatoes", price: 15 },
];

const SIZES = [
  { id: "small", name: 'Small 10"', price: 299 },
  { id: "medium", name: 'Medium 12"', price: 399 },
  { id: "large", name: 'Large 14"', price: 499 },
];

const CRUSTS = [
  { id: "regular", name: "Regular", price: 0 },
  { id: "thin", name: "Thin", price: 30 },
  { id: "thick", name: "Thick", price: 60 },
  { id: "stuffed", name: "Stuffed", price: 90 },
];

const SIDES = [
  { id: "coke", name: "Coke (500ml)", price: 50, type: "Drink" },
  { id: "sprite", name: "Sprite (500ml)", price: 50, type: "Drink" },
  { id: "garlic_dip", name: "Garlic Dip", price: 30, type: "Dip" },
  { id: "mayo_dip", name: "Mayo Dip", price: 30, type: "Dip" },
  { id: "fries", name: "Fries", price: 99, type: "Side" },
];

/* ----------------------------- App ----------------------------- */
export default function App() {
  const [activeTab, setActiveTab] = useState("register"); // register | order | receipt

  /* -------------------- Registration state -------------------- */
  const [reg, setReg] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    gender: "",
    acceptTerms: false,
  });

  const [regTouched, setRegTouched] = useState({});
  const [regSuccess, setRegSuccess] = useState("");

  const regErrors = useMemo(() => validateRegistration(reg), [reg]);
  const regIsValid = useMemo(() => Object.keys(regErrors).length === 0, [regErrors]);

  /* -------------------- Order state -------------------- */
  const [order, setOrder] = useState({
    customerName: "",
    phone: "",
    email: "",
    isDelivery: true,
    address: "",
    size: "medium",
    crust: "regular",
    qty: 1,
    toppings: [], // array of topping ids
    sidesQty: {}, // { sideId: qty }
    specialInstructions: "",
  });

  const [orderTouched, setOrderTouched] = useState({});
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const orderErrors = useMemo(() => validateOrder(order), [order]);
  const orderIsValid = useMemo(() => Object.keys(orderErrors).length === 0, [orderErrors]);

  const pricing = useMemo(() => calcOrderTotal(order), [order]);

  /* -------------------- LocalStorage optional -------------------- */
  useEffect(() => {
    // load saved order draft
    const saved = localStorage.getItem("marios_order_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setOrder((p) => ({ ...p, ...parsed }));
      } catch {}
    }
  }, []);

  useEffect(() => {
    // save order draft
    localStorage.setItem("marios_order_draft", JSON.stringify(order));
  }, [order]);

  /* -------------------- Handlers -------------------- */
  const onRegChange = (name, value) => {
    setReg((p) => ({ ...p, [name]: value }));
    setRegSuccess("");
  };

  const onRegBlur = (name) => setRegTouched((p) => ({ ...p, [name]: true }));

  const submitRegistration = (e) => {
    e.preventDefault();
    setRegTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      gender: true,
      acceptTerms: true,
    });

    if (!regIsValid) return;

    // mock submit
    localStorage.setItem("registered_user", JSON.stringify({ ...reg, password: undefined, confirmPassword: undefined }));
    setRegSuccess("✅ Registration successful!");
    setReg({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      gender: "",
      acceptTerms: false,
    });
    setRegTouched({});
  };

  const onOrderChange = (name, value) => {
    setOrder((p) => ({ ...p, [name]: value }));
  };

  const onOrderBlur = (name) => setOrderTouched((p) => ({ ...p, [name]: true }));

  const toggleTopping = (id) => {
    setOrder((p) => {
      const exists = p.toppings.includes(id);
      return { ...p, toppings: exists ? p.toppings.filter((x) => x !== id) : [...p.toppings, id] };
    });
  };

  const setSideQty = (id, qty) => {
    const safe = clampInt(qty, 0, 99);
    setOrder((p) => ({
      ...p,
      sidesQty: { ...p.sidesQty, [id]: safe },
    }));
  };

  const resetOrder = () => {
    setOrder({
      customerName: "",
      phone: "",
      email: "",
      isDelivery: true,
      address: "",
      size: "medium",
      crust: "regular",
      qty: 1,
      toppings: [],
      sidesQty: {},
      specialInstructions: "",
    });
    setOrderTouched({});
    localStorage.removeItem("marios_order_draft");
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    setOrderTouched({
      customerName: true,
      phone: true,
      email: true,
      address: true,
      size: true,
      crust: true,
      qty: true,
      toppings: true,
    });

    if (!orderIsValid) return;

    setOrderSubmitting(true);

    // simulate backend
    await new Promise((r) => setTimeout(r, 700));

    const newReceipt = buildReceipt(order, pricing);
    setReceipt(newReceipt);
    localStorage.setItem("last_receipt", JSON.stringify(newReceipt));
    setOrderSubmitting(false);
    setActiveTab("receipt");
  };

  const copyReceipt = async () => {
    if (!receipt) return;
    const text = receiptToText(receipt);
    try {
      await navigator.clipboard.writeText(text);
      alert("Receipt copied ✅");
    } catch {
      alert("Copy failed. Please try again.");
    }
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="App">
      <header className="app-header">
        <h1>react-essentials-assignment</h1>
        <p>User Registration System & Mario’s Pizza Online Ordering</p>

        <div className="tabs">
          <button className={activeTab === "register" ? "tab active" : "tab"} onClick={() => setActiveTab("register")}>
            Registration Form
          </button>
          <button className={activeTab === "order" ? "tab active" : "tab"} onClick={() => setActiveTab("order")}>
            Pizza Ordering
          </button>
          <button className={activeTab === "receipt" ? "tab active" : "tab"} onClick={() => setActiveTab("receipt")}>
            Receipt / Confirmation
          </button>
        </div>
      </header>

      <main className="container">
        {activeTab === "register" && (
          <section className="card">
            <h2>User Registration</h2>

            <form onSubmit={submitRegistration} className="form">
              <Field
                label="Name"
                value={reg.name}
                onChange={(v) => onRegChange("name", v)}
                onBlur={() => onRegBlur("name")}
                error={regTouched.name ? regErrors.name : ""}
                placeholder="Enter your name"
              />

              <Field
                label="Email"
                value={reg.email}
                onChange={(v) => onRegChange("email", v)}
                onBlur={() => onRegBlur("email")}
                error={regTouched.email ? regErrors.email : ""}
                placeholder="Enter your email"
              />

              <Field
                label="Phone"
                value={reg.phone}
                onChange={(v) => onRegChange("phone", v)}
                onBlur={() => onRegBlur("phone")}
                error={regTouched.phone ? regErrors.phone : ""}
                placeholder="Enter your phone number"
              />

              <Field
                label="Password"
                type="password"
                value={reg.password}
                onChange={(v) => onRegChange("password", v)}
                onBlur={() => onRegBlur("password")}
                error={regTouched.password ? regErrors.password : ""}
                placeholder="Strong password"
              />

              <Field
                label="Confirm Password"
                type="password"
                value={reg.confirmPassword}
                onChange={(v) => onRegChange("confirmPassword", v)}
                onBlur={() => onRegBlur("confirmPassword")}
                error={regTouched.confirmPassword ? regErrors.confirmPassword : ""}
                placeholder="Re-enter password"
              />

              <div className="field">
                <label>Gender</label>
                <select
                  value={reg.gender}
                  onChange={(e) => onRegChange("gender", e.target.value)}
                  onBlur={() => onRegBlur("gender")}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {regTouched.gender && regErrors.gender ? <p className="error">{regErrors.gender}</p> : null}
              </div>

              <div className="field">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={reg.acceptTerms}
                    onChange={(e) => onRegChange("acceptTerms", e.target.checked)}
                    onBlur={() => onRegBlur("acceptTerms")}
                  />
                  I accept Terms &amp; Conditions
                </label>
                {regTouched.acceptTerms && regErrors.acceptTerms ? <p className="error">{regErrors.acceptTerms}</p> : null}
              </div>

              <div className="actions">
                <button type="submit" disabled={!regIsValid}>
                  Submit
                </button>
                <button type="button" className="secondary" onClick={() => setRegTouched({})}>
                  Clear errors
                </button>
              </div>

              {regSuccess ? <div className="success">{regSuccess}</div> : null}
            </form>
          </section>
        )}

        {activeTab === "order" && (
          <section className="grid">
            {/* Left: Form */}
            <div className="card">
              <h2>Mario’s Pizza — Online Ordering</h2>

              <form onSubmit={placeOrder} className="form">
                <h3>Customer</h3>

                <Field
                  label="Customer name"
                  value={order.customerName}
                  onChange={(v) => onOrderChange("customerName", v)}
                  onBlur={() => onOrderBlur("customerName")}
                  error={orderTouched.customerName ? orderErrors.customerName : ""}
                  placeholder="Your name"
                />

                <Field
                  label="Phone"
                  value={order.phone}
                  onChange={(v) => onOrderChange("phone", v)}
                  onBlur={() => onOrderBlur("phone")}
                  error={orderTouched.phone ? orderErrors.phone : ""}
                  placeholder="Phone number"
                />

                <Field
                  label="Email"
                  value={order.email}
                  onChange={(v) => onOrderChange("email", v)}
                  onBlur={() => onOrderBlur("email")}
                  error={orderTouched.email ? orderErrors.email : ""}
                  placeholder="Email address"
                />

                <div className="field">
                  <label>Order type</label>
                  <div className="row">
                    <label className="radio">
                      <input
                        type="radio"
                        name="delivery"
                        checked={order.isDelivery === true}
                        onChange={() => onOrderChange("isDelivery", true)}
                      />
                      Delivery (+{money(40)})
                    </label>
                    <label className="radio">
                      <input
                        type="radio"
                        name="delivery"
                        checked={order.isDelivery === false}
                        onChange={() => onOrderChange("isDelivery", false)}
                      />
                      Pickup
                    </label>
                  </div>
                </div>

                {order.isDelivery && (
                  <Field
                    label="Delivery address"
                    value={order.address}
                    onChange={(v) => onOrderChange("address", v)}
                    onBlur={() => onOrderBlur("address")}
                    error={orderTouched.address ? orderErrors.address : ""}
                    placeholder="Full address"
                  />
                )}

                <h3>Pizza</h3>

                <div className="field">
                  <label>Size</label>
                  <select value={order.size} onChange={(e) => onOrderChange("size", e.target.value)} onBlur={() => onOrderBlur("size")}>
                    {SIZES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {money(s.price)}
                      </option>
                    ))}
                  </select>
                  {orderTouched.size && orderErrors.size ? <p className="error">{orderErrors.size}</p> : null}
                </div>

                <div className="field">
                  <label>Crust</label>
                  <select value={order.crust} onChange={(e) => onOrderChange("crust", e.target.value)} onBlur={() => onOrderBlur("crust")}>
                    {CRUSTS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.price ? `(+${money(c.price)})` : ""}
                      </option>
                    ))}
                  </select>
                  {orderTouched.crust && orderErrors.crust ? <p className="error">{orderErrors.crust}</p> : null}
                </div>

                <div className="field">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={order.qty}
                    onChange={(e) => onOrderChange("qty", clampInt(parseInt(e.target.value || "1", 10), 1, 10))}
                    onBlur={() => onOrderBlur("qty")}
                  />
                  {orderTouched.qty && orderErrors.qty ? <p className="error">{orderErrors.qty}</p> : null}
                </div>

                <div className="field">
                  <label>Toppings (multi-select)</label>
                  <div className="chips">
                    {TOPPINGS.map((t) => {
                      const active = order.toppings.includes(t.id);
                      return (
                        <button
                          type="button"
                          key={t.id}
                          className={active ? "chip active" : "chip"}
                          onClick={() => {
                            toggleTopping(t.id);
                            onOrderBlur("toppings");
                          }}
                        >
                          {t.name} (+{money(t.price)})
                        </button>
                      );
                    })}
                  </div>
                  {orderTouched.toppings && orderErrors.toppings ? <p className="error">{orderErrors.toppings}</p> : null}
                </div>

                <h3>Sides (drinks, dips, etc.)</h3>
                <div className="field">
                  {Object.entries(groupSidesByType(SIDES)).map(([type, items]) => (
                    <div key={type} className="sideGroup">
                      <div className="sideTitle">{type}</div>
                      {items.map((it) => (
                        <div key={it.id} className="sideRow">
                          <div>
                            <b>{it.name}</b> <span className="muted">({money(it.price)})</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={order.sidesQty[it.id] || 0}
                            onChange={(e) => setSideQty(it.id, parseInt(e.target.value || "0", 10))}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="field">
                  <label>Special instructions</label>
                  <textarea
                    rows={3}
                    value={order.specialInstructions}
                    onChange={(e) => onOrderChange("specialInstructions", e.target.value)}
                    placeholder="e.g., extra napkins, ring bell once..."
                  />
                </div>

                <div className="actions">
                  <button type="submit" disabled={!orderIsValid || orderSubmitting}>
                    {orderSubmitting ? "Placing order..." : `Place order — ${money(pricing.total)}`}
                  </button>
                  <button type="button" className="secondary" onClick={resetOrder}>
                    Reset / Clear
                  </button>
                </div>

                {!orderIsValid && (
                  <div className="hint">
                    Fill required fields and fix errors to enable submit.
                  </div>
                )}
              </form>
            </div>

            {/* Right: Summary / Preview */}
            <div className="card">
              <h2>Summary</h2>

              <div className="summaryBlock">
                <div className="sumRow">
                  <span>Pizza</span>
                  <span>{money(pricing.pizzaTotal)}</span>
                </div>
                <div className="muted">
                  {SIZES.find((s) => s.id === order.size)?.name} • {CRUSTS.find((c) => c.id === order.crust)?.name} • Qty {order.qty}
                </div>
              </div>

              <div className="summaryBlock">
                <div className="sumRow">
                  <span>Toppings</span>
                  <span>{money(pricing.toppingsTotal)}</span>
                </div>
                <div className="muted">
                  {order.toppings.length ? order.toppings.map((id) => TOPPINGS.find((t) => t.id === id)?.name).join(", ") : "None"}
                </div>
              </div>

              <div className="summaryBlock">
                <div className="sumRow">
                  <span>Sides</span>
                  <span>{money(pricing.sidesTotal)}</span>
                </div>
                <div className="muted">
                  {pricing.sidesLines.length
                    ? pricing.sidesLines.map((l) => `${l.name} × ${l.qty}`).join(", ")
                    : "None"}
                </div>
              </div>

              <div className="summaryBlock">
                <div className="sumRow">
                  <span>Delivery</span>
                  <span>{money(pricing.deliveryFee)}</span>
                </div>
                <div className="muted">{order.isDelivery ? "Delivery selected" : "Pickup selected"}</div>
              </div>

              <div className="divider" />

              <div className="sumRow total">
                <span>Total</span>
                <span>{money(pricing.total)}</span>
              </div>

              <div className="preview">
                <h3>Order Preview</h3>
                <p className="muted">
                  Customer: <b>{order.customerName || "—"}</b>
                </p>
                <p className="muted">
                  Contact: <b>{order.phone || "—"}</b> • <b>{order.email || "—"}</b>
                </p>
                {order.isDelivery ? (
                  <p className="muted">
                    Address: <b>{order.address || "—"}</b>
                  </p>
                ) : null}
                {order.specialInstructions ? <p className="muted">Note: {order.specialInstructions}</p> : null}
              </div>
            </div>
          </section>
        )}

        {activeTab === "receipt" && (
          <section className="card">
            <h2>Order Receipt / Confirmation</h2>

            {!receipt ? (
              <div className="hint">
                No receipt yet. Place an order from <b>Pizza Ordering</b>.
              </div>
            ) : (
              <div className="receipt">
                <div className="receiptHeader">
                  <div>
                    <h3>Mario’s Pizza</h3>
                    <p className="muted">Order confirmed ✅</p>
                  </div>
                  <div className="receiptMeta">
                    <div>
                      <span className="muted">Order ID</span>
                      <div className="mono">{receipt.id}</div>
                    </div>
                    <div>
                      <span className="muted">Date</span>
                      <div className="mono">{new Date(receipt.createdAt).toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                </div>

                <div className="divider" />

                <h4>Customer</h4>
                <p>
                  <b>{receipt.customer.name}</b> • <span className="mono">{receipt.customer.phone}</span> •{" "}
                  <span className="mono">{receipt.customer.email}</span>
                </p>
                {receipt.customer.isDelivery ? (
                  <p>
                    <b>Delivery:</b> {receipt.customer.address}
                  </p>
                ) : (
                  <p>
                    <b>Pickup</b>
                  </p>
                )}

                <div className="divider" />

                <h4>Items</h4>
                <ul className="receiptList">
                  {receipt.lines.map((l, idx) => (
                    <li key={idx} className="receiptLine">
                      <span>
                        {l.name} {l.qty > 1 ? `× ${l.qty}` : ""}
                      </span>
                      <span className="mono">{money(l.total)}</span>
                    </li>
                  ))}
                </ul>

                <div className="divider" />

                <div className="receiptTotals">
                  <div className="receiptLine">
                    <span>Subtotal</span>
                    <span className="mono">{money(receipt.subtotal)}</span>
                  </div>
                  <div className="receiptLine">
                    <span>Delivery</span>
                    <span className="mono">{money(receipt.deliveryFee)}</span>
                  </div>
                  <div className="receiptLine total">
                    <span>Total</span>
                    <span className="mono">{money(receipt.total)}</span>
                  </div>
                </div>

                {receipt.specialInstructions ? (
                  <>
                    <div className="divider" />
                    <p>
                      <b>Special instructions:</b> {receipt.specialInstructions}
                    </p>
                  </>
                ) : null}

                <div className="actions">
                  <button type="button" onClick={copyReceipt}>
                    Copy receipt
                  </button>
                  <button type="button" className="secondary" onClick={() => window.print()}>
                    Print
                  </button>
                  <button type="button" className="secondary" onClick={() => setActiveTab("order")}>
                    New order
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

/* ----------------------------- Components ----------------------------- */
function Field({ label, value, onChange, onBlur, error, placeholder, type = "text" }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} type={type} />
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}

/* ----------------------------- Validation ----------------------------- */
function validateRegistration(reg) {
  const errors = {};

  if (!reg.name.trim()) errors.name = "Name is required";
  else if (reg.name.trim().length < 2) errors.name = "Name must be at least 2 characters";

  if (!reg.email.trim()) errors.email = "Email is required";
  else if (!emailRegex.test(reg.email)) errors.email = "Invalid email format";

  if (!reg.phone.trim()) errors.phone = "Phone number is required";
  else if (!phoneRegex.test(reg.phone.replace(/\s/g, ""))) errors.phone = "Invalid phone number";

  if (!reg.password) errors.password = "Password is required";
  else if (!strongPasswordRegex.test(reg.password))
    errors.password = "8+ chars with uppercase, lowercase, number, and special (@$!%*?&)";

  if (!reg.confirmPassword) errors.confirmPassword = "Confirm password is required";
  else if (reg.confirmPassword !== reg.password) errors.confirmPassword = "Passwords do not match";

  if (!reg.gender) errors.gender = "Please select gender";

  if (!reg.acceptTerms) errors.acceptTerms = "You must accept Terms & Conditions";

  return errors;
}

function validateOrder(order) {
  const errors = {};

  if (!order.customerName.trim()) errors.customerName = "Customer name is required";
  if (!order.phone.trim()) errors.phone = "Phone number is required";
  else if (!phoneRegex.test(order.phone.replace(/\s/g, ""))) errors.phone = "Invalid phone number";

  if (!order.email.trim()) errors.email = "Email is required";
  else if (!emailRegex.test(order.email)) errors.email = "Invalid email format";

  if (order.isDelivery && !order.address.trim()) errors.address = "Delivery address is required";

  if (!order.size) errors.size = "Select a size";
  if (!order.crust) errors.crust = "Select a crust";

  if (!order.qty || order.qty < 1) errors.qty = "Quantity must be at least 1";

  // business rule: at least 1 topping
  if (!order.toppings || order.toppings.length === 0) errors.toppings = "Select at least one topping";

  return errors;
}

/* ----------------------------- Pricing ----------------------------- */
function calcOrderTotal(order) {
  const size = SIZES.find((s) => s.id === order.size);
  const crust = CRUSTS.find((c) => c.id === order.crust);

  const pizzaBase = (size?.price || 0) + (crust?.price || 0);
  const qty = clampInt(order.qty || 1, 1, 10);

  const toppingsTotalSingle = (order.toppings || []).reduce((sum, id) => {
    const t = TOPPINGS.find((x) => x.id === id);
    return sum + (t?.price || 0);
  }, 0);

  const pizzaTotal = (pizzaBase + toppingsTotalSingle) * qty;

  const sidesLines = SIDES.map((s) => {
    const q = clampInt(parseInt(order.sidesQty?.[s.id] || 0, 10), 0, 99);
    if (!q) return null;
    return { id: s.id, name: s.name, price: s.price, qty: q, total: s.price * q };
  }).filter(Boolean);

  const sidesTotal = sidesLines.reduce((sum, l) => sum + l.total, 0);

  const deliveryFee = order.isDelivery ? 40 : 0;

  const subtotal = pizzaTotal + sidesTotal;
  const total = subtotal + deliveryFee;

  return { pizzaTotal, toppingsTotal: toppingsTotalSingle * qty, sidesTotal, sidesLines, deliveryFee, subtotal, total };
}

function groupSidesByType(items) {
  return items.reduce((acc, it) => {
    acc[it.type] = acc[it.type] || [];
    acc[it.type].push(it);
    return acc;
  }, {});
}

/* ----------------------------- Receipt ----------------------------- */
function buildReceipt(order, pricing) {
  const id = "ORD-" + Math.random().toString(16).slice(2, 8).toUpperCase();
  const createdAt = new Date().toISOString();

  const size = SIZES.find((s) => s.id === order.size);
  const crust = CRUSTS.find((c) => c.id === order.crust);

  const pizzaName = `Pizza: ${size?.name || ""} • ${crust?.name || ""}`;

  const toppingNames = (order.toppings || [])
    .map((id) => TOPPINGS.find((t) => t.id === id)?.name)
    .filter(Boolean);

  const lines = [];

  lines.push({
    name: `${pizzaName} (Qty ${order.qty})`,
    qty: 1,
    total: pricing.pizzaTotal,
  });

  if (toppingNames.length) {
    lines.push({
      name: `Toppings: ${toppingNames.join(", ")}`,
      qty: 1,
      total: 0,
    });
  }

  pricing.sidesLines.forEach((l) => {
    lines.push({ name: l.name, qty: l.qty, total: l.total });
  });

  if (pricing.deliveryFee) {
    lines.push({ name: "Delivery Fee", qty: 1, total: pricing.deliveryFee });
  }

  return {
    id,
    createdAt,
    customer: {
      name: order.customerName,
      phone: order.phone,
      email: order.email,
      isDelivery: order.isDelivery,
      address: order.address,
    },
    lines,
    subtotal: pricing.subtotal,
    deliveryFee: pricing.deliveryFee,
    total: pricing.total,
    specialInstructions: order.specialInstructions,
  };
}

function receiptToText(receipt) {
  const out = [];
  out.push("Mario’s Pizza — Order Confirmation");
  out.push(`Order ID: ${receipt.id}`);
  out.push(`Date: ${new Date(receipt.createdAt).toLocaleString("en-IN")}`);
  out.push("");
  out.push(`Customer: ${receipt.customer.name}`);
  out.push(`Phone: ${receipt.customer.phone}`);
  out.push(`Email: ${receipt.customer.email}`);
  out.push(receipt.customer.isDelivery ? `Delivery: ${receipt.customer.address}` : "Pickup");
  out.push("");
  out.push("Items:");
  receipt.lines.forEach((l) => out.push(`- ${l.name}${l.total ? ` — ${money(l.total)}` : ""}`));
  out.push("");
  out.push(`Subtotal: ${money(receipt.subtotal)}`);
  out.push(`Delivery: ${money(receipt.deliveryFee)}`);
  out.push(`TOTAL: ${money(receipt.total)}`);
  if (receipt.specialInstructions) out.push(`Note: ${receipt.specialInstructions}`);
  return out.join("\n");
}

