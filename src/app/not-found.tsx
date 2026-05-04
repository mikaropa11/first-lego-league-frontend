import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
            <div className="space-y-6 max-w-md">
                <div className="space-y-2">
                    <div className="page-eyebrow">Error 404</div>
                    <h1 className="text-6xl font-bold tracking-tight text-foreground">🤖</h1>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                        Robot lost in space
                    </h2>
                    <p className="text-muted-foreground">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                    ← Back to Home
                </Link>
            </div>
        </div>
    );
}