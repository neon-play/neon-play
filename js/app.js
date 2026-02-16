const menuBtn = document.getElementById("menuBtn");  
const sideMenu = document.getElementById("sideMenu");  
const menuLinks = sideMenu ? sideMenu.querySelectorAll(".menu-list li a") : [];
function openMenu() {  
  if (!sideMenu) return;  
  sideMenu.classList.add("open");  
  sideMenu.setAttribute("aria-hidden", "false");  
  document.body.classList.add('side-open');
  menuBtn.setAttribute("aria-expanded", "true");
}  
function closeMenu() {  
  if (!sideMenu) return;  
  sideMenu.classList.remove("open");  
  sideMenu.setAttribute("aria-hidden", "true");  
  document.body.classList.remove('side-open');   
  menuBtn.setAttribute("aria-expanded", "false");
}
if (menuBtn) {  
  menuBtn.addEventListener("click", (e) => {  
    e.stopPropagation();  
    sideMenu && (sideMenu.classList.contains("open") ? closeMenu() : openMenu());  
  });  
  menuBtn.addEventListener("keydown", (e) => {  
    if (e.key === "Enter" || e.key === " ") {  
      e.preventDefault();  
      sideMenu && (sideMenu.classList.contains("open") ? closeMenu() : openMenu());  
    }  
  });  
} else {  
  console.warn('#menuBtn not found');  
}
if (menuLinks.length) {  
  menuLinks.forEach(link => {  
    link.addEventListener("click", () => { closeMenu(); });  
  });  
}
document.addEventListener("click", (e) => {  
  if (!sideMenu || !menuBtn) return;  
  if (!sideMenu.contains(e.target) && !menuBtn.contains(e.target)) closeMenu();  
});
if (sideMenu) sideMenu.addEventListener("click", (e) => e.stopPropagation());  
(() => {  
  if (!sideMenu) return;
  const EDGE_ZONE = 28;  
  let startX = 0;  
  let currentX = 0;  
  let isDragging = false;  
  let isOpenAtStart = false;  
  let menuWidth = sideMenu.getBoundingClientRect().width;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  function syncWidth() {  
    menuWidth = sideMenu.getBoundingClientRect().width;  
  }  
  let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(syncWidth, 150);
});
  function start(e) {  
  if (e.touches && e.touches.length > 1) return; // ignore pinch  
    const x = e.touches ? e.touches[0].clientX : e.clientX;  
    const isOpen = sideMenu.classList.contains("open");
    if (!isOpen && x > EDGE_ZONE) return;
    startX = x;  
    currentX = x;  
    isOpenAtStart = isOpen;  
    isDragging = true; 
    if (isOpen) {  
      sideMenu.classList.add("dragging");  
    }  
  }
function move(e) {  
  if (!isDragging) return;  
  if (e.cancelable) e.preventDefault();
  const x = e.touches ? e.touches[0].clientX : e.clientX;  
  currentX = x; 
  
  if (!isOpenAtStart) return; 
  const delta = currentX - startX;
  if (delta >= 0) return;
  const translateX = clamp(delta, -menuWidth, 0);  
  sideMenu.style.transform = `translateX(${translateX}px)`;  
}
function end() {
  if (!sideMenu) return;
  sideMenu.style.transform = "";
  const delta = currentX - startX;  
  if (!isOpenAtStart && startX <= EDGE_ZONE && delta > menuWidth * 0.2) {  
    openMenu();
    reset();  
    return;  
  }  
  if (isOpenAtStart) {  
    sideMenu.classList.remove("dragging");
    if (delta < -menuWidth * 0.25) {  
      closeMenu();  
    } else {  
      openMenu(); // snap back  
    }  
    sideMenu.style.transform = "";  
  }
  reset();  
}
  function reset() {  
    isDragging = false;  
    isOpenAtStart = false;  
  }
  document.addEventListener("touchstart", start, { passive: true });  
  document.addEventListener("touchmove", move, { passive: false });  
  document.addEventListener("touchend", end);
  document.addEventListener("mousedown", start);  
  document.addEventListener("mousemove", move);  
  document.addEventListener("mouseup", end);  
})();  
(() => {
  const INPUT_ID = "searchInput";
  const PANEL_ID = "searchResultPanel";
  const TEMPLATE_ID = "resultCardTemplate";
  const searchInput = document.getElementById(INPUT_ID);
  const searchPanel = document.getElementById(PANEL_ID);
  const template = document.getElementById(TEMPLATE_ID);
  const resultsInner = document.querySelector(".results-inner");
  if (resultsInner) {
  resultsInner.addEventListener("click", (e) => {
    const card = e.target.closest(".result-card");
    if (!card) return;
    const url = card.dataset.url;
    if (url) window.location.href = url;
  });
  resultsInner.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const card = e.target.closest(".result-card");
    if (!card) return;
    e.preventDefault();
    const url = card.dataset.url;
    if (url) window.location.href = url;
  });
}
  const noResultsNode = document.querySelector(".no-results");
  const CARD_ESTIMATE_PX = 132;
  const PANEL_PADDING_PX = 36;
  const VISIBLE_COUNT = 4;
    const safe = (v) => (v === undefined || v === null ? "" : String(v));  
  const lc = (s) => safe(s).toLowerCase();
  function openPanel() {  
    if (!searchPanel || !searchInput) return;  
    searchPanel.classList.add("active");  
    searchPanel.setAttribute("aria-hidden", "false");  
    searchInput.setAttribute("aria-expanded", "true");  
  }
  function closePanel() {  
    if (!searchPanel || !searchInput) return;  
    searchPanel.classList.remove("active");  
    searchPanel.setAttribute("aria-hidden", "true");  
    searchInput.setAttribute("aria-expanded", "false");  
  }
  function adjustPanelHeight(resultCount) {  
    if (!searchPanel) return;  
    if (resultCount === 0) {  
      searchPanel.style.height = Math.max(140, CARD_ESTIMATE_PX) + "px";  
      return;  
    }  
    if (resultCount >= VISIBLE_COUNT) {  
      searchPanel.style.height = ""; // allow CSS 50vh  
      return;  
    }  
    const computed = resultCount * CARD_ESTIMATE_PX + PANEL_PADDING_PX;  
    searchPanel.style.height = computed + "px";  
  }
  function resolveThumb(item) {  
    if (!item) return "";  
    return safe(item.thumbnail || item.image || item.thumb || item.poster || "");  
  }  
  function createCard(item) {  
    if (!template || !template.content) {  
      const el = document.createElement("article");  
      el.className = "result-card";  
      el.tabIndex = 0;  
      el.innerHTML = `  
        <img class="result-thumb" src="${resolveThumb(item) || "assets/placeholder.png"}" alt="${safe(item.title)} thumbnail" />  
        <div class="result-info">  
          <h3 class="result-title">${safe(item.title) || "Untitled"}</h3>  
          <p class="result-meta">${safe(item.year) ? safe(item.year) + " • " : ""}${safe(item.type) || ""}</p>  
          <p class="result-banner">${(safe(item.banner) || safe(item.studio) || "").slice(0, 120)}</p>  
        </div>  
      `;  
        el.dataset.url = getItemUrl(item); 
      return el;  
    }
    const templateRoot = template.content.firstElementChild;  
    const node = templateRoot ? templateRoot.cloneNode(true) : template.content.cloneNode(true);  
  
    let rootEl = node.nodeType === Node.ELEMENT_NODE ? node : node.querySelector(".result-card");  
    if (!rootEl) {  
      rootEl = node.firstElementChild || document.createElement("article");  
      if (!rootEl.classList.contains("result-card")) rootEl.classList.add("result-card");  
    }
    const thumbEl = rootEl.querySelector(".result-thumb");  
    const titleEl = rootEl.querySelector(".result-title");  
    const metaEl = rootEl.querySelector(".result-meta");  
    const bannerEl = rootEl.querySelector(".result-banner");  
  
    const thumbUrl = resolveThumb(item);  
    if (thumbEl) {  
      if (thumbUrl) {  
        thumbEl.src = thumbUrl;  
        thumbEl.alt = `${safe(item.title)} thumbnail`;  
      } else {  
        thumbEl.remove();  
      }  
    }  
    if (titleEl) titleEl.textContent = safe(item.title) || "Untitled";  
    if (metaEl) {  
      const year = safe(item.year);  
      const type = safe(item.type);  
      metaEl.textContent = [year, type].filter(Boolean).join(" • ");  
    }  
    if (bannerEl) bannerEl.textContent = (safe(item.banner) || safe(item.studio) || "").slice(0, 120);  
    rootEl.dataset.url = getItemUrl(item);
rootEl.tabIndex = 0;
    return rootEl;  
  }
  function getItemUrl(item) {
  if (!item || !item.id) return "";
  return `details.html?id=${encodeURIComponent(item.id)}`;
}
function showLoading() {
  if (!resultsInner) return;
  const existing = resultsInner.querySelectorAll('.result-card, .visible-no-results');
  existing.forEach(n => n.remove());

  const loading = document.createElement('div');
  loading.className = 'visible-no-results search-loading';

  loading.innerHTML = `
    <div class="spinner"></div>
  `;

  resultsInner.appendChild(loading);
if (resultsInner) {
  resultsInner.scrollTop = 0;
}
  adjustPanelHeight(1);
}
  
  function renderResults(results, query) {  
    if (!resultsInner) return;  
    const existingCards = resultsInner.querySelectorAll('.result-card, .visible-no-results');  
    existingCards.forEach(n => n.remove());  
  
    if (!results || results.length === 0) {
  if (!query) return; 
      if (noResultsNode) {  
        const nr = noResultsNode.cloneNode(true);  
        nr.hidden = false;  
        nr.classList.add("visible-no-results");  
        resultsInner.appendChild(nr);  
      }  
      adjustPanelHeight(0);  
      openPanel();  
      return;  
    }
    const fragment = document.createDocumentFragment();  
    for (let i = 0; i < results.length; i++) {  
      const card = createCard(results[i]);  
      fragment.appendChild(card);  
    }  
  
    resultsInner.appendChild(fragment);  
    adjustPanelHeight(results.length);  
    openPanel();  
    resultsInner.scrollTop = 0;  
  }
  document.addEventListener("click", (ev) => {  
    const target = ev.target;  
    const isInsidePanel = searchPanel && searchPanel.contains(target);  
    const isInsideSearch = searchInput && searchInput.closest(".search-bar")  
      ? searchInput.closest(".search-bar").contains(target)  
      : false;  
    if (!isInsidePanel && !isInsideSearch) {  
      closePanel();  
    }  
  });  
  
  if (searchInput) {  
    searchInput.addEventListener("keydown", (e) => {  
      if (e.key === "Escape") {  
        closePanel();  
        searchInput.blur();  
      } else if (e.key === "ArrowDown") {  
        const first = resultsInner ? resultsInner.querySelector(".result-card") : null;  
        if (first) {  
          e.preventDefault();  
          first.focus();  
        }  
      }  
    });  
    
    searchInput.addEventListener("focus", () => {  
      if (searchInput.value && searchInput.value.trim()) {
      }  
    });  
  } else {  
    console.warn("Live search: search input not found (#searchInput).");  
  }  
  
  document.addEventListener("keydown", (e) => {  
    if (e.key === "Escape") closePanel();  
  });  
  
  if (searchPanel) {  
    searchPanel.addEventListener("click", (e) => e.stopPropagation());  
  }  
  let debounceTimer = null;
