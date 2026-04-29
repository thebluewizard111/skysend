export const clerkAppearance = {
  variables: {
    colorPrimary: "#20E7D5",
    colorText: "#F4F8FB",
    colorTextSecondary: "#8EA3B3",
    colorBackground: "transparent",
    colorInputBackground: "#0E151D",
    colorInputText: "#F4F8FB",
    colorDanger: "#FF7D7D",
    borderRadius: "1rem",
    fontFamily: "var(--font-sans)",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "w-full rounded-[var(--ui-radius-panel)] border border-border/80 bg-card p-2 shadow-none sm:p-3",
    headerTitle: "font-heading text-[1.7rem] tracking-tight text-foreground",
    headerSubtitle: "mt-2 text-sm leading-7 text-muted-foreground",
    socialButtonsBlockButton:
      "h-12 rounded-2xl border border-border bg-card shadow-none transition-colors hover:bg-secondary/55",
    socialButtonsBlockButtonText: "text-sm font-medium text-foreground",
    dividerLine: "bg-border",
    dividerText:
      "text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
    formFieldLabel:
      "text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
    formFieldInput:
      "h-12 rounded-2xl border border-input bg-muted px-4 text-sm text-foreground shadow-none transition-[border-color,box-shadow] focus:border-primary/55 focus:ring-4 focus:ring-ring",
    formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
    formFieldAction: "text-sm font-medium text-muted-foreground hover:text-foreground",
    formButtonPrimary:
      "h-11 rounded-full bg-primary text-primary-foreground shadow-none transition-colors hover:bg-primary/95",
    footerActionText: "text-sm text-muted-foreground",
    footerActionLink: "font-medium text-foreground hover:text-primary",
    formResendCodeLink: "font-medium text-foreground hover:text-primary",
    identityPreviewText: "text-sm text-foreground",
    identityPreviewEditButton: "font-medium text-foreground hover:text-primary",
    alert:
      "rounded-2xl border border-border/80 bg-secondary/55 text-sm text-foreground shadow-none",
    alertText: "text-sm leading-6 text-foreground",
    otpCodeFieldInput:
      "h-12 rounded-2xl border border-input bg-card text-sm text-foreground shadow-none",
  },
} as const;
