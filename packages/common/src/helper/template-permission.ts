/**
 * Separator used to compose an activity-occupation permission key.
 * UUID identifiers cannot contain this sequence.
 */
const TEMPLATE_PERMISSION_KEY_SEPARATOR = '::';

/**
 * Builds the stable key used to identify one template permission cell.
 *
 * @param activityId - Care activity identifier.
 * @param occupationId - Occupation identifier.
 * @returns The activity-occupation permission key.
 */
export const getTemplatePermissionKey = (activityId: string, occupationId: string): string =>
  `${activityId}${TEMPLATE_PERMISSION_KEY_SEPARATOR}${occupationId}`;

/**
 * Splits a template permission key into its source activity and occupation IDs.
 *
 * @param key - Key returned by {@link getTemplatePermissionKey}.
 * @returns The activity and occupation identifiers represented by the key.
 */
export const splitTemplatePermissionKey = (key: string): [string, string] =>
  key.split(TEMPLATE_PERMISSION_KEY_SEPARATOR) as [string, string];

/**
 * Canonicalizes optional LC restriction text for comparison and persistence.
 *
 * @param description - Restriction text supplied by a caller.
 * @returns The trimmed description, or `null` when it is blank or absent.
 */
export const normalizeRestrictionDescription = (description?: string | null): string | null =>
  description?.trim() || null;
