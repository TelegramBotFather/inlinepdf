import Menu01Icon from '@hugeicons/core-free-icons/Menu01Icon';
import { HugeiconsIcon } from '@hugeicons/react';
import { href } from 'react-router';

import {
  getToolsForNavigationGroup,
  toolNavigationGroups,
} from '~/tools/catalog/definitions';
import { Button } from '~/components/ui/button';
import { AppLink } from '~/shared/navigation/app-link';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '~/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet';

function ToolMenuLink({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  return (
    <NavigationMenuLink
      render={<AppLink to={path} prefetch="intent" />}
      className="block min-w-64 space-y-1 rounded-2xl"
      closeOnClick
    >
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </NavigationMenuLink>
  );
}

function DesktopToolNavigation() {
  return (
    <NavigationMenu className="hidden sm:flex" align="start">
      <NavigationMenuList className="gap-2">
        {toolNavigationGroups.map((group) => {
          const tools = getToolsForNavigationGroup(group);
          return (
            <NavigationMenuItem key={group}>
              <NavigationMenuTrigger>{group}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid gap-2 p-1 md:w-[22rem]">
                  {tools.map((tool) => (
                    <ToolMenuLink
                      key={tool.id}
                      title={tool.title}
                      description={tool.shortDescription}
                      path={tool.path}
                    />
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function MobileToolNavigation() {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="sm:hidden"
            aria-label="Open Navigation Menu"
          />
        }
      >
        <HugeiconsIcon icon={Menu01Icon} size={18} strokeWidth={2} />
      </SheetTrigger>
      <SheetContent side="right" className="w-[22rem] gap-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle>InlinePDF</SheetTitle>
          <SheetDescription>
            PDF tools that process files locally.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-6 py-6">
          {toolNavigationGroups.map((group) => (
            <section key={group} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {group}
              </h2>
              <div className="space-y-2">
                {getToolsForNavigationGroup(group).map((tool) => (
                  <AppLink
                    key={tool.id}
                    to={tool.path}
                    prefetch="intent"
                    className="block rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <p className="font-medium text-foreground">{tool.title}</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {tool.shortDescription}
                    </p>
                  </AppLink>
                ))}
              </div>
            </section>
          ))}

          <section className="space-y-3 border-t border-border pt-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Info
            </h2>
            <div className="space-y-2">
              <AppLink
                to={href('/privacy')}
                prefetch="intent"
                className="block rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
              >
                Privacy
              </AppLink>
              <AppLink
                to={href('/terms')}
                prefetch="intent"
                className="block rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
              >
                Terms
              </AppLink>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SiteNavigation() {
  return (
    <>
      <DesktopToolNavigation />
      <MobileToolNavigation />
    </>
  );
}
