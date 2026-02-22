import { Link } from 'react-router';

import { ThemePicker } from './theme-picker';
import { containerClassName } from './container';

export function Header() {
  return (
    <header className="sticky inset-x-0 top-0 z-50 w-full border-b border-border/70 bg-background/70 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.35)] backdrop-blur-2xl supports-[backdrop-filter]:bg-background/55 supports-[backdrop-filter]:backdrop-saturate-150">
      <div
        className={`${containerClassName} flex min-w-0 items-center justify-between gap-3 py-4`}
      >
        <Link to="/" className="text-2xl font-extrabold tracking-tight">
          InlinePDF
        </Link>
        <ThemePicker />
      </div>
    </header>
  );
}
