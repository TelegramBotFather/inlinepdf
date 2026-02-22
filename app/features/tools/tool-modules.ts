import { lazy } from 'react';

import type { ToolSlug } from './registry';
import type { ToolDefinition } from './types';

export interface ToolModuleRenderProps {
  tool: ToolDefinition;
}

export interface ToolModuleRunInput {
  files: File[];
  options?: Record<string, unknown>;
}

export interface ToolModule {
  meta: {
    title: string;
    description: string;
  };
  renderWorkspaceContent: (props: ToolModuleRenderProps) => React.ReactElement;
  run: (
    input: ToolModuleRunInput,
    options?: Record<string, unknown>,
  ) => Promise<unknown>;
}

type ToolModuleLoader = () => Promise<{ default: ToolModule }>;
type ToolRenderer = (props: ToolModuleRenderProps) => React.ReactElement;

export const toolModuleLoaders: Partial<Record<ToolSlug, ToolModuleLoader>> = {
  merge: async () => import('~/features/merge/tool-module'),
  info: async () => import('~/features/pdf-info/tool-module'),
};

export const lazyToolRenderers: Partial<
  Record<ToolSlug, React.LazyExoticComponent<ToolRenderer>>
> = {
  merge: lazy(async () => {
    const module = await import('~/features/merge/tool-module');
    return {
      default: (props: ToolModuleRenderProps) =>
        module.default.renderWorkspaceContent(props),
    };
  }),
  info: lazy(async () => {
    const module = await import('~/features/pdf-info/tool-module');
    return {
      default: (props: ToolModuleRenderProps) =>
        module.default.renderWorkspaceContent(props),
    };
  }),
};

export async function loadToolModule(slug: string): Promise<ToolModule | null> {
  if (!(slug in toolModuleLoaders)) {
    return null;
  }

  const loader = toolModuleLoaders[slug as ToolSlug];
  if (!loader) {
    return null;
  }

  const module = await loader();
  return module.default;
}

export function getLazyToolRenderer(
  slug: string,
): React.LazyExoticComponent<ToolRenderer> | null {
  if (!(slug in lazyToolRenderers)) {
    return null;
  }

  return lazyToolRenderers[slug as ToolSlug] ?? null;
}
