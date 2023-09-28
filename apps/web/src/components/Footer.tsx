import Link from 'next/link';

const FooterLink: React.FC<{ href: string }> = ({ href, children }) => {
  return (
    <Link href={href}>
      <a rel='noopener noreferrer' target='_blank' className='mb-1 md:mb-0'>
        {children}
      </a>
    </Link>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className='w-full bg-bcBluePrimary border-t-2 border-bcYellowPrimary md:px-12'>
      <div className='bar-separator mx-2 md:mx-0 flex-col flex md:flex-row md:items-center md:align-center text-white py-2'>
        <FooterLink href='https://www2.gov.bc.ca/gov/content/about-gov-bc-ca'>
          About gov.bc.ca
        </FooterLink>
        <FooterLink href='https://www2.gov.bc.ca/gov/content/home/disclaimer'>
          Disclaimer
        </FooterLink>
        <FooterLink href='https://www2.gov.bc.ca/gov/content/home/privacy'>Privacy</FooterLink>
        <FooterLink href='https://www2.gov.bc.ca/gov/content/home/accessible-government'>
          Accessibility
        </FooterLink>
        <FooterLink href='https://www2.gov.bc.ca/gov/content/home/copyright'>Copyright</FooterLink>
        <FooterLink href='https://www2.gov.bc.ca/gov/content/home/get-help-with-government-services'>
          Contact Us
        </FooterLink>
      </div>
    </footer>
  );
};
