import githubLockupDarkOnLight from '~/assets/branding/github/github-lockup-dark-on-light.svg';
import githubLockupLightOnDark from '~/assets/branding/github/github-lockup-light-on-dark.svg';
import { useThemeState } from '~/hooks/use-theme-state';

export function ThemedGitHubLockup({
  alt,
  className,
  loading,
}: {
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
}) {
  const { resolvedTheme } = useThemeState();
  const src =
    resolvedTheme === 'dark'
      ? githubLockupLightOnDark
      : githubLockupDarkOnLight;

  return (
    <img
      src={src}
      width={416}
      height={95}
      alt={alt}
      className={className}
      decoding="async"
      loading={loading}
    />
  );
}
