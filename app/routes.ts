import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route(
    '.well-known/appspecific/com.chrome.devtools.json',
    'routes/well-known.appspecific.devtools.ts',
  ),
  route('tools', 'routes/tools._index.tsx'),
  route('tools/:toolSlug', 'routes/legacy.tools-slug.tsx'),
  route(':toolSlug', 'routes/tools.$toolSlug.tsx'),
  route('privacy', 'routes/privacy.tsx'),
  route('terms', 'routes/terms.tsx'),
  route('*', 'routes/catchall.tsx'),
] satisfies RouteConfig;
