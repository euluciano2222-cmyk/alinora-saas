import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ClientForm from "./ClientForm";
import ClientManagement from "./ClientManagement";
import { updateClientStatusAction } from "./actions";

type ClientStatus = "active" | "inactive" | "archived";

type ClientesPageProps = {
  searchParams: Promise<{ status?: string }>;
};

const statusLabels: Record<ClientStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  archived: "Arquivado",
};

const statusStyles: Record<ClientStatus, string> = {
  active: "border-primary/30 bg-primary/10 text-primary",
  inactive: "border-[#9a704a]/30 bg-[#d9ad82]/20 text-[#744b28]",
  archived: "border-ink/20 bg-ink/5 text-muted",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const supabase = await createClient();
  const params = await searchParams;
  const { data, error: authError } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (authError || !claims?.sub) redirect("/login");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", claims.sub)
    .limit(1)
    .maybeSingle();

  if (!membership?.organization_id) redirect("/dashboard/configuracoes");

  const organizationId = membership.organization_id;
  const requestedStatus = params.status;
  const selectedStatus: ClientStatus | "all" =
    requestedStatus === "active" || requestedStatus === "inactive" || requestedStatus === "archived"
      ? requestedStatus
      : "all";

  let clientsQuery = supabase
    .from("clients")
    .select("id, name, company_name, email, phone, notes, status, created_at, updated_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (selectedStatus !== "all") clientsQuery = clientsQuery.eq("status", selectedStatus);

  const { data: clients, error: clientsError } = await clientsQuery;
  const { data: allClientStatuses } = await supabase
    .from("clients")
    .select("status")
    .eq("organization_id", organizationId);

  const activeClients = allClientStatuses?.filter((client) => client.status === "active").length ?? 0;
  const inactiveClients = allClientStatuses?.filter((client) => client.status === "inactive").length ?? 0;
  const archivedClients = allClientStatuses?.filter((client) => client.status === "archived").length ?? 0;
  const totalClients = allClientStatuses?.length ?? 0;

  const filters = [
    { label: "Todos", value: "all", count: totalClients, href: "/dashboard/clientes" },
    { label: "Ativos", value: "active", count: activeClients, href: "/dashboard/clientes?status=active" },
    { label: "Inativos", value: "inactive", count: inactiveClients, href: "/dashboard/clientes?status=inactive" },
    { label: "Arquivados", value: "archived", count: archivedClients, href: "/dashboard/clientes?status=archived" },
  ];

  return (
    <div className="px-5 py-10 md:px-10 md:py-14">
      <header className="grid gap-8 border-b border-ink/20 pb-12 xl:grid-cols-[1fr_0.65fr] xl:items-end">
        <div>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">RELAÇÕES CENTRALIZADAS</span>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.065em] md:text-7xl">Conheça seus clientes.<span className="block text-primary">Preserve o contexto.</span></h1>
        </div>
        <p className="max-w-md text-sm leading-7 text-muted">Reúna contatos, empresas e informações importantes antes de transformar cada relação em projetos, conversas e entregas.</p>
      </header>

      <section className="grid border-b border-ink/20 sm:grid-cols-4">
        {[["TOTAL", totalClients], ["ATIVOS", activeClients], ["INATIVOS", inactiveClients], ["ARQUIVADOS", archivedClients]].map(([label, value], index) => (
          <div key={label} className={["py-7 sm:px-5", index < 3 ? "border-b border-ink/20 sm:border-r sm:border-b-0" : "", index === 0 ? "sm:pl-0" : ""].join(" ")}>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">{label}</span>
            <strong className="mt-3 block text-3xl font-semibold tracking-[-0.06em] text-primary">{String(value).padStart(2, "0")}</strong>
          </div>
        ))}
      </section>

      <div className="grid gap-8 py-10 xl:grid-cols-[0.72fr_1.28fr] xl:items-start">
        <ClientForm />
        <section className="min-w-0">
          <header className="flex flex-col gap-5 border-b border-ink/20 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-primary">CARTEIRA DE CLIENTES</span>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Relações cadastradas</h2>
            </div>
            <span className="font-mono text-[10px] text-muted">{String(clients?.length ?? 0).padStart(2, "0")} RESULTADOS</span>
          </header>

          <nav className="flex overflow-x-auto border-b border-ink/20" aria-label="Filtrar clientes">
            {filters.map((filter) => {
              const active = selectedStatus === filter.value;
              return <Link key={filter.value} href={filter.href} aria-current={active ? "page" : undefined} className={["flex min-h-12 shrink-0 items-center gap-3 border-r border-ink/15 px-4 text-xs", active ? "bg-primary text-white" : "text-muted hover:bg-ink/5 hover:text-ink"].join(" ")}>{filter.label}<span className="font-mono text-[9px]">{String(filter.count).padStart(2, "0")}</span></Link>;
            })}
          </nav>

          {clientsError ? (
            <div className="mt-6 border border-red-800/30 bg-red-900/5 p-5"><p role="alert" className="text-sm text-red-800">Não foi possível carregar os clientes. Atualize a página e tente novamente.</p></div>
          ) : clients && clients.length > 0 ? (
            <div className="divide-y divide-ink/15 border-b border-ink/20">
              {clients.map((client) => {
                const clientStatus = client.status as ClientStatus;
                return (
                  <article key={client.id} className="grid gap-5 py-6 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold tracking-[-0.04em]">{client.name}</h3>
                        <span className={["border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em]", statusStyles[clientStatus]].join(" ")}>{statusLabels[clientStatus]}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted">{client.company_name ?? "Cliente independente"}</p>
                      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
                        {client.email ? <a href={`mailto:${client.email}`} className="text-muted hover:text-primary">{client.email}</a> : <span className="text-muted">E-mail não informado</span>}
                        {client.phone ? <a href={`tel:${client.phone}`} className="text-muted hover:text-primary">{client.phone}</a> : null}
                      </div>
                      {client.notes ? <p className="mt-4 max-w-2xl text-xs leading-6 text-muted">{client.notes}</p> : null}
                      <span className="mt-4 block font-mono text-[9px] uppercase tracking-[0.12em] text-muted">CADASTRADO EM {formatDate(client.created_at)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {clientStatus !== "active" ? (
                        <form action={updateClientStatusAction}><input type="hidden" name="clientId" value={client.id} /><input type="hidden" name="status" value="active" /><button type="submit" className="min-h-10 border border-primary px-4 text-xs text-primary hover:bg-primary hover:text-white">Ativar</button></form>
                      ) : (
                        <form action={updateClientStatusAction}><input type="hidden" name="clientId" value={client.id} /><input type="hidden" name="status" value="inactive" /><button type="submit" className="min-h-10 border border-ink/25 px-4 text-xs hover:bg-ink hover:text-white">Inativar</button></form>
                      )}
                      {clientStatus !== "archived" ? <form action={updateClientStatusAction}><input type="hidden" name="clientId" value={client.id} /><input type="hidden" name="status" value="archived" /><button type="submit" className="min-h-10 border border-ink/15 px-4 text-xs text-muted hover:border-ink hover:text-ink">Arquivar</button></form> : null}
                      <ClientManagement client={{ id: client.id, name: client.name, companyName: client.company_name, email: client.email, phone: client.phone, notes: client.notes }} />
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 border border-dashed border-ink/25 bg-[#f7f6f0] px-6 py-14 text-center">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-primary">NENHUM CLIENTE NESTA VISÃO</span>
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">A primeira relação começa ao lado.</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted">Preencha o formulário para cadastrar um cliente com acesso isolado à sua organização.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}