const DEBOUNCE = 300;
let activeQuery = "";
let controller = null; // 🔥 ADD THIS LINE
async function searchServer(query) {
  activeQuery = query;
  if (controller) {
    controller.abort();
  }

  controller = new AbortController();
  try {
    const ts = Math.floor(Date.now() / 1000);
const resourceId = "";
const token = await sha256(resourceId + ts + API_TOKEN_SECRET);
const resp = await fetch(
  `https://neon-anime-api.lupinarashi.workers.dev/api/search?q=${encodeURIComponent(query)}&ts=${ts}&token=${token}`,
  {
    cache: "no-store",
    signal: controller.signal
  }
);
    if (!resp.ok) {
  controller = null;
  return;
}
    const data = await resp.json();
    const results = Array.isArray(data)
      ? data
      : (Array.isArray(data.results) ? data.results : []);
    if (query !== activeQuery) {
  controller = null;
  return;
}
    renderResults(results, query);
controller = null;
  } catch (err) {
    if (err.name === "AbortError") {
      return;
    }
    console.error("Search error:", err);
    renderResults([], query);
    controller = null;
  }
}
  if (searchInput) {
  searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim();
  clearTimeout(debounceTimer);
  if (!q || q.length < 1) {
  activeQuery = "";
  clearTimeout(debounceTimer);
  if (resultsInner) {
    const existing = resultsInner.querySelectorAll('.result-card, .visible-no-results');
    existing.forEach(n => n.remove());
  }
  closePanel();
  return;
}
  openPanel(); 
showLoading(); 
debounceTimer = setTimeout(() => {
  searchServer(q);
}, DEBOUNCE);
});
    } else {
  console.warn("Live search: search input not found (#searchInput).");
}
  })();
