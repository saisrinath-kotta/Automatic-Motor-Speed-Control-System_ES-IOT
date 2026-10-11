/**
 * GuidedSimulationPanel Component
 *
 * Dedicated interactive engineering lesson HUD:
 * - 10-step curriculum progress indicator
 * - Dynamic explanation synchronized with live physical values
 * - Active 3D component and signal path focus pills
 * - Navigation: Prev, Next, Play/Pause Auto-Advance, Restart, Close
 * - Camera tracking toggle
 */

import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
  Camera,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { GUIDED_STEPS } from '../simulation/guidedSimulation.js';

export function GuidedSimulationPanel({
  guided,
  simState,
  onClose,
}) {
  const {
    isGuidedActive,
    currentStepIndex,
    currentStep,
    totalSteps,
    isAutoPlay,
    setIsAutoPlay,
    autoCameraEnabled,
    setAutoCameraEnabled,
    stepElapsed,
    nextStep,
    prevStep,
    restartGuided,
    goToStep,
  } = guided;

  if (!isGuidedActive || !currentStep) return null;

  // Extract relevant live metrics for the current step
  const renderLiveValues = () => {
    switch (currentStep.id) {
      case 'TARGET_SPEED':
        return (
          <div className="guided-metrics-grid">
            <div className="metric-chip">
              <span className="metric-chip-label">Target Setpoint</span>
              <span className="metric-chip-value text-cyan-400">{Math.round(simState.targetRpm)} RPM</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">Actual Rotor</span>
              <span className="metric-chip-value text-emerald-400">{Math.round(simState.actualRpm)} RPM</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">Control Error</span>
              <span className="metric-chip-value text-amber-400">{Math.round(simState.speedError)} RPM</span>
            </div>
          </div>
        );

      case 'PWM_GENERATION':
        return (
          <div className="guided-metrics-grid">
            <div className="metric-chip">
              <span className="metric-chip-label">TIM1 PWM Duty</span>
              <span className="metric-chip-value text-cyan-400">{simState.pwmDuty.toFixed(1)}%</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">PWM Frequency</span>
              <span className="metric-chip-value text-slate-300">20.0 kHz</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">Signal Direction</span>
              <span className="metric-chip-value text-cyan-400">MCU &rarr; Driver</span>
            </div>
          </div>
        );

      case 'DRIVER_ACTIVATION':
        return (
          <div className="guided-metrics-grid">
            <div className="metric-chip">
              <span className="metric-chip-label">Supply Bus</span>
              <span className="metric-chip-value text-amber-400">{simState.voltage.toFixed(1)} V</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">Armature Current</span>
              <span className="metric-chip-value text-orange-400">{simState.current.toFixed(2)} A</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">Driver Status</span>
              <span className="metric-chip-value text-emerald-400">
                {simState.isRunning && !simState.faults.isLatched ? 'MOSFETs ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
        );

      case 'MOTOR_ACCELERATION':
        return (
          <div className="guided-metrics-grid">
            <div className="metric-chip">
              <span className="metric-chip-label">Actual Speed</span>
              <span className="metric-chip-value text-emerald-400">{Math.round(simState.actualRpm)} RPM</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">Armature Current</span>
              <span className="metric-chip-value text-orange-400">{simState.current.toFixed(2)} A</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">Motor Torque</span>
              <span className="metric-chip-value text-cyan-400">{(simState.motorTorque || 0).toFixed(3)} N·m</span>
            </div>
          </div>
        );

      case 'ENCODER_FEEDBACK':
        return (
          <div className="guided-metrics-grid">
            <div className="metric-chip">
              <span className="metric-chip-label">Encoder Resolution</span>
              <span className="metric-chip-value text-slate-300">1024 CPR (4096 QEI)</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">Pulse Frequency</span>
              <span className="metric-chip-value text-emerald-400">{Math.round(simState.encoderFreq || 0)} Hz</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">Feedback Status</span>
              <span className="metric-chip-value text-emerald-400">
                {simState.faults.isEncoderHealthy ? 'HEALTHY / STREAMING' : 'SIGNAL LOSS'}
              </span>
            </div>
          </div>
        );

      case 'PID_COMPARISON':
        return (
          <div className="guided-metrics-grid">
            <div className="metric-chip">
              <span className="metric-chip-label">Speed Error</span>
              <span className="metric-chip-value text-amber-400">{Math.round(simState.speedError)} RPM</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">P-Term</span>
              <span className="metric-chip-value text-slate-300">{simState.pid.pTerm.toFixed(1)}</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">I-Term</span>
              <span className="metric-chip-value text-slate-300">{simState.pid.iTerm.toFixed(1)}</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">PID Output</span>
              <span className="metric-chip-value text-cyan-400">{simState.pid.output.toFixed(1)}%</span>
            </div>
          </div>
        );

      case 'PWM_ADJUSTMENT':
        return (
          <div className="guided-metrics-grid">
            <div className="metric-chip">
              <span className="metric-chip-label">PWM Duty Cycle</span>
              <span className="metric-chip-value text-cyan-400">{simState.pwmDuty.toFixed(1)}%</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">Speed Error</span>
              <span className="metric-chip-value text-amber-400">{Math.round(simState.speedError)} RPM</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">Armature Current</span>
              <span className="metric-chip-value text-orange-400">{simState.current.toFixed(2)} A</span>
            </div>
          </div>
        );

      case 'SPEED_STABILIZES':
        return (
          <div className="guided-metrics-grid">
            <div className="metric-chip">
              <span className="metric-chip-label">Target / Actual</span>
              <span className="metric-chip-value text-emerald-400">
                {Math.round(simState.targetRpm)} / {Math.round(simState.actualRpm)} RPM
              </span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">Steady Error</span>
              <span className="metric-chip-value text-cyan-400">{Math.round(simState.speedError)} RPM</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">Mechanical Power</span>
              <span className="metric-chip-value text-amber-400">{(simState.powerMech || 0).toFixed(1)} W</span>
            </div>
          </div>
        );

      case 'LOAD_DISTURBANCE':
        return (
          <div className="guided-metrics-grid">
            <div className="metric-chip">
              <span className="metric-chip-label">Brake Load Torque</span>
              <span className="metric-chip-value text-red-400">{simState.loadTorque.toFixed(2)} N·m</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">Speed Droop</span>
              <span className="metric-chip-value text-amber-400">{Math.round(simState.speedError)} RPM</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">Current Demand</span>
              <span className="metric-chip-value text-orange-400">{simState.current.toFixed(2)} A</span>
            </div>
          </div>
        );

      case 'FAULT_DETECTION':
        return (
          <div className="guided-metrics-grid">
            <div className="metric-chip">
              <span className="metric-chip-label">Safety Status</span>
              <span className="metric-chip-value text-red-400">TRIP / SAFE SHUTDOWN</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">PWM Output</span>
              <span className="metric-chip-value text-slate-300">0.0% (INTERLOCKED)</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">CAN Alert</span>
              <span className="metric-chip-value text-purple-400">0x070 EMERGENCY TX</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="guided-panel-card">
      {/* Top Header */}
      <div className="guided-header">
        <div className="flex items-center gap-2">
          <div className="guided-badge">
            <Sparkles size={13} className="text-cyan-400" />
            <span>STEP {currentStep.step} OF {totalSteps}</span>
          </div>
          <h2 className="guided-title">{currentStep.title}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Active 3D Focus Component Pill */}
          {currentStep.focusComponent && (
            <div className="guided-focus-pill">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>3D Focus: {currentStep.focusComponent.toUpperCase()}</span>
            </div>
          )}

          {/* Close Panel Button */}
          <button
            onClick={onClose}
            className="guided-icon-btn text-slate-400 hover:text-slate-100"
            title="Exit Guided Demonstration"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 10-Step Progress Segments */}
      <div className="guided-progress-segments">
        {GUIDED_STEPS.map((stepItem, idx) => (
          <button
            key={stepItem.id}
            onClick={() => goToStep(idx)}
            className={`guided-segment-btn ${
              idx === currentStepIndex
                ? 'active'
                : idx < currentStepIndex
                ? 'completed'
                : 'pending'
            }`}
            title={`Step ${idx + 1}: ${stepItem.title}`}
          >
            <span className="segment-number">{idx + 1}</span>
          </button>
        ))}
      </div>

      {/* Main Lesson Explanation Body */}
      <div className="guided-body">
        <p className="guided-explanation-text">
          {currentStep.explanation}
        </p>

        {/* Live Synchronized Measurement Badges */}
        {renderLiveValues()}

        {/* Observation Hint */}
        {currentStep.nextHint && (
          <div className="guided-observation-hint">
            <span className="text-cyan-400 font-semibold">👀 Observe in 3D: </span>
            <span>{currentStep.nextHint}</span>
          </div>
        )}
      </div>

      {/* Footer Navigation & Controls */}
      <div className="guided-footer">
        <div className="flex items-center gap-2">
          {/* Prev Button */}
          <button
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            className="guided-nav-btn"
            title="Previous Step"
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          {/* Play / Pause Auto-advance */}
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`guided-nav-btn ${isAutoPlay ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300' : ''}`}
            title={isAutoPlay ? 'Pause Auto Progression' : 'Resume Auto Progression'}
          >
            {isAutoPlay ? (
              <>
                <Pause size={14} className="text-cyan-400" />
                <span>Auto-Advancing ({Math.max(0, 4 - Math.round(stepElapsed))}s)</span>
              </>
            ) : (
              <>
                <Play size={14} className="text-slate-300" />
                <span>Paused (Manual Mode)</span>
              </>
            )}
          </button>

          {/* Restart Button */}
          <button
            onClick={restartGuided}
            className="guided-icon-btn"
            title="Restart Demonstration from Step 1"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto Camera Toggle */}
          <button
            onClick={() => setAutoCameraEnabled(!autoCameraEnabled)}
            className={`guided-toggle-btn ${autoCameraEnabled ? 'active' : ''}`}
            title={autoCameraEnabled ? 'Auto-Camera transitions enabled' : 'Auto-Camera transitions disabled'}
          >
            <Camera size={13} />
            <span>Auto Camera: {autoCameraEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Next Button */}
          <button
            onClick={nextStep}
            disabled={currentStepIndex === totalSteps - 1}
            className="guided-nav-btn primary"
            title="Next Step"
          >
            <span>{currentStepIndex === totalSteps - 1 ? 'Finish' : 'Next Step'}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
