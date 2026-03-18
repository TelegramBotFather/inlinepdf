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
import { SHIPPING_LABEL_PAGE_SIZE_IDS } from '~/platform/pdf/page-size-options';
import { PageSizeSelectLabel } from '~/shared/tool-ui/page-size-option-label';
import { SinglePdfToolWorkspace } from '~/shared/tool-ui/single-pdf-tool-workspace';
import { useSuccessToast } from '~/shared/tool-ui/use-success-toast';
import { useShippingLabelsWorkspace } from '~/tools/shipping-labels/use-shipping-labels-workspace';

import type {
  ShippingLabelBrand,
  ShippingLabelOutputPageSize,
} from './models';

const BRAND_LABELS: Record<ShippingLabelBrand, string> = {
  meesho: 'Meesho',
  amazon: 'Amazon',
  flipkart: 'Flipkart',
};

const OUTPUT_PAGE_SIZE_DESCRIPTIONS: Record<ShippingLabelOutputPageSize, string> =
  {
    auto: 'Use the detected label size with no resizing.',
    a3: 'Scale each label page to fit on a portrait A3 page.',
    a4: 'Scale each label page to fit on a portrait A4 page.',
    a5: 'Scale each label page to fit on a portrait A5 page.',
    b5: 'Scale each label page to fit on a portrait B5 page.',
    envelope10:
      'Scale each label page to fit on an Envelope #10 page.',
    envelopeChoukei3:
      'Scale each label page to fit on an Envelope Choukei 3 page.',
    envelopeDl: 'Scale each label page to fit on an Envelope DL page.',
    jisB5: 'Scale each label page to fit on a JIS B5 page.',
    roc16k: 'Scale each label page to fit on a ROC 16K page.',
    superBA3: 'Scale each label page to fit on a Super B/A3 page.',
    tabloid: 'Scale each label page to fit on a Tabloid page.',
    tabloidOversize:
      'Scale each label page to fit on a Tabloid Oversize page.',
    legal: 'Scale each label page to fit on a US Legal page.',
    letter: 'Scale each label page to fit on a US Letter page.',
  };

const OUTPUT_PAGE_SIZE_OPTIONS: {
  value: ShippingLabelOutputPageSize;
  description: string;
}[] = SHIPPING_LABEL_PAGE_SIZE_IDS.map((value) => ({
  value,
  description: OUTPUT_PAGE_SIZE_DESCRIPTIONS[value],
}));

const outputPageSizeInputId = 'shipping-label-output-page-size';

function renderOutputPageSizeLabel(value: ShippingLabelOutputPageSize) {
  return <PageSizeSelectLabel value={value} />;
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
  const workspace = useShippingLabelsWorkspace(brand);
  const selectedOutputPageSizeOption = OUTPUT_PAGE_SIZE_OPTIONS.find(
    (option) => option.value === workspace.outputPageSize,
  );

  useSuccessToast(workspace.successMessage);

  return (
    <SinglePdfToolWorkspace
      title={title}
      description={description}
      selectorAriaLabel="Select a PDF file to prepare label pages"
      selectedFileEntry={workspace.selectedFileEntry}
      isBusy={workspace.isPreparing}
      onSelectFile={workspace.handleFileSelection}
      onClearSelection={workspace.handleClearSelection}
      helperText={workspace.helperText}
      optionsPanel={
        workspace.selectedFileEntry ? (
          <div className="space-y-6">
            <FieldSet className="max-w-sm">
              <div className="space-y-2">
                <FieldLabel htmlFor={outputPageSizeInputId}>
                  Output page size
                </FieldLabel>
                <Select
                  value={workspace.outputPageSize}
                  onValueChange={(value) => {
                    const nextPageSize = OUTPUT_PAGE_SIZE_OPTIONS.find(
                      (option) => option.value === value,
                    )?.value;

                    if (nextPageSize) {
                      workspace.setOutputPageSize(nextPageSize);
                    }
                  }}
                  disabled={workspace.isPreparing}
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
                      (option) => option.value === workspace.outputPageSize,
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
                    checked={workspace.pickupPartnerDirection !== null}
                    onCheckedChange={(checked) => {
                      workspace.setPickupPartnerDirection(
                        checked ? 'desc' : null,
                      );
                    }}
                    disabled={workspace.isPreparing}
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
                    checked={workspace.skuDirection !== null}
                    onCheckedChange={(checked) => {
                      workspace.setSkuDirection(checked ? 'desc' : null);
                    }}
                    disabled={workspace.isPreparing}
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
        workspace.selectedFileEntry ? (
          <div className="space-y-2">
            <Button
              disabled={workspace.prepareButtonDisabled}
              onClick={workspace.handlePrepare}
            >
              {workspace.prepareButtonLabel}
            </Button>
          </div>
        ) : null
      }
      outputPanel={
        workspace.resultSummary ? (
          <Card className="overflow-visible border border-border/70 bg-gradient-to-br from-card via-card to-muted/20">
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle>Label pages ready</CardTitle>
                  <CardDescription>
                    The prepared label PDF is ready to save.
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {BRAND_LABELS[brand]} ·{' '}
                  {OUTPUT_PAGE_SIZE_OPTIONS.find(
                    (option) => option.value === workspace.outputPageSize,
                  )?.value === 'auto'
                    ? 'Auto'
                    : renderOutputPageSizeLabel(workspace.outputPageSize)}
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
                    {String(workspace.resultSummary.pagesProcessed)}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-500/8 p-4 ring-1 ring-emerald-500/15">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Prepared
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {String(workspace.resultSummary.labelsPrepared)}
                  </p>
                </div>
                <div className="rounded-2xl bg-amber-500/8 p-4 ring-1 ring-amber-500/15">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Skipped
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {String(workspace.resultSummary.pagesSkipped)}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Output file
                </p>
                <p className="mt-2 break-all text-sm font-medium">
                  {workspace.resultSummary.fileName}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null
      }
      errorMessage={workspace.errorMessage}
    />
  );
}
