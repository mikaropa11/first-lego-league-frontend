import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { serverAuthProvider } from "@/lib/authProvider";
import { fetchEditionFormData, EditionFormData } from "@/app/scientific-projects/_fetch-edition-data";
import { parseErrorMessage } from "@/types/errors";
import { redirect } from "next/navigation";
import NewScientificProjectForm from "./form";

export default async function NewScientificProjectPage() {
    const auth = await serverAuthProvider.getAuth();
    if (!auth) redirect("/login");

    let editionData: EditionFormData | null = null;
    let error: string | null = null;
    try {
        editionData = await fetchEditionFormData(serverAuthProvider);
    } catch (e) {
        error = parseErrorMessage(e);
    }

    return (
        <PageShell
            eyebrow="Innovation project"
            title="New Scientific Project"
            description="Submit a new scientific project for a FIRST LEGO League edition."
        >
            {error && <ErrorAlert message={error} />}
            {!error && editionData && !editionData.hasActiveEdition && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                    This action is available only while the edition is active (OPEN). No active edition found.
                </div>
            )}
            {!error && editionData && editionData.hasActiveEdition && (
                <NewScientificProjectForm
                    editionOptions={editionData.editionOptions}
                    teamsPerEdition={editionData.teamsPerEdition}
                />
            )}
        </PageShell>
    );
}