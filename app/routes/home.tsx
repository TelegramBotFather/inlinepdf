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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { cn } from '~/lib/utils';
import {
  implementedToolDefinitions,
  toolNavigationGroups,
  type ToolNavigationGroup,
} from '~/tools/catalog/definitions';

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

const navigationGroupDescriptions: Record<ToolNavigationGroup, string> = {
  Organize: 'Reorder pages and adjust document structure.',
  Convert: 'Move between PDF and image formats on device.',
  Prepare: 'Prepare label pages with marketplace-specific rules.',
  Inspect: 'Review document metadata and font details on device.',
};

/** Groups shown in the general PDF tools section (excludes Prepare). */
const pdfToolGroups: readonly ToolNavigationGroup[] =
  toolNavigationGroups.filter((g) => g !== 'Prepare');

const groupColumnClassName: Partial<Record<ToolNavigationGroup, string>> = {
  Organize: 'md:col-span-2',
} as const;

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
    <AppLink to={path} prefetch="intent" className="block h-full">
      <div className="bg-muted/35 hover:bg-muted/55 rounded-xl border px-4 py-3 transition-colors">
        <div className="flex items-start gap-3">
          <span className="bg-background flex size-9 shrink-0 items-center justify-center rounded-lg border">
            <HugeiconsIcon icon={icon} size={18} strokeWidth={1.8} />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-snug">{title}</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>
    </AppLink>
  );
}

export default function HomeRoute() {
  return (
    <div className="flex w-full flex-col">
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="from-muted/35 to-background bg-linear-to-b">
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
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything runs locally
          </h2>
          <p className="text-muted-foreground mt-3 max-w-3xl text-lg leading-relaxed">
            A focused set of PDF tools that process files on device. Files are
            never sent to a server.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {pdfToolGroups.map((group, idx) => {
            const tools = implementedToolDefinitions.filter(
              (tool) => tool.navGroup === group,
            );

            return (
              <Card
                key={group}
                className={cn(
                  'border-border/70 bg-background/90',
                  idx === 0 && groupColumnClassName[group],
                )}
              >
                <CardHeader className="border-b pb-6">
                  <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
                    Tool Group {String(idx + 1).padStart(2, '0')}
                  </p>
                  <CardTitle className="text-2xl tracking-tight sm:text-3xl">
                    {group}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {navigationGroupDescriptions[group]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div
                    className={cn(
                      'grid gap-3',
                      tools.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-1',
                    )}
                  >
                    {tools.map((tool) => (
                      <ToolCard
                        key={tool.id}
                        description={tool.shortDescription}
                        icon={toolIconBySlug[tool.slug] ?? File01Icon}
                        path={tool.path}
                        title={tool.title}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── RETAILER TOOLS ────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-12 sm:pb-20">
        <Card className="border-border/70 from-muted/25 to-background bg-linear-to-b">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Shipping label tools
            </CardTitle>
            <CardDescription className="max-w-3xl text-base leading-relaxed">
              Prepare shipping label pages from marketplace PDFs. Each tool
              follows platform-specific page rules so label pages are ready to
              print.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {implementedToolDefinitions
                .filter((tool) => tool.navGroup === 'Prepare')
                .map((tool) => (
                  <ToolCard
                    key={tool.id}
                    description={tool.shortDescription}
                    icon={toolIconBySlug[tool.slug] ?? File01Icon}
                    path={tool.path}
                    title={tool.title}
                  />
                ))}
            </div>
          </CardContent>
        </Card>
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
