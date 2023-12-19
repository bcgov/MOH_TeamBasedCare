import { TagVariants } from '../../common/constants';

interface TagProps {
  text: string;
  tagStyle: TagVariants;
  className?: string;
  onClick?: (text: string) => void;
}

export const Tag = ({ text, tagStyle, className, onClick }: TagProps) => {
  return (
    <div className={`${TagVariants.BASE} ${tagStyle} ${className}`} onClick={() => onClick?.(text)}>
      {text}
    </div>
  );
};
