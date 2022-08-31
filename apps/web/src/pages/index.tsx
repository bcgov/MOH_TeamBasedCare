import type { NextPage } from 'next';
import { Button }  from '../components/Button';
import 'reflect-metadata';


const Home: NextPage = () => {
  return <>
      <Button 
        onClick={()=> alert('Button 1 is clicked !')}
        variant="secondary"
        >
        secondary
      </Button>
      <br/> <br/>
      <Button 
        onClick={()=> alert('Button 1 is clicked !')}
        variant="primary"
        >
        primary
      </Button>
      <br/> <br/>
      <Button 
        onClick={()=> alert('Button 1 is clicked !')}
        variant="outline"
        >
        outline
      </Button>
      <br/> <br/>
  </>;
};

export default Home;
