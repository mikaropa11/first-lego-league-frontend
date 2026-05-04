import { UsersService } from "@/api/userApi";
import PageShell from "@/app/components/page-shell";
import ErrorAlert from "@/app/components/error-alert";
import EditProfileForm from "@/app/components/edit-profile-form";
import { serverAuthProvider } from "@/lib/authProvider";
import { parseErrorMessage, NotFoundError } from "@/types/errors";
import Link from "next/link";
import { User } from "@/types/user";
import { buttonVariants } from "@/app/components/button";

interface UsersPageProps {
    readonly params: Promise<{ id: string }>;
}

export default async function UsersPage(props: Readonly<UsersPageProps>) {
    const { id } = await props.params;

    const userService = new UsersService(serverAuthProvider);

    let user: User | null = null;
    let currentUser: User | null = null;
    let error: string | null = null;

    try {
        user = await userService.getUserById(id);
    } catch (e) {
        console.error("Failed to fetch user:", e);
        error =
            e instanceof NotFoundError
                ? "This user does not exist."
                : parseErrorMessage(e);
    }

    try {
        currentUser = await userService.getCurrentUser();
    } catch (e) {
        console.error("Failed to fetch current user:", e);
    }

    const isOwner =
        !!(currentUser && user && currentUser.username === user.username);

    const isCurrentUserAdmin =
        !!currentUser?.authorities?.some(
            (authority) => authority.authority === "ROLE_ADMIN"
        );

    if (error) {
        return (
            <PageShell
                eyebrow="Participant profile"
                title="User not found"
                description="The user you're looking for could not be found."
            >
                <ErrorAlert message={error} />
            </PageShell>
        );
    }

    return (
        <PageShell
            eyebrow="Participant profile"
            title={user?.username || "User"}
            description="Profile information for this participant."
        >
            <div className="space-y-8">
                <div className="space-y-3">
                    <div className="page-eyebrow">User details</div>
                    <h2 className="section-title">{user?.username}</h2>

                    {user?.email && (
                        <p className="section-copy">
                            <strong>Email:</strong> {user.email}
                        </p>
                    )}
                </div>

                {isOwner && user && (
                    <>
                        <div className="editorial-divider" />

                        <EditProfileForm
                            userId={id}
                            currentEmail={user.email}
                        />

                        {isCurrentUserAdmin && (
                            <div className="mt-4">
                                <Link
                                    href="/administrators"
                                    className={buttonVariants({
                                        variant: "secondary",
                                    })}
                                >
                                    view and create other administrators
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </PageShell>
    );
}
