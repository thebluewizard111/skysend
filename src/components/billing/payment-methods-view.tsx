"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  CreditCard,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { AppButton } from "@/components/shared/app-button";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { stripeTestCards } from "@/constants/stripe-test-cards";
import { cn } from "@/lib/utils";
import type { ClientSavedTestCard } from "@/types/payment-methods";
import type { StripeTestCard } from "@/types/stripe";

type PaymentMethodsViewProps = {
  initialCards: ClientSavedTestCard[];
};

const statusLabels: Record<ClientSavedTestCard["status"], string> = {
  active: "Active",
  test_ready: "Ready",
  needs_review: "Needs review",
};

const statusTones: Record<
  ClientSavedTestCard["status"],
  "success" | "info" | "warning"
> = {
  active: "success",
  test_ready: "info",
  needs_review: "warning",
};

function getAvailableTestCard(cards: readonly ClientSavedTestCard[]) {
  const usedLast4 = new Set(cards.map((card) => card.last4));

  return stripeTestCards.find((card) => !usedLast4.has(card.last4)) ?? null;
}

function getTestCardStatus(card: StripeTestCard): ClientSavedTestCard["status"] {
  return card.behaviorLabel === "Payment succeeds" ? "test_ready" : "needs_review";
}

type AddTestCardPanelProps = {
  cards: readonly ClientSavedTestCard[];
  open: boolean;
  onClose: () => void;
  onAdd: (card: StripeTestCard) => void;
};

