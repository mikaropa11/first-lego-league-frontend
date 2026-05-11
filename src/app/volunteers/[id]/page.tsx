import { VolunteersService } from "@/api/volunteerApi";
import { UsersService } from "@/api/userApi";
import { serverAuthProvider } from "@/lib/authProvider";
import { revalidatePath } from "next/cache";
import EditVolunteerModal from "./edit-volunteer-modal";
import EmptyState from "@/app/components/empty-state";
import { Breadcrumb } from "@/app/components/breadcrumb";
import { Volunteer } from "@/types/volunteer";
import { User } from "@/types/user";
import { parseErrorMessage } from "@/types/errors";
import { isAdmin } from "@/lib/authz";
import { getServerTranslations } from "@/lib/i18n/server";


interface Props {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ edit?: string }>;
}

export default async function VolunteerDetailPage(props: Readonly<Props>) {
    const t = await getServerTranslations();
    const { id } = await props.params;
    const usersService = new UsersService(serverAuthProvider);
    const volunteerService = new VolunteersService(serverAuthProvider);

    const currentUser = await usersService.getCurrentUser();
    const userIsAdmin = isAdmin(currentUser);

    let volunteer: Volunteer | null = null;
    try {
        const data = await volunteerService.getVolunteers();
        const all = [...data.judges, ...data.referees, ...data.floaters];
        volunteer = all.find(v => v.uri === decodeURIComponent(id)) ?? null;
    } catch (e) { console.error(e); }

       async function updateVolunteerData(uri: string, data: Partial<Volunteer>) {
        'use server';

        const actionT = await getServerTranslations();
        const user = await new UsersService(serverAuthProvider).getCurrentUser();
        if (!isAdmin(user)) {
            return { success: false, error: actionT.volunteers.accessDeniedAdmin };
        }

        try {
            await new VolunteersService(serverAuthProvider).updateVolunteer(uri, data);
            revalidatePath('/volunteers');
            return { success: true };
        } catch (e) {
            return { success: false, error: parseErrorMessage(e) };
        }
    }
    if (!volunteer) return <EmptyState title={t.volunteers.notFound} />;

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-3xl px-4 py-10">
                <Breadcrumb
                    items={[
                        { label: t.breadcrumb.home, href: "/" },
                        { label: t.breadcrumb.volunteers, href: "/volunteers" },
                        { label: volunteer.name || t.volunteers.volunteerName },
                    ]}
                />
                <div className="w-full rounded-lg border bg-white p-6 shadow-sm dark:bg-black">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold">{volunteer.name || t.volunteers.unnamed}</h1>
                        {volunteer.type === 'Judge' && volunteer.expert && (
                            <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full font-bold uppercase border border-amber-200">
                                {t.volunteers.expertJudge}
                            </span>
                        )}
                    </div>
                    <div className="mt-4 space-y-1 text-sm text-muted-foreground border-t pt-4">
                        <p><strong>{t.volunteers.role}:</strong> {volunteer.type}</p>
                        <p><strong>{t.volunteers.email}:</strong> {volunteer.emailAddress || "-"}</p>
                        <p><strong>{t.volunteers.phone}:</strong> {volunteer.phoneNumber || "-"}</p>
                        <p><strong>{t.volunteers.expert}:</strong> {volunteer.expert ? t.volunteers.yes : t.volunteers.no}</p>
                    </div>

                    {volunteer.type === "Judge" && (
                        <div className="mt-6 space-y-2">
                            <h2 className="text-xl font-semibold border-t pt-4">{t.volunteers.judgeInfo}</h2>
                            <p><strong>{t.volunteers.expert}:</strong> {volunteer.expert ? t.volunteers.yes : t.volunteers.no}</p>
                        </div>
                    )}
                </div>
                {userIsAdmin && <EditVolunteerModal volunteer={volunteer} updateAction={updateVolunteerData} />}
            </div>
        </div>
    );
}
