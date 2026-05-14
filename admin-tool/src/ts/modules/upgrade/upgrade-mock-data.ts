import { VersionGroups } from '@admin-tool-modules/upgrade/upgrade-interfaces';

export const MOCK_VERSION_GROUPS: VersionGroups = {
  releases: [
    {
      build: '5.1.2.25216563202',
      version: '5.1.2',
      time: '2026-05-01T13:48:56.868Z',
      base_version: '5.1.2',
    },
    {
      build: '5.1.1.24142006295',
      version: '5.1.1',
      time: '2026-04-08T14:57:55.991Z',
      base_version: '5.1.1',
    },
    {
      build: '5.1.0.22454960592',
      version: '5.1.0',
      time: '2026-02-26T18:14:38.710Z',
      base_version: '5.1.0',
    },
    {
      build: '5.0.3.24141946854',
      version: '5.0.3',
      time: '2026-04-08T14:57:28.066Z',
      base_version: '5.0.3',
    },
    {
      build: '4.22.0.18399126672',
      version: '4.22.0',
      time: '2025-10-10T07:11:45.528Z',
      base_version: '4.22.0',
    },
  ],
  betas: [
    {
      build: '5.1.2-beta.2.25171260947',
      version: '5.1.2-beta.2',
      time: '2026-04-30T14:37:09.343Z',
      base_version: '5.1.2',
    },
    {
      build: '5.1.2-beta.1.25168846021',
      version: '5.1.2-beta.1',
      time: '2026-04-30T13:48:36.011Z',
      base_version: '5.1.2',
    },
    {
      build: '5.1.1-beta.2.24133950329',
      version: '5.1.1-beta.2',
      time: '2026-04-08T11:58:52.023Z',
      base_version: '5.1.1',
    },
  ],
  branches: [
    {
      build: '5.1.0-10695-interaction-log.25843938927-1778737490108',
      version: '10695-interaction-log',
      time: '2026-05-14T05:44:50.134Z',
      base_version: '5.1.0',
    },
    {
      build: '5.1.0-alpha.25782203317-1778653627631',
      version: 'master',
      time: '2026-05-13T06:27:07.661Z',
      base_version: '5.1.0',
    },
    {
      build: '5.1.2-5.1.x.25171261299-1777559810214',
      version: '5.1.x',
      time: '2026-04-30T14:36:50.238Z',
      base_version: '5.1.2',
    },
  ],
  featureReleases: [],
};