// Classe de base : gère le fetch commun

// import { ViewMode } from './viewmode.js';


const ViewMode = {
  KEY: 'cv-view-mode',

  get() {
    return localStorage.getItem(this.KEY) || 'tabs';
  },

  set(mode) {
    localStorage.setItem(this.KEY, mode);
    document.dispatchEvent(new CustomEvent('viewmodechange', { detail: { mode } }));
  },

  toggle() {
    const next = this.get() === 'tabs' ? 'flat' : 'tabs';
    this.set(next);
    return next;
  }
};


class DataComponent extends HTMLElement {
  async connectedCallback() {
    try {
      const [data] = await Promise.all([DataComponent.getData(), I18n.load()]);
      this.render(data);
    } catch (e) {
      // console.error(e.message);
      this.renderError();
    }
  }

  render(data) {
    this.innerHTML = `<p>Composant non implémenté.</p>`;
  }

  renderError() {
    this.innerHTML = `<p>Contenu indisponible.</p>`;
  }

  static dataPromise = null;

  static getLang() {
    const saved = localStorage.getItem('lang');
    if (saved === 'fr' || saved === 'en') return saved;
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    return browserLang.startsWith('fr') ? 'fr' : 'en';
  }

  static getData() {
    if (!DataComponent.dataPromise) {
      const lang = DataComponent.getLang();
      DataComponent.dataPromise = fetch(`data/cv.${lang}.json`)
        .then(res => res.json())
        .catch(e => console.log(e));
    }
    return DataComponent.dataPromise;
  }

  static resetCache() {
    DataComponent.dataPromise = null;
  }

  static setLang(lang) {
    localStorage.setItem('lang', lang);
    DataComponent.resetCache();
  }
}

if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID !== undefined) {
 window.__DataComponent = DataComponent;
}


class I18n {
  static translations = null;
  static loadPromise = null;

  static load() {
    if (!I18n.loadPromise) {
      if (typeof fetch === 'undefined') {
        I18n.translations = {};
        I18n.loadPromise = Promise.resolve({});
        return I18n.loadPromise;
      }
      I18n.loadPromise = fetch('data/lang.json')
        .then(res => res.json())
        .then(data => { I18n.translations = data; return data; })
        // .catch(e => { console.error(e); I18n.translations = {}; });
        .catch(e => { I18n.translations = {}; });
    }
    return I18n.loadPromise;
  }

  static t(key) {
    const lang = DataComponent.getLang();
    return I18n.translations?.[key]?.[lang] || key;
  }
}

if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID !== undefined) {
  window.__I18n = I18n;
}


class CvSectionTitle extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const text = this.getAttribute('text') || '';
    const icon = this.getAttribute('icon') || 'fa-certificate';

    this.innerHTML = `
      <h2 class="section-title">
        <i class="fa ${icon} fa-fw icon-teal"></i>
        ${text}
      </h2>
    `;
  }
}
if (!customElements.get('cv-section-title')) {
  customElements.define('cv-section-title', CvSectionTitle);
}
class CvSectionCard extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const text = this.getAttribute('text') || '';
    const icon = this.getAttribute('icon') || 'fa-certificate';

    this.innerHTML = `
      <div class="card">
        <cv-section-title
          text="${text}"
          icon="${icon}">
        </cv-section-title>
        <div class="cv-section-body">
          <slot></slot>
        </div>
      </div>
    `;
  }
}
if (!customElements.get('cv-section-card')) {
  customElements.define('cv-section-card', CvSectionCard);
}

class PersonalInfo extends DataComponent {
  render(data) {
    const p = data.personal;
    this.innerHTML = `
      <div class="personal-info">
        <div class="avatar-wrap">
          <img src="images/avatar.jpg" alt="Avatar" class="avatar-img">
        </div>
        <div class="personal-info-text">
          ${p.name ? `<h2 class="personal-name">${p.name}</h2>` : ''}
          ${p.positions?.length ? `<p class="personal-positions">${p.positions[0]}</p>` : ''}
          ${p.locations?.map(loc => `<p class="cv-line"><i class="fa fa-home fa-fw icon-teal"></i> ${loc}</p>`).join('') || ''}
          ${p.email_hint ? `<p class="cv-line"><i class="fa fa-envelope fa-fw icon-teal"></i>${p.email_hint}</p>` : ''}
          ${p.phone ? `<p class="cv-line"><i class="fa fa-phone fa-fw icon-teal"></i> ${p.phone}</p>` : ''}
          ${p.social?.linkedin ? `<p class="cv-line"><i class="fa fa-linkedin fa-fw icon-teal"></i> <a href="${p.social.linkedin}" target="_blank" rel="noopener">LinkedIn</a></p>` : ''}
          ${p.social?.github ? `<p class="cv-line"><i class="fa fa-github fa-fw icon-teal"></i> <a href="${p.social.github}" target="_blank" rel="noopener">GitHub</a></p>` : ''}
          ${p.rcs ? `<p class="personal-rcs">${p.rcs}</p>` : ''}
        </div>

      </div>
    `;
  }
}
if (!customElements.get('personal-info')) {
  customElements.define('personal-info', PersonalInfo);
}

