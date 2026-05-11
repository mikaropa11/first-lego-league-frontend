import { EditionsService } from "@/api/editionApi";
import { UsersService } from "@/api/userApi";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { AuthenticationError, parseErrorMessage } from "@/types/errors";
import { User } from "@/types/user";
import { redirect } from "next/navigation";
import NewVolunteerForm, { VolunteerEditionOption } from "./form";

export const dynamic = "force-dynamic";

function getEditionLabel(year?: number, venueName?: string) {
    if (!year) {
        return venueName || "Edition";
    }

    return venueName ? `${year} - ${venueName}` : String(year);
}

export default async function NewVolunteerPage() {
    const auth = await serverAuthProvider.getAuth();
    if (!auth) {
        redirect("/login");
    }

    let currentUser: User | null = null;
    let editionOptions: VolunteerEditionOption[] = [];
    let error: string | null = null;

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
            editionOptions = editions
                .map((edition) => {
                    const value = edition.link("self")?.href ?? edition.uri ?? "";

                    return value
                        ? {
                            label: getEditionLabel(edition.year, edition.venueName),
                            value,
                        }
                        : null;
                })
                .filter((option): option is VolunteerEditionOption => option !== null)
                .toSorted((left, right) => left.label.localeCompare(right.label));
        } catch (e) {
            error = parseErrorMessage(e);
        }
    }

    return (
        <PageShell
            eyebrow="Volunteers directory"
            title="New Volunteer"
            description="Register a judge, referee, or floater and assign them to an edition."
        >
            {error ? <ErrorAlert message={error} /> : <NewVolunteerForm editionOptions={editionOptions} />}
        </PageShell>
    );
}
