export type CropStep = 'select' | 'crop';

export type CropPreset =
  | 'free'
  | 'a3'
  | 'a4'
  | 'a5'
  | 'b5'
  | 'envelope10'
  | 'envelopeChoukei3'
  | 'envelopeDl'
  | 'jisB5'
  | 'roc16k'
  | 'superBA3'
  | 'tabloid'
  | 'tabloidOversize'
  | 'legal'
  | 'letter'
  | '1:1'
  | '4:3'
  | '16:9';

export type CropInteractionMode = 'crop' | 'pan';

export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type PageCropState = Record<number, NormalizedRect | null>;

export interface CropRunOptions {
  selectedPages: number[];
  pageCrops: PageCropState;
}

export interface CropResult {
  blob: Blob;
  fileName: string;
  pagesExported: number;
}

export interface CropPagePreview {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
  thumbnailDataUrl: string | null;
}

export interface CropDocumentPreview {
  pageCount: number;
  pages: CropPagePreview[];
}
