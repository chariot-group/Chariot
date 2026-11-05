import GP from "@public/assets/pieces/golden-piece.svg";
import SP from "@public/assets/pieces/silver-piece.svg";
import EP from "@public/assets/pieces/electrum-piece.svg";
import PP from "@public/assets/pieces/platinum-piece.svg";
import CP from "@public/assets/pieces/copper-piece.svg";

export type CoinKey = "pp" | "gp" | "ep" | "sp" | "cp";

/** Coins in display order (pp → cp), shared by the read and edit Inventory cards. */
export const COIN_CONFIG = [
  { key: "pp", labelKey: "platinumPieces", shortKey: "pp", icon: PP },
  { key: "gp", labelKey: "goldPieces", shortKey: "gp", icon: GP },
  { key: "ep", labelKey: "electrumPieces", shortKey: "ep", icon: EP },
  { key: "sp", labelKey: "silverPieces", shortKey: "sp", icon: SP },
  { key: "cp", labelKey: "copperPieces", shortKey: "cp", icon: CP },
] as const satisfies ReadonlyArray<{ key: CoinKey; labelKey: string; shortKey: string; icon: typeof PP }>;

export type CoinOperation = "add" | "subtract" | "set";

/** Parses a typed amount: non-numeric or negative input becomes 0, decimals are floored. */
export function normalizeCoinAmount(rawValue: string): number {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

/** New coin count after an in-session operation; never below 0. */
export function nextCoinValue(current: number, rawAmount: string, operation: CoinOperation): number {
  const amount = normalizeCoinAmount(rawAmount);
  const safeCurrent = Math.max(0, current);
  if (operation === "add") return safeCurrent + amount;
  if (operation === "subtract") return Math.max(0, safeCurrent - amount);
  return amount;
}
