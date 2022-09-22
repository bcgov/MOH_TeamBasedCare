import { TagStyles } from '../../common/constants';

interface TagProps {
  text: string;
  tagStyle: TagStyles;
}

export const Tag = ({ text, tagStyle }: TagProps) => {
  return <div className={`${TagStyles.BASE} ${tagStyle}`}>{text}</div>;
};
