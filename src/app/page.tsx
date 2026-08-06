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

const capabilities = [
  {
    number: "01",
    title: "Gestão de clientes",
    description:
      "Informações, contatos e histórico de trabalho reunidos em um cadastro objetivo.",
  },
  {
    number: "02",
    title: "Controle de projetos",
    description:
      "Etapas, prazos e prioridades visíveis para você saber exatamente o que fazer.",
  },
  {
    number: "03",
    title: "Entrega de arquivos",
    description:
      "Um ambiente protegido para organizar materiais e compartilhar cada entrega.",
  },
  {
    number: "04",
    title: "Acesso do cliente",
    description:
      "Cada cliente visualiza apenas os projetos e arquivos autorizados para ele.",
  },
];

const statistics = [
  {
    value: "14",
    label: "Clientes ativos",
  },
  {
    value: "32",
    label: "Projetos concluídos",
  },
  {
    value: "126",
    label: "Arquivos entregues",
  },
  {
    value: "4,9",
    label: "Avaliação média",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Configure seu espaço",
    description:
      "Crie sua conta e informe os dados essenciais do seu negócio.",
  },
  {
    number: "02",
    title: "Cadastre o trabalho",
    description:
      "Adicione clientes, projetos, prazos e responsáveis por cada etapa.",
  },
  {
    number: "03",
    title: "Acompanhe e entregue",
    description:
      "Monitore o andamento e compartilhe os arquivos com segurança.",
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
              Recursos
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
              Criar conta
            </a>
          </div>
        </nav>
      </header>

      <HumanHero />

      <section className="border-b border-white/25 bg-primary text-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 md:grid-cols-4">
          {statistics.map((statistic, index) => (
            <div
              key={statistic.label}
              className={`px-5 py-8 md:px-10 md:py-10 ${
                index !== statistics.length - 1
                  ? "border-r border-white/25"
                  : ""
              } ${index === 1 ? "max-md:border-r-0" : ""} ${
                index < 2 ? "max-md:border-b max-md:border-white/25" : ""
              }`}
            >
              <p className="text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">
                {statistic.value}
              </p>

              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-white/75">
                {statistic.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="recursos" className="border-b border-ink/20">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid border-b border-ink/20 lg:grid-cols-[0.4fr_0.6fr]">
            <div className="px-5 py-16 md:px-10 md:py-24 lg:border-r lg:border-ink/20">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                01 / Estrutura
              </p>
            </div>

            <div className="px-5 pb-16 md:px-10 md:pb-24 lg:py-24">
              <h2 className="max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.055em] md:text-6xl">
                A estrutura do seu negócio em uma única plataforma.
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-2">
            {capabilities.map((capability, index) => (
              <article
                key={capability.number}
                className={`min-h-72 border-ink/20 p-5 transition-colors duration-300 hover:bg-primary hover:text-white md:p-10 ${
                  index % 2 === 0 ? "md:border-r" : ""
                } ${index < 2 ? "border-b" : ""}`}
              >
                <span className="font-mono text-xs text-primary transition-colors group-hover:text-white">
                  {capability.number}
                </span>

                <div className="mt-20 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
                  <h3 className="text-2xl font-semibold tracking-[-0.035em]">
                    {capability.title}
                  </h3>

                  <p className="max-w-md leading-7 text-muted transition-colors hover:text-white/75">
                    {capability.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/25 bg-primary text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
          <div className="flex flex-col gap-8 border-b border-white/25 pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                Visão geral
              </p>

              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                Projetos recentes
              </h2>
            </div>

            <p className="max-w-sm leading-7 text-white/75">
              Informações importantes visíveis sem excesso de telas ou
              distrações.
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
              02 / Processo
            </p>

            <h2 className="mt-6 max-w-sm text-4xl font-semibold leading-tight tracking-[-0.05em]">
              Comece sem complicação.
            </h2>
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
              Organize o próximo projeto
            </p>

            <h2 className="mt-7 max-w-4xl text-4xl font-semibold leading-[0.98] tracking-[-0.06em] md:text-7xl">
              Uma operação profissional começa com clareza.
            </h2>
          </div>

          <div className="flex min-w-80 flex-col justify-between border-t border-white/25 p-6 lg:border-t-0 lg:p-10">
            <p className="max-w-xs leading-7 text-white/70">
              Crie sua conta e transforme a maneira como você administra
              clientes e projetos.
            </p>

            <a
              href="/login"
              className="mt-14 flex min-h-14 items-center justify-between border border-ink bg-ink px-6 font-medium text-white transition-colors duration-200 hover:border-white hover:bg-white hover:text-primary"
            >
              Criar conta gratuita
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