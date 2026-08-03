/**
 * Tests unitaires pour main.js
 * Framework: Jest + jsdom (environnement par défaut de Jest)
 *
 * Installation nécessaire :
 *   npm install --save-dev jest jest-environment-jsdom
 *
 * package.json :
 *   "scripts": { "test": "jest" },
 *   "jest": { "testEnvironment": "jsdom" }
 *
 * Lancer : npm test
 */

// ---------- Mock des données CV ----------
const mockCvData = {
  personal: {
    name: "Sébastien Galvagno",
    positions: ["Software Engineer", "DevOps"],
    locations: ["Antibes, France"],
    email_hint: "sebastien [at] example.com",
    phone: "+33 6 00 00 00 00",
    rcs: "RCS Toulouse 123 456 789"
  },
  about: {
  summary: {
    cycle: "Ingénieur logiciel senior avec 20 ans d'expérience.",
    long: "Ingénieur logiciel senior avec 20 ans d'expérience."
  }  },
  experience: [
    {
      titre: "Software Engineer & DevOps",
      organisation: "Sorbonne Université",
      date: { start: "June 2023", end: "August 2025", current: false },
      mode: "Hybrid",
      lieu: "Villefranche-sur-Mer, France",
      intro: "Membre de l'équipe COMPLEx.",
      sections: [
        {
          titre: "ZooProcess",
          paragraphe: "Développement d'une plateforme web.",
          items: [
            {
              titre: "Backend",
              bullets: ["API design", "Node.js/Express.js"],
              repo: "https://github.com/example/repo",
              techno: ["Node.js", "MongoDB"]
            }
          ]
        }
      ],
      tags: ["Node.js", "React", "Python"]
    }
  ],
  education: {
    academique: [
      { nom: "Master Informatique", date: "2010", organisme: "Université de Lille", detail: "Spécialité systèmes." }
    ],
    autre: [
      { nom: "Centrale Lille – Project Management", date: "2015", organisme: "Centrale Lille", certificate: "https://example.com/cert.pdf", tags: ["Gestion de projet"] }
    ]
  }
};

// ---------- Setup global : mock fetch avant de charger main.js ----------
let DataComponentRef;
beforeAll(() => {
  require('../js/main.js');
});


const langData = require('../data/lang.json'); //

beforeEach(() => {
  document.body.innerHTML = '';
  window.__DataComponent.resetCache();

  global.fetch = jest.fn((url) => {
    if (url.includes('lang.json')) {
      return Promise.resolve({ json: () => Promise.resolve(langData) });
    }

    // cv.en.json / cv.fr.json
    return Promise.resolve({ json: () => Promise.resolve(mockCvData) });
  });

  // Reset du cache statique entre chaque test (accès via un composant existant)
  // const probe = document.createElement('about-section');
  // Object.getPrototypeOf(Object.getPrototypeOf(probe)).constructor._dataPromise = null;
  window.__I18n.loadPromise = null;
});


afterEach(() => {
  jest.restoreAllMocks();
});

// Petite fonction utilitaire pour attendre le prochain tick (fetch + render asynchrones)
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('DataComponent (classe de base)', () => {
  test('affiche un message d\'erreur si le fetch échoue', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('network error')));

    document.body.innerHTML = '<about-section></about-section>';
    const el = document.querySelector('about-section');

    await flushPromises();

    expect(el.innerHTML).toContain('Contenu indisponible');
  });

  test('ne fait qu\'un seul fetch même avec plusieurs composants', async () => {
    document.body.innerHTML = `
      <about-section></about-section>
      <work-experience></work-experience>
      <education-academic></education-academic>
    `;

    await flushPromises();

    const cvJsonCalls = global.fetch.mock.calls.filter(
      ([url]) => /^data\/cv\.\w+\.json$/.test(url)
    );
    expect(cvJsonCalls).toHaveLength(1);
    });
});


