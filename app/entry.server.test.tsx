import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loggerErrorMock, renderToReadableStreamMock } = vi.hoisted(() => ({
  loggerErrorMock: vi.fn(),
  renderToReadableStreamMock: vi.fn(),
}));

vi.mock('react-dom/server', () => ({
  renderToReadableStream: renderToReadableStreamMock,
}));

vi.mock('isbot', () => ({
  isbot: vi.fn(() => false),
}));

vi.mock('~/lib/observability/logger', () => ({
  logger: {
    error: loggerErrorMock,
    info: vi.fn(),
  },
}));

import handleRequest from '~/entry.server';
import { handleError } from '~/entry.server';
import {
  deleteRequestEvent,
  registerRequestEvent,
} from '~/lib/observability/request-events';
import type { WideRequestEvent } from '~/lib/observability/wide-events';

function createMockStream(): ReadableStream<Uint8Array> & {
  allReady: Promise<void>;
} {
  const stream = new ReadableStream<Uint8Array>();
  return Object.assign(stream, {
    allReady: Promise.resolve(),
  });
}

function createWideEventFixture(
  overrides: Partial<WideRequestEvent> = {},
): WideRequestEvent {
  return {
    deployment_environment: 'production',
    event_name: 'http_request',
    method: 'GET',
    path: '/merge',
    request_id: 'test-request-id',
    route_kind: 'tool',
    tool_slug: 'merge',
    ...overrides,
  };
}

describe('entry.server', () => {
  beforeEach(() => {
    loggerErrorMock.mockReset();
    renderToReadableStreamMock.mockReset();
    renderToReadableStreamMock.mockResolvedValue(createMockStream());
  });

  it('renders the server router without document security headers', async () => {
    const responseHeaders = new Headers();

    const response = await handleRequest(
      new Request('https://inlinepdf.example/'),
      200,
      responseHeaders,
      { isSpaMode: true } as never,
    );

    const routerElement = renderToReadableStreamMock.mock.calls[0]?.[0] as
      | {
          props?: {
            nonce?: string;
          };
        }
      | undefined;

    expect(routerElement?.props?.nonce).toBeUndefined();
    expect(response.headers.get('Content-Security-Policy')).toBeNull();
  });

  it('enriches the request wide event for uncaught server errors', () => {
    const request = new Request('https://inlinepdf.example/merge', {
      method: 'POST',
      headers: {
        'x-request-id': 'test-request-id',
      },
    });
    const wideEvent = createWideEventFixture({
      method: 'POST',
    });

    registerRequestEvent(wideEvent);

    handleError(new Error('render failed'), {
      request,
    } as never);

    expect(wideEvent.error_phase).toBe('ssr_handle_error');
    expect(wideEvent.outcome).toBe('error');
    expect(wideEvent.status_code).toBe(500);
    expect(wideEvent.error).toMatchObject({
      message: 'render failed',
      name: 'Error',
    });
    expect(wideEvent.render).toMatchObject({
      failed: true,
      phase: 'ssr_handle_error',
    });
    expect(loggerErrorMock).not.toHaveBeenCalled();
    deleteRequestEvent(request);
  });

  it('does not log aborted requests', () => {
    const controller = new AbortController();
    controller.abort();

    handleError(new Error('aborted'), {
      request: new Request('https://inlinepdf.example/merge', {
        signal: controller.signal,
      }),
    } as never);

    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('falls back to a standalone structured error event when no request event exists', () => {
    const request = new Request('https://inlinepdf.example/merge', {
      method: 'POST',
      headers: {
        'x-request-id': 'test-request-id',
      },
    });

    handleError(new Error('render failed'), {
      request,
    } as never);

    const standaloneEvent = loggerErrorMock.mock.calls[0]?.[0] as
      | Record<string, unknown>
      | undefined;

    expect(standaloneEvent).toBeDefined();
    expect(standaloneEvent?.event_name).toBe('server_error');
    expect(standaloneEvent?.method).toBe('POST');
    expect(standaloneEvent?.path).toBe('/merge');
    expect(standaloneEvent?.request_id).toBe('test-request-id');
    expect(standaloneEvent?.route_kind).toBe('tool');
    expect(standaloneEvent?.tool_slug).toBe('merge');
    expect(standaloneEvent?.error_phase).toBe('ssr_handle_error');
    expect(standaloneEvent?.error).toMatchObject({
      message: 'render failed',
      name: 'Error',
    });
  });

  it('captures render failures on the in-flight request event', async () => {
    const request = new Request('https://inlinepdf.example/merge', {
      headers: {
        'x-request-id': 'test-request-id',
      },
    });
    const wideEvent = createWideEventFixture();

    renderToReadableStreamMock.mockImplementation(
      (_element: unknown, options: { onError?: (error: unknown) => void }) => {
      options.onError?.(new Error('render crashed'));
        return Promise.resolve(createMockStream());
      },
    );
    registerRequestEvent(wideEvent);

    const response = await handleRequest(
      request,
      200,
      new Headers(),
      { isSpaMode: false } as never,
    );

    expect(response.status).toBe(500);
    expect(wideEvent.error_phase).toBe('ssr_render');
    expect(wideEvent.outcome).toBe('error');
    expect(wideEvent.status_code).toBe(500);
    expect(wideEvent.error).toMatchObject({
      message: 'render crashed',
      name: 'Error',
    });
    expect(wideEvent.render).toMatchObject({
      failed: true,
      phase: 'ssr_render',
    });
    deleteRequestEvent(request);
  });
});
