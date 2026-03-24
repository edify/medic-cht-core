export interface IRole {
  name: string;
  offline?: boolean;
}

export type RolesMap = Record<string, IRole>;

export interface INewRole {
  key?: string;
  name?: string;
  offline?: boolean;
}

export interface IRoleValidation {
  key?: string;
  name?: string;
}
