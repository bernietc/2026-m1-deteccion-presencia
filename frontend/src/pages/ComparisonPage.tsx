import React from 'react';
import { GlassPanel } from '../components/common/GlassPanel';
import { SectionHeader } from '../components/common/SectionHeader';
import { ComparisonBarChart } from '../components/charts/ComparisonBarChart';
import { useMetrics } from '../hooks/useMetrics';
import { BarChart3, Scale, Award, Info, RefreshCw } from 'lucide-react';

export const ComparisonPage: React.FC = () => {
  const { comparison, loading, refresh } = useMetrics();

  const metricsList = comparison?.metrics || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 1. ENCABEZADO DE COMPARACIÓN */}
      <GlassPanel>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-blue)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              <Scale size={14} />
              <span>Evaluación Experimental Cuantitativa</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
              Comparación Académica de Métodos
            </h1>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: '850px', lineHeight: 1.5, marginTop: '0.2rem' }}>
              Contraste metodológico entre el sensor infrarrojo piroeléctrico tradicional (PIR), la detección de presencia
              mediante CSI Wi-Fi sobre infraestructura de router existente, y el enlace de RF dedicado punto a punto con ESP32.
            </p>
          </div>

          <button
            onClick={refresh}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--glass-bg-hover)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--glass-shadow)',
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
            <span>Actualizar Métricas</span>
          </button>
        </div>
      </GlassPanel>

      {/* 2. TABLA COMPARATIVA PRINCIPAL */}
      <div>
        <SectionHeader
          title="Tabla Comparativa de Desempeño"
          subtitle="Síntesis de indicadores clave de detección y tiempos de respuesta"
          icon={<Award size={18} />}
        />

        <div className="glass-table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Métrica Experimental</th>
                <th style={{ width: '15%' }}>Unidad</th>
                <th style={{ width: '18%', color: '#059669' }}>Caso 1 — PIR</th>
                <th style={{ width: '18%', color: '#0284c7' }}>Caso 2 — CSI Router</th>
                <th style={{ width: '19%', color: '#6366f1' }}>Caso 3 — CSI Dedicado</th>
              </tr>
            </thead>
            <tbody>
              {comparison?.table.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.metric}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{row.unit}</td>
                  <td style={{ fontWeight: 600 }}>{row.pir}</td>
                  <td style={{ fontWeight: 600 }}>{row.csi_router}</td>
                  <td style={{ fontWeight: 600 }}>{row.csi_dedicated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. GRÁFICOS COMPARATIVOS */}
      <div>
        <SectionHeader
          title="Análisis Gráfico Comparativo"
          subtitle="Distribución visual de exactitud, errores de clasificación y retardo"
          icon={<BarChart3 size={18} />}
        />

        <div className="grid-2">
          <GlassPanel style={{ padding: '1rem' }}>
            <ComparisonBarChart
              metrics={metricsList}
              metricKey="detection_rate"
              title="Tasa de Detección (%)"
              unit="%"
              height={220}
            />
          </GlassPanel>

          <GlassPanel style={{ padding: '1rem' }}>
            <ComparisonBarChart
              metrics={metricsList}
              metricKey="average_latency_ms"
              title="Latencia Media (ms)"
              unit="ms"
              height={220}
            />
          </GlassPanel>

          <GlassPanel style={{ padding: '1rem' }}>
            <ComparisonBarChart
              metrics={metricsList}
              metricKey="false_positives"
              title="Falsos Positivos (FP)"
              unit="ensayos"
              height={220}
            />
          </GlassPanel>

          <GlassPanel style={{ padding: '1rem' }}>
            <ComparisonBarChart
              metrics={metricsList}
              metricKey="false_negatives"
              title="Falsos Negativos (FN)"
              unit="ensayos"
              height={220}
            />
          </GlassPanel>
        </div>
      </div>

      {/* 4. DISCRIMINACIÓN: OBJETOS INANIMADOS VS. PERSONAS */}
      <div>
        <SectionHeader
          title="Discriminación Física: Objetos Inanimados vs. Cuerpos Humanos"
          subtitle="Fundamentos físicos y respuesta diferencial entre radiación térmica infrarroja y multitrayecto RF"
          icon={<Scale size={18} />}
        />

        <div className="glass-table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Escenario Físico</th>
                <th style={{ width: '24%', color: '#059669' }}>Respuesta Sensor PIR (9.4 µm)</th>
                <th style={{ width: '28%', color: '#0284c7' }}>Respuesta CSI Wi-Fi (2.4 GHz)</th>
                <th style={{ width: '26%', color: '#6366f1' }}>Decisión / Clasificación del Sistema</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Persona en Movimiento</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Caminando / desplazándose</div>
                </td>
                <td style={{ color: '#059669', fontWeight: 600 }}>
                  DETECTA (1) — Gradiente térmico dinámico en piroelementos
                </td>
                <td style={{ color: '#0284c7', fontWeight: 600 }}>
                  DETECTA — Dispersión multicamino aperiódica y absorción de agua (cuerpo ~70%)
                </td>
                <td>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(5, 150, 105, 0.15)', color: '#059669', fontWeight: 700, fontSize: '0.75rem' }}>
                    HUMANO ACTIVO
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Persona en Reposo / Sentada</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Inmóvil / respirando</div>
                </td>
                <td style={{ color: '#dc2626', fontWeight: 600 }}>
                  NO DETECTA (0) — Sin flujo térmico diferencial entre lentes
                </td>
                <td style={{ color: '#0284c7', fontWeight: 600 }}>
                  DETECTA — Micro-Doppler de caja torácica (0.2 a 0.35 Hz) en análisis espectral
                </td>
                <td>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(2, 132, 199, 0.15)', color: '#0284c7', fontWeight: 700, fontSize: '0.75rem' }}>
                    HUMANO ESTÁTICO (RESPIRACIÓN)
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Ventilador en Marcha</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Aspas plásticas/metálicas girando</div>
                </td>
                <td style={{ color: '#64748b' }}>
                  REPOSO (0) — Temperatura ambiente; sin emisión infrarroja diferencial
                </td>
                <td style={{ color: '#f59e0b', fontWeight: 600 }}>
                  PERTURBACIÓN PERIÓDICA — Picos armónicos nítidos en FFT con periodicidad &gt; 0.40
                </td>
                <td>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', fontWeight: 700, fontSize: '0.75rem' }}>
                    OBJETO PERIÓDICO (DESCARTADO)
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Objeto / Mueble Desplazado</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mueble o puerta desplazada</div>
                </td>
                <td style={{ color: '#64748b' }}>
                  REPOSO (0) — Sin radiación térmica corporal
                </td>
                <td style={{ color: '#8b5cf6', fontWeight: 600 }}>
                  ESCALÓN DC — Salto estático permanente que se estabiliza con varianza nula
                </td>
                <td>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.15)', color: '#7c3aed', fontWeight: 700, fontSize: '0.75rem' }}>
                    CAMBIO ESTÁTICO (NO HUMANO)
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Ambiente Vacío</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Recinto sin presencia</div>
                </td>
                <td style={{ color: '#64748b' }}>REPOSO (0) — Nivel constante</td>
                <td style={{ color: '#64748b' }}>LÍNEA BASE PLANA — Ruido térmico gaussiano estándar</td>
                <td>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(100, 116, 139, 0.15)', color: '#64748b', fontWeight: 700, fontSize: '0.75rem' }}>
                    SIN PRESENCIA
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. CONCLUSIONES TÉCNICAS */}
      <GlassPanel>
        <div style={{ display: 'flex', gap: '0.85rem' }}>
          <div style={{ color: 'var(--accent-blue)', marginTop: '0.1rem' }}>
            <Info size={20} />
          </div>
          <div style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.3rem' }}>
              Consideraciones de Ingeniería del Proyecto
            </strong>
            <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>
                <strong>PIR:</strong> Máxima reactividad y latencia inferior a 160 ms, pero nula sensibilidad a presencia estática (personas inmóviles o dormidas) y dependencia estricta de línea de visión. Es inmune a perturbaciones mecánicas frías como ventiladores.
              </li>
              <li>
                <strong>CSI Router:</strong> No requiere desplegar nuevos emisores de radiofrecuencia, detecta a través de obstáculos ligeros y capta micro-Doppler respiratorio, pero requiere filtrado de periodicidad para no confundir ventiladores con humanos.
              </li>
              <li>
                <strong>CSI Dedicado:</strong> Control total del canal RF con piso de ruido reducido, calibración fina de potencia de transmisión (dBm) y máxima reproducibilidad experimental.
              </li>
            </ul>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};
