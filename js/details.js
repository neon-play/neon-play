/* updated details.js
   - renders search results directly into the main grid (movieGrid)
   - removed separate search-result-panel usage
   - preserves pagination, sorting, load-more, image fallback
*/

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(".search-box input");
  const sortSelect = document.getElementById("sortSelect");
  const grid = document.getElementById("movieGrid");
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
    window.location.href = `details.html?id=${encodeURIComponent(id)}`;
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

// js/menu-highlight.js
(function () {
  function getMenuElements() {
    // try common selectors used across your pages
    const sideMenu = document.querySelector('.side-menu') ||
                     document.querySelector('#sideMenu') ||
                     document.querySelector('.sidebar');
    const menuBtn = document.querySelector('#menuBtn') ||
                    document.querySelector('.menu-btn') ||
                    document.querySelector('.menu-toggle') ||
                    document.querySelector('.hamburger');

    // menu links container - adjust if your markup is different
    const menuLinks = sideMenu ? sideMenu.querySelectorAll('a') : null;
    return { sideMenu, menuBtn, menuLinks };
  }

  function filenameOf(url) {
    try {
      const u = new URL(url, window.location.origin);
      const parts = u.pathname.split('/');
      return parts.pop() || 'index.html';
    } catch (e) {
      const s = String(url).split('/');
      return s.pop() || 'index.html';
    }
  }

  function markCurrentItem(sideMenu, menuLinks) {
    // determine current page file
    const pathParts = window.location.pathname.split('/');
    let currentFile = pathParts.pop() || pathParts.pop() || '';
    if (!currentFile) currentFile = 'index.html';

    let matched = null;
    if (menuLinks) {
      menuLinks.forEach(a => {
        const href = a.getAttribute('href') || '';
        const fname = filenameOf(href);
        if (fname.toLowerCase() === currentFile.toLowerCase()) {
          a.classList.add('current');
          matched = a;
        } else {
          a.classList.remove('current');
        }
      });
    }

    // fallback: match by page title or a visible header
    if (!matched) {
      const title = (document.title || document.querySelector('h1')?.textContent || '').toLowerCase();
      if (menuLinks) {
        menuLinks.forEach(a => {
          if ((a.textContent || '').toLowerCase().includes('movies') && title.includes('movie')) {
            a.classList.add('current'); matched = a;
          }
          if ((a.textContent || '').toLowerCase().includes('series') && title.includes('series')) {
            a.classList.add('current'); matched = a;
          }
          if ((a.textContent || '').toLowerCase().includes('home') && title.includes('home')) {
            a.classList.add('current'); matched = a;
          }
        });
      }
    }

    return matched;
  }

  function init() {
    const { sideMenu, menuBtn, menuLinks } = getMenuElements();
    if (!sideMenu || !menuLinks) {
      // Nothing to do on pages with different markup
      console.warn('menu-highlight: no side menu or menu links found.');
      return;
    }

    const currentItem = markCurrentItem(sideMenu, menuLinks);

    // when menu opens, move focus to the highlighted item for accessibility
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        // assume your CSS toggles a class 'open' on the side menu when opening
        if (sideMenu.classList.contains('open')) {
          const cur = sideMenu.querySelector('.current');
          if (cur) cur.focus({ preventScroll: true });
        }
      }, { passive: true });
    }

    // If your menu opens via other code (not a single button),
    // observe attribute/class changes so the neon shows when open.
    const observer = new MutationObserver(() => {
      // no-op here; triggers allowing CSS to change when .open toggles.
    });
    observer.observe(sideMenu, { attributes: true, attributeFilter: ['class'] });
  }

  // Wait for DOM ready if needed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
// js/details-page.js
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

    // watch button
    if (item.watch_link) {
      watchBtn.href = item.watch_link;
      watchBtn.style.display = 'inline-flex';
    } else {
      watchBtn.removeAttribute('href');
      watchBtn.style.display = 'none';
    }

    // password box (lime green highlighted) — only if value truthy
    if (item.password) {
      passwordContainer.style.display = 'block';
      passwordContainer.innerHTML = `<div class="password-box"><span class="material-icons" style="color: #0b2a17">key</span><span>${escapeHtml(item.password)}</span></div>`;
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
  (function loadData() {
    const id = PARAM('id') || PARAM('slug') || PARAM('q');
    if (!id) { showNotFound(); return; }

    fetch('data/anime.json').then(r => r.json()).then(data => {
      const items = findItemsFromJson(data);
      const match = findMatch(items, id);
      render(match);
    }).catch(err => {
      console.error('details page — json load error', err);
      // try to handle if JSON is actually text (some broken files)
      try {
        // attempt to parse text (fallback)
        fetch('data/anime.json').then(r => r.text()).then(text => {
          try {
            const parsed = JSON.parse(text.replace(/^\s*export\s+default\s+/, ''));
            const items = findItemsFromJson(parsed);
            const match = findMatch(items, id);
            render(match);
          } catch (e) {
            console.error('fallback parse failed', e);
            showNotFound();
          }
        });
      } catch (e) {
        showNotFound();
      }
    });
  })();

})();
