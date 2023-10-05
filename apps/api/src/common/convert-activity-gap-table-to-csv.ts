const { parse } = require('json2csv');

export const convertActivityGapTableToCSV = (data: any) => {
  const fields = data.headers.map((element: string | { label: string; value: string }) => {
    if (element === 'Activities Bundle') return { label: 'Activities Bundle', value: 'name' };
    return element;
  });

  const emptyRow = {
    ...data.headers.reduce((acc: any, curr: any) => ((acc[curr] = ''), acc), {}),
    name: '',
  };
  const options = { fields };

  const resultData = data.data
    .map((element: any) => {
      const { careActivities, ...remainder } = element;

      // add N to empty values [not in Permissions]
      careActivities?.forEach((activity: any) => {
        Object.keys(activity).map((key: string) => {
          if (activity[key] === '') activity[key] = 'N';
        });
      });

      return [{ ...emptyRow, name: remainder.name }, ...careActivities, emptyRow];
    })
    .flat();

  const csv = parse(resultData, options);
  return csv;
};
