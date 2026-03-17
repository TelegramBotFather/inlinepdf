import { Outlet, useFetchers, useLocation, useNavigation } from 'react-router';

import { Shell } from '~/components/layout/shell';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Spinner } from '~/components/ui/spinner';

function isAnyFetcherPending(
  fetchers: ReturnType<typeof useFetchers>,
): boolean {
  return fetchers.some((fetcher) => fetcher.state !== 'idle');
}

export function HydrateFallback() {
  return (
    <Shell>
      <p className="text-sm text-muted-foreground">Loading page...</p>
    </Shell>
  );
}

export default function SiteLayout() {
  const navigation = useNavigation();
  const location = useLocation();
  const fetchers = useFetchers();
  const isPending =
    navigation.state !== 'idle' || isAnyFetcherPending(fetchers);
  const isPdfInfoRoute = /^\/info(\/|$)/.test(location.pathname);
  const showGlobalPending = isPending && !isPdfInfoRoute;

  return (
    <Shell>
      {showGlobalPending ? (
        <div aria-live="polite" className="min-h-14">
          <Alert className="mb-6">
            <Spinner className="h-4 w-4" />
            <AlertTitle>Working</AlertTitle>
            <AlertDescription>Processing your latest action.</AlertDescription>
          </Alert>
        </div>
      ) : null}
      <Outlet />
    </Shell>
  );
}
