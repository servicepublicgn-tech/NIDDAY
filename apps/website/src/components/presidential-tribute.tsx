import Image from "next/image";

export function PresidentialTribute() {
  return (
    <section
      aria-labelledby="presidential-tribute-title"
      className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(360px,0.75fr)] lg:gap-20">
        <div className="max-w-xl">
          <p className="mb-4 font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground">
            République de Guinée
          </p>
          <h2
            id="presidential-tribute-title"
            className="font-serif text-3xl leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            Une vision nationale au service de la transparence
          </h2>
          <p className="mt-6 font-sans text-base leading-relaxed text-muted-foreground lg:text-lg">
            Son Excellence le président Mamadi Doumbouya, président de la
            République de Guinée. NIDDAY s’inscrit dans une ambition de
            responsabilité publique, de traçabilité et de confiance dans la
            gestion des ressources.
          </p>
        </div>

        <figure className="mx-auto w-full max-w-[420px]">
          <div className="overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
            <Image
              src="/images/institutional/mamadi-doumbouya.png"
              alt="Son Excellence le président Mamadi Doumbouya, président de la République de Guinée"
              width={538}
              height={832}
              sizes="(min-width: 1024px) 420px, 90vw"
              className="h-auto w-full object-cover"
            />
          </div>
          <figcaption className="mt-3 text-center font-sans text-xs text-muted-foreground">
            Son Excellence Monsieur Mamadi Doumbouya — Président de la
            République de Guinée
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
