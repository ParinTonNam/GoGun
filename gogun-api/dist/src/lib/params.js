"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.param = param;
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
function param(req, name) {
    const value = req.params[name];
    return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}
