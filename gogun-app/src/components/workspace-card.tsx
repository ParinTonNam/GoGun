import Link from "next/link";
import type { ReactNode } from "react";

export function WorkspaceCard({ title, description, href, action = "เปิดดู", children }: {
  title: string; description?: string; href: string; action?: string; children?: ReactNode;
}) {
  return <section className="workspace-card feature-card">
    <h2>{title}</h2>
    {description && <p className="workspace-meta">{description}</p>}
    {children}
    <Link className="workspace-button" href={href}>{action} →</Link>
  </section>;
}