describe('CvSectionTitle', () => {
  test('affiche le texte et l\'icône passés en attribut', () => {
    document.body.innerHTML = '<cv-section-title text="About" icon="fa-asterisk"></cv-section-title>';
    const el = document.querySelector('cv-section-title');

    expect(el.querySelector('h2.section-title')).not.toBeNull();
    expect(el.textContent.trim()).toBe('About');
    expect(el.querySelector('i').className).toContain('fa-asterisk');
    expect(el.querySelector('i').className).toContain('icon-teal');
  });

  test('utilise fa-certificate par défaut si aucune icône n\'est fournie', () => {
    document.body.innerHTML = '<cv-section-title text="Test"></cv-section-title>';
    const el = document.querySelector('cv-section-title');

    expect(el.querySelector('i').className).toContain('fa-certificate');
  });

  test('affiche une chaîne vide si aucun texte n\'est fourni', () => {
    document.body.innerHTML = '<cv-section-title></cv-section-title>';
    const el = document.querySelector('cv-section-title');

    expect(el.textContent.trim()).toBe('');
  });
});

describe('PersonalInfo', () => {
  test('affiche le nom, les positions et les coordonnées', async () => {
    document.body.innerHTML = '<personal-info></personal-info>';
    const el = document.querySelector('personal-info');

    await flushPromises();

    expect(el.innerHTML).toContain('Sébastien Galvagno');
    //expect(el.innerHTML).toContain('Software Engineer · DevOps'); // positions .joint()  j'ai simplifié dans le main
    expect(el.innerHTML).toContain('Software Engineer'); // positions[0]
    expect(el.innerHTML).not.toContain('DevOps'); // confirme que seul positions[0] est utilisé
    expect(el.innerHTML).toContain('Antibes, France');
    expect(el.innerHTML).toContain('sebastien [at] example.com');
    expect(el.innerHTML).toContain('+33 6 00 00 00 00');
    expect(el.innerHTML).toContain('RCS Toulouse 123 456 789');
  });

  test('n\'affiche pas les champs optionnels absents', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ personal: { name: 'Test User' } }) })
    );

    document.body.innerHTML = '<personal-info></personal-info>';
    const el = document.querySelector('personal-info');

    await flushPromises();

    expect(el.innerHTML).toContain('Test User');
    expect(el.innerHTML).not.toContain('fa-envelope');
    expect(el.innerHTML).not.toContain('fa-phone');
  });
});

describe('AboutSection', () => {
  test('affiche le résumé dans une card à l\'intérieur du section-block', async () => {
    document.body.innerHTML = '<about-section></about-section>';
    const el = document.querySelector('about-section');

    await flushPromises();

    expect(el.querySelector('.section-block')).not.toBeNull();
    expect(el.querySelector('.card')).not.toBeNull();
    expect(el.innerHTML).toContain("Ingénieur logiciel senior");
  });

  test('affiche le titre "About" avec l\'icône fa-asterisk', async () => {
    document.body.innerHTML = '<about-section></about-section>';
    const el = document.querySelector('about-section');

    await flushPromises();

    const title = el.querySelector('cv-section-title');
    expect(title.getAttribute('text')).toBe('About');
    // expect(title.getAttribute('text')).toBe('À propos');
    expect(title.getAttribute('icon')).toBe('fa-asterisk');
  });
});

describe('WorkExperience', () => {
  test('affiche une card par expérience professionnelle', async () => {
    document.body.innerHTML = '<work-experience></work-experience>';
    const el = document.querySelector('work-experience');

    await flushPromises();

    const cards = el.querySelectorAll('.cv-job-card, .card');
    expect(cards.length).toBeGreaterThan(0);
    expect(el.innerHTML).toContain('Software Engineer &amp; DevOps');
    expect(el.innerHTML).toContain('Sorbonne Université');
  });

  test('affiche "Present" si l\'expérience est en cours', async () => {
  const dataWithCurrent = JSON.parse(JSON.stringify(mockCvData));
  dataWithCurrent.experience[0].date.current = true;

  global.fetch = jest.fn((url) => {
    if (url.includes('lang.json')) {
      return Promise.resolve({ json: () => Promise.resolve(langData) });
    }
    return Promise.resolve({ json: () => Promise.resolve(dataWithCurrent) });
  });

  document.body.innerHTML = '<work-experience></work-experience>';
  const el = document.querySelector('work-experience');
  await flushPromises();

  expect(el.innerHTML).toContain('Present');
});

  test('affiche les tags technologiques', async () => {
    document.body.innerHTML = '<work-experience></work-experience>';
    const el = document.querySelector('work-experience');

    await flushPromises();

    expect(el.innerHTML).toContain('Tags:');
    expect(el.innerHTML).toContain('Node.js');
    expect(el.innerHTML).toContain('React');
    expect(el.innerHTML).toContain('Python');
  });

test('affiche le lien repository et les technos au niveau de chaque item', async () => {
    document.body.innerHTML = '<work-experience></work-experience>';
    const el = document.querySelector('work-experience');

    await flushPromises();

    const link = el.querySelector('a[href="https://github.com/example/repo"]');
    expect(link).not.toBeNull();
    expect(el.innerHTML).toContain('Technologies:');
    expect(el.innerHTML).toContain('Node.js, MongoDB');
  });

  test('gère une liste d\'expériences vide sans planter', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ experience: [] }) })
    );

    document.body.innerHTML = '<work-experience></work-experience>';
    const el = document.querySelector('work-experience');

    await flushPromises();

    expect(el.querySelector('.section-block')).not.toBeNull();
  });
});

