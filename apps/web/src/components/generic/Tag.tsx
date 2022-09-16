import { TagStyles } from '../../common/constants';

interface TagProps {
  text: string;
  tagStyle: TagStyles;
}

export const Tag = ({ text, tagStyle }: TagProps) => {
  // Initially were imported from Styles, but for some reason would break the application
  // Putting them here for now.
  const tag = 'flex justify-center items-center px-6 py-1 border rounded font-bold text-xs';
  const greenTag = `${tag} bg-bcBannerSuccessBg text-bcBannerSuccessText border-bcBannerSuccessText`;
  const blueTag = `${tag} bg-bcLightBlueBackground text-bcBlueLink border-bcBlueLink`;

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
  return <div className={`${tag} ${style}`}>{text}</div>;
};
