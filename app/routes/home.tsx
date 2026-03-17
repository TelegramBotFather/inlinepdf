import {
  ArrangeIcon,
  CropIcon,
  File01Icon,
  GitMergeIcon,
  ImageDownloadIcon,
  ImageUploadIcon,
  InformationCircleIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion } from 'motion/react';
import { Link } from 'react-router';

import type { Route } from './+types/home';
import { ThemedBrandImage } from '~/components/branding/themed-brand-image';
import { Badge } from '~/components/ui/badge';
import { buttonVariants } from '~/components/ui/button-variants';
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
        'InlinePDF delivers a cleaner local-first PDF workflow with private in-browser processing and open-source transparency.',
    },
  ];
};

const toolIconBySlug: Partial<Record<string, typeof File01Icon>> = {
  crop: CropIcon,
  'image-to-pdf': ImageUploadIcon,
  merge: GitMergeIcon,
  organize: ArrangeIcon,
  info: InformationCircleIcon,
  'pdf-to-images': ImageDownloadIcon,
  'meesho-shipping-labels': File01Icon,
  'amazon-shipping-labels': File01Icon,
  'flipkart-shipping-labels': File01Icon,
} as const;

const navigationGroupDescriptions: Record<ToolNavigationGroup, string> = {
  Organize: 'Clean up and reshape the structure of a PDF.',
  Convert: 'Move content between formats without upload steps.',
  Extract: 'Pull out label or page regions with marketplace-specific rules.',
  Inspect: 'Inspect document internals and metadata locally.',
};

/** Groups shown in the general PDF tools section (excludes Extract). */
const pdfToolGroups: readonly ToolNavigationGroup[] =
  toolNavigationGroups.filter((g) => g !== 'Extract');

/**
 * GitHub Invertocat mark — monochrome via currentColor.
 * Used per GitHub trademark policy (linking to a repo is allowed).
 */
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 98 96"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
      />
    </svg>
  );
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
} as const;

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' as const },
  },
} as const;

export function HydrateFallback() {
  return <p className="text-sm text-muted-foreground">Loading home...</p>;
}

