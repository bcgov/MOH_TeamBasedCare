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

const SwitchTooltip: React.FC<any> = props => {
  const { item, positionBottomLeft } = props;
  const position = positionBottomLeft ? PopoverPosition.BOTTOM_LEFT : PopoverPosition.BOTTOM_RIGHT;
  switch (item) {
    case 'MIXED':
      return <TooltipIcon {...tooltipIcons[TooltipIconTypes.BLUE_QUESTION]} position={position} />;
    case 'Y':
      return (
        <TooltipIcon {...tooltipIcons[TooltipIconTypes.GREEN_CHECKMARK]} position={position} />
      );
    case 'LC':
      return <TooltipIcon {...tooltipIcons[TooltipIconTypes.YELLOW_CAUTION]} position={position} />;
    case '':
      return <TooltipIcon {...tooltipIcons[TooltipIconTypes.RED_X]} position={position} />;
    default:
      return item;
  }
};

const TableBody: React.FC = () => {
  const [openRow, setOpenRow] = useState<boolean>(true);
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const tdStyles =
    'table-td px-6 py-4 text-center text-sm font-medium text-gray-900 table-firstRow-TD';
  const tdActivityBundle = 'table-firstRow-firstTD';
  const { initialValues, isLoading } = usePlanningActivitiesGap();

  const handleSelectRow = (index: number) => {
    // toggle if selected row, open otherwise
    if (selectedRow === index) {
      setOpenRow(!openRow);
    } else {
      setOpenRow(true);
    }

    setSelectedRow(index);
  };

  // already a loader in the overview section
  if (isLoading) {
    return <></>;
  }

  return (
    <tbody>
      {initialValues.data &&
        initialValues.data.map((row: any, index: number) => (
          <React.Fragment key={`row${index}`}>
            <tr className='bg-white border-b table-row-fixed'>
              <td className={`${tdActivityBundle} flex w-full items-center justify-between`}>
                <div className='w-full flex inline-flex items-left justify-left'>
                  <h2 className='text-l text-left'>
                    {row.name}
                    <p className='text-left text-xs mt-1'>
                      {row.careActivities.length} care & restricted activities
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
                    icon={selectedRow == index && openRow ? faCaretUp : faCaretDown}
                    className='h-4 text-bcBluePrimary'
                  />
                </Button>
              </td>
              {initialValues.headers.map(({ title }: { title: string }, index: number) => {
                return (
                  title != 'Activities Bundle' && (
                    <td key={`rowTd${index}`} className={`table-row-td-bg ${tdStyles}`}>
                      <SwitchTooltip
                        item={row[title]}
                        positionBottomLeft={index > initialValues.headers.length / 2}
                      />
                    </td>
                  )
                );
              })}
            </tr>
            {selectedRow == index &&
              openRow &&
              row.careActivities.map((value: any, index: number) => {
                return (
                  <tr key={`toggledRow${index}`} className='bg-white border-b table-row-fixed'>
                    {Object.values(value).map((item: any, index) => {
                      return (
                        <td
                          key={`toggledRowTd${index}`}
                          className={`${tdStyles} ${index == 0 ? 'firstTDinsideRow' : ''}`}
                        >
                          <SwitchTooltip
                            item={item}
                            positionBottomLeft={index > Object.values(value).length / 2}
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

export const ActivitiesGap: React.FC<ActivitiesGapProps> = ({ title }) => {
  const description =
    'Considering the roles and tasks you outlined in the previous steps, here is a summary of the identified gaps, optimizations, and suggestions we have offered.';

  return (
    <div>
      <div className='planning-form-box overflow-visible'>
        <PageTitle title={title} description={description} />
        <ActivitiesGapLegend />
        <OverviewCards />
      </div>

      <div className='planning-form-box'>
        <PageTitle title='Role Optimization Matrix' secondaryChild={<OccupationListDropdown />} />
        <ActivityGapTable />
      </div>
    </div>
  );
};
