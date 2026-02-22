export interface MergeInputFile {
  id: string;
  file: File;
}

export interface MergeResult {
  blob: Blob;
  fileName: string;
}
