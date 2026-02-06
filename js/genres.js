document.addEventListener("DOMContentLoaded", () => {

  const genreGrid = document.getElementById("genreGrid");
  const genreResults = document.getElementById("genreResults");
  const genreTitle = document.getElementById("genreTitle");
  const genreContainer = document.getElementById("genreContainer");

  const PARAM = (k) => new URLSearchParams(location.search).get(k);

  /* ===== GENRE DEFINITIONS ===== */
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

  /* ===== BUILD GRID ===== */
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

    tile.onclick = () => {
      location.href = `genre.html?tag=${encodeURIComponent(g.name)}`;
    };

    genreGrid.appendChild(tile);
  });

  /* ===== FILTER MODE ===== */
  const tag = PARAM("tag");
  if (!tag) return;

  genreGrid.style.display = "none";
  genreResults.hidden = false;
  genreTitle.textContent = tag;

  fetch("data/anime.json")
    .then(r => r.json())
    .then(data => {
      const items = Array.isArray(data) ? data : Object.values(data).flat();

      const matches = items.filter(it =>
        Array.isArray(it.tags) &&
        it.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())
      );

      if (!matches.length) {
        genreContainer.innerHTML = "<p style='padding:20px'>No titles found.</p>";
        return;
      }

      matches.forEach(item => {
        const card = document.createElement("div");
        card.className = "anime-card";

        const img = item.image || item.poster || "assets/placeholder.png";
        const title = item.title || "Untitled";

        card.innerHTML = `
          <div class="card-frame">
            <div class="card-banner-wrap">
              <img class="card-banner" src="${img}" alt="${title}">
            </div>
          </div>
          <div class="card-footer">
            <h3 class="card-title">${title}</h3>
          </div>
        `;

        card.onclick = () => {
          location.href = `details.html?id=${item.id}`;
        };

        genreContainer.appendChild(card);
      });
    });

});
