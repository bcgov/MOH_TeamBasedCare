import { ActivityTagVariants, TagVariants } from './constants';

export const isOdd = (n: number): boolean => {
  return n % 2 !== 0;
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
