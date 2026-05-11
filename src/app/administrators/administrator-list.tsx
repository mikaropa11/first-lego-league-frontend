"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/app/components/button";
import { UserEntity } from "@/types/user";
import { useTranslations } from "@/lib/languageContext";
import DeleteAdministratorDialog from "./delete-administrator-dialog";
import CopyEmailButton from "@/app/components/copy-email-button";

interface AdministratorListProps {
  readonly administrators: UserEntity[];
  readonly currentUsername: string;
}

export default function AdministratorList({
  administrators,
  currentUsername,
}: AdministratorListProps) {
  const t = useTranslations();
  const router = useRouter();
  const [adminToDelete, setAdminToDelete] = useState<UserEntity | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  function handleDeleteSuccess() {
    setAdminToDelete(null);
    setSuccessMessage(t.administrators.administratorDeleted);
    router.refresh();
  }

  return (
    <>
      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 border border-green-500/20 bg-green-500/10 px-4 py-3"
        >
          <CheckCircle
            className="h-5 w-5 shrink-0 text-green-600"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-green-700">{successMessage}</p>
        </div>
      )}

      <ul className="list-grid">
        {administrators.map((administrator) => {
          const isSelf = administrator.username === currentUsername;
          const deleteLabel = isSelf
            ? t.administrators.cannotDeleteOwnAccount
            : `${t.administrators.deleteAdministrator} ${administrator.username}`;

          return (
            <li key={administrator.username} className="list-card pl-7">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="list-kicker">{t.administrators.administratorLabel}</div>

                  <Link
                    className="list-title block hover:text-primary"
                    href={`/users/${administrator.username}`}
                  >
                    {administrator.username}
                  </Link>

                  {administrator.email && (
                    <div className="list-support flex items-center gap-2">
                      {administrator.email}
                      <CopyEmailButton email={administrator.email} />
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {administrator.authorities?.map((authority) => (
                      <span
                        key={`${administrator.username}-${authority.authority}`}
                        className="status-badge"
                      >
                        {authority.authority}
                      </span>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isSelf}
                  aria-disabled={isSelf}
                  title={deleteLabel}
                  aria-label={deleteLabel}
                  onClick={() => setAdminToDelete(administrator)}
                >
                  <Trash2 aria-hidden="true" />
                  {t.administrators.deleteAdministrator}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {adminToDelete && (
        <DeleteAdministratorDialog
          administrator={adminToDelete}
          onSuccess={handleDeleteSuccess}
          onCancel={() => setAdminToDelete(null)}
        />
      )}
    </>
  );
}
