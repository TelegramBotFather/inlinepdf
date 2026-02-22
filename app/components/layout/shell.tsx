import { containerClassName } from './container';
import { Footer } from './footer';
import { Header } from './header';

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className={`${containerClassName} min-w-0 flex-1 py-10`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
