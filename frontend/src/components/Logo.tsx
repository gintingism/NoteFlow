import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog';
import { VisuallyHidden } from './ui/visually-hidden';
import { About } from './About';
import { cn } from '@/lib/utils';

/**
 * Noteflow brand mark: A continuous geometric wave forming an "N" monogram
 * and an audio pulse waveform with a central live recording core.
 * The core illuminates in red when recording is active.
 */
export function Mark({
  live = false,
  className,
}: {
  live?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('h-5 w-5', className)}
    >
      <path
        d="M5.5 19V5C5.5 5 7.5 11 12 12.5C16.5 14 18.5 19 18.5 19V5"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={12}
        cy={12.5}
        r={2.8}
        className={cn(live ? 'fill-danger animate-live' : 'fill-brand')}
        style={{ transformOrigin: '12px 12.5px' }}
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'font-semibold tracking-[-0.018em] text-ink whitespace-nowrap',
        className
      )}
    >
      Noteflow
    </span>
  );
}

interface LogoProps {
  isCollapsed: boolean;
  live?: boolean;
}

/** Brand lockup in the rail. Opens About. */
const Logo = React.forwardRef<HTMLButtonElement, LogoProps>(
  ({ isCollapsed, live = false }, ref) => (
    <Dialog aria-describedby={undefined}>
      <DialogTrigger asChild>
        <button
          ref={ref}
          title="About Noteflow"
          className={cn(
            'group flex items-center rounded-md text-ink transition-colors duration-fast',
            'hover:bg-ink/5 active:bg-ink/10',
            // Same hit box and same left axis as every other rail row: the mark
            // sits at 2×--rail-gutter and the wordmark where a route label does.
            isCollapsed ? 'h-8 w-8 justify-center' : 'h-8 w-full gap-2 px-gutter'
          )}
        >
          <Mark live={live} className="h-4 w-4 shrink-0 text-brand" />
          {!isCollapsed && <Wordmark className="text-base" />}
          <VisuallyHidden>About Noteflow</VisuallyHidden>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <VisuallyHidden>
          <DialogTitle>About Noteflow</DialogTitle>
        </VisuallyHidden>
        <About />
      </DialogContent>
    </Dialog>
  )
);

Logo.displayName = 'Logo';

export default Logo;
