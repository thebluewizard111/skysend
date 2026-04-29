import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AppButton } from "@/components/shared/app-button";
import type { PageHeaderAction } from "@/types/ui";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: PageHeaderAction[];
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions = [],
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl space-y-3">
        {eyebrow ? (
          <Badge variant="outline" className="w-fit">
            {eyebrow}
          </Badge>
        ) : null}
        <div className="space-y-2">
          <h1 className="type-h2">{title}</h1>
          {description ? <p className="type-subtitle">{description}</p> : null}
        </div>
      </div>

      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => {
            const content = (
              <>
                {action.icon}
                {action.label}
              </>
            );

            if (action.href) {
              return (
                <AppButton
                  key={`${action.label}-${action.href}`}
                  asChild
                  variant={action.variant ?? "outline"}
                  size="sm"
                >
                  <Link href={action.href}>{content}</Link>
                </AppButton>
              );
            }

            return (
              <AppButton
                key={action.label}
                type="button"
                variant={action.variant ?? "outline"}
                size="sm"
                onClick={action.onClick}
              >
                {content}
              </AppButton>
            );
          })}
        </div>
      ) : null}
    </header>
  );
}
