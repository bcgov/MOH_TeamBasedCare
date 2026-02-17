import { NextPage } from 'next';
import AppLayout from 'src/components/AppLayout';
import { Card } from 'src/components/generic/Card';
import { useKPIs, useKPICareSettings, useMe } from '@services';
import { HealthAuthorities, Role } from '@tbcm/common';
import { UsersIcon, ClipboardIcon } from 'src/components/icons';
import {
  KPICard,
  KPICardSkeleton,
  CarePlanCard,
  CarePlanCardSkeleton,
  DashboardFilters,
  ExportKPIButton,
} from 'src/components/dashboard';
import { HeadlessListOptions } from 'src/components/HeadlessList';

const Dashboard: NextPage = () => {
  const { hasUserRole } = useMe();
  const { overview, isLoading, filters, setHealthAuthorityFilter, setCareSettingFilter } =
    useKPIs();

  const { careSettings } = useKPICareSettings();

  const isAdmin = hasUserRole([Role.ADMIN]);

  // Build health authority options from HealthAuthorities constant
  const healthAuthorityOptions: HeadlessListOptions<string>[] = [
    { value: '', label: 'All' },
    ...HealthAuthorities.map(ha => ({
      value: ha.name,
      label: ha.name,
    })),
  ];

  // Build care setting options from API (templates with HA context)
  const careSettingOptions: HeadlessListOptions<string>[] = [
    { value: '', label: 'All' },
    ...careSettings.map(cs => ({
      value: cs.id,
      label:
        cs.healthAuthority === 'GLOBAL'
          ? `${cs.displayName} (Master)`
          : `${cs.displayName} (${cs.healthAuthority})`,
    })),
  ];

  return (
    <AppLayout>
      <div className='space-y-6'>
        {/* Header with title and Download button */}
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold text-bcBluePrimary'>KPIs Overview</h1>
          <ExportKPIButton data={overview} isLoading={isLoading} />
        </div>

        {/* Section 1: General KPIs */}
        <Card bgWhite className='rounded-lg'>
          <h2 className='text-xl font-semibold text-gray-900 mb-6'>General</h2>
          {isLoading ? (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <KPICardSkeleton />
              <KPICardSkeleton />
              <KPICardSkeleton />
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <KPICard
                title='Total Users'
                value={overview?.general?.totalUsers ?? 0}
                subtitle='Tracking total number of users within the system.'
                icon={<UsersIcon />}
              />
              <KPICard
                title='Active Users'
                value={overview?.general?.activeUsers ?? 0}
                subtitle='Monitoring the current month user engagement.'
                icon={<UsersIcon />}
              />
              <KPICard
                title='Total Care Plans'
                value={overview?.general?.totalCarePlans ?? 0}
                subtitle='Total Care Plans created.'
                icon={<ClipboardIcon />}
              />
            </div>
          )}
        </Card>

        {/* Section 2: Care Plans by Practice Settings & Health Authority */}
        <Card bgWhite className='rounded-lg'>
          <h2 className='text-xl font-semibold text-gray-900 mb-6'>
            Care Plans Created By Practice Settings & Health Authority
          </h2>

          <DashboardFilters
            healthAuthorityOptions={healthAuthorityOptions}
            careSettingOptions={careSettingOptions}
            selectedHealthAuthority={filters.healthAuthority}
            selectedCareSetting={filters.careSettingId}
            onHealthAuthorityChange={setHealthAuthorityFilter}
            onCareSettingChange={setCareSettingFilter}
            showHealthAuthorityFilter={isAdmin}
          />

          {isLoading ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {[...Array(6)].map((_, i) => (
                <CarePlanCardSkeleton key={i} />
              ))}
            </div>
          ) : overview?.carePlansBySetting && overview.carePlansBySetting.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {overview.carePlansBySetting.map(setting => (
                <CarePlanCard
                  key={`${setting.careSettingId}-${setting.healthAuthority}`}
                  careSettingName={setting.careSettingName}
                  healthAuthority={setting.healthAuthority}
                  count={setting.count}
                />
              ))}
            </div>
          ) : (
            <div className='text-center py-8 text-gray-500'>
              No care plans found for the selected filters.
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
