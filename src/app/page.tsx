import { CapabilitiesShowcase } from "@/components/CapabilitiesShowcase/CapabilitiesShowcase";
import { HumanHero } from "@/components/HumanHero/HumanHero";

const projects = [
  {
    code: "PRJ-024",
    name: "Website institucional",
    client: "Estúdio Norte",
    deadline: "12 AGO",
    status: "EM CURSO",
  },
  {
    code: "PRJ-023",
    name: "Identidade de marca",
    client: "Casa Flora",
    deadline: "09 AGO",
    status: "REVISÃO",
  },
  {
    code: "PRJ-021",
    name: "Landing page",
    client: "Lumina Tech",
    deadline: "CONCLUÍDO",
    status: "ENTREGUE",
  },
];

const statistics = [
  {
    value: "VISÃO",
    label: "Decisões com contexto",
  },
  {
    value: "RITMO",
    label: "Projetos em movimento",
  },
  {
    value: "VALOR",
    label: "Clientes mais seguros",
  },
  {
    value: "ESCALA",
    label: "Estrutura para crescer",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Reúna o contexto",
    description:
      "Centralize clientes, conversas, projetos e decisões antes que informações importantes se percam.",
  },
  {
    number: "02",
    title: "Conduza com clareza",
    description:
      "Transforme prioridades, responsáveis e próximos passos em um caminho que todos conseguem acompanhar.",
  },
  {
    number: "03",
    title: "Entregue com confiança",
    description:
      "Apresente arquivos, versões e aprovações em uma experiência que aumenta o valor percebido do seu trabalho.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="border-b border-ink/20">
        <nav className="mx-auto grid min-h-20 max-w-[1440px] grid-cols-[1fr_auto] items-center px-5 md:grid-cols-[240px_1fr_auto] md:px-10">
          <a
            href="#"
            aria-label="Página inicial da Alinora"
            className="flex items-center gap-3"
          >
            <span
              aria-hidden="true"
              className="grid size-8 grid-cols-2 gap-[3px]"
            >
              <span className="bg-primary" />
              <span className="border border-primary" />
              <span className="border border-primary" />
              <span className="bg-primary" />
            </span>

            <span className="text-xl font-semibold tracking-[-0.05em]">
              alinora
            </span>
          </a>

          <div className="hidden items-center gap-8 border-l border-ink/20 pl-10 text-sm md:flex">
            <a
              href="#produto"
              className="transition-colors hover:text-primary"
            >
              Produto
            </a>

            <a
              href="#recursos"
              className="transition-colors hover:text-primary"
            >
              Experiência
            </a>

            <a
              href="#processo"
              className="transition-colors hover:text-primary"
            >
              Como funciona
            </a>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/login"
              className="hidden border border-primary bg-primary px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-dark sm:block"
            >
              Entrar
            </a>

            <a
              href="/login"
              className="border border-primary bg-primary px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              Começar agora
            </a>
          </div>
        </nav>
      </header>

      <HumanHero />

      <section className="border-b border-white/25 bg-primary text-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 md:grid-cols-4">
          {statistics.map((statistic, index) => (
            <div
              key={statistic.value}
              className={`px-5 py-8 md:px-10 md:py-10 ${
                index !== statistics.length - 1
                  ? "border-r border-white/25"
                  : ""
              } ${index === 1 ? "max-md:border-r-0" : ""} ${
                index < 2 ? "max-md:border-b max-md:border-white/25" : ""
              }`}
            >
              <p className="text-2xl font-semibold tracking-[-0.05em] text-white md:text-3xl lg:text-4xl">
                {statistic.value}
              </p>

              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-white/75">
                {statistic.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <CapabilitiesShowcase />

      <section className="border-b border-white/25 bg-primary text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
          <div className="flex flex-col gap-8 border-b border-white/25 pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                Movimento real
              </p>

              <h2 className="mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                Crescimento que você consegue enxergar.
              </h2>
            </div>

            <p className="max-w-md leading-7 text-white/75">
              Cada projeto deixa de ser apenas uma demanda e passa a fazer
              parte de uma operação preparada para ir mais longe.
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[0.7fr_1.7fr_1.2fr_0.8fr_0.8fr] border-b border-white/25 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-white/75">
                <span>Código</span>
                <span>Projeto</span>
                <span>Cliente</span>
                <span>Prazo</span>
                <span>Status</span>
              </div>

              {projects.map((project) => (
                <div
                  key={project.code}
                  className="grid grid-cols-[0.7fr_1.7fr_1.2fr_0.8fr_0.8fr] items-center border-b border-white/20 py-6 text-sm transition-all duration-300 hover:bg-white/10 hover:px-4"
                >
                  <span className="font-mono text-xs text-white/75">
                    {project.code}
                  </span>

                  <span className="font-medium text-white">
                    {project.name}
                  </span>

                  <span className="text-white/75">{project.client}</span>

                  <span className="text-xs text-white">
                    {project.deadline}
                  </span>

                  <span className="w-fit border border-white/60 px-2 py-1 text-[10px] font-semibold tracking-[0.1em] text-white">
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="processo" className="border-b border-ink/20">
        <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[0.4fr_0.6fr]">
          <div className="px-5 py-16 md:px-10 md:py-24 lg:border-r lg:border-ink/20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              02 / Caminho
            </p>

            <h2 className="mt-6 max-w-md text-4xl font-semibold leading-tight tracking-[-0.05em]">
              Do primeiro contato à próxima conquista.
            </h2>

            <p className="mt-7 max-w-sm leading-7 text-muted">
              Uma estrutura simples para transformar intenção em progresso e
              progresso em confiança.
            </p>
          </div>

          <div>
            {processSteps.map((step) => (
              <article
                key={step.number}
                className="grid gap-6 border-b border-ink/20 px-5 py-9 transition-colors duration-300 last:border-b-0 hover:bg-primary hover:text-white md:grid-cols-[80px_0.8fr_1.2fr] md:px-10"
              >
                <span className="font-mono text-xs text-primary">
                  {step.number}
                </span>

                <h3 className="text-xl font-semibold tracking-[-0.03em]">
                  {step.title}
                </h3>

                <p className="max-w-md leading-7 text-muted">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary text-white">
        <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[1fr_auto]">
          <div className="px-5 py-20 md:px-10 md:py-28 lg:border-r lg:border-white/25">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
              O próximo nível começa agora
            </p>

            <h2 className="mt-7 max-w-4xl text-4xl font-semibold leading-[0.98] tracking-[-0.06em] md:text-7xl">
              Sua empresa já tem potencial. Dê a ela uma operação à altura.
            </h2>
          </div>

          <div className="flex min-w-80 flex-col justify-between border-t border-white/25 p-6 lg:border-t-0 lg:p-10">
            <p className="max-w-xs leading-7 text-white/70">
              Crie uma experiência que seus clientes reconhecem, sua equipe
              entende e seu crescimento consegue sustentar.
            </p>

            <a
              href="/login"
              className="mt-14 flex min-h-14 items-center justify-between border border-ink bg-ink px-6 font-medium text-white transition-colors duration-200 hover:border-white hover:bg-white hover:text-primary"
            >
              Começar a transformar
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-ink text-white">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-10 md:grid-cols-[1fr_auto] md:px-10">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-7 grid-cols-2 gap-[3px]"
            >
              <span className="bg-primary-light" />
              <span className="border border-primary-light" />
              <span className="border border-primary-light" />
              <span className="bg-primary-light" />
            </span>

            <span className="text-lg font-semibold tracking-[-0.05em]">
              alinora
            </span>
          </div>

          <div className="text-sm text-white/50">
            © 2026 Alinora · Luciano Oliveira
          </div>
        </div>
      </footer>
    </main>
  );
}