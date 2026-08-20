import {
    cloneElement,
    createContext,
    isValidElement,
    type ReactElement,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';
import {createPortal} from 'react-dom';
import {X} from '../../lib/icons';

/** Custom modal — no Radix. Radix Dialog's data-state CSS animations don't fire
 *  under this Tauri/WebKitGTK build, so the shell is a plain portal whose open/
 *  close is driven by a JS-toggled `data-state` + CSS transitions (rock-solid,
 *  same as any hover). Premium dark glass + soft accent-glow halo. API mirrors
 *  the bits we used: Modal / ModalTrigger / ModalContent / ModalTitle /
 *  ModalDescription / ModalClose. */

const WIDTH: Record<string, string> = {
    sm: 'max-w-[420px]',
    md: 'max-w-[520px]',
    lg: 'max-w-[640px]',
    xl: 'max-w-[760px]',
};

type Ctx = { open: boolean; setOpen: (v: boolean) => void; titleId: string };
const ModalCtx = createContext<Ctx | null>(null);
const useCtx = () => {
    const c = useContext(ModalCtx);
    if (!c) throw new Error('Modal subcomponent used outside <Modal>');
    return c;
};

type ClickEl = ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;

function mergeClick(child: ReactNode, fn: () => void) {
    if (isValidElement(child)) {
        const el = child as ClickEl;
        return cloneElement(el, {
            onClick: (e: React.MouseEvent) => {
                el.props.onClick?.(e);
                fn();
            },
        });
    }
    return child;
}

export function Modal({
                          open: openProp,
                          defaultOpen = false,
                          onOpenChange,
                          children,
                      }: {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (v: boolean) => void;
    children: ReactNode;
}) {
    const [internal, setInternal] = useState(defaultOpen);
    const controlled = openProp !== undefined;
    const open = controlled ? openProp : internal;
    const titleId = useId();
    const setOpen = useCallback(
        (v: boolean) => {
            if (!controlled) setInternal(v);
            onOpenChange?.(v);
        },
        [controlled, onOpenChange],
    );
    return <ModalCtx.Provider value={{open, setOpen, titleId}}>{children}</ModalCtx.Provider>;
}

export function ModalTrigger({children, asChild}: { children: ReactNode; asChild?: boolean }) {
    const {setOpen} = useCtx();
    if (asChild) return <>{mergeClick(children, () => setOpen(true))}</>;
    return (
        <button type="button" onClick={() => setOpen(true)}>
            {children}
        </button>
    );
}

export function ModalClose({
                               children,
                               asChild,
                               disabled,
                               className,
                           }: {
    children: ReactNode;
    asChild?: boolean;
    disabled?: boolean;
    className?: string;
}) {
    const {setOpen} = useCtx();
    const close = () => {
        if (!disabled) setOpen(false);
    };
    if (asChild) return <>{mergeClick(children, close)}</>;
    return (
        <button type="button" className={className} disabled={disabled} onClick={close}>
            {children}
        </button>
    );
}

export function ModalTitle({children, className}: { children: ReactNode; className?: string }) {
    const {titleId} = useCtx();
    return (
        <h2 id={titleId} className={className ?? 'text-[16px] font-bold text-white/92 tracking-tight'}>
            {children}
        </h2>
    );
}

export function ModalDescription({
                                     children,
                                     className,
                                 }: {
    children: ReactNode;
    className?: string;
}) {
    return <p className={className ?? 'text-[12.5px] leading-snug text-white/45'}>{children}</p>;
}

/** Mount-with-exit: keep rendered through the close transition. */
function usePresence(open: boolean, ms = 200) {
    const [mounted, setMounted] = useState(open);
    const [state, setState] = useState<'open' | 'closed'>(open ? 'open' : 'closed');
    useEffect(() => {
        if (open) {
            setMounted(true);
            // double rAF so the first painted frame is the `closed` state, then flip
            const id = requestAnimationFrame(() => requestAnimationFrame(() => setState('open')));
            // Страховка на случай, если rAF не доедет (так уже было: кап FPS
            // голодал вложенные колбэки). Открытость модалки — не косметика:
            // без флипа она остаётся смонтированной на `opacity: 0`, и снаружи
            // это выглядит как «модалки нет». Таймаут заведомо длиннее кадра,
            // так что закрытое состояние успевает отрисоваться и анимация цела.
            const fallback = setTimeout(() => setState('open'), 100);
            return () => {
                cancelAnimationFrame(id);
                clearTimeout(fallback);
            };
        }
        setState('closed');
        const t = setTimeout(() => setMounted(false), ms);
        return () => clearTimeout(t);
    }, [open, ms]);
    return {mounted, state};
}

export function ModalContent({
    children,
    size = 'md',
    className,
    showClose = true,
    zClass = 'z-[90]',
    position = 'center',
    overlay = true,
    lockScroll = true,
    closeOnBack = false,
}: {
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    showClose?: boolean;
    zClass?: string;
    position?: 'center' | 'popover';
    overlay?: boolean;
    lockScroll?: boolean;
    closeOnBack?: boolean;
}) {
    const {open, setOpen, titleId} = useCtx();
    const {mounted, state} = usePresence(open, 200);
    const cardRef = useRef<HTMLDivElement>(null);
    const historyStateRef = useRef(false);

    /*
     * Optional browser/Tauri Back support.
     *
     * When the popover opens we add one temporary history entry.
     * Pressing Back consumes that entry and closes the popover instead
     * of navigating away from the current page.
     */
    useEffect(() => {
        if (!mounted || !closeOnBack) return;

        history.pushState(
            {
                ...(window.history.state ?? {}),
                __modalPopover: true,
            },
            '',
        );

        historyStateRef.current = true;

        const onPopState = () => {
            historyStateRef.current = false;
            setOpen(false);
        };

        window.addEventListener('popstate', onPopState);

        return () => {
            window.removeEventListener('popstate', onPopState);

            /*
             * If the modal was closed using X, clicking outside, or
             * programmatically, remove the temporary history entry.
             *
             * If Back already consumed it, historyStateRef is false
             * and we don't navigate again.
             */
            if (historyStateRef.current) {
                historyStateRef.current = false;
                window.history.back();
            }
        };
    }, [mounted, closeOnBack, setOpen]);

    /*
     * Esc to close.
     */
    useEffect(() => {
        if (!mounted) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                setOpen(false);
            }
        };

        document.addEventListener('keydown', onKey);

        return () => {
            document.removeEventListener('keydown', onKey);
        };
    }, [mounted, setOpen]);

    /*
     * Only regular centered modals lock page scrolling.
     * Popovers such as Equalizer should not.
     */
    useEffect(() => {
        if (!mounted || !lockScroll) return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [mounted, lockScroll]);

    /*
     * Close a popover when clicking outside its card.
     */
    useEffect(() => {
        if (!mounted || overlay) return;

        const onPointerDown = (e: PointerEvent) => {
            const target = e.target as Node | null;

            if (target && cardRef.current?.contains(target)) {
                return;
            }

            setOpen(false);
        };

        document.addEventListener('pointerdown', onPointerDown);

        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
        };
    }, [mounted, overlay, setOpen]);

    /*
     * Focus only normal centered dialogs.
     * The Equalizer popover shouldn't steal focus from the More menu.
     */
    useEffect(() => {
        if (state === 'open' && position === 'center') {
            cardRef.current?.focus();
        }
    }, [state, position]);

    if (!mounted) return null;

    // Desktop keeps the original bottom-right anchored popover corner.
    // Phone width (max-md) centers it on screen instead: the old
    // bottom-[184px]/right-3 offset was tuned before .npb became `position:
    // fixed` and MobileNav was added, and no longer lands inside the visible
    // viewport on current layouts — centering is layout-agnostic and can't
    // drift out of view again.
    const positionClass =
        position === 'popover'
            ? 'fixed bottom-[92px] right-6 left-auto top-auto max-md:left-1/2 max-md:right-auto max-md:top-1/2 max-md:bottom-auto max-md:-translate-x-1/2 max-md:-translate-y-1/2'
            : 'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2';

    return createPortal(
        <>
            {overlay && (
                <div
                    className={`modal-overlay fixed inset-0 ${zClass} bg-black/60 backdrop-blur-sm`}
                    data-state={state}
                    onClick={() => setOpen(false)}
                />
            )}

            <div
                ref={cardRef}
                role="dialog"
                aria-modal={overlay ? true : undefined}
                aria-labelledby={titleId}
                tabIndex={position === 'center' ? -1 : undefined}
                data-state={state}
                className={`modal-content ${zClass} ${positionClass} w-full ${WIDTH[size]} max-w-[95vw] outline-none`}
            >
                <div
                    className={`relative overflow-hidden rounded-[1.75rem] ${className ?? ''}`}
                    style={{
                        border: '0.5px solid rgba(255,255,255,0.12)',
                        background:
                            'linear-gradient(168deg, rgba(23,22,28,0.97), rgba(10,9,13,0.99))',
                        boxShadow:
                            '0 40px 110px rgba(0,0,0,0.62), 0 0 80px var(--color-accent-glow), inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}
                >
                    {/* soft accent wash from the top */}
                    <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 h-28"
                        style={{
                            background:
                                'radial-gradient(80% 100% at 50% 0%, var(--color-accent-glow), transparent 72%)',
                            opacity: 0.7,
                        }}
                    />

                    {/* specular hairline */}
                    <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-8 top-0 h-px"
                        style={{
                            background:
                                'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)',
                        }}
                    />

                    {showClose && (
                        <button
                            type="button"
                            aria-label="Close"
                            onClick={() => setOpen(false)}
                            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:text-white/90 hover:bg-white/[0.08] transition-all duration-200 cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    )}

                    <div className="relative">
                        {children}
                    </div>
                </div>
            </div>
        </>,
        document.body,
    );
}
