/**
 * Names, wording and logo files for the event. Colours and fonts live in the brand tokens
 * at the top of index.css.
 *
 * Logos: put the official files in web/public/brand/ with these names (see the README there).
 * Until they're added, a plain-text version of each name is shown in its place.
 */
export const brand = {
  company: {
    name: 'LRQA',
    logo: '/brand/lrqa-logo.png',
  },
  school: {
    name: 'Douglas Academy',
    place: 'Milngavie',
    crest: '/brand/douglas-academy-crest.png',
    motto: 'Neart Tre Eolas',
    mottoEnglish: 'Strength Through Knowledge',
  },
  event: {
    title: 'Careers Festival',
    tagline: 'Discover a career in technology with LRQA',
  },
} as const
