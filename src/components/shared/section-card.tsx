import type { ComponentProps, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SectionCardProps = ComponentProps<typeof Card> & {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function SectionCard({
  eyebrow,
  title,
  description,
  children,
  footer,
  ...props
}: SectionCardProps) {
  return (
    <Card {...props}>
      <CardHeader className="gap-3">
        {eyebrow ? (
          <Badge variant="outline" className="w-fit">
            {eyebrow}
          </Badge>
        ) : null}
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="grid gap-5">
        {children}
        {footer ? <div className="pt-1">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
