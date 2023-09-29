import { Footer } from 'src/components/Footer';
import { HeaderLanding } from 'src/components/HeaderLanding';

const LandingLayout = ({ children }: any) => {
  return (
    <div className='h-screen flex flex-col'>
      <HeaderLanding />

      <main className='w-full flex-auto flex justify-center'>{children}</main>

      <Footer />
    </div>
  );
};

export default LandingLayout;
