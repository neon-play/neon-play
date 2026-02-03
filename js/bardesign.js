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
