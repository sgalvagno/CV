import { I18n } from './main.js';

class CvMenuOld extends HTMLElement {
    connectedCallback() {
    this.innerHTML = `
        <div class="card">
        <p class="menu-title">
            <i class="fa fa-list fa-fw icon-teal"></i>
            <b>Table of contents</b>
        </p>
        <ul class="menu-list">
            <li><a href="#about">About</a></li>
            <li><a href="#work-experience">Work Experience</a></li>
            <li><a href="#education-academic">Education – Academic</a></li>
            <li><a href="#education-other">Education – MOOC & Trainings</a></li>
        </ul>
        </div>
    `;
        // <li><a href="#portfolio">Portfolio</a></li>

    }
}

class CvMenu extends HTMLElement {
  async connectedCallback() {
    await I18n.load();
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="card">
        <p class="menu-title"><i class="fa fa-list fa-fw icon-teal"></i> <b>${I18n.t('tableOfContents')}</b></p>
        <ul class="menu-list">
          <li><a href="#about">${I18n.t('about')}</a></li>
          <li><a href="#work-experience">${I18n.t('workExperience')}</a></li>
          <li><a href="#education-academic">${I18n.t('educationAcademic')}</a></li>
          <li><a href="#education-other">${I18n.t('educationOther')}</a></li>
        </ul>
      </div>
    `;
              // <li><a href="portfolio">${I18n.t('portfolio')}</a></li>

  }
}

// customElements.define('cv-menu', CvMenu);
if (!customElements.get('cv-menu')) {
  customElements.define('cv-menu', CvMenu);
}


function initDrawerLogic() {
    const sidebar = document.getElementById('sidebar');
    const tab = document.getElementById('drawerTab');
    const icon = document.getElementById('drawerIcon');
    const content = document.getElementById('content');
    const personalInfoTop = document.getElementById('personalInfoTop');
    const personalInfoTopCard = personalInfoTop.querySelector('.card');
    const sidebarAvatarCard = document.querySelector('.avatar-card');
    const personalInfoEl = sidebarAvatarCard?.querySelector('personal-info');

    function setOpen(open) {
        const personalInfoTop = document.getElementById('personalInfoTop');
        const sidebarAvatarCard = document.querySelector('.avatar-card');
        const personalInfoEl = sidebarAvatarCard?.querySelector('personal-info')
        || personalInfoTop?.querySelector('personal-info');

        sidebar.classList.toggle('open', open);
        tab.classList.toggle('open', open);
        content.classList.toggle('shifted', open);
        icon.className = open ? 'fa fa-chevron-left' : 'fa fa-chevron-right';
        localStorage.setItem('drawerOpen', open ? '1' : '0');

        if (!personalInfoEl || !sidebarAvatarCard || !personalInfoTop) return;
        
        if (open) {
        sidebarAvatarCard.appendChild(personalInfoEl);
        personalInfoTop.classList.remove('active');
        } else {
        // personalInfoTop.appendChild(personalInfoEl);
        personalInfoTopCard.appendChild(personalInfoEl);
        personalInfoTop.classList.add('active');
        }
      }

      tab.addEventListener('click', () => setOpen(!sidebar.classList.contains('open')));

      const initialOpen = window.innerWidth > 900 ? true : (localStorage.getItem('drawerOpen') === '1');
      setOpen(initialOpen);

      /*  le menu si on reduit la fenetre sous 900px */
  

      /* ferme et ouvre le menu si la fenetre passe au dessous/desus de 900px */
      let wasWide = window.innerWidth > 900;
      window.addEventListener('resize', () => {
        const isWide = window.innerWidth > 900;
        if (wasWide !== isWide) {
          setOpen(isWide);
        }
        wasWide = isWide;
      });

      /* test mode */
      if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID !== undefined) {
      window.__setOpen = setOpen;
      window.__sidebar = sidebar;
      window.__tab = tab;
      window.__content = content;
      window.__icon = icon;
      }

    }

initDrawerLogic(); // exécution normale au chargement dans le navigateur

/* test mode */
if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID !== undefined) {
  window.__initDrawerLogic = initDrawerLogic;
}

