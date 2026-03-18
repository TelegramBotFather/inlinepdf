import PdfToImagesToolIcon from '@hugeicons/core-free-icons/ImageDownloadIcon';

import type { ToolDefinition } from '~/tools/catalog/definitions';

export const pdfToImagesToolDefinition = {
  id: 'pdf-to-images',
  slug: 'pdf-to-images',
  path: '/pdf-to-images',
  title: 'PDF to Images',
  shortDescription: 'Export PDF pages as image files in a ZIP archive.',
  navGroup: 'Convert',
  icon: PdfToImagesToolIcon,
  availability: 'available',
} satisfies ToolDefinition;
