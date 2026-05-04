"use client";

import PageShell from "@/app/components/page-shell";
import Link from "next/link";
import { useAuth } from "@/app/components/authentication"; // Importamos el hook de auth

export default function Home() {
  const { user } = useAuth(); // Obtenemos el usuario actual

  // Definimos todos los módulos posibles
  const allModules = [
    {
      href: "/teams",
      title: "Teams",
      description: "Participating teams and details.",
    },
    {
      href: "/volunteers",
      title: "Volunteers",
      description: "Volunteer management.",
    },
    {
      href: "/matches",
      title: "Matches",
      description: "Scheduled competitions and results.",
    },
    {
      href: "/scientific-projects",
      title: "Scientific Projects",
      description: "Innovation projects by edition.",
    },
    {
      href: "/project-rooms",
      title: "Project Rooms",
      description: "Judging rooms, panels and assigned projects.",
    },
    {
      href: "/competition-tables",
      title: "Competition Tables",
      description: "Match tables and referee assignments.",
    },
    {
      href: "/administrators",
      title: "Administrators",
      description: "User role management.",
      roles: ["ROLE_ADMIN"], 
    }
  ];

  const visibleModules = allModules.filter((module) => 
    !module.roles || user?.authorities?.some(auth => module.roles?.includes(auth.authority))
  );

  return (
    <PageShell
      eyebrow="International STEM program"
      title="First LEGO League"
      description="Robotics, innovation and teamwork for young participants."
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="page-eyebrow">Competition hub</div>
          <h2 className="section-title">Platform modules</h2>
          <p className="section-copy max-w-2xl">
            Explore the main areas of the platform for teams, editions and innovation projects.
          </p>
        </div>

        <div className="module-grid">
          {visibleModules.map((module) => (
            <Link key={module.href} href={module.href} className="module-card">
              <h2 className="module-title">{module.title}</h2>
              <p className="module-copy">{module.description}</p>
              <span className="module-link">Open module</span>
            </Link>
          ))}
        </div>

        <div className="border-t border-border pt-4 text-sm font-medium text-muted-foreground">
          Innovation project, robot game and core values.
        </div>
      </div>
    </PageShell>
  );
}