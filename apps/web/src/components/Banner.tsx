interface BannerProps {
  style: keyof typeof bannerColour;
  image?: string;
}

export const bannerColour: Record<string, string> = {
  warning: `bg-bcYellowBanner text-bcBrown`,
  success: `bg-bcGreenHiredText text-white`,
  muted: '',
};

export const Banner: React.FC<BannerProps> = props => {
  const { style, image, children } = props;

  const defaultStyle = `flex items-center h-14 mb-5 font-bold rounded`;

  return (
    <div className={`${defaultStyle} ${bannerColour[style]}`}>
      {image && <img src={image} alt='add' className='mx-3 h-5' />}
      {children}
    </div>
  );
};
