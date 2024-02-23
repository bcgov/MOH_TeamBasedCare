export interface Authority {
  id: string;
  name: string;
  domains: string[];
}

export const Authorities: Record<string, Authority> = {
  MOH: {
    id: 'MOH',
    name: 'Ministry of Health',
    domains: ['gov.bc.ca'],
  },
  HMBC: {
    id: 'HMBC',
    name: 'Health Match BC',
    domains: ['healthmatchbc.org', 'heabc.bc.ca'],
  },
  FNHA: {
    id: 'FNHA',
    name: 'First Nations Health Authority',
    domains: ['fnha.ca'],
  },
  PHC: {
    id: 'PHC',
    name: 'Providence Health Care Society',
    domains: ['providencehealth.bc.ca'],
  },
  PHSA: {
    id: 'PHSA',
    name: 'Provincial Health Services Authority',
    domains: ['phsa.ca'],
  },
  FHA: {
    id: 'FHA',
    name: 'Fraser Health Authority',
    domains: ['fraserhealth.ca'],
  },
  IHA: {
    id: 'IHA',
    name: 'Interior Health Authority',
    domains: ['interiorhealth.ca'],
  },
  VIHA: {
    id: 'VIHA',
    name: 'Vancouver Island Health Authority',
    domains: ['islandhealth.ca'],
  },
  NHA: {
    id: 'NHA',
    name: 'Northern Health Authority',
    domains: ['northernhealth.ca'],
  },
  VCHA: {
    id: 'VCHA',
    name: 'Vancouver Coastal Health Authority',
    domains: ['vch.ca'],
  },
};

export const RegionalHealthAuthorities: Authority[] = [
  Authorities.FHA,
  Authorities.IHA,
  Authorities.NHA,
  Authorities.VCHA,
  Authorities.VIHA,
];

export const HealthAuthorities = [
  ...RegionalHealthAuthorities,
  Authorities.FNHA,
  Authorities.PHC,
  Authorities.PHSA,
];
