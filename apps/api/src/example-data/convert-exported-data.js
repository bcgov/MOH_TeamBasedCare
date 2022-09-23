const fs = require('fs');
const { parse } = require('json2csv');
const data = require('./form-export.example.json');

const main = () => {
  try {
    const f = data.headers;
    const fields = f.map(element => {
      if (element === 'Activities Bundle') return { label: 'Activities Bundle', value: 'name' };
      return element;
    });

    const emptyRow = {
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

    const opts = { fields };
    const resData = data.data
      .map(element => {
        const { careActivities, ...remainder } = element;
        const res = [remainder, ...careActivities, emptyRow];
        return [{ ...emptyRow, name: remainder.name }, ...careActivities, emptyRow];
      })
      .flat();

    let csv = parse(resData, opts);
    // console.log(csv);
    fs.writeFileSync('./src/example-data/converted-data.csv', csv);
  } catch (err) {
    console.log(err);
  }
};

main();
