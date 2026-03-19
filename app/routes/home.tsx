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
    { title: 'InlinePDF | Local-First PDF Tools' },
    {
      name: 'description',
      content:
        'InlinePDF provides local-first PDF tools that process files on device and stay open source.',
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
  'meesho-shipping-labels': File01Icon,
  'amazon-shipping-labels': File01Icon,
  'flipkart-shipping-labels': File01Icon,
} as const;

const generalTools = implementedToolDefinitions.filter(
  (tool) => tool.navGroup !== 'Prepare',
);

const shippingLabelTools = implementedToolDefinitions.filter(
  (tool) => tool.navGroup === 'Prepare',
);

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
            Merge, crop, organize, convert, inspect, and prepare label pages on
            device. Files stay on device.
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
            checking PDFs on device. Fast to use, simple to understand.
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
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Shipping label tools
          </h2>
          <p className="text-muted-foreground mt-3 text-lg leading-relaxed">
            Marketplace-specific tools for preparing label pages with the right
            page order and layout before printing.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shippingLabelTools.map((tool) => (
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
