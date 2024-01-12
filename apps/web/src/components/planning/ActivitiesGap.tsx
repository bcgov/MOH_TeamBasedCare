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
import { ScrollSync, ScrollSyncPane } from 'react-scroll-sync';

export interface ActivitiesGapProps {
  step: number;
  title: string;
}

const TableHeader: React.FC = () => {
  const { initialValues, isLoading } = usePlanningActivitiesGap();
  const tdStyles =
    'table-td table-header cursor-pointer px-6 py-4 text-center text-sm font-bold text-bcBluePrimary border-b-4';

  const [showModal, setShowModal] = useState(false);
  const [selectedOccupation, setSelectedOccupation] = useState({ title: '', description: '' });

  // already a loader in the overview section
  if (isLoading) {
    return <></>;
  }

  return (
    <>
      {initialValues.headers &&
        initialValues.headers.map(
          ({ title, description }: { title: string; description: string }, index: number) => (
            <div
              key={`header${index}`}
              className={`column ${index === 0 ? 'firstColumn' : ''}`}
              onClick={() => {
                if (index === 0) return; // no description modal to be shown for the first column header - Activities Bundle
                setSelectedOccupation({ title, description });
                setShowModal(true);
              }}
            >
              <div className={`cell ${tdStyles}`}>{title}</div>
            </div>
          ),
        )}

      <ModalWrapper
        isOpen={showModal}
        setIsOpen={setShowModal}
        title={selectedOccupation.title}
        description={selectedOccupation.description || 'No description available'}
        closeButton={{ title: 'Ok' }}
      />
    </>
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
    <>
      {initialValues.headers &&
        initialValues.headers.map(
          ({ title }: { title: string; description: string }, i: number) => (
            <div
              className={`column ${title === 'Activities Bundle' ? 'firstColumn' : ''}`}
              key={`header${i}`}
            >
              {initialValues.data &&
                initialValues.data.map((row: any, j: number) => (
                  <React.Fragment key={`row${j}`}>
                    {/* Bundles */}
                    {title === 'Activities Bundle' && (
                      <div
                        className={`cell ${tdActivityBundle} flex w-full items-center justify-between`}
                      >
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
                          onClick={() => handleSelectRow(j)}
                        >
                          <FontAwesomeIcon
                            icon={selectedRow == j && openRow ? faCaretUp : faCaretDown}
                            className='h-4 text-bcBluePrimary'
                          />
                        </Button>
                      </div>
                    )}

                    {title !== 'Activities Bundle' && (
                      <div className={`cell ${tdStyles}`}>
                        <SwitchTooltip
                          item={row[title]}
                          positionBottomLeft={i > initialValues.headers.length / 2}
                        />
                      </div>
                    )}

                    {/* Activities */}
                    {selectedRow == j &&
                      openRow &&
                      row.careActivities.map((value: any, k: number) => {
                        return (
                          <div
                            className={`cell ${
                              title === 'Activities Bundle' ? 'firstColumn innerFirstColumn' : ''
                            } bg-white border-b text-sm align-left`}
                            key={`rowCareActivities${k}`}
                          >
                            {title === 'Activities Bundle' && <div> {value['name']} </div>}
                            {title !== 'Activities Bundle' && (
                              <div className={`cell ${tdStyles}`}>
                                <SwitchTooltip
                                  item={value[title]}
                                  positionBottomLeft={i > Object.values(value).length / 2}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </React.Fragment>
                ))}
            </div>
          ),
        )}
    </>
  );
};

const ActivityGapTable: React.FC = () => {
  return (
    <ScrollSync>
      <div className='scrollsync_table wrap'>
        <div className='headers'>
          <ScrollSyncPane>
            <div className='scroller'>
              <TableHeader />
            </div>
          </ScrollSyncPane>
        </div>
        <ScrollSyncPane>
          <div className='tracks'>
            <TableBody />
          </div>
        </ScrollSyncPane>
      </div>
    </ScrollSync>
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