const API_TOKEN_SECRET = "Qc!}1MnJ:jv.Hk}N!8qw*:2YA#2kVc;g";
document.addEventListener('DOMContentLoaded', () => {  
  
  
  const moviesContainer = document.getElementById('moviesContainer');  
  const seriesContainer = document.getElementById('seriesContainer');  
  const loadMoreMoviesBtn = document.getElementById('loadMoreMovies');  
  const loadMoreSeriesBtn = document.getElementById('loadMoreSeries');  
  const adStrip = document.getElementById('adStrip');
  let currentPage = 1;
let isLoading = false;
let hasMore = true;
  function createAnimeCard(item) {  
  const card = document.createElement('div');  
  card.className = 'anime-card';  
  card.setAttribute('role', 'article');  
  card.tabIndex = 0;  
  card.setAttribute('aria-label', item.title || 'Anime card');  
  const frame = document.createElement('div');  
  frame.className = 'card-frame';  
  const bannerWrap = document.createElement('div');  
  bannerWrap.className = 'card-banner-wrap';
  const img = document.createElement('img');  
  img.className = 'card-banner';  
  img.src = item.image || 'assets/placeholder.png';  
  img.alt = item.title ? `${item.title} poster` : 'Anime poster';  
  img.loading = 'lazy';  
  img.decoding = 'async';  
  bannerWrap.appendChild(img);  
    if (item && item.audio) {  
    const audio = document.createElement('div');  
    audio.className = 'card-audio';  
    audio.textContent = String(item.audio);  
    bannerWrap.appendChild(audio);  
  }  
  if (item && (item.year || item.release)) {  
    const y = item.year ? String(item.year) : String(item.release);  
    const yearOverlay = document.createElement('div');  
    yearOverlay.className = 'card-year';  
    yearOverlay.textContent = y;  
    bannerWrap.appendChild(yearOverlay);  
  }  
  frame.appendChild(bannerWrap);  
if (item && item.type) {
  const t = String(item.type).toLowerCase().trim();
  const badge = document.createElement('div');
  badge.className = 'card-badge';
  if (t === 'movie' || t === 'movies') {
    badge.textContent = 'MOVIE';
  } else if (t === 'series' || t === 'tv' || t === 'show') {
    badge.textContent = 'SERIES';
  } else {
    badge.textContent = item.type;
  }
  frame.appendChild(badge);
}   
  card.appendChild(frame);
  const footer = document.createElement('div');  
  footer.className = 'card-footer';
  const titleEl = document.createElement('h3');  
  titleEl.className = 'card-title';  
  titleEl.textContent = item.title || 'Untitled';  
  footer.appendChild(titleEl);
  card.appendChild(footer);
if (item && item.id) {
  card.style.cursor = 'pointer';
  const go = () => {
    window.location.href = `details.html?id=${encodeURIComponent(item.id)}`;
  };
  card.addEventListener('click', go);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') go();
  });
} return card; }
  function renderList(items, container) {
  if (!container || !items || !items.length) return;
  const fragment = document.createDocumentFragment();
  items.forEach(item => {
    fragment.appendChild(createAnimeCard(item));
  });
  container.appendChild(fragment);
}
  function createAdCard(item) {
  const ad = document.createElement("div");
  ad.className = "ad-card";
  ad.textContent = item.title || "Advertisement";
  return ad;
}
  function renderAds(items, container) {  
    if (!container || !items || !items.length) return;  
    items.forEach(item => {  
      const ad = createAdCard(item);  
      container.appendChild(ad);  
    });  
  }
