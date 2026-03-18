import { containerClassName } from './container';
import { Footer } from './footer';
import { Header } from './header';
import { cn } from '~/lib/utils';

export function Shell({
  children,
  contentClassName,
  mainClassName,
  mainBackground,
  shellClassName,
}: {
  children: React.ReactNode;
  contentClassName?: string;
  mainClassName?: string;
  mainBackground?: React.ReactNode;
  shellClassName?: string;
}) {
  return (
    <div className={cn('flex min-h-screen flex-col', shellClassName)}>
      <Header />
      <main
        className={cn('min-w-0 flex-1 overflow-x-hidden py-10', mainClassName)}
      >
        {mainBackground}
        <div className={cn(containerClassName, contentClassName)}>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
