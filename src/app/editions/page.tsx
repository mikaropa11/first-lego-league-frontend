import { EditionsService } from "@/api/editionApi";
import { UsersService } from "@/api/userApi";
import PageShell from "@/app/components/page-shell";
import ErrorAlert from "@/app/components/error-alert";
import { buttonVariants } from "@/app/components/button";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { getServerTranslations } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import { parseErrorMessage } from "@/types/errors";
import { User } from "@/types/user";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import EditionsClient, { EditionItem } from "./_editions-client";

export const dynamic = "force-dynamic";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function EditionsPage({
    searchParams,
}: Readonly<{ searchParams: PageSearchParams }>) {
    const t = await getServerTranslations();
    const params = await searchParams;
    const stateFilter = typeof params.state === "string" ? params.state : "";
    const searchFilter = typeof params.search === "string" ? params.search : "";

    let editions: EditionItem[] = [];
    let error: string | null = null;
    let currentUser: User | null = null;
    let allStates: string[] = [];

    try {
        currentUser = await new UsersService(serverAuthProvider).getCurrentUser();
    } catch (e) {
        console.error("Failed to fetch current user:", e);
    }

    try {
        const service = new EditionsService(serverAuthProvider);
        const allEditions = await service.getEditions();

        allStates = Array.from(
            new Set(allEditions.map((e) => e.state).filter((s): s is string => Boolean(s)))
        ).sort((a, b) => a.localeCompare(b));

        editions = allEditions
            .filter((e) => !stateFilter || e.state === stateFilter)
            .filter((e) => {
                if (!searchFilter.trim()) return true;
                const q = searchFilter.trim().toLowerCase();
                return (
                    e.venueName?.toLowerCase().includes(q) ||
                    e.description?.toLowerCase().includes(q) ||
                    (e.year !== undefined && String(e.year).includes(q))
                );
            })
            .map((e) => ({
                uri: e.uri,
                year: e.year,
                venueName: e.venueName,
                description: e.description,
                state: e.state,
            }));
    } catch (e) {
        console.error("Failed to fetch editions:", e);
        error = parseErrorMessage(e);
    }

    return (
        <PageShell
            eyebrow={t.editions.management}
            title={t.editions.title}
            description={t.editions.description}
            bannerClassName="editions-page-banner"
            panelClassName="editions-page-panel"
            heroAside={isAdmin(currentUser) ? (
                <Link
                    href="/editions/new"
                    className={cn(
                        buttonVariants({ variant: "default", size: "sm" }),
                        "editions-page-create-button",
                    )}
                >
                    <span className="editions-page-create-button__label">{t.editions.createNew}</span>
                    <ArrowUpRight aria-hidden="true" />
                </Link>
            ) : undefined}
        >
            <div className="editions-page-content">
                {error && <ErrorAlert message={error} />}
                {!error && (
                    <EditionsClient
                        editions={editions}
                        initialSearch={searchFilter}
                        initialState={stateFilter}
                        allStates={allStates}
                    />
                )}
            </div>
        </PageShell>
    );
}
