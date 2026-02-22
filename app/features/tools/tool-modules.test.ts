import { describe, expect, it } from 'vitest';

import {
  loadToolModule,
  toolModuleLoaders,
} from '~/features/tools/tool-modules';

describe('tool modules', () => {
  it('registers loaders for currently ready tools', () => {
    expect(Object.keys(toolModuleLoaders).sort()).toEqual(['info', 'merge']);
  });

  it('does not load modules for non-ready tools', async () => {
    const module = await loadToolModule('split');

    expect(module).toBeNull();
  });
});
