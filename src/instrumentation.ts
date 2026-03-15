/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts, before any other code.
 *
 * Fixes Node.js 22+ broken localStorage global.
 * Node ships a localStorage stub that exists but has no methods,
 * crashing any library (Firebase, etc.) that checks for localStorage.
 */
export async function register() {
  if (
    typeof globalThis.localStorage !== 'undefined' &&
    typeof globalThis.localStorage.getItem !== 'function'
  ) {
    // Remove the broken stub so libraries fall back to their
    // "no localStorage available" code paths
    delete (globalThis as any).localStorage;
  }
}
