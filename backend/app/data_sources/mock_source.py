"""Generador de datos sintéticos realistas para modo MOCK."""

import asyncio
import random
import time
from typing import Callable, Awaitable, Any, Optional
import numpy as np
from app.data_sources.base import DataSource
from app.core.constants import CaseId
from app.schemas.telemetry import TelemetrySample, CsiRawSample
from app.core.logging import logger


class MockDataSource(DataSource):
    """
    Simulador de señales físicas para validación de arquitectura sin hardware:
    - PIR: Señal digital binaria (0/1) con duraciones probabilísticas de presencia.
    - CSI Router: Amplitud de subportadoras con ruido térmico, perturbación multicamino
      y outliers impulsivos para demostrar la eficacia del filtro Hampel.
    - CSI Dedicado: Enlace AP-STA directo con menor ruido de fondo y mayor contraste ante eventos.
    """

    def __init__(self, sampling_rate_hz: float = 10.0):
        self.sampling_interval = 1.0 / sampling_rate_hz
        self._running = False
        self._paused = False
        self._task: Optional[asyncio.Task] = None
        self._handler: Optional[Callable[[str, Any], Awaitable[None]]] = None

        # Estados de presencia sintética para cada caso (simulan eventos físicos)
        self._pir_presence = False
        self._pir_timer = 0
        self._router_presence = False
        self._router_timer = 0
        self._dedicated_presence = False
        self._dedicated_timer = 0

        # Escenario forzado para experimentación de objetos vs. personas
        self._forced_scenario: Optional[str] = None

        # Parámetros temporales de la señal CSI
        self._time_step = 0.0

    def set_scenario(self, scenario: Optional[str]):
        """Establece un escenario de prueba específico o None para simulación automática."""
        self._forced_scenario = scenario
        logger.info(f"MockDataSource: escenario forzado establecido en '{scenario}'")

    @property
    def current_scenario(self) -> Optional[str]:
        return self._forced_scenario

    def pause(self):
        self._paused = True
        logger.info("MockDataSource: simulación pausada.")

    def resume(self):
        self._paused = False
        logger.info("MockDataSource: simulación reanudada.")

    @property
    def is_paused(self) -> bool:
        return self._paused

    def set_sample_handler(self, handler: Callable[[str, Any], Awaitable[None]]):
        self._handler = handler

    async def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._simulation_loop())
        logger.info("MockDataSource iniciado: generando telemetría sintética en tiempo real.")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("MockDataSource detenido.")

    async def _simulation_loop(self):
        while self._running:
            if self._paused:
                await asyncio.sleep(0.2)
                continue

            try:
                now_ts = time.time()
                self._time_step += self.sampling_interval

                # 1. Simulación PIR
                self._update_pir_state()
                pir_sample = TelemetrySample(
                    case_id=CaseId.PIR,
                    source="mock_pir_esp32",
                    presence=self._pir_presence,
                    raw_value=1.0 if self._pir_presence else 0.0,
                    latency_ms=round(random.uniform(135.0, 165.0), 1),
                    ground_truth=self._pir_presence,
                )
                if self._handler:
                    await self._handler(CaseId.PIR.value, pir_sample)

                # 2. Simulación CSI Router
                self._update_router_state()
                router_raw_val = self._generate_csi_amplitude(
                    base_amplitude=22.0,
                    noise_std=0.7,
                    is_presence=self._router_presence,
                    movement_gain=3.8,
                )
                # Inyectar ocasionalmente outlier impulsivo para lucir el filtro Hampel
                if random.random() < 0.05:
                    router_raw_val += random.choice([-8.0, 8.0])

                router_sample = CsiRawSample(
                    case_id=CaseId.CSI_ROUTER,
                    source="mock_router_esp32",
                    amplitudes=[router_raw_val],
                    latency_ms=round(random.uniform(305.0, 335.0), 1),
                    ground_truth=self._router_presence,
                )
                if self._handler:
                    await self._handler(CaseId.CSI_ROUTER.value, router_sample)

                # 3. Simulación CSI Red Dedicada (AP + STA)
                self._update_dedicated_state()
                dedicated_raw_val = self._generate_csi_amplitude(
                    base_amplitude=35.0,
                    noise_std=0.4,
                    is_presence=self._dedicated_presence,
                    movement_gain=4.5,
                )
                if random.random() < 0.04:
                    dedicated_raw_val += random.choice([-9.0, 9.0])

                dedicated_sample = CsiRawSample(
                    case_id=CaseId.CSI_DEDICATED,
                    source="mock_dedicated_ap_sta",
                    amplitudes=[dedicated_raw_val],
                    latency_ms=round(random.uniform(385.0, 420.0), 1),
                    ground_truth=self._dedicated_presence,
                )
                if self._handler:
                    await self._handler(CaseId.CSI_DEDICATED.value, dedicated_sample)

                await asyncio.sleep(self.sampling_interval)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error en bucle de simulación mock: {e}")
                await asyncio.sleep(1.0)

    def _update_pir_state(self):
        if self._forced_scenario:
            if self._forced_scenario == "human_active":
                self._pir_presence = True
            else:
                # El PIR NO detecta ventiladores, muebles movidos ni personas inmóviles
                self._pir_presence = False
            return

        self._pir_timer -= 1
        if self._pir_timer <= 0:
            self._pir_presence = not self._pir_presence
            duration_sec = random.uniform(4.0, 7.0) if self._pir_presence else random.uniform(6.0, 12.0)
            self._pir_timer = int(duration_sec / self.sampling_interval)

    def _update_router_state(self):
        if self._forced_scenario:
            if self._forced_scenario in ("human_active", "human_static", "object_fan"):
                self._router_presence = True
            elif self._forced_scenario == "object_moved":
                self._router_presence = True
            else:
                self._router_presence = False
            return

        self._router_timer -= 1
        if self._router_timer <= 0:
            self._router_presence = not self._router_presence
            duration_sec = random.uniform(5.0, 9.0) if self._router_presence else random.uniform(5.0, 10.0)
            self._router_timer = int(duration_sec / self.sampling_interval)

    def _update_dedicated_state(self):
        if self._forced_scenario:
            if self._forced_scenario in ("human_active", "human_static", "object_fan"):
                self._dedicated_presence = True
            elif self._forced_scenario == "object_moved":
                self._dedicated_presence = True
            else:
                self._dedicated_presence = False
            return

        self._dedicated_timer -= 1
        if self._dedicated_timer <= 0:
            self._dedicated_presence = not self._dedicated_presence
            duration_sec = random.uniform(6.0, 10.0) if self._dedicated_presence else random.uniform(4.0, 8.0)
            self._dedicated_timer = int(duration_sec / self.sampling_interval)

    def _generate_csi_amplitude(
        self, base_amplitude: float, noise_std: float, is_presence: bool, movement_gain: float
    ) -> float:
        """
        Modela la perturbación multicamino según la física del escenario:
        - Objeto Ventilador: Armónico único puro a 4.0 Hz (alta periodicidad).
        - Objeto Mueble: Escalón estático permanente de continua (+4.5) con mínima varianza.
        - Persona Estática: Micro-Doppler respiratorio a 0.25 Hz.
        - Persona Activa: Modulaciones Doppler caóticas multicamino y absorción.
        - Vacío: Ruido gaussiano blanco puro.
        """
        if self._forced_scenario == "object_fan":
            # Firma espectral de ventilador: oscilación armónica periódica pura
            periodic_osc = np.sin(2.0 * np.pi * 4.0 * self._time_step) * (movement_gain * 0.95)
            val = base_amplitude + periodic_osc + np.random.normal(0, 0.15)
            return round(float(val), 3)

        if self._forced_scenario == "object_moved":
            # Firma de mueble desplazado: desplazamiento estático permanente (escalón)
            step_offset = 4.8 if self._time_step % 20 > 5 else 0.0
            val = base_amplitude + step_offset + np.random.normal(0, 0.2)
            return round(float(val), 3)

        if self._forced_scenario == "human_static":
            # Micro-movimiento torácico respiratorio (0.25 Hz)
            breathing = np.sin(2.0 * np.pi * 0.25 * self._time_step) * 1.5
            val = base_amplitude + breathing + np.random.normal(0, 0.3)
            return round(float(val), 3)

        if self._forced_scenario == "empty_room":
            # Ambiente sin presencia: únicamente ruido térmico gaussiano
            val = base_amplitude + np.random.normal(0, noise_std * 0.6)
            return round(float(val), 3)

        # Ruido de fondo gaussiano normal
        noise = float(np.random.normal(0, noise_std))
        val = base_amplitude + noise

        if is_presence:
            # Persona activa caminando: dispersión multicamino aperiódica
            doppler = (
                np.sin(2.0 * np.pi * 0.3 * self._time_step) * 0.6
                + np.sin(2.0 * np.pi * 0.8 * self._time_step) * 0.4
            )
            motion_noise = float(np.random.normal(0, movement_gain * 0.6))
            val += (doppler * movement_gain) + motion_noise

        return round(float(val), 3)
