/**
 * Care Settings Context
 *
 * Provides state management for the care settings edit wizard.
 * Uses React Context + useReducer pattern for predictable state updates.
 *
 * State includes:
 * - Selected bundles (care competencies) and activities
 * - Occupation permissions for each activity
 * - Current wizard step
 * - Reference data (bundles, occupations)
 *
 * Usage:
 * 1. Wrap edit components with <CareSettingsProvider>
 * 2. Use useCareSettingsContext() hook to access state and dispatch
 */
import { createContext, useContext, useReducer, ReactNode } from 'react';
import { BundleRO, OccupationRO, Permissions } from '@tbcm/common';

/** Permission entry for API submission */
export interface PermissionEntry {
  activityId: string;
  occupationId: string;
  permission: Permissions;
}

// Separator for permission map keys - using :: because UUIDs contain dashes
const PERMISSION_KEY_SEPARATOR = '::';

/** State shape for the care settings edit wizard */
export interface CareSettingsState {
  templateId: string;
  templateName: string;
  /** IDs of bundles (care competencies) selected for this template */
  selectedBundleIds: Set<string>;
  /** IDs of activities selected from the bundles */
  selectedActivityIds: Set<string>;
  /** Permission map: key is `activityId::occupationId`, value is permission level */
  permissions: Map<string, Permissions>;
  /** Current wizard step: 1 = Select Competencies, 2 = Finalize */
  currentStep: number;
  /** Currently viewed bundle in left panel (for activity display) */
  selectedBundleId: string | null;
  /** All available bundles for the template's unit */
  bundles: BundleRO[];
  /** All available occupations for permission assignment */
  occupations: OccupationRO[];
}

const initialState: CareSettingsState = {
  templateId: '',
  templateName: '',
  selectedBundleIds: new Set(),
  selectedActivityIds: new Set(),
  permissions: new Map(),
  currentStep: 1,
  selectedBundleId: null,
  bundles: [],
  occupations: [],
};

type Action =
  | { type: 'SET_TEMPLATE_ID'; payload: string }
  | { type: 'SET_TEMPLATE_NAME'; payload: string }
  | { type: 'SET_BUNDLES'; payload: BundleRO[] }
  | { type: 'SET_OCCUPATIONS'; payload: OccupationRO[] }
  | { type: 'TOGGLE_BUNDLE'; payload: string }
  | { type: 'TOGGLE_ACTIVITY'; payload: string }
  | { type: 'SELECT_ALL_ACTIVITIES'; payload: string[] }
  | { type: 'DESELECT_ALL_ACTIVITIES'; payload: string[] }
  | {
      type: 'SET_PERMISSION';
      payload: { activityId: string; occupationId: string; permission: Permissions };
    }
  | { type: 'REMOVE_PERMISSION'; payload: { activityId: string; occupationId: string } }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_SELECTED_BUNDLE_ID'; payload: string | null }
  | { type: 'INITIALIZE_STATE'; payload: Partial<CareSettingsState> };

