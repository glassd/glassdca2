/**
 * Site-level facts that both server and client code need. Kept out of
 * queries.server so route components can import them without pulling a
 * server-only module into the client bundle.
 */

/**
 * First professional role in technology — see the About timeline. The home
 * page derives both its "years" figure and its "since" strip from this, so
 * the two can't disagree with each other or with the timeline a click away.
 */
export const CAREER_START_YEAR = 2015;
