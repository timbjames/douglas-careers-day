/**
 * Names, wording and logo files for the event. Colours and fonts live in the brand tokens
 * at the top of index.css.
 *
 * Logos live in src/assets/brand/ (see the README there). They're imported so the build can bundle
 * them, including into the single-file offline edition. If one is missing, its name shows as text.
 */
import crest from './assets/brand/douglas-academy-crest.png'
import lrqaLogo from './assets/brand/lrqa-logo.png'

export const brand = {
  company: {
    name: 'LRQA',
    logo: lrqaLogo,
  },
  school: {
    name: 'Douglas Academy',
    place: 'Milngavie',
    crest,
    motto: 'Neart Tre Eolas',
    mottoEnglish: 'Strength Through Knowledge',
  },
  /** Shown on the intro screen (/intro) to give pupils context on the career. */
  presenter: {
    role: 'Head of Development',
    field: 'Software / Computer Science',
  },
  event: {
    title: 'Careers Festival',
    tagline: 'Discover a career in technology with LRQA',
  },
} as const
