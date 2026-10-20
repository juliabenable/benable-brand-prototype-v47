// Fake backend for the prototype. Everything lives in memory and resets on reload.
// Calls resolve after a short delay so they behave like network requests,
// but the data is updated immediately so the UI never waits on them.

const mockApi = (() => {
  const LATENCY = 150;
  const TARGET = 25;       // "aim for 25+"
  const ACCEPT_RATE = 0.4; // banner: roughly 40% of invited creators accept

  // ---------- Creators the brand already knows (pre-added: "We added for you") ----------
  const known = [
    { id: 'emma',   name: 'Emma Wilson',   avatar: 'avatar-1', sub: '3 campaigns',                     tag: 'fav',    shortlisted: true, priority: true },
    { id: 'maya',   name: 'Maya Brooks',   avatar: 'avatar-5', sub: '2 campaigns',                     tag: 'fav',    shortlisted: true, priority: true },
    { id: 'chloe',  name: 'Chloe Martin',  avatar: 'avatar-9', sub: '2 campaigns',                     tag: 'fav',    shortlisted: true, priority: true },
    { id: 'zoe',    name: 'Zoe Parker',    avatar: 'avatar-8', sub: '1 campaigns',                     tag: 'fav',    shortlisted: true, priority: true },
    { id: 'sofia',  name: 'Sofia Patel',   avatar: 'avatar-2', sub: '2 campaigns',                     tag: 'again',  shortlisted: true, priority: true },
    { id: 'nora',   name: 'Nora Bennett',  avatar: 'avatar-3', sub: '2 campaigns',                     tag: 'again',  shortlisted: true, priority: true },
    { id: 'olivia', name: 'Olivia Chen',   avatar: 'avatar-4', sub: 'Campaign filled before her turn', tag: 'missed', shortlisted: true, priority: true },
    { id: 'isabel', name: 'Isabel Rivera', avatar: 'avatar-6', sub: 'Campaign filled before her turn', tag: 'missed', shortlisted: true, priority: true },
  ].map(c => ({ ...c, source: 'known', handle: c.name.replace(' ', '_') }));

  // ---------- Step 2: new suggestions ----------
  const names = ['Jordan Blake', 'Ava Thompson', 'Lena Ortiz', 'Priya Shah', 'Mia Laurent', 'Hannah Kim', 'Camila Reyes',
    'Grace Okafor', 'Ella Novak', 'Ruby Castillo', 'Ivy Mitchell', 'Naomi Brooks', 'Sienna Hart', 'Layla Haddad',
    'Aria Bennett', 'Jade Moreno', 'Leah Fischer', 'Tessa Ward', 'Nina Alvarez', 'Clara Dubois', 'Maya Singh',
    'Willow Grant', 'Iris Nakamura', 'Freya Lund', 'Dahlia Cruz'];
  const faces = ['jordan', 'avatar-0', 'avatar-7', 'content-1', 'content-2', 'content-3', 'content-4', 'content-5', 'content-6', 'content-0'];
  const bios = [
    '📍seattle 📖 journaling | self study | lifestyle design ✨ hope core for your 20s',
    '📍austin ☕ slow mornings | skincare that works | honest reviews',
    '📍brooklyn 🍳 easy weeknight meals | pantry hacks | cozy cooking',
    '📍toronto 🧘 wellness on a budget | pilates | gut health',
    '📍los angeles 💄 clean beauty | GRWM | everyday makeup',
    '📍chicago 🏃 run club | high protein snacks | busy-girl routines',
  ];
  const fits = [
    'Tech-forward creator with a polished, lifestyle-friendly personal brand.',
    'Creator-native voice suits routine, demo, and first-impression content.',
    'Engagement is 2× the category median for this follower band.',
    'Audience skews 25–35 and over-indexes on wellness purchases.',
    'Posts food and recipe content 3× a week with strong save rates.',
    'Past brand posts read as authentic, not ad-like.',
  ];
  const content = ['content-1', 'content-0', 'content-2', 'content-3', 'content-4', 'content-5', 'content-6'];
  const ages = ['25-35', '18-24', '25-34', '30-40'];
  const locations = ['USA', 'USA', 'Canada', 'USA', 'UK'];

  // Profile details shown on the step-2 card and the step-1 hover card.
  // Index 0 is Jordan Blake, exactly as in Figma; the rest are generated.
  const profile = i => {
    const jordan = i === 0;
    return {
      bio: bios[i % bios.length],
      fit: jordan ? fits.slice(0, 3) : [fits[i % 6], fits[(i + 2) % 6], fits[(i + 4) % 6]],
      followers: jordan ? '30.6K' : (8 + (i * 7.3) % 90).toFixed(1) + 'K',
      engagement: jordan ? '13.4%' : (3 + (i * 1.7) % 11).toFixed(1) + '%',
      location: jordan ? 'USA' : locations[i % locations.length],
      age: jordan ? '25-35' : ages[i % ages.length],
      gender: 'Female',
      content: content.map((_, k) => content[(k + i) % content.length]),
    };
  };

  const suggestions = names.map((name, i) => ({
    id: 'sg' + i, source: 'suggested', name,
    handle: name.replace(' ', '_'),
    avatar: faces[i % faces.length],
    ...profile(i),
    shortlisted: false, priority: false, dismissed: false,
  }));

  known.forEach((c, k) => Object.assign(c, profile(k + 1)));

  const all = [...known, ...suggestions];
  const byId = id => all.find(c => c.id === id);
  const listeners = new Set();
  let order = 0; // when someone last joined their right-panel group (newest shows first)
  all.forEach((c, i) => { if (c.shortlisted) c.addedAt = -1 - i; });   // seed keeps its listed order; anything added later goes above it

  const clone = c => ({ ...c });
  const reply = (data, label) => new Promise(resolve => setTimeout(() => {
    console.log(`[mock api] ${label}`, data);
    resolve(data);
  }, LATENCY));
  const changed = () => listeners.forEach(fn => fn());

  // Shortlisting is the one rule everything goes through:
  //  - adding someone puts them on the right in Priority or Everyone else, by their priority flag
  //  - removing someone also clears their priority (they are no longer being invited)
  //  - turning priority on for someone not shortlisted shortlists them first
  function setShortlisted(id, on) {
    const c = byId(id);
    c.shortlisted = on;
    if (on) c.addedAt = order++;
    else c.priority = false;
    changed();
    return reply(clone(c), `${on ? 'shortlist' : 'unshortlist'} ${c.name}`);
  }

  function setPriority(id, on) {
    const c = byId(id);
    if (on && !c.shortlisted) c.shortlisted = true;
    if (c.shortlisted) c.addedAt = order++;   // moving between Priority and normal puts them on top
    c.priority = on;
    changed();
    return reply(clone(c), `priority ${on ? 'on' : 'off'} ${c.name}`);
  }

  function dismiss(id) {
    const c = byId(id);
    c.dismissed = true; c.shortlisted = false; c.priority = false;
    changed();
    return reply(clone(c), `not a fit ${c.name}`);
  }

  return {
    TARGET, ACCEPT_RATE,
    known: () => known.map(clone),
    suggestions: () => suggestions.map(clone),
    get: id => clone(byId(id)),
    shortlist: () => all.filter(c => c.shortlisted).sort((a, b) => b.addedAt - a.addedAt).map(clone),   // newest first
    setShortlisted, setPriority, dismiss,
    onChange: fn => listeners.add(fn),
  };
})();
