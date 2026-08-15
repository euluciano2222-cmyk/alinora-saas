import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ProjectForm from "./ProjectForm";
import { updateProjectStatusAction } from "./actions";
import styles from "./projetos.module.css";

type ProjectStatus = "active" | "on_hold" | "completed" | "archived";

type ProjectFilter = "all" | ProjectStatus;

type ClientRecord = {
  id: string;
  name: string;
  company: string | null;
  status: string;
};

type ProjectRecord = {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
};

type ProjectsPageProps = {
  searchParams: Promise<{
    status?: string | string[];
  }>;
};

const allowedFilters: ProjectFilter[] = [
  "all",
  "active",
  "on_hold",
  "completed",
  "archived",
];

const statusLabels: Record<ProjectStatus, string> = {
  active: "Ativo",
  on_hold: "Em espera",
  completed: "Concluído",
  archived: "Arquivado",
};

const statusClassNames: Record<ProjectStatus, string> = {
  active: "statusActive",
  on_hold: "statusOnHold",
  completed: "statusCompleted",
  archived: "statusArchived",
};

const filterOptions: Array<{
  value: ProjectFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "Todos",
  },
  {
    value: "active",
    label: "Ativos",
  },
  {
    value: "on_hold",
    label: "Em espera",
  },
  {
    value: "completed",
    label: "Concluídos",
  },
  {
    value: "archived",
    label: "Arquivados",
  },
];

function formatDate(date: string | null) {
  if (!date) {
    return "Não definida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function formatCreatedAt(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatNumber(value: number) {
  return String(value).padStart(2, "0");
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    redirect("/dashboard/configuracoes");
  }

  const [clientsResult, projectsResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, company:company_name, status")
      .eq("organization_id", membership.organization_id)
      .order("name", {
        ascending: true,
      }),

    supabase
      .from("projects")
      .select(
        `
          id,
          client_id,
          name,
          description,
          status,
          start_date,
          due_date,
          created_at
        `,
      )
      .eq("organization_id", membership.organization_id)
      .order("created_at", {
        ascending: false,
      }),
  ]);

  const clients = (clientsResult.data ?? []) as ClientRecord[];
  const projects = (projectsResult.data ?? []) as ProjectRecord[];

  const loadError = Boolean(clientsResult.error || projectsResult.error);

  const activeClients = clients
    .filter((client) => client.status === "active")
    .map((client) => ({
      id: client.id,
      name: client.name,
      company: client.company,
    }));

  const clientsById = new Map(
    clients.map((client) => [client.id, client]),
  );

  const requestedStatus = Array.isArray(params.status)
    ? params.status[0]
    : params.status;

  const currentFilter = allowedFilters.includes(
    requestedStatus as ProjectFilter,
  )
    ? (requestedStatus as ProjectFilter)
    : "all";

  const filteredProjects =
    currentFilter === "all"
      ? projects
      : projects.filter((project) => project.status === currentFilter);

  const activeProjects = projects.filter(
    (project) => project.status === "active",
  ).length;

  const onHoldProjects = projects.filter(
    (project) => project.status === "on_hold",
  ).length;

  const completedProjects = projects.filter(
    (project) => project.status === "completed",
  ).length;

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <span className={styles.eyebrow}>
            Projetos / Estrutura em movimento
          </span>

          <h1>
            Projetos claros.
            <br />
            <span>Decisões mais rápidas.</span>
          </h1>
        </div>

        <p className={styles.headerDescription}>
          Conecte cada projeto ao cliente certo, organize prazos e mantenha
          uma visão precisa de tudo o que está em andamento.
        </p>
      </header>

      <section className={styles.statsGrid} aria-label="Resumo dos projetos">
        <article className={styles.statCard}>
          <span>Total de projetos</span>
          <strong>{formatNumber(projects.length)}</strong>
        </article>

        <article className={styles.statCard}>
          <span>Projetos ativos</span>
          <strong>{formatNumber(activeProjects)}</strong>
        </article>

        <article className={styles.statCard}>
          <span>Em espera</span>
          <strong>{formatNumber(onHoldProjects)}</strong>
        </article>

        <article className={styles.statCard}>
          <span>Concluídos</span>
          <strong>{formatNumber(completedProjects)}</strong>
        </article>
      </section>

      {loadError ? (
        <p className={styles.errorMessage} role="alert">
          Não foi possível carregar todos os dados dos projetos. Atualize a
          página e tente novamente.
        </p>
      ) : null}

      <ProjectForm clients={activeClients} />

      <section className={styles.projectsSection}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Portfólio operacional</span>
            <h2>Projetos da organização</h2>
          </div>

          <nav className={styles.filters} aria-label="Filtrar projetos">
            {filterOptions.map((filter) => {
              const isActive = currentFilter === filter.value;

              return (
                <Link
                  key={filter.value}
                  href={
                    filter.value === "all"
                      ? "/dashboard/projetos"
                      : `/dashboard/projetos?status=${filter.value}`
                  }
                  className={`${styles.filterLink} ${
                    isActive ? styles.activeFilter : ""
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {filter.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {filteredProjects.length > 0 ? (
          <div className={styles.projectGrid}>
            {filteredProjects.map((project) => {
              const projectClient = clientsById.get(project.client_id);

              return (
                <article key={project.id} className={styles.projectCard}>
                  <div className={styles.projectTop}>
                    <div>
                      <span className={styles.projectClient}>
                        {projectClient?.company ||
                          projectClient?.name ||
                          "Cliente não encontrado"}
                      </span>

                      <h3>{project.name}</h3>
                    </div>

                    <span
                      className={`${styles.statusBadge} ${
                        styles[statusClassNames[project.status]]
                      }`}
                    >
                      {statusLabels[project.status]}
                    </span>
                  </div>

                  <p className={styles.description}>
                    {project.description ||
                      "Este projeto ainda não possui uma descrição."}
                  </p>

                  <div className={styles.projectDates}>
                    <div className={styles.dateItem}>
                      <span>Início</span>
                      <strong>{formatDate(project.start_date)}</strong>
                    </div>

                    <div className={styles.dateItem}>
                      <span>Entrega prevista</span>
                      <strong>{formatDate(project.due_date)}</strong>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <span>
                      Criado em {formatCreatedAt(project.created_at)}
                    </span>

                    <form
                      action={updateProjectStatusAction}
                      className={styles.statusForm}
                    >
                      <input
                        type="hidden"
                        name="projectId"
                        value={project.id}
                      />

                      <label>
                        <span className="sr-only">
                          Alterar estado de {project.name}
                        </span>

                        <select
                          name="status"
                          defaultValue={project.status}
                          className={styles.statusSelect}
                          aria-label={`Estado do projeto ${project.name}`}
                        >
                          <option value="active">Ativo</option>
                          <option value="on_hold">Em espera</option>
                          <option value="completed">Concluído</option>
                          <option value="archived">Arquivado</option>
                        </select>
                      </label>

                      <button type="submit">Atualizar</button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div>
              <span>00 / Projetos</span>

              <h3>
                {currentFilter === "all"
                  ? "Seu próximo projeto começa aqui."
                  : "Nenhum projeto neste estado."}
              </h3>

              <p>
                {currentFilter === "all"
                  ? "Use o formulário acima para conectar um cliente, definir os prazos e criar o primeiro projeto."
                  : "Escolha outro filtro ou atualize o estado de um projeto existente."}
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}