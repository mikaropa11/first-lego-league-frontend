import { VolunteersService } from "@/api/volunteerApi";
import { UsersService } from "@/api/userApi";
import { buttonVariants } from "@/app/components/button";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { serverAuthProvider } from "@/lib/authProvider";
import { cn } from "@/lib/utils";
import { parseErrorMessage } from "@/types/errors";
import { Volunteer } from "@/types/volunteer";
import { isAdmin } from "@/lib/authz";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import VolunteersClient, { VolunteerItem } from "./volunteers-client";

export const dynamic = "force-dynamic";

function toVolunteerItem(v: Volunteer): VolunteerItem {
    return {
        name: v.name,
        emailAddress: v.emailAddress,
        type: v.type,
        uri: v.uri,
        expert: v.expert
    };
}

export default async function VolunteersPage() {
    const service = new VolunteersService(serverAuthProvider);
    const usersService = new UsersService(serverAuthProvider);

    let judges: VolunteerItem[] = [];
    let referees: VolunteerItem[] = [];
    let floaters: VolunteerItem[] = [];
    let error: string | null = null;
    let userIsAdmin = false;

    try {
        const currentUser = await usersService.getCurrentUser();
        userIsAdmin = isAdmin(currentUser);

        const data = await service.getVolunteers();
        judges = data.judges.map(toVolunteerItem);
        referees = data.referees.map(toVolunteerItem);
        floaters = data.floaters.map(toVolunteerItem);
        
    } catch (e) {
        error = parseErrorMessage(e);
    }

    return (
        <PageShell
            eyebrow="Volunteers directory"
            title="Volunteers"
            description="Manage the competition volunteers including judges, referees, and floaters."
            bannerClassName="volunteers-page-banner"
            panelClassName="volunteers-page-panel"
            heroAside={
                <div className="volunteers-page-hero-aside">
                    {userIsAdmin && (
                        <Link
                            href="/volunteers/new"
                            className={cn(buttonVariants(), "volunteers-page-create-button")}
                        >
                            <span className="volunteers-page-create-button__label">
                                New volunteer
                            </span>
                            <ArrowUpRight aria-hidden="true" />
                        </Link>
                    )}
                </div>
            }
        >
            <div className="space-y-8">
                {error && <ErrorAlert message={error} />}

                {!error && (
                    <VolunteersClient
                        judges={judges}
                        referees={referees}
                        floaters={floaters}
                        isAdmin={userIsAdmin}
                    />
                )}
            </div>
        </PageShell>
    );
}
