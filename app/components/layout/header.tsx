import { href } from 'react-router';

import { ThemedBrandImage } from '~/components/branding/themed-brand-image';
import { AppLink } from '~/shared/navigation/app-link';
import { SiteNavigation } from '~/shared/navigation/site-navigation';

import { ThemePicker } from './theme-picker';
import { containerClassName } from './container';

export function Header() {
  return (
    <header className="supports-[backdrop-filter]:bg-background/80 z-50 border-b bg-background/95 backdrop-blur-md sticky top-0">
      <div
        className={`${containerClassName} grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 py-3`}
      >
        <AppLink
          to={href('/')}
          prefetch="intent"
          className="flex min-w-0 items-center gap-3 no-underline"
        >
          <div className="relative size-10 shrink-0">
            <ThemedBrandImage
              alt=""
              className="size-full object-contain"
              loading="eager"
              variant="header"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold tracking-tight">
              InlinePDF
            </p>
          </div>
        </AppLink>

        <div className="hidden items-center justify-self-center sm:flex">
          <SiteNavigation />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <ThemePicker />
        </div>
      </div>
    </header>
  );
}
