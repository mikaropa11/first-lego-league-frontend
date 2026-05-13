import { EditionsService } from "@/api/editionApi";
import { UsersService } from "@/api/userApi";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { getEditionOptions } from "@/lib/editionOptions";
import type { SelectOption } from "@/lib/editionOptions";
import { AuthenticationError, parseErrorMessage } from "@/types/errors";
import { User } from "@/types/user";
import { redirect } from "next/navigation";
import NewTeamForm from "./form";

export const dynamic = "force-dynamic";

export default async function NewTeamPage() {
    const auth = await serverAuthProvider.getAuth();
    if (!auth) {
        redirect("/login");
    }

    let currentUser: User | null = null;
    let error: string | null = null;
    let editionOptions: SelectOption[] = [];
    let editionsError: string | null = null;

    try {
        currentUser = await new UsersService(serverAuthProvider).getCurrentUser();
    } catch (e) {
        if (e instanceof AuthenticationError) {
            redirect("/login");
        }

        error = parseErrorMessage(e);
    }

    if (!error && !currentUser) {
        redirect("/login");
    }

    if (!error && !isAdmin(currentUser)) {
        redirect("/");
    }

    if (!error) {
        try {
            const editions = await new EditionsService(serverAuthProvider).getEditions();
            editionOptions = getEditionOptions(editions);
        } catch (e) {
            console.error("Failed to fetch editions:", e);
            editionsError = parseErrorMessage(e);
        }
    }

    return (
        <PageShell
            eyebrow="Team management"
            title="New Team"
            description="Create a team, add its members, and register one or two coaches in a single flow."
        >
            {error ? <ErrorAlert message={error} /> : <NewTeamForm editionOptions={editionOptions} />}
            {!error && editionsError && (
                <div className="mt-4">
                    <ErrorAlert message={`Could not load editions. ${editionsError}`} />
                </div>
            )}
        </PageShell>
    );
}
