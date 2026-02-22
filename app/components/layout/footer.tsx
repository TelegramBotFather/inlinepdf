import { Link } from 'react-router';

import { containerClassName } from './container';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div
        className={`${containerClassName} flex flex-col gap-2 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between`}
      >
        <p>Copyright © 2026 InlinePDF. All rights reserved.</p>
        <p className="flex items-center gap-2">
          <Link
            to="/privacy"
            className="text-muted-foreground hover:text-foreground"
          >
            Privacy Policy
          </Link>
          <span aria-hidden="true">|</span>
          <Link
            to="/terms"
            className="text-muted-foreground hover:text-foreground"
          >
            Terms of Use
          </Link>
        </p>
      </div>
    </footer>
  );
}
