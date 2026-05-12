import { ScientificProjectsService } from '@/api/scientificProjectApi';
import { UsersService } from '@/api/userApi';
import ErrorAlert from '@/app/components/error-alert';
import PageShell from '@/app/components/page-shell';
import { serverAuthProvider } from '@/lib/authProvider';
import { isAdmin } from '@/lib/authz';
import { fetchEditionFormData, EditionFormData } from '@/app/scientific-projects/_fetch-edition-data';
import { AuthenticationError, NotFoundError, parseErrorMessage } from '@/types/errors';
import { redirect } from 'next/navigation';
import EditScientificProjectForm from './form';

export const dynamic = 'force-dynamic';

async function assertAdminUser(id: string): Promise<void> {
    try {
        const user = await new UsersService(serverAuthProvider).getCurrentUser();
        if (!user) redirect('/login');
        if (!isAdmin(user)) redirect(`/scientific-projects/${id}`);
    } catch (e) {
        if (e instanceof AuthenticationError) redirect('/login');
        throw e;
    }
}

interface EditScientificProjectPageProps {
    readonly params: Promise<{ id: string }>;
}

export default async function EditScientificProjectPage(props: Readonly<EditScientificProjectPageProps>) {
    const { id } = await props.params;

    let error: string | null = null;

    try {
        await assertAdminUser(id);
    } catch (e) {
        error = parseErrorMessage(e);
    }

    let project = null;
    if (!error) {
        try {
            project = await new ScientificProjectsService(serverAuthProvider).getScientificProjectById(id);
        } catch (e) {
            error = e instanceof NotFoundError
                ? 'This scientific project does not exist.'
                : parseErrorMessage(e);
        }
    }

    let editionData: EditionFormData | null = null;
    if (project && !error) {
        try {
            editionData = await fetchEditionFormData(serverAuthProvider);
        } catch (e) {
            error = parseErrorMessage(e);
        }
    }

    const teamHref = project?.link('team')?.href ?? project?.team ?? '';
    const editionHref = project?.link('edition')?.href ?? project?.edition ?? '';
    const projectName = project?.name ?? '';
    const [legacyName = '', ...rest] = (project?.comments ?? '').split('\n\n');
    const derivedName = projectName || legacyName;
    const description = rest.join('\n\n');

    return (
        <PageShell
            eyebrow="Innovation project"
            title="Edit Scientific Project"
            description="Update the project's information."
        >
            {error && <ErrorAlert message={error} />}
            {project && !error && editionData && (
                <EditScientificProjectForm
                    projectId={id}
                    defaultValues={{
                        name: derivedName,
                        description,
                        score: project?.score ?? 0,
                        edition: editionHref,
                        team: teamHref,
                    }}
                    editionOptions={editionData.editionOptions}
                    teamsPerEdition={editionData.teamsPerEdition}
                />
            )}
        </PageShell>
    );
}
