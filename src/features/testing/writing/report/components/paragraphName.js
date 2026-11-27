const KEYS = {
  intro: 'mapIntro',
  body: 'mapBody',
  conclusion: 'mapConclusion',
  paragraph: 'mapParagraph',
};

/** "Introduction", "Body 2"… for one essay-map entry. */
export const paragraphName = (t, entry) =>
  t(KEYS[entry?.role] || 'mapParagraph', { n: entry?.number });
