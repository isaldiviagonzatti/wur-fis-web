/**
 * What the planner page shares with the nodes on its board, which Svelte Flow
 * renders out of the page's reach: the plan's objective and the elements the
 * review suggests. The page sets it once; nodes read it reactively.
 *
 * { objective, setObjective(text), suggested: Set<elementId> }
 */
import { createContext } from 'svelte';

export const [getPlanner, setPlanner] = createContext();
