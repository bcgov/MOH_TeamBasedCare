/**
 * Care Settings List Component
 *
 * Displays a paginated, sortable table of care setting templates.
 * Features:
 * - Sortable columns (name, parent, date modified)
 * - Edit button for non-master templates
 * - Create Copy button for all templates
 * - Empty state message when no results
 */
import { CareSettingsCMSFindSortKeys, CareSettingTemplateRO, SortOrder } from '@tbcm/common';
import dayjs from 'dayjs';
import { isOdd } from 'src/common/util';
import { Button } from '../Button';
import { Spinner } from '../generic/Spinner';
import { PageOptions, Pagination } from '../Pagination';
import { SortButton } from '../SortButton';

interface TableHeaderProps {
  sortKey?: CareSettingsCMSFindSortKeys;
  sortOrder?: SortOrder;
  onSortChange: ({ key }: { key: CareSettingsCMSFindSortKeys }) => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({ sortKey, sortOrder, onSortChange }) => {
  const tdStyles =
    'table-header item-box-gray px-6 py-4 text-left font-strong text-bcBluePrimary border-b-2 border-[#FCBA19]';

  const headers = [
    { label: 'Care Setting Name', name: CareSettingsCMSFindSortKeys.NAME },
    { label: 'Parent', name: CareSettingsCMSFindSortKeys.PARENT_NAME },
    { label: 'Date Modified', name: CareSettingsCMSFindSortKeys.UPDATED_AT },
    { label: '' },
  ];

  return (
    <thead className='border-b table-row-fixed table-header'>
      <tr className='w-full'>
        {headers.map(({ label, name }, index: number) => (
          <th key={`th${index}`} className={tdStyles}>
            <SortButton<CareSettingsCMSFindSortKeys>
              label={label}
              name={name}
              sortKey={sortKey}
              sortOrder={sortOrder}
              onChange={onSortChange}
            />
          </th>
        ))}
      </tr>
    </thead>
  );
};

interface TableBodyProps {
  careSettings?: CareSettingTemplateRO[];
  onEditClick: (template: CareSettingTemplateRO) => void;
  onCopyClick: (template: CareSettingTemplateRO) => void;
  onDeleteClick: (template: CareSettingTemplateRO) => void;
  canModify?: (template: CareSettingTemplateRO) => boolean;
}

const TableBody: React.FC<TableBodyProps> = ({
  careSettings = [],
  onEditClick,
  onCopyClick,
  onDeleteClick,
  canModify,
}) => {
  const tdStyles = 'table-td px-6 py-4 text-left';

  if (careSettings.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={4} className='text-center py-8 text-gray-500'>
            No care settings found
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {careSettings?.map((template, index: number) => (
        <tr className={`${isOdd(index) ? 'item-box-gray' : 'item-box-white'}`} key={`row${index}`}>
          <td className={tdStyles}>
            {template.name}
            {!template.isMaster &&
              template.missingPermissionsCount !== undefined &&
              template.missingPermissionsCount > 0 && (
                <span className='ml-2 text-xs text-amber-600'>
                  ({template.missingPermissionsCount}{' '}
                  {template.missingPermissionsCount === 1
                    ? 'activity has'
                    : 'activities have'}{' '}
                  no occupation permissions)
                </span>
              )}
          </td>
          <td className={tdStyles}>{template.parentName || '-'}</td>
          <td className={tdStyles}>
            {template.updatedAt ? dayjs(template.updatedAt).format('MMM D, YYYY') : '-'}
          </td>
          <td className={`${tdStyles}`}>
            <div className='flex justify-end gap-4'>
              {!template.isMaster && canModify?.(template) && (
                <>
                  <Button variant='link' onClick={() => onEditClick(template)}>
                    Edit
                  </Button>
                  <Button
                    variant='link'
                    onClick={() => onDeleteClick(template)}
                    classes='text-red-600 hover:text-red-800'
                  >
                    Delete
                  </Button>
                </>
              )}
              <Button variant='link' onClick={() => onCopyClick(template)}>
                Create Copy
              </Button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
};

interface TableFooterProps {
  pageIndex: number;
  pageSize: number;
  total: number;
  onPageOptionsChange: (options: PageOptions) => void;
}

const TableFooter: React.FC<TableFooterProps> = ({
  pageSize,
  pageIndex,
  total,
  onPageOptionsChange,
}) => {
  return (
    <tfoot>
      <tr>
        <td colSpan={100}>
          <Pagination
            id='tbcm-care-settings-list-table'
            pageOptions={{ pageIndex, pageSize, total }}
            onChange={onPageOptionsChange}
          />
        </td>
      </tr>
    </tfoot>
  );
};

interface CareSettingsListProps {
  careSettings: CareSettingTemplateRO[];
  pageIndex: number;
  pageSize: number;
  total: number;
  onPageOptionsChange: (options: PageOptions) => void;
  sortKey?: CareSettingsCMSFindSortKeys;
  sortOrder?: SortOrder;
  onSortChange: ({ key }: { key: CareSettingsCMSFindSortKeys }) => void;
  isLoading?: boolean;
  onEditClick: (template: CareSettingTemplateRO) => void;
  onCopyClick: (template: CareSettingTemplateRO) => void;
  onDeleteClick: (template: CareSettingTemplateRO) => void;
  canModify?: (template: CareSettingTemplateRO) => boolean;
}

export const CareSettingsList: React.FC<CareSettingsListProps> = ({
  careSettings,
  pageIndex,
  pageSize,
  total,
  onPageOptionsChange,
  sortKey,
  sortOrder,
  onSortChange,
  isLoading,
  onEditClick,
  onCopyClick,
  onDeleteClick,
  canModify,
}) => {
  if (isLoading) {
    return <Spinner show={isLoading} />;
  }

  return (
    <div className='max-h-full w-full flex-1 flex flex-col overflow-auto gap-3 bg-white'>
      <table className='table-auto'>
        <TableHeader sortKey={sortKey} sortOrder={sortOrder} onSortChange={onSortChange} />
        <TableBody
          careSettings={careSettings}
          onEditClick={onEditClick}
          onCopyClick={onCopyClick}
          onDeleteClick={onDeleteClick}
          canModify={canModify}
        />
        <TableFooter
          pageIndex={pageIndex}
          pageSize={pageSize}
          total={total}
          onPageOptionsChange={onPageOptionsChange}
        />
      </table>
    </div>
  );
};
