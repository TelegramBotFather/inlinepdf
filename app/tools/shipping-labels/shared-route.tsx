/* eslint-disable react-refresh/only-export-components */
import type { MetaFunction } from 'react-router';

import {
  getActionErrorMessage,
  type ToolActionResult,
} from '~/shared/tool-ui/action-result';
import { getFile, getString } from '~/platform/files/read-form-data';
import { takeClientActionFallback } from '~/platform/files/client-action-fallback';
import { validatePdfFile } from '~/platform/files/security/file-validation';
import { triggerFileDownload } from '~/platform/files/trigger-file-download';
import type { ToolDefinition } from '~/tools/catalog/definitions';

import type {
  ShippingLabelBrand,
  ShippingLabelExtractionSummary,
  ShippingLabelOutputPageSize,
  ShippingLabelSortDirection,
} from './models';
import { ShippingLabelsToolScreen } from './screen';
import {
  extractShippingLabels,
  isShippingLabelOutputPageSize,
  isShippingLabelSortDirection,
} from './use-cases/extract-shipping-labels';

interface ShippingLabelsActionPayload {
  file: File;
  outputPageSize: ShippingLabelOutputPageSize;
  pickupPartnerDirection: ShippingLabelSortDirection | null;
  skuDirection: ShippingLabelSortDirection | null;
}

export function createShippingLabelMeta(
  toolDefinition: ToolDefinition,
): MetaFunction {
  return () => [
    { title: `${toolDefinition.title} | InlinePDF` },
    {
      name: 'description',
      content: toolDefinition.shortDescription,
    },
  ];
}

export function createShippingLabelHydrateFallback(title: string) {
  return function ShippingLabelHydrateFallback() {
    return (
      <p className="text-sm text-muted-foreground">{`Loading ${title.toLowerCase()}...`}</p>
    );
  };
}

export function createShippingLabelClientAction(brand: ShippingLabelBrand) {
  return async function clientAction({
    request,
  }: {
    request: Request;
  }): Promise<ToolActionResult<ShippingLabelExtractionSummary>> {
    const formData = await request.formData();
    const submissionId = getString(formData, 'submissionId');
    const fallbackPayload = submissionId
      ? (takeClientActionFallback(
          submissionId,
        ) as ShippingLabelsActionPayload | null)
      : null;
    const file = getFile(formData, 'file') ?? fallbackPayload?.file;
    const outputPageSize =
      getString(formData, 'outputPageSize') ??
      fallbackPayload?.outputPageSize ??
      null;
    const pickupPartnerDirectionValue =
      getString(formData, 'pickupPartnerDirection') ??
      fallbackPayload?.pickupPartnerDirection ??
      null;
    const skuDirectionValue =
      getString(formData, 'skuDirection') ??
      fallbackPayload?.skuDirection ??
      null;
    const pickupPartnerDirection = isShippingLabelSortDirection(
      pickupPartnerDirectionValue,
    )
      ? pickupPartnerDirectionValue
      : null;
    const skuDirection = isShippingLabelSortDirection(skuDirectionValue)
      ? skuDirectionValue
      : null;

    if (!file) {
      return {
        ok: false,
        message: 'Select a PDF file before extracting labels.',
      };
    }

    if (!isShippingLabelOutputPageSize(outputPageSize)) {
      return { ok: false, message: 'Select a valid output page size.' };
    }

    try {
      await validatePdfFile(file);
      const result = await extractShippingLabels(file, {
        brand,
        outputPageSize,
        sort: {
          pickupPartnerDirection,
          skuDirection,
        },
      });

      triggerFileDownload(result.blob, result.fileName);
      return {
        ok: true,
        message: `Download started with ${String(result.labelsExtracted)} extracted label${result.labelsExtracted === 1 ? '' : 's'}.`,
        result: {
          pagesProcessed: result.pagesProcessed,
          labelsExtracted: result.labelsExtracted,
          pagesSkipped: result.pagesSkipped,
          fileName: result.fileName,
        },
      };
    } catch (error: unknown) {
      return getActionErrorMessage(error, 'Failed to extract shipping labels.');
    }
  };
}

interface ShippingLabelRouteProps {
  brand: ShippingLabelBrand;
  title: string;
  description: string;
}

export function ShippingLabelRoute({
  brand,
  title,
  description,
}: ShippingLabelRouteProps) {
  return (
    <ShippingLabelsToolScreen
      brand={brand}
      title={title}
      description={description}
    />
  );
}
