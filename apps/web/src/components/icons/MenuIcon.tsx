interface MenuIconProps {
  className?: string;
}

export const MenuIcon: React.FC<MenuIconProps> = ({ className }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M4 8H28V10.6875H4V8ZM4 17.3125V14.6875H28V17.3125H4ZM4 24V21.3125H28V24H4Z"
      fill="currentColor"
    />
  </svg>
);
