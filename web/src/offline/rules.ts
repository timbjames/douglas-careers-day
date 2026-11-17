/**
 * The same name and nickname rules as the API (api/Raffle/NameRules.cs and api/Game/GameEndpoints.cs),
 * so the offline edition accepts and rejects exactly the same things.
 */

const MAX_FIRST_NAME = 20
export const MAX_NICKNAME = 16
export const MAX_SCORE = 5000

const BLOCKED_ANYWHERE = ['fuck', 'shit', 'cunt', 'bitch', 'bastard', 'wank', 'twat', 'slut', 'whore', 'bollock', 'porn']
const BLOCKED_WORDS = new Set(['dick', 'cock', 'piss', 'arse', 'prick', 'slag', 'nob', 'tits', 'sex', 'poo', 'bum', 'willy'])

export function isClean(text: string) {
  const lower = text.toLowerCase()
  const squashed = [...lower].filter((c) => /\p{L}/u.test(c)).join('')
  if (BLOCKED_ANYWHERE.some((w) => squashed.includes(w))) return false
  return !lower.split(/[^\p{L}]+/u).some((w) => w && BLOCKED_WORDS.has(w))
}

/** Returns a tidy display name ("Sam T") or an error message for the pupil. */
export function normaliseName(firstName: string, lastInitial: string): { displayName?: string; error?: string } {
  const first = firstName.trim().replace(/\s+/g, ' ')
  if (!first) return { error: 'Please enter your first name.' }
  if (first.length > MAX_FIRST_NAME) return { error: `First name must be ${MAX_FIRST_NAME} letters or fewer.` }
  if (!/^\p{L}[\p{L}\p{M}' -]*$/u.test(first))
    return { error: 'First name can only contain letters, spaces, hyphens and apostrophes.' }

  const initial = lastInitial.trim().replace(/\.+$/, '')
  if (initial.length > 1 || (initial.length === 1 && !/\p{L}/u.test(initial)))
    return { error: 'Surname initial should be a single letter.' }

  if (!isClean(first)) return { error: "Let's keep it friendly! Please use your real first name." }

  // Capitalise the first letter of each part: "mary-jane" -> "Mary-Jane".
  const pretty = first.toLowerCase().replace(/(^|[ \-'])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase())
  return { displayName: initial ? `${pretty} ${initial.toUpperCase()}` : pretty }
}

export function nicknameError(raw: string): { nickname?: string; error?: string } {
  const nickname = raw.trim().replace(/\s+/g, ' ')
  if (!nickname) return { error: 'Pick a nickname for the leaderboard.' }
  if (nickname.length > MAX_NICKNAME) return { error: `Nicknames can be up to ${MAX_NICKNAME} characters.` }
  if (!/^[\p{L}\p{N}][\p{L}\p{N} _-]*$/u.test(nickname)) return { error: 'Nicknames can use letters, numbers, spaces, _ and -.' }
  if (!isClean(nickname)) return { error: "Let's keep it friendly! Please pick another nickname." }
  return { nickname }
}
