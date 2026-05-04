import { EditionsService } from "@/api/editionApi";
import { UsersService } from "@/api/userApi";
import PageShell from "@/app/components/page-shell";
import ErrorAlert from "@/app/components/error-alert";
import PaginationControls from "@/app/components/pagination-controls";
import { buttonVariants } from "@/app/components/button";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { cn } from "@/lib/utils";
import { parseErrorMessage } from "@/types/errors";
import { User } from "@/types/user";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import EditionsClient, { EditionItem } from "./_editions-client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 6;

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function EditionsPage({
    searchParams,
}: Readonly<{ searchParams: PageSearchParams }>) {
    const params = await searchParams;
    const urlPage = Math.max(1, Number(params.page ?? "1") || 1);

    let editions: EditionItem[] = [];
    let error: string | null = null;
    let currentUser: User | null = null;
    let hasNext = false;
    let hasPrev = false;

    try {
        currentUser = await new UsersService(serverAuthProvider).getCurrentUser();
    } catch (e) {
        console.error("Failed to fetch current user:", e);
    }

    try {
        const service = new EditionsService(serverAuthProvider);
        const data = await service.getEditionsPaged(urlPage - 1, PAGE_SIZE);
        hasNext = data.hasNext;
        hasPrev = data.hasPrev;
        editions = data.items.map(e => ({
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
            eyebrow="Edition management"
            title="Editions"
            description="Browse the yearly editions currently registered in the FIRST LEGO League platform."
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
                    <span className="editions-page-create-button__label">Create new edition</span>
                    <ArrowUpRight aria-hidden="true" />
                </Link>
            ) : undefined}
        >
            <div className="editions-page-content">

                {error && <ErrorAlert message={error} />}

                {!error && (
                    <>
                        <EditionsClient editions={editions} />
                        <div className="editions-page-pagination">
                            <PaginationControls
                                currentPage={urlPage}
                                hasNext={hasNext}
                                hasPrev={hasPrev}
                                basePath="/editions"
                                variant="editorial"
                                contextLabel=""
                            />
                        </div>
                    </>
                )}
            </div>
        </PageShell>
    );
}
