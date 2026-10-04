/* =========================================================
   Adventure Escape SA — Shared JavaScript
   Each piece below only runs if the relevant elements exist
   on the current page:
     1. Mobile nav toggle        (every page)
     2. Overview page tabs       (overview.html)
     3. Individual item page     (individual.html)
     4. Calculate Fee logic      (calculate.html)
     5. Contact form validation  (contact.html)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initNavToggle();
  initTabs();
  initCalculator();
  initContactForm();
  initIndividualPage();
});

/* ---------------------------------------------------------
   1. Mobile nav toggle
   --------------------------------------------------------- */
function initNavToggle() {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

/* ---------------------------------------------------------
   2. Overview page — Packages / Activities tabs
   --------------------------------------------------------- */
function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  if (tabButtons.length === 0) return;

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");

      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(targetId).classList.add("active");
    });
  });
}

/* ---------------------------------------------------------
   3. Individual item page — reads ?item= from the URL and
      fills in the matching package/activity details.
   --------------------------------------------------------- */
const ITEM_DETAILS = {
  "ultimate-adventure-day": {
    name: "Ultimate Adventure Day",
    price: 1500,
    description: "A full-day outdoor adventure featuring multiple exciting activities, guided every step of the way.",
    includes: ["Guided hiking trail", "Ziplining", "Kayaking", "Lunch", "Safety briefing and equipment"],
  },
  "family-explorer": {
    name: "Family Explorer Package",
    price: 1500,
    description: "A fun-filled outdoor experience designed for families, combining nature, games, and wildlife spotting.",
    includes: ["Nature walk", "Obstacle course", "Picnic area", "Family games", "Guided wildlife spotting"],
  },
  "mountain-adventure": {
    name: "Mountain Adventure Package",
    price: 1500,
    description: "A guided mountain adventure for outdoor enthusiasts, taking in scenic viewpoints along the way.",
    includes: ["Mountain hiking", "Scenic viewpoints", "Rock scrambling", "Safety equipment", "Professional guide"],
  },
  "corporate-team-challenge": {
    name: "Corporate Team Challenge",
    price: 1500,
    description: "Team-building activities designed for businesses and organisations looking to build stronger teams.",
    includes: ["Team obstacle course", "Orienteering challenge", "Raft-building activity", "Leadership exercises", "Team awards"],
  },
  "ziplining": {
    name: "Ziplining Adventure",
    price: 750,
    description: "Experience breathtaking views while ziplining through the forest canopy.",
    includes: ["Safety briefing", "Equipment hire", "Professional instructors"],
  },
  "kayaking": {
    name: "Kayaking Experience",
    price: 750,
    description: "Paddle through scenic rivers and lakes on a guided kayaking route.",
    includes: ["Kayak and paddle", "Safety equipment", "Guided route"],
  },
  "rock-climbing": {
    name: "Rock Climbing Session",
    price: 750,
    description: "Learn climbing techniques on natural rock faces under professional guidance.",
    includes: ["Climbing equipment", "Safety instruction", "Professional guide"],
  },
};

function initIndividualPage() {
  const nameEl = document.getElementById("itemName");
  if (!nameEl) return; // not on individual.html

  const params = new URLSearchParams(window.location.search);
  const itemId = params.get("item");
  const item = ITEM_DETAILS[itemId];

  if (!item) {
    nameEl.textContent = "Item not found";
    document.getElementById("itemDescription").textContent =
      "Please go back to the Overview page and select a package or activity.";
    return;
  }

  document.title = `Adventure Escape SA — ${item.name}`;
  nameEl.textContent = item.name;

  const breadcrumbEl = document.getElementById("breadcrumbItem");
  if (breadcrumbEl) breadcrumbEl.textContent = item.name;

  document.getElementById("itemPrice").textContent = `R ${item.price.toLocaleString()}`;
  document.getElementById("itemDescription").textContent = item.description;
  document.getElementById("itemIncludes").innerHTML = item.includes
    .map((point) => `<li>${point}</li>`)
    .join("");

  const bookingLink = document.getElementById("bookingLink");
  if (bookingLink) bookingLink.href = `calculate.html?item=${itemId}`;

  renderAlsoLike(itemId);
}

