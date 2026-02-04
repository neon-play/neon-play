/* updated details.js
   - renders search results directly into the main grid (movieGrid)
   - removed separate search-result-panel usage
   - preserves pagination, sorting, load-more, image fallback
*/

document.addEventListener("DOMContentLoaded", () => {

  const menuBtn = document.getElementById("menuBtn");
  const sideMenu = document.getElementById("sideMenu");
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

  /* MENU toggle */
  if (menuBtn && sideMenu) {
    menuBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      sideMenu.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (!sideMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        sideMenu.classList.remove("open");
      }
    });

    sideMenu.addEventListener("click", e => e.stopPropagation());
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

      const hasTypeMarker = items.some(it =>
        it && (it.type || it.category || it.format || it.media || it.section || it.isMovie !== undefined)
      );

      if (hasTypeMarker) {
        allMovies = items.filter(item =>
          !!item && (
            (typeof item.type === "string" && item.type.toLowerCase().includes("movie")) ||
            (typeof item.category === "string" && item.category.toLowerCase().includes("movie")) ||
            (typeof item.format === "string" && item.format.toLowerCase().includes("movie")) ||
            (typeof item.media === "string" && item.media.toLowerCase().includes("movie")) ||
            (item.isMovie === true) ||
            (item.section && String(item.section).toLowerCase().includes("movie"))
          )
        );
      } else {
        allMovies = items.slice();
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

  const title = escapeHtml(item.title || item.name || "Untitled");
  const imgSrc = item.image || item.poster || item.thumbnail || item.cover || "assets/placeholder.png";
  const year = escapeHtml(item.year || item.release || "");
  const typeLabel = (item.type || item.category || (item.isSeries ? "Series" : item.isMovie ? "Movie" : "Movie")) || "Movie";
  const audioLabel = escapeHtml(item.lang || item.language || item.audio || item.audio_lang || item.country || item.locale || item.language || "");

  // build inner HTML to match CSS structure
  card.innerHTML = `
    <div class="card-frame">
      <div class="card-banner-wrap">
        <img class="card-banner" src="${imgSrc}" alt="${title}" loading="lazy">
        ${typeLabel ? `<div class="card-badge">${escapeHtml(typeLabel)}</div>` : ""}
        ${year ? `<div class="card-year">${year}</div>` : ""}
        ${audioLabel ? `<div class="card-audio">${audioLabel}</div>` : ""}
        <div class="card-type-watermark">${escapeHtml(typeLabel)}</div>
      </div>
    </div>

    <div class="card-footer">
      <div class="card-name-box">
        <h3 class="card-title">${title}</h3>
      </div>
    </div>
  `;

  // image fallback
  const img = card.querySelector(".card-banner");
  if (img) {
    img.addEventListener("error", () => {
      img.src = "assets/placeholder.png";
    }, { once: true });
  }

  // clickable
  card.addEventListener("click", () => {
    const id = item.id || item.slug || item.title || item.name;
    window.location.href = `details.html?id=${encodeURIComponent(id)}`;
  }, { passive: true });

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
