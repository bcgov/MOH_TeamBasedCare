import {
  arrow,
  autoUpdate,
  flip,
  FloatingArrow,
  FloatingPortal,
  offset,
  Placement,
  safePolygon,
  shift,
  size,
  SizeOptions,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { ReactNode, useRef, useState } from 'react';

const ARROW_FILL = '#38598A'; // bcBlueAccent

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: Placement;
  triggerClassName?: string;
  panelClassName?: string;
  onClick?: () => void;
  /** A button trigger keeps the tooltip keyboard reachable; only opt out for triggers already focusable */
  triggerAs?: 'button' | 'span';
  /** Opts long content into viewport sizing and a named keyboard-scrollable region. */
  scrollableContentLabel?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  triggerClassName,
  panelClassName,
  onClick,
  triggerAs = 'button',
  scrollableContentLabel,
}) => {
  const [open, setOpen] = useState(false);
  const arrowRef = useRef(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      Boolean(scrollableContentLabel) &&
        size({
          padding: 8,
          apply({ availableHeight, availableWidth, elements }) {
            elements.floating.style.setProperty(
              '--tooltip-available-height',
              `${Math.max(0, availableHeight)}px`,
            );
            elements.floating.style.setProperty(
              '--tooltip-available-width',
              `${Math.max(0, availableWidth)}px`,
            );
          },
        } satisfies SizeOptions),
      arrow({ element: arrowRef }),
    ],
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    // safePolygon keeps the panel reachable while the pointer travels towards it (WCAG 1.4.13)
    useHover(context, { delay: { open: 150, close: 100 }, handleClose: safePolygon() }),
    useFocus(context),
    useClick(context, { ignoreMouse: true }),
    useDismiss(context, { referencePress: false }),
    useRole(context, { role: 'tooltip' }),
  ]);

  return (
    <>
      {triggerAs === 'button' ? (
        <button
          ref={refs.setReference}
          type='button'
          className={triggerClassName}
          {...getReferenceProps({
            onClick,
            onKeyDown: event => {
              if (event.key === 'ArrowDown' && contentRef.current) {
                event.preventDefault();
                contentRef.current.focus();
              }
            },
          })}
        >
          {children}
        </button>
      ) : (
        <span ref={refs.setReference} className={triggerClassName} {...getReferenceProps()}>
          {children}
        </span>
      )}

      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              ...(scrollableContentLabel && {
                maxWidth: 'min(20rem, var(--tooltip-available-width))',
              }),
            }}
            className={`z-50 max-w-xs rounded-lg bg-bcBlueAccent p-3 text-sm text-white shadow-xl ${
              panelClassName ?? ''
            }`}
            {...getFloatingProps()}
          >
            {scrollableContentLabel ? (
              <div
                ref={contentRef}
                role='region'
                aria-label={scrollableContentLabel}
                tabIndex={0}
                className='overflow-y-auto overscroll-contain [overflow-wrap:anywhere] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white'
                style={{
                  maxHeight: 'max(0px, calc(var(--tooltip-available-height) - 1.5rem))',
                }}
                onKeyDown={event => {
                  if (event.key === 'Escape') {
                    if (refs.domReference.current instanceof HTMLElement) {
                      refs.domReference.current.focus();
                    }
                    setOpen(false);
                  }
                }}
              >
                {content}
              </div>
            ) : (
              content
            )}
            <FloatingArrow ref={arrowRef} context={context} fill={ARROW_FILL} />
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
