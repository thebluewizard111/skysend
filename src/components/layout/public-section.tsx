import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

type PublicSectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function PublicSection({
  id,
  eyebrow,
  title,
  description,
  children,
}: PublicSectionProps) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex flex-col gap-6">
        <div className="max-w-3xl space-y-3">
          <Badge variant="outline">{eyebrow}</Badge>
          <h2 className="type-h2">{title}</h2>
          <p className="type-subtitle">{description}</p>
        </div>
        {children}
      </div>
    </section>
  );
}
