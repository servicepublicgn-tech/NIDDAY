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
            NIDDAY est une initiative indépendante créée par Abdoulaye
            Coumbassa, visant à renforcer la traçabilité, la responsabilité et
            la confiance dans la gestion des ressources. La plateforme
            ambitionne de pouvoir servir, à terme, les organisations publiques,
            privées et citoyennes.
          </p>
        </div>

        <div className="mx-auto grid w-full max-w-[520px] grid-cols-2 items-end gap-3 sm:gap-5">
          <figure>
            <div className="overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
              <Image
                src="/images/institutional/mamadi-doumbouya.png"
                alt="Son Excellence le président Mamadi Doumbouya, président de la République de Guinée"
                width={538}
                height={832}
                sizes="(min-width: 1024px) 250px, 45vw"
                className="h-auto w-full object-cover"
              />
            </div>
            <figcaption className="mt-3 text-center font-sans text-xs text-muted-foreground">
              Son Excellence Monsieur Mamadi Doumbouya
              <span className="block">
                Président de la République de Guinée
              </span>
            </figcaption>
          </figure>

          <figure>
            <div className="overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
              <Image
                src="/images/institutional/abdoulaye-coumbassa.jpg"
                alt="Abdoulaye Coumbassa, créateur du site NIDDAY"
                width={460}
                height={460}
                sizes="(min-width: 1024px) 250px, 45vw"
                className="aspect-square h-auto w-full object-cover"
              />
            </div>
            <figcaption className="mt-3 text-center font-sans text-xs text-muted-foreground">
              Abdoulaye Coumbassa
              <span className="block">Créateur du site NIDDAY</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
