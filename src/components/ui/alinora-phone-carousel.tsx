"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import styles from "./alinora-phone-carousel.module.css";

type PortalSlideId = "overview" | "project" | "delivery" | "approval";

type PortalSlide = {
  id: PortalSlideId;
  navigationLabel: string;
  screenTitle: string;
  description: string;
};

const slides: PortalSlide[] = [
  {
    id: "overview",
    navigationLabel: "Confiança",
    screenTitle: "Olá, Mariana",
    description:
      "Uma visão que transmite segurança antes mesmo de qualquer pergunta.",
  },
  {
    id: "project",
    navigationLabel: "Progresso",
    screenTitle: "Website institucional",
    description:
      "Cada avanço torna o valor por trás do trabalho claramente visível.",
  },
  {
    id: "delivery",
    navigationLabel: "Valor",
    screenTitle: "Nova entrega",
    description:
      "Entregas organizadas transformam trabalho em percepção de excelência.",
  },
  {
    id: "approval",
    navigationLabel: "Decisão",
    screenTitle: "Revisão final",
    description:
      "Decisões claras mantêm clientes e equipes avançando na mesma direção.",
  },
];

function OverviewScreen() {
  return (
    <div className={styles.screenContent}>
      <header className={styles.mobileHeader}>
        <div>
          <span>PORTAL DO CLIENTE</span>
          <strong>Olá, Mariana</strong>
        </div>

        <div className={styles.mobileAvatar}>MC</div>
      </header>

      <section className={styles.featuredProject}>
        <div className={styles.projectLabel}>
          <span>PROJETO EM EVOLUÇÃO</span>
          <i>ATIVO</i>
        </div>

        <h3>Website institucional</h3>

        <div className={styles.progressHeader}>
          <span>Progresso geral</span>
          <strong>72%</strong>
        </div>

        <div className={styles.progressTrack}>
          <span style={{ width: "72%" }} />
        </div>

        <div className={styles.projectMeta}>
          <div>
            <span>PRÓXIMA CONQUISTA</span>
            <strong>Revisão do layout</strong>
          </div>

          <div>
            <span>PREVISÃO</span>
            <strong>12 AGO</strong>
          </div>
        </div>
      </section>

      <section className={styles.mobileSection}>
        <div className={styles.mobileSectionHeading}>
          <strong>Evoluções recentes</strong>
          <span>Ver todas</span>
        </div>

        <article className={styles.updateItem}>
          <span className={styles.updateIcon}>✓</span>

          <div>
            <strong>Estratégia aprovada</strong>
            <p>Uma nova etapa está pronta para avançar.</p>
          </div>

          <time>09:42</time>
        </article>

        <article className={styles.updateItem}>
          <span className={styles.updateIcon}>↗</span>

          <div>
            <strong>Nova evolução disponível</strong>
            <p>Experiência principal · versão 02</p>
          </div>

          <time>Ontem</time>
        </article>
      </section>

      <nav className={styles.mobileNavigation} aria-label="Exemplo de navegação">
        <span className={styles.activeNavigation}>Visão</span>
        <span>Projetos</span>
        <span>Entregas</span>
      </nav>
    </div>
  );
}

