import { OccupationItem } from './OccupationItem';
import { isOdd } from 'src/common/util';
import { useFormikContext } from 'formik';

export const OccupationSelector = (props: any) => {
  const { values, setFieldValue } = useFormikContext<any>();
  const { occupations } = props;

  return (
    <>
      <div className='flex items-center p-4'>
        <input
          type='checkbox'
          name='selectAll'
          id='selectAll'
          className='mr-3 h-5 w-5 min-w-5 accent-bcBlueLink'
          onChange={(e: any) => {
            if (e.target.checked) {
              setFieldValue(
                'occupation',
                occupations.occupations.map((e: any) => e.id),
              );
            } else {
              setFieldValue('occupation', []);
            }
          }}
          checked={values.occupation.length === occupations.occupations.length}
        />
        <label className='font-bold' htmlFor={'selectAll'}>
          Select all
        </label>
      </div>
      <div className='flex-1 flex flex-col'>
        {occupations &&
          occupations.filteredOccupations.map((occupation: any, index: number) => {
            const styling = isOdd(index) ? 'occupation-item-box-gray' : 'occupation-item-box-white';
            return (
              <div key={index} className={`occupation-item-box ${styling}`}>
                <OccupationItem key={occupation.id} {...occupation}></OccupationItem>
              </div>
            );
          })}
      </div>
    </>
  );
};
