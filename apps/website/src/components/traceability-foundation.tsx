import { Icons } from "@midday/ui/icons";

const foundations = [
  {
    title: "Financial intelligence",
    description:
      "Bring transactions, invoices, expenses, and financial reporting into a clear operational picture.",
    icon: Icons.ReceiptLong,
  },
  {
    title: "Evidence-ready records",
    description:
      "Connect documents and supporting information to the work they explain—without creating duplicate records.",
    icon: Icons.Files,
  },
  {
    title: "Project accountability",
    description:
      "Build on the existing project and time-tracking foundations to follow delivery, budget context, and outcomes.",
    icon: Icons.Monitoring,
  },
];

export function TraceabilityFoundation() {
  return (
    <section className="bg-background py-16 sm:py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
        <div className="space-y-6">
          <p className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-primary">
            NIDDAY foundation
          </p>
          <h2 className="font-serif text-3xl leading-tight text-foreground sm:text-4xl">
            Trace every important decision from financial activity to outcome.
          </h2>
          <p className="max-w-xl font-sans text-base leading-relaxed text-muted-foreground">
            NIDDAY preserves the proven finance, document, and project tools in
            this platform while preparing a careful path toward evidence,
            verification, and auditability. It is designed for accountable
            organizations across Guinea, Africa, and internationally.
          </p>
          <p className="max-w-xl border-l-2 border-primary pl-4 font-sans text-sm leading-relaxed text-muted-foreground">
            Future public-sector integrations require explicit authorization,
            deployment-specific governance, and verified permissions. This page
            does not represent endorsement by any institution.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
          {foundations.map(({ title, description, icon: Icon }) => (
            <article key={title} className="bg-background p-6 sm:p-7">
              <div className="mb-10 flex h-10 w-10 items-center justify-center bg-secondary text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-sans text-base font-medium text-foreground">
                {title}
              </h3>
              <p className="mt-3 font-sans text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