class AboutSection extends DataComponent {

  constructor() {
    super();
    this.activeSummary = 'cycle' ;
  }

  getSummary(a) {
    if (!a.summary) return '';
    const key = this.activeSummary || 'long';
    return a.summary[key] || a.summary.long || '';
  }

  handleTagClick(key) {
    if (key === this.activeSummary) return;
    const p = this.querySelector('.card p');
    if (p) {
      p.classList.add('fade-out');
      setTimeout(() => {
        this.activeSummary = key;
        this.render(this.data);
      }, 200);
    } else {
      this.activeSummary = key;
      this.render(this.data);
    }
  }

  render(data) {
    this.data = data;
    const a = data.about;

    const tags = [
      // { key: 'cycle', label: 'Infra' },
      // { key: 'dev', label: 'Dev' },
      // { key: 'long', label: 'Général' }
    ];

    this.innerHTML = `
      <div class="section-block">
        <cv-section-title
          text="${I18n.t('about')}"
          icon="fa-asterisk">
        </cv-section-title>

        <div class="tags">
          ${tags.map(t => `
            <button class="tag-btn ${this.activeSummary === t.key ? 'active' : ''}" data-key="${t.key}">
              ${t.label}
            </button>
          `).join('')}
        </div>

        <div class="card about-card">
          ${a.summary ? `<p class="fade-in">${this.getSummary(a)}</p>` : ''}
        </div>
      </div>
    `;

    this.querySelectorAll('.tag-btn').forEach(el => {
      el.addEventListener('click', () => this.handleTagClick(el.dataset.key));
    });
  }
}
if (!customElements.get('about-section')) {
  customElements.define('about-section', AboutSection);
}
class WorkExperience extends DataComponent {

   constructor() {
    super();
    this.activeIndices = {};
    this.viewMode = 'tabs'; // valeur par défaut sûre, pas de dépendance externe
    this._onViewChange = (e) => {
      this.viewMode = e.detail.mode;
      if (this.data) this.render(this.data);
    };
  }

  connectedCallback() {
    this.viewMode = ViewMode.get();
    document.addEventListener('viewmodechange', this._onViewChange);
    super.connectedCallback(); // relance le fetch + render du parent
  }

  disconnectedCallback() {
    document.removeEventListener('viewmodechange', this._onViewChange);
  }

  stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  getActiveIndex(expIdx) {
    return this.activeIndices[expIdx] ?? 0;
  }

  handleTabClick(expIdx, secIdx) {
    if (this.getActiveIndex(expIdx) === secIdx) return;
    const card = this.querySelector(`.about-card[data-exp="${expIdx}"]`);
    if (card) {
      card.classList.add('fade-out');
      setTimeout(() => {
        this.activeIndices[expIdx] = secIdx;
        this.render(this.data);
      }, 200);
    } else {
      this.activeIndices[expIdx] = secIdx;
      this.render(this.data);
    }
  }

  renderSectionContent(sec) {
    if (!sec) return '';
    return `
      <h6 class="section-content-title">${sec.titre}</h6>
      ${sec.paragraphe ? `<p>${sec.paragraphe}</p>` : ''}
      <ul>
        ${sec.items.map(item => `
          <li>
            <b>${item.titre}</b>
            <ul>
              ${item.bullets.map(b => `<li>${b}</li>`).join('')}
            </ul>
            ${item.repo?.length
              ? `<p><b>${I18n.t('repository')}: </b><a href="${item.repo}">${item.repo}</a></p>`
              : ''}
            ${item.techno?.length
              ? `<p><b>${I18n.t('technologies')}:</b> ${item.techno.join(', ')}</p>`
              : ''}
          </li>
        `).join('')}
      </ul>
    `;
  }

