/**
 * Represents the deployment information of the currently running CHT instance.
 * Returned by GET /api/deploy-info.
 * build is the full build identifier including the build number.
 * version is the full version string including environment suffixes (e.g. '5.1.0-local-development').
 * base_version is the clean semver string used for version comparisons (e.g. '5.1.0').
 * author is the name of who published the build.
 * user is the name of who deployed the instance.
 * time is the ISO date string of when the build was created.
 * timestamp is the Unix timestamp in milliseconds of when the instance was deployed.
 * application, namespace and schema_version are metadata fields returned by the API.
 */
export interface DeployInfo {
  build: string;
  version: string;
  base_version?: string;
  author?: string;
  user?: string;
  time?: string;
  timestamp?: number;
  application?: string;
  namespace?: string;
  schema_version?: number;
}

/**
 * Represents a single available build returned by the builds database.
 * version is the human-readable identifier shown in the UI.
 * For releases: clean semver (e.g. '5.1.2').
 * For betas: semver with beta suffix (e.g. '5.1.2-beta.2').
 * For branches: branch name (e.g. 'master', '10695-interaction-log').
 * build is the full internal build identifier.
 * time is the ISO date string of when the build was created.
 * base_version is the clean semver used for compatibility checks, optional
 * because old builds may not include it.
 */
export interface Build {
  build: string;
  version: string;
  time: string;
  base_version?: string;
  compare?: IndexingDifference[];
  requiresIndexing?: boolean;
}

export interface IndexingDifference {
  db: string;
  ddoc: string;
  type: string[];
  size: number;
  indexing: boolean;
}

export interface UpgradeHistoryEntry {
  state: string;
  date: string;
}

export interface UpgradeDoc {
  action: string;
  state: string;
  state_history: UpgradeHistoryEntry[];
  to: Build;
}

export interface IndexerProgress {
  database: string;
  ddoc: string;
  progress: number;
  type?: string;
}

/**
 * Groups available builds by type for display in the upgrade page.
 * releases are stable tagged versions (e.g. 5.1.2).
 * betas are pre-release versions (e.g. 5.1.2-beta.2).
 * branches are CI builds from active branches.
 * featureReleases are builds from Feature Release branches, only present
 * when the current deploy is running a Feature Release version.
 */
export interface VersionGroups {
  releases: Build[];
  betas: Build[];
  branches: Build[];
  featureReleases: Build[];
}

/**
 * Represents a parsed semantic version string.
 * Used internally by VersionService to compare and calculate minimum next releases.
 * major, minor and patch are always present when the version string is valid.
 * beta is only present for pre-release versions (e.g. 5.1.2-beta.2).
 * featureRelease is only present for Feature Release versions (e.g. 5.1.0-FR-myfeature).
 * For a Feature Release beta, featureRelease includes the '-beta' suffix (e.g. 'FR-myfeature-beta').
 */
export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  beta?: number;
  featureRelease?: string;
}