function ProjectScreen() {
  const stages = [
    ["Visão e estratégia", "completed"],
    ["Estrutura da experiência", "completed"],
    ["Design das páginas", "active"],
    ["Lançamento", "pending"],
  ] as const;

  return (
    <div className={styles.screenContent}>
      <header className={styles.simpleMobileHeader}>
        <button type="button" tabIndex={-1} aria-hidden="true">
          ←
        </button>

        <div>
          <span>PROJETO</span>
          <strong>Website institucional</strong>
        </div>

        <button type="button" tabIndex={-1} aria-hidden="true">
          •••
        </button>
      </header>

      <section className={styles.projectSummary}>
        <div className={styles.summaryTop}>
          <span>GANHANDO FORMA</span>
          <strong>72%</strong>
        </div>

        <div className={styles.progressTrack}>
          <span style={{ width: "72%" }} />
        </div>

        <p>
          A experiência principal está ganhando forma e será apresentada na
          próxima revisão.
        </p>
      </section>

      <section className={styles.mobileSection}>
        <div className={styles.mobileSectionHeading}>
          <strong>Caminho do projeto</strong>
          <span>4 etapas</span>
        </div>

        <div className={styles.timeline}>
          {stages.map(([stage, status]) => (
            <article
              key={stage}
              className={`${styles.timelineItem} ${styles[status]}`}
            >
              <span className={styles.timelineMarker}>
                {status === "completed" ? "✓" : ""}
              </span>

              <div>
                <strong>{stage}</strong>
                <p>
                  {status === "completed"
                    ? "Conquista concluída"
                    : status === "active"
                      ? "Evoluindo agora"
                      : "Próximo passo"}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className={styles.nextMeeting}>
        <span>PRÓXIMO ENCONTRO</span>
        <strong>Quinta-feira, 14h30</strong>
        <small>Uma nova evolução será apresentada.</small>
      </aside>
    </div>
  );
}

function DeliveryScreen() {
  return (
    <div className={styles.screenContent}>
      <header className={styles.simpleMobileHeader}>
        <button type="button" tabIndex={-1} aria-hidden="true">
          ←
        </button>

        <div>
          <span>ENTREGA</span>
          <strong>Nova evolução</strong>
        </div>

        <span className={styles.notificationDot}>1</span>
      </header>

      <section className={styles.deliveryCard}>
        <div className={styles.filePreview}>
          <div className={styles.previewWindow}>
            <span />
            <span />
            <span />
          </div>

          <strong>ALINORA</strong>
          <small>Website institucional</small>
        </div>

        <div className={styles.fileInformation}>
          <span>VERSÃO 03 · AGORA</span>
          <h3>Experiência pronta para revisão</h3>
          <p>
            Conheça a nova proposta e compartilhe suas percepções diretamente
            pelo portal.
          </p>
        </div>
      </section>

      <section className={styles.fileDetails}>
        <article>
          <span aria-hidden="true">⌑</span>

          <div>
            <strong>experiencia_final_v03.pdf</strong>
            <small>PDF · 18,4 MB</small>
          </div>

          <i aria-hidden="true">↓</i>
        </article>

        <article>
          <span aria-hidden="true">▧</span>

          <div>
            <strong>visao_do_projeto.pdf</strong>
            <small>PDF · 6,8 MB</small>
          </div>

          <i aria-hidden="true">↓</i>
        </article>
      </section>

      <button className={styles.reviewAction} type="button" tabIndex={-1}>
        Conhecer a evolução
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

function ApprovalScreen() {
  return (
    <div className={styles.screenContent}>
      <header className={styles.simpleMobileHeader}>
        <button type="button" tabIndex={-1} aria-hidden="true">
          ←
        </button>

        <div>
          <span>DECISÃO</span>
          <strong>Próximo passo</strong>
        </div>

        <span />
      </header>

      <section className={styles.approvalPreview}>
        <div className={styles.approvalDocument}>
          <span>ALINORA</span>
          <strong>Website institucional</strong>

          <div className={styles.documentLines}>
            <i />
            <i />
            <i />
          </div>
        </div>

        <div className={styles.approvalCount}>
          <strong>03</strong>
          <span>EVOLUÇÃO</span>
        </div>
      </section>

      <section className={styles.approvalCopy}>
        <span>PRONTO PARA AVANÇAR</span>
        <h3>Esta versão representa o próximo passo?</h3>
        <p>
          Sua decisão será registrada e transformada em direção para toda a
          equipe.
        </p>
      </section>

      <div className={styles.approvalActions}>
        <button type="button" tabIndex={-1}>
          Refinar detalhes
        </button>

        <button type="button" tabIndex={-1}>
          <span aria-hidden="true">✓</span>
          Confirmar avanço
        </button>
      </div>

      <aside className={styles.humanReminder}>
        <span aria-hidden="true">◌</span>

        <p>
          Sua equipe continuará disponível em cada etapa dessa evolução.
        </p>
      </aside>
    </div>
  );
}

function SlideScreen({ slideId }: { slideId: PortalSlideId }) {
  switch (slideId) {
    case "overview":
      return <OverviewScreen />;

    case "project":
      return <ProjectScreen />;

    case "delivery":
      return <DeliveryScreen />;

    case "approval":
      return <ApprovalScreen />;
  }
}

export function AlinoraPhoneCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const goToPrevious = useCallback(() => {
    setActiveIndex((current) =>
      current === 0 ? slides.length - 1 : current - 1,
    );
  }, []);

  const goToNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % slides.length);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const updateMotionPreference = () => {
      setReduceMotion(mediaQuery.matches);
    };

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || isManuallyPaused || isInteracting) {
      return;
    }

    const interval = window.setInterval(goToNext, 5600);

    return () => {
      window.clearInterval(interval);
    };
  }, [goToNext, isInteracting, isManuallyPaused, reduceMotion]);

  const activeSlide = slides[activeIndex];

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      onFocusCapture={() => setIsInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsInteracting(false);
        }
      }}
    >
      <div className={styles.stage}>
        <div className={styles.stageLight} aria-hidden="true" />
        <div className={styles.floorShadow} aria-hidden="true" />

        <div
          className={`${styles.sideDevice} ${styles.leftDevice}`}
          aria-hidden="true"
        >
          <div className={styles.sideDeviceFrame}>
            <div className={styles.sideScreen}>
              <span className={styles.sideIsland} />

              <div className={styles.sideScreenHeader}>
                <i />
                <i />
              </div>

              <div className={styles.sideScreenCard}>
                <i />
                <i />
                <i />
              </div>

              <div className={styles.sideScreenLines}>
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
        </div>

        <div
          className={`${styles.sideDevice} ${styles.rightDevice}`}
          aria-hidden="true"
        >
          <div className={styles.sideDeviceFrame}>
            <div className={styles.sideScreen}>
              <span className={styles.sideIsland} />

              <div className={styles.sideScreenHeader}>
                <i />
                <i />
              </div>

              <div className={styles.sideScreenCard}>
                <i />
                <i />
                <i />
              </div>

              <div className={styles.sideScreenLines}>
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
        </div>

        <article
          className={styles.primaryDevice}
          aria-label={`Tela do portal: ${activeSlide.navigationLabel}`}
        >
          <div className={styles.deviceDepth} aria-hidden="true" />

          <div className={styles.deviceFrame}>
            <span
              className={`${styles.hardwareButton} ${styles.actionButton}`}
              aria-hidden="true"
            />

            <span
              className={`${styles.hardwareButton} ${styles.volumeUpButton}`}
              aria-hidden="true"
            />

            <span
              className={`${styles.hardwareButton} ${styles.volumeDownButton}`}
              aria-hidden="true"
            />

            <span
              className={`${styles.hardwareButton} ${styles.powerButton}`}
              aria-hidden="true"
            />

            <div className={styles.deviceGlass}>
              <div className={styles.phoneTop}>
                <span>9:41</span>

                <div className={styles.dynamicIsland}>
                  <i className={styles.cameraLens} aria-hidden="true" />
                </div>

                <div className={styles.phoneStatus} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
              </div>

              <div key={activeSlide.id} className={styles.phoneScreen}>
                <SlideScreen slideId={activeSlide.id} />
              </div>

              <div className={styles.screenReflection} aria-hidden="true" />
              <div className={styles.homeIndicator} aria-hidden="true" />
            </div>
          </div>
        </article>
      </div>

      <div className={styles.carouselInformation}>
        <div className={styles.slideCounter}>
          <span>
            {String(activeIndex + 1).padStart(2, "0")} /{" "}
            {String(slides.length).padStart(2, "0")}
          </span>

          <div className={styles.dots} aria-label="Selecionar tela do portal">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={index === activeIndex ? styles.activeDot : ""}
                onClick={() => setActiveIndex(index)}
                aria-label={`Mostrar ${slide.navigationLabel}`}
                aria-current={index === activeIndex ? "true" : undefined}
              />
            ))}
          </div>
        </div>

        <div className={styles.slideDescription} aria-live="polite">
          <span>{activeSlide.navigationLabel}</span>
          <strong>{activeSlide.screenTitle}</strong>
          <p>{activeSlide.description}</p>
        </div>

        <div className={styles.controls}>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            aria-label="Mostrar tela anterior"
          >
            <span aria-hidden="true">←</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsManuallyPaused((current) => !current)}
            aria-label={
              isManuallyPaused
                ? "Continuar troca automática"
                : "Pausar troca automática"
            }
            aria-pressed={isManuallyPaused}
          >
            <span aria-hidden="true">
              {isManuallyPaused ? "▶" : "Ⅱ"}
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={goToNext}
            aria-label="Mostrar próxima tela"
          >
            <span aria-hidden="true">→</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AlinoraPhoneCarousel;