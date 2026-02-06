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
