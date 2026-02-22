import { containerClassName } from './container';
import { Footer } from './footer';
import { Header } from './header';

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className={`${containerClassName} min-w-0 flex-1 overflow-x-hidden py-10`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
