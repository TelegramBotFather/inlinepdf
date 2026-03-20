import ArrangeIcon from '@hugeicons/core-free-icons/ArrangeIcon';
import CropIcon from '@hugeicons/core-free-icons/CropIcon';
import File01Icon from '@hugeicons/core-free-icons/File01Icon';
import GitMergeIcon from '@hugeicons/core-free-icons/GitMergeIcon';
import PdfToImagesToolIcon from '@hugeicons/core-free-icons/ImageDownloadIcon';
import ImageToPdfToolIcon from '@hugeicons/core-free-icons/ImageUploadIcon';
import InformationCircleIcon from '@hugeicons/core-free-icons/InformationCircleIcon';
import { HugeiconsIcon } from '@hugeicons/react';

import type { Route } from './+types/home';
import { ThemedBrandImage } from '~/components/branding/themed-brand-image';
import { ThemedGitHubLockup } from '~/components/branding/themed-github-lockup';
import { AppLink } from '~/shared/navigation/app-link';
import { buttonVariants } from '~/components/ui/button-variants';
import { cn } from '~/lib/utils';
import { implementedToolDefinitions } from '~/tools/catalog/definitions';

export const meta: Route.MetaFunction = () => {
  return [
    { title: 'InlinePDF | Local PDF Tools' },
    {
      name: 'description',
      content:
        'InlinePDF provides open-source PDF tools that process files locally.',
    },
  ];
};

const toolIconBySlug: Partial<Record<string, typeof File01Icon>> = {
  crop: CropIcon,
  'image-to-pdf': ImageToPdfToolIcon,
  merge: GitMergeIcon,
  organize: ArrangeIcon,
  info: InformationCircleIcon,
  'pdf-to-images': PdfToImagesToolIcon,
} as const;

const generalTools = implementedToolDefinitions.filter(
  (tool) => tool.navGroup !== 'Prepare',
);

const shippingLabelTools = implementedToolDefinitions.filter(
  (tool) => tool.navGroup === 'Prepare',
);

const shippingLabelToolSortOrder = [
  'meesho-shipping-labels',
  'flipkart-shipping-labels',
  'amazon-shipping-labels',
] as const;

const orderedShippingLabelTools = shippingLabelToolSortOrder
  .map((slug) => shippingLabelTools.find((tool) => tool.slug === slug))
  .filter((tool) => tool != null);

const generalToolSortOrder = [
  'info',
  'merge',
  'organize',
  'crop',
  'image-to-pdf',
  'pdf-to-images',
] as const;

const orderedGeneralTools = generalToolSortOrder
  .map((slug) => generalTools.find((tool) => tool.slug === slug))
  .filter((tool) => tool != null);

function ToolCard({
  description,
  icon,
  path,
  title,
}: {
  description: string;
  icon: typeof File01Icon;
  path: string;
  title: string;
}) {
  return (
    <AppLink to={path} prefetch="intent" className="group block h-full">
      <div className="flex h-full flex-col items-center rounded-2xl border border-border/70 bg-background px-6 py-6 text-center transition-colors duration-200 hover:bg-muted/20">
        <span className="bg-muted/45 mb-5 flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border/60">
          <HugeiconsIcon icon={icon} size={26} strokeWidth={1.8} />
        </span>
        <div className="min-w-0 space-y-2">
          <p className="text-base font-semibold tracking-tight">{title}</p>
          <p className="text-muted-foreground mx-auto max-w-[24ch] text-sm leading-6">
            {description}
          </p>
        </div>
      </div>
    </AppLink>
  );
}

export default function HomeRoute() {
  return (
    <div className="flex w-full flex-col">
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-16 text-center sm:px-12 sm:py-24">
          <ThemedBrandImage
            alt="InlinePDF logo"
            className="size-28 rounded-[2rem] object-contain sm:size-32"
            fetchPriority="low"
            loading="eager"
            variant="hero"
          />
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
            InlinePDF
          </h1>
          <p className="text-muted-foreground mt-5 max-w-3xl text-lg leading-relaxed sm:text-xl">
            Merge, crop, organize, convert, inspect, and prepare labels locally.
            Files stay local.
          </p>
        </div>
      </section>

      {/* ── PDF TOOLS ─────────────────────────────────────────── */}
      <section
        id="tools"
        className="mx-auto w-full max-w-5xl scroll-mt-24 px-4 pb-16 pt-0 sm:px-12 sm:pb-20"
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            PDF tools for everyday work
          </h2>
          <p className="text-muted-foreground mt-3 max-w-3xl text-lg leading-relaxed">
            Clean, focused tools for merging, organizing, converting, and
            reviewing PDFs locally. Fast to use and easy to understand.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orderedGeneralTools.map((tool) => (
            <ToolCard
              key={tool.id}
              description={tool.shortDescription}
              icon={toolIconBySlug[tool.slug] ?? File01Icon}
              path={tool.path}
              title={tool.title}
            />
          ))}
        </div>
      </section>

      {/* ── RETAILER TOOLS ────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-12 sm:pb-20">
        <div className="from-muted/45 via-background to-muted/15 border-border/70 overflow-hidden rounded-[2rem] border bg-linear-to-br">
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="max-w-3xl">
              <p className="text-muted-foreground text-xs font-medium tracking-[0.28em] uppercase">
                Built for retail sellers
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Shipping label tools for marketplace PDFs
              </h2>
              <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
                Prepare marketplace shipping labels with smart sorting, paper
                size controls, and SKU sorting where supported.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {['Sorting', 'Paper size', 'Labels per sheet'].map((item) => (
                  <span
                    key={item}
                    className="bg-background/75 rounded-full border border-border/70 px-4 py-2 text-sm font-medium tracking-tight"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-2 text-sm">
                {orderedShippingLabelTools.map((tool, index) => (
                  <div key={tool.id} className="inline-flex items-center gap-2">
                    <AppLink
                      to={tool.path}
                      prefetch="intent"
                      className="text-foreground font-medium underline decoration-border/80 underline-offset-4 transition-colors duration-200 hover:text-muted-foreground"
                    >
                      {tool.title}
                    </AppLink>
                    {index < orderedShippingLabelTools.length - 1 ? (
                      <span
                        className="text-muted-foreground/60"
                        aria-hidden="true"
                      >
                        /
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OPEN SOURCE / GITHUB ──────────────────────────────── */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-12 sm:pb-20">
        <div className="from-muted/35 via-background to-muted/15 border-border/70 overflow-hidden rounded-[2rem] border bg-linear-to-br">
          <div className="space-y-6 px-6 py-8 sm:px-10 sm:py-10">
            <div className="inline-flex">
              <ThemedGitHubLockup
                alt="GitHub"
                className="h-6 w-auto object-contain sm:h-7"
                loading="lazy"
              />
            </div>

            <div className="space-y-3">
              <h2 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Built in public, maintained on GitHub.
              </h2>
              <p className="text-muted-foreground max-w-2xl text-base leading-relaxed sm:text-lg">
                InlinePDF is open source. Browse the repository on GitHub,
                review issues, track releases, and follow development.
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <a
                href="https://github.com/DG02002/inlinepdf"
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ size: 'lg', variant: 'outline' }),
                  'min-w-48',
                )}
              >
                View Source Code
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
