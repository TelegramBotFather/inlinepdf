import type { ToolDefinition } from './types';

export const toolsRegistry: readonly ToolDefinition[] = [
  {
    id: 'merge-pdf',
    title: 'Merge PDF',
    path: '/merge',
    description:
      'Combine PDFs in the order you choose directly in your browser.',
    status: 'ready',
    category: 'organize',
    localOnly: true,
  },
  {
    id: 'pdf-info',
    title: 'PDF Info',
    path: '/info',
    description:
      'Extract metadata, producer/creator fields, and font insights locally.',
    status: 'ready',
    category: 'advanced',
    localOnly: true,
  },
  {
    id: 'split-pdf',
    title: 'Split PDF',
    path: '/split',
    description: 'Extract pages or ranges into separate files.',
    status: 'coming_soon',
    category: 'organize',
    localOnly: true,
  },
  {
    id: 'crop-pdf',
    title: 'Crop PDF',
    path: '/crop',
    description: 'Crop page margins or selected regions without file transfer.',
    status: 'coming_soon',
    category: 'optimize',
    localOnly: true,
  },
] as const;

export function getToolById(toolId: string): ToolDefinition | undefined {
  return toolsRegistry.find((tool) => tool.id === toolId);
}
