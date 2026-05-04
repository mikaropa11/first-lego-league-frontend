import { UsersService } from "@/api/userApi";
import PageShell from "@/app/components/page-shell";
import ErrorAlert from "@/app/components/error-alert";
import EmptyState from "@/app/components/empty-state";
import PaginationControls from "@/app/components/pagination-controls";
import SearchInput from "@/app/components/search-input";
import { serverAuthProvider } from "@/lib/authProvider";
import { User } from "@/types/user";
import { parseErrorMessage } from "@/types/errors";
import type { HalPage } from "@/types/pagination";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 5;

interface UsersPageProps {
    readonly searchParams?: Promise<{ page?: string; search?: string }>;
}

export default async function UsersPage(props: Readonly<UsersPageProps>) {
    const searchParams = (await props.searchParams) ?? {};
    const urlPage = Math.max(1, Number(searchParams.page ?? "1") || 1);
    const search = searchParams.search?.trim().toLowerCase() ?? "";

    const service = new UsersService(serverAuthProvider);
    let result: HalPage<User> = { items: [], hasNext: false, hasPrev: false, currentPage: 0 };
    let error: string | null = null;

    try {
        result = await service.getUsersPaged(urlPage - 1, PAGE_SIZE);
    } catch (e) {
        console.error("Failed to fetch users:", e);
        error = parseErrorMessage(e);
    }

    const users = search
        ? result.items.filter(
            (u) =>
                u.username?.toLowerCase().includes(search) ||
                u.email?.toLowerCase().includes(search)
        )
        : result.items;

    return (
        <PageShell
            eyebrow="People directory"
            title="Users"
            description="Browse the registered members of the platform and open each participant profile."
        >
            <div className="space-y-6">
                <div className="space-y-3">
                    <div className="page-eyebrow">Registered users</div>
                    <h2 className="section-title">Directory</h2>
                    <p className="section-copy max-w-3xl">
                        Select a user to view profile details.
                    </p>
                </div>

                <SearchInput defaultValue={searchParams.search ?? ""} placeholder="Search by username or email…" />

                {error && <ErrorAlert message={error} />}

                {!error && users.length === 0 && (
                    <EmptyState
                        title="No users found"
                        description={
                            search
                                ? `No users match "${searchParams.search}".`
                                : "There are currently no registered users in the system."
                        }
                    />
                )}

                {!error && users.length > 0 && (
                    <>
                        <ul className="list-grid">
                            {users.map((user) => (
                                <li key={user.username} className="list-card pl-7">
                                    <div className="list-kicker">User</div>
                                    <Link
                                        className="list-title block hover:text-primary"
                                        href={`/users/${user.username}`}
                                    >
                                        {user.username}
                                    </Link>
                                    {user.email && (
                                        <div className="list-support">{user.email}</div>
                                    )}
                                </li>
                            ))}
                        </ul>
                        <PaginationControls
                            currentPage={urlPage}
                            hasNext={result.hasNext}
                            hasPrev={result.hasPrev}
                            basePath="/users"
                            searchQuery={searchParams.search}
                        />
                    </>
                )}
            </div>
        </PageShell>
    );
}
