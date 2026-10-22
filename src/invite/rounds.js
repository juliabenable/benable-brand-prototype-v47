/* The demo campaign's first Invite Creators round: one source for the tracker
   (Day 3 card "We Found 75 creators", Day 4 table "75 invited") and the popup
   it opens (18 previously approved + 57 new, Amine's demo list in
   public/invite-creators/mock-api.js; names and faces copied from there). */
const B = import.meta.env.BASE_URL;
const face = (f) => `${B}invite-creators/assets/${f}.jpg`;

export const FIRST_ROUND = { prev: 18, fresh: 57 };
export const FIRST_ROUND_TOTAL = FIRST_ROUND.prev + FIRST_ROUND.fresh;

const PREV = ['Emma Wilson', 'Maya Brooks', 'Chloe Martin', 'Zoe Parker', 'Sofia Patel', 'Nora Bennett',
  'Olivia Chen', 'Isabel Rivera', 'Hazel Moore', 'Lucy Grant', 'Stella Price', 'Violet Hayes', 'Audrey Cole',
  'Piper Lane', 'Elena Ruiz', 'Margot Fields', 'Daisy Holt', 'June Carter'];
const PREV_FACES = ['avatar-1', 'approved-1', 'approved-2', 'approved-3', 'avatar-5', 'avatar-9', 'avatar-8',
  'avatar-2', 'avatar-3', 'avatar-4', 'avatar-6', 'jordan', 'avatar-7', 'avatar-0', 'new-1', 'new-2', 'new-3', 'new-0'];
const NEW = ['Jordan Blake', 'Eva Thompson', 'Lena Ortiz', 'Priya Shah', 'Mia Laurent', 'Hannah Kim', 'Camila Reyes',
  'Grace Okafor', 'Ella Novak', 'Ruby Castillo', 'Ivy Mitchell', 'Naomi Brooks', 'Sienna Hart', 'Layla Haddad',
  'Aria Bennett', 'Jade Moreno', 'Leah Fischer', 'Tessa Ward', 'Nina Alvarez', 'Clara Dubois', 'Maya Singh',
  'Willow Grant', 'Iris Nakamura', 'Freya Lund', 'Dahlia Cruz', 'Ruben Vega', 'Adaeze Okoye', 'Celine Fontaine',
  'Bianca Rossi', 'Talia Cohen', 'Noor Rahman', 'Paige Sullivan', 'Esme Walker', 'Gia Romano', 'Harper Quinn',
  'Kira Petrova', 'Lila Ahmed', 'Mila Kowalski', 'Nadia Farah', 'Opal Jensen', 'Quinn Harper', 'Rosa Delgado',
  'Sasha Ivanova', 'Thea Morgan', 'Uma Patel', 'Vera Lindqvist', 'Wren Callahan', 'Xena Park', 'Yara Haddad',
  'Zara Malik', 'Alba Serrano', 'Bea Lawson', 'Cora Whitfield', 'Dina Mansour', 'Elise Moreau', 'Fiona Byrne',
  'Gemma Lowe'];
const NEW_FACES = ['new-0', 'new-1', 'new-2', 'new-3', 'jordan', 'avatar-0', 'avatar-2', 'avatar-3', 'avatar-4',
  'avatar-5', 'avatar-6', 'avatar-7', 'avatar-8', 'avatar-9', 'approved-1', 'approved-2', 'approved-3', 'avatar-1'];

const all = [
  ...PREV.map((n, i) => ({ full: n, face: PREV_FACES[i % PREV_FACES.length] })),
  ...NEW.map((n, i) => ({ full: n, face: NEW_FACES[i % NEW_FACES.length] })),
];
const firstName = (full) => full.split(' ')[0];

/* Day 3 card: the first four faces of the popup's Previously approved bar, blurred */
export const FOUND_FACES = all.slice(0, 4).map((c) => face(c.face));

/* Day 4: the tracker follows its own six creators (Maya, Nia, Sofia, Jade, Priya,
   Lena); the popup list has six people with those first names, so they stand in
   for them and the other 69 are invited alongside: 75 in all. Full names, as in
   the popup, so nobody collides with the tracker's own creators (PHOTOS and
   TIMELINES are keyed by name; pulseData gives them Lena's Day 4 history). */
const STORY = ['Maya', 'Nia', 'Sofia', 'Jade', 'Priya', 'Lena'];
const others = all.filter((c) => !STORY.includes(firstName(c.full)));
export const MORE_INVITED = others.map((c) => ({
  name: c.full,
  handle: '@' + c.full.replace(' ', '_'),
  stage: 0,
  status: { type: 'facts', phrases: ['Invite sent this morning'] },
}));
export const MORE_PHOTOS = Object.fromEntries(others.map((c) => [c.full, face(c.face)]));
