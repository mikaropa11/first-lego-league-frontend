"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/app/components/button";
import ConfirmDestructiveDialog from "@/app/components/confirm-destructive-dialog";
import { deleteAwardAction } from "./_awards-actions";

export interface AwardSnapshot {
  id?: string;
  uri?: string;
  name?: string;
  title?: string;
  category?: string;
  description?: string;
}

interface AwardsSectionProps {
  readonly teamId: string;
  readonly awards: AwardSnapshot[];
  readonly isAdmin: boolean;
}

export default function AwardsManager({ teamId, awards, isAdmin }: Readonly<AwardsSectionProps>) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if ((!awards || awards.length === 0) && !successMessage) {
    return null;
  }

  return (
    <div className="mt-8">
      {successMessage && (
        <output className="block mb-4 rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </output>
      )}

      {awards && awards.length > 0 && (
        <AwardsSection
          teamId={teamId}
          awards={awards}
          isAdmin={isAdmin}
          onSuccess={setSuccessMessage}
        />
      )}
    </div>
  );
}

interface InternalAwardsSectionProps extends AwardsSectionProps {
  readonly onSuccess: (msg: string | null) => void;
}

function AwardsSection({ teamId, awards, isAdmin, onSuccess }: Readonly<InternalAwardsSectionProps>) {
  const [awardToDelete, setAwardToDelete] = useState<AwardSnapshot | null>(null);

  const handleDelete = async () => {
    if (!awardToDelete) return;
    const awardId =
      awardToDelete.uri?.split("/").findLast(Boolean) ?? awardToDelete.id;

    if (!awardId) {
      throw new Error("Could not determine which award to delete");
    }
    
    const result = await deleteAwardAction(teamId, awardId);
    if (!result.success) {
      throw new Error(result.error);
    }

    onSuccess(`Successfully deleted award: ${awardToDelete.name ?? awardToDelete.title ?? awardToDelete.category ?? "Unknown Award"}`);
    setAwardToDelete(null);
  };

  return (
    <section aria-labelledby="team-awards-heading">
      <h2 id="team-awards-heading" className="mb-4 text-xl font-semibold">
        Awards
      </h2>
      <div className="space-y-3">
        {awards.map((award, index) => {
          const awardName = award.name ?? award.title ?? award.category ?? `Award ${index + 1}`;
          
          return (
            <div
              key={award.uri ?? String(award.id ?? index)}
              className="flex items-center justify-between rounded-md border border-border p-4 bg-card"
            >
              <div>
                <p className="font-medium text-foreground">{awardName}</p>
                {award.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {award.description}
                  </p>
                )}
              </div>
              
              {isAdmin && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setAwardToDelete(award);
                    onSuccess(null);
                  }}
                >
                  Delete
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {awardToDelete && (
        <ConfirmDestructiveDialog
          title="Delete Award"
          description={
            <>
              Are you sure you want to delete the award{" "}
              <strong>{awardToDelete.name ?? awardToDelete.title ?? awardToDelete.category ?? "this award"}</strong>? 
              This action cannot be undone.
            </>
          }
          confirmLabel="Delete Award"
          pendingLabel="Deleting..."
          onConfirm={handleDelete}
          onCancel={() => setAwardToDelete(null)}
        />
      )}
    </section>
  );
}