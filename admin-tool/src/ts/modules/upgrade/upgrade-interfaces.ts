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
