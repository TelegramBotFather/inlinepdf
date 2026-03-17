import type { PageSizeSelectId } from '~/platform/pdf/page-size-options';

export const SHIPPING_LABEL_BRANDS = ['meesho', 'amazon', 'flipkart'] as const;

export type ShippingLabelBrand = (typeof SHIPPING_LABEL_BRANDS)[number];

export const SHIPPING_LABEL_OUTPUT_PAGE_SIZES = [
  'auto',
  'a3',
  'a4',
  'a5',
  'b5',
  'envelope10',
  'envelopeChoukei3',
  'envelopeDl',
  'jisB5',
  'roc16k',
  'superBA3',
  'tabloid',
  'tabloidOversize',
  'legal',
  'letter',
] as const satisfies readonly PageSizeSelectId[];

export type ShippingLabelOutputPageSize =
  (typeof SHIPPING_LABEL_OUTPUT_PAGE_SIZES)[number];

export const SHIPPING_LABEL_SORT_DIRECTIONS = ['asc', 'desc'] as const;

export type ShippingLabelSortDirection =
  (typeof SHIPPING_LABEL_SORT_DIRECTIONS)[number];

export interface ShippingLabelSortOptions {
  pickupPartnerDirection: ShippingLabelSortDirection | null;
  skuDirection: ShippingLabelSortDirection | null;
}

export interface ShippingLabelExtractionResult {
  blob: Blob;
  fileName: string;
  pagesProcessed: number;
  labelsExtracted: number;
  pagesSkipped: number;
}

export interface ShippingLabelExtractionSummary {
  pagesProcessed: number;
  labelsExtracted: number;
  pagesSkipped: number;
  fileName: string;
}
