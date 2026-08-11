"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import styles from "./HumanHero.module.css";

gsap.registerPlugin(useGSAP);

const communicationCards = [
  {
    id: "message",
    type: "Mensagem",
    name: "Juliana · Cliente",
    time: "09:15",
    content: "Precisamos ajustar o briefing e confirmar o prazo final.",
  },
  {
    id: "audio",
    type: "Áudio",
    name: "Carlos · Design",
    time: "00:28",
    content: "voice",
  },
  {
    id: "file",
    type: "Arquivo",
    name: "Nova versão",
    time: "Ontem",
    content: "versao_3_final.pdf",
  },
  {
    id: "approval",
    type: "Aprovação",
    name: "Mariana · Cliente",
    time: "10:47",
    content: "Aprovado! Pode seguir para produção.",
  },
];

export function HumanHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const scene = sceneRef.current;
      const dashboard = dashboardRef.current;
      const light = section?.querySelector<HTMLElement>(`.${styles.light}`);

      if (!section || !scene || !dashboard || !light) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const finePointer = window.matchMedia(
        "(hover: hover) and (pointer: fine)",
      ).matches;

      const cards = Array.from(
        scene.querySelectorAll<HTMLElement>("[data-communication-card]"),
      );

      const cables = Array.from(
        scene.querySelectorAll<SVGPathElement>("[data-cable]"),
      );

      gsap.set(cards, {
        opacity: 0,
        y: 35,
        scale: 0.94,
      });

      gsap.set(dashboard, {
        opacity: 0,
        x: 45,
        rotationY: -9,
        scale: 0.94,
      });

      gsap.set(cables, {
        strokeDasharray: 500,
        strokeDashoffset: 500,
      });

      if (reduceMotion) {
        gsap.set(cards, { opacity: 1, y: 0, scale: 1 });
        gsap.set(dashboard, {
          opacity: 1,
          x: 0,
          rotationY: 0,
          scale: 1,
        });
        gsap.set(cables, { strokeDashoffset: 0 });
        return;
      }

      const entrance = gsap.timeline({
        defaults: {
          ease: "power4.out",
        },
      });

      entrance
        .from(`.${styles.kicker}`, {
          opacity: 0,
          y: 18,
          duration: 0.42,
        })
        .from(
          `.${styles.titleLineInner}`,
          {
            yPercent: 115,
            duration: 0.72,
            stagger: 0.06,
          },
          "-=0.22",
        )
        .from(
          `.${styles.description}`,
          {
            opacity: 0,
            y: 24,
            duration: 0.45,
          },
          "-=0.4",
        )
        .from(
          `.${styles.actions}`,
          {
            opacity: 0,
            y: 20,
            duration: 0.4,
          },
          "-=0.32",
        )
        .to(
          dashboard,
          {
            opacity: 1,
            x: 0,
            rotationY: -3,
            scale: 1,
            duration: 0.72,
          },
          "-=0.54",
        )
        .to(
          cards,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.46,
            stagger: 0.055,
          },
          "-=0.5",
        )
        .to(
          cables,
          {
            strokeDashoffset: 0,
            duration: 0.68,
            stagger: 0.045,
          },
          "-=0.52",
        );

      if (!finePointer) return;

      const moveSceneX = gsap.quickTo(scene, "rotationY", {
        duration: 0.45,
        ease: "power3.out",
      });

      const moveSceneY = gsap.quickTo(scene, "rotationX", {
        duration: 0.45,
        ease: "power3.out",
      });

      const moveLightX = gsap.quickTo(light, "xPercent", {
        duration: 0.55,
        ease: "power3.out",
      });

      const moveLightY = gsap.quickTo(light, "yPercent", {
        duration: 0.55,
        ease: "power3.out",
      });

      let pointerFrame = 0;
      let pointerX = 0;
      let pointerY = 0;

      const handlePointerMove = (event: PointerEvent) => {
        pointerX = event.clientX;
        pointerY = event.clientY;

        if (pointerFrame) return;

        pointerFrame = window.requestAnimationFrame(() => {
          pointerFrame = 0;
          const bounds = section.getBoundingClientRect();
          const x = (pointerX - bounds.left) / bounds.width - 0.5;
          const y = (pointerY - bounds.top) / bounds.height - 0.5;

          moveSceneX(x * 2.4);
          moveSceneY(y * -2.4);
          moveLightX(x * 10);
          moveLightY(y * 10);
        });
      };

      const handlePointerLeave = () => {
        window.cancelAnimationFrame(pointerFrame);
        pointerFrame = 0;
        moveSceneX(0);
        moveSceneY(0);
        moveLightX(0);
        moveLightY(0);
      };

      section.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });
      section.addEventListener("pointerleave", handlePointerLeave);

      return () => {
        window.cancelAnimationFrame(pointerFrame);
        section.removeEventListener("pointermove", handlePointerMove);
        section.removeEventListener("pointerleave", handlePointerLeave);
      };
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className={styles.hero} id="produto">
      <div className={styles.texture} aria-hidden="true" />
      <div className={styles.light} aria-hidden="true" />

      <div className={styles.layout}>
        <div className={styles.content}>
          <p className={styles.kicker}>
            De conversas soltas
            <span>à clareza que move tudo.</span>
          </p>

          <h1 className={styles.title}>
            <span className={styles.titleLine}>
              <span className={styles.titleLineInner}>Toda conversa</span>
            </span>

            <span className={styles.titleLine}>
              <span className={styles.titleLineInner}>encontra seu lugar.</span>
            </span>
          </h1>

          <p className={styles.description}>
            A Alinora organiza contatos, decisões, prazos e entregas em um fluxo
            claro que toda a operação entende e confia.
          </p>

          <div className={styles.actions}>
            <a className={styles.primaryAction} href="/login">
              <span>Ver como funciona</span>
              <i aria-hidden="true">→</i>
            </a>

            <a className={styles.secondaryAction} href="#recursos">
              Explorar a plataforma
            </a>
          </div>

          <div className={styles.humanNote}>
            <svg viewBox="0 0 52 34" aria-hidden="true">
              <path d="M3 27C15 29 25 23 31 14C36 7 43 4 49 5" />
              <path d="M43 2L50 5L46 11" />
            </svg>

            <span>
              Comunicação organizada,
              <br />
              sem perder o lado humano.
            </span>
          </div>
        </div>

        <div className={styles.visual}>
          <div ref={sceneRef} className={styles.scene}>
            <div className={styles.sceneGroup}>
              <svg
                className={styles.cables}
                viewBox="0 0 900 650"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path data-cable d="M260 115 C390 115, 355 205, 500 205" />
                <path data-cable d="M280 245 C390 245, 390 280, 500 280" />
                <path data-cable d="M245 375 C365 375, 400 355, 500 355" />
                <path data-cable d="M300 515 C410 515, 410 430, 500 430" />
              </svg>

              <div className={styles.cardsColumn}>
                {communicationCards.map((card, index) => (
                  <article
                    key={card.id}
                    className={`${styles.communicationCard} ${
                      styles[`card${index + 1}`]
                    }`}
                    data-communication-card
                    data-depth={0.7 + index * 0.16}
                  >
                    <div className={styles.cardHeader}>
                      <div className={styles.avatar} aria-hidden="true">
                        {card.name.charAt(0)}
                      </div>

                      <div>
                        <strong>{card.name}</strong>
                        <span>{card.type}</span>
                      </div>

                      <time>{card.time}</time>
                    </div>

                    {card.content === "voice" ? (
                      <div className={styles.voiceMessage}>
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label="Reproduzir exemplo de áudio"
                        >
                          ▶
                        </button>

                        <div className={styles.waveform} aria-hidden="true">
                          {Array.from({ length: 24 }).map((_, barIndex) => (
                            <i
                              key={barIndex}
                              style={{
                                height: `${7 + ((barIndex * 11) % 22)}px`,
                              }}
                            />
                          ))}
                        </div>

                        <span>0:28</span>
                      </div>
                    ) : card.id === "file" ? (
                      <div className={styles.fileMessage}>
                        <span aria-hidden="true">⌑</span>

                        <div>
                          <strong>{card.content}</strong>
                          <small>24,8 MB · versão 03</small>
                        </div>

                        <i aria-hidden="true">•••</i>
                      </div>
                    ) : (
                      <p>{card.content}</p>
                    )}

                    {card.id === "approval" && (
                      <div className={styles.reaction}>
                        <span aria-hidden="true">♥</span> 1
                      </div>
                    )}
                  </article>
                ))}
              </div>

              <div ref={dashboardRef} className={styles.dashboard}>
                <div className={styles.dashboardTopbar}>
                  <strong>alinora</strong>

                  <div>
                    <span className={styles.notification}>1</span>
                    <span className={styles.userAvatar}>LO</span>
                  </div>
                </div>

                <div className={styles.dashboardBody}>
                  <aside className={styles.sidebar}>
                    <strong>Visão geral</strong>
                    <span>Projetos</span>
                    <span>Conversas</span>
                    <span>Arquivos</span>
                    <span>Entregas</span>
                    <span>Aprovações</span>
                    <span>Clientes</span>
                  </aside>

                  <div className={styles.dashboardMain}>
                    <div className={styles.dashboardHeading}>
                      <div>
                        <span>VISÃO GERAL</span>
                        <h2>Boa tarde, Luciano.</h2>
                      </div>

                      <button type="button" tabIndex={-1}>
                        + Novo projeto
                      </button>
                    </div>

                    <div className={styles.metrics}>
                      <div>
                        <span>PROJETOS ATIVOS</span>
                        <strong>08</strong>
                      </div>

                      <div>
                        <span>ENTREGAS NO PRAZO</span>
                        <strong>92%</strong>
                      </div>

                      <div>
                        <span>APROVAÇÕES HOJE</span>
                        <strong>05</strong>
                      </div>
                    </div>

                    <div className={styles.projectPanel}>
                      <div className={styles.projectPanelHeading}>
                        <strong>Projetos em andamento</strong>
                        <span>Ver todos</span>
                      </div>

                      {[
                        ["Rebranding ACME", "72%"],
                        ["Campanha de inverno", "45%"],
                        ["Site institucional", "90%"],
                      ].map(([project, progress]) => (
                        <div className={styles.projectRow} key={project}>
                          <div>
                            <strong>{project}</strong>
                            <small>Em andamento</small>
                          </div>

                          <div className={styles.progress}>
                            <span style={{ width: progress }} />
                          </div>

                          <strong>{progress}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.deadlineNote}>
                <span>Prazo final</span>
                <strong>24 MAI</strong>
                <i aria-hidden="true">✓</i>
              </div>

              <div className={styles.approvedToast}>
                <span aria-hidden="true">✓</span>

                <div>
                  <strong>Arquivo aprovado</strong>
                  <small>versao_3_final.pdf</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottomMessage}>
        <span>ROLE PARA EXPLORAR</span>

        <p>
          Mensagens, decisões e entregas
          <strong> finalmente conectadas.</strong>
        </p>
      </div>
    </section>
  );
}
