/* ── CONFIG ── */
const GAS_URL =
  "https://script.google.com/macros/s/AKfycbyWX0FP6qYY5-wmyr3CBmnopWOOR5gfD-NxBHjmX4aeLquGX4YfTZtgYBRb2ZQxhJVk/exec";

function getClientId() {
  const key = "abyss_client_id";
  let cid = localStorage.getItem(key);
  if (!cid) {
    cid = `sc_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    localStorage.setItem(key, cid);
  }
  return cid;
}

function getDeviceType() {
  const ua = navigator.userAgent || "";
  return /android|iphone|ipad|ipod|mobile/i.test(ua) ? "mobile" : "desktop";
}

function getTrafficSource() {
  const params = new URLSearchParams(window.location.search);
  return params.get("source") || params.get("utm_source") || "direct";
}

const _tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";

window.userLocationData = {
  country: _tz,
  city: _tz,
};

window._locationReady = (async () => {
  const createTimeout = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms, null));

  try {
    const res = await Promise.race([
      fetch("https://ipwho.is/"),
      createTimeout(2000),
    ]);
    if (!res || !res.ok) return;

    const data = await res.json();
    if (data && data.success) {
      window.userLocationData.country =
        data.country || window.userLocationData.country;
      window.userLocationData.city = data.city || window.userLocationData.city;
    }
  } catch (_) {}
})();

function getLocationPayload() {
  return {
    country: window.userLocationData?.country || _tz,
    city: window.userLocationData?.city || _tz,
  };
}
