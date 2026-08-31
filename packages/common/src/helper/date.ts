import dayjs, { ConfigType } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

export const formatDate = (value: ConfigType) => {
  if (!value) {
    return;
  }

  return dayjs(value).format('MMM DD, YYYY');
};

export const formatDateFromNow = (value: ConfigType) => {
  if (!value) return;

  dayjs.extend(relativeTime);
  return dayjs(value).fromNow();
};

export const formatDateTime = (value: ConfigType) => {
  if (!value) return;

  return dayjs(value).format('MMMM DD, YYYY h:mm A');
};

/** Compact variant, e.g. `Aug 28, 2026 5:39 PM`. */
export const formatShortDateTime = (value: ConfigType) => {
  if (!value) return;

  return dayjs(value).format('MMM DD, YYYY h:mm A');
};