  renderFlatSections(sections) {
    return sections.map(sec => `
      <div class="cv-subsection">
        <b>${sec.titre}</b>
        ${sec.paragraphe ? `<p>${sec.paragraphe}</p>` : ''}
        <ul>
          ${sec.items.map(item => `
            <li>
              <b>${item.titre}</b>
              <ul>
                ${item.bullets.map(b => `<li>${b}</li>`).join('')}
              </ul>
              ${item.repo?.length
                ? `<p><b>${I18n.t('repository')}: </b><a href="${item.repo}">${item.repo}</a></p>`
                : ''}
              ${item.techno?.length
                ? `<p><b>${I18n.t('technologies')}:</b> ${item.techno.join(', ')}</p>`
                : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    `).join('');
  }

  renderTabbedSections(exp, expIdx) {
    const sections = exp.sections || [];
    const activeSecIdx = this.getActiveIndex(expIdx);

    return `
      <div class="tags">
        ${sections.map((sec, secIdx) => `
          <button class="tag-btn ${activeSecIdx === secIdx ? 'active' : ''}"
                  data-exp="${expIdx}" data-sec="${secIdx}">
            ${this.stripHtml(sec.titre)}
          </button>
        `).join('')}
      </div>

      <div class="cv-subsection card about-card" data-exp="${expIdx}">
        ${this.renderSectionContent(sections[activeSecIdx])}
      </div>
    `;
  }

  render(data) {
    this.data = data;
    const exps = data.experience || [];

    const experiences = exps.map((exp, expIdx) => {
      const sections = exp.sections || [];

      return `
        <div class="card">
          <h5 class="cv-subtitle">
            <b>${exp.titre} – ${exp.organisation}</b>
          </h5>
          <h6 class="cv-date">
            <i class="fa fa-calendar fa-fw"></i>
            ${exp.date.start}
            ${exp.date.current ? ` – ${I18n.t('present')}` : ` – ${exp.date.end}`}
            ${exp.mode ? ` · ${exp.mode}` : ''}
            ${exp.lieu ? ` · ${exp.lieu}` : ''}
          </h6>

          ${exp.intro ? `<p>${exp.intro}</p>` : ''}

          ${sections.length
            ? (this.viewMode === 'tabs'
                ? this.renderTabbedSections(exp, expIdx)
                : this.renderFlatSections(sections))
            : ''}

          ${exp.tags?.length
            ? `<p><b>${I18n.t('tags')}:</b> ${exp.tags.join(', ')}</p>`
            : ''}
        </div>
      `;
    }).join('');

    this.innerHTML = `
      <div class="section-block">
        <cv-section-title
          text="${I18n.t('workExperience')}"
          icon="fa-suitcase">
        </cv-section-title>
        ${experiences}
      </div>
    `;

    if (this.viewMode === 'tabs') {
      this.querySelectorAll('.tag-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.handleTabClick(
            parseInt(btn.dataset.exp, 10),
            parseInt(btn.dataset.sec, 10)
          );
        });
      });
    }
  }
}
if (!customElements.get('work-experience')) {
  customElements.define('work-experience', WorkExperience);
}
class EducationAcademic extends DataComponent {
  render(data) {
    const acad = (data.education && data.education.academique) || [];

      //<div class="cv-row">
    const educations = acad.map(e => `
      <div class="card">
        <h5 class="cv-subtitle"><b><i class="fa fa-graduation-cap fa-fw icon-teal"></i> ${e.nom}</b></h5>
        <h6 class="cv-date">
          <i class="fa fa-calendar fa-fw"></i>${e.date || ''} ${e.organisme ? ` - ${e.organisme}` : ''}
        </h6>
        ${e.detail ? `<p>${e.detail}</p>` : ''}
      </div>
    `).join('');

      this.innerHTML = `
      <div class="section-block">
        <cv-section-title
          text="${I18n.t('educationAcademic')}"
          icon="fa-certificate">
        </cv-section-title>
        ${educations}
      </div>
    `;
  }
}
if (!customElements.get('education-academic')) {
  customElements.define('education-academic', EducationAcademic);
}

class EducationOther extends DataComponent {

  constructor() {
    super();
    this.selectedTags = new Set();
    this.dropdownOpen = false;
    this.groupField = 'date';
    this.activeDate = null;
    this.viewMode = ViewMode.get();
    this._onOutsideClick = (e) => {
      if (!this.contains(e.target)) {
        this.dropdownOpen = false;
        this.render(this.data);
      }
    };
    this._onViewChange = (e) => {
      this.viewMode = e.detail.mode;
      if (this.data) this.render(this.data);
    };
  }

  connectedCallback() {
    document.addEventListener('click', this._onOutsideClick);
    document.addEventListener('viewmodechange', this._onViewChange);
    super.connectedCallback();
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._onOutsideClick);
    document.removeEventListener('viewmodechange', this._onViewChange);
  }

  toggleGroupField() {
    this.groupField = this.groupField === 'date' ? 'tags' : 'date';
    this.activeDate = null;
    this.render(this.data);
  }

  setActiveDate(key) {
    this.activeDate = this.activeDate === key ? null : key;
    this.render(this.data);
  }

  toggleDropdown(e) {
    e.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
    this.render(this.data);
  }

  clearFilters() {
    this.selectedTags.clear();
    this.render(this.data);
  }

  toggleTag(tag) {
    if (this.selectedTags.has(tag)) {
      this.selectedTags.delete(tag);
    } else {
      this.selectedTags.add(tag);
    }
    this.render(this.data);
  }

  renderEntry(e) {
    return `
      <div class="cv-subsection">
        <h5 class="cv-subtitle"><b>${e.nom}</b></h5>
        <h6 class="cv-date">
          <i class="fa fa-calendar fa-fw"></i>${e.date}${e.organisme ? ` - ${e.organisme}` : ''}
        </h6>
        ${e.detail ? `<p>${e.detail}</p>` : ''}
        ${e.certificate
          ? `<p><i class="fa fa-graduation-cap fa-fw icon-teal"></i> <a href="${e.certificate}" target="_blank">${I18n.t('certificate')}</a></p>`
          : ''}
        ${e.tags?.length
          ? `<div class="techno-tags">${e.tags.map(tag => `<span class="tech-chip">${tag}</span>`).join('')}</div>`
          : ''}
      </div>
    `;
  }

  renderFlat(data){
    const other = data.education?.autre || [];
    if (this.viewMode === 'flat') {
      this.innerHTML = `
        <div class="section-block">
          <cv-section-title
            text="${I18n.t('educationOther')}"
            icon="fa-certificate">
          </cv-section-title>

          ${other.map(e => this.renderEntry(e)).join('') || `<p class="empty-state">Aucune formation.</p>`}
        </div>
      `;
      return;
    }
  }

  render(data) {
    this.data = data;
    const other = data.education?.autre || [];

    if (this.viewMode === 'flat') {
      return this.renderFlat(data);
    }

    const allTags = [...new Set(other.flatMap(e => e.tags || []))].sort();

    // 1) On filtre par tags D'ABORD
    const tagFiltered = this.selectedTags.size === 0
      ? other
      : other.filter(e => (e.tags || []).some(t => this.selectedTags.has(t)));

    // 2) Les dates disponibles dérivent du résultat du filtre tag (donc s'adaptent)
    const allDates = [...new Set(tagFiltered.map(e => e.date || 'Autre'))]
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

    // 3) Si la date active a disparu du résultat filtré, on la réinitialise
    if (this.activeDate && !allDates.includes(this.activeDate)) {
      this.activeDate = null;
    }

    let filtered = tagFiltered;
    if (this.groupField === 'date' && this.activeDate) {
      filtered = filtered.filter(e => (e.date || 'Autre') === this.activeDate);
    }

    const groups = {};
    filtered.forEach(e => {
      const key = e.date || 'Autre';
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

    const renderChip = (tag) => `
      <span class="tech-chip ${this.selectedTags.has(tag) ? 'active' : ''}" data-tag="${tag}">${tag}</span>
    `;

    const blocks = sortedKeys.map(key => `
      <div class="cv-group">
        <h6 class="cv-group-title">${key}</h6>
        ${groups[key].map(e => `
          <div class="cv-subsection">
            <h5 class="cv-subtitle"><b>${e.nom}</b></h5>
            <h6 class="cv-date">
              <i class="fa fa-calendar fa-fw"></i>${e.date}${e.organisme ? ` - ${e.organisme}` : ''}
            </h6>
            ${e.detail ? `<p>${e.detail}</p>` : ''}
            ${e.certificate
              ? `<p><i class="fa fa-graduation-cap fa-fw icon-teal"></i> <a href="${e.certificate}" target="_blank">${I18n.t('certificate')}</a></p>`
              : ''}
            ${e.tags?.length
              ? `<div class="techno-tags">${e.tags.map(renderChip).join('')}</div>`
              : ''}
          </div>
        `).join('')}
      </div>
    `).join('');

    // NOUVEAU : ligne des tags actuellement sélectionnés, empilée AU-DESSUS des onglets de date
    const selectedTagsRow = this.selectedTags.size ? `
      <div class="selected-tags-row">
        ${[...this.selectedTags].map(tag => `
          <span class="tech-chip active" data-tag="${tag}">${tag} <i class="fa fa-times"></i></span>
        `).join('')}
      </div>
    ` : '';

    const dateTabs = this.groupField === 'date' ? `
      <div class="tags">
        <button class="tag-btn ${!this.activeDate ? 'active' : ''}" data-date="">Tous</button>
        ${allDates.map(d => `
          <button class="tag-btn ${this.activeDate === d ? 'active' : ''}" data-date="${d}">${d}</button>
        `).join('')}
      </div>
    ` : '';

    this.innerHTML = `
      <div class="section-block">
        <cv-section-title
          text="${I18n.t('educationOther')}"
          icon="fa-certificate">
        </cv-section-title>

        <div class="filter-bar">
          <button class="tag-btn group-mode-btn" id="groupModeToggle">
            ${this.groupField === 'date' ? 'Trier par tag' : 'Trier par date'}
          </button>

          <div class="multiselect">
            <button class="multiselect-btn" id="msToggle">
              <i class="fa fa-filter fa-fw"></i>
              Filtrer OU sur les tags
              ${this.selectedTags.size ? `<span class="ms-count">${this.selectedTags.size}</span>` : ''}
            </button>
            ${this.dropdownOpen ? `
              <div class="multiselect-panel">
                ${allTags.map(tag => `
                  <label class="ms-option">
                    <input type="checkbox" data-tag="${tag}" ${this.selectedTags.has(tag) ? 'checked' : ''}>
                    ${tag}
                  </label>
                `).join('')}
              </div>
            ` : ''}
          </div>
          ${this.selectedTags.size ? `<button class="ms-clear" id="msClear">Réinitialiser</button>` : ''}
        </div>

        ${selectedTagsRow}

        ${dateTabs}

        ${blocks || `<p class="empty-state">Aucune formation pour ces filtres.</p>`}
      </div>
    `;

    this.querySelector('#groupModeToggle')?.addEventListener('click', () => this.toggleGroupField());
    this.querySelector('#msToggle')?.addEventListener('click', (e) => this.toggleDropdown(e));
    this.querySelector('#msClear')?.addEventListener('click', () => this.clearFilters());
    this.querySelector('.multiselect-panel')?.addEventListener('click', (e) => e.stopPropagation());

    this.querySelectorAll('.multiselect-panel input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => this.toggleTag(cb.dataset.tag));
    });

    // Écoute les clics sur TOUTES les puces .tech-chip, y compris celles
    // de la nouvelle ligne "selected-tags-row" — un clic dessus retire le tag
    this.querySelectorAll('.tech-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleTag(chip.dataset.tag);
      });
    });

    this.querySelectorAll('.tags .tag-btn').forEach(tab => {
      tab.addEventListener('click', () => this.setActiveDate(tab.dataset.date || null));
    });
  }

}
if (!customElements.get('education-other')) {
  customElements.define('education-other', EducationOther);
}


function initLangToggle() {
  const btn = document.getElementById('langToggle');
  if (!btn) return;
  const label = btn.querySelector('span');

  function updateLabel() {
    const lang = DataComponent.getLang();
    label.textContent = lang === 'fr' ? 'EN' : 'FR';
  }

  btn.addEventListener('click', () => {
    const current = DataComponent.getLang();
    const next = current === 'fr' ? 'en' : 'fr';
    DataComponent.setLang(next);
    updateLabel();
    location.reload();
  });

  updateLabel();
}

initLangToggle();

if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID !== undefined) {
  window.__initLangToggle = initLangToggle;
}



export { DataComponent, I18n };



const viewToggleBtn = document.getElementById('viewToggle');
if (viewToggleBtn) {
  viewToggleBtn.addEventListener('click', (e) => {
    const mode = ViewMode.toggle();
    const icon = e.currentTarget.querySelector('i');
    icon.className = mode === 'tabs' ? 'fa fa-list' : 'fa fa-th-large';
  });
}