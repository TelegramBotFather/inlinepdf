import { describe, expect, it } from 'vitest';

import { loader } from './well-known.appspecific.devtools';

describe('well-known.appspecific.devtools loader', () => {
  it('returns a small cacheable JSON response', async () => {
    const response = loader();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'application/json; charset=utf-8',
    );
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=300');
    expect(await response.text()).toBe('{}');
  });
});
