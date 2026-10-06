import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ScenarioDetail } from '../../types/config';
import { GlassCard } from '../common/GlassCard';
import { SectionHeader } from '../common/SectionHeader';
import { Activity, User, Wind, Move, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  onScenarioChange?: (scenario: string) => void;
}

export const ScenarioSelector: React.FC<Props> = ({ onScenarioChange }) => {
  const [scenarios, setScenarios] = useState<ScenarioDetail[]>([]);
  const [activeScenario, setActiveScenario] = useState<string>('automatic');
  const [activeDetail, setActiveDetail] = useState<ScenarioDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadScenarios() {
      try {
        const [list, current] = await Promise.all([
          api.getScenarios(),
          api.getCurrentScenario(),
        ]);
        setScenarios(list);
        setActiveScenario(current.active_scenario);
        setActiveDetail(current.detail);
      } catch (err) {
        console.error('Error cargando escenarios:', err);
      }
    }
    loadScenarios();
  }, []);

  const handleSelectScenario = async (scKey: string) => {
    setLoading(true);
    try {
      if (scKey === 'automatic') {
        const res = await api.resetScenario();
        setActiveScenario(res.active_scenario);
        setActiveDetail(null);
        setFeedback('Modo de simulación restablecido a Dinámica Automática.');
      } else {
        const res = await api.setScenario(scKey);
        setActiveScenario(res.active_scenario);
        setActiveDetail(res.detail);
        setFeedback(`Escenario aplicado: ${res.detail.name}`);
      }
      if (onScenarioChange) {
        onScenarioChange(scKey);
      }
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      alert('Error cambiando escenario: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScenarioIcon = (scenario: string) => {
    switch (scenario) {
      case 'human_active':
        return <User size={18} style={{ color: '#0284c7' }} />;
      case 'human_static':
        return <Activity size={18} style={{ color: '#10b981' }} />;
      case 'object_fan':
        return <Wind size={18} style={{ color: '#f59e0b' }} />;
      case 'object_moved':
        return <Move size={18} style={{ color: '#8b5cf6' }} />;
      default:
        return <RotateCcw size={18} style={{ color: 'var(--text-muted)' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <SectionHeader
          title="Discriminación Física: Objetos Inanimados vs. Personas"
          subtitle="Permite forzar perturbaciones ambientales y validar cómo reaccionan las firmas espectrales de CSI y el sensor PIR"
          icon={<Activity size={18} />}
        />

        <button
          onClick={() => handleSelectScenario('automatic')}
          disabled={loading || activeScenario === 'automatic'}
          style={{
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--input-border)',
            background: activeScenario === 'automatic' ? 'rgba(2, 132, 199, 0.15)' : 'var(--input-bg)',
            color: activeScenario === 'automatic' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <RotateCcw size={14} />
          {activeScenario === 'automatic' ? 'Modo Automático Activo' : 'Restablecer a Automático'}
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#065f46',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Grid de Escenarios */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.85rem',
        }}
      >
        {scenarios.map((sc) => {
          const isSelected = activeScenario === sc.scenario;
          return (
            <div
              key={sc.scenario}
              onClick={() => handleSelectScenario(sc.scenario)}
              style={{
                cursor: 'pointer',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: isSelected ? 'var(--card-bg)' : 'var(--glass-bg)',
                border: '1px solid',
                borderColor: isSelected ? 'var(--accent-blue)' : 'var(--glass-border)',
                boxShadow: isSelected ? '0 0 0 2px var(--accent-blue), var(--glass-shadow)' : 'var(--glass-shadow)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getScenarioIcon(sc.scenario)}
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{sc.name}</strong>
                </div>
                {isSelected && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '999px',
                      background: 'var(--accent-blue)',
                      color: '#ffffff',
                    }}
                  >
                    ACTIVO
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                {sc.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Panel Explicativo del Escenario Seleccionado */}
      {activeDetail && (
        <GlassCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <AlertTriangle size={18} style={{ color: 'var(--accent-blue)' }} />
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Comportamiento Físico Esperado: {activeDetail.name}
            </h4>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
              fontSize: '0.82rem',
            }}
          >
            <div
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(2, 132, 199, 0.08)',
                border: '1px solid rgba(2, 132, 199, 0.2)',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--accent-blue)', marginBottom: '0.25rem' }}>
                Respuesta Sensor PIR (Térmica)
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>{activeDetail.pir_behavior}</div>
            </div>

            <div
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <div style={{ fontWeight: 600, color: '#059669', marginBottom: '0.25rem' }}>
                Respuesta CSI Wi-Fi (Multitrayecto / RF)
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>{activeDetail.csi_behavior}</div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