describe('EducationAcademic', () => {
  test('affiche les diplômes académiques', async () => {
    document.body.innerHTML = '<education-academic></education-academic>';
    const el = document.querySelector('education-academic');

    await flushPromises();

    expect(el.innerHTML).toContain('Master Informatique');
    expect(el.innerHTML).toContain('Université de Lille');
    expect(el.innerHTML).toContain('2010');
  });

  test('gère l\'absence du champ education sans planter', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({}) })
    );

    document.body.innerHTML = '<education-academic></education-academic>';
    const el = document.querySelector('education-academic');

    await flushPromises();

    expect(el.querySelector('.section-block')).not.toBeNull();
  });
});



describe('EducationAcademic', () => {
  test('affiche les diplômes académiques avec date et organisme sur la même ligne', async () => {
    document.body.innerHTML = '<education-academic></education-academic>';
    const el = document.querySelector('education-academic');
    await flushPromises();

    expect(el.querySelector('.card')).not.toBeNull();
    expect(el.innerHTML).toContain('Master Informatique');
    expect(el.innerHTML).toContain('2010');
    expect(el.innerHTML).toContain('- Université de Lille');
  });

  test('affiche le detail si présent', async () => {
    document.body.innerHTML = '<education-academic></education-academic>';
    const el = document.querySelector('education-academic');
    await flushPromises();

    expect(el.innerHTML).toContain('Spécialité systèmes.');
  });

  test('n\'affiche pas le detail si absent', async () => {
    const dataNoDetail = JSON.parse(JSON.stringify(mockCvData));
    delete dataNoDetail.education.academique[0].detail;
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(dataNoDetail) }));

    document.body.innerHTML = '<education-academic></education-academic>';
    const el = document.querySelector('education-academic');
    await flushPromises();

    expect(el.innerHTML).not.toContain('Spécialité systèmes.');
  });

  test('n\'affiche pas l\'organisme si absent', async () => {
    const dataNoOrg = JSON.parse(JSON.stringify(mockCvData));
    delete dataNoOrg.education.academique[0].organisme;
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(dataNoOrg) }));

    document.body.innerHTML = '<education-academic></education-academic>';
    const el = document.querySelector('education-academic');
    await flushPromises();

    expect(el.innerHTML).not.toContain('- Université de Lille');
    expect(el.innerHTML).toContain('Master Informatique');
  });

  test('affiche l\'icône fa-graduation-cap dans le titre', async () => {
    document.body.innerHTML = '<education-academic></education-academic>';
    const el = document.querySelector('education-academic');
    await flushPromises();

    expect(el.querySelector('.card h5 i.fa-graduation-cap')).not.toBeNull();
  });

  test('gère l\'absence du champ education sans planter', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) }));

    document.body.innerHTML = '<education-academic></education-academic>';
    const el = document.querySelector('education-academic');
    await flushPromises();

    expect(el.querySelector('.section-block')).not.toBeNull();
    expect(el.querySelectorAll('.card').length).toBe(0);
  });

  test('affiche plusieurs diplômes académiques', async () => {
    const dataMulti = JSON.parse(JSON.stringify(mockCvData));
    dataMulti.education.academique.push({ nom: 'Licence Informatique', date: '2007', organisme: 'Université de Lille' });
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(dataMulti) }));

    document.body.innerHTML = '<education-academic></education-academic>';
    const el = document.querySelector('education-academic');
    await flushPromises();

    expect(el.querySelectorAll('.card').length).toBe(2);
    expect(el.innerHTML).toContain('Master Informatique');
    expect(el.innerHTML).toContain('Licence Informatique');
  });
});


