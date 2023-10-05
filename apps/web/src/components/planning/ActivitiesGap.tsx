import { PageTitle, Button, ActivitiesGapLegend } from '@components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faTimesCircle, faCaretUp } from '@fortawesome/free-solid-svg-icons';
import React, { useState } from 'react';
import { tooltipIcons, TooltipIconTypes } from '../../common';
import { TooltipIcon } from '../generic/TooltipIcon';
import { usePlanningActivitiesGap } from '../../services';
import { OverviewCards } from './ActivitiesGap/OverviewCards';

export interface ActivitiesGapProps {
  step: number;
  title: string;
}

const TableHeader: React.FC = () => {
  const { initialValues } = usePlanningActivitiesGap();
  const tdStyles =
    'table-td table-header px-6 py-4 text-left text-sm font-strong text-bcBluePrimary border-b-4';
  return (
    <thead className='border-b bg-gray-50 table-row-fixed table-header '>
      <tr>
        {initialValues.headers &&
          initialValues.headers.map((title: string, index: number) => (
            <th key={`th${index}`} className={tdStyles}>
              {title}
            </th>
          ))}
      </tr>
    </thead>
  );
};

const SwitchTooltip: React.FC<any> = props => {
  const { item } = props;
  switch (item) {
    case 'MIXED':
      return <TooltipIcon {...tooltipIcons[TooltipIconTypes.YELLOW_QUESTION]} />;
    case 'X':
      return <TooltipIcon {...tooltipIcons[TooltipIconTypes.GREEN_CHECKMARK]} />;
    case 'L':
      return <TooltipIcon {...tooltipIcons[TooltipIconTypes.YELLOW_CAUTION]} />;
    case '':
      return <TooltipIcon {...tooltipIcons[TooltipIconTypes.RED_X]} />;
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
  const { initialValues } = usePlanningActivitiesGap();

  const handleSelectRow = (index: number) => {
    // toggle if selected row, open otherwise
    if (selectedRow === index) {
      setOpenRow(!openRow);
    } else {
      setOpenRow(true);
    }

    setSelectedRow(index);
  };

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
                    <p className='text-left text-xs flex mt-1 justify-left items-center'>
                      <FontAwesomeIcon icon={faTimesCircle} className='h-4 mr-1 numberOfGaps' />
                      {row.numberOfGaps}
                    </p>
                  </h2>
                </div>
                <Button
                  classes='flex inline-flex items-center justify-end h-5 w-5 !p-0 overflow-hidden rounded-full bg-white ml-4'
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
              {initialValues.headers.map((item: any, index: number) => {
                return (
                  item != 'Activities Bundle' && (
                    <td key={`rowTd${index}`} className={`table-row-td-bg ${tdStyles}`}>
                      <SwitchTooltip item={row[item]} />
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
                          <SwitchTooltip item={item} />
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
  const width = screen.width - 290;
  return (
    <div className='customTable' style={{ width: width }}>
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
        <PageTitle title='Role Optimization Matrix' />
        <ActivityGapTable />
      </div>
    </div>
  );
};
