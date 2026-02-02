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
