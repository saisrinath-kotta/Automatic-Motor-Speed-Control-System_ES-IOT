/**
 * useGuidedSimulation Hook
 *
 * Coordinates the 10-step guided simulation curriculum:
 * - Deterministic step progression coupled to real simulation physics
 * - Step-by-step navigation (Next, Prev, Restart, Pause, Resume)
 * - Auto-progression mode with condition evaluation
 * - Non-destructive execution ensuring motor model integrity
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { GUIDED_STEPS } from '../simulation/guidedSimulation.js';

export function useGuidedSimulation({
  simState,
  start,
  stop,
  setTargetRpm,
  triggerStepLoad,
  toggleFault,
  clearFaults,
}) {
  const [isGuidedActive, setIsGuidedActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [autoCameraEnabled, setAutoCameraEnabled] = useState(true);
  const [stepElapsed, setStepElapsed] = useState(0);

  const stepElapsedRef = useRef(0);
  const currentStep = GUIDED_STEPS[currentStepIndex];

  // Execute step setup action
  const executeStepSetup = useCallback(
    (stepDef) => {
      if (!stepDef) return;
      switch (stepDef.setupAction) {
        case 'SET_TARGET_1500':
          setTargetRpm(1500);
          break;
        case 'START_DRIVE':
          start();
          setTargetRpm(1500);
          break;
        case 'APPLY_STEP_LOAD':
          triggerStepLoad(0.45, 3.5);
          break;
        case 'INJECT_ENCODER_FAULT':
          if (simState.faults.isEncoderHealthy) {
            toggleFault('encoderLoss');
          }
          break;
        default:
          break;
      }
    },
    [setTargetRpm, start, triggerStepLoad, toggleFault, simState.faults.isEncoderHealthy]
  );

  // Start guided simulation
  const startGuided = useCallback(() => {
    setIsGuidedActive(true);
    setCurrentStepIndex(0);
    setIsAutoPlay(true);
    setStepElapsed(0);
    stepElapsedRef.current = 0;
    clearFaults();
    executeStepSetup(GUIDED_STEPS[0]);
  }, [clearFaults, executeStepSetup]);

  // Stop guided simulation
  const stopGuided = useCallback(() => {
    setIsGuidedActive(false);
  }, []);

  // Restart
  const restartGuided = useCallback(() => {
    setCurrentStepIndex(0);
    setStepElapsed(0);
    stepElapsedRef.current = 0;
    setIsAutoPlay(true);
    clearFaults();
    executeStepSetup(GUIDED_STEPS[0]);
  }, [clearFaults, executeStepSetup]);

  // Next step
  const nextStep = useCallback(() => {
    if (currentStepIndex < GUIDED_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      setStepElapsed(0);
      stepElapsedRef.current = 0;
      executeStepSetup(GUIDED_STEPS[nextIdx]);
    }
  }, [currentStepIndex, executeStepSetup]);

  // Previous step
  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      setStepElapsed(0);
      stepElapsedRef.current = 0;
      // If we go back from fault step, clear faults
      if (currentStepIndex === 9) {
        clearFaults();
      }
      executeStepSetup(GUIDED_STEPS[prevIdx]);
    }
  }, [currentStepIndex, clearFaults, executeStepSetup]);

  // Go to arbitrary step
  const goToStep = useCallback(
    (index) => {
      const idx = Math.max(0, Math.min(GUIDED_STEPS.length - 1, index));
      setCurrentStepIndex(idx);
      setStepElapsed(0);
      stepElapsedRef.current = 0;
      if (idx !== 9 && !simState.faults.isEncoderHealthy) {
        clearFaults();
      }
      executeStepSetup(GUIDED_STEPS[idx]);
    },
    [clearFaults, executeStepSetup, simState.faults.isEncoderHealthy]
  );

  // Auto-progression ticker
  useEffect(() => {
    if (!isGuidedActive) return;

    const interval = setInterval(() => {
      stepElapsedRef.current += 0.2;
      setStepElapsed(stepElapsedRef.current);

      if (isAutoPlay && currentStep && currentStep.autoAdvanceCondition) {
        const canAdvance = currentStep.autoAdvanceCondition(simState, stepElapsedRef.current);
        if (canAdvance) {
          if (currentStepIndex < GUIDED_STEPS.length - 1) {
            nextStep();
          }
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isGuidedActive, isAutoPlay, currentStep, currentStepIndex, simState, nextStep]);

  return {
    isGuidedActive,
    currentStepIndex,
    currentStep,
    totalSteps: GUIDED_STEPS.length,
    isAutoPlay,
    setIsAutoPlay,
    autoCameraEnabled,
    setAutoCameraEnabled,
    stepElapsed,
    startGuided,
    stopGuided,
    restartGuided,
    nextStep,
    prevStep,
    goToStep,
  };
}
