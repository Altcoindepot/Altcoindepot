/**
 * Snapshot of metrics shown on https://www.reppostats.com/ (ReppoStats has no public JSON API yet).
 * Update fields here when you want the REPPO coin page to match the live dashboard.
 */
export type ReppoDatanetRow = {
  name: string;
  networkSharePct: number;
  evoFi: string;
  volumeTraded: string;
  agreements: string;
  disagreements: string;
  emissionsPerEpoch: string;
};

export type ReppoStatsSnapshot = {
  sourceUrl: string;
  /** Shown in UI — edit when you refresh the snapshot */
  lastUpdatedNote: string;
  users: {
    weekOverWeekPct: number;
    newThisWeek: number;
    /** Normalized 0–100 series for a sparkline (shape inspired by ReppoStats user chart) */
    activitySeries: number[];
    /** Total users count as shown on ReppoStats hero (e.g. 90.97K) — optional until live fetch runs */
    totalUsersDisplay?: string;
  };
  headlineUsd: {
    /** Large headline figure for REPPO locked (e.g. 132.65M), same as ReppoStats */
    totalReppoLocked: string;
    totalReppoLockedUsd: string;
    /** Volume traded headline + USD line — mirrors ReppoStats cards */
    totalVolumeTraded: string;
    totalVolumeTradedUsd: string;
    volumeSubline: string;
  };
  /** Community sentiment score 0–100 from ReppoStats gauge when live data loads */
  sentimentScore?: number | null;
  locks: {
    totalLocks: string;
    avgLockPerUser: string;
    avgLockUsd: string;
    communityLockPctOfCirculating: number;
    governanceLockPctOfCirculating: number;
    lockRateBlurb: string;
    communityReppo: string;
    governanceReppo: string;
    totalLockedReppo: string;
    totalLockedUsd: string;
    tvlGovernanceReppo: string;
    tvlGovernanceUsd: string;
    tvlUsersReppo: string;
    tvlUsersUsd: string;
  };
  fees: {
    totalCollectedReppo: string;
    totalCollectedUsd: string;
    burntReppo: string;
    burntPct: number;
    performancePoolReppo: string;
    performancePct: number;
    lockedReppo: string;
    lockedPct: number;
  };
  datanetV2: {
    totalVolumeTraded: string;
    totalVolumeUsd: string;
    totalAgreements: string;
    agreementsUsd: string;
    totalDisagreements: string;
    disagreementsUsd: string;
    emissionsPerEpochReppo: string;
    emissionsPerEpochUsd: string;
  };
  datanets: ReppoDatanetRow[];
};

