export const GIVEAWAY_BASE_CHANCES = 1
export const GIVEAWAY_TELEGRAM_CHANCES = 1
export const GIVEAWAY_SHARE_CHANCES = 2
export const GIVEAWAY_REFERRAL_CHANCES = 3

export function totalGiveawayChances(bonusChances = 0) {
  return GIVEAWAY_BASE_CHANCES + GIVEAWAY_TELEGRAM_CHANCES + Math.max(0, Number(bonusChances) || 0)
}
