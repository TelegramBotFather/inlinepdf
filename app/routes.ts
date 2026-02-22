import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('merge', 'routes/tools.merge-pdf.tsx'),
  route('info', 'routes/tools.pdf-info.tsx'),
  route('privacy', 'routes/privacy.tsx'),
  route('terms', 'routes/terms.tsx'),
] satisfies RouteConfig;
