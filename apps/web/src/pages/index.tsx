import type { NextPage } from 'next';
import Button  from '../components/Button';
import 'reflect-metadata';


const Home: NextPage = () => {
  return <>

    <Button 
      variant="primary" 
      onClick={()=>{}}
      disabled
      >
      primary disabled
    </Button>
    <br/>
    <Button 
      variant="primary" 
      onClick={()=>{}}
      >
      default primary
    </Button>
    <br/>
    <Button 
      variant="secondary" 
      onClick={()=>{}}
      >
      secondary
    </Button>

    <br/>
    <Button 
      variant="secondary" 
      onClick={()=>{}}
      disabled
      >
      secondary disabled
    </Button>

    <h1 className="text-3xl font-bold underline">
      Hello world!
</h1>

  </>;
};

export default Home;
