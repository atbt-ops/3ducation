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
      <button class="btn" type="button" id="authGoogle">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.59.102-1.167.282-1.707V4.961H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.039l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
        </svg>
        <span>Continue with Google</span>
      </button>
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
