 
import { validateSync } from 'class-validator';
import { plainToClass } from 'class-transformer';

export const dtoValidator = <T extends Record<any, any>>(
  type: new () => T,
  values: any,
): Partial<Record<keyof T, string>> => {
  const dto = plainToClass(type, values);
  const validationErrors = validateSync(dto);

  return validationErrors.reduce(
    (errors, currentError) => ({
      ...errors,
      [currentError.property]: Object.values(currentError.constraints || {})[0],
    }),
    {},
  );
};
