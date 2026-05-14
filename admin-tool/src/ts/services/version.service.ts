import { Injectable } from '@angular/core';
import { Build, DeployInfo, ParsedVersion } from '@admin-tool-modules/upgrade/upgrade-interfaces';

@Injectable({
  providedIn: 'root'
})
export class VersionService {

  constructor() {}

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

  minimumNextRelease(version: string | undefined): ParsedVersion {
    const minVersion = this.parse(version);
    if(!minVersion) {
      return {} as ParsedVersion;
    }
    if (minVersion.beta !== undefined) {
      minVersion.beta++;
    } else if (minVersion.patch !== undefined) {
      minVersion.patch++;
    }
    return minVersion;
  }

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