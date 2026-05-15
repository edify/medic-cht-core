import { Injectable } from '@angular/core';
import { Build, DeployInfo, ParsedVersion } from '@admin-tool-modules/upgrade/upgrade-interfaces';

/**
 * Service responsible for parsing and comparing CHT version strings.
 * Provides utilities to determine version compatibility and calculate
 * the minimum next release for a given version.
 * Contains no external dependencies — all methods are pure functions.
 */
@Injectable({
  providedIn: 'root'
})
export class VersionService {

  constructor() {}

  /**
   * Parses a version string into a structured object.
   * Accepts release (e.g. '5.1.2'), beta (e.g. '5.1.2-beta.2'),
   * and Feature Release (e.g. '5.1.0-FR-myfeature') formats.
   * Returns undefined if the string is undefined, empty, or does not
   * match the expected semver format — branch names like 'master' or
   * '10695-interaction-log' will return undefined.
   *
   * @param {string | undefined} versionString - the version string to parse
   * @returns {ParsedVersion | undefined}
   */
  parse(versionString: string | undefined): ParsedVersion | undefined {
    if (!versionString) {
      return undefined;
    }
    const versionMatch = versionString.match(
      /^(\d+)\.(\d+)\.(\d+)(-FR(?:-\w+)+)?(?:-beta\.(\d+))?(\.(\d+))?$/
    );
    if (!versionMatch) {
      return undefined;
    }
    const version: ParsedVersion = {
      major: parseInt(versionMatch[1]),
      minor: parseInt(versionMatch[2]),
      patch: parseInt(versionMatch[3])
    };
    if (versionMatch[5] !== undefined ) {
      version.beta = parseInt(versionMatch[5]);
    }
    if (versionMatch[4] !== undefined) {
      version.featureRelease = versionMatch[4].slice(1);
      if (version.beta) {
        version.featureRelease += '-beta';
      }
    }
    return version;
  }

  /**
   * Compares two parsed versions and returns a number indicating their relative order.
   * Returns negative if version1 is greater than version2, positive if version1 is lesser,
   * and 0 if they are equal. A release is considered greater than a beta of the same version.
   *
   * @param {ParsedVersion} version1 - the first version to compare
   * @param {ParsedVersion} version2 - the second version to compare
   * @returns {number}
   */
  compare(version1: ParsedVersion, version2: ParsedVersion): number {
    const parts: (keyof ParsedVersion)[] = ['major', 'minor', 'patch'];
    for (const part of parts) {
      if (version1[part] !== version2[part]) {
        return (version1[part] as number) - (version2[part] as number);
      }
    }
    if (version1.beta === undefined && version2.beta === undefined) {
      return 0;
    }
    if (version1.beta === undefined && version2.beta !== undefined) {
      return -1;
    }
    if (version1.beta !== undefined && version2.beta === undefined) {
      return 1;
    }
    return version1.beta! - version2.beta!;
  }

  /**
   * Calculates the minimum version that would be a valid next release
   * given the currently installed version string.
   * If the current version is a beta, increments the beta number.
   * If the current version is a release, increments the patch number.
   * Returns an empty ParsedVersion if the version string cannot be parsed.
   *
   * @param {string | undefined} version - the current version string
   * @returns {ParsedVersion}
   */
  minimumNextRelease(version: string | undefined): ParsedVersion {
    const minVersion = this.parse(version);
    if (!minVersion) {
      return {} as ParsedVersion;
    }
    if (minVersion.beta !== undefined) {
      minVersion.beta++;
    } else if (minVersion.patch !== undefined) {
      minVersion.patch++;
    }
    return minVersion;
  }

  /**
   * Determines whether a given build is potentially incompatible with the current deploy.
   * Returns true if the build version is older than the current deploy version,
   * if the build has no base_version and its version string is not parseable,
   * or if the current deploy version cannot be parsed.
   * Used to display a warning icon next to potentially incompatible builds in the UI.
   *
   * @param {Build} release - the build to check
   * @param {DeployInfo} currentDeploy - the currently running deploy information
   * @returns {boolean}
   */
  potentiallyIncompatible(release: Build, currentDeploy: DeployInfo): boolean {
    if (!release.base_version && !this.parse(release.version)) {
      return true;
    }
    const currentVersion = this.parse(currentDeploy.base_version || currentDeploy.version);
    if (!currentVersion) {
      return true;
    }
    const releaseVersion = this.parse(release.base_version || release.version);
    return this.compare(currentVersion, releaseVersion!) > 0;
  }
}
