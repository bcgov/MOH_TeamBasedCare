import { TagVariants } from '../../common/constants';

interface TagProps {
  text: string;
  tagStyle: TagVariants;
}

export const Tag = ({ text, tagStyle }: TagProps) => {
  return <div className={`${TagVariants.BASE} ${tagStyle}`}>{text}</div>;
};
