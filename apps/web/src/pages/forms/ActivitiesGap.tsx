
import {FormStepHeader} from '@components';
import { Field } from 'formik';

export interface ActivitiesGapProps {
  step: number;
  title: string;
}

export const ActivitiesGap: React.FC<ActivitiesGapProps> = ({ step, title }) => {
  return (
    <>
        <FormStepHeader>{title}</FormStepHeader>
        <label htmlFor="ActivitiesGap">ActivitiesGap
        <Field id="ActivitiesGap" name="ActivitiesGap"  className={
            `w-full rounded-none bg-gray-100 block h-10
            border-b-2 border-bcBlack pl-1 disabled:bg-bcDisabled`
            
        } placeholder="ActivitiesGap" /></label>
    </>
  );
};