function renderAlsoLike(currentItemId) {
  const grid = document.getElementById("alsoLikeGrid");
  if (!grid) return;

  const otherIds = Object.keys(ITEM_DETAILS).filter((id) => id !== currentItemId);

  // Pick 3 other items at random so it varies a bit between visits.
  const shuffled = otherIds.sort(() => 0.5 - Math.random());
  const picks = shuffled.slice(0, 3);

  grid.innerHTML = picks
    .map((id) => {
      const item = ITEM_DETAILS[id];
      return `
    <a href="individual.html?item=${id}" class="card" style="text-decoration: none; color: inherit;">
      <div class="placeholder placeholder--wide">IMAGE</div>
      <div class="card-body">
        <h3 class="card-title">${item.name}</h3>
      </div>
    </a>
  `;
    })
    .join("");
}

/* ---------------------------------------------------------
   4. Calculate Fee page
   --------------------------------------------------------- */

// Demo data — swap for real package/activity data (or load it
// from an API/JSON file) once the group has a backend for this.
const CALC_DATA = [
  { id: "ultimate-adventure-day", name: "Ultimate Adventure Day", price: 1500, qty: 0 },
  { id: "family-explorer", name: "Family Explorer Package", price: 1500, qty: 0 },
  { id: "mountain-adventure", name: "Mountain Adventure Package", price: 1500, qty: 0 },
  { id: "corporate-team-challenge", name: "Corporate Team Challenge", price: 1500, qty: 0 },
  { id: "ziplining", name: "Ziplining Adventure", price: 750, qty: 0 },
  { id: "kayaking", name: "Kayaking Experience", price: 750, qty: 0 },
  { id: "rock-climbing", name: "Rock Climbing Session", price: 750, qty: 0 },
];

// Discount tiers — matches the scenario brief:
// 1 booking = no discount, 2 bookings = 5% off, 3+ bookings = 10% off.
const DISCOUNT_TIERS = [
  { minBookings: 2, rate: 0.05 },
  { minBookings: 3, rate: 0.10 },
];

function initCalculator() {
  const list = document.getElementById("calcItems");
  if (!list) return; // not on the calculate page

  // If arriving from an "Add to Booking" link (e.g. calculate.html?item=ziplining),
  // automatically add that item with a quantity of 1.
  const params = new URLSearchParams(window.location.search);
  const incomingId = params.get("item");
  if (incomingId) {
    const incomingItem = CALC_DATA.find((i) => i.id === incomingId);
    if (incomingItem && incomingItem.qty === 0) {
      incomingItem.qty = 1;
    }
  }

  renderCalcItems();

  list.addEventListener("click", (e) => {
    const itemEl = e.target.closest("[data-id]");
    if (!itemEl) return;
    const id = itemEl.getAttribute("data-id");
    const item = CALC_DATA.find((i) => i.id === id);
    if (!item) return;

    if (e.target.matches(".qty-increase")) {
      item.qty += 1;
    } else if (e.target.matches(".qty-decrease")) {
      item.qty = Math.max(0, item.qty - 1);
    } else if (e.target.matches(".remove-item")) {
      item.qty = 0;
    } else {
      return;
    }

    renderCalcItems();
  });

  const alsoLike = document.getElementById("calcAlsoLike");
  if (alsoLike) {
    alsoLike.addEventListener("click", (e) => {
      if (!e.target.matches(".also-like-add")) return;
      const id = e.target.getAttribute("data-id");
      const item = CALC_DATA.find((i) => i.id === id);
      if (!item) return;
      item.qty = 1;
      renderCalcItems();
    });
  }
}

