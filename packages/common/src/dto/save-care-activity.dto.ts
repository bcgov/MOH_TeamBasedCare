import { Validate, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'isAnyArrayEmpty' })
export class IsAnyArrayEmpty implements ValidatorConstraintInterface {
  validate(values: { [key: string]: string[] } | undefined): boolean {
    if (values) {
      return Object.values(values).filter(each => each?.length > 0)?.length > 0;
    }
    return false;
  }
}
export class SaveCareActivityDTO {
  @Validate(IsAnyArrayEmpty, { message: 'At least 1 Care Activity is required' })
  careActivityBundle: { [key: string]: string[] } | undefined;
}
