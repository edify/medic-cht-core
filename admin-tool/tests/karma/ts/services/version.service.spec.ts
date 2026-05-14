import { TestBed } from '@angular/core/testing';
import { expect } from 'chai';
import { VersionService } from '@admin-tool-services/version.service';

describe('VersionService', () => {
  let service: VersionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VersionService);
  });

  describe('parse', () => {
    it('should return undefined for undefined input', () => {
        expect(service.parse(undefined)).to.be.undefined;
    });

    it('should return undefined for empty string', () => {
        expect(service.parse('')).to.be.undefined;
    });

    it('should return undefined for branch name', () => {
        expect(service.parse('master')).to.be.undefined;
    });

    it('should return undefined for branch with numbers', () => {
        expect(service.parse('10695-interaction-log')).to.be.undefined;
    });

    it('should parse a release version', () => {
        expect(service.parse('5.1.2')).to.deep.equal({ major: 5, minor: 1, patch: 2 });
    });

    it('should parse a beta version', () => {
        expect(service.parse('5.1.2-beta.2')).to.deep.equal({ major: 5, minor: 1, patch: 2, beta: 2 });
    });

    it('should parse a feature release version', () => {
        const result = service.parse('5.1.0-FR-myfeature');
        expect(result).to.deep.equal({ major: 5, minor: 1, patch: 0, featureRelease: 'FR-myfeature' });
    });

    it('should parse a feature release beta version', () => {
      const result = service.parse('5.1.0-FR-myfeature-beta.1');
      expect(result).to.deep.equal({ major: 5, minor: 1, patch: 0, featureRelease: 'FR-myfeature-beta' });
    });
  });
  describe('compare', () => {
    it('should return 0 for equal versions', () => {
      expect(service.compare(
        { major: 5, minor: 1, patch: 2 }, 
        { major: 5, minor: 1, patch: 2 })).to.equal(0);
    });

    it('should return positive when version1 major is greater', () => {
      expect(service.compare(
        { major: 6, minor: 0, patch: 0 }, 
        { major: 5, minor: 0, patch: 0 })).to.be.greaterThan(0);
    });

    it('should return negative when version1 major is lesser', () => {
      expect(service.compare(
        { major: 4, minor: 0, patch: 0 }, 
        { major: 5, minor: 0, patch: 0 })).to.be.lessThan(0);
    });

    it('should return positive when version1 minor is greater', () => {
      expect(service.compare(
        { major: 5, minor: 2, patch: 0 }, 
        { major: 5, minor: 1, patch: 0 })).to.be.greaterThan(0);
    });

    it('should return positive when version1 patch is greater', () => {
      expect(service.compare(
        { major: 5, minor: 1, patch: 2 }, 
        { major: 5, minor: 1, patch: 1 })).to.be.greaterThan(0);
    });

    it('should return 0 when both have no beta', () => {
      expect(service.compare(
        { major: 5, minor: 1, patch: 0 }, 
        { major: 5, minor: 1, patch: 0 })).to.equal(0);
    });

    it('should return negative when version1 has no beta and version2 has beta', () => {
      expect(service.compare(
        { major: 5, minor: 1, patch: 0 }, 
        { major: 5, minor: 1, patch: 0, beta: 1 })).to.be.lessThan(0);
    });

    it('should return positive when version1 has beta and version2 has no beta', () => {
      expect(service.compare(
        { major: 5, minor: 1, patch: 0, beta: 1 }, 
        { major: 5, minor: 1, patch: 0 })).to.be.greaterThan(0);
    });

    it('should return positive when version1 beta is greater', () => {
      expect(service.compare(
        { major: 5, minor: 1, patch: 0, beta: 2 }, 
        { major: 5, minor: 1, patch: 0, beta: 1 })).to.be.greaterThan(0);
    });

    it('should return negative when version1 beta is lesser', () => {
      expect(service.compare(
        { major: 5, minor: 1, patch: 0, beta: 1 }, 
        { major: 5, minor: 1, patch: 0, beta: 2 })).to.be.lessThan(0);
    });
  });
  describe('minimumNextRelease', () => {
    it('should increment patch for a release version', () => {
      expect(service.minimumNextRelease('5.1.0')).to.deep.equal({ major: 5, minor: 1, patch: 1 });
    });

    it('should increment beta for a beta version', () => {
      expect(service.minimumNextRelease('5.1.0-beta.2')).to.deep.equal({ major: 5, minor: 1, patch: 0, beta: 3 });
    });

    it('should return empty object for undefined input', () => {
      expect(service.minimumNextRelease(undefined)).to.deep.equal({});
    });

    it('should return empty object for unparseable version', () => {
      expect(service.minimumNextRelease('master')).to.deep.equal({});
    });

    it('should increment patch and not beta for release version', () => {
      const result = service.minimumNextRelease('5.1.2');
      expect(result.patch).to.equal(3);
      expect(result.beta).to.be.undefined;
    });
  });
  describe('potentiallyIncompatible', () => {
    const currentDeploy = {
      build: '5.1.0.22454960592',
      version: '5.1.0-local-development',
      base_version: '5.1.0',
    };

    it('should return false when release version is newer', () => {
      const release = { 
        build: '5.1.2.25216563202', 
        version: '5.1.2', 
        time: '2026-05-01T13:48:56.868Z', 
        base_version: '5.1.2' };
      expect(service.potentiallyIncompatible(release, currentDeploy)).to.be.false;
    });

    it('should return true when release version is older', () => {
      const release = { 
        build: '4.22.0.18399126672', 
        version: '4.22.0', 
        time: '2025-10-10T07:11:45.528Z', 
        base_version: '4.22.0' };
      expect(service.potentiallyIncompatible(release, currentDeploy)).to.be.true;
    });

    it('should return false when release version is equal to current', () => {
      const release = { 
        build: '5.1.0.22454960592', 
        version: '5.1.0', 
        time: '2026-02-26T18:14:38.710Z', 
        base_version: '5.1.0' };
      expect(service.potentiallyIncompatible(release, currentDeploy)).to.be.false;
    });

    it('should return true when release has no base_version and version is not parseable', () => {
      const release = { 
        build: '5.1.0-master.123', 
        version: 'master', 
        time: '2026-05-13T06:27:07.661Z' };
      expect(service.potentiallyIncompatible(release, currentDeploy)).to.be.true;
    });

    it('should return false when release has no base_version but version is parseable', () => {
      const release = { 
        build: '5.1.2.25216563202', 
        version: '5.1.2', 
        time: '2026-05-01T13:48:56.868Z' };
      expect(service.potentiallyIncompatible(release, currentDeploy)).to.be.false;
    });

    it('should return true when currentDeploy has no parseable version', () => {
      const release = { 
        build: '5.1.2.25216563202', 
        version: '5.1.2', 
        time: '2026-05-01T13:48:56.868Z', 
        base_version: '5.1.2' };
      expect(service.potentiallyIncompatible(release, { build: 'abc', version: 'local' })).to.be.true;
    });
  });
});
