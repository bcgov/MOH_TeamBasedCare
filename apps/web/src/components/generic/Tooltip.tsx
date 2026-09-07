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
  /** A button trigger keeps the tooltip keyboard reachable; only opt out for triggers already focusable */
  triggerAs?: 'button' | 'span';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  triggerClassName,
  panelClassName,
  triggerAs = 'button',
}) => {
  const [open, setOpen] = useState(false);
  const arrowRef = useRef(null);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
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
          {...getReferenceProps()}
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
            style={floatingStyles}
            className={`z-50 max-w-xs rounded-lg bg-bcBlueAccent p-3 text-sm text-white shadow-xl ${
              panelClassName ?? ''
            }`}
            {...getFloatingProps()}
          >
            {content}
            <FloatingArrow ref={arrowRef} context={context} fill={ARROW_FILL} />
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
