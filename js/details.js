async function sha256(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
// Universal details page loader — reads data/anime.json and renders item by id
(function () {
  
  const PARAM = (k) => new URLSearchParams(window.location.search).get(k);

  const posterImg = document.getElementById('posterImg');
  const titleText = document.getElementById('titleText');
  const badgeRow = document.getElementById('badgeRow');
  const controlRow = document.getElementById('controlRow');
  const watchBtn = document.getElementById('watchBtn');
  const overviewText = document.getElementById('overviewText');
  const overviewSection = document.getElementById('overviewSection');
  const notFound = document.getElementById('notFound');
  const passwordContainer = document.getElementById('passwordContainer');
  const metaRow = document.getElementById('metaRow');
  const socialSection = document.getElementById('socialSection');

  const placeholder = 'assets/placeholder.png';

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"'`]/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#x60;'}[m]));
  }

  function createBadge(text) {
    const d = document.createElement('div');
    d.className = 'badge';
    d.textContent = text;
    return d;
  }

  function showNotFound() {
    notFound.style.display = 'block';
    document.getElementById('detailsHero').style.display = 'none';
    overviewSection.style.display = 'none';
  }

  // attempt to find item in many possible JSON shapes (array, object with arrays, nested)
  function findItemsFromJson(data) {
    let items = [];
    if (Array.isArray(data)) items = data.slice();
    else if (data && typeof data === 'object') {
      // collect array props first
      for (const k of Object.keys(data)) {
        if (Array.isArray(data[k])) items = items.concat(data[k]);
      }
      // fallback: if object values look like item objects, collect them
      if (!items.length) {
        for (const v of Object.values(data)) {
          if (v && typeof v === 'object' && (v.id || v.title || v.name)) items.push(v);
        }
      }
    }
    return items;
  }

  function findMatch(items, id) {
    if (!items || !items.length) return null;
    const needle = (id || '').toString().toLowerCase();
    for (const it of items) {
      if (!it) continue;
      const candidates = [it.id, it.slug, it.title, it.name, it.url].filter(Boolean).map(x => String(x).toLowerCase());
      if (candidates.includes(needle)) return it;
      // sometimes url contains ?id=slug
      if (String(it.url || '').toLowerCase().includes(needle)) return it;
    }
    // final fuzzy match: title contains needle
    return items.find(it => String(it.title || it.name || '').toLowerCase().includes(needle));
  }

  function render(item) {
    if (!item) { showNotFound(); return; }

    // poster
    const img = item.image || item.poster || item.cover || item.thumbnail || placeholder;
    posterImg.src = img;
    posterImg.alt = escapeHtml(item.title || item.name || 'Untitled');

    posterImg.addEventListener('error', () => posterImg.src = placeholder, { once: true });

    // title
    titleText.textContent = item.title || item.name || 'Untitled';

    // badges: rating, audio, type, episodes, duration, views
    badgeRow.innerHTML = '';
    const badges = [];
    if (item.rating) badges.push(item.rating);
    if (item.audio) badges.push(item.audio);
    if (item.type) badges.push(item.type);
    if (item.episodes) badges.push(item.episodes);
    if (item.duration) badges.push(item.duration);
    if (item.views) badges.push(item.views);

    badges.forEach(b => badgeRow.appendChild(createBadge(b)));

    // password box (lime green highlighted) — only if value truthy
    if (item.password) {
      passwordContainer.style.display = 'block';
      passwordContainer.innerHTML = `<div class="password-box"><span class="material-icons" >key</span><span>${escapeHtml(item.password)}</span></div>`;
    } else {
      passwordContainer.style.display = 'none';
      passwordContainer.innerHTML = '';
    }

    // overview
    if (item.overview) {
      overviewSection.style.display = 'block';
      overviewText.textContent = item.overview;
    } else {
      overviewSection.style.display = 'none';
    }

    // meta row (year, tags)
    metaRow.innerHTML = '';
    const metaParts = [];
    if (item.year) metaParts.push(item.year);
    if (Array.isArray(item.tags) && item.tags.length) metaParts.push(item.tags.join(' • '));
    if (metaParts.length) metaRow.textContent = metaParts.join(' • ');

    // social links
    socialSection.style.display = 'none';
    socialSection.innerHTML = '';
    if (item.social && typeof item.social === 'object' && Object.keys(item.social).length) {
      socialSection.style.display = 'block';
      for (const [k, v] of Object.entries(item.social)) {
        if (!v) continue;
        const a = document.createElement('a');
        a.href = v;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.style.display = 'inline-block';
        a.style.margin = '6px';
        a.className = 'btn btn-ghost';
        a.textContent = k.charAt(0).toUpperCase() + k.slice(1);
        socialSection.appendChild(a);
      }
    }

    // show content
    document.getElementById('detailsHero').style.display = '';
    notFound.style.display = 'none';
  }

  // load JSON and render by id param
// load from API and render by id param
(function loadData() {
  const rawId = PARAM('id') || PARAM('slug') || PARAM('q');
const id = rawId ? rawId.trim() : null;

  if (!id) {
    showNotFound();
    return;
  }
  loadDetails(id);
async function loadDetails(id) {
  
  try {
    const ts = Math.floor(Date.now() / 1000);
    const resourceId = id; 
    const token = await sha256(resourceId + ts + API_TOKEN_SECRET);

    const resp = await fetch(
      `https://neon-anime-api.lupinarashi.workers.dev/api/anime/${encodeURIComponent(id)}?ts=${ts}&token=${token}`,
      { cache: "no-store" }
    );

    if (!resp.ok) throw new Error("API request failed");

    const data = await resp.json();

    if (!data || !data.id) {
      showNotFound();
      return;
    }

    if (watchBtn) {
      watchBtn.href = `neonplayer.html?id=${encodeURIComponent(data.id)}`;
      watchBtn.style.display = "inline-flex";
    }

    render(data);

  } catch (err) {
    console.error("Details API error:", err);
    showNotFound();
  }
}
})();

})();
const API_TOKEN_SECRET = "Qc!}1MnJ:jv.Hk}N!8qw*:2YA#2kVc;g";
