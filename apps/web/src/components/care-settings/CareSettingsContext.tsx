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
import {
  BundleRO,
  getTemplatePermissionKey,
  normalizeRestrictionDescription,
  OccupationRO,
  Permissions,
  splitTemplatePermissionKey,
  TemplateChangesDTO,
  TemplateLevel,
  TemplatePermissionDTO,
} from '@tbcm/common';

/** Permission entry shared with the template-save API contract. */
export type PermissionEntry = TemplatePermissionDTO;

/** Limits and conditions attached to a single LC permission */
export interface PermissionLimit {
  limitId: string;
  restrictionDescription?: string;
}

/**
 * Captures only persisted Y/LC rows, including their LC details, at template load time.
 *
 * @param permissions - Current permission values indexed by activity-occupation key.
 * @param limits - Current LC details indexed by the same key.
 * @returns A detached snapshot of rows that the API persists.
 */
const snapshotPermissions = (
  permissions: Map<string, Permissions>,
  limits: Map<string, PermissionLimit>,
): Map<string, PermissionEntry> => {
  const snapshot = new Map<string, PermissionEntry>();

  permissions.forEach((permission, key) => {
    if (permission === Permissions.NO) return;

    const [activityId, occupationId] = splitTemplatePermissionKey(key);
    const limit = permission === Permissions.LIMITS ? limits.get(key) : undefined;
    snapshot.set(key, {
      activityId,
      occupationId,
      permission,
      limitId: limit?.limitId,
      restrictionDescription: normalizeRestrictionDescription(limit?.restrictionDescription),
    });
  });

  return snapshot;
};

/**
 * Compares persisted permission values so LC limit-only and description-only edits are retained.
 *
 * @param left - Snapshot or current permission entry.
 * @param right - Snapshot or current permission entry.
 * @returns `true` when both entries would persist identically.
 */
const permissionsMatch = (left: PermissionEntry, right: PermissionEntry): boolean =>
  left.permission === right.permission &&
  (left.limitId ?? null) === (right.limitId ?? null) &&
  normalizeRestrictionDescription(left.restrictionDescription) ===
    normalizeRestrictionDescription(right.restrictionDescription);

/** State shape for the care settings edit wizard */
export interface CareSettingsState {
  templateId: string;
  templateName: string;
  /** Name of the template this one was copied from; drives the unsaved title and the "Edited from" line */
  parentName: string;
  /** Level of this template. Null until it is chosen on first save. */
  level: TemplateLevel | null;
  /** Optimistic-concurrency token echoed back as expectedVersion on save */
  version: number;
  /** IDs of bundles (care competencies) selected for this template */
  selectedBundleIds: Set<string>;
  /** Selected bundle IDs when the template was last loaded. */
  initialSelectedBundleIds: Set<string>;
  /** IDs of activities selected from the bundles */
  selectedActivityIds: Set<string>;
  /** Selected activity IDs when the template was last loaded. */
  initialSelectedActivityIds: Set<string>;
  /** Permission map: key is `activityId::occupationId`, value is permission level */
  permissions: Map<string, Permissions>;
  /** Limits attached to LC permissions, keyed the same way as `permissions` */
  permissionLimits: Map<string, PermissionLimit>;
  /** Full permission values when the template was last loaded. */
  initialPermissions: Map<string, PermissionEntry>;
  /** Whether this template has a direct parent, even if that parent has no permission rows. */
  hasParent: boolean;
  /**
   * The direct parent's permissions, used only to decide whether to show the
   * "Changes made by HA" badge.
   */
  parentPermissions: Map<string, Permissions>;
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
  parentName: '',
  level: null,
  version: 0,
  selectedBundleIds: new Set(),
  initialSelectedBundleIds: new Set(),
  selectedActivityIds: new Set(),
  initialSelectedActivityIds: new Set(),
  permissions: new Map(),
  permissionLimits: new Map(),
  initialPermissions: new Map(),
  hasParent: false,
  parentPermissions: new Map(),
  currentStep: 1,
  selectedBundleId: null,
  bundles: [],
  occupations: [],
};