export const REPPO_STATS_SNAPSHOT: ReppoStatsSnapshot = {
  sourceUrl: "https://www.reppostats.com/",
  lastUpdatedNote: "Figures aligned with ReppoStats as of May 3, 2026. No live API — update lib/reppo-stats-data.ts to refresh.",
  users: {
    weekOverWeekPct: 5.0,
    newThisWeek: 84,
    totalUsersDisplay: "90.97K",
    activitySeries: [
    100, 96, 92, 88, 84, 80, 77, 74, 72, 69, 67, 65, 64, 62, 59, 57, 56, 55, 54, 53, 52, 51, 50, 48, 46, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 25, 23, 21, 19, 17, 14, 11, 8, 5, 3, 1, 0,
  ],
  },
  headlineUsd: {
    totalReppoLocked: "132.65M",
    totalReppoLockedUsd: "$2.89M USD",
    totalVolumeTraded: "232.61M",
    totalVolumeTradedUsd: "~$5.13M USD",
    volumeSubline: "Across all Datanets in V2",
  },
  sentimentScore: null,
  locks: {
    totalLocks: "1.12K",
    avgLockPerUser: "1.46K",
    avgLockUsd: "$31.81",
    communityLockPctOfCirculating: 6.9,
    governanceLockPctOfCirculating: 30.4,
    lockRateBlurb:
      "6.9% of circulating REPPO is voluntarily locked by community members, a strong signal of long-term conviction. Combined with 30.4% governance-locked supply, over 37% of circulating tokens are off the market, significantly reducing sell-side pressure.",
    communityReppo: "24.65M REPPO",
    governanceReppo: "108.00M REPPO",
    totalLockedReppo: "132.65M",
    totalLockedUsd: "$2.89M",
    tvlGovernanceReppo: "108.00M REPPO",
    tvlGovernanceUsd: "$2.36M",
    tvlUsersReppo: "24.65M REPPO",
    tvlUsersUsd: "$537.79K",
  },
  fees: {
    totalCollectedReppo: "260.00K REPPO",
    totalCollectedUsd: "$5.67K",
    burntReppo: "26.00K REPPO",
    burntPct: 10,
    performancePoolReppo: "104.00K REPPO",
    performancePct: 40,
    lockedReppo: "130.00K REPPO",
    lockedPct: 50,
  },
  datanetV2: {
    totalVolumeTraded: "232.61M",
    totalVolumeUsd: "~$5.13M",
    totalAgreements: "207.79M",
    agreementsUsd: "~$4.58M",
    totalDisagreements: "24.81M",
    disagreementsUsd: "~$546.71K",
    emissionsPerEpochReppo: "41.80K REPPO",
    emissionsPerEpochUsd: "$911.87",
  },
  datanets: [
    {
      name: "Whoami.wiki",
      networkSharePct: 32.7,
      evoFi: "50.00",
      volumeTraded: "76.15M",
      agreements: "70.03M",
      disagreements: "6.12M",
      emissionsPerEpoch: "2.50K REPPO",
    },
    {
      name: "Geopolitical Flashpoint and Misinfo Detection",
      networkSharePct: 27.7,
      evoFi: "50.00",
      volumeTraded: "64.42M",
      agreements: "62.91M",
      disagreements: "1.51M",
      emissionsPerEpoch: "5.00K REPPO",
    },
    {
      name: "Adult Entertainment",
      networkSharePct: 14.5,
      evoFi: "50.00",
      volumeTraded: "33.65M",
      agreements: "22.19M",
      disagreements: "11.46M",
      emissionsPerEpoch: "2.50K REPPO",
    },
    {
      name: "DSCLabs | Strike Robot - Industrial Video Annotation for Robotic Vision",
      networkSharePct: 7.4,
      evoFi: "50.00",
      volumeTraded: "17.28M",
      agreements: "16.32M",
      disagreements: "961.91K",
      emissionsPerEpoch: "6.00K REPPO",
    },
    {
      name: "Spicenet",
      networkSharePct: 5.8,
      evoFi: "50.00",
      volumeTraded: "13.53M",
      agreements: "12.91M",
      disagreements: "622.36K",
      emissionsPerEpoch: "5.00K REPPO",
    },
    {
      name: "TradingGym AI",
      networkSharePct: 4.1,
      evoFi: "50.00",
      volumeTraded: "9.57M",
      agreements: "8.05M",
      disagreements: "1.52M",
      emissionsPerEpoch: "5.00K REPPO",
    },
    {
      name: "CineForge | Flawless 3-10s Character-in-Environment Video Clips for AI Training",
      networkSharePct: 2.7,
      evoFi: "50.00",
      volumeTraded: "6.22M",
      agreements: "6.19M",
      disagreements: "28.92K",
      emissionsPerEpoch: "2.50K REPPO",
    },
    {
      name: "Tokenomics Assessment Agent",
      networkSharePct: 2.5,
      evoFi: "50.00",
      volumeTraded: "5.90M",
      agreements: "4.97M",
      disagreements: "932.30K",
      emissionsPerEpoch: "5.00K REPPO",
    },
    {
      name: "Sports Highlights: Quality Signal",
      networkSharePct: 2.0,
      evoFi: "50.00",
      volumeTraded: "4.60M",
      agreements: "2.99M",
      disagreements: "1.61M",
      emissionsPerEpoch: "6.00K REPPO",
    },
    {
      name: "Root Datanet",
      networkSharePct: 0.4,
      evoFi: "50.00",
      volumeTraded: "855.80K",
      agreements: "813.99K",
      disagreements: "41.81K",
      emissionsPerEpoch: "—",
    },
    {
      name: "The Strategy Exchange",
      networkSharePct: 0.2,
      evoFi: "50.00",
      volumeTraded: "377.55K",
      agreements: "375.95K",
      disagreements: "1.60K",
      emissionsPerEpoch: "500 REPPO",
    },
    {
      name: "Smart Money Signal",
      networkSharePct: 0.0,
      evoFi: "50.00",
      volumeTraded: "38.12K",
      agreements: "38.12K",
      disagreements: "0",
      emissionsPerEpoch: "1.80K REPPO",
    },
    {
      name: "Oracle Of Preferences ZK (OOPZ)",
      networkSharePct: 0.0,
      evoFi: "50.00",
      volumeTraded: "0",
      agreements: "0",
      disagreements: "0",
      emissionsPerEpoch: "—",
    },
  ],
};
