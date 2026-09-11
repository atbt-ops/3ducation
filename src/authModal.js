import { signUp, signIn, signInGoogle } from "./auth.js";

let overlay = null;

function build() {
  const el = document.createElement("div");
  el.className = "modal-overlay";
  el.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="authTitle">
      <button class="modal-close" type="button" aria-label="Close">✕</button>
      <div class="modal-tabs" role="tablist">
        <button class="modal-tab" type="button" data-tab="signin" aria-selected="true">Sign in</button>
        <button class="modal-tab" type="button" data-tab="signup" aria-selected="false">Sign up</button>
      </div>
      <h2 id="authTitle" class="sr-only">Sign in or sign up</h2>
      <form id="authForm" class="modal-form">
        <div class="control" id="nameRow" hidden>
          <label for="authName">Name</label>
          <input type="text" id="authName" class="text-input" autocomplete="name">
        </div>
        <div class="control">
          <label for="authEmail">Email</label>
          <input type="email" id="authEmail" class="text-input" autocomplete="email" required>
        </div>
        <div class="control">
          <label for="authPass">Password</label>
          <input type="password" id="authPass" class="text-input" autocomplete="current-password" required minlength="6">
        </div>
        <p class="fact modal-error" id="authError" role="alert" hidden></p>
        <button class="btn primary" type="submit" id="authSubmit">Sign in</button>
      </form>
      <div class="modal-or"><span>or</span></div>
      <button class="btn" type="button" id="authGoogle">Continue with Google</button>
      <p class="fact">No account? Sign up takes ten seconds — just an email and a password.</p>
    </div>
  `;
  return el;
}

export function openAuthModal(onDone) {
  closeAuthModal();
  overlay = build();
  document.body.appendChild(overlay);

  let mode = "signin";
  const tabs = overlay.querySelectorAll(".modal-tab");
  const nameRow = overlay.querySelector("#nameRow");
  const submitBtn = overlay.querySelector("#authSubmit");
  const errorEl = overlay.querySelector("#authError");
  const form = overlay.querySelector("#authForm");

  function setMode(m) {
    mode = m;
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === m)));
    nameRow.hidden = m !== "signup";
    submitBtn.textContent = m === "signup" ? "Create account" : "Sign in";
    errorEl.hidden = true;
  }

  tabs.forEach((t) => t.addEventListener("click", () => setMode(t.dataset.tab)));

  overlay.querySelector(".modal-close").addEventListener("click", closeAuthModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeAuthModal();
  });
  document.addEventListener("keydown", onEsc);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    submitBtn.disabled = true;
    const email = overlay.querySelector("#authEmail").value.trim();
    const pass = overlay.querySelector("#authPass").value;
    const name = overlay.querySelector("#authName").value.trim();
    const result = mode === "signup" ? await signUp(name, email, pass) : await signIn(email, pass);
    submitBtn.disabled = false;
    if (result.error) {
      errorEl.textContent = result.error;
      errorEl.hidden = false;
      return;
    }
    closeAuthModal();
    onDone?.(result.user);
  });

  overlay.querySelector("#authGoogle").addEventListener("click", async () => {
    errorEl.hidden = true;
    const result = await signInGoogle();
    if (result.error) {
      errorEl.textContent = result.error;
      errorEl.hidden = false;
      return;
    }
    closeAuthModal();
    onDone?.(result.user);
  });

  setMode("signin");
  setTimeout(() => overlay.querySelector("#authEmail")?.focus(), 0);
}

function onEsc(e) {
  if (e.key === "Escape") closeAuthModal();
}

export function closeAuthModal() {
  if (!overlay) return;
  document.removeEventListener("keydown", onEsc);
  overlay.remove();
  overlay = null;
}
