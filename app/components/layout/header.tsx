import { Link } from 'react-router';

import { ThemePicker } from './theme-picker';
import { containerClassName } from './container';

export function Header() {
  return (
    <header className="border-b border-border bg-card/95 backdrop-blur">
      <div
        className={`${containerClassName} flex min-w-0 items-center justify-between gap-3 py-4`}
      >
        <Link to="/" className="font-semibold tracking-tight">
          InlinePDF
        </Link>
        <ThemePicker />
      </div>
    </header>
  );
}
