document.addEventListener("DOMContentLoaded", () => {

  const genreGrid = document.getElementById("genreGrid");

  if (!genreGrid) {
    console.error("❌ #genreGrid not found in HTML");
    return;
  }

  const GENRES = [
    { name: "Action", icon: "local_fire_department", img: "image/genres/action.jpg" },
    { name: "Adventure", icon: "explore", img: "image/genres/adventure.jpg" },
    { name: "Comedy", icon: "emoji_emotions", img: "image/genres/comedy.jpg" },
    { name: "Drama", icon: "theater_comedy", img: "image/genres/drama.jpg" },
    { name: "Fantasy", icon: "auto_awesome", img: "image/genres/fantasy.jpg" },
    { name: "Music", icon: "music_note", img: "image/genres/music.jpg" },
    { name: "Romance", icon: "favorite", img: "image/genres/romance.jpg" },
    { name: "Sci-Fi", icon: "science", img: "image/genres/scifi.jpg" },
    { name: "Seinen", icon: "psychology", img: "image/genres/seinen.jpg" },
    { name: "Shojo", icon: "auto_stories", img: "image/genres/shojo.jpg" }
  ];

  GENRES.forEach(g => {
    const tile = document.createElement("div");
    tile.className = "genre-tile";
    tile.style.backgroundImage = `url(${g.img})`;

    tile.innerHTML = `
      <div class="genre-content">
        <i class="material-icons">${g.icon}</i>
        <span>${g.name}</span>
      </div>
    `;

    tile.addEventListener("click", () => {
      window.location.href = `browse.html?tag=${encodeURIComponent(g.name)}`;
    });

    genreGrid.appendChild(tile);
  });

});
document.addEventListener("DOMContentLoaded", () => {

  const grid = document.getElementById("browseGrid");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const titleEl = document.getElementById("genreTitle");

  const params = new URLSearchParams(window.location.search);
  const TAG = (params.get("tag") || "").toLowerCase();

  if (!TAG) {
    titleEl.textContent = "No Genre Selected";
    loadMoreBtn.style.display = "none";
    return;
  }

  titleEl.textContent = TAG.toUpperCase();

  const isMobile = window.matchMedia("(max-width: 899px)").matches;
  const PAGE_SIZE = isMobile ? 24 : 36;

  let allItems = [];
  let visibleCount = PAGE_SIZE;

  /* ------------------ HELPERS ------------------ */
  function normalize(json) {
    if (Array.isArray(json)) return json;
    if (json && typeof json === "object") {
      for (const v of Object.values(json)) {
        if (Array.isArray(v)) return v;
      }
    }
    return [];
  }

  function hasTag(item, tag) {
    if (Array.isArray(item.tags)) {
      return item.tags.some(t => t.toLowerCase() === tag);
    }
    return false;
  }

  function createCard(item) {
  const card = document.createElement("div");
  card.className = "anime-card";

  const title = item.title || item.name || "Untitled";
  const imgSrc = item.image || item.poster || item.cover || "assets/placeholder.png";
  const year = item.year || item.release || "—";
  const type = item.type ? String(item.type).toUpperCase() : "";
  const audio = typeof item.audio === "string" ? item.audio.trim() : "";

  card.innerHTML = `
    <div class="card-frame">
      <div class="card-banner-wrap">
        <img class="card-banner"
             src="${imgSrc}"
             alt="${title}"
             loading="lazy">

        ${type ? `<span class="card-badge">${type}</span>` : ""}
        <span class="card-year">${year}</span>
        ${audio ? `<span class="card-audio">${audio}</span>` : ""}
        ${type ? `<span class="card-type-watermark">${type}</span>` : ""}
      </div>
    </div>

    <div class="card-footer">
      <h3 class="card-title">${title}</h3>
    </div>
  `;

  const img = card.querySelector("img");
  img.onerror = () => img.src = "assets/placeholder.png";

  card.addEventListener("click", () => {
    if (item.url) {
      window.location.href = item.url;
    } else if (item.watch_link) {
      window.location.href = item.watch_link;
    }
  });

  return card;
}

  /* ------------------ RENDER ------------------ */
  function render() {
  grid.innerHTML = "";

  const slice = allItems.slice(0, visibleCount);
  slice.forEach(item => {
    grid.appendChild(createCard(item));
  });

  loadMoreBtn.style.display =
    visibleCount >= allItems.length ? "none" : "block";
}
  loadMoreBtn.addEventListener("click", () => {
    visibleCount += PAGE_SIZE;
    render();
  });

  /* ------------------ LOAD DATA ------------------ */
  fetch("data/anime.json", { cache: "no-store" })
    .then(r => r.json())
    .then(json => {
      const items = normalize(json);

      allItems = items.filter(item => hasTag(item, TAG));

      render();
    })
    .catch(err => {
      console.error("Browse page JSON error:", err);
      loadMoreBtn.style.display = "none";
    });

});
