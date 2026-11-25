export const HOW_KEYS = [
  's1', 's2', 's3', 'shop', 'brand', 'brandSub', 'scanTitle', 'wallet1', 'wallet2', 'url',
  'camSlo', 'camVideo', 'cam', 'camPortrait', 'camPano',
  'joinTitle', 'joinSub', 'rewardLabel', 'reward', 'namePh', 'nameVal', 'bdayLabel', 'bdayPh', 'bdayVal',
  'consent', 'consentLink', 'addTo', 'pickCancel', 'pickDone', 'months',
  'walletTitle', 'cardLabel', 'fReward', 'fBy', 'byVal', 'fProgress', 'progress',
  'scannerTitle', 'giveStamp', 'giveStampSub', 'redeem', 'redeemSub', 'modeLabel', 'modeHint', 'manual', 'scanHint',
  'stampAdded', 'rewardTitle', 'rewardBody', 'now', 'minAgo', 'lockDate',
  'n1t', 'n1b', 'n2t', 'n2b', 'n3t', 'n3b', 'phoneLabel',
] as const;

export type HowCopy = Record<(typeof HOW_KEYS)[number], string>;
