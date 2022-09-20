import { OccupationTagStyles } from '../../common/constants';
// import { blueTag, greenTag } from '../../styles/styles';

interface TagProps {
  text: string;
  tagStyle: OccupationTagStyles;
}

export const Tag = ({ text, tagStyle }: TagProps) => {
  // Have to declare them here because importing from Styles.ts doesn't work I don't know why.
  const baseTagStyle =
    'flex justify-center items-center px-6 py-1 border rounded font-bold text-xs';
  const greenTagStyle = `${baseTagStyle} bg-bcBannerSuccessBg text-bcBannerSuccessText border-bcBannerSuccessText`;
  const blueTagStyles = `${baseTagStyle} bg-bcLightBlueBackground text-bcBlueLink border-bcBlueLink`;

  const style = (() => {
    switch (tagStyle) {
      case OccupationTagStyles.BLUE:
        return blueTagStyles;
      case OccupationTagStyles.GREEN:
        return greenTagStyle;
      default:
        return blueTagStyles;
    }
  })();
  return <div className={`${style}`}>{text}</div>;
};
