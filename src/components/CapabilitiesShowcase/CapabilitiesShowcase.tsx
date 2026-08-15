"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./CapabilitiesShowcase.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const AlinoraPhoneCarousel = dynamic(
  () =>
    import("@/components/ui/alinora-phone-carousel").then(
      (module) => module.AlinoraPhoneCarousel,
    ),
  {
    ssr: false,
    loading: () => <div className={styles.phoneLoading} aria-hidden="true" />,
  },
);

const storyMedia = [
  {
    src: "/images/alinora-story/01-clientes-ia.webp",
    alt: "Profissional usando inteligência para centralizar relacionamentos com clientes",
  },
  {
    src: "/images/alinora-story/02-projetos-ia.webp",
    alt: "Fluxo de projetos organizado com apoio de inteligência artificial",
  },
  {
    src: "/images/alinora-story/03-entregas-ia.webp",
    alt: "Entrega profissional validada entre empresa e cliente",
  },
  {
    src: "/images/alinora-story/04-crescimento-ia.webp",
    alt: "Visão de crescimento empresarial conectado pela Alinora",
  },
] as const;

const activityItems = [
  {
    action: "Briefing atualizado",
    detail: "Mariana adicionou novas referências.",
    time: "09:42",
  },
  {
    action: "Próxima etapa confirmada",
    detail: "Apresentação definida para 12 AGO.",
    time: "Ontem",
  },
  {
    action: "Proposta aprovada",
    detail: "A decisão foi registrada no projeto.",
    time: "02 AGO",
  },
];

const projectColumns = [
  {
    title: "A fazer",
    count: "02",
    tasks: [
      { title: "Revisar proposta", client: "Estúdio Norte", date: "08 AGO" },
      {
        title: "Organizar referências",
        client: "Casa Flora",
        date: "09 AGO",
      },
    ],
  },
  {
    title: "Em andamento",
    count: "02",
    tasks: [
      {
        title: "Experiência principal",
        client: "Estúdio Norte",
        date: "10 AGO",
      },
      { title: "Identidade visual", client: "Casa Flora", date: "11 AGO" },
    ],
  },
  {
    title: "Concluído",
    count: "01",
    tasks: [
      {
        title: "Estrutura validada",
        client: "Lumina Tech",
        date: "CONCLUÍDO",
      },
    ],
  },
];

const deliveryFiles = [
  {
    extension: "PDF",
    name: "layout_final_v03.pdf",
    details: "18,4 MB · versão 03",
    status: "AGUARDANDO",
  },
  {
    extension: "ZIP",
    name: "arquivos_editaveis.zip",
    details: "42,7 MB · versão 01",
    status: "APROVADO",
  },
  {
    extension: "PDF",
    name: "guia_da_marca.pdf",
    details: "8,2 MB · versão 02",
    status: "APROVADO",
  },
];

function MobileSceneBackground({ index }: { index: number }) {
  const media = storyMedia[index];

  return (
    <div className={styles.mobileSceneBackground} aria-hidden="true">
      <Image src={media.src} alt="" fill sizes="100vw" />
      <span />
    </div>
  );
}

function ClientInterface() {
  return (
    <div className={styles.clientInterface}>
      <header className={styles.interfaceTopbar}>
        <div>
          <span>CLIENTE</span>
          <strong>Estúdio Norte</strong>
        </div>

        <span className={styles.activeBadge}>ATIVO</span>
      </header>

      <div className={styles.clientProfile}>
        <div className={styles.clientAvatar}>EN</div>

        <div>
          <strong>Mariana Costa</strong>
          <span>Diretora de marketing</span>
        </div>

        <button type="button" tabIndex={-1} aria-hidden="true">
          •••
        </button>
      </div>

      <div className={styles.clientMetrics}>
        <article>
          <span>PROJETOS</span>
          <strong>04</strong>
        </article>
        <article>
          <span>EM ANDAMENTO</span>
          <strong>02</strong>
        </article>
        <article>
          <span>CONCLUÍDOS</span>
          <strong>02</strong>
        </article>
      </div>

      <div className={styles.activityPanel}>
        <div className={styles.panelHeading}>
          <strong>Atividades recentes</strong>
          <span>Ver histórico</span>
        </div>

        {activityItems.map((item, index) => (
          <article key={item.action} className={styles.activityItem}>
            <span className={styles.activityMarker}>
              {index === 0 ? "↗" : index === 1 ? "◷" : "✓"}
            </span>

            <div>
              <strong>{item.action}</strong>
              <p>{item.detail}</p>
            </div>

            <time>{item.time}</time>
          </article>
        ))}
      </div>
    </div>
  );
}

