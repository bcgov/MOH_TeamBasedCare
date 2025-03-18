import {
  CareActivityDetailRO,
  CareActivityType,
  EditCareActivityDTO,
  Permissions,
} from '@tbcm/common';
import { BackButtonLink } from '../../BackButtonLink';
import { Heading } from 'src/components/Heading';
import { Button } from 'src/components/Button';
import { Card } from 'src/components/generic/Card';
import { useRouter } from 'next/router';
import { Formik } from 'formik';
import { dtoValidator } from 'src/utils/dto-validator';
import { Field, Textarea } from '@components';
import { BasicSelect } from 'src/components/Select';
import { AllowedActivityDTO } from '@tbcm/common/dist/dto/allowed-activity-dto';
import { SearchBar } from 'src/components/generic/SearchBar';
import { useState } from 'react';
import { useBundles, useCareActivityById, useCareActivityEdit } from '@services';

interface EditCareActivityFormProps {
  careActivity: CareActivityDetailRO;
}

const getInitialValues = (careActivity: CareActivityDetailRO): EditCareActivityDTO => ({
  name: careActivity.displayName ?? '',
  description: careActivity.description ?? '',
  clinicalType: careActivity.clinicalType,
  activityType: careActivity.activityType,
  bundleId: careActivity.bundle.id,
  unitId: careActivity.careLocation.id ?? '',
  allowedActivities: careActivity.allowedActivities.map(allowedActivity => ({
    id: allowedActivity.id,
    unitId: allowedActivity.unit.id,
    occupation: allowedActivity.occupation.displayName!,
    occupationId: allowedActivity.occupation.id,
    permission: allowedActivity.permission,
  })),
});
const permissionOptions = [
  { label: 'Y', value: Permissions.PERFORM },
  { label: 'LC', value: Permissions.LIMITS },
  { label: 'N', value: 'N' },
];

const activityTypeOptions = Object.values(CareActivityType).map(value => ({ label: value, value }));

export const EditCareActivityForm = ({ careActivity }: EditCareActivityFormProps) => {
  const router = useRouter();
  const { bundles } = useBundles();
  const { mutate } = useCareActivityById(careActivity.id, careActivity.careLocation.id);
  const { handleSubmit } = useCareActivityEdit();
  const [occupationKeyword, setOccupationKeyword] = useState('');

  const getFilteredAllowedActivities = (allowedActivities: AllowedActivityDTO[]) =>
    occupationKeyword
      ? allowedActivities.filter(a =>
          a.occupation?.toLowerCase().includes(occupationKeyword.toLowerCase()),
        )
      : allowedActivities;

  const submit = async (values: EditCareActivityDTO) => {
    await handleSubmit(careActivity.id, values);
    mutate();
  };

  const getOccupationScopeRow = (row: AllowedActivityDTO, onChange: (value: string) => void) => {
    const allowedActivity = careActivity.allowedActivities.find(
      a => a.occupation.id === row.occupationId && a.unit.id === row.unitId,
    );
    if (!allowedActivity) return null;
    const id = `matrix-${allowedActivity.occupation.id}-${allowedActivity.unit.id}`;
    return (
      <tr key={id} className='border-b'>
        <td className='py-4 px-3'>{allowedActivity.occupation.displayName}</td>
        <td>
          <BasicSelect
            id={id}
            buttonClassName='max-w-[100px]'
            options={permissionOptions}
            value={row.permission}
            onChange={onChange}
          />
        </td>
      </tr>
    );
  };

  return (
    <Formik<EditCareActivityDTO>
      initialValues={getInitialValues(careActivity)}
      onSubmit={submit}
      validate={values => dtoValidator(EditCareActivityDTO, values)}
    >
      {({ values, setFieldValue, handleSubmit, isSubmitting, isValid }) => (
        <div className='mt-4 w-full'>
          <BackButtonLink />
          <div className='flex justify-between w-full'>
            <Heading
              className='mt-2'
              title={careActivity?.name}
              subTitle={careActivity?.description || ''}
            />
            <div className='flex flex-row gap-4 max-h-10'>
              <Button variant='outline' onClick={() => router.back()}>
                Cancel
              </Button>
              <Button variant='primary' onClick={handleSubmit} disabled={!isValid || isSubmitting}>
                Publish
              </Button>
            </div>
          </div>

          <Card bgWhite className='mt-4 p-6'>
            <div className='flex flex-col gap-4 max-w-2xl'>
              <Field
                type='text'
                label='Name'
                name='name'
                className='border w-full rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-200 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 text-sm'
              />
              <div>
                <label className='block text-bcBlack text-base font-bold mb-2'>Care settings</label>
                <div className='border w-full rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 disabled:bg-bcDisabled bg-bcGrayInput flex items-center hover:cursor-not-allowed text-sm'>
                  {careActivity.careLocation.displayName}
                </div>
              </div>
              <div>
                <BasicSelect<string>
                  id='bundleId'
                  label='Care activity bundle'
                  value={values.bundleId ?? ''}
                  onChange={value => setFieldValue('bundleId', value)}
                  options={bundles?.map(bundle => ({ label: bundle.name, value: bundle.id })) ?? []}
                  className='max-w-[400px]'
                />
              </div>
              <div>
                <BasicSelect<string>
                  id='activityType'
                  label='Aspect of practice'
                  value={values.activityType ?? ''}
                  onChange={value => setFieldValue('activityType', value)}
                  options={activityTypeOptions}
                  className='max-w-[240px]'
                />
              </div>
              <Textarea
                maxLength={3000}
                name='description'
                label='Description'
                placeholder='Please enter description'
                className='max-h-[80px] border w-full rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 text-sm border-gray-300'
              />
            </div>
          </Card>
          <Card bgWhite className='mt-4 p-6'>
            <div className='flex flex-row text-left text-bcBluePrimary font-bold'>
              Scope of practice
            </div>
            <div>
              Enter here to demonstrate what are the capacities of the new occupation being added to
              the system
            </div>
            <SearchBar
              handleChange={e => setOccupationKeyword(e.target.value)}
              className='my-4 max-w-[400px]'
              placeholderText='Search for occupation'
            />
            <table className='table-auto w-full border-collapse'>
              <thead className='border-b table-row-fixed table-header'>
                <tr>
                  <th className='table-header item-box-gray px-6 py-4 text-left font-strong text-bcBluePrimary border-b-4'>
                    Occupations
                  </th>
                  <th className='table-header item-box-gray px-6 py-4 text-left font-strong text-bcBluePrimary border-b-4'>
                    Matrix
                  </th>
                </tr>
              </thead>
              <tbody>
                {getFilteredAllowedActivities(values.allowedActivities).map(allowedActivity =>
                  getOccupationScopeRow(allowedActivity, value => {
                    const newAllowedActivities = values.allowedActivities?.map(row =>
                      row.id === allowedActivity.id ? { ...row, permission: value } : row,
                    );
                    setFieldValue('allowedActivities', newAllowedActivities);
                  }),
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </Formik>
  );
};
