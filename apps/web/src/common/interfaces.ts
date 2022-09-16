export interface CommonDBItem {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OccupationItemProps extends CommonDBItem {
  name: string;
  displayName: string;
  isRegulated: boolean;
  selectedOccupations?: any;
  setSelectedOccupations?: any;
}