function AddTestCardPanel({
  cards,
  open,
  onClose,
  onAdd,
}: AddTestCardPanelProps) {
  const titleId = useId();
  const usedLast4 = useMemo(() => new Set(cards.map((card) => card.last4)), [cards]);
  const firstAvailableCard = useMemo(
    () => stripeTestCards.find((card) => !usedLast4.has(card.last4)) ?? stripeTestCards[0],
    [usedLast4],
  );
  const [selectedCardId, setSelectedCardId] = useState(firstAvailableCard.id);
  const selectedCard =
    stripeTestCards.find((card) => card.id === selectedCardId) ?? firstAvailableCard;
  const selectedCardAlreadyAdded = usedLast4.has(selectedCard.last4);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setSelectedCardId(firstAvailableCard.id);
    });

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [firstAvailableCard.id, onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close Add Card"
        className="absolute inset-0 bg-[rgba(15,23,38,0.32)]"
        onClick={onClose}
      />

      <aside className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-[2rem] border border-border/80 bg-background shadow-[var(--elevation-panel)] md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[32rem] md:rounded-none md:rounded-l-[2rem]">
        <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-border md:hidden" />

        <div className="flex items-start justify-between gap-4 border-b border-border/80 px-5 py-5 md:px-6">
          <div className="space-y-3">
            <Badge variant="outline" className="w-fit">
              Add Card
            </Badge>
            <div className="space-y-2">
              <h2 id={titleId} className="type-h3">
                Choose a saved card profile
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Card details are managed through Stripe, while SkySend keeps a
                saved payment reference for checkout.
              </p>
            </div>
          </div>

          <AppButton
            type="button"
            variant="ghost"
            size="icon-sm"
        aria-label="Close Add Card"
            onClick={onClose}
          >
            <X />
          </AppButton>
        </div>

        <div className="grid flex-1 gap-4 overflow-y-auto px-5 py-5 md:px-6">
          {stripeTestCards.map((card) => {
            const isSelected = selectedCardId === card.id;
            const isAlreadyAdded = usedLast4.has(card.last4);

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedCardId(card.id)}
                className={cn(
                  "rounded-[calc(var(--radius)+0.5rem)] border p-4 text-left transition-colors",
                  isSelected
                    ? "border-border bg-card shadow-[var(--elevation-card)] ring-4 ring-ring"
                    : "border-border/80 bg-secondary/45 hover:bg-secondary/65",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-background text-foreground">
                      <CreditCard className="size-4" />
                    </span>
                    <div className="grid gap-1">
                      <p className="font-medium text-foreground">{card.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {card.brand} ending in {card.last4}
                      </p>
                    </div>
                  </div>
                  <StatusBadge
                    label={isAlreadyAdded ? "Added" : card.behaviorLabel}
                    tone={
                      isAlreadyAdded
                        ? "neutral"
                        : card.behaviorLabel === "Payment succeeds"
                          ? "success"
                          : "warning"
                    }
                  />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Brand</p>
                    <p className="mt-1 font-medium text-foreground">{card.brand}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last 4</p>
                    <p className="mt-1 font-medium text-foreground">{card.last4}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Behavior</p>
                    <p className="mt-1 font-medium text-foreground">
                      {card.behaviorLabel}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {card.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="border-t border-border/80 px-5 py-4 md:px-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <AppButton
              type="button"
              size="lg"
              disabled={selectedCardAlreadyAdded}
              onClick={() => onAdd(selectedCard)}
            >
              <Plus className="size-4" />
              {selectedCardAlreadyAdded ? "Card already added" : "Add selected card"}
            </AppButton>
            <AppButton type="button" variant="outline" size="lg" onClick={onClose}>
              Cancel
            </AppButton>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function PaymentMethodsView({ initialCards }: PaymentMethodsViewProps) {
  const [cards, setCards] = useState<ClientSavedTestCard[]>(initialCards);
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const availableTestCard = useMemo(() => getAvailableTestCard(cards), [cards]);

  function setDefaultCard(cardId: string) {
    setCards((currentCards) =>
      currentCards.map((card) => ({
        ...card,
        isDefault: card.id === cardId,
        updatedAt: new Date().toISOString(),
      })),
    );
  }

  function removeCard(cardId: string) {
    setCards((currentCards) => {
      const removedCard = currentCards.find((card) => card.id === cardId);
      const remainingCards = currentCards.filter((card) => card.id !== cardId);

      if (!removedCard?.isDefault || remainingCards.length === 0) {
        return remainingCards;
      }

      return remainingCards.map((card, index) => ({
        ...card,
        isDefault: index === 0,
        updatedAt: index === 0 ? new Date().toISOString() : card.updatedAt,
      }));
    });
  }

  function addTestCard(testCard: StripeTestCard) {
    const now = new Date().toISOString();

    setCards((currentCards) => [
      ...currentCards,
      {
        id: `pm_card_${testCard.id}_${Date.now()}`,
        userProfileId: initialCards[0]?.userProfileId ?? "profile_client",
        label: testCard.label,
        brand: testCard.brand,
        last4: testCard.last4,
        expiryLabel: testCard.expiryLabel,
        isDefault: currentCards.length === 0,
        status: getTestCardStatus(testCard),
        providerReference: `pm_card_${testCard.last4}`,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    setAddPanelOpen(false);
  }

  return (
    <section className="app-container flex flex-col gap-6">
      <PageHeader
        eyebrow="Payment Methods"
        title="Manage saved payment methods."
        description="Keep billing simple while card details stay inside Stripe. SkySend stores only payment references needed for checkout."
        actions={[
          {
            label: "Billing history",
            href: "/client/billing-history",
            variant: "outline",
          },
          {
            label: "Add card",
            onClick: () => setAddPanelOpen(true),
            variant: "default",
            icon: <Plus className="size-4" />,
          },
        ]}
      />

      <Card className="rounded-[var(--ui-radius-panel)] shadow-[var(--elevation-panel)]">
        <CardContent className="grid gap-5 p-5 sm:p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-foreground">
                <ShieldCheck className="size-4" />
              </span>
              <div className="grid gap-1">
                <p className="font-medium text-foreground">Secure card storage</p>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Card numbers and CVC values are handled by Stripe. SkySend
                  keeps only the references needed to identify saved cards.
                </p>
              </div>
            </div>
            <StatusBadge label="Card references" tone="info" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <SectionCard
          eyebrow="Saved Cards"
          title="Cards available for checkout"
          description="Use saved cards for default payment selection, review handling and future setup flows."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {cards.map((card) => (
              <div
                key={card.id}
                className={cn(
                  "grid gap-5 rounded-[calc(var(--radius)+0.75rem)] border p-5 transition-colors",
                  card.isDefault
                    ? "border-border bg-card shadow-[var(--elevation-card)] ring-4 ring-ring"
                    : "border-border/80 bg-secondary/45",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-background text-foreground">
                      <CreditCard className="size-5" />
                    </span>
                    <div className="grid gap-1">
                      <p className="font-medium text-foreground">{card.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {card.brand} ending in {card.last4}
                      </p>
                    </div>
                  </div>
                  <StatusBadge
                    label={statusLabels[card.status]}
                    tone={statusTones[card.status]}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Brand</p>
                    <p className="mt-1 font-medium text-foreground">{card.brand}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last 4</p>
                    <p className="mt-1 font-medium text-foreground">{card.last4}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expiry</p>
                    <p className="mt-1 font-medium text-foreground">
                      {card.expiryLabel}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={card.isDefault ? "Default card" : "Backup card"}
                    tone={card.isDefault ? "success" : "neutral"}
                  />
                  <StatusBadge label="Stripe reference" tone="info" />
                </div>

                <div className="flex flex-wrap gap-2">
                  <AppButton
                    type="button"
                    size="sm"
                    variant={card.isDefault ? "secondary" : "outline"}
                    disabled={card.isDefault}
                    onClick={() => setDefaultCard(card.id)}
                  >
                    <Star className="size-4" />
                    Set as default
                  </AppButton>
                  <AppButton
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removeCard(card.id)}
                  >
                    <Trash2 className="size-4" />
                    Remove
                  </AppButton>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <aside className="grid gap-5 xl:sticky xl:top-8">
          <Card className="rounded-[calc(var(--radius)+0.75rem)]">
            <CardContent className="grid gap-5 p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-foreground">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <p className="font-medium text-foreground">Stripe-ready</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The UI is prepared for secure card setup.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
                <p>
                  Add card keeps a saved payment reference that can be used
                  during checkout.
                </p>
                <p>
                  Set as default and Remove keep the billing surface aligned
                  with the client preferred payment method.
                </p>
              </div>
              <AppButton
                type="button"
                size="lg"
                disabled={!availableTestCard}
                onClick={() => setAddPanelOpen(true)}
              >
                <Plus className="size-4" />
                {availableTestCard ? "Add card" : "All cards added"}
              </AppButton>
            </CardContent>
          </Card>
        </aside>
      </div>

      <AddTestCardPanel
        cards={cards}
        open={addPanelOpen}
        onClose={() => setAddPanelOpen(false)}
        onAdd={addTestCard}
      />
    </section>
  );
}
