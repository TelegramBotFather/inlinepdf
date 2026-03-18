import { createRequestHandler } from 'react-router';

import { logger } from '../app/lib/observability/logger';
import {
  createWideRequestEvent,
  getOrCreateRequestId,
  setWideRequestOutcome,
  withRequestId,
  annotateWideRequestError,
} from '../app/lib/observability/wide-events';
import {
  deleteRequestEvent,
  registerRequestEvent,
} from '../app/lib/observability/request-events';

declare module 'react-router' {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    const requestId = getOrCreateRequestId(request);
    const requestWithId = withRequestId(request, requestId);
    const wideEvent = createWideRequestEvent(requestWithId);

    registerRequestEvent(wideEvent);

    try {
      const response = await requestHandler(requestWithId, {
        cloudflare: { env, ctx },
      });
      const responseHeaders = new Headers(response.headers);

      responseHeaders.set('x-request-id', requestId);
      setWideRequestOutcome(wideEvent, response.status);
      wideEvent.response = {
        cache_control: response.headers.get('cache-control'),
        content_type: response.headers.get('content-type'),
      };

      return new Response(response.body, {
        headers: responseHeaders,
        status: response.status,
        statusText: response.statusText,
      });
    } catch (error) {
      wideEvent.status_code = 500;
      annotateWideRequestError(wideEvent, error, 'worker_fetch');
      throw error;
    } finally {
      wideEvent.duration_ms = Date.now() - startTime;
      logger.info(wideEvent);
      deleteRequestEvent(requestId);
    }
  },
} satisfies ExportedHandler<Env>;
