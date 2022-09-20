import { OccupationTagStyles } from '../../common/constants';

interface TagProps {
  text: string;
  tagStyle: OccupationTagStyles;
}

export const Tag = ({ text, tagStyle }: TagProps) => {
  return <div className={`${OccupationTagStyles.BASE} ${tagStyle}`}>{text}</div>;
};
