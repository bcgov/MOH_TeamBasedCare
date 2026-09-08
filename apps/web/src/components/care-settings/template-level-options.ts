/**
 * Template Level Radio Options
 *
 * The two selectable levels, used by the Edit Details dialog, which collects
 * the level both on the first save of a copy and on later edits.
 *
 * "Provincial" is absent by design: it belongs to master templates only and is
 * never something an administrator assigns.
 */
import { TemplateLevel } from '@tbcm/common';
import { RadioOptionType } from '../Radio';

export const TEMPLATE_LEVEL_LEGEND = 'Template Level';

export const TEMPLATE_LEVEL_OPTIONS: RadioOptionType[] = [
  {
    label: 'Health Authority Template',
    value: TemplateLevel.HEALTH_AUTHORITY,
    description:
      'Use when the template should be available across the Health Authority and serve as the basis for multiple site-specific templates.',
  },
  {
    label: 'Site / Care Setting Template',
    value: TemplateLevel.SITE,
    description:
      'Use when the template is intended for a specific hospital, unit, service area, or care setting.',
  },
];
