import { TransactionImpact } from '../types/calculations';
import { IPlayer } from '../types/models';
/**
 * Apply a transaction impact to a player state
 * Returns a NEW player state object (pure function, no mutations)
 */
export declare function applyTransactionImpact(playerState: IPlayer, impact: TransactionImpact): IPlayer;
/**
 * Reverse a transaction impact to create an undo impact
 */
export declare function reverseTransactionImpact(impact: TransactionImpact): TransactionImpact;
//# sourceMappingURL=impact.d.ts.map