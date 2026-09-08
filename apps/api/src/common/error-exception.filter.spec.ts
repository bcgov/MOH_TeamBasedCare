/**
 * The filter is the last thing every error passes through, so an exception can
 * look correct in isolation and still reach the client stripped. The version
 * conflict is the case that matters: without its payload the client cannot
 * offer an override, and the editor can never save again.
 */
import { Logger } from '@nestjs/common';
import { ErrorExceptionFilter } from './error-exception.filter';
import { TemplateVersionConflictException } from '../unit/template-version-conflict.exception';

describe('ErrorExceptionFilter', () => {
  const filter = new ErrorExceptionFilter({ error: jest.fn() } as unknown as Logger);

  it('forwards the version conflict payload as errorDetails', () => {
    const updatedAt = new Date('2026-09-02T10:00:00Z');

    const response = filter.transformHttpException(
      new TemplateVersionConflictException({
        currentVersion: 7,
        updatedBy: 'Jane Admin',
        updatedAt,
      }),
    );

    expect(response.errorType).toBe('TemplateVersionConflict');
    expect(response.errorDetails).toEqual({
      currentVersion: 7,
      updatedBy: 'Jane Admin',
      updatedAt,
    });
  });

  it('still reports an empty detail object for an exception carrying no data', () => {
    const response = filter.transformHttpException(new Error('boom'));

    expect(response.errorDetails).toEqual({});
  });
});
