import { describe, expect, it } from 'vitest';

import { toolsRegistry } from '~/features/tools/registry';

describe('tools registry', () => {
  it('has unique slugs and canonical paths', () => {
    const slugSet = new Set<string>();
    const pathSet = new Set<string>();

    for (const tool of toolsRegistry) {
      expect(tool.path.startsWith('/')).toBe(true);
      expect(tool.path.startsWith('/tools/')).toBe(false);
      expect(slugSet.has(tool.slug)).toBe(false);
      expect(pathSet.has(tool.path)).toBe(false);
      slugSet.add(tool.slug);
      pathSet.add(tool.path);
    }
  });

  it('contains both ready and planned tools', () => {
    expect(toolsRegistry.some((tool) => tool.status === 'ready')).toBe(true);
    expect(toolsRegistry.some((tool) => tool.status !== 'ready')).toBe(true);
  });
});
