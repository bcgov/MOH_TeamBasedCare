interface ContentManagementIconProps {
  className?: string;
}

export const ContentManagementIcon: React.FC<ContentManagementIconProps> = ({ className }) => (
  <svg
    width='24'
    height='24'
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    className={className}
  >
    <mask
      id='mask0_content'
      style={{ maskType: 'alpha' }}
      maskUnits='userSpaceOnUse'
      x='0'
      y='0'
      width='24'
      height='24'
    >
      <rect width='24' height='24' fill='#D9D9D9' />
    </mask>
    <g mask='url(#mask0_content)'>
      <path
        d='M18 21V6H20C20.55 6 21.0208 6.19583 21.4125 6.5875C21.8042 6.97917 22 7.45 22 8V19C22 19.55 21.8042 20.0208 21.4125 20.4125C21.0208 20.8042 20.55 21 20 21H18ZM10 6H14V4H10V6ZM8 21V4C8 3.45 8.19583 2.97917 8.5875 2.5875C8.97917 2.19583 9.45 2 10 2H14C14.55 2 15.0208 2.19583 15.4125 2.5875C15.8042 2.97917 16 3.45 16 4V21H8ZM4 21C3.45 21 2.97917 20.8042 2.5875 20.4125C2.19583 20.0208 2 19.55 2 19V8C2 7.45 2.19583 6.97917 2.5875 6.5875C2.97917 6.19583 3.45 6 4 6H6V21H4Z'
        fill='currentColor'
      />
    </g>
  </svg>
);