function reducer(state: CareSettingsState, action: Action): CareSettingsState {
  switch (action.type) {
    case 'SET_TEMPLATE_ID':
      return { ...state, templateId: action.payload };

    case 'SET_TEMPLATE_NAME':
      return { ...state, templateName: action.payload };

    case 'SET_BUNDLES':
      return { ...state, bundles: action.payload };

    case 'SET_OCCUPATIONS':
      return { ...state, occupations: action.payload };

    case 'TOGGLE_BUNDLE': {
      const newSelectedBundleIds = new Set(state.selectedBundleIds);
      const bundle = state.bundles.find(b => b.id === action.payload);

      if (newSelectedBundleIds.has(action.payload)) {
        // Deselecting bundle: also remove all activities from this bundle
        newSelectedBundleIds.delete(action.payload);
        if (bundle) {
          const newSelectedActivityIds = new Set(state.selectedActivityIds);
          bundle.careActivities?.forEach(a => newSelectedActivityIds.delete(a.id));
          return {
            ...state,
            selectedBundleIds: newSelectedBundleIds,
            selectedActivityIds: newSelectedActivityIds,
          };
        }
      } else {
        // Selecting bundle: also add all activities from this bundle
        newSelectedBundleIds.add(action.payload);
        if (bundle) {
          const newSelectedActivityIds = new Set(state.selectedActivityIds);
          bundle.careActivities?.forEach(a => newSelectedActivityIds.add(a.id));
          return {
            ...state,
            selectedBundleIds: newSelectedBundleIds,
            selectedActivityIds: newSelectedActivityIds,
          };
        }
      }
      return { ...state, selectedBundleIds: newSelectedBundleIds };
    }

    case 'TOGGLE_ACTIVITY': {
      const newSelectedActivityIds = new Set(state.selectedActivityIds);
      if (newSelectedActivityIds.has(action.payload)) {
        // Deselecting activity
        newSelectedActivityIds.delete(action.payload);
      } else {
        // Selecting activity: also ensure parent bundle is selected
        newSelectedActivityIds.add(action.payload);
        // Find the bundle containing this activity and auto-select it
        const parentBundle = state.bundles.find(b =>
          b.careActivities?.some(a => a.id === action.payload),
        );
        if (parentBundle && !state.selectedBundleIds.has(parentBundle.id)) {
          const newSelectedBundleIds = new Set(state.selectedBundleIds);
          newSelectedBundleIds.add(parentBundle.id);
          return {
            ...state,
            selectedBundleIds: newSelectedBundleIds,
            selectedActivityIds: newSelectedActivityIds,
          };
        }
      }
      return { ...state, selectedActivityIds: newSelectedActivityIds };
    }

    case 'SELECT_ALL_ACTIVITIES': {
      const newSelectedActivityIds = new Set(state.selectedActivityIds);
      action.payload.forEach(id => newSelectedActivityIds.add(id));
      return { ...state, selectedActivityIds: newSelectedActivityIds };
    }

    case 'DESELECT_ALL_ACTIVITIES': {
      const newSelectedActivityIds = new Set(state.selectedActivityIds);
      action.payload.forEach(id => newSelectedActivityIds.delete(id));
      return { ...state, selectedActivityIds: newSelectedActivityIds };
    }

    case 'SET_PERMISSION': {
      const { activityId, occupationId, permission } = action.payload;
      const key = `${activityId}${PERMISSION_KEY_SEPARATOR}${occupationId}`;
      const newPermissions = new Map(state.permissions);
      newPermissions.set(key, permission);
      return { ...state, permissions: newPermissions };
    }

    case 'REMOVE_PERMISSION': {
      const { activityId, occupationId } = action.payload;
      const key = `${activityId}${PERMISSION_KEY_SEPARATOR}${occupationId}`;
      const newPermissions = new Map(state.permissions);
      newPermissions.delete(key);
      return { ...state, permissions: newPermissions };
    }

    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };

    case 'SET_SELECTED_BUNDLE_ID':
      return { ...state, selectedBundleId: action.payload };

    case 'INITIALIZE_STATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

interface CareSettingsContextType {
  state: CareSettingsState;
  dispatch: React.Dispatch<Action>;
  getPermission: (activityId: string, occupationId: string) => Permissions | undefined;
  getPermissionsArray: () => PermissionEntry[];
}

const CareSettingsContext = createContext<CareSettingsContextType | null>(null);

export const CareSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const getPermission = (activityId: string, occupationId: string): Permissions | undefined => {
    return state.permissions.get(`${activityId}${PERMISSION_KEY_SEPARATOR}${occupationId}`);
  };

  const getPermissionsArray = (): PermissionEntry[] => {
    const entries: PermissionEntry[] = [];
    state.permissions.forEach((permission, key) => {
      const [activityId, occupationId] = key.split(PERMISSION_KEY_SEPARATOR);
      entries.push({ activityId, occupationId, permission });
    });
    return entries;
  };

  return (
    <CareSettingsContext.Provider value={{ state, dispatch, getPermission, getPermissionsArray }}>
      {children}
    </CareSettingsContext.Provider>
  );
};

export const useCareSettingsContext = () => {
  const context = useContext(CareSettingsContext);
  if (!context) {
    throw new Error('useCareSettingsContext must be used within a CareSettingsProvider');
  }
  return context;
};
