import { useOccupations } from 'src/services/useOccupations';
import { OccupationItem } from './OccupationItem';
import { isOdd } from 'src/common/util';
import { useFormikContext } from 'formik';
import { Spinner } from './generic/Spinner';
import { PlanningOccupation } from '@services';

export const OccupationSelector = ({ searchValue = '', showDescriptionModal = false }) => {
  const { occupations, isLoading } = useOccupations();
  const { values, setFieldValue } = useFormikContext<PlanningOccupation>();

  const filteredOccupations = occupations.filter(o => {
    if (!searchValue) return true;

    return o.name?.toLowerCase().includes(searchValue?.toLowerCase());
  });

  if (isLoading) {
    return <Spinner show={isLoading} />;
  }

  return (
    <>
      <div className='flex items-center p-3'>
        <input
          type='checkbox'
          name='selectAll'
          id='selectAll'
          className='mr-3 h-5 w-5 min-w-5 accent-bcBlueLink'
          onChange={e => {
            if (e.target.checked) {
              const selectedOccupationIdsSet = new Set(values.occupation);

              filteredOccupations.forEach(o => {
                selectedOccupationIdsSet.add(o.id);
              });

              setFieldValue('occupation', Array.from(selectedOccupationIdsSet));
            } else {
              const selectedOccupationIdsSet = new Set(values.occupation);

              filteredOccupations.forEach(o => {
                selectedOccupationIdsSet.delete(o.id);
              });

              setFieldValue('occupation', Array.from(selectedOccupationIdsSet));
            }
          }}
          checked={
            filteredOccupations.length > 0 &&
            filteredOccupations.every(o => values.occupation.includes(o.id))
          }
        />
        <label className='' htmlFor={'selectAll'}>
          Select all
          <span className='pl-1 font-bold'>
            (
            {
              (filteredOccupations?.filter(o => (values?.occupation || []).includes(o.id)) || [])
                .length
            }{' '}
            / {filteredOccupations?.length} Selected)
          </span>
        </label>
      </div>
      <hr />
      <div className='flex-1 flex flex-col'>
        {filteredOccupations.map((occupation, index) => {
          const styling = isOdd(index) ? 'item-box-gray' : 'item-box-white';
          return (
            <div key={index} className={`occupation-item-box ${styling}`}>
              <OccupationItem
                key={occupation.id}
                showDescriptionModal={showDescriptionModal}
                {...occupation}
              ></OccupationItem>
            </div>
          );
        })}
      </div>
    </>
  );
};
