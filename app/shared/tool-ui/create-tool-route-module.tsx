import { takeClientActionFallback } from '~/platform/files/client-action-fallback';
import { getString } from '~/platform/files/read-form-data';

import { getActionErrorMessage, type ToolActionResult } from './action-result';

interface ToolRouteDefinition {
  title: string;
  shortDescription: string;
}

interface ToolRouteModuleConfig<
  TFallbackPayload,
  TInput,
  TResult,
  TResponseResult = undefined,
> {
  definition: ToolRouteDefinition;
  errorMessage: string;
  parseInput: (args: {
    formData: FormData;
    fallbackPayload: TFallbackPayload | null;
  }) => TInput;
  execute: (input: TInput) => Promise<TResult>;
  getSuccessMessage: (result: TResult) => string;
  mapSuccessResult?: (result: TResult) => TResponseResult;
  onSuccess?: (result: TResult) => void | Promise<void>;
  readFallbackPayload?: (submissionId: string) => TFallbackPayload | null;
}

function readStoredFallbackPayload(submissionId: string): unknown {
  return takeClientActionFallback(submissionId);
}

export function createToolRouteModule<
  TFallbackPayload,
  TInput,
  TResult,
  TResponseResult = undefined,
>(
  config: ToolRouteModuleConfig<
    TFallbackPayload,
    TInput,
    TResult,
    TResponseResult
  >,
) {
  function meta() {
    return [
      { title: `${config.definition.title} | InlinePDF` },
      {
        name: 'description',
        content: config.definition.shortDescription,
      },
    ];
  }

  async function clientAction({
    request,
  }: {
    request: Request;
  }): Promise<ToolActionResult<TResponseResult>> {
    const formData = await request.formData();
    const submissionId = getString(formData, 'submissionId');
    const fallbackPayload = submissionId
      ? (config.readFallbackPayload?.(submissionId) ??
        (readStoredFallbackPayload(submissionId) as TFallbackPayload | null))
      : null;

    try {
      const input = config.parseInput({
        formData,
        fallbackPayload,
      });
      const result = await config.execute(input);
      await config.onSuccess?.(result);

      const message = config.getSuccessMessage(result);
      const mappedResult = config.mapSuccessResult?.(result);

      return mappedResult === undefined
        ? { ok: true, message }
        : { ok: true, message, result: mappedResult };
    } catch (error: unknown) {
      return getActionErrorMessage(error, config.errorMessage);
    }
  }

  return {
    meta,
    clientAction,
  };
}
