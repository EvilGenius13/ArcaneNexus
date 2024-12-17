export interface ManifestFile {
  path: string;
  size: number;
  hash: string;
}

export interface Manifest {
  files: ManifestFile[];
  executablePath: string;
  version: string;
}

export interface ManifestResponse {
  success: boolean;
  data?: Manifest;
  updatesAvailable?: boolean;
  error?: string;
}
