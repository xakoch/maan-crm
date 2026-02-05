'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

// Yandex Metrika ID from environment variables
const YM_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;

export default function YandexMetrika() {
    return (
        <Suspense fallback={null}>
            <YandexMetrikaContent />
        </Suspense>
    );
}

function YandexMetrikaContent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!YM_ID) return;

        // Custom page hit tracking for SPA (Next.js)
        const url = `${pathname}?${searchParams}`;
        // @ts-ignore
        if (typeof window.ym !== 'undefined') {
            // @ts-ignore
            window.ym(Number(YM_ID), 'hit', url);
        }
    }, [pathname, searchParams]);

    if (!YM_ID) return null;

    return (
        <>
            <script
                dangerouslySetInnerHTML={{
                    __html: `
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

            ym(${YM_ID}, "init", {
                ssr: true,
                webvisor: true,
                clickmap: true,
                ecommerce: "dataLayer",
                accurateTrackBounce: true,
                trackLinks: true
            });
      `,
                }}
            />
            <noscript>
                <div>
                    <img src={`https://mc.yandex.ru/watch/${YM_ID}`} style={{ position: 'absolute', left: '-9999px' }} alt="" />
                </div>
            </noscript>
        </>
    );
}

// Helper for Reach Goal
export const reachGoal = (goalName: string, params?: any) => {
    if (typeof window !== 'undefined' && (window as any).ym && YM_ID) {
        (window as any).ym(Number(YM_ID), 'reachGoal', goalName, params);
    } else {
        console.log(`[Yandex Metrika] Goal reached: ${goalName}`, params);
    }
};
