// Fake backend for the prototype. Choices save as the brand goes: sessionStorage stands in for the
// server, so closing the popup or reloading the page keeps them (a new tab starts fresh).
//
// URL options, all optional (the v47 tracker passes spots and mode):
//   ?spots=25          the campaign's spots (default 25; a rematch defaults to 1)
//   ?mode=rematch      a second round to refill open spots: new creators only (default 4)
//   ?prev=18&new=57    how many previously approved / new creators we selected (try 0, 1, 2)
//   ?notfit=26         start with that many new creators marked Not a Fit
//   ?sparse=1          the first new creator has gaps in their profile (no bio, fits, stats, content)
//   ?sendfail=1        Send fails, to see the error
//   ?fresh=1           forget saved choices

const mockApi = (() => {
  const q = new URLSearchParams(location.search);
  const num = (k, d) => { const v = parseInt(q.get(k), 10); return Number.isFinite(v) && v >= 0 ? v : d; };
  const mode = q.get('mode') === 'rematch' ? 'rematch' : 'first';
  const campaign = { mode, spots: Math.max(1, num('spots', mode === 'rematch' ? 1 : 25)) };

  // ---------- Previously approved: creators the brand has worked with or approved before ----------
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

  // ---------- New creators: hand-selected profiles ----------
  const newNames = ['Jordan Blake', 'Eva Thompson', 'Lena Ortiz', 'Priya Shah', 'Mia Laurent', 'Hannah Kim', 'Camila Reyes',
    'Grace Okafor', 'Ella Novak', 'Ruby Castillo', 'Ivy Mitchell', 'Naomi Brooks', 'Sienna Hart', 'Layla Haddad',
    'Aria Bennett', 'Jade Moreno', 'Leah Fischer', 'Tessa Ward', 'Nina Alvarez', 'Clara Dubois', 'Maya Singh',
    'Willow Grant', 'Iris Nakamura', 'Freya Lund', 'Dahlia Cruz', 'Ruben Vega', 'Adaeze Okoye', 'Celine Fontaine',
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
    feedback: false,
  });

  // A rematch shows new creators who weren't in the first round, and nobody from past campaigns.
  // Amara is the creator who takes the open spot in the v47 tracker (Day 13 on).
  const rematchPeople = [
    { name: 'Amara Gold', handle: '@amara.gold', avatar: 'amara' },
    { name: 'Simone Clarke', avatar: 'avatar-6' },
    { name: 'Keira Dunn', avatar: 'new-2' },
    { name: 'Ava Morales', avatar: 'approved-3' },
  ];
  const pool = mode === 'rematch' ? rematchPeople : newNames.map((name, i) => ({ name, avatar: faces[i % faces.length] }));
  const prevN = Math.min(num('prev', mode === 'rematch' ? 0 : approvedNames.length), approvedNames.length);
  const newN = Math.min(num('new', pool.length), pool.length);
  const newCreators = pool.slice(0, newN).map((p, k) => {
    const c = profile(p.name, mode === 'rematch' ? 30 + k : k, 'new', p.avatar);
    return p.handle ? { ...c, handle: p.handle } : c;
  });
  const approvedCreators = approvedNames.slice(0, prevN).map((name, i) => ({
    ...profile(name, i + 3, 'approved', approvedFaces[i % approvedFaces.length]),
    id: 'ap' + i,
    history: history(i),
  }));
  if (q.get('sparse') && newCreators[0]) Object.assign(newCreators[0], { bio: '', fits: [], followers: '', engagement: '', content: [] });

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
  const all = () => groups.flatMap(g => g.creators);
  const find = id => all().find(c => c.id === id);

  // ---------- Save as you go ----------
  const KEY = `invite-creators:${mode}:${campaign.spots}:${prevN}:${newN}`;
  let sent = 0;
  const save = () => {
    const choices = {};
    all().forEach(c => { if (c.priority || c.notFit || c.feedback) choices[c.id] = [+c.priority, +c.notFit, +c.feedback]; });
    try { sessionStorage.setItem(KEY, JSON.stringify({ choices, sent })); } catch {}
  };
  let saved = null;
  try {
    if (q.get('fresh')) sessionStorage.removeItem(KEY);
    saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
  } catch {}
  if (saved) {
    sent = saved.sent || 0;
    Object.entries(saved.choices || {}).forEach(([id, [p, n, f]]) => {
      const c = find(id);
      if (c) Object.assign(c, { priority: !!p, notFit: !!n, feedback: !!f });
    });
  } else {
    // Demo shortcut: ?notfit=26 starts with that many new creators marked Not a Fit
    newCreators.slice(0, num('notfit', 0)).forEach(c => { c.notFit = true; });
  }

  const clone = g => ({ ...g, creators: g.creators.map(c => ({ ...c })) });
  // Sends the invites. Resolves like a network call; ?sendfail=1 makes it fail, to try the error state.
  const sendInvites = ids => new Promise((resolve, reject) => setTimeout(() => {
    if (q.get('sendfail')) return reject(new Error('send failed'));
    console.log('[mock api] send invites', ids);
    sent = ids.length;
    save();
    resolve({ sent: ids.length });
  }, 700));

  // Why a creator isn't a fit; feeds the recommendations. Benable only: creators never see it.
  const notFitFeedback = (id, text) => {
    console.log('[mock api] not a fit feedback', id, text);
    find(id).feedback = true;
    save();
    return Promise.resolve();
  };

  return {
    campaign,
    sendInvites,
    notFitFeedback,
    sent: () => sent,
    groups: () => groups.map(clone),
    get: id => ({ ...find(id) }),
    // Creators still headed for approval: everyone minus the ones marked Not a Fit
    approvedCount: () => all().filter(c => !c.notFit).length,
    prioritizedCount: () => all().filter(c => c.priority && !c.notFit).length,
    setPriority: (id, on) => { find(id).priority = on; save(); },
    setNotFit: (id, on) => { const c = find(id); c.notFit = on; if (on) c.priority = false; save(); },
  };
})();
