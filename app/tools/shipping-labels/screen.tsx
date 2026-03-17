import { useState } from 'react';
import { useFetcher } from 'react-router';

import { PdfFileSelector } from '~/components/pdf-file-selector';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldSet,
} from '~/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { saveClientActionFallback } from '~/platform/files/client-action-fallback';
import { getPageSizeOptionLabel } from '~/platform/pdf/page-size-options';
import { readPdfDetails } from '~/platform/pdf/read-pdf-details';
import type { ToolActionResult } from '~/shared/tool-ui/action-result';
import { createFileEntryId } from '~/shared/tool-ui/create-file-entry-id';
import {
  FileQueueList,
  type QueuedFile,
} from '~/shared/tool-ui/file-queue-list';
import { ToolWorkspace } from '~/shared/tool-ui/tool-workspace';
import { useSuccessToast } from '~/shared/tool-ui/use-success-toast';

import type {
  ShippingLabelBrand,
  ShippingLabelExtractionSummary,
  ShippingLabelOutputPageSize,
  ShippingLabelSortDirection,
} from './models';

const BRAND_LABELS: Record<ShippingLabelBrand, string> = {
  meesho: 'Meesho',
  amazon: 'Amazon',
  flipkart: 'Flipkart',
};

const OUTPUT_PAGE_SIZE_OPTIONS: {
  value: ShippingLabelOutputPageSize;
  description: string;
}[] = [
  {
    value: 'auto',
    description: 'Use the extracted label size automatically with no resizing.',
  },
  {
    value: 'a3',
    description: 'Scale each extracted label to fit on a portrait A3 page.',
  },
  {
    value: 'a4',
    description: 'Scale each extracted label to fit on a portrait A4 page.',
  },
  {
    value: 'a5',
    description: 'Scale each extracted label to fit on a portrait A5 page.',
  },
  {
    value: 'b5',
    description: 'Scale each extracted label to fit on a portrait B5 page.',
  },
  {
    value: 'envelope10',
    description: 'Scale each extracted label to fit on an Envelope #10 page.',
  },
  {
    value: 'envelopeChoukei3',
    description:
      'Scale each extracted label to fit on an Envelope Choukei 3 page.',
  },
  {
    value: 'envelopeDl',
    description: 'Scale each extracted label to fit on an Envelope DL page.',
  },
  {
    value: 'jisB5',
    description: 'Scale each extracted label to fit on a JIS B5 page.',
  },
  {
    value: 'roc16k',
    description: 'Scale each extracted label to fit on a ROC 16K page.',
  },
  {
    value: 'superBA3',
    description: 'Scale each extracted label to fit on a Super B/A3 page.',
  },
  {
    value: 'tabloid',
    description: 'Scale each extracted label to fit on a Tabloid page.',
  },
  {
    value: 'tabloidOversize',
    description:
      'Scale each extracted label to fit on a Tabloid Oversize page.',
  },
  {
    value: 'legal',
    description: 'Scale each extracted label to fit on a US Legal page.',
  },
  {
    value: 'letter',
    description: 'Scale each extracted label to fit on a US Letter page.',
  },
];

const outputPageSizeInputId = 'shipping-label-output-page-size';

function renderOutputPageSizeLabel(value: ShippingLabelOutputPageSize) {
  return getPageSizeOptionLabel(value);
}

interface ShippingLabelsToolScreenProps {
  brand: ShippingLabelBrand;
  title: string;
  description: string;
}

export function ShippingLabelsToolScreen({
  brand,
  title,
  description,
}: ShippingLabelsToolScreenProps) {
  const fetcher =
    useFetcher<ToolActionResult<ShippingLabelExtractionSummary>>();
  const [selectedFileEntry, setSelectedFileEntry] = useState<QueuedFile | null>(
    null,
  );
  const [outputPageSize, setOutputPageSize] =
    useState<ShippingLabelOutputPageSize>('auto');
  const [pickupPartnerDirection, setPickupPartnerDirection] =
    useState<ShippingLabelSortDirection | null>(null);
  const [skuDirection, setSkuDirection] =
    useState<ShippingLabelSortDirection | null>(null);
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(
    null,
  );

  const isExtracting = fetcher.state !== 'idle';
  const actionErrorMessage =
    fetcher.data && !fetcher.data.ok ? fetcher.data.message : null;
  const errorMessage = localErrorMessage ?? actionErrorMessage;
  const result =
    selectedFileEntry && fetcher.data?.ok
      ? (fetcher.data.result ?? null)
      : null;
  const isBrandAvailable = brand === 'meesho';
  const selectedOutputPageSizeOption = OUTPUT_PAGE_SIZE_OPTIONS.find(
    (option) => option.value === outputPageSize,
  );

  useSuccessToast(fetcher.data?.ok ? fetcher.data.message : null);

  function handleFileSelection(file: File) {
    const entryId = createFileEntryId(file);

    setSelectedFileEntry({
      id: entryId,
      file,
      pageCount: null,
      previewDataUrl: null,
      previewStatus: 'loading',
    });
    setLocalErrorMessage(null);

    void readPdfDetails(file)
      .then((details) => {
        setSelectedFileEntry((current) =>
          current?.id === entryId
            ? {
                ...current,
                pageCount: details.pageCount,
                previewDataUrl: details.previewDataUrl,
                previewStatus: details.previewDataUrl ? 'ready' : 'unavailable',
              }
            : current,
        );
      })
      .catch(() => {
        setSelectedFileEntry((current) =>
          current?.id === entryId
            ? {
                ...current,
                previewStatus: 'unavailable',
              }
            : current,
        );
      });
  }

  function handleClearSelection() {
    if (isExtracting) {
      return;
    }

    setSelectedFileEntry(null);
    setLocalErrorMessage(null);
  }

  function handleExtract() {
    if (!selectedFileEntry) {
      setLocalErrorMessage('Select a PDF file before extracting labels.');
      return;
    }

    if (!isBrandAvailable) {
      setLocalErrorMessage(
        `${BRAND_LABELS[brand]} extraction is not available yet.`,
      );
      return;
    }

    setLocalErrorMessage(null);
    const submissionId = saveClientActionFallback({
      file: selectedFileEntry.file,
      outputPageSize,
      pickupPartnerDirection,
      skuDirection,
    });
    const formData = new FormData();
    formData.set('file', selectedFileEntry.file);
    formData.set('outputPageSize', outputPageSize);
    if (pickupPartnerDirection) {
      formData.set('pickupPartnerDirection', pickupPartnerDirection);
    }
    if (skuDirection) {
      formData.set('skuDirection', skuDirection);
    }
    formData.set('submissionId', submissionId);
    void fetcher.submit(formData, { method: 'post' });
  }

  return (
    <ToolWorkspace
      title={title}
      description={description}
      helperText={
        isExtracting
          ? 'Scanning pages, locating TAX INVOICE anchors, and preparing your extracted PDF...'
          : undefined
      }
      inputPanel={
        selectedFileEntry ? (
          <FileQueueList
            files={[selectedFileEntry]}
            disabled={isExtracting}
            showIndexBadge={false}
            onRemove={handleClearSelection}
          />
        ) : (
          <PdfFileSelector
            ariaLabel="Select PDF file for shipping label extraction"
            onSelect={(files) => {
              handleFileSelection(files[0]);
            }}
            disabled={isExtracting}
          />
        )
      }
      optionsPanel={
        selectedFileEntry ? (
          <div className="space-y-6">
            <FieldSet className="max-w-sm">
              <div className="space-y-2">
                <FieldLabel htmlFor={outputPageSizeInputId}>
                  Output page size
                </FieldLabel>
                <Select
                  value={outputPageSize}
                  onValueChange={(value) => {
                    const nextPageSize = OUTPUT_PAGE_SIZE_OPTIONS.find(
                      (option) => option.value === value,
                    )?.value;

                    if (nextPageSize) {
                      setOutputPageSize(nextPageSize);
                    }
                  }}
                  disabled={isExtracting}
                >
                  <SelectTrigger id={outputPageSizeInputId} className="w-full">
                    <SelectValue>
                      {selectedOutputPageSizeOption
                        ? renderOutputPageSizeLabel(
                            selectedOutputPageSizeOption.value,
                          )
                        : 'Select page size'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    {OUTPUT_PAGE_SIZE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {renderOutputPageSizeLabel(option.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {
                    OUTPUT_PAGE_SIZE_OPTIONS.find(
                      (option) => option.value === outputPageSize,
                    )?.description
                  }
                </FieldDescription>
              </div>
            </FieldSet>

            <FieldSet className="max-w-xl">
              <div className="space-y-3">
                <FieldLabel>Sorting</FieldLabel>

                <Field
                  orientation="horizontal"
                  className="items-start rounded-xl border border-border px-4 py-3"
                >
                  <Checkbox
                    checked={pickupPartnerDirection !== null}
                    onCheckedChange={(checked) => {
                      setPickupPartnerDirection(checked ? 'desc' : null);
                    }}
                    disabled={isExtracting}
                    aria-label="Sort labels by pickup partner"
                  />
                  <FieldContent>
                    <FieldLabel>Sort by pickup partner</FieldLabel>
                    <FieldDescription>
                      Group labels by detected pickup partner in one fixed
                      order.
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <Field
                  orientation="horizontal"
                  className="items-start rounded-xl border border-border px-4 py-3"
                >
                  <Checkbox
                    checked={skuDirection !== null}
                    onCheckedChange={(checked) => {
                      setSkuDirection(checked ? 'desc' : null);
                    }}
                    disabled={isExtracting}
                    aria-label="Sort labels by SKU"
                  />
                  <FieldContent>
                    <FieldLabel>Sort by SKU</FieldLabel>
                    <FieldDescription>
                      Order labels by detected SKU in one fixed order.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </div>
            </FieldSet>
          </div>
        ) : null
      }
      actionBar={
        selectedFileEntry ? (
          <div className="space-y-2">
            <Button
              disabled={!isBrandAvailable || isExtracting}
              onClick={handleExtract}
            >
              {isExtracting ? 'Extracting...' : 'Extract and Download'}
            </Button>
          </div>
        ) : null
      }
      outputPanel={
        result ? (
          <Card className="overflow-visible border border-border/70 bg-gradient-to-br from-card via-card to-muted/20">
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle>Extraction complete</CardTitle>
                  <CardDescription>
                    Your label PDF has been generated and the download started.
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {BRAND_LABELS[brand]} ·{' '}
                  {OUTPUT_PAGE_SIZE_OPTIONS.find(
                    (option) => option.value === outputPageSize,
                  )?.value === 'auto'
                    ? 'Auto'
                    : renderOutputPageSizeLabel(outputPageSize)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-primary/6 p-4 ring-1 ring-primary/10">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Processed
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {String(result.pagesProcessed)}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-500/8 p-4 ring-1 ring-emerald-500/15">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Extracted
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {String(result.labelsExtracted)}
                  </p>
                </div>
                <div className="rounded-2xl bg-amber-500/8 p-4 ring-1 ring-amber-500/15">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Skipped
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {String(result.pagesSkipped)}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Output file
                </p>
                <p className="mt-2 break-all text-sm font-medium">
                  {result.fileName}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null
      }
      errorMessage={errorMessage}
    />
  );
}
