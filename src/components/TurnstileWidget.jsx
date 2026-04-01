import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

const TurnstileWidget = forwardRef(function TurnstileWidget({ onVerify, onExpire, onError }, ref) {
    const containerRef = useRef(null);
    const widgetId     = useRef(null);
    const [ready, setReady]       = useState(false);
    const [clicked, setClicked]   = useState(false); // ← NEW

    const onVerifyRef = useRef(onVerify);
    const onExpireRef = useRef(onExpire);
    const onErrorRef  = useRef(onError);

    useEffect(() => { onVerifyRef.current = onVerify; }, [onVerify]);
    useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);
    useEffect(() => { onErrorRef.current  = onError;  }, [onError]);

    useImperativeHandle(ref, () => ({
        reset() {
            if (widgetId.current !== null && window.turnstile) {
                try { window.turnstile.reset(widgetId.current); } catch {}
            }
            setClicked(false); // ← reset back to click state
            widgetId.current = null;
        }
    }), []);

    useEffect(() => {
        if (window.turnstile) { setReady(true); return; }
        const interval = setInterval(() => {
            if (window.turnstile) { setReady(true); clearInterval(interval); }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // Only render when clicked
    useEffect(() => {
        if (!clicked || !ready || !containerRef.current || widgetId.current !== null) return;

        const timer = setTimeout(() => {
            try {
                widgetId.current = window.turnstile.render(containerRef.current, {
                    sitekey: process.env.REACT_APP_TURNSTILE_SITE_KEY,
                    theme:   'dark',
                    retry:   'auto',
                    callback:           (token) => onVerifyRef.current?.(token),
                    'expired-callback': ()      => onExpireRef.current?.(),
                    'error-callback':   ()      => onErrorRef.current?.(),
                });
            } catch (e) {
                console.warn('Turnstile render error:', e);
            }
        }, 200);

        return () => {
            clearTimeout(timer);
            if (widgetId.current !== null && window.turnstile) {
                try { window.turnstile.remove(widgetId.current); } catch {}
                widgetId.current = null;
            }
        };
    }, [clicked, ready]);

    return (
        <div className="my-2">
            {/* Show click prompt until user clicks */}
            {!clicked ? (
                <div
                    onClick={() => setClicked(true)}
                    className="cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.07] transition-all select-none"
                >
                    <div className="w-5 h-5 rounded border-2 border-slate-500 flex items-center justify-center shrink-0">
                        <div className="w-2.5 h-2.5 rounded-sm bg-transparent" />
                    </div>
                    <span className="text-slate-400 text-sm">Click to verify you're human</span>
                    <img src="https://challenges.cloudflare.com/turnstile/e/favicon.ico" alt="cf" className="w-4 h-4 ml-auto opacity-50" />
                </div>
            ) : (
                <>
                    {!ready && (
                        <div className="text-gray-500 text-xs py-2 animate-pulse">
                            Loading CAPTCHA...
                        </div>
                    )}
                    <div ref={containerRef} />
                </>
            )}
        </div>
    );
});

export default TurnstileWidget;