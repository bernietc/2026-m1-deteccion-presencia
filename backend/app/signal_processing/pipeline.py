"""Pipeline de procesamiento de señal modular para CSI."""

from typing import List, Dict, Any, Tuple
import numpy as np
from app.signal_processing.filters.hampel import HampelFilter
from app.signal_processing.filters.moving_average import MovingAverageFilter
from app.signal_processing.features.variance import VarianceFeatureExtractor
from app.signal_processing.features.amplitude import SignalEnergyExtractor
from app.schemas.telemetry import FilterMetadata, FeatureMetrics


class CsiSignalPipeline:
    """
    Pipeline que ejecuta la cadena de transformación:
    Raw Signal -> Hampel Outlier Removal -> Moving Average -> Feature Extraction -> Threshold Decision.
    Diseñado para ser extensible y permitir la sustitución por algoritmos de Machine Learning
    o descomposición Wavelet / PCA en etapas posteriores.
    """

    def __init__(
        self,
        hampel_window: int = 7,
        hampel_sigmas: float = 3.0,
        ma_window: int = 5,
        variance_threshold: float = 2.2,
    ):
        self.hampel = HampelFilter(window_size=hampel_window, n_sigmas=hampel_sigmas)
        self.moving_average = MovingAverageFilter(window_size=ma_window)
        self.variance_extractor = VarianceFeatureExtractor()
        self.energy_extractor = SignalEnergyExtractor()
        self.variance_threshold = variance_threshold

    def get_filter_metadata(self) -> FilterMetadata:
        """Devuelve los parámetros de los filtros aplicados para la UI."""
        return FilterMetadata(
            name="Hampel + Moving Average",
            window_size=self.hampel.window_size,
            threshold=self.hampel.n_sigmas,
            parameters={
                "hampel_window": self.hampel.window_size,
                "hampel_sigmas": f"{self.hampel.n_sigmas}σ",
                "moving_average_window": self.moving_average.window_size,
                "variance_threshold": self.variance_threshold,
            },
        )

    def process_window(self, raw_signal: List[float]) -> Tuple[List[float], FeatureMetrics, bool]:
        """
        Ejecuta el pipeline completo sobre una ventana de señal temporal.
        Retorna:
            - señal_filtrada (List[float])
            - métricas de características (FeatureMetrics)
            - presencia_detectada (bool)
        """
        if not raw_signal:
            default_features = FeatureMetrics(
                variance=0.0,
                energy=0.0,
                detection_score=0.0,
                threshold_applied=self.variance_threshold,
            )
            return [], default_features, False

        # Etapa 1: Filtro Hampel contra ruidos impulsivos
        hampel_cleaned = self.hampel.apply(raw_signal)

        # Etapa 2: Suavizado por media móvil
        filtered_signal = self.moving_average.apply(hampel_cleaned)

        # Etapa 3: Extracción de características
        # Calculamos varianza sobre los últimos puntos de la ventana filtrada
        window_for_features = filtered_signal[-20:] if len(filtered_signal) >= 20 else filtered_signal
        variance = self.variance_extractor.extract(window_for_features)
        energy = self.energy_extractor.extract(window_for_features)

        # Etapa 4: Función de Score de Detección (Sigmoide normalizada en torno al umbral)
        k = 1.2
        diff = variance - self.variance_threshold
        detection_score = float(1.0 / (1.0 + np.exp(-k * np.clip(diff, -10.0, 10.0))))

        # Etapa 5: Discriminación de Objetos vs. Personas (Firma frecuencial y temporal)
        periodicity_ratio, target_type = self._classify_target(window_for_features, variance)

        # Decisión binaria de presencia (se activa tanto por persona como por perturbación significativa)
        presence_detected = bool(variance >= self.variance_threshold or detection_score >= 0.5)

        features = FeatureMetrics(
            variance=round(variance, 4),
            energy=round(energy, 4),
            detection_score=round(detection_score, 4),
            threshold_applied=self.variance_threshold,
            periodicity_ratio=round(periodicity_ratio, 4),
            target_type=target_type,
        )

        return filtered_signal, features, presence_detected

    def _classify_target(self, signal_window: List[float], variance: float) -> Tuple[float, str]:
        """
        Distingue objetos inanimados de personas según la física de la perturbación:
        - 'empty': Ruido base de canal sin perturbaciones.
        - 'object_fan': Perturbación armónica estricta con pico espectral dominante (ventilador).
        - 'object_moved': Desplazamiento brusco estático de un objeto/mueble (escalón DC).
        - 'person_active': Persona caminando con dispersión multicamino aperiódica.
        - 'person_static': Persona en reposo/sentada con micro-movimiento respiratorio.
        """
        if len(signal_window) < 8 or variance < 0.25:
            return 0.0, "empty"

        arr = np.array(signal_window, dtype=float)
        detrended = arr - np.mean(arr)

        # Análisis espectral de la componente AC
        fft_vals = np.abs(np.fft.rfft(detrended))
        ac_fft = fft_vals[1:] if len(fft_vals) > 1 else np.array([0.0])
        total_power = float(np.sum(ac_fft**2))

        if total_power > 1e-6:
            max_power = float(np.max(ac_fft**2))
            periodicity_ratio = float(max_power / total_power)
        else:
            periodicity_ratio = 0.0

        # Regla 1: Objeto periódico (Ventilador) -> pico armónico único dominante
        if periodicity_ratio >= 0.40 and variance >= self.variance_threshold * 0.5:
            target_type = "object_fan"
        # Regla 2: Objeto desplazado (Mueble movido) -> salto escalón de continua
        elif len(signal_window) >= 14 and abs(float(np.mean(arr[len(arr)//2:])) - float(np.mean(arr[:len(arr)//2]))) > 2.5 and float(np.var(arr[len(arr)//2:])) < 0.9:
            target_type = "object_moved"
        # Regla 3: Persona activa -> alta varianza aperiódica
        elif variance >= self.variance_threshold:
            target_type = "person_active"
        # Regla 4: Persona quieta / reposo -> varianza moderada con componente respiratoria
        elif variance >= 0.35:
            target_type = "person_static"
        else:
            target_type = "empty"

        return periodicity_ratio, target_type
