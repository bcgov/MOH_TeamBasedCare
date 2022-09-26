const { parse } = require('json2csv');

interface CareActivityProps {
  name: string;
  'Respiratory Therapist': string;
  'Speech Language Pathologist': string;
  'Occupational Therapist': string;
  'Registered Nurse - Critical Care': string;
  'Registered Nurse - Medical/ Surgical': string;
  'Licensed Practical Nurse (LPN)': string;
  'Health Care Assistant (HCA)': string;
  'Other - Non Clinical': string;
  Physician: string;
  numberOfGaps?: string;
}
interface JsonDataProps extends CareActivityProps {
  careActivities: CareActivityProps[];
}

export const convertActivityGapTableToCSV = (data: any) => {
  try {
    const fields = data.headers.map((element: string | { label: string; value: string }) => {
      if (element === 'Activities Bundle') return { label: 'Activities Bundle', value: 'name' };
      return element;
    });

    const emptyRow: CareActivityProps = {
      name: '',
      'Respiratory Therapist': '',
      'Speech Language Pathologist': '',
      'Occupational Therapist': '',
      'Registered Nurse - Critical Care': '',
      'Registered Nurse - Medical/ Surgical': '',
      'Licensed Practical Nurse (LPN)': '',
      'Health Care Assistant (HCA)': '',
      'Other - Non Clinical': '',
      Physician: '',
      numberOfGaps: '',
    };
    const options = { fields };

    const resultData = data.data
      .map((element: JsonDataProps) => {
        const { careActivities, ...remainder } = element;
        return [{ ...emptyRow, name: remainder.name }, ...careActivities, emptyRow];
      })
      .flat();

    const csv = parse(resultData, options);
    return csv;
  } catch (err) {
    // console.log(err);
  }
};