type Action =
  | { type: 'SET_TEMPLATE_ID'; payload: string }
  | { type: 'SET_TEMPLATE_NAME'; payload: string }
  | { type: 'SET_TEMPLATE_DETAILS'; payload: { name: string; level: TemplateLevel | null } }
  | { type: 'SET_VERSION'; payload: number }
  | { type: 'SET_PARENT_PERMISSIONS'; payload: Map<string, Permissions> }
  | {
      type: 'SET_PERMISSION_LIMIT';
      payload: { activityId: string; occupationId: string; limit: PermissionLimit };
    }
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

    case 'SET_TEMPLATE_DETAILS':
      return { ...state, templateName: action.payload.name, level: action.payload.level };

    case 'SET_VERSION':
      return { ...state, version: action.payload };

    case 'SET_PARENT_PERMISSIONS':
      return { ...state, parentPermissions: action.payload };

    case 'SET_PERMISSION_LIMIT': {
      const { activityId, occupationId, limit } = action.payload;
      const key = getTemplatePermissionKey(activityId, occupationId);
      const newLimits = new Map(state.permissionLimits);
      newLimits.set(key, limit);
      return { ...state, permissionLimits: newLimits };
    }

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
      const key = getTemplatePermissionKey(activityId, occupationId);
      const newPermissions = new Map(state.permissions);
      newPermissions.set(key, permission);

      // Moving away from LC discards the limits: keeping them would silently
      // re-attach a stale restriction if the user later returned to LC.
      if (permission !== Permissions.LIMITS && state.permissionLimits.has(key)) {
        const newLimits = new Map(state.permissionLimits);
        newLimits.delete(key);
        return { ...state, permissions: newPermissions, permissionLimits: newLimits };
      }

      return { ...state, permissions: newPermissions };
    }

    case 'REMOVE_PERMISSION': {
      const { activityId, occupationId } = action.payload;
      const key = getTemplatePermissionKey(activityId, occupationId);
      const newPermissions = new Map(state.permissions);
      newPermissions.delete(key);
      const newLimits = new Map(state.permissionLimits);
      newLimits.delete(key);
      return { ...state, permissions: newPermissions, permissionLimits: newLimits };
    }

    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };

    case 'SET_SELECTED_BUNDLE_ID':
      return { ...state, selectedBundleId: action.payload };

    case 'INITIALIZE_STATE': {
      const initialized = { ...state, ...action.payload };
      const selectedBundleIds = action.payload.selectedBundleIds ?? state.selectedBundleIds;
      const selectedActivityIds = action.payload.selectedActivityIds ?? state.selectedActivityIds;
      const permissions = action.payload.permissions ?? state.permissions;
      const permissionLimits = action.payload.permissionLimits ?? state.permissionLimits;

      return {
        ...initialized,
        initialSelectedBundleIds: new Set(selectedBundleIds),
        initialSelectedActivityIds: new Set(selectedActivityIds),
        initialPermissions: snapshotPermissions(permissions, permissionLimits),
      };
    }

    default:
      return state;
  }
}

interface CareSettingsContextType {
  state: CareSettingsState;
  dispatch: React.Dispatch<Action>;
  getPermission: (activityId: string, occupationId: string) => Permissions | undefined;
  getPermissionsArray: () => PermissionEntry[];
  getTemplateChanges: () => TemplateChangesDTO;
  getPermissionLimit: (activityId: string, occupationId: string) => PermissionLimit | undefined;
  isChangedFromParent: (activityId: string, occupationId: string) => boolean;
}

const CareSettingsContext = createContext<CareSettingsContextType | null>(null);

export const CareSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const getPermission = (activityId: string, occupationId: string): Permissions | undefined => {
    return state.permissions.get(getTemplatePermissionKey(activityId, occupationId));
  };

  const getPermissionsArray = (): PermissionEntry[] => {
    const entries: PermissionEntry[] = [];
    state.permissions.forEach((permission, key) => {
      const [activityId, occupationId] = splitTemplatePermissionKey(key);
      // Only include Y and LC — the template system represents N as absence of a row
      if (permission !== Permissions.NO) {
        const limit =
          permission === Permissions.LIMITS ? state.permissionLimits.get(key) : undefined;
        entries.push({
          activityId,
          occupationId,
          permission,
          limitId: limit?.limitId,
          restrictionDescription: limit?.restrictionDescription,
        });
      }
    });
    return entries;
  };

  const getPermissionLimit = (activityId: string, occupationId: string) => {
    return state.permissionLimits.get(getTemplatePermissionKey(activityId, occupationId));
  };

  /**
   * Compares wizard state with its immutable loaded snapshot and returns every
   * required delta collection, including empty collections for unchanged areas.
   *
   * @returns The incremental request payload for the current wizard state.
   */
  const getTemplateChanges = (): TemplateChangesDTO => {
    const currentPermissions = snapshotPermissions(state.permissions, state.permissionLimits);
    const permissionUpserts: PermissionEntry[] = [];
    const permissionRemovals: { activityId: string; occupationId: string }[] = [];

    currentPermissions.forEach((permission, key) => {
      const initial = state.initialPermissions.get(key);
      if (!initial || !permissionsMatch(initial, permission)) {
        permissionUpserts.push(permission);
      }
    });

    state.initialPermissions.forEach((permission, key) => {
      if (!currentPermissions.has(key)) {
        permissionRemovals.push({
          activityId: permission.activityId,
          occupationId: permission.occupationId,
        });
      }
    });

    return {
      permissionUpserts,
      permissionRemovals,
      selectedBundleIdsToAdd: Array.from(state.selectedBundleIds).filter(
        id => !state.initialSelectedBundleIds.has(id),
      ),
      selectedBundleIdsToRemove: Array.from(state.initialSelectedBundleIds).filter(
        id => !state.selectedBundleIds.has(id),
      ),
      selectedActivityIdsToAdd: Array.from(state.selectedActivityIds).filter(
        id => !state.initialSelectedActivityIds.has(id),
      ),
      selectedActivityIdsToRemove: Array.from(state.initialSelectedActivityIds).filter(
        id => !state.selectedActivityIds.has(id),
      ),
    };
  };

  const isChangedFromParent = (activityId: string, occupationId: string): boolean => {
    // A template with no parent has nothing to differ from.
    if (!state.hasParent) return false;
    const key = getTemplatePermissionKey(activityId, occupationId);
    // Absence means "not permitted" on both sides, matching how the wizard
    // and the API both model N as a missing row.
    const mine = state.permissions.get(key) ?? Permissions.NO;
    const theirs = state.parentPermissions.get(key) ?? Permissions.NO;
    return mine !== theirs;
  };

  return (
    <CareSettingsContext.Provider
      value={{
        state,
        dispatch,
        getPermission,
        getPermissionsArray,
        getTemplateChanges,
        getPermissionLimit,
        isChangedFromParent,
      }}
    >
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
