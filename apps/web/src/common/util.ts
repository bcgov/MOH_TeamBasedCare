import { ActivityTagVariants, TagVariants } from './constants';

export const isOdd = (n: number): boolean => {
  return n % 2 !== 0;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export const isObjectEmpty = (obj: any): boolean => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};

export const pickTagStyle = (tag: ActivityTagVariants): TagVariants => {
  switch (tag) {
    case ActivityTagVariants.ASPECT:
      return TagVariants.YELLOW;
    case ActivityTagVariants.CLINICAL:
      return TagVariants.BLUE;
    case ActivityTagVariants.RESTRICTED:
      return TagVariants.TEAL;
    case ActivityTagVariants.SUPPORT:
      return TagVariants.PURPLE;
    case ActivityTagVariants.TASK:
      return TagVariants.GREEN;
    default:
      return TagVariants.BASE;
  }
};
