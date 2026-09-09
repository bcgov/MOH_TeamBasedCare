/**
 * Care setting template ids reach the API hooks straight from the router, so
 * they are user-controlled input that ends up in a request path. Only a plain
 * opaque id is allowed through: no slashes, dots, colons or escapes, so a
 * crafted value cannot climb out of its path segment or turn a relative
 * request into an absolute one aimed somewhere else.
 *
 * Callers test this directly rather than through a wrapper, so the check sits
 * on the same value that is about to be used.
 */
export const SAFE_TEMPLATE_ID = /^[A-Za-z0-9_-]{1,64}$/;

export const INVALID_TEMPLATE_ID_MESSAGE = 'This care setting could not be identified.';
