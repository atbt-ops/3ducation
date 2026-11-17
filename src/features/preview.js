import runtime from "../generated/preview-runtime.txt?raw";
import { validateCode } from "./simulation-language.js";
export function mountPreview(host, code, onStatus = () => {}) {
  validateCode(code);
  const iframe = document.createElement("iframe");
  iframe.title = "Isolated Three.js simulation preview";
  iframe.className = "simulation-frame";
  iframe.setAttribute("sandbox", "allow-scripts");
  iframe.referrerPolicy = "no-referrer";
  const nonce = crypto.randomUUID().replace(/-/g, "");
  // Unique opaque origin, no network, nested frames, forms, navigation or storage.
  iframe.srcdoc = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'none'; img-src data:; font-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'"><style>body{margin:0;overflow:hidden}canvas{display:block;touch-action:none}</style><script nonce="${nonce}">${runtime.replace(/<\/script/gi, "<\\/script")}</script>`;
  const receive = (e) => {
    if (e.source !== iframe.contentWindow || !e.data?.sparkPreview) return;
    if (e.data.type === "ready")
      iframe.contentWindow.postMessage({ type: "spark-preview-code", code }, "*");
    else onStatus(e.data.type, String(e.data.message).slice(0, 300));
  };
  addEventListener("message", receive);
  host.replaceChildren(iframe);
  return () => {
    removeEventListener("message", receive);
    iframe.remove();
  };
}