function ProjectInterface() {
  return (
    <div className={styles.projectInterface}>
      <header className={styles.interfaceTopbar}>
        <div>
          <span>PROJETOS</span>
          <strong>Quadro de trabalho</strong>
        </div>

        <button type="button" tabIndex={-1} aria-hidden="true">
          + Novo projeto
        </button>
      </header>

      <div className={styles.kanban}>
        {projectColumns.map((column, columnIndex) => (
          <section key={column.title} className={styles.kanbanColumn}>
            <header>
              <span>
                <i className={styles[`columnColor${columnIndex + 1}`]} />
                {column.title}
              </span>

              <strong>{column.count}</strong>
            </header>

            <div className={styles.kanbanTasks}>
              {column.tasks.map((task) => (
                <article key={task.title} className={styles.taskCard}>
                  <span>{task.client}</span>
                  <strong>{task.title}</strong>

                  <footer>
                    <small>{task.date}</small>

                    <div className={styles.taskAvatars}>
                      <i>LO</i>
                      <i>MC</i>
                    </div>
                  </footer>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function DeliveryInterface() {
  return (
    <div className={styles.deliveryInterface}>
      <header className={styles.interfaceTopbar}>
        <div>
          <span>ENTREGA</span>
          <strong>Website institucional</strong>
        </div>

        <span className={styles.deliveryVersion}>VERSÃO 03</span>
      </header>

      <div className={styles.deliverySummary}>
        <div className={styles.deliveryPreview}>
          <span>ALINORA</span>
          <strong>Layout final</strong>

          <div>
            <i />
            <i />
            <i />
          </div>
        </div>

        <div className={styles.deliveryDescription}>
          <span>ENVIADO HOJE, 10:47</span>
          <h4>Arquivos prontos para revisão</h4>
          <p>
            A nova versão reúne todas as decisões tomadas até aqui e está pronta
            para avançar.
          </p>

          <button type="button" tabIndex={-1} aria-hidden="true">
            Solicitar aprovação
            <span>→</span>
          </button>
        </div>
      </div>

      <div className={styles.filesPanel}>
        <div className={styles.panelHeading}>
          <strong>Arquivos da entrega</strong>
          <span>3 arquivos</span>
        </div>

        {deliveryFiles.map((file) => (
          <article key={file.name} className={styles.fileRow}>
            <span className={styles.fileExtension}>{file.extension}</span>

            <div>
              <strong>{file.name}</strong>
              <small>{file.details}</small>
            </div>

            <span
              className={
                file.status === "APROVADO"
                  ? styles.approvedStatus
                  : styles.waitingStatus
              }
            >
              {file.status}
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}

export function CapabilitiesShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const stage = stageRef.current;
      const track = trackRef.current;

      if (!stage || !track) {
        return;
      }

      gsap.from(`.${styles.headingInner}`, {
        opacity: 0,
        y: 45,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: `.${styles.sectionHeading}`,
          start: "top 80%",
          once: true,
        },
      });

      const media = gsap.matchMedia();
      let animationFrame = 0;

      media.add(
        "(min-width: 1151px) and (prefers-reduced-motion: no-preference)",
        () => {
          const mediaLayers =
            gsap.utils.toArray<HTMLElement>("[data-media-layer]");
          const labels = gsap.utils.toArray<HTMLElement>("[data-story-label]");

          let pendingProgress = 0;
          let activeLabel = 0;

          mediaLayers.forEach((layer, index) => {
            gsap.set(layer, { autoAlpha: index === 0 ? 1 : 0 });
          });

          const updateExperience = (progress: number) => {
            pendingProgress = Math.min(1, Math.max(0, progress));

            if (animationFrame) {
              return;
            }

            animationFrame = window.requestAnimationFrame(() => {
              animationFrame = 0;

              const normalizedProgress = pendingProgress;
              const mediaProgress =
                normalizedProgress * (storyMedia.length - 1);
              const lowerMedia = Math.floor(mediaProgress);
              const upperMedia = Math.min(
                storyMedia.length - 1,
                lowerMedia + 1,
              );
              const mediaMix = mediaProgress - lowerMedia;

              mediaLayers.forEach((layer, index) => {
                let opacity = 0;

                if (index === lowerMedia) {
                  opacity = 1 - mediaMix;
                }

                if (index === upperMedia) {
                  opacity = Math.max(opacity, mediaMix);
                }

                const opacityValue = opacity.toFixed(3);
                const visibilityValue = opacity > 0.001 ? "visible" : "hidden";

                if (layer.style.opacity !== opacityValue) {
                  layer.style.opacity = opacityValue;
                }

                if (layer.style.visibility !== visibilityValue) {
                  layer.style.visibility = visibilityValue;
                }
              });

              if (progressRef.current) {
                progressRef.current.style.transform = `scaleX(${normalizedProgress})`;
              }

              const nextLabel = Math.min(
                labels.length - 1,
                Math.round(normalizedProgress * (labels.length - 1)),
              );

              if (nextLabel !== activeLabel) {
                labels[activeLabel]?.removeAttribute("data-active");
                labels[nextLabel]?.setAttribute("data-active", "true");
                stage.dataset.chapter = String(nextLabel + 1);
                activeLabel = nextLabel;
              }
            });
          };

          gsap.to(track, {
            x: () => -(track.scrollWidth - window.innerWidth),
            ease: "none",
            scrollTrigger: {
              trigger: stage,
              start: "top top",
              end: () =>
                `+=${Math.max(track.scrollWidth - window.innerWidth, 3600)}`,
              pin: true,
              scrub: 0.32,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => updateExperience(self.progress),
              onRefresh: (self) => updateExperience(self.progress),
              onLeave: () => updateExperience(1),
              onLeaveBack: () => updateExperience(0),
            },
          });

          updateExperience(0);

          return () => {
            window.cancelAnimationFrame(animationFrame);
          };
        },
      );

      media.add(
        "(max-width: 1150px) and (prefers-reduced-motion: no-preference)",
        () => {
          const panels = gsap.utils.toArray<HTMLElement>("[data-story-panel]");

          panels.forEach((panel) => {
            const revealElements = panel.querySelectorAll<HTMLElement>(
              "[data-feature-reveal]",
            );

            gsap.from(revealElements, {
              opacity: 0,
              y: 34,
              duration: 0.85,
              stagger: 0.08,
              ease: "power3.out",
              scrollTrigger: {
                trigger: panel,
                start: "top 76%",
                once: true,
              },
            });
          });
        },
      );

      return () => {
        window.cancelAnimationFrame(animationFrame);
        media.revert();
      };
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="recursos" className={styles.section}>
      <div className={styles.container}>
        <header className={styles.sectionHeading}>
          <div className={styles.sectionLabel}>
            <span>01 / CRESCIMENTO</span>
          </div>

          <div className={styles.headingContent}>
            <div className={styles.headingInner}>
              <span className={styles.eyebrow}>
                UMA OPERAÇÃO PRONTA PARA CRESCER
              </span>

              <h2>Sua empresa cresce. O controle cresce com ela.</h2>

              <p>
                A Alinora transforma conversas, decisões e entregas em uma
                experiência que transmite clareza para sua equipe e confiança
                para seus clientes.
              </p>
            </div>
          </div>
        </header>

        <div ref={stageRef} className={styles.cinematicStage} data-chapter="1">
          <div className={styles.mediaDeck} aria-hidden="true">
            {storyMedia.map((mediaItem) => (
              <div
                key={mediaItem.src}
                className={styles.mediaLayer}
                data-media-layer
              >
                <Image src={mediaItem.src} alt="" fill sizes="100vw" />
              </div>
            ))}

            <span className={styles.mediaGrade} />
            <span className={styles.mediaVignette} />
          </div>

          <div ref={trackRef} className={styles.horizontalTrack}>
            <article
              className={`${styles.storyPanel} ${styles.clientsPanel}`}
              data-story-panel
              aria-labelledby="capability-clientes"
            >
              <MobileSceneBackground index={0} />

              <div className={styles.sceneGrid}>
                <div
                  className={styles.featureNumber}
                  data-feature-reveal
                  data-story-number
                >
                  <span>01</span>
                  <small>CLIENTES</small>
                </div>

                <div
                  className={styles.featureCopy}
                  data-feature-reveal
                  data-story-copy
                >
                  <span className={styles.featureKicker}>
                    INTELIGÊNCIA QUE ENTENDE CONTEXTO
                  </span>

                  <h3 id="capability-clientes">
                    Faça cada cliente sentir que escolheu a empresa certa.
                  </h3>

                  <p>
                    A Alinora conecta conversas, decisões e histórico para que
                    nenhuma relação dependa da memória.
                  </p>

                  <ul className={styles.featureList}>
                    <li>Relacionamentos centralizados</li>
                    <li>Contexto antes que surjam dúvidas</li>
                    <li>IA preparada para orientar decisões</li>
                  </ul>
                </div>

                <div
                  className={styles.featureVisual}
                  data-feature-reveal
                  data-story-visual
                >
                  <ClientInterface />
                </div>
              </div>
            </article>

            <article
              className={`${styles.storyPanel} ${styles.projectsPanel}`}
              data-story-panel
              aria-labelledby="capability-projetos"
            >
              <MobileSceneBackground index={1} />

              <div className={styles.sceneGrid}>
                <div
                  className={styles.featureNumber}
                  data-feature-reveal
                  data-story-number
                >
                  <span>02</span>
                  <small>PROJETOS</small>
                </div>

                <div
                  className={styles.featureCopy}
                  data-feature-reveal
                  data-story-copy
                >
                  <span className={styles.featureKicker}>
                    CRESCIMENTO SEM CAOS
                  </span>

                  <h3 id="capability-projetos">
                    Assuma projetos maiores sem perder o controle.
                  </h3>

                  <p>
                    Prioridades, responsáveis e próximos passos permanecem
                    visíveis para transformar movimento em progresso.
                  </p>

                  <ul className={styles.featureList}>
                    <li>Clareza para decidir</li>
                    <li>Ritmo para entregar</li>
                    <li>Estrutura para escalar</li>
                  </ul>
                </div>

                <div
                  className={styles.featureVisual}
                  data-feature-reveal
                  data-story-visual
                >
                  <ProjectInterface />
                </div>
              </div>
            </article>

            <article
              className={`${styles.storyPanel} ${styles.deliveriesPanel}`}
              data-story-panel
              aria-labelledby="capability-entregas"
            >
              <MobileSceneBackground index={2} />

              <div className={`${styles.sceneGrid} ${styles.reverseScene}`}>
                <div
                  className={styles.featureNumber}
                  data-feature-reveal
                  data-story-number
                >
                  <span>03</span>
                  <small>ENTREGAS</small>
                </div>

                <div
                  className={styles.featureCopy}
                  data-feature-reveal
                  data-story-copy
                >
                  <span className={styles.featureKicker}>
                    VALOR PERCEBIDO EM CADA ENTREGA
                  </span>

                  <h3 id="capability-entregas">
                    Não entregue apenas arquivos. Entregue confiança.
                  </h3>

                  <p>
                    Versões, análises e aprovações se transformam em uma
                    experiência que torna seu trabalho ainda mais valioso.
                  </p>

                  <ul className={styles.featureList}>
                    <li>Revisões apoiadas por inteligência</li>
                    <li>Aprovações sem atrito</li>
                    <li>Histórico que protege decisões</li>
                  </ul>
                </div>

                <div
                  className={styles.featureVisual}
                  data-feature-reveal
                  data-story-visual
                >
                  <DeliveryInterface />
                </div>
              </div>
            </article>

            <article
              className={`${styles.storyPanel} ${styles.portalPanel}`}
              data-story-panel
              aria-labelledby="capability-portal"
            >
              <MobileSceneBackground index={3} />

              <div className={styles.sceneGrid}>
                <div
                  className={styles.featureNumber}
                  data-feature-reveal
                  data-story-number
                >
                  <span>04</span>
                  <small>FUTURO</small>
                </div>

                <div
                  className={styles.featureCopy}
                  data-feature-reveal
                  data-story-copy
                >
                  <span className={styles.featureKicker}>
                    INTELIGÊNCIA PARA CRESCER
                  </span>

                  <h3 id="capability-portal">
                    Seu cliente acompanha o progresso. Você enxerga o futuro.
                  </h3>

                  <p>
                    Um portal elegante transforma cada contato em confiança e
                    cada decisão em uma empresa mais preparada para crescer.
                  </p>

                  <ul className={styles.featureList}>
                    <li>Acesso simples e exclusivo</li>
                    <li>Progresso que inspira confiança</li>
                    <li>Uma operação pronta para evoluir</li>
                  </ul>
                </div>

                <div
                  className={`${styles.featureVisual} ${styles.portalVisual}`}
                  data-feature-reveal
                  data-story-visual
                >
                  <div className={styles.portalCanvas}>
                    <AlinoraPhoneCarousel />
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div className={styles.storyProgress} aria-hidden="true">
            <div className={styles.progressMeta}>
              <span>EXPERIÊNCIA ALINORA</span>
              <span>ROLE PARA EXPLORAR</span>
            </div>

            <div className={styles.progressTrack}>
              <span ref={progressRef} />
            </div>

            <div className={styles.progressLabels}>
              <span data-story-label data-active="true">
                01 Clientes
              </span>
              <span data-story-label>02 Projetos</span>
              <span data-story-label>03 Entregas</span>
              <span data-story-label>04 Futuro</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}