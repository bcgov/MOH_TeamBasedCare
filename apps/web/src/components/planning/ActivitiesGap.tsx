import { PageTitle, Button, ActivitiesGapLegend } from '@components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';
import React, { useState } from 'react';
import { tooltipIcons, TooltipIconTypes } from '../../common';
import { TooltipIcon } from '../generic/TooltipIcon';
import { usePlanningActivitiesGap } from '../../services';
import { OverviewCards } from './ActivitiesGap/OverviewCards';
import { PopoverPosition } from '../generic/Popover';
import { ModalWrapper } from '../Modal';
import { OccupationListDropdown } from '../OccupationListDropdown';
import { ActivityGapCareActivity } from '@tbcm/common';

export interface ActivitiesGapProps {
  step: number;
  title: string;
}

const TableHeader: React.FC = () => {
  const { initialValues, isLoading } = usePlanningActivitiesGap();
  const tdStyles =
    'table-td table-header cursor-pointer px-6 py-4 text-center text-sm font-strong text-bcBluePrimary border-b-4';

  const [showModal, setShowModal] = useState(false);
  const [selectedOccupation, setSelectedOccupation] = useState({ title: '', description: '' });

  // already a loader in the overview section
  if (isLoading) {
    return <></>;
  }

  return (
    <thead className='border-b bg-gray-50 table-row-fixed table-header '>
      <tr>
        {initialValues.headers &&
          initialValues.headers.map(
            ({ title, description }: { title: string; description: string }, index: number) => (
              <th
                key={`th${index}`}
                className={tdStyles}
                onClick={() => {
                  if (index === 0) return; // no description modal to be shown for the first column header - Activities Bundle
                  setSelectedOccupation({ title, description });
                  setShowModal(true);
                }}
              >
                {title}
              </th>
            ),
          )}
      </tr>

      <ModalWrapper
        isOpen={showModal}
        setIsOpen={setShowModal}
        title={selectedOccupation.title}
        description={selectedOccupation.description || 'No description available'}
        closeButton={{ title: 'Ok' }}
      />
    </thead>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SwitchTooltip: React.FC<any> = props => {
  const { item, positionBottomLeft, occupation } = props;
  const position = positionBottomLeft ? PopoverPosition.BOTTOM_LEFT : PopoverPosition.BOTTOM_RIGHT;
  switch (item) {
    case 'MIXED':
      return (
        <TooltipIcon
          {...tooltipIcons[TooltipIconTypes.BLUE_QUESTION]}
          position={position}
          occupation={occupation}
        />
      );
    case 'Y':
      return (
        <TooltipIcon
          {...tooltipIcons[TooltipIconTypes.GREEN_CHECKMARK]}
          position={position}
          occupation={occupation}
        />
      );
    case 'LC':
      return (
        <TooltipIcon
          {...tooltipIcons[TooltipIconTypes.YELLOW_CAUTION]}
          position={position}
          occupation={occupation}
        />
      );
    case '':
      return (
        <TooltipIcon
          {...tooltipIcons[TooltipIconTypes.RED_X]}
          position={position}
          occupation={occupation}
        />
      );
    default:
      return item;
  }
};

const TableBody: React.FC = () => {
  const [openRows, setOpenRows] = useState<number[]>([]);
  const tdStyles =
    'table-td px-6 py-4 text-center text-sm font-medium text-gray-900 table-firstRow-TD';
  const tdActivityBundle = 'table-firstRow-firstTD';
  const { initialValues, isLoading } = usePlanningActivitiesGap();

  const handleSelectRow = (index: number) => {
    // toggle if selected row, open otherwise
    if (openRows.includes(index)) {
      setOpenRows(openRows.filter(row => row !== index));
    } else {
      setOpenRows([...openRows, index]);
    }
  };

  // already a loader in the overview section
  if (isLoading) {
    return <></>;
  }

  return (
    <tbody>
      {initialValues.data &&
        initialValues.data.map((row, index: number) => (
          <React.Fragment key={`row${index}`}>
            <tr className='bg-white border-b table-row-fixed'>
              <td className={`${tdActivityBundle} flex w-full items-center justify-between`}>
                <div className='w-full flex inline-flex items-left justify-left'>
                  <h2 className='text-l text-left'>
                    {row.name}
                    <p className='text-left text-xs mt-1'>
                      {(row.careActivities as ActivityGapCareActivity[]).length} care & restricted
                      activities
                    </p>
                  </h2>
                </div>
                <Button
                  classes='flex inline-flex items-center justify-end h-4 w-4 !p-0 overflow-hidden rounded-full bg-white ml-4'
                  variant='default'
                  type='button'
                  onClick={() => handleSelectRow(index)}
                >
                  <FontAwesomeIcon
                    icon={openRows.includes(index) ? faCaretUp : faCaretDown}
                    className='h-4 text-bcBluePrimary'
                  />
                </Button>
              </td>
              {initialValues.headers.map(({ title }: { title: string }, index: number) => {
                return (
                  title != 'Activities Bundle' && (
                    <td key={`rowTd${index}`} className={`table-row-td-bg ${tdStyles}`}>
                      <SwitchTooltip
                        item={row[title] as string}
                        positionBottomLeft={index > initialValues.headers.length / 2}
                        occupation={title}
                      />
                    </td>
                  )
                );
              })}
            </tr>
            {openRows.includes(index) &&
              (row.careActivities as ActivityGapCareActivity[]).map((value, index: number) => {
                return (
                  <tr key={`toggledRow${index}`} className='bg-white border-b table-row-fixed'>
                    {Object.keys(value).map((key, index) => {
                      return (
                        <td
                          key={`toggledRowTd${index}`}
                          className={`${tdStyles} ${index == 0 ? 'firstTDinsideRow' : ''}`}
                        >
                          <SwitchTooltip
                            item={value[key]}
                            positionBottomLeft={index > Object.values(value).length / 2}
                            occupation={key}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </React.Fragment>
        ))}
    </tbody>
  );
};

const ActivityGapTable: React.FC = () => {
  return (
    <div className='activity-gap-table'>
      <table className='min-w-full text-center'>
        <TableHeader />
        <TableBody />
      </table>
    </div>
  );
};

export const ActivitiesGap: React.FC<ActivitiesGapProps> = () => {
  const description =
    'Considering the roles and tasks you outlined in the previous steps, here is a summary of the identified gaps, optimizations, and suggestions we have offered.';

  return (
    <div>
      <div className='planning-form-box overflow-visible'>
        <div className='flex flex-row space-x-8 items-start justify-between'>
          <div className='flex flex-1'>
            <PageTitle description={description} />
          </div>

          <div className='flex flex-row flex-1 lg:flex-none flex-wrap space-y-2 lg:space-y-0 space-x-1 items-center justify-end'>
            <ActivitiesGapLegend />
            <OccupationListDropdown />
          </div>
        </div>

        <div className='mt-4'>
          <OverviewCards />
        </div>

        <div className='mt-4'>
          <ActivityGapTable />
        </div>
      </div>
    </div>
  );
};
