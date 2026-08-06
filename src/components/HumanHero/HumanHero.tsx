"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import styles from "./HumanHero.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

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

      if (!section || !scene || !dashboard) return;

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

      const entrance = gsap.timeline({
        defaults: {
          ease: "power4.out",
        },
      });

      entrance
        .from(`.${styles.kicker}`, {
          opacity: 0,
          y: 18,
          duration: 0.7,
        })
        .from(
          `.${styles.titleLineInner}`,
          {
            yPercent: 115,
            duration: 1.15,
            stagger: 0.1,
          },
          "-=0.35",
        )
        .from(
          `.${styles.description}`,
          {
            opacity: 0,
            y: 24,
            duration: 0.75,
          },
          "-=0.65",
        )
        .from(
          `.${styles.actions}`,
          {
            opacity: 0,
            y: 20,
            duration: 0.65,
          },
          "-=0.55",
        )
        .to(
          dashboard,
          {
            opacity: 1,
            x: 0,
            rotationY: -3,
            scale: 1,
            duration: 1.25,
          },
          "-=0.85",
        )
        .to(
          cards,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.75,
            stagger: 0.09,
          },
          "-=0.8",
        )
        .to(
          cables,
          {
            strokeDashoffset: 0,
            duration: 1.2,
            stagger: 0.08,
          },
          "-=0.85",
        );

      if (!reduceMotion) {
        gsap.to(`.${styles.sceneGroup}`, {
          yPercent: -6,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        });

        gsap.to(cards, {
          y: (index) => (index % 2 === 0 ? -22 : 18),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 1.2,
          },
        });
      }

      if (!finePointer || reduceMotion) return;

      const moveSceneX = gsap.quickTo(scene, "rotationY", {
        duration: 1.1,
        ease: "power3.out",
      });

      const moveSceneY = gsap.quickTo(scene, "rotationX", {
        duration: 1.1,
        ease: "power3.out",
      });

      const handlePointerMove = (event: PointerEvent) => {
        const bounds = section.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;

        moveSceneX(x * 4);
        moveSceneY(y * -4);

        cards.forEach((card, index) => {
          const depth = Number(card.dataset.depth ?? 1);

          gsap.to(card, {
            x: x * depth * (18 + index * 3),
            y: y * depth * (14 + index * 2),
            rotationY: x * depth * 5,
            rotationX: y * depth * -5,
            duration: 0.9,
            ease: "power3.out",
            overwrite: "auto",
          });
        });

        gsap.to(`.${styles.light}`, {
          xPercent: x * 24,
          yPercent: y * 24,
          duration: 1.3,
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      const handlePointerLeave = () => {
        moveSceneX(0);
        moveSceneY(0);

        gsap.to(cards, {
          x: 0,
          y: 0,
          rotationX: 0,
          rotationY: 0,
          duration: 1,
          ease: "power3.out",
        });
      };

      section.addEventListener("pointermove", handlePointerMove);
      section.addEventListener("pointerleave", handlePointerLeave);

      return () => {
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
                <path
                  data-cable
                  d="M260 115 C390 115, 355 205, 500 205"
                />
                <path
                  data-cable
                  d="M280 245 C390 245, 390 280, 500 280"
                />
                <path
                  data-cable
                  d="M245 375 C365 375, 400 355, 500 355"
                />
                <path
                  data-cable
                  d="M300 515 C410 515, 410 430, 500 430"
                />
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