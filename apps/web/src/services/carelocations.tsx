import axios from 'axios';

export const getCareLocations = async () => {
  return (await axios.get('/carelocations')).data;
};
