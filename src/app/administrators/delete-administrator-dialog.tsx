"use client";

import { UsersService } from "@/api/userApi";
import ConfirmDestructiveDialog from "@/app/components/confirm-destructive-dialog";
import { clientAuthProvider } from "@/lib/authProvider";
import { useTranslations } from "@/lib/languageContext";
import { UserEntity } from "@/types/user";

interface DeleteAdministratorDialogProps {
  readonly administrator: UserEntity;
  readonly onSuccess: () => void;
  readonly onCancel: () => void;
}

export default function DeleteAdministratorDialog({
  administrator,
  onSuccess,
  onCancel,
}: DeleteAdministratorDialogProps) {
  const t = useTranslations();
  const service = new UsersService(clientAuthProvider);

  // Open as a native modal — built-in focus trap, backdrop and accessibility

  // Intercept the native Escape cancel event to block closing while a delete is in progress

  // The shared dialog already handles pending and error states for us.
  async function handleDelete() {
    await service.deleteUser(administrator.username);
    onSuccess();
  }

  return (
    <ConfirmDestructiveDialog
      title={t.administrators.deleteAdministrator}
      description={
        <p>
          {t.administrators.deleteAdministratorConfirmationPrefix} <span className="font-semibold text-foreground">
            {administrator.username}
          </span>
          {administrator.email && (
            <>
              {" "}
              (<span className="text-foreground">{administrator.email}</span>)
            </>
          )}
          {" "}
          {t.administrators.deleteAdministratorConfirmationSuffix}
        </p>
      }
      confirmLabel={t.administrators.deleteAdministrator}
      pendingLabel={t.common.loading}
      onConfirm={handleDelete}
      onCancel={onCancel}
    />
  );
}
