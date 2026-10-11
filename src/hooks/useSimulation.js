/**
 * useSimulation Hook
 *
 * Manages the high-frequency simulation loop, state synchronization with React,
 * rolling chart ring-buffer, and user control dispatchers.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationEngine } from '../simulation/simulationEngine.js';

export function useSimulation(maxHistoryPoints = 80) {
  const engineRef = useRef(null);
  if (!engineRef.current) {
    engineRef.current = new SimulationEngine();
  }

  const [simState, setSimState] = useState(() => engineRef.current.getState());
  const [history, setHistory] = useState([]);
  const [simSpeed, setSimSpeed] = useState(1.0); // 1.0x real time

  const lastTimeRef = useRef(performance.now());
  const chartThrottleTimerRef = useRef(0);
  const animFrameIdRef = useRef(null);

  // Simulation tick loop
  useEffect(() => {
    let isMounted = true;
    lastTimeRef.current = performance.now();

    const loop = (currentTime) => {
      if (!isMounted) return;

      const rawDt = (currentTime - lastTimeRef.current) / 1000.0;
      lastTimeRef.current = currentTime;

      // Bound delta-time to avoid leap forwards when pausing or switching tabs
      const dt = Math.min(rawDt, 0.05) * simSpeed;

      const engine = engineRef.current;
      const state = engine.step(dt);

      setSimState({ ...state });

      // Throttle graph history pushes to ~10 Hz (every 100ms) for ultra-fluid rendering
      chartThrottleTimerRef.current += dt;
      if (chartThrottleTimerRef.current >= 0.08) {
        chartThrottleTimerRef.current = 0;
        setHistory((prev) => {
          const point = {
            time: Number(state.simTime.toFixed(2)),
            targetRpm: Math.round(state.targetRpm),
            actualRpm: Math.round(state.actualRpm),
            measuredRpm: state.measuredRpm !== null ? Math.round(state.measuredRpm) : null,
            pwmDuty: Number(state.pwmDuty.toFixed(1)),
            current: Number(state.current.toFixed(2)),
            temperature: Number(state.temperature.toFixed(1)),
            loadTorque: Number(state.loadTorque.toFixed(2)),
          };
          const next = [...prev, point];
          if (next.length > maxHistoryPoints) {
            next.shift();
          }
          return next;
        });
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [simSpeed, maxHistoryPoints]);

  // Action dispatches
  const start = useCallback(() => {
    engineRef.current.start();
    setSimState({ ...engineRef.current.getState() });
  }, []);

  const stop = useCallback(() => {
    engineRef.current.stop();
    setSimState({ ...engineRef.current.getState() });
  }, []);

  const reset = useCallback(() => {
    engineRef.current.reset();
    setHistory([]);
    setSimState({ ...engineRef.current.getState() });
  }, []);

  const setTargetRpm = useCallback((rpm) => {
    engineRef.current.setTargetRpm(rpm);
    setSimState({ ...engineRef.current.getState() });
  }, []);

  const setLoadTorque = useCallback((torque) => {
    engineRef.current.setLoadTorque(torque);
    setSimState({ ...engineRef.current.getState() });
  }, []);

  const setSupplyVoltage = useCallback((v) => {
    engineRef.current.setSupplyVoltage(v);
    setSimState({ ...engineRef.current.getState() });
  }, []);

  const setPidGains = useCallback((kp, ki, kd) => {
    engineRef.current.pid.setGains(kp, ki, kd);
    setSimState({ ...engineRef.current.getState() });
  }, []);

  const toggleFault = useCallback((faultKey) => {
    engineRef.current.faults.toggleInjectedFault(faultKey);
    setSimState({ ...engineRef.current.getState() });
  }, []);

  const clearFaults = useCallback(() => {
    const res = engineRef.current.faults.clearFaults(
      engineRef.current.motor.current,
      engineRef.current.motor.temperature
    );
    setSimState({ ...engineRef.current.getState() });
    return res;
  }, []);

  const triggerStepLoad = useCallback((amount = 1.0, duration = 2.5) => {
    engineRef.current.triggerStepLoad(amount, duration);
    setSimState({ ...engineRef.current.getState() });
  }, []);

  return {
    simState,
    history,
    simSpeed,
    setSimSpeed,
    start,
    stop,
    reset,
    setTargetRpm,
    setLoadTorque,
    setSupplyVoltage,
    setPidGains,
    toggleFault,
    clearFaults,
    triggerStepLoad,
  };
}
