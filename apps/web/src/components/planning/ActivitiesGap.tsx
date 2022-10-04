import { PageTitle, Button, ActivitiesGapLegend } from '@components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar,
  faCaretDown,
  faTimesCircle,
  faCaretUp,
} from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { tooltipIcons, TooltipIconTypes } from '../../common';
import { TooltipIcon } from '../generic/TooltipIcon';
import { usePlanningActivitiesGap } from '../../services';
import { Dropdown } from '../generic/Dropdown';

export interface ActivitiesGapProps {
  step: number;
  title: string;
}

const TableHeader = ({ values }: any) => {
  // const { initialValues } = usePlanningActivitiesGap();
  const tdStyles =
    'table-td table-header px-6 py-4 text-left text-sm font-strong text-bcBluePrimary border-b-4';
  return (
    <thead className='border-b bg-gray-50 table-row-fixed table-header '>
      <tr>
        {values.headers &&
          values.headers.map((title: string, index: number) => (
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
    case 'C(E)':
      return <TooltipIcon {...tooltipIcons[TooltipIconTypes.YELLOW_EXCLAMATION]} />;
    case 'A':
      return <TooltipIcon {...tooltipIcons[TooltipIconTypes.YELLOW_X]} />;
    case '':
      return <TooltipIcon {...tooltipIcons[TooltipIconTypes.RED_X]} />;
    default:
      return item;
  }
};

const TableBody = ({ values }: any) => {
  const [openRow, setOpenRow] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<number>();
  const tdStyles =
    'table-td px-6 py-4 text-center text-sm font-medium text-gray-900 table-firstRow-TD';
  const tdActivityBundle = 'table-firstRow-firstTD';
  // const { initialValues } = usePlanningActivitiesGap();

  const handleSelectRow = (index: number) => {
    setOpenRow(!openRow);
    setSelectedRow(index);
  };

  return (
    <tbody>
      {values.data &&
        values.data.map((row: any, index: number) => (
          <>
            <tr key={`row${index}`} className='bg-white border-b table-row-fixed'>
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
              {values.headers.map((item: any, index: number) => {
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
          </>
        ))}
    </tbody>
  );
};

const ActivityGapTable = ({ values }: any) => {
  const width = screen.width - 290;
  return (
    <div className='customTable' style={{ width: width }}>
      <table className='min-w-full text-center'>
        <TableHeader values={values} />
        <TableBody values={values} />
      </table>
    </div>
  );
};

const OccupationCounter = ({ counter }: { counter: number }) => {
  return (
    <span className='flex justify-center items-center ml-2 bg-bcBluePrimary w-6 h-6 rounded-md text-white'>
      {counter}
    </span>
  );
};

export const ActivitiesGap: React.FC<ActivitiesGapProps> = ({ title }) => {
  const { initialValues } = usePlanningActivitiesGap();

  const [displayedValues, setDisplayedValues] = useState(initialValues);

  useEffect(() => setDisplayedValues(initialValues), [initialValues]);

  const description =
    'Based on the roles and tasks that you filled in the previous steps, here are the the gaps that we found. Expanding the row on the left hand side table to view more.';
  return (
    <div className='planning-form-box'>
      <PageTitle title={title} description={description}>
        <FontAwesomeIcon icon={faChartBar} className='h-6 text-bcBluePrimary' />
      </PageTitle>
      <ActivitiesGapLegend />
      <Dropdown>
        <span className=''>Occupation list</span>
        <OccupationCounter counter={displayedValues.headers ? displayedValues.headers.length : 0} />
      </Dropdown>
      <ActivityGapTable values={displayedValues} />
    </div>
  );
};
