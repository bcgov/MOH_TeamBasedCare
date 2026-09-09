/**
 * Shared handling for the 409 a save returns when the template changed
 * underneath the editor.
 *
 * Kept out of the hooks so both save paths - the wizard save and the details
 * save - recognise a conflict the same way.
 */

export interface TemplateVersionConflict {
  /** Resend this as `expectedVersion` to override. */
  currentVersion: number;
  updatedBy?: string;
  updatedAt?: string;
}

/**
 * Returns the conflict details when the error is a version conflict, or null
 * for anything else. A plain 409 without a version payload is not treated as a
 * conflict, so unrelated 409s keep their existing handling.
 */
export const parseVersionConflict = (err: any): TemplateVersionConflict | null => {
  if (err?.response?.status !== 409) return null;

  // The API wraps handled errors as `{ errorType, errorMessage, errorDetails }`,
  // so the payload arrives under `errorDetails`. The unwrapped shape is still
  // accepted for any caller that surfaces the raw exception body.
  const body = err.response.data;
  const details = body?.errorDetails ?? body;
  if (details?.currentVersion === undefined || details?.currentVersion === null) return null;

  return {
    currentVersion: details.currentVersion,
    updatedBy: details.updatedBy,
    updatedAt: details.updatedAt,
  };
};

/** Human-readable "who and when", used in the conflict dialog. */
export const describeConflictAuthor = (conflict: TemplateVersionConflict): string => {
  const who = conflict.updatedBy ?? 'Another user';
  if (!conflict.updatedAt) return `${who} saved changes to this template.`;

  const when = new Date(conflict.updatedAt);
  if (isNaN(when.getTime())) return `${who} saved changes to this template.`;

  return `${who} saved changes to this template on ${when.toLocaleString()}.`;
};
