import { describe, expect, it } from 'vitest';

import { loader as legacyToolSlugLoader } from '~/routes/legacy.tools-slug';
import { loader as devtoolsWellKnownLoader } from '~/routes/well-known.appspecific.devtools';

describe('legacy route redirects', () => {
  it('redirects /tools/merge to /merge', () => {
    const response = legacyToolSlugLoader({
      params: { toolSlug: 'merge' },
      context: {},
      request: new Request('http://localhost/tools/merge'),
      unstable_pattern: '/tools/:toolSlug',
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/merge');
  });

  it('redirects /tools/info to /info', () => {
    const response = legacyToolSlugLoader({
      params: { toolSlug: 'info' },
      context: {},
      request: new Request('http://localhost/tools/info'),
      unstable_pattern: '/tools/:toolSlug',
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/info');
  });

  it('serves the devtools well-known route', async () => {
    const response = devtoolsWellKnownLoader();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    await expect(response.text()).resolves.toBe('{}');
  });
});
