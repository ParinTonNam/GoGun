import type { Request } from 'express'

/**
 * Reads a route param as a plain string.
 *
 * Express 5 (`@types/express` 5) types `req.params` values as
 * `string | string[]`, and for sub-routers mounted with `mergeParams: true` it
 * does not surface the parent router's params on the handler's inferred type at
 * all (they show up as `{}`). Both break direct `req.params.x` access under
 * `tsc`. These are all single-value path params, so this narrows to the string
 * we always get at runtime.
 */
export function param(req: Request, name: string): string {
  const value = (req.params as Record<string, string | string[] | undefined>)[name]
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}
