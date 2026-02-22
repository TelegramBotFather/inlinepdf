import type { LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';

export function loader({ params }: LoaderFunctionArgs) {
  const toolSlug = params.toolSlug;

  if (!toolSlug) {
    return redirect('/tools');
  }

  return redirect(`/${toolSlug}`);
}

export default function LegacyToolSlugRoute() {
  return null;
}
