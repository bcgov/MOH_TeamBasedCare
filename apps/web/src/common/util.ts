import { ActivityTagVariants, TagStyles } from './constants';

export const isOdd = (n: number): boolean => {
  return n % 2 !== 0;
};

export const pickTagStyle = (tag: ActivityTagVariants): TagStyles => {
  switch (tag) {
    case ActivityTagVariants.ASPECT:
      return TagStyles.YELLOW;
    case ActivityTagVariants.CLINICAL:
      return TagStyles.BLUE;
    case ActivityTagVariants.RESTRICTED:
      return TagStyles.TEAL;
    case ActivityTagVariants.SUPPORT:
      return TagStyles.PURPLE;
    case ActivityTagVariants.TASK:
      return TagStyles.GREEN;
    default:
      return TagStyles.BASE;
  }
};