export default function HomeRoute() {
  const firstToolPath = implementedToolDefinitions[0]?.path ?? '/';

  return (
    <div className="flex w-full flex-col">
      {/* ── HERO ──────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative -mx-4 -mt-10 overflow-hidden px-4 pb-20 pt-24 sm:-mx-6 sm:px-6 sm:pt-32 lg:-mx-8 lg:px-8"
      >
        {/* Gradient mesh background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: `
              radial-gradient(ellipse 60% 50% at 20% 40%, oklch(0.75 0.08 250 / 12%) 0%, transparent 70%),
              radial-gradient(ellipse 50% 60% at 80% 30%, oklch(0.70 0.10 280 / 10%) 0%, transparent 70%),
              radial-gradient(ellipse 70% 40% at 50% 90%, oklch(0.80 0.06 220 / 8%) 0%, transparent 60%)
            `,
          }}
        />
        <div
          className="dark:opacity-100 pointer-events-none absolute inset-0 -z-10 opacity-0"
          aria-hidden="true"
          style={{
            background: `
              radial-gradient(ellipse 60% 50% at 20% 40%, oklch(0.35 0.10 260 / 20%) 0%, transparent 70%),
              radial-gradient(ellipse 50% 60% at 80% 30%, oklch(0.30 0.12 290 / 15%) 0%, transparent 70%),
              radial-gradient(ellipse 70% 40% at 50% 90%, oklch(0.40 0.08 230 / 12%) 0%, transparent 60%)
            `,
          }}
        />
        {/* Subtle noise texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col items-center text-center"
          >
            <ThemedBrandImage
              alt="InlinePDF logo"
              className="size-24 rounded-3xl shadow-lg sm:size-28"
              fetchPriority="low"
              loading="eager"
              variant="hero"
            />
            <motion.div
              className="mt-6 flex flex-wrap justify-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <Badge variant="outline">Local-First</Badge>
              <Badge variant="outline">No Uploads</Badge>
              <Badge variant="outline">Open Source</Badge>
            </motion.div>
            <motion.h1
              className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              PDF tools that work right here
            </motion.h1>
            <motion.p
              className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Merge, crop, organize, convert, and extract — entirely in your
              browser. Your files stay on your device.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-wrap justify-center gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link
                to={firstToolPath}
                prefetch="intent"
                className={buttonVariants({ variant: 'default', size: 'lg' })}
              >
                Get started
              </Link>
              <a
                href="#tools"
                className={buttonVariants({ variant: 'outline', size: 'lg' })}
              >
                Browse tools
              </a>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── PDF TOOLS ─────────────────────────────────────────── */}
      <section id="tools" className="scroll-mt-24 py-16 sm:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem} className="mb-10">
            <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
              Tools
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything runs locally
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              A focused set of PDF utilities that process files directly in the
              browser. Nothing gets uploaded anywhere.
            </p>
          </motion.div>

          <div className="space-y-12">
            {pdfToolGroups.map((group) => {
              const tools = implementedToolDefinitions.filter(
                (t) => t.navGroup === group,
              );

              return (
                <motion.div key={group} variants={staggerItem}>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold tracking-tight">
                      {group}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {navigationGroupDescriptions[group]}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {tools.map((tool) => {
                      const icon = toolIconBySlug[tool.slug] ?? File01Icon;
                      return (
                        <Link
                          key={tool.id}
                          to={tool.path}
                          prefetch="intent"
                          className="group/tool relative flex items-start gap-4 rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:border-foreground/20 hover:shadow-md active:scale-[0.98]"
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background transition-colors duration-200 group-hover/tool:border-foreground/15 group-hover/tool:bg-muted">
                            <HugeiconsIcon
                              icon={icon}
                              size={18}
                              strokeWidth={1.8}
                            />
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium leading-snug">
                              {tool.title}
                            </span>
                            <span className="text-sm leading-snug text-muted-foreground">
                              {tool.shortDescription}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ── RETAILER TOOLS ────────────────────────────────────── */}
      <section className="relative -mx-4 overflow-hidden px-4 py-16 sm:-mx-6 sm:px-6 sm:py-20 lg:-mx-8 lg:px-8">
        {/* Subtle tinted background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-muted/40"
        />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="mx-auto max-w-5xl"
        >
          <motion.div variants={staggerItem} className="mb-10">
            <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
              For E-commerce Sellers
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Shipping label extractors
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Extract and prepare shipping labels from marketplace PDFs. Each
              tool follows platform-specific page rules so labels are ready to
              print.
            </p>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {implementedToolDefinitions
              .filter((tool) => tool.navGroup === 'Extract')
              .map((tool) => {
                const icon = toolIconBySlug[tool.slug] ?? File01Icon;
                return (
                  <motion.div key={tool.id} variants={staggerItem}>
                    <Link
                      to={tool.path}
                      prefetch="intent"
                      className="group/tool relative flex items-start gap-4 rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:border-foreground/20 hover:shadow-md active:scale-[0.98]"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background transition-colors duration-200 group-hover/tool:border-foreground/15 group-hover/tool:bg-muted">
                        <HugeiconsIcon
                          icon={icon}
                          size={18}
                          strokeWidth={1.8}
                        />
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium leading-snug">
                          {tool.title}
                        </span>
                        <span className="text-sm leading-snug text-muted-foreground">
                          {tool.shortDescription}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      </section>

      {/* ── OPEN SOURCE / GITHUB ──────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="flex flex-col items-center text-center"
        >
          <motion.div variants={staggerItem}>
            <GitHubMark className="mx-auto size-12 text-foreground sm:size-14" />
          </motion.div>
          <motion.h2
            variants={staggerItem}
            className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Built in the open
          </motion.h2>
          <motion.p
            variants={staggerItem}
            className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground"
          >
            InlinePDF is open source. Browse the code, open an issue, or
            contribute — the entire project is on GitHub.
          </motion.p>
          <motion.div variants={staggerItem} className="mt-8">
            <a
              href="https://github.com/DG02002/inlinepdf"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
            >
              <GitHubMark className="size-5" />
              View on GitHub
            </a>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
