// Fake backend for the prototype. Everything lives in memory and resets on reload.

const mockApi = (() => {
  // ---------- Previously approved: 18 creators the brand has worked with or approved before ----------
  const approvedNames = ['Emma Wilson', 'Maya Brooks', 'Chloe Martin', 'Zoe Parker', 'Sofia Patel', 'Nora Bennett',
    'Olivia Chen', 'Isabel Rivera', 'Hazel Moore', 'Lucy Grant', 'Stella Price', 'Violet Hayes', 'Audrey Cole',
    'Piper Lane', 'Elena Ruiz', 'Margot Fields', 'Daisy Holt', 'June Carter'];
  // Placeholder faces; the first four match the collapsed bar's avatar stack
  const approvedFaces = ['avatar-1', 'approved-1', 'approved-2', 'approved-3', 'avatar-5', 'avatar-9', 'avatar-8',
    'avatar-2', 'avatar-3', 'avatar-4', 'avatar-6', 'jordan', 'avatar-7', 'avatar-0', 'new-1', 'new-2', 'new-3', 'new-0'];
  // What happened last time, shown next to the "Previously approved" tag
  const history = i => i % 6 === 5
    ? 'You approved them last time, but the campaign filled before their turn.'
    : `You've done ${1 + (i % 3)} campaign${i % 3 ? 's' : ''} together and loved working with them.`;

  // ---------- New creators: 57 hand-selected profiles ----------
  const newNames = ['Jordan Blake', 'Eva Thompson', 'Lena Ortiz', 'Priya Shah', 'Mia Laurent', 'Hannah Kim', 'Camila Reyes',
    'Grace Okafor', 'Ella Novak', 'Ruby Castillo', 'Ivy Mitchell', 'Naomi Brooks', 'Sienna Hart', 'Layla Haddad',
    'Aria Bennett', 'Jade Moreno', 'Leah Fischer', 'Tessa Ward', 'Nina Alvarez', 'Clara Dubois', 'Maya Singh',
    'Willow Grant', 'Iris Nakamura', 'Freya Lund', 'Dahlia Cruz', 'Ruben Vega', 'Amara Okoye', 'Celine Fontaine',
    'Bianca Rossi', 'Talia Cohen', 'Noor Rahman', 'Paige Sullivan', 'Esme Walker', 'Gia Romano', 'Harper Quinn',
    'Kira Petrova', 'Lila Ahmed', 'Mila Kowalski', 'Nadia Farah', 'Opal Jensen', 'Quinn Harper', 'Rosa Delgado',
    'Sasha Ivanova', 'Thea Morgan', 'Uma Patel', 'Vera Lindqvist', 'Wren Callahan', 'Xena Park', 'Yara Haddad',
    'Zara Malik', 'Alba Serrano', 'Bea Lawson', 'Cora Whitfield', 'Dina Mansour', 'Elise Moreau', 'Fiona Byrne',
    'Gemma Lowe'];
  // Placeholder faces until real ones are added; the first four match the collapsed bar's avatar stack
  const faces = ['new-0', 'new-1', 'new-2', 'new-3', 'jordan', 'avatar-0', 'avatar-2', 'avatar-3', 'avatar-4',
    'avatar-5', 'avatar-6', 'avatar-7', 'avatar-8', 'avatar-9', 'approved-1', 'approved-2', 'approved-3', 'avatar-1'];
  const bios = [
    '📍seattle 📖 journaling | self study | lifestyle design ✨ hope core for your 20s',
    '📍austin ☕ slow mornings | skincare that actually works | honest reviews only',
    '📍brooklyn 🍳 easy weeknight meals | pantry hacks | cozy cooking for one or two',
    '📍toronto 🧘 wellness on a budget | pilates girlie | gut health and good habits',
    '📍los angeles 💄 clean beauty | GRWM | everyday makeup for busy mornings',
    '📍chicago 🏃 run club | high protein snacks | busy-girl routines that stick',
    '📍miami 🌴 beach days | sunscreen nerd | travel light and eat well everywhere',
    '📍denver 🏔️ trail runs | camp cooking | outdoorsy girl with a soft life',
  ];
  const fits = [
    'Tech-forward creator with a polished, lifestyle-friendly personal brand.',
    'Creator-native voice suits routine, demo, and first-impression content.',
    'Engagement is 2× the category median for this follower band.',
    'Audience skews 25–35 and over-indexes on wellness purchases.',
    'Posts consistent morning-routine content where the product fits naturally.',
    'Strong save rate on recipe and how-to videos.',
  ];
  const places = ['USA', 'USA', 'Canada', 'USA', 'UK', 'USA'];
  const ages = ['25-35', '18-24', '25-35', '35-44'];
  const content = ['content-0', 'content-1', 'content-2', 'content-3', 'content-4', 'content-5', 'content-6'];

  const profile = (name, i, source, avatar) => ({
    id: (source === 'new' ? 'nc' : 'ap') + i,
    source,
    name,
    handle: '@' + name.replace(' ', '_'),
    avatar,
    bio: bios[i % bios.length],
    fits: [0, 1, 2].map(k => fits[(i + k) % fits.length]),
    followers: (8 + (i * 37) % 90 + ((i * 7) % 10) / 10).toFixed(1) + 'K',
    engagement: (3 + (i * 13) % 12 + ((i * 3) % 10) / 10).toFixed(1) + '%',
    location: places[i % places.length],
    age: ages[i % ages.length],
    gender: 'Female',
    content: content.map((_, k) => content[(k + i) % content.length]),
    priority: false,
    notFit: false,
  });

  const newCreators = newNames.map((name, i) => profile(name, i, 'new', faces[i % faces.length]));
  const approvedCreators = approvedNames.map((name, i) => ({
    ...profile(name, i + 3, 'approved', approvedFaces[i % approvedFaces.length]),
    id: 'ap' + i,
    history: history(i),
  }));

  const groups = [
    {
      id: 'approved',
      title: 'Previously approved creators',
      sub: "Creators you've worked with before or approved for past campaigns.",
      creators: approvedCreators,
    },
    {
      id: 'new',
      title: 'New creators',
      sub: 'Hand-selected from your brief and campaign details.',
      creators: newCreators,
    },
  ];

  // Demo shortcut: ?notfit=26 starts with that many new creators marked Not a Fit (e.g. to see the below-50 warning)
  const preset = parseInt(new URLSearchParams(location.search).get('notfit'), 10);
  if (preset > 0) newCreators.slice(0, preset).forEach(c => { c.notFit = true; });

  const find = id => groups.flatMap(g => g.creators).find(c => c.id === id);
  const clone = g => ({ ...g, creators: g.creators.map(c => ({ ...c })) });
  // Sends the invites. Resolves like a network call; ?sendfail=1 makes it fail, to try the error state.
  const sendInvites = ids => new Promise((resolve, reject) => setTimeout(() => {
    if (new URLSearchParams(location.search).get('sendfail')) reject(new Error('send failed'));
    else { console.log('[mock api] send invites', ids); resolve({ sent: ids.length }); }
  }, 700));

  // Why a creator isn't a fit; feeds the recommendations
  const notFitFeedback = (id, text) => { find(id).feedback = text; console.log('[mock api] not a fit feedback', id, text); return Promise.resolve(); };

  return {
    sendInvites,
    notFitFeedback,
    groups: () => groups.map(clone),
    get: id => ({ ...find(id) }),
    // Creators still headed for approval: everyone minus the ones marked Not a Fit
    approvedCount: () => groups.reduce((n, g) => n + g.creators.filter(c => !c.notFit).length, 0),
    setPriority: (id, on) => { find(id).priority = on; },
    setNotFit: (id, on) => { const c = find(id); c.notFit = on; if (on) c.priority = false; },
  };
})();
