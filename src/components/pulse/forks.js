/* Shared demo-fork store for the whole /nf experience (creation flow +
   tracker). The tracker's black cp-mode bar and the /nf ForkBar both read
   and write here, so a fork flipped anywhere holds everywhere.
   Julia's plan (Aug 19): this registry grows one entry per fork until the
   prototype can play every configuration; richer logic lands per-fork as
   she specs it. */

const state = {
  type: 'product',   // 'product' | 'local' — collab type, switches the entire flow
  review: 'benable', // 'benable' | 'brand' — who reviews content
  declined: false,   // declined invites hidden|shown (Katie's admin switch)
  rui: 'modal',      // review UI direction: 'modal' | 'chat'
  fulfill: 'csv',    // product fulfillment: 'shopify' auto-orders | 'csv' the brand ships
};
try { Object.assign(state, JSON.parse(localStorage.getItem('nfForks') || '{}')); } catch { /* fresh */ }

const subs = new Set();

export const forks = {
  get: (k) => state[k],
  all: () => ({ ...state }),
  set(k, v) {
    if (state[k] === v) return;
    state[k] = v;
    try { localStorage.setItem('nfForks', JSON.stringify(state)); } catch { /* private mode */ }
    subs.forEach((f) => f(state));
  },
  sub(f) { subs.add(f); return () => subs.delete(f); },
};

export const FORK_DEFS = [
  { key: 'type', label: 'Collab type', hint: 'Product shipping vs local gift-card visit — forks the wizard, brief and tracker', options: [['product', 'Product'], ['local', 'Local']] },
  { key: 'review', label: 'Who reviews', hint: 'Content pre-check owner: Benable team vs the brand (Trilogy model)', options: [['benable', 'Benable'], ['brand', 'Brand']] },
  { key: 'fulfill', label: 'Fulfillment', hint: 'Product campaigns: Shopify places orders automatically vs the brand ships from a CSV order sheet (Day-10 machinery)', options: [['shopify', 'Shopify'], ['csv', 'CSV']] },
  { key: 'declined', label: 'Declined invites', hint: 'Katie’s per-brand admin switch — whether brands see declines', options: [[false, 'Hidden'], [true, 'Shown']] },
  { key: 'rui', label: 'Review UI', hint: 'Review direction: Amine’s modal vs the conversation', options: [['modal', 'Modal'], ['chat', 'Chat']] },
];
