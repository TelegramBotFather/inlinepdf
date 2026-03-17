import { File01Icon } from '@hugeicons/core-free-icons';

import type { ToolDefinition } from '~/tools/catalog/definitions';

export const meeshoShippingLabelsToolDefinition = {
  id: 'meesho-shipping-labels',
  slug: 'meesho-shipping-labels',
  path: '/meesho-labels',
  title: 'Meesho Label Extractor',
  shortDescription:
    'Extract Meesho shipping labels with Meesho-specific rules.',
  navGroup: 'Extract',
  icon: File01Icon,
  availability: 'available',
} satisfies ToolDefinition;

export const amazonShippingLabelsToolDefinition = {
  id: 'amazon-shipping-labels',
  slug: 'amazon-shipping-labels',
  path: '/amazon-labels',
  title: 'Amazon Label Extractor',
  shortDescription: 'Prepare for Amazon-specific shipping label extraction.',
  navGroup: 'Extract',
  icon: File01Icon,
  availability: 'available',
} satisfies ToolDefinition;

export const flipkartShippingLabelsToolDefinition = {
  id: 'flipkart-shipping-labels',
  slug: 'flipkart-shipping-labels',
  path: '/flipkart-labels',
  title: 'Flipkart Label Extractor',
  shortDescription: 'Prepare for Flipkart-specific shipping label extraction.',
  navGroup: 'Extract',
  icon: File01Icon,
  availability: 'available',
} satisfies ToolDefinition;
