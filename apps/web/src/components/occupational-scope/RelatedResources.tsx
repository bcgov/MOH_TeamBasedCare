import { OccupationItemProps } from 'src/common/interfaces';

interface OccupationalScopeRelatedResourcesProps {
  occupation?: OccupationItemProps;
}
export const OccupationalScopeRelatedResources: React.FC<
  OccupationalScopeRelatedResourcesProps
> = ({ occupation }) => {
  if (!occupation?.relatedResources) return <></>;

  const onResourceClick = (link?: string) => {
    if (!link) return;

    window.open(link);
  };

  return (
    <ul>
      {occupation?.relatedResources?.map(resource => (
        <li
          className={`w-full space-y-1 list-disc list-inside text-bcBlueLink cursor-pointer ${
            resource.link ? 'underline' : ''
          }`}
          key={resource.label}
          onClick={() => onResourceClick(resource.link)}
        >
          {resource.label}
        </li>
      ))}
    </ul>
  );
};
