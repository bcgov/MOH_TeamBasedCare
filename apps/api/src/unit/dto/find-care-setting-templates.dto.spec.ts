import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { FindCareSettingTemplatesDto } from './find-care-setting-templates.dto';

describe('FindCareSettingTemplatesDto unit filter', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  const transform = (query: Record<string, unknown>) =>
    pipe.transform(query, { type: 'query', metatype: FindCareSettingTemplatesDto });

  it('accepts an omitted unit without changing pagination defaults', async () => {
    await expect(transform({})).resolves.toMatchObject({ page: 1, pageSize: 10 });
  });

  it('keeps a valid UUID query parameter', async () => {
    const unitId = '11111111-1111-4111-8111-111111111111';

    await expect(transform({ unitId })).resolves.toMatchObject({ unitId });
  });

  it.each(['', 'all', 'not-a-uuid', ['11111111-1111-4111-8111-111111111111']])(
    'rejects invalid unitId %p with a bad request',
    async unitId => {
      await expect(transform({ unitId })).rejects.toBeInstanceOf(BadRequestException);
    },
  );
});
