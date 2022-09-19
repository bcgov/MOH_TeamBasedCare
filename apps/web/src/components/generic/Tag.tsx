import { TagStyles } from '../../common/constants';
import { blueTag, greenTag } from '../../styles/styles';

interface TagProps {
  text: string;
  tagStyle: TagStyles;
}

export const Tag = ({ text, tagStyle }: TagProps) => {
  const style = (() => {
    switch (tagStyle) {
      case TagStyles.BLUE:
        return blueTag;
      case TagStyles.GREEN:
        return greenTag;
      default:
        return blueTag;
    }
  })();
  return <div className={`${style}`}>{text}</div>;
};