function renderCalcAlsoLike() {
  const container = document.getElementById("calcAlsoLike");
  if (!container) return;

  // Suggest items that aren't already in the booking.
  const suggestions = CALC_DATA.filter((i) => i.qty === 0);

  if (suggestions.length === 0) {
    container.innerHTML = `<p style="color: var(--color-gray-500);">You've added everything on offer!</p>`;
    return;
  }

  container.innerHTML = `
    <div class="grid grid-3">
      ${suggestions
        .map(
          (item) => `
        <div class="card">
          <div class="placeholder placeholder--wide">IMAGE</div>
          <div class="card-body">
            <h3 class="card-title">${item.name}</h3>
            <div class="footer-small" style="color: var(--color-gray-500); margin-bottom: 8px;">R${item.price}</div>
            <button type="button" class="btn btn-outline btn-block also-like-add" data-id="${item.id}">Add</button>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function renderCalcItems() {
  const list = document.getElementById("calcItems");
  const visibleItems = CALC_DATA.filter((i) => i.qty > 0);

  list.innerHTML = visibleItems
    .map(
      (item) => `
    <div class="calc-item" data-id="${item.id}">
      <div class="calc-item-info">
        <div class="placeholder placeholder--square">IMG</div>
        <div>
          <div class="card-title">${item.name}</div>
          <div class="footer-small" style="color: var(--color-gray-500);">R${item.price} each</div>
        </div>
      </div>
      <div>
        <div class="qty-control">
          <button type="button" class="qty-decrease" aria-label="Decrease quantity">&minus;</button>
          <span>${item.qty}</span>
          <button type="button" class="qty-increase" aria-label="Increase quantity">+</button>
        </div>
        <button type="button" class="remove-item">Remove</button>
      </div>
    </div>
  `
    )
    .join("");

  if (visibleItems.length === 0) {
    list.innerHTML = `<p style="color: var(--color-gray-500);">No items selected yet. Add a package or activity from the Overview page.</p>`;
  }

  updateSummary(visibleItems);
  renderCalcAlsoLike();
}

const VAT_RATE = 0.15; // 15% VAT, applied after the discount

function updateSummary(visibleItems) {
  const totalBookings = visibleItems.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = visibleItems.reduce((sum, i) => sum + i.qty * i.price, 0);

  // Find the best discount tier the customer currently qualifies for.
  const earnedTier = [...DISCOUNT_TIERS]
    .sort((a, b) => b.minBookings - a.minBookings)
    .find((tier) => totalBookings >= tier.minBookings);
  const rate = earnedTier ? earnedTier.rate : 0;

  const discount = subtotal * rate;
  const afterDiscount = subtotal - discount;
  const vat = afterDiscount * VAT_RATE;
  const total = afterDiscount + vat;

  document.getElementById("summaryCount").textContent = totalBookings;
  document.getElementById("summarySubtotal").textContent = `R${subtotal.toFixed(0)}`;
  document.getElementById("summaryDiscountPct").textContent = `${Math.round(rate * 100)}%`;
  document.getElementById("summaryDiscount").textContent = `− R${discount.toFixed(0)}`;
  document.getElementById("summaryVat").textContent = `R${vat.toFixed(0)}`;
  document.getElementById("summaryTotal").textContent = `R${total.toFixed(0)}`;

  // Progress bar towards the next tier (or "unlocked" once at the top tier).
  const nextTier = [...DISCOUNT_TIERS]
    .sort((a, b) => a.minBookings - b.minBookings)
    .find((tier) => totalBookings < tier.minBookings);

  const progressFill = document.getElementById("progressFill");
  const progressLabel = document.getElementById("progressLabel");

  if (nextTier) {
    const pct = Math.min(100, (totalBookings / nextTier.minBookings) * 100);
    progressFill.style.width = `${pct}%`;
    progressLabel.textContent = `${totalBookings} booking(s) — ${nextTier.minBookings - totalBookings} more for ${Math.round(nextTier.rate * 100)}% off`;
  } else {
    progressFill.style.width = "100%";
    progressLabel.textContent = `${totalBookings} booking(s) — top discount tier unlocked`;
  }
}

/* ---------------------------------------------------------
   5. Contact page — simple client-side validation
   --------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let isValid = true;

    const fullName = document.getElementById("fullName");
    const email = document.getElementById("email");
    const message = document.getElementById("message");

    isValid = validateField(fullName, "fullNameError", (v) => v.trim().length > 0, "Please enter your name.") && isValid;

    isValid =
      validateField(
        email,
        "emailError",
        (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
        "Please enter a valid email address."
      ) && isValid;

    isValid = validateField(message, "messageError", (v) => v.trim().length > 0, "Please enter a message.") && isValid;

    const status = document.getElementById("formStatus");

    if (isValid) {
      // No backend wired up yet — replace this with a real submit
      // (fetch to an endpoint, mailto, or a form service) later.
      status.textContent = "Thanks! Your message has been noted (demo only — not yet sent anywhere).";
      status.className = "form-status success";
      form.reset();
    } else {
      status.textContent = "Please fix the errors above.";
      status.className = "form-status";
    }
  });
}

function validateField(field, errorId, testFn, message) {
  const errorEl = document.getElementById(errorId);
  if (testFn(field.value)) {
    errorEl.textContent = "";
    return true;
  }
  errorEl.textContent = message;
  return false;
}