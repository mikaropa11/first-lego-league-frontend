import { UsersService } from "@/api/userApi";
import PageShell from "@/app/components/page-shell";
import ErrorAlert from "@/app/components/error-alert";
import EmptyState from "@/app/components/empty-state";
import AdministratorList from "./administrator-list";
import CreateAdministrator from "./create-administrator";
import { serverAuthProvider } from "@/lib/authProvider";
import { getServerTranslations } from "@/lib/i18n/server";
import { User } from "@/types/user";
import { parseErrorMessage } from "@/types/errors";
import { redirect } from "next/navigation";

function isAdmin(user: User | null) {
    return !!user?.authorities?.some(
        (authority) => authority.authority === "ROLE_ADMIN"
    );
}

export default async function AdministratorsPage() {
    const t = await getServerTranslations();
    const auth = await serverAuthProvider.getAuth();
    if (!auth) redirect("/login");

    const service = new UsersService(serverAuthProvider);

    let currentUser: User | null = null;
    let administrators: User[] = [];
    let error: string | null = null;

    try {
        currentUser = await service.getCurrentUser();
    } catch (e) {
        console.error("Failed to fetch current user:", e);
        error = parseErrorMessage(e);
    }

    if (!error && !currentUser) {
        redirect("/login");
    }

    if (!error && !isAdmin(currentUser)) {
        redirect("/");
    }

    try {
        const users = await service.getUsers();
        administrators = users.filter((user) =>
            user.authorities?.some(
                (authority) => authority.authority === "ROLE_ADMIN"
            )
        );
    } catch (e) {
        console.error("Failed to fetch administrators:", e);
        error = parseErrorMessage(e);
    }

    return (
        <PageShell
            eyebrow={t.administrators.eyebrow}
            title={t.administrators.title}
            description={t.administrators.description}
        >
            <div className="space-y-6">
                <div className="space-y-3">
                    <div className="page-eyebrow">{t.administrators.systemAdministrators}</div>
                    <h2 className="section-title">{t.administrators.directory}</h2>
                    <p className="section-copy max-w-3xl">
                        {t.administrators.selectAdministrator}
                    </p>
                </div>

                {!error && currentUser && <CreateAdministrator />}

                {error && <ErrorAlert message={error} />}

                {!error && administrators.length === 0 && (
                    <EmptyState
                        title={t.administrators.noAdministrators}
                        description={t.administrators.noAdministratorsDescription}
                    />
                )}

                {!error && administrators.length > 0 && currentUser && (
                    <AdministratorList
                        administrators={administrators.map(({ username, email, authorities }) => ({
                            username,
                            email,
                            authorities,
                        }))}
                        currentUsername={currentUser.username}
                    />
                )}
            </div>
        </PageShell>
    );
}
