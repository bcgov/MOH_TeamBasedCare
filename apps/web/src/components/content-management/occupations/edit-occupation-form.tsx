import {
  CareActivityRO,
  CreateOccupationDTO,
  EditOccupationCMSDTO,
  OccupationDetailRO,
  OccupationRelatedResourceDTO,
  Permissions,
  ScopePermissionDTO,
} from '@tbcm/common';
import { BackButtonLink } from '../../BackButtonLink';
import { Heading } from 'src/components/Heading';
import { Button } from 'src/components/Button';
import { Card } from 'src/components/generic/Card';
import { useRouter } from 'next/router';
import { Formik, FieldArray, FormikHelpers } from 'formik';
import { Field, Textarea } from '@components';
import { BasicSelect } from 'src/components/Select';
import { SearchBar } from 'src/components/generic/SearchBar';
import { useEffect, useMemo, useState } from 'react';
import { useBundlesWithActivities, useOccupationCMSCreate, useOccupationCMSEdit } from '@services';
import { AllowedPath, TagVariants } from 'src/common';
import { Pagination, PageOptions } from 'src/components/Pagination';

// Validate URL to match backend's class-validator @IsUrl() behavior
const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);

    // Must be http or https protocol
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    const hostname = url.hostname;

    // Hostname validation to match class-validator's isURL:
    // - Must not be empty
    // - Must not start or end with a dot
    // - Must not have consecutive dots
    // - Must have at least one dot (TLD required)
    // - Each label must be valid (not start/end with hyphen)
    if (
      !hostname ||
      hostname.startsWith('.') ||
      hostname.endsWith('.') ||
      hostname.includes('..') ||
      !hostname.includes('.')
    ) {
      return false;
    }

    // Validate each label in the hostname
    const labels = hostname.split('.');
    for (const label of labels) {
      if (
        !label ||
        label.startsWith('-') ||
        label.endsWith('-') ||
        !/^[a-zA-Z0-9-]+$/.test(label)
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
};

interface EditOccupationFormProps {
  occupation?: OccupationDetailRO;
  isNew?: boolean;
}

interface FormValues {
  name: string;
  description: string;
  isRegulated: string;
  relatedResources: OccupationRelatedResourceDTO[];
  scopePermissions: Map<string, ScopePermissionDTO>;
}

const regulationOptions = [
  { label: 'Regulated', value: 'true', tagVariant: TagVariants.BLUE },
  { label: 'Unregulated', value: 'false', tagVariant: TagVariants.GREEN },
];

const permissionOptions = [
  { label: 'Yes', value: Permissions.PERFORM },
  { label: 'No', value: Permissions.NO },
  { label: 'Limits & Conditions', value: Permissions.LIMITS },
];

const getInitialValues = (occupation?: OccupationDetailRO): FormValues => {
  const scopePermissions = new Map<string, ScopePermissionDTO>();

  if (occupation?.scopePermissions) {
    occupation.scopePermissions.forEach(sp => {
      // Key is now just careActivityId (no unitId)
      const key = sp.careActivityId;
      scopePermissions.set(key, {
        careActivityId: sp.careActivityId,
        permission: sp.permission as Permissions,
      });
    });
  }

  return {
    name: occupation?.displayName ?? '',
    description: occupation?.description ?? '',
    isRegulated: occupation?.isRegulated ? 'true' : 'false',
    relatedResources: occupation?.relatedResources ?? [],
    scopePermissions,
  };
};

const toCreateDTO = (values: FormValues): CreateOccupationDTO => ({
  name: values.name,
  description: values.description,
  isRegulated: values.isRegulated === 'true',
  // Only include resources where both label AND link are provided and link is valid URL
  relatedResources: values.relatedResources.filter(r => r.label && r.link && isValidUrl(r.link)),
  // Filter out "No" permissions - only send Y and LC (absence of record means No)
  scopePermissions: Array.from(values.scopePermissions.values())
    .filter(sp => sp.permission && sp.permission !== Permissions.NO)
    .map(sp => ({
      careActivityId: sp.careActivityId,
      permission: sp.permission,
    })),
});

const toEditDTO = (values: FormValues): EditOccupationCMSDTO => ({
  name: values.name,
  description: values.description,
  isRegulated: values.isRegulated === 'true',
  // Only include resources where both label AND link are provided and link is valid URL
  relatedResources: values.relatedResources.filter(r => r.label && r.link && isValidUrl(r.link)),
  // Filter out "No" permissions - only send Y and LC (absence of record means No)
  scopePermissions: Array.from(values.scopePermissions.values())
    .filter(sp => sp.permission && sp.permission !== Permissions.NO)
    .map(sp => ({
      careActivityId: sp.careActivityId,
      permission: sp.permission,
    })),
});

interface ActivityWithBundle extends CareActivityRO {
  bundleName?: string;
  bundleId: string;
}

export const EditOccupationForm = ({ occupation, isNew }: EditOccupationFormProps) => {
  const router = useRouter();
  const { bundles, isLoading: isLoadingBundles } = useBundlesWithActivities();
  const { handleSubmit: handleCreate, isLoading: isCreating } = useOccupationCMSCreate();
  const { handleSubmit: handleEdit, isLoading: isEditing } = useOccupationCMSEdit();

  const [activitySearchText, setActivitySearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [scopePageIndex, setScopePageIndex] = useState(1);
  const [scopePageSize, setScopePageSize] = useState(15);

  // Debounce search text (500ms delay) and reset to page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(prev => {
        if (prev !== activitySearchText) {
          setScopePageIndex(1);
        }
        return activitySearchText;
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [activitySearchText]);

  // Flatten all activities with their bundle info
  const allActivities: ActivityWithBundle[] = useMemo(() => {
    if (!bundles) return [];
    return bundles.flatMap(bundle =>
      (bundle.careActivities || []).map((activity: CareActivityRO) => ({
        ...activity,
        bundleName: bundle.name,
        bundleId: bundle.id,
      })),
    );
  }, [bundles]);

  // Filter activities by debounced search text (multi-word AND logic)
  const filteredActivities = useMemo(() => {
    if (!debouncedSearchText.trim()) return allActivities;

    // Split search into terms and lowercase
    const searchTerms = debouncedSearchText
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(term => term.length > 0);

    if (searchTerms.length === 0) return allActivities;

    return allActivities.filter(activity => {
      // Combine all searchable fields into one string
      const searchableText = [
        activity.name,
        activity.bundleName,
        activity.activityType,
        activity.clinicalType,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      // ALL terms must match (AND logic)
      return searchTerms.every(term => searchableText.includes(term));
    });
  }, [allActivities, debouncedSearchText]);

  // Paginate filtered activities
  const paginatedActivities = useMemo(() => {
    const start = (scopePageIndex - 1) * scopePageSize;
    return filteredActivities.slice(start, start + scopePageSize);
  }, [filteredActivities, scopePageIndex, scopePageSize]);

  // Group paginated activities by bundle for display
  const groupedActivities = useMemo(() => {
    const groups: { bundleId: string; bundleName?: string; activities: ActivityWithBundle[] }[] =
      [];
    let currentBundleId = '';

    paginatedActivities.forEach(activity => {
      if (activity.bundleId !== currentBundleId) {
        currentBundleId = activity.bundleId;
        groups.push({
          bundleId: activity.bundleId,
          bundleName: activity.bundleName,
          activities: [activity],
        });
      } else {
        groups[groups.length - 1].activities.push(activity);
      }
    });

    return groups;
  }, [paginatedActivities]);

  const handlePageOptionsChange = (options: PageOptions) => {
    setScopePageIndex(options.pageIndex);
    setScopePageSize(options.pageSize);
  };

  const submit = async (values: FormValues, { setFieldError }: FormikHelpers<FormValues>) => {
    const handleError = (errorMessage: string) => {
      if (errorMessage.toLowerCase().includes('name already exists')) {
        setFieldError('name', errorMessage);
      }
    };

    if (isNew) {
      await handleCreate(
        toCreateDTO(values),
        () => router.push(`${AllowedPath.CONTENT_MANAGEMENT}?tab=occupations`),
        handleError,
      );
    } else if (occupation) {
      await handleEdit(
        occupation.id,
        toEditDTO(values),
        () => router.push(`${AllowedPath.CONTENT_MANAGEMENT}?tab=occupations`),
        handleError,
      );
    }
  };

  const validate = (values: FormValues) => {
    const errors: Record<string, string> = {};

    if (!values.name.trim()) {
      errors.name = 'Occupation name is required';
    } else if (values.name.length > 255) {
      errors.name = 'Occupation name must be 255 characters or less';
    }

    if (!values.description.trim()) {
      errors.description = 'Professional description is required';
    } else if (values.description.length > 3000) {
      errors.description = 'Professional description must be 3000 characters or less';
    }

    values.relatedResources.forEach((resource, index) => {
      if (resource.label && !resource.link) {
        errors[`relatedResources.${index}.link`] =
          'Link address is required when link name is provided';
      }
      if (resource.link && !resource.label) {
        errors[`relatedResources.${index}.label`] =
          'Link name is required when link address is provided';
      }
      if (resource.link && !isValidUrl(resource.link)) {
        errors[`relatedResources.${index}.link`] =
          'Must be a valid URL (e.g., https://example.com)';
      }
    });

    return errors;
  };

  return (
    <Formik<FormValues>
      initialValues={getInitialValues(occupation)}
      onSubmit={submit}
      validate={validate}
    >
      {({
        values,
        setFieldValue,
        handleSubmit,
        isSubmitting,
        isValid,
        errors,
        setFieldTouched,
      }) => (
        <div className='mt-4 w-full'>
          <BackButtonLink />
          <div className='flex justify-between w-full'>
            <Heading
              className='mt-2'
              title={isNew ? 'Add Occupation' : occupation?.displayName || ''}
            />
            <div className='flex flex-row gap-4 max-h-10'>
              <Button variant='outline' type='button' onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                variant='primary'
                type='button'
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting || isCreating || isEditing}
                loading={isCreating || isEditing}
              >
                Publish
              </Button>
            </div>
          </div>

          {/* General Details Section */}
          <Card bgWhite className='mt-4 p-6'>
            <div className='text-left text-bcBluePrimary font-bold mb-4'>General Details</div>
            <div className='flex flex-col gap-4 max-w-2xl'>
              <Field
                type='text'
                label='Occupation Name'
                name='name'
                className='border border-gray-300 w-full rounded bg-white py-2 px-3 text-left text-sm focus:outline-none focus:border-bcBluePrimary focus:ring-1 focus:ring-bcBluePrimary'
              />
              <Textarea
                maxLength={3000}
                name='description'
                label='Professional Description'
                placeholder='Please enter description'
                className='max-h-[120px] border border-gray-300 w-full rounded bg-white py-2 px-3 text-left text-sm focus:outline-none focus:border-bcBluePrimary focus:ring-1 focus:ring-bcBluePrimary'
              />
              <div>
                <BasicSelect<string>
                  id='isRegulated'
                  label='Regulation Status'
                  value={values.isRegulated}
                  onChange={value => setFieldValue('isRegulated', value)}
                  options={regulationOptions}
                  className='max-w-[240px]'
                />
              </div>
            </div>
          </Card>

          {/* Scope of Practice Section */}
          <Card bgWhite className='mt-4 p-6'>
            <div className='text-left text-bcBluePrimary font-bold mb-2'>Scope of Practice</div>
            <div className='text-sm text-gray-600 mb-4'>
              Understand what activities that can/can not be performed by this occupation by search
              a topic.
            </div>

            <div className='mb-4 max-w-md'>
              <SearchBar
                handleChange={e => setActivitySearchText(e.target.value)}
                placeholderText='Search field'
              />
            </div>

            {!isLoadingBundles && filteredActivities.length > 0 && (
              <>
                <div className='overflow-hidden'>
                  <table className='table-auto w-full'>
                    <thead className='bg-[#FAF9F8]'>
                      <tr className='border-b-2 border-bcYellowPrimary'>
                        <th className='px-4 py-3 text-left font-semibold text-bcBluePrimary w-1/4'>
                          Care Competencies <span className='ml-1 text-gray-400'>↕</span>
                        </th>
                        <th className='px-4 py-3 text-left font-semibold text-bcBluePrimary w-5/12'>
                          Care Activities <span className='ml-1 text-gray-400'>↕</span>
                        </th>
                        <th className='px-4 py-3 text-left font-semibold text-bcBluePrimary w-1/3'>
                          Scope
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedActivities.map(group =>
                        group.activities.map((activity, activityIndex) => {
                          const key = activity.id;
                          const currentPermission =
                            values.scopePermissions.get(key)?.permission || Permissions.NO;

                          return (
                            <tr
                              key={`${group.bundleId}-${activity.id}`}
                              className='even:bg-[#FAF9F8]'
                            >
                              <td className='p-2' style={{ height: '1px' }}>
                                <div className='border border-gray-300 rounded px-3 py-3 bg-white min-h-[70px] h-full'>
                                  {group.bundleName}
                                </div>
                              </td>
                              <td className='p-2'>
                                <div className='border border-gray-300 rounded px-3 py-3 bg-white min-h-[70px]'>
                                  {activity.name}
                                </div>
                              </td>
                              <td className='p-2 align-top'>
                                <BasicSelect<string>
                                  id={`scope-${key}`}
                                  value={currentPermission}
                                  onChange={value => {
                                    const newPermissions = new Map(values.scopePermissions);
                                    if (value) {
                                      newPermissions.set(key, {
                                        careActivityId: activity.id,
                                        permission: value as Permissions,
                                      });
                                    } else {
                                      newPermissions.delete(key);
                                    }
                                    setFieldValue('scopePermissions', newPermissions);
                                  }}
                                  options={permissionOptions}
                                  buttonClassName='w-full border border-gray-300 rounded py-3'
                                />
                              </td>
                            </tr>
                          );
                        }),
                      )}
                    </tbody>
                  </table>
                </div>

                <div className='mt-4'>
                  <Pagination
                    id='scope-permissions-pagination'
                    pageOptions={{
                      pageIndex: scopePageIndex,
                      pageSize: scopePageSize,
                      total: filteredActivities.length,
                    }}
                    onChange={handlePageOptionsChange}
                  />
                </div>
              </>
            )}

            {isLoadingBundles && (
              <div className='text-center py-8 text-gray-500'>Loading care activities...</div>
            )}

            {!isLoadingBundles && filteredActivities.length === 0 && (
              <div className='text-center py-8 text-gray-500'>
                {activitySearchText
                  ? 'No activities match your search.'
                  : 'No care activities found.'}
              </div>
            )}
          </Card>

          {/* Related Resources Section */}
          <Card bgWhite className='mt-4 p-6'>
            <div className='text-left text-bcBluePrimary font-bold mb-4'>Related Resources</div>
            <FieldArray name='relatedResources'>
              {({ push, remove }) => (
                <div className='flex flex-col gap-4'>
                  {values.relatedResources.map((resource, index) => {
                    const labelError = (errors as any)?.[`relatedResources.${index}.label`];
                    const linkError = (errors as any)?.[`relatedResources.${index}.link`];

                    return (
                      <div key={index} className='flex gap-4 items-start'>
                        <div className='flex-1'>
                          <Field
                            type='text'
                            label='Link Name'
                            name={`relatedResources.${index}.label`}
                            onBlur={() => setFieldTouched(`relatedResources.${index}.label`, true)}
                            className={`border w-full rounded bg-white py-2 px-3 text-left text-sm focus:outline-none focus:border-bcBluePrimary focus:ring-1 focus:ring-bcBluePrimary ${
                              labelError ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          <div className='h-5'>
                            {labelError && <p className='text-red-600 text-sm'>{labelError}</p>}
                          </div>
                        </div>
                        <div className='flex-1'>
                          <Field
                            type='text'
                            label='Link Address'
                            name={`relatedResources.${index}.link`}
                            onBlur={() => setFieldTouched(`relatedResources.${index}.link`, true)}
                            className={`border w-full rounded bg-white py-2 px-3 text-left text-sm focus:outline-none focus:border-bcBluePrimary focus:ring-1 focus:ring-bcBluePrimary ${
                              linkError ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          <div className='h-5'>
                            {linkError && <p className='text-red-600 text-sm'>{linkError}</p>}
                          </div>
                        </div>
                        <div className='pt-7'>
                          <Button variant='outline' type='button' onClick={() => remove(index)}>
                            Remove Link
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <Button
                    variant='outline'
                    type='button'
                    onClick={() => push({ label: '', link: '' })}
                    classes='w-fit'
                  >
                    Add Link
                  </Button>
                </div>
              )}
            </FieldArray>
          </Card>
        </div>
      )}
    </Formik>
  );
};