async function loadPage(page) {
  if (isLoading || !hasMore) return;
  isLoading = true;
  try {
    const ts = Math.floor(Date.now() / 1000);
const resourceId = ""; // list endpoint has no id
const token = await sha256(resourceId + ts + API_TOKEN_SECRET);
const resp = await fetch(
  `https://neon-anime-api.lupinarashi.workers.dev/api/anime?page=${page}&ts=${ts}&token=${token}`,
  { cache: "no-store" }
);
    if (!resp.ok) throw new Error("Failed to fetch");
    const data = await resp.json();
    const items = Array.isArray(data) ? data : [];
    if (items.length === 0) {
      hasMore = false;
      if (loadMoreMoviesBtn) loadMoreMoviesBtn.style.display = "none";
      if (loadMoreSeriesBtn) loadMoreSeriesBtn.style.display = "none";
      return;
    }
    const movies = items.filter(it => {
      const t = it?.type?.toLowerCase();
      return t === "movie" || t === "movies";
    });
    const series = items.filter(it => {
      const t = it?.type?.toLowerCase();
      return t === "series" || t === "tv" || t === "show";
    });
    renderList(movies, moviesContainer);
    renderList(series, seriesContainer);
  } catch (err) {
    console.error(err);
  } finally {
    isLoading = false;
  }
} 
if (loadMoreMoviesBtn) {
  loadMoreMoviesBtn.addEventListener("click", () => {
    currentPage++;
    loadPage(currentPage);
  });
}
if (loadMoreSeriesBtn) {
  loadMoreSeriesBtn.addEventListener("click", () => {
    currentPage++;
    loadPage(currentPage);
  });
}
loadPage(currentPage);
}); 
async function sha256(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("movieGrid");
  if (!grid) return;
  const searchInput = document.querySelector(".search-box input");
  const sortSelect = document.getElementById("sortSelect");
  let loadMoreBtn = document.getElementById("loadMoreBtn");

  const PAGE_SIZE = 10;
  let allMovies = [];
  let filteredMovies = [];
  let visibleCount = PAGE_SIZE;

  // Ensure loadMoreBtn exists
  if (!loadMoreBtn) {
    loadMoreBtn = document.createElement("button");
    loadMoreBtn.className = "load-more-btn";
    loadMoreBtn.id = "loadMoreBtn";
    loadMoreBtn.textContent = "Load More Movies";
    if (grid && grid.parentNode) grid.parentNode.appendChild(loadMoreBtn);
    else document.querySelector("main")?.appendChild(loadMoreBtn);
  }

  /* FETCH data/anime.json */
  fetch("data/anime.json")
    .then(res => res.json())
    .then(data => {
      let items = [];

      if (Array.isArray(data)) {
        items = data.slice();
      } else if (data && typeof data === "object") {
        if (Array.isArray(data.movies)) items = items.concat(data.movies);
        if (Array.isArray(data.anime)) items = items.concat(data.anime);
        for (const k of Object.keys(data)) {
          if (Array.isArray(data[k]) && !["movies","anime"].includes(k)) items = items.concat(data[k]);
        }
      }

      if (items.length === 0 && data && typeof data === "object") {
        const maybe = Object.values(data).filter(v =>
          v && typeof v === "object" && (v.title || v.name) && (v.image || v.poster || v.cover)
        );
        if (maybe.length) items = maybe;
      }

   // Detect which page we are on
const pageTarget = document.body?.getAttribute("data-target");

// STRICT filtering based ONLY on JSON type
if (pageTarget === "series") {
  allMovies = items.filter(item =>
    item &&
    typeof item.type === "string" &&
    item.type.trim().toLowerCase() === "series"
  );
} else {
  // default = movies page
  allMovies = items.filter(item =>
    item &&
    typeof item.type === "string" &&
    item.type.trim().toLowerCase() === "movie"
  );
}

      if (!allMovies.length) {
        const nestedArrays = Object.values(data).filter(v => Array.isArray(v));
        for (const arr of nestedArrays) {
          for (const it of arr) {
            if (it && (it.title || it.name) && (it.image || it.poster || it.cover)) {
              allMovies.push(it);
            }
          }
        }
      }

      // dedupe
      const seen = new Set();
      allMovies = allMovies.filter(it => {
        const key = (it.id || it.slug || it.title || it.name || JSON.stringify(it)).toString();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      filteredMovies = [...allMovies];
      visibleCount = PAGE_SIZE;
      renderChunk();
    })
    .catch(err => {
      console.error("❌ anime.json load error:", err);
      allMovies = [];
      filteredMovies = [];
      renderChunk();
    });

  /* RENDER helpers */
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"'`]/g, (m) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#x60;'
    })[m]);
  }

  function createCard(item) {
  const card = document.createElement("div");
  card.className = "anime-card";

  const title = item.title || item.name || "Untitled";
  const imgSrc = item.image || item.poster || item.cover || "assets/placeholder.png";
  const year = item.year || item.release || "—";
  const type = item.type ? String(item.type).toUpperCase() : "";
  // STRICT audio from JSON only
  const audio = typeof item.audio === "string" ? item.audio.trim() : "";

  console.log("AUDIO FIELD:", item.title, "=>", audio);

  card.innerHTML = `
  <div class="card-frame">
    <div class="card-banner-wrap">
      <img class="card-banner"
           src="${imgSrc}"
           alt="${escapeHtml(title)}"
           loading="lazy">

      ${type ? `<span class="card-badge">${escapeHtml(type)}</span>` : ""}
      <span class="card-year">${escapeHtml(year)}</span>
      ${audio ? `<span class="card-audio">${escapeHtml(audio)}</span>` : ""}
    </div>
  </div>

  <!-- TITLE FOOTER (THIS WAS MISSING) -->
  <div class="card-footer">
    <h3 class="card-title">${escapeHtml(title)}</h3>
  </div>
`;

  const img = card.querySelector("img");
  img.onerror = () => img.src = "assets/placeholder.png";

  card.addEventListener("click", () => {
    const id = item.id || item.slug || title;
    window.location.href =`details.html?id=${encodeURIComponent(id)}`;
  });

  return card;
}

  function renderChunk() {
    if (!grid) return;
    grid.innerHTML = "";

    const slice = filteredMovies.slice(0, visibleCount);
    if (!slice.length) {
      const empty = document.createElement("div");
      empty.style.padding = "28px";
      empty.style.textAlign = "center";
      empty.style.color = "#cfcfcf";
      empty.textContent = "No items found.";
      grid.appendChild(empty);
      loadMoreBtn.style.display = "none";
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const m of slice) fragment.appendChild(createCard(m));
    grid.appendChild(fragment);

    loadMoreBtn.style.display = visibleCount >= filteredMovies.length ? "none" : "block";
  }

  /* LOAD MORE */
  loadMoreBtn.addEventListener("click", () => {
    visibleCount = Math.min(filteredMovies.length, visibleCount + PAGE_SIZE);
    renderChunk();
    loadMoreBtn.scrollIntoView({ behavior: "smooth", block: "center" });
  }, { passive: true });

  /* SEARCH — updates filteredMovies and re-renders the grid */
  if (searchInput) {
    let searchTimer = null;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        const q = (searchInput.value || "").trim().toLowerCase();

        if (!q) {
          filteredMovies = [...allMovies];
          visibleCount = PAGE_SIZE;
          renderChunk();
          // update ARIA
          searchInput.setAttribute('aria-expanded', 'false');
          return;
        }

        const matches = allMovies.filter(m => {
          const title = (m.title || m.name || "").toString().toLowerCase();
          const year = (m.year || m.release || "").toString().toLowerCase();
          const type = (m.type || m.category || "").toString().toLowerCase();
          return title.includes(q) || year.includes(q) || type.includes(q);
        });

        filteredMovies = matches;
        visibleCount = PAGE_SIZE;
        renderChunk();

        // accessibility hint
        searchInput.setAttribute('aria-expanded', String(matches.length > 0));
      }, 180);
    });
  }

  /* SORT */
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      const val = sortSelect.value;
      if (val === "latest") {
        filteredMovies.sort((a, b) => (Number(b.year || b.release || 0) - Number(a.year || a.release || 0)));
      } else if (val === "oldest") {
        filteredMovies.sort((a, b) => (Number(a.year || a.release || 0) - Number(b.year || b.release || 0)));
      } else if (val === "az") {
        filteredMovies.sort((a, b) => (String(a.title || a.name || "").localeCompare(String(b.title || b.name || ""))));
      } else if (val === "za") {
        filteredMovies.sort((a, b) => (String(b.title || b.name || "").localeCompare(String(a.title || a.name || ""))));
      }
      visibleCount = PAGE_SIZE;
      renderChunk();
    });
  }

});

