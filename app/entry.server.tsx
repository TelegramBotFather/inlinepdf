import type { EntryContext, HandleErrorFunction } from 'react-router';
import { ServerRouter } from 'react-router';
import { isbot } from 'isbot';
import { renderToReadableStream } from 'react-dom/server';

import { logger } from './lib/observability/logger';
import { getRequestEvent } from './lib/observability/request-events';
import {
  annotateWideRequestError,
  createStandaloneErrorEvent,
} from './lib/observability/wide-events';

function captureServerError(
  request: Request,
  error: unknown,
  phase: 'ssr_handle_error' | 'ssr_render',
) {
  const wideEvent = getRequestEvent(request);

  if (wideEvent) {
    annotateWideRequestError(wideEvent, error, phase);
    wideEvent.status_code ??= 500;

    return;
  }

  logger.error(
    createStandaloneErrorEvent({
      error,
      phase,
      request,
    }),
  );
}

export const handleError: HandleErrorFunction = (error, { request }) => {
  if (request.signal.aborted) {
    return;
  }

  captureServerError(request, error, 'ssr_handle_error');
};

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  const userAgent = request.headers.get('user-agent');

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error) {
        responseStatusCode = 500;
        captureServerError(request, error, 'ssr_render');
      },
    },
  );

  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Cache-Control', 'no-store');
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
