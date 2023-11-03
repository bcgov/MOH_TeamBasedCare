import { TagVariants } from '../../common/constants';

interface TagProps {
  text: string;
  tagStyle: TagVariants;
  className?: string;
}

export const Tag = ({ text, tagStyle, className }: TagProps) => {
  return <div className={`${TagVariants.BASE} ${tagStyle} ${className}`}>{text}</div>;
};
