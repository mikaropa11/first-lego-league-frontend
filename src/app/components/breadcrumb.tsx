import Link from "next/link"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: Readonly<BreadcrumbProps>) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground mb-6",
        className
      )}
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && (
            <ChevronRight className="size-4 text-border" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="text-foreground hover:text-primary transition-colors hover:underline"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
