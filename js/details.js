/* ===============================
   NEONANIME HUB — MOVIES PAGE
   Robust final JS: pagination, search, sort, touch-safe
   Replaces previous details.js
   =============================== */

document.addEventListener("DOMContentLoaded", () => {

  const menuBtn = document.getElementById("menuBtn");
  const sideMenu = document.getElementById("sideMenu");
  const searchInput = document.querySelector(".search-box input");
  const searchResults = document.getElementById("liveSearchResults");
  let sortSelect = document.getElementById("sortSelect");
  let grid = document.getElementById("movieGrid");
  let loadMoreBtn = document.getElementById("loadMoreBtn");

  const PAGE_SIZE = 10;
  let allMovies = [];
  let filteredMovies = [];
  let visibleCount = PAGE_SIZE;

  // If loadMoreBtn not present in DOM (safety), create it and append
  if (!loadMoreBtn) {
    loadMoreBtn = document.createElement("button");
    loadMoreBtn.className = "load-more-btn";
    loadMoreBtn.id = "loadMoreBtn";
    loadMoreBtn.textContent = "Load More Movies";
    // try to append after grid (if grid exists)
    if (grid && grid.parentNode) grid.parentNode.appendChild(loadMoreBtn);
    else document.querySelector("main")?.appendChild(loadMoreBtn);
  }

  /* ================= MENU ================= */
  if (menuBtn && sideMenu) {
    menuBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      sideMenu.classList.toggle("open");
    });

    // close when clicking outside
    document.addEventListener("click", (e) => {
      if (!sideMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        sideMenu.classList.remove("open");
      }
    });

    // prevent click inside sideMenu from closing
    sideMenu.addEventListener("click", e => e.stopPropagation());
  }

  /* ================= FETCH MOVIES (robust) ================= */
  fetch("data/anime.json")
    .then(res => res.json())
    .then(data => {
      // handle many shapes:
      // - top-level array
      // - { movies: [...] } or { anime: [...] } or nested arrays
      let items = [];

      if (Array.isArray(data)) {
        items = data.slice();
      } else if (data && typeof data === "object") {
        if (Array.isArray(data.movies)) items = items.concat(data.movies);
        if (Array.isArray(data.anime)) items = items.concat(data.anime);
        // collect any array-valued properties (fallback)
        for (const k of Object.keys(data)) {
          if (Array.isArray(data[k])) {
            // avoid duplicating movies/anime already added
            if (!["movies","anime"].includes(k)) items = items.concat(data[k]);
          }
        }
      }

      // if still empty and top-level object has nested single items, try to extract
      if (items.length === 0 && data && typeof data === "object") {
        // convert object values that look like movie objects (have title/image)
        const maybe = Object.values(data).filter(v =>
          v && typeof v === "object" && (v.title || v.name) && (v.image || v.poster || v.cover)
        );
        if (maybe.length) items = maybe;
      }

      // if items found, detect whether items include explicit "movie" markers
      const hasTypeMarker = items.some(it =>
        it && (it.type || it.category || it.format || it.media || it.section || it.isMovie !== undefined)
      );

      if (hasTypeMarker) {
        // filter by known movie-like flags (be permissive)
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
        // if no markers, assume all items are movies (fallback)
        allMovies = items.slice();
      }

      // final safety: if still empty, try top-level arrays like data.results etc.
      if (!allMovies.length) {
        // search for any nested array and use elements that look like movies
        const nestedArrays = Object.values(data).filter(v => Array.isArray(v));
        for (const arr of nestedArrays) {
          for (const it of arr) {
            if (it && (it.title || it.name) && (it.image || it.poster || it.cover)) {
              allMovies.push(it);
            }
          }
        }
      }

      // dedupe by id/title simple
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
      // keep UI but empty
      allMovies = [];
      filteredMovies = [];
      renderChunk();
    });

  /* ================= RENDER (paginated) ================= */

  function createCard(movie) {
    const card = document.createElement("div");
    card.className = "anime-card";
    const title = movie.title || movie.name || "Untitled";
    const imgSrc = movie.image || movie.poster || movie.thumbnail || movie.cover || "assets/placeholder.png";
    const year = movie.year || movie.release || "";

    // sanitize with textContent for title when used elsewhere; innerHTML limited to safe markup below
    card.innerHTML = `
      <img src="${imgSrc}" alt="${escapeHtml(title)}" loading="lazy">
      <div class="card-info">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(year)} ${year ? "• Movie" : "• Movie"}</p>
      </div>
    `;

    // image fallback
    const img = card.querySelector("img");
    if (img) {
      img.addEventListener("error", () => {
        img.src = "assets/placeholder.png";
      }, { once: true });
    }

    card.addEventListener("click", () => {
      const id = movie.id || movie.slug || movie.title || movie.name;
      window.location.href = `details.html?id=${encodeURIComponent(id)}`;
    }, { passive: true });

    return card;
  }

  function renderChunk() {
    // clear grid and render first visibleCount items
    if (!grid) return;
    grid.innerHTML = "";

    const slice = filteredMovies.slice(0, visibleCount);
    if (!slice.length) {
      // show a friendly empty state
      const empty = document.createElement("div");
      empty.style.padding = "28px";
      empty.style.textAlign = "center";
      empty.style.color = "#cfcfcf";
      empty.textContent = "No movies found.";
      grid.appendChild(empty);
      loadMoreBtn.style.display = "none";
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const movie of slice) {
      fragment.appendChild(createCard(movie));
    }
    grid.appendChild(fragment);

    loadMoreBtn.style.display = visibleCount >= filteredMovies.length ? "none" : "block";
  }

  /* ================= LOAD MORE ================= */
  loadMoreBtn.addEventListener("click", () => {
    visibleCount = Math.min(filteredMovies.length, visibleCount + PAGE_SIZE);
    renderChunk();
    // smooth scroll to newly loaded area (small nudge)
    loadMoreBtn.scrollIntoView({ behavior: "smooth", block: "center" });
  }, { passive: true });

  /* ================= SEARCH ================= */
  if (searchInput) {
    let searchTimer = null;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        const q = (searchInput.value || "").trim().toLowerCase();
        searchResults.innerHTML = "";

        if (!q) {
          searchResults.style.display = "none";
          filteredMovies = [...allMovies];
          visibleCount = PAGE_SIZE;
          renderChunk();
          return;
        }

        const matches = allMovies.filter(m => {
          const title = (m.title || m.name || "").toString().toLowerCase();
          const year = (m.year || m.release || "").toString().toLowerCase();
          return title.includes(q) || year.includes(q);
        });

        filteredMovies = matches;
        visibleCount = PAGE_SIZE;
        renderChunk();

        // show up to 6 suggestions
        matches.slice(0, 6).forEach(movie => {
          const div = document.createElement("div");
          div.className = "search-result";
          div.style.padding = "8px 12px";
          div.style.cursor = "pointer";
          div.textContent = movie.title || movie.name;
          div.addEventListener("click", () => {
            const id = movie.id || movie.slug || movie.title || movie.name;
            window.location.href = `details.html?id=${encodeURIComponent(id)}`;
          }, { passive: true });
          searchResults.appendChild(div);
        });
        searchResults.style.display = "block";
      }, 180);
    });
  }

  // hide search results when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchResults.contains(e.target) && !searchInput.contains(e.target)) {
      if (searchResults) searchResults.style.display = "none";
    }
  }, { passive: true });

  /* ================= SORT ================= */
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

  /* ================= UTIL ================= */
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"'`]/g, (m) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#x60;'
    })[m]);
  }

});
