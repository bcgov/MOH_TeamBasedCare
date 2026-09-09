/**
 * Care setting template levels.
 *
 * A template sits at one of three levels. Only two of them are stored: a master
 * template is identified by `isMaster` and carries a `null` level, so
 * "provincial" exists as a display label and a filter option but never as a
 * persisted value.
 */
export enum TemplateLevel {
  HEALTH_AUTHORITY = 'health authority',
  SITE = 'site',
}

/** Request-side filter. Adds the two values that are never stored. */
export enum TemplateLevelFilter {
  ALL = 'all',
  PROVINCIAL = 'provincial',
  HEALTH_AUTHORITY = 'health authority',
  SITE = 'site',
}

export const PROVINCIAL_LEVEL_LABEL = 'Provincial';
export const HEALTH_AUTHORITY_LEVEL_LABEL = 'Health Authority';
export const SITE_LEVEL_LABEL = 'Site / Care Settings';

/**
 * Single source of truth for the level shown to an administrator, so the table,
 * the filter, the details card, and both level dialogs cannot drift apart.
 */
export const getTemplateLevelLabel = (isMaster: boolean, level?: TemplateLevel | null): string => {
  if (isMaster) return PROVINCIAL_LEVEL_LABEL;

  switch (level) {
    case TemplateLevel.HEALTH_AUTHORITY:
      return HEALTH_AUTHORITY_LEVEL_LABEL;
    case TemplateLevel.SITE:
      return SITE_LEVEL_LABEL;
    default:
      return '';
  }
};
