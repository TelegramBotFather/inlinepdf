import { containerClassName } from './container';
import { Footer } from './footer';
import { Header } from './header';
import { cn } from '~/lib/utils';

export function Shell({
  children,
  mainClassName,
  shellClassName,
}: {
  children: React.ReactNode;
  mainClassName?: string;
  shellClassName?: string;
}) {
  return (
    <div className={cn('flex min-h-screen flex-col', shellClassName)}>
      <Header />
      <main
        className={cn('min-w-0 flex-1 overflow-x-hidden py-10', mainClassName)}
      >
        <div className={containerClassName}>{children}</div>
      </main>
      <Footer />
    </div>
  );
}
