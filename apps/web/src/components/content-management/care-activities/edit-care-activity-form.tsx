import { CareActivityCMSDetailRO, CareActivityType, EditCareActivityCMSDTO } from '@tbcm/common';
import { BackButtonLink } from '../../BackButtonLink';
import { Heading } from 'src/components/Heading';
import { Button } from 'src/components/Button';
import { Card } from 'src/components/generic/Card';
import { useRouter } from 'next/router';
import { Formik } from 'formik';
import { dtoValidator } from 'src/utils/dto-validator';
import { Field, Textarea } from '@components';
import { BasicSelect } from 'src/components/Select';
import { useBundles, useCareActivityCMSById, useCareActivityCMSEdit } from '@services';

interface EditCareActivityFormProps {
  careActivity: CareActivityCMSDetailRO;
}

const getInitialValues = (careActivity: CareActivityCMSDetailRO): EditCareActivityCMSDTO => ({
  name: careActivity.displayName ?? '',
  description: careActivity.description ?? '',
  clinicalType: careActivity.clinicalType,
  activityType: careActivity.activityType,
  bundleId: careActivity.bundle.id,
});

const activityTypeOptions = Object.values(CareActivityType).map(value => ({ label: value, value }));

export const EditCareActivityForm = ({ careActivity }: EditCareActivityFormProps) => {
  const router = useRouter();
  const { bundles } = useBundles();
  const { mutate } = useCareActivityCMSById(careActivity.id);
  const { handleSubmit } = useCareActivityCMSEdit();

  const submit = async (values: EditCareActivityCMSDTO) => {
    await handleSubmit(careActivity.id, values, () => {
      mutate();
    });
  };

  return (
    <Formik<EditCareActivityCMSDTO>
      initialValues={getInitialValues(careActivity)}
      onSubmit={submit}
      validate={values => dtoValidator(EditCareActivityCMSDTO, values)}
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
                  {careActivity.templateNames || 'None'}
                </div>
              </div>
              <div>
                <BasicSelect<string>
                  id='bundleId'
                  label='Care competencies'
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
        </div>
      )}
    </Formik>
  );
};
