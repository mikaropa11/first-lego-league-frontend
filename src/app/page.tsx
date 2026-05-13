"use client";

import PageShell from "@/app/components/page-shell";
import Link from "next/link";
import { useAuth } from "@/app/components/authentication";
import { useTranslations } from "@/lib/languageContext";

interface Module {
  href: string;
  title: string;
  description: string;
  roles?: string[];
}

export default function Home() {
  const { user } = useAuth();
  const t = useTranslations();

  const allModules: Module[] = [
    {
      href: "/teams",
      title: t.home.modules.teams.title,
      description: t.home.modules.teams.description,
    },
    {
      href: "/volunteers",
      title: t.home.modules.volunteers.title,
      description: t.home.modules.volunteers.description,
    },
    {
      href: "/matches",
      title: t.home.modules.matches.title,
      description: t.home.modules.matches.description,
    },
    {
      href: "/scientific-projects",
      title: t.home.modules.scientificProjects.title,
      description: t.home.modules.scientificProjects.description,
    },
    {
      href: "/project-rooms",
      title: t.home.modules.projectRooms.title,
      description: t.home.modules.projectRooms.description,
    },
    {
      href: "/competition-tables",
      title: t.home.modules.competitionTables.title,
      description: t.home.modules.competitionTables.description,
    },
    {
      href: "/administrators",
      title: t.home.modules.administrators.title,
      description: t.home.modules.administrators.description,
      roles: ["ROLE_ADMIN"],
    }
  ];

  const visibleModules = allModules.filter((module) => 
    !module.roles || user?.authorities?.some(auth => module.roles?.includes(auth.authority))
  );

  return (
    <PageShell
      eyebrow={t.home.eyebrow}
      title={t.home.title}
      description={t.home.description}
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="page-eyebrow">{t.home.competitionHub}</div>
          <h2 className="section-title">{t.home.platformModules}</h2>
          <p className="section-copy max-w-2xl">
            {t.home.platformDescription}
          </p>
        </div>

        <div className="module-grid">
          {visibleModules.map((module) => (
            <Link key={module.href} href={module.href} className="module-card">
              <h2 className="module-title">{module.title}</h2>
              <p className="module-copy">{module.description}</p>
              <span className="module-link">{t.home.openModule}</span>
            </Link>
          ))}
        </div>

        <div className="border-t border-border pt-4 text-sm font-medium text-muted-foreground">
          {t.home.tagline}
        </div>
      </div>
    </PageShell>
  );
}