describe('EducationOther', () => {

  test('affiche le lien vers un certificat si disponible', async () => {
    document.body.innerHTML = '<education-other></education-other>';
    const el = document.querySelector('education-other');

    await flushPromises();

    expect(el.innerHTML).toContain('Centrale Lille');

    const certLink = el.querySelector('a[href="https://example.com/cert.pdf"]');
    expect(certLink).not.toBeNull();
  });

  test('n\'affiche pas de lien certificat si absent', async () => {
    const dataNoCert = JSON.parse(JSON.stringify(mockCvData));
    delete dataNoCert.education.autre[0].certificate;

    global.fetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve(dataNoCert) })
    );

    document.body.innerHTML = '<education-other></education-other>';
    const el = document.querySelector('education-other');

    await flushPromises();

    expect(el.querySelector('a')).toBeNull();
  });
// });

// describe('EducationOther', () => {
  test('affiche les formations avec date et organisme sur la même ligne', async () => {
    document.body.innerHTML = '<education-other></education-other>';
    const el = document.querySelector('education-other');
    await flushPromises();

    expect(el.querySelector('.cv-subsection')).not.toBeNull();
    expect(el.innerHTML).toContain('Centrale Lille');
    expect(el.innerHTML).toContain('2015');
    expect(el.innerHTML).toContain('- Centrale Lille');
  });

  test('affiche le lien certificat', async () => {
    document.body.innerHTML = '<education-other></education-other>';
    const el = document.querySelector('education-other');
    await flushPromises();

    expect(el.innerHTML).toContain('Centrale Lille');

    const certLink = el.querySelector('a[href="https://example.com/cert.pdf"]');
    expect(certLink).not.toBeNull();
    expect(certLink.getAttribute('target')).toBe('_blank');
  });


  test('affiche le lien certificat avec icône fa-graduation-cap et target=_blank', async () => {
    document.body.innerHTML = '<education-other></education-other>';
    const el = document.querySelector('education-other');
    await flushPromises();

    const certLink = el.querySelector('a[href="https://example.com/cert.pdf"]');
    expect(certLink).not.toBeNull();
    expect(certLink.getAttribute('target')).toBe('_blank');
    expect(certLink.textContent.trim()).toBe('Certificate');
    expect(el.querySelector('.cv-subsection i.fa-graduation-cap')).not.toBeNull(); // ← .card → .cv-subsection
  });

  test('n\'affiche pas de lien certificat si absent', async () => {
    const dataNoCert = JSON.parse(JSON.stringify(mockCvData));
    delete dataNoCert.education.autre[0].certificate;
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(dataNoCert) }));

    document.body.innerHTML = '<education-other></education-other>';
    const el = document.querySelector('education-other');
    await flushPromises();

    expect(el.querySelector('a')).toBeNull();
  });

  test('affiche les tags technologiques des formations', async () => {
  document.body.innerHTML = '<education-other></education-other>';
  const el = document.querySelector('education-other');
  await flushPromises();

  expect(el.querySelector('.techno-tags .tech-chip')).not.toBeNull();
});

  // test('n\'affiche jamais le champ "type" (commenté dans le rendu)', async () => {
  //   document.body.innerHTML = '<education-other></education-other>';
  //   const el = document.querySelector('education-other');
  //   await flushPromises();

  //   expect(el.innerHTML).not.toContain('MOOC</p>');
  // });

  test('gère l\'absence du champ education sans planter', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) }));

    document.body.innerHTML = '<education-other></education-other>';
    const el = document.querySelector('education-other');
    await flushPromises();

    expect(el.querySelector('.section-block')).not.toBeNull();
    expect(el.querySelectorAll('.card').length).toBe(0);
  });

  test('affiche plusieurs formations avec certificats différents', async () => {
    const dataMulti = JSON.parse(JSON.stringify(mockCvData));
    dataMulti.education.autre.push({ nom: 'Formation DevOps', date: '2020', organisme: 'OpenClassrooms', certificate: 'https://example.com/cert2.pdf' });
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(dataMulti) }));

    document.body.innerHTML = '<education-other></education-other>';
    const el = document.querySelector('education-other');
    await flushPromises();

    expect(el.querySelectorAll('.cv-subsection').length).toBe(2);
    expect(el.querySelector('a[href="https://example.com/cert.pdf"]')).not.toBeNull();
    expect(el.querySelector('a[href="https://example.com/cert2.pdf"]')).not.toBeNull();
  });

});