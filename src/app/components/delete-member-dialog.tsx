"use client";

import { TeamsService } from "@/api/teamApi";
import { Button } from "@/app/components/button";
import ErrorAlert from "@/app/components/error-alert";
import { clientAuthProvider } from "@/lib/authProvider";
import { parseErrorMessage } from "@/types/errors";
import { useEffect, useId, useMemo, useRef, useState } from "react";

interface MemberToDelete {
    name: string;
    uri: string;
}

interface DeleteMemberDialogProps {
    member: MemberToDelete;
    onSuccess: (uri: string) => void;
    onCancel: () => void;
}

export function DeleteMemberDialog({
    member,
    onSuccess,
    onCancel,
}: Readonly<DeleteMemberDialogProps>) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const [isDeleting, setIsDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const service = useMemo(() => new TeamsService(clientAuthProvider), []);

    useEffect(() => {
        const dialog = dialogRef.current;

        if (dialog) {
            dialog.showModal();
        }
    }, []);

    async function handleDelete() {
        setIsDeleting(true);
        setErrorMessage(null);

        try {
            await service.removeTeamMember(member.uri);
            onSuccess(member.uri);
        } catch (e) {
            setErrorMessage(parseErrorMessage(e));
            setIsDeleting(false);
        }
    }

    return (
        <dialog
            ref={dialogRef}
            className="m-auto w-full max-w-sm rounded-lg border p-6 shadow-lg backdrop:bg-black/50"
            onClose={onCancel}
            aria-labelledby={titleId}
        >
            <h2 id={titleId} className="text-lg font-bold">
                Remove Member
            </h2>

            <p className="py-4 text-sm">
                Are you sure you want to remove <b>{member.name}</b>?
            </p>

            {errorMessage && <ErrorAlert message={errorMessage} className="mb-4" />}

            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
                    Cancel
                </Button>

                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? "Removing..." : "Delete"}
                </Button>
            </div>
        </dialog>
    );
}
