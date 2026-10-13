import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { FindCareActivitiesDto } from './find-care-activities.dto';

describe('FindCareActivitiesDto care setting filter', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  const transform = (query: Record<string, unknown>) =>
    pipe.transform(query, { type: 'query', metatype: FindCareActivitiesDto });

  it('treats an omitted care setting as "all care settings"', async () => {
    await expect(transform({})).resolves.toMatchObject({ careSetting: '', page: 1, pageSize: 10 });
  });

  it('treats an empty care setting as "all care settings"', async () => {
    await expect(transform({ careSetting: '' })).resolves.toMatchObject({ careSetting: '' });
  });

  it('keeps a valid template id', async () => {
    const careSetting = '11111111-1111-4111-8111-111111111111';

    await expect(transform({ careSetting })).resolves.toMatchObject({ careSetting });
  });

  it.each(['all', 'not-a-uuid', ['11111111-1111-4111-8111-111111111111']])(
    'rejects invalid careSetting %p with a bad request instead of a database error',
    async careSetting => {
      await expect(transform({ careSetting })).rejects.toBeInstanceOf(BadRequestException);
    },
  );
});
