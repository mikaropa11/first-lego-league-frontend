"use client";

import Link from "next/link";
import { useEffect } from "react";

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
    useEffect(() => {
        console.error("Global error:", error);
    }, [error]);

    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
            <div className="space-y-6 max-w-md">
                <div className="space-y-2">
                    <div className="page-eyebrow">Unexpected Error</div>
                    <h1 className="text-6xl font-bold tracking-tight text-foreground">⚠️</h1>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                        Something went wrong
                    </h2>
                    <p className="text-muted-foreground">
                        An unexpected error occurred. You can try again or go back to the home page.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={reset}
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}