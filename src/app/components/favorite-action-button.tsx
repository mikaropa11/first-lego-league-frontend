"use client";

import { Button } from "@/app/components/button";
import { useFavorites } from "@/app/components/favorites-provider";
import { FavoriteEntityType, FavoriteItem } from "@/lib/favorites";
import { Star } from "lucide-react";

interface FavoriteActionButtonProps {
    readonly type: FavoriteEntityType;
    readonly id: string;
    readonly label: string;
    readonly href: string;
    readonly secondaryLabel?: string;
    readonly className?: string;
}

function buildFavoriteItem(props: FavoriteActionButtonProps): FavoriteItem {
    return {
        type: props.type,
        id: props.id,
        label: props.label,
        href: props.href,
        secondaryLabel: props.secondaryLabel,
    };
}

export default function FavoriteActionButton(props: Readonly<FavoriteActionButtonProps>) {
    const { toggleFavorite, isFavorite } = useFavorites();
    const favorite = buildFavoriteItem(props);
    const active = isFavorite(props.type, props.id);

    return (
        <Button
            type="button"
            variant={active ? "outline" : "secondary"}
            size="sm"
            className={props.className}
            onClick={() => toggleFavorite(favorite)}
            aria-pressed={active}
        >
            <Star className={active ? "h-4 w-4 fill-current" : "h-4 w-4"} />
            {active ? "Remove favorite" : "Add to favorites"}
        </Button>
    );
}
