import { domains, displayName, formatValue } from "./domains.js";

const total = domains.length;
const grid = document.querySelector("#holdings-grid");
const heroCount = document.querySelector("#hero-count");
const holdingsEl = document.querySelector(".holdings");

let openIndex = null;

function tickerItemHTML(d) {
  return `<span class="ticker__item"><span class="ticker__name">${displayName(d.name)}</span><span class="ticker__value">${formatValue(d.value)}</span></span>`;
}

function buildTickers() {
  const sequence = domains.map(tickerItemHTML).join("");
  const loop = sequence + sequence;
  document.querySelectorAll("[data-ticker]").forEach((track) => {
    track.innerHTML = loop;
  });
}

function formHTML(d) {
  return `
    <form class="sheet" data-domain="${d.name}" novalidate>
      <header class="sheet__top">
        <div class="sheet__intro">
          <p class="sheet__eyebrow">Private offer</p>
          <p class="sheet__hint">Your details stay confidential. We’ll reply by email.</p>
        </div>
        <button type="button" class="sheet__close" aria-label="Close inquiry">
          <span aria-hidden="true">✕</span>
        </button>
      </header>

      <div class="sheet__fields">
        <label class="field">
          <span class="field__label">Name</span>
          <input class="field__input" name="name" type="text" autocomplete="name" required placeholder="Alex Rivera" />
        </label>
        <label class="field">
          <span class="field__label">Email</span>
          <input class="field__input" name="email" type="email" autocomplete="email" required placeholder="alex@company.com" />
        </label>
        <label class="field">
          <span class="field__label">Phone</span>
          <input class="field__input" name="phone" type="tel" autocomplete="tel" required placeholder="+1 (555) 000-0000" />
        </label>
        <label class="field field--offer">
          <span class="field__label">Your offer (USD)</span>
          <div class="field__offer-wrap">
            <span class="field__prefix">$</span>
            <input class="field__input field__input--offer" name="offer" type="text" inputmode="decimal" required placeholder="0" />
          </div>
        </label>
      </div>

      <footer class="sheet__foot">
        <button type="button" class="btn btn--ghost sheet__cancel">Cancel</button>
        <button type="submit" class="btn btn--primary btn--signal sheet__submit">Send private offer</button>
      </footer>
    </form>
  `;
}

function rowHTML(d, i) {
  return `
    <article class="row" data-index="${i}" id="holding-${i}">
      <div class="row__view">
        <span class="row__index">${String(i + 1).padStart(2, "0")}</span>
        <div class="row__main">
          <h3 class="row__name">${displayName(d.name)}</h3>
          <span class="row__tld">.${displayName(d.tld)}</span>
        </div>
        <span class="row__value">${formatValue(d.value)}</span>
        <button type="button" class="row__inquire" aria-label="Inquire about ${displayName(d.name)}">
          Inquire
        </button>
      </div>
      <div class="row__form" hidden></div>
    </article>
  `;
}

function setFocusMode(on) {
  holdingsEl?.classList.toggle("is-focusing", on);
  document.body.classList.toggle("is-offer-open", on);
}

function closeOpenRow() {
  if (openIndex === null || !grid) return;
  const row = grid.querySelector(`.row[data-index="${openIndex}"]`);
  if (!row) {
    openIndex = null;
    setFocusMode(false);
    return;
  }
  const view = row.querySelector(".row__view");
  const formWrap = row.querySelector(".row__form");
  row.classList.remove("is-inquiring");
  if (view) view.hidden = false;
  if (formWrap) {
    formWrap.hidden = true;
    formWrap.innerHTML = "";
  }
  openIndex = null;
  setFocusMode(false);
}

function openInquire(index) {
  if (!grid) return;
  if (openIndex === index) {
    closeOpenRow();
    return;
  }
  closeOpenRow();

  const d = domains[index];
  const row = grid.querySelector(`.row[data-index="${index}"]`);
  if (!row || !d) return;

  const view = row.querySelector(".row__view");
  const formWrap = row.querySelector(".row__form");
  if (!view || !formWrap) return;

  view.hidden = true;
  formWrap.hidden = false;
  formWrap.innerHTML = formHTML(d);
  row.classList.add("is-inquiring");
  openIndex = index;
  setFocusMode(true);

  const form = formWrap.querySelector("form");
  const closeBtns = formWrap.querySelectorAll(".sheet__close, .sheet__cancel");
  const nameInput = form?.querySelector('input[name="name"]');

  closeBtns.forEach((btn) => btn.addEventListener("click", () => closeOpenRow()));

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const offer = String(data.get("offer") || "").trim();
    if (!name || !email || !phone || !offer) {
      form.reportValidity();
      return;
    }

    const subject = encodeURIComponent(`Offer: ${d.name}`);
    const body = encodeURIComponent(
      [
        `Domain: ${d.name}`,
        `Portfolio mark: ${formatValue(d.value)}`,
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Offer (USD): ${offer}`,
      ].join("\n")
    );
    window.location.href = `mailto:inquire@cyberequities.com?subject=${subject}&body=${body}`;

    formWrap.innerHTML = `
      <div class="sheet sheet--done">
        <div class="sheet__done-icon" aria-hidden="true">✓</div>
        <p class="sheet__done-title">Offer ready</p>
        <p class="sheet__done-copy">Your mail client should open with the offer for <strong>${displayName(d.name)}</strong>.</p>
        <button type="button" class="btn btn--primary btn--signal sheet__done-close">Back to holdings</button>
      </div>
    `;
    formWrap
      .querySelector(".sheet__done-close")
      ?.addEventListener("click", () => closeOpenRow());
  });

  requestAnimationFrame(() => {
    nameInput?.focus({ preventScroll: true });
    row.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function buildHoldings() {
  if (!grid) return;
  grid.innerHTML = domains.map((d, i) => rowHTML(d, i)).join("");

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".row__inquire");
    if (!btn) return;
    const row = btn.closest(".row");
    if (!row) return;
    openInquire(Number(row.dataset.index));
  });
}

function init() {
  if (heroCount) heroCount.textContent = String(total);
  buildTickers();
  buildHoldings();

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOpenRow();
  });
}

init();
