import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import type { PirReading, PirUsbRecord } from '../types/pirSerial';

export function usePirUsbHistory() {
  const [history, setHistory] = useState<PirUsbRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const mounted = useRef(false);
  const savePending = useRef(false);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    api.getPirUsbHistory()
      .then((records) => { if (!cancelled) setHistory(records); })
      .catch(() => { if (!cancelled) setError('No se pudo leer el historial. Iniciá el backend y pulsá Actualizar historial.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; mounted.current = false; };
  }, []);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await api.getPirUsbHistory();
      if (mounted.current) setHistory(records);
    } catch {
      if (mounted.current) setError('No se pudo leer el historial. Comprobá que el backend esté iniciado.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  const save = async (readings: PirReading[]) => {
    if (savePending.current || readings.length === 0) return;
    savePending.current = true;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const result = await api.savePirUsbReadings(readings);
      if (!mounted.current) return;
      setNotice(result.saved_count > 0
        ? `${result.saved_count} lecturas nuevas guardadas en la base de datos.`
        : 'Estas lecturas ya estaban guardadas.');
      await refresh();
    } catch {
      if (mounted.current) setError('No se confirmó el guardado. Comprobá el backend y reintentá; las lecturas repetidas no se duplican.');
    } finally {
      savePending.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  return { history, loading, saving, error, notice, refresh, save };
}
