/**
 * Build flags. `npm run build:offline` sets VITE_OFFLINE=true (see .env.offline) to make the
 * single-file offline edition, which runs with no server: data is kept in this browser.
 */
export const OFFLINE = import.meta.env.VITE_OFFLINE === 'true'

/** Admin PIN for the offline edition (there's no server to check it). Set in .env.offline. */
export const OFFLINE_ADMIN_PIN: string = import.meta.env.VITE_OFFLINE_ADMIN_PIN || '1234'
