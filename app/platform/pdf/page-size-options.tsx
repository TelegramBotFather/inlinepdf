/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react';

export interface StandardPageSizeOption {
  label: string;
  dimensionsLabel: string;
  widthMm?: number;
  heightMm?: number;
}

export const STANDARD_PAGE_SIZE_OPTIONS = {
  a3: {
    label: 'A3',
    dimensionsLabel: '297 by 420 mm',
    widthMm: 297,
    heightMm: 420,
  },
  a4: {
    label: 'A4',
    dimensionsLabel: '210 by 297 mm',
    widthMm: 210,
    heightMm: 297,
  },
  a5: {
    label: 'A5',
    dimensionsLabel: '148 by 210 mm',
    widthMm: 148,
    heightMm: 210,
  },
  b5: {
    label: 'B5',
    dimensionsLabel: '176 by 250 mm',
    widthMm: 176,
    heightMm: 250,
  },
  envelope10: {
    label: 'Envelope #10',
    dimensionsLabel: '105 by 241 mm',
    widthMm: 105,
    heightMm: 241,
  },
  envelopeChoukei3: {
    label: 'Envelope Choukei 3',
    dimensionsLabel: '120 by 235 mm',
    widthMm: 120,
    heightMm: 235,
  },
  envelopeDl: {
    label: 'Envelope DL',
    dimensionsLabel: '110 by 220 mm',
    widthMm: 110,
    heightMm: 220,
  },
  jisB5: {
    label: 'JIS B5',
    dimensionsLabel: '182 by 257 mm',
    widthMm: 182,
    heightMm: 257,
  },
  roc16k: {
    label: 'ROC 16K',
    dimensionsLabel: '197 by 273 mm',
    widthMm: 197,
    heightMm: 273,
  },
  superBA3: {
    label: 'Super B/A3',
    dimensionsLabel: '330 by 483 mm',
    widthMm: 330,
    heightMm: 483,
  },
  tabloid: {
    label: 'Tabloid',
    dimensionsLabel: '279 by 432 mm',
    widthMm: 279,
    heightMm: 432,
  },
  tabloidOversize: {
    label: 'Tabloid Oversize',
    dimensionsLabel: '305 by 457 mm',
    widthMm: 305,
    heightMm: 457,
  },
  legal: {
    label: 'US Legal',
    dimensionsLabel: '216 by 356 mm',
    widthMm: 216,
    heightMm: 356,
  },
  letter: {
    label: 'US Letter',
    dimensionsLabel: '216 by 279 mm',
    widthMm: 216,
    heightMm: 279,
  },
} as const satisfies Record<string, StandardPageSizeOption>;

export type StandardPageSizeId = keyof typeof STANDARD_PAGE_SIZE_OPTIONS;

export const STANDARD_PAGE_SIZE_IDS = [
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
] as const satisfies readonly StandardPageSizeId[];

export const AUTO_PAGE_SIZE_ID = 'auto' as const;

export type PageSizeSelectId = typeof AUTO_PAGE_SIZE_ID | StandardPageSizeId;

export const SHIPPING_LABEL_PAGE_SIZE_IDS = [
  AUTO_PAGE_SIZE_ID,
  ...STANDARD_PAGE_SIZE_IDS,
] as const satisfies readonly PageSizeSelectId[];

export function isStandardPageSizeId(
  value: string,
): value is StandardPageSizeId {
  return STANDARD_PAGE_SIZE_IDS.includes(value as StandardPageSizeId);
}

export function isPageSizeSelectId(value: string): value is PageSizeSelectId {
  return value === AUTO_PAGE_SIZE_ID || isStandardPageSizeId(value);
}

function millimetersToPoints(value: number): number {
  return Math.round((value * 72) / 25.4);
}

export function getPageSizeDimensionsInPoints(value: StandardPageSizeId): {
  width: number;
  height: number;
} {
  const option = STANDARD_PAGE_SIZE_OPTIONS[value];

  if (
    typeof option.widthMm !== 'number' ||
    typeof option.heightMm !== 'number'
  ) {
    throw new Error(`Missing physical dimensions for page size ${value}.`);
  }

  return {
    width: millimetersToPoints(option.widthMm),
    height: millimetersToPoints(option.heightMm),
  };
}

export function getPageSizeOptionLabel(value: PageSizeSelectId): ReactNode {
  if (value === AUTO_PAGE_SIZE_ID) {
    return 'Auto';
  }

  return PageSizeOptionLabel(STANDARD_PAGE_SIZE_OPTIONS[value]);
}

export function PageSizeOptionLabel({
  label,
  dimensionsLabel,
}: StandardPageSizeOption): ReactNode {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span>{label}</span>
      <span className="text-muted-foreground">{dimensionsLabel}</span>
    </span>
  );
}
