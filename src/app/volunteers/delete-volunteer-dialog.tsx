'use client';

import { VolunteersService } from "@/api/volunteerApi";
import { Button } from "@/app/components/button";
import ErrorAlert from "@/app/components/error-alert";
import { clientAuthProvider } from "@/lib/authProvider";
import { parseErrorMessage } from "@/types/errors";
import { useEffect, useId, useRef, useState } from "react";

interface VolunteerToDelete {
    name: string;
    uri: string;
}

interface DeleteVolunteerDialogProps {
    volunteer: VolunteerToDelete;
    onSuccess: (uri: string) => void;
    onCancel: () => void;
}

export function DeleteVolunteerDialog({ volunteer, onSuccess, onCancel }: Readonly<DeleteVolunteerDialogProps>) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const [isDeleting, setIsDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    const service = new VolunteersService(clientAuthProvider);

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
            await service.deleteVolunteer(volunteer.uri);
            onSuccess(volunteer.uri);
        } catch (e) {
            setErrorMessage(parseErrorMessage(e));
            setIsDeleting(false);
        }
    }

    return (
        <dialog 
            ref={dialogRef} 
            className="m-auto p-6 rounded-lg border shadow-lg backdrop:bg-black/50 w-full max-w-sm"
            onClose={onCancel}
        >
            <h2 id={titleId} className="text-lg font-bold">Delete Volunteer</h2>
            <p className="py-4 text-sm">Are you sure you want to remove <b>{volunteer.name}</b> from the volunteers directory?</p>
            
            {errorMessage && <ErrorAlert message={errorMessage} className="mb-4" />}

            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
                    Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete"}
                </Button>
            </div>
        </dialog>
    );
}
