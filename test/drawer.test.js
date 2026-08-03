/**
 * Tests unitaires pour js/drawer.js
 * Même pattern que main.test.js : exposition via window.__xxx en environnement Jest
 */


function flushPromises() {
  //return new Promise(resolve => setImmediate(resolve));
  return new Promise(resolve => setTimeout(resolve, 0));
}

  


function buildDom() {
  document.body.innerHTML = `
    <button class="drawer-tab" id="drawerTab">
      <i id="drawerIcon" class="fa fa-chevron-right"></i>
    </button>
    <aside class="sidebar" id="sidebar">
      <div class="avatar-card">
        <personal-info></personal-info>
      </div>
    </aside>
    <main class="content" id="content">
      <div class="personal-info-top" id="personalInfoTop">
        <div class="card"></div>
      </div>
    </main>
    <cv-menu></cv-menu>
  `;
}

beforeAll(() => {
  //buildDom();                          // 1. construire le DOM
  //require('../js/drawer.js');          // 2. charger le script (customElements.define + 1er appel initDrawerLogic)
});

beforeEach(() => {
  buildDom();
  localStorage.clear();
  jest.resetModules();
  global.fetch = jest.fn(() =>
    Promise.resolve({ json: () => Promise.resolve({}) })
  );
});

describe('CvMenu', () => {
  test('affiche les liens de la table des matières', async () => {
    require('../js/drawer.js');
    await flushPromises(); // ou : await new Promise(r => setTimeout(r, 0));

    const menu = document.querySelector('cv-menu');

    expect(menu.querySelector('a[href="#about"]')).not.toBeNull();
    expect(menu.querySelector('a[href="#work-experience"]')).not.toBeNull();
    expect(menu.querySelector('a[href="#education-academic"]')).not.toBeNull();
    expect(menu.querySelector('a[href="#education-other"]')).not.toBeNull();
    //expect(menu.querySelector('a[href="#portfolio"]')).not.toBeNull();
  });
});

describe('Drawer (tiroir)', () => {
  test('ouvre le tiroir par défaut si largeur > 900px', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
    require('../js/drawer.js');

    expect(window.__sidebar.classList.contains('open')).toBe(true);
    expect(window.__tab.classList.contains('open')).toBe(true);
    expect(window.__content.classList.contains('shifted')).toBe(true);
    expect(window.__icon.className).toBe('fa fa-chevron-left');
  });

  test('ferme le tiroir par défaut si largeur <= 900px sans préférence sauvegardée', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });
    require('../js/drawer.js');

    expect(window.__sidebar.classList.contains('open')).toBe(false);
  });

  test('respecte la préférence localStorage sur mobile', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });
    localStorage.setItem('drawerOpen', '1');
    require('../js/drawer.js');

    expect(window.__sidebar.classList.contains('open')).toBe(true);
  });

  test('toggle l\'état au clic sur le drawer-tab', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
    require('../js/drawer.js');

    expect(window.__sidebar.classList.contains('open')).toBe(true);

    window.__tab.click();
    expect(window.__sidebar.classList.contains('open')).toBe(false);

    window.__tab.click();
    expect(window.__sidebar.classList.contains('open')).toBe(true);
  });

  test('sauvegarde l\'état dans localStorage après chaque toggle', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
    require('../js/drawer.js');

    window.__tab.click();
    expect(localStorage.getItem('drawerOpen')).toBe('0');

    window.__tab.click();
    expect(localStorage.getItem('drawerOpen')).toBe('1');
  });

  test('setOpen(false) met bien fa-chevron-right sur l\'icône', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
    require('../js/drawer.js');

    window.__setOpen(false);

    expect(window.__icon.className).toBe('fa fa-chevron-right');
    expect(window.__content.classList.contains('shifted')).toBe(false);
  });
});

test('déplace personal-info dans la sidebar quand le tiroir est ouvert', () => {
  Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
  require('../js/drawer.js');

  const sidebarAvatarCard = document.querySelector('.avatar-card');
  const personalInfoTop = document.getElementById('personalInfoTop');

  expect(sidebarAvatarCard.querySelector('personal-info')).not.toBeNull();
  expect(personalInfoTop.querySelector('personal-info')).toBeNull();
  expect(personalInfoTop.classList.contains('active')).toBe(false);
});

test('déplace personal-info dans le contenu principal quand le tiroir est fermé', () => {
  Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });
  require('../js/drawer.js');

  const sidebarAvatarCard = document.querySelector('.avatar-card');
  const personalInfoTop = document.getElementById('personalInfoTop');

  expect(personalInfoTop.querySelector('personal-info')).not.toBeNull();
  expect(sidebarAvatarCard.querySelector('personal-info')).toBeNull();
  expect(personalInfoTop.classList.contains('active')).toBe(true);
});

test('re-déplace personal-info vers personalInfoTop après un clic sur drawer-tab', () => {
  Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
  require('../js/drawer.js');

  const sidebarAvatarCard = document.querySelector('.avatar-card');
  const personalInfoTop = document.getElementById('personalInfoTop');

  expect(sidebarAvatarCard.querySelector('personal-info')).not.toBeNull();

  window.__tab.click();

  expect(personalInfoTop.querySelector('personal-info')).not.toBeNull();
  expect(sidebarAvatarCard.querySelector('personal-info')).toBeNull();
  expect(personalInfoTop.classList.contains('active')).toBe(true);

  window.__tab.click();

  expect(sidebarAvatarCard.querySelector('personal-info')).not.toBeNull();
  expect(personalInfoTop.classList.contains('active')).toBe(false);
});

