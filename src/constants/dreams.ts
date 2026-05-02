import { dreams as sharedDreams } from '@cashflow/shared'
import type { IDream } from '@cashflow/shared'

/**
 * Frontend Dream type. Same shape as the shared `IDream` — re-exported as
 * `Dream` for ergonomic imports (`import type { Dream } from '@/constants/dreams'`).
 * Previously this file kept a hand-keyed copy of the dream list which had
 * to stay in sync with `shared/src/data/dreams.ts` by hand. The constant is
 * now a direct re-export of the shared data.
 */
export type Dream = IDream

export const DREAMS: Dream[] = sharedDreams
