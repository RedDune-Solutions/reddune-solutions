"use client";

import { useState } from "react";

/**
 * DualLineChart — "Receita vs Gastos" (geometria do protótipo, linhas 786-800).
 * Receita (linha #d6422a cheia + área gradiente + pontos) vs Gastos (#b0793f
 * tracejada). Interactivo: toggle Mensal/Acumulado + tooltip nos pontos
 * (hover em desktop, toque em mobile).
 */

type Point = { l: string; rec: number; gas: number };

function fmtAxis(v: number): string {
  if (v >= 1000) return `${(v / 1000).toLocaleString("pt-PT", { maximumFractionDigits: 1 })}k`;
  return String(Math.round(v));
}

function fmtEuro(v: number): string {
  return `${Math.round(v).toLocaleString("pt-PT")} €`;
}

export function DualLineChart({ data }: { data: Point[] }) {
  const [modo, setModo] = useState<"mensal" | "acumulado">("mensal");
  const [hover, setHover] = useState<number | null>(null);

  // Acumulado = soma corrente dentro da janela visível (as distorções de
  // projectos que atravessam meses anulam-se).
  const serie: Point[] =
    modo === "mensal"
      ? data
      : data.reduce<Point[]>((acc, d, i) => {
          const prev = i > 0 ? acc[i - 1] : { l: "", rec: 0, gas: 0 };
          acc.push({ l: d.l, rec: prev.rec + d.rec, gas: prev.gas + d.gas });
          return acc;
        }, []);

  const w = 700;
  const h = 220;
  const x0 = 56; // primeiro ponto
  const x1 = 680; // último ponto
  const yBase = 180; // linha do 0
  const yTop = 40; // linha do máximo
  const maxData = Math.max(...serie.map((d) => Math.max(d.rec, d.gas)), 0);
  const max = Math.max(1, maxData);
  const step = serie.length > 1 ? (x1 - x0) / (serie.length - 1) : 0;
  const x = (i: number) => x0 + i * step;
  const y = (v: number) => yBase - (v / max) * (yBase - yTop);
  const recPts = serie.map((d, i) => `${x(i)},${y(d.rec)}`).join(" ");
  const gasPts = serie.map((d, i) => `${x(i)},${y(d.gas)}`).join(" ");
  const areaPts = `${recPts} ${x(serie.length - 1)},${yBase} ${x(0)},${yBase}`;

  // Tooltip: caixa ancorada acima do ponto mais alto do mês, sem sair do svg.
  const tip = hover !== null ? serie[hover] : null;
  const tipW = 148;
  const tipH = 66;
  const tipX = tip !== null && hover !== null ? Math.min(Math.max(x(hover) - tipW / 2, 8), w - tipW - 8) : 0;
  const tipYRaw = tip !== null && hover !== null ? Math.min(y(tip.rec), y(tip.gas)) - tipH - 12 : 0;
  const tipY = Math.max(4, tipYRaw);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: 4 }}>
        {(["mensal", "acumulado"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setModo(m)}
            aria-pressed={modo === m}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: ".12em",
              padding: "4px 12px",
              borderRadius: 999,
              border: "1px solid rgba(90,14,14,.18)",
              background: modo === m ? "var(--ember)" : "transparent",
              color: modo === m ? "#faf4e3" : "#8c7563",
              cursor: "pointer",
            }}
          >
            {m === "mensal" ? "Mensal" : "Acumulado"}
          </button>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={`Gráfico de receita e gastos (${modo === "mensal" ? "mensal" : "acumulado"})`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="rev-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d6422a" stopOpacity=".20" />
            <stop offset="100%" stopColor="#d6422a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="46" y1={yBase} x2="690" y2={yBase} stroke="rgba(90,14,14,.14)" />
        <line x1="46" y1="110" x2="690" y2="110" stroke="rgba(90,14,14,.06)" />
        <line x1="46" y1={yTop} x2="690" y2={yTop} stroke="rgba(90,14,14,.06)" />
        <text x="40" y={yBase + 4} textAnchor="end" fontFamily="var(--font-mono)" fontSize="9" fill="#8c7563">0</text>
        {maxData > 0 && (
          <>
            <text x="40" y="114" textAnchor="end" fontFamily="var(--font-mono)" fontSize="9" fill="#8c7563">{fmtAxis(max / 2)}</text>
            <text x="40" y={yTop + 4} textAnchor="end" fontFamily="var(--font-mono)" fontSize="9" fill="#8c7563">{fmtAxis(max)}</text>
          </>
        )}
        <polygon points={areaPts} fill="url(#rev-area)" />
        <polyline points={recPts} fill="none" stroke="#d6422a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <g fill="#d6422a">
          {serie.map((d, i) => (
            <circle
              key={i}
              cx={x(i)}
              cy={y(d.rec)}
              r={hover === i ? 5.5 : i === serie.length - 1 ? 4.5 : 3.5}
              {...(i === serie.length - 1 || hover === i
                ? { stroke: "#faf4e3", strokeWidth: 2 }
                : {})}
            />
          ))}
        </g>
        <polyline points={gasPts} fill="none" stroke="#b0793f" strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />
        <g fill="#b0793f">
          {serie.map((d, i) => (
            <circle key={i} cx={x(i)} cy={y(d.gas)} r={hover === i ? 4.5 : 3} />
          ))}
        </g>
        <g fontFamily="var(--font-mono)" fontSize="10" fill="#8c7563" textAnchor="middle">
          {serie.map((d, i) => (
            <text key={i} x={x(i)} y="206">{d.l}</text>
          ))}
        </g>

        {/* Guia vertical do mês em foco */}
        {hover !== null && (
          <line
            x1={x(hover)}
            y1={yTop - 6}
            x2={x(hover)}
            y2={yBase}
            stroke="rgba(90,14,14,.22)"
            strokeDasharray="3 3"
          />
        )}

        {/* Zonas de hover/toque — uma coluna por mês, por cima de tudo excepto o tooltip */}
        {serie.map((_, i) => (
          <rect
            key={i}
            x={x(i) - (step || w) / 2}
            y={yTop - 24}
            width={step || w}
            height={yBase - yTop + 48}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onClick={() => setHover(hover === i ? null : i)}
          />
        ))}

        {/* Tooltip */}
        {tip !== null && hover !== null && (
          <g pointerEvents="none">
            <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="10" fill="#2a1410" opacity="0.95" />
            <text x={tipX + 12} y={tipY + 18} fontFamily="var(--font-mono)" fontSize="9" fill="#e89968" style={{ textTransform: "uppercase", letterSpacing: ".12em" }}>
              {tip.l}{modo === "acumulado" ? " · acumulado" : ""}
            </text>
            <circle cx={tipX + 16} cy={tipY + 31} r="3" fill="#d6422a" />
            <text x={tipX + 26} y={tipY + 35} fontFamily="var(--font-mono)" fontSize="10" fill="#faf4e3">
              Receita {fmtEuro(tip.rec)}
            </text>
            <circle cx={tipX + 16} cy={tipY + 46} r="3" fill="#b0793f" />
            <text x={tipX + 26} y={tipY + 50} fontFamily="var(--font-mono)" fontSize="10" fill="#faf4e3">
              Gastos {fmtEuro(tip.gas)} · Lucro {fmtEuro(tip.rec - tip.gas)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
