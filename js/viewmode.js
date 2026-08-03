export const ViewMode = {
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

document.getElementById('viewToggle').addEventListener('click', (e) => {
  const mode = ViewMode.toggle();
  const icon = e.currentTarget.querySelector('i');
  icon.className = mode === 'tabs' ? 'fa fa-list' : 'fa fa-th-large';
});

