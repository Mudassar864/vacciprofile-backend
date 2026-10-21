/**
 * Tell the public Next.js site(s) to refresh their cached pages after CMS edits.
 *
 * SITE_REVALIDATE_URLS: comma-separated, e.g. https://vacciprofile.com/api/revalidate
 * SITE_REVALIDATE_SECRET: must match REVALIDATE_SECRET on the site.
 *
 * Calls are debounced so an import or bulk delete of thousands of rows sends one request.
 * Failures are logged only — the site also refreshes on its own every 60 seconds.
 */
const DEBOUNCE_MS = 2000;

let timer = null;

function targets() {
  return String(process.env.SITE_REVALIDATE_URLS || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
}

async function sendNow() {
  const secret = process.env.SITE_REVALIDATE_SECRET;
  const urls = targets();
  if (!secret || !urls.length) return;

  await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'x-revalidate-secret': secret },
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) console.warn(`[revalidate] ${url} responded ${response.status}`);
      } catch (error) {
        console.warn(`[revalidate] ${url} failed: ${error.message}`);
      }
    })
  );
}

function scheduleSiteRevalidate() {
  if (!targets().length) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    sendNow();
  }, DEBOUNCE_MS);
  timer.unref?.();
}

module.exports = { scheduleSiteRevalidate };
