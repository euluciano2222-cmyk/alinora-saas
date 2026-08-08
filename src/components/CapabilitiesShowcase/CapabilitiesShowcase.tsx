"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AlinoraPhoneCarousel } from "@/components/ui/alinora-phone-carousel";
import styles from "./CapabilitiesShowcase.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

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
      {
        title: "Revisar proposta",
        client: "Estúdio Norte",
        date: "08 AGO",
      },
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
      {
        title: "Identidade visual",
        client: "Casa Flora",
        date: "11 AGO",
      },
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

export function CapabilitiesShowcase() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;

      if (!section) {
        return;
      }

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        return;
      }

      const rows = gsap.utils.toArray<HTMLElement>("[data-feature-row]");

      rows.forEach((row) => {
        const revealElements =
          row.querySelectorAll<HTMLElement>("[data-feature-reveal]");

        gsap.from(revealElements, {
          opacity: 0,
          y: 36,
          duration: 0.9,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: row,
            start: "top 78%",
            once: true,
          },
        });
      });

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
    },
    {
      scope: sectionRef,
    },
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

        <article
          className={styles.featureRow}
          data-feature-row
          aria-labelledby="capability-clientes"
        >
          <div className={styles.featureNumber} data-feature-reveal>
            <span>01</span>
            <small>CLIENTES</small>
          </div>

          <div className={styles.featureCopy} data-feature-reveal>
            <span className={styles.featureKicker}>
              CONFIANÇA DESDE O PRIMEIRO CONTATO
            </span>

            <h3 id="capability-clientes">
              Faça cada cliente sentir que escolheu a empresa certa.
            </h3>

            <p>
              Cada atualização reforça seu profissionalismo, reduz inseguranças
              e aumenta o valor percebido do seu trabalho.
            </p>

            <ul className={styles.featureList}>
              <li>Uma experiência que valoriza sua marca</li>
              <li>Contexto antes que surjam dúvidas</li>
              <li>Relacionamentos preparados para durar</li>
            </ul>
          </div>

          <div className={styles.featureVisual} data-feature-reveal>
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

                <button type="button" tabIndex={-1}>
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
          </div>
        </article>

        <article
          className={styles.featureRow}
          data-feature-row
          aria-labelledby="capability-projetos"
        >
          <div className={styles.featureNumber} data-feature-reveal>
            <span>02</span>
            <small>PROJETOS</small>
          </div>

          <div className={styles.featureCopy} data-feature-reveal>
            <span className={styles.featureKicker}>CRESCIMENTO SEM CAOS</span>

            <h3 id="capability-projetos">
              Assuma projetos maiores sem perder o controle.
            </h3>

            <p>
              Prioridades, responsáveis e próximos passos permanecem visíveis
              para transformar movimento em progresso.
            </p>

            <ul className={styles.featureList}>
              <li>Clareza para decidir</li>
              <li>Ritmo para entregar</li>
              <li>Estrutura para escalar</li>
            </ul>
          </div>

          <div className={styles.featureVisual} data-feature-reveal>
            <div className={styles.projectInterface}>
              <header className={styles.interfaceTopbar}>
                <div>
                  <span>PROJETOS</span>
                  <strong>Quadro de trabalho</strong>
                </div>

                <button type="button" tabIndex={-1}>
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
          </div>
        </article>

        <article
          className={styles.featureRow}
          data-feature-row
          aria-labelledby="capability-entregas"
        >
          <div className={styles.featureNumber} data-feature-reveal>
            <span>03</span>
            <small>ENTREGAS</small>
          </div>

          <div className={styles.featureCopy} data-feature-reveal>
            <span className={styles.featureKicker}>
              VALOR PERCEBIDO EM CADA ENTREGA
            </span>

            <h3 id="capability-entregas">
              Não entregue apenas arquivos. Entregue confiança.
            </h3>

            <p>
              Versões, comentários e aprovações se transformam em uma
              experiência organizada que faz seu trabalho parecer ainda mais
              valioso.
            </p>

            <ul className={styles.featureList}>
              <li>Apresentações que impressionam</li>
              <li>Aprovações sem atrito</li>
              <li>Histórico que protege decisões</li>
            </ul>
          </div>

          <div className={styles.featureVisual} data-feature-reveal>
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
                    A nova versão reúne todas as decisões tomadas até aqui e
                    está pronta para avançar.
                  </p>

                  <button type="button" tabIndex={-1}>
                    Solicitar aprovação
                    <span aria-hidden="true">→</span>
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
                    <span className={styles.fileExtension}>
                      {file.extension}
                    </span>

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
          </div>
        </article>

        <article
          className={`${styles.featureRow} ${styles.portalRow}`}
          data-feature-row
          aria-labelledby="capability-portal"
        >
          <div className={styles.featureNumber} data-feature-reveal>
            <span>04</span>
            <small>PORTAL</small>
          </div>

          <div className={styles.featureCopy} data-feature-reveal>
            <span className={styles.featureKicker}>
              UMA EXPERIÊNCIA À ALTURA DA SUA MARCA
            </span>

            <h3 id="capability-portal">
              Seu cliente acompanha o progresso. E enxerga o futuro.
            </h3>

            <p>
              Um portal elegante e sob medida transforma cada contato em
              segurança, encantamento e vontade de continuar crescendo com
              você.
            </p>

            <ul className={styles.featureList}>
              <li>Acesso simples e exclusivo</li>
              <li>Progresso que inspira confiança</li>
              <li>Uma presença que diferencia sua empresa</li>
            </ul>
          </div>

          <div
            className={`${styles.featureVisual} ${styles.portalVisual}`}
            data-feature-reveal
          >
            <AlinoraPhoneCarousel />
          </div>
        </article>
      </div>
    </section>
  );
}