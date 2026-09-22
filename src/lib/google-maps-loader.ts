/**
 * Loads the Google Maps JavaScript API once per page and resolves when
 * `google.maps.importLibrary` is ready. Every caller shares the same script tag,
 * so two maps on one page never race to inject a second copy.
 *
 * Photorealistic 3D (`maps3d`) ships on the beta channel. Alpha would add a
 * "development purposes only" banner across the page, so it is not used.
 */

declare global {
  interface Window {
    gm_authFailure?: () => void;
    __yeningGoogleMapsReady?: () => void;
  }
}

const SCRIPT_ID = "yening-google-maps";
const CHANNEL = "beta";

let pending: Promise<void> | undefined;

export class GoogleMapsAuthError extends Error {}

const hasImportLibrary = () =>
  typeof google !== "undefined" && typeof google.maps?.importLibrary === "function";

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Google Maps only loads in the browser."));
  if (hasImportLibrary()) return Promise.resolve();
  if (pending) return pending;

  pending = new Promise<void>((resolve, reject) => {
    // With `loading=async` the API finishes initialising after the script's
    // own onload, so the callback is the only reliable ready signal.
    const params = new URLSearchParams({ key: apiKey, v: CHANNEL, loading: "async", callback: "__yeningGoogleMapsReady" });
    window.__yeningGoogleMapsReady = () => {
      delete window.__yeningGoogleMapsReady;
      if (hasImportLibrary()) resolve();
      else reject(new Error("Google Maps loaded without importLibrary."));
    };
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.async = true;
    script.onerror = () => {
      script.remove();
      pending = undefined;
      reject(new Error("The Google Maps script could not be downloaded."));
    };
    // Google calls this when the key is rejected — wrong key, API not enabled,
    // or a referrer the key does not allow. It arrives after onload, so the
    // map component also listens for it; here it just poisons future loads.
    window.gm_authFailure = () => {
      pending = Promise.reject(new GoogleMapsAuthError("Google did not authorise this key for this address."));
      window.dispatchEvent(new CustomEvent("yening:gm-auth-failure"));
    };
    document.head.appendChild(script);
  });
  return pending;
}
