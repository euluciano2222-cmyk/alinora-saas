import Link from "next/link";

import { LoginForm } from "./LoginForm";
import styles from "./login.module.css";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

function getSafeNextPath(value?: string | string[]) {
  const nextPath = Array.isArray(value) ? value[0] : value;

  if (
    !nextPath ||
    !nextPath.startsWith("/") ||
    nextPath.startsWith("//")
  ) {
    return "/dashboard";
  }

  return nextPath;
}

function BrandMark() {
  return (
    <span className={styles.brandMark} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const parameters = await searchParams;
  const nextPath = getSafeNextPath(parameters.next);

  return (
    <main className={styles.page}>
      <section className={styles.storyPanel}>
        <div className={styles.storyGrid} aria-hidden="true" />
        <div className={styles.storyLight} aria-hidden="true" />

        <header className={styles.storyHeader}>
          <Link
            href="/"
            className={styles.brand}
            aria-label="Voltar para a página inicial da Alinora"
          >
            <BrandMark />
            <span>alinora</span>
          </Link>

          <span className={styles.chapter}>
            PORTAL DA OPERAÇÃO · 01
          </span>
        </header>

        <div className={styles.storyContent}>
          <p className={styles.storyEyebrow}>
            CONTROLE QUE ACOMPANHA O CRESCIMENTO
          </p>

          <h2>
            Sua empresa evolui.
            <span>Sua clareza evolui junto.</span>
          </h2>

          <p className={styles.storyDescription}>
            Entre em um espaço onde cada conversa encontra contexto,
            cada projeto revela seu progresso e cada entrega fortalece
            a confiança do cliente.
          </p>

          <div className={styles.storyBenefits}>
            <div>
              <span>01</span>
              <p>Contexto reunido</p>
            </div>

            <div>
              <span>02</span>
              <p>Progresso visível</p>
            </div>

            <div>
              <span>03</span>
              <p>Entregas valorizadas</p>
            </div>
          </div>
        </div>

        <div className={styles.operationPreview} aria-hidden="true">
          <div className={styles.previewShadow} />

          <div className={styles.previewWindow}>
            <div className={styles.previewTopbar}>
              <div>
                <BrandMark />
                <strong>alinora</strong>
              </div>

              <span>OPERAÇÃO ATIVA</span>
            </div>

            <div className={styles.previewBody}>
              <aside>
                <span className={styles.activeNavigation}>
                  Visão geral
                </span>
                <span>Projetos</span>
                <span>Clientes</span>
                <span>Entregas</span>
              </aside>

              <div className={styles.previewMain}>
                <div className={styles.previewHeading}>
                  <div>
                    <span>VISÃO GERAL</span>
                    <strong>Bom dia, Luciano.</strong>
                  </div>

                  <i>+</i>
                </div>

                <div className={styles.previewMetrics}>
                  <div>
                    <span>PROJETOS</span>
                    <strong>08</strong>
                  </div>

                  <div>
                    <span>NO PRAZO</span>
                    <strong>92%</strong>
                  </div>

                  <div>
                    <span>APROVAÇÕES</span>
                    <strong>05</strong>
                  </div>
                </div>

                <div className={styles.previewProject}>
                  <div>
                    <span>Website institucional</span>
                    <strong>Experiência principal</strong>
                  </div>

                  <small>72%</small>

                  <div className={styles.previewProgress}>
                    <span />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.approvalCard}>
            <span>✓</span>
            <div>
              <strong>Entrega aprovada</strong>
              <small>Agora mesmo</small>
            </div>
          </div>
        </div>

        <footer className={styles.storyFooter}>
          <span>ALINORA © 2026</span>
          <p>Clareza para conduzir. Estrutura para crescer.</p>
        </footer>
      </section>

      <section className={styles.authPanel}>
        <div className={styles.mobileHeader}>
          <Link
            href="/"
            className={styles.brand}
            aria-label="Voltar para a página inicial da Alinora"
          >
            <BrandMark />
            <span>alinora</span>
          </Link>

          <Link href="/" className={styles.backLink}>
            Voltar
          </Link>
        </div>

        <div className={styles.authInner}>
          <LoginForm nextPath={nextPath} />
        </div>

        <footer className={styles.authFooter}>
          <span>ACESSO PROTEGIDO</span>

          <Link href="/">
            Voltar para o início
            <span aria-hidden="true">↗</span>
          </Link>
        </footer>
      </section>
    </main>
  );
}