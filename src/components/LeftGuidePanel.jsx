/**
 * LeftGuidePanel Component
 *
 * Dedicated Left-Column Panel (~23% width):
 * - Guided Simulation Curriculum (Step 1 to 10)
 * - Current Step Title, Number, and Short Beginner-Friendly Explanation
 * - Compact Step Progress Indicators (1-10)
 * - Navigation Controls: Prev, Next, Play/Pause Auto-Advance, Restart, Auto-Camera Toggle
 * - Live Step Readings & Observation Hints
 * - Expandable Detailed Engineering Notes
 * - Integrated Manual Laboratory Controls (Start/Stop, Speed slider, Load, Faults)
 * - Glassmorphic translucent styling
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Camera,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sliders,
  Gauge,
  Zap,
  Weight,
  AlertOctagon,
  ShieldAlert,
  Square,
  CheckCircle2,
} from 'lucide-react';
import { GUIDED_STEPS } from '../simulation/guidedSimulation.js';
import { formatRpm, formatCurrent, formatDuty, formatTorque } from '../utils/formatters.js';

export function LeftGuidePanel({
  guided,
  simState,
  onStart,
  onStop,
  onReset,
  onSetTargetRpm,
  onSetLoadTorque,
  onSetSupplyVoltage,
  onSetPidGains,
  onToggleFault,
  onClearFaults,
  onTriggerStepLoad,
  isCollapsed = false,
  onToggleCollapse,
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
    startGuided,
    restartGuided,
    nextStep,
    prevStep,
    goToStep,
  } = guided;

  const [isTheoryExpanded, setIsTheoryExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('guided'); // 'guided' | 'controls'
  const [faultClearMsg, setFaultClearMsg] = useState(null);

  const { isRunning, targetRpm, actualRpm, speedError, loadTorque, faults } = simState;

  const handleClearFaults = () => {
    const res = onClearFaults();
    if (!res.success) {
      setFaultClearMsg(res.reason);
      setTimeout(() => setFaultClearMsg(null), 3000);
    } else {
      setFaultClearMsg(null);
    }
  };

  // Render step-specific live measurements
  const renderStepMetrics = () => {
    if (!currentStep) return null;
    switch (currentStep.id) {
      case 'TARGET_SPEED':
        return (
          <div className="guide-metrics-mini-grid">
            <div className="mini-metric-pill">
              <span className="label">Target SP</span>
              <span className="val text-cyan-300">{Math.round(simState.targetRpm)} RPM</span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">Actual PV</span>
              <span className="val text-emerald-300">{Math.round(simState.actualRpm)} RPM</span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">Error</span>
              <span className="val text-amber-300">{Math.round(simState.speedError)} RPM</span>
            </div>
          </div>
        );

      case 'PWM_GENERATION':
        return (
          <div className="guide-metrics-mini-grid">
            <div className="mini-metric-pill">
              <span className="label">PWM Duty</span>
              <span className="val text-cyan-300">{simState.pwmDuty.toFixed(1)}%</span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">Frequency</span>
              <span className="val text-slate-300">20.0 kHz</span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">Path</span>
              <span className="val text-cyan-300">MCU &rarr; Driver</span>
            </div>
          </div>
        );

      case 'DRIVER_ACTIVATION':
        return (
          <div className="guide-metrics-mini-grid">
            <div className="mini-metric-pill">
              <span className="label">Bus Voltage</span>
              <span className="val text-amber-300">{simState.voltage.toFixed(1)} V</span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">Current</span>
              <span className="val text-orange-300">{simState.current.toFixed(2)} A</span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">Driver</span>
              <span className="val text-emerald-300">
                {simState.isRunning && !simState.faults.isLatched ? 'MOSFETs ON' : 'OFF'}
              </span>
            </div>
          </div>
        );

      case 'MOTOR_ACCELERATION':
        return (
          <div className="guide-metrics-mini-grid">
            <div className="mini-metric-pill">
              <span className="label">Speed</span>
              <span className="val text-emerald-300">{Math.round(simState.actualRpm)} RPM</span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">Current</span>
              <span className="val text-orange-300">{simState.current.toFixed(2)} A</span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">Torque</span>
              <span className="val text-cyan-300">{(simState.motorTorque || 0).toFixed(3)} N·m</span>
            </div>
          </div>
        );

      case 'ENCODER_FEEDBACK':
        return (
          <div className="guide-metrics-mini-grid">
            <div className="mini-metric-pill">
              <span className="label">Resolution</span>
              <span className="val text-slate-300">1024 CPR</span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">Pulse Rate</span>
              <span className="val text-emerald-300">{Math.round(simState.encoderFreq || 0)} Hz</span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">Feedback</span>
              <span className="val text-emerald-300">
                {simState.faults.isEncoderHealthy ? 'STREAMING' : 'LOST'}
              </span>
            </div>
          </div>
        );

      case 'PID_COMPARISON':
        return (
          <div className="guide-metrics-mini-grid">
            <div className="mini-metric-pill">
              <span className="label">Error</span>
              <span className="val text-amber-300">{Math.round(simState.speedError)} RPM</span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">P / I / D</span>
              <span className="val text-slate-300">
                {simState.pid.pTerm.toFixed(1)} / {simState.pid.iTerm.toFixed(1)}
              </span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">PID Output</span>
              <span className="val text-cyan-300">{simState.pid.output.toFixed(1)}%</span>
            </div>
          </div>
        );

      case 'PWM_ADJUSTMENT':
        return (
          <div className="guide-metrics-mini-grid">
            <div className="mini-metric-pill">
              <span className="label">PWM Duty</span>
              <span className="val text-cyan-300">{simState.pwmDuty.toFixed(1)}%</span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">Speed Error</span>
              <span className="val text-amber-300">{Math.round(simState.speedError)} RPM</span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">Current</span>
              <span className="val text-orange-300">{simState.current.toFixed(2)} A</span>
            </div>
          </div>
        );

      case 'SPEED_STABILIZES':
        return (
          <div className="guide-metrics-mini-grid">
            <div className="mini-metric-pill">
              <span className="label">SP / PV</span>
              <span className="val text-emerald-300">
                {Math.round(simState.targetRpm)} / {Math.round(simState.actualRpm)}
              </span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">Steady Error</span>
              <span className="val text-cyan-300">{Math.round(simState.speedError)} RPM</span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">Power</span>
              <span className="val text-amber-300">{(simState.powerMech || 0).toFixed(1)} W</span>
            </div>
          </div>
        );

      case 'LOAD_DISTURBANCE':
        return (
          <div className="guide-metrics-mini-grid">
            <div className="mini-metric-pill">
              <span className="label">Load Torque</span>
              <span className="val text-red-300">{simState.loadTorque.toFixed(2)} N·m</span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">Speed Droop</span>
              <span className="val text-amber-300">{Math.round(simState.speedError)} RPM</span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">Compensating</span>
              <span className="val text-orange-300">{simState.current.toFixed(2)} A</span>
            </div>
          </div>
        );

      case 'FAULT_DETECTION':
        return (
          <div className="guide-metrics-mini-grid">
            <div className="mini-metric-pill">
              <span className="label">Interlock</span>
              <span className="val text-red-400">TRIP LATCHED</span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">PWM</span>
              <span className="val text-slate-400">0.0% (DISABLED)</span>
            </div>
            <div className="mini-metric-pill">
              <span className="label">CAN Alert</span>
              <span className="val text-purple-300">0x070 TX</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <aside className="left-guide-column">
      {/* Top Header */}
      <div className="guide-column-header">
        <div className="flex items-center gap-2">
          <div className="guide-icon-badge">
            <Sparkles size={14} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="guide-column-title">Guided Simulation</h2>
            <p className="guide-column-subtitle">10-Step Embedded Control Curriculum</p>
          </div>
        </div>

        {/* Tab switch between Guided Lesson & Manual Hardware Controls */}
        <div className="guide-tab-toggle">
          <button
            onClick={() => setActiveTab('guided')}
            className={`tab-toggle-btn ${activeTab === 'guided' ? 'active' : ''}`}
            title="Guided Simulation Tour"
          >
            Lesson
          </button>
          <button
            onClick={() => setActiveTab('controls')}
            className={`tab-toggle-btn ${activeTab === 'controls' ? 'active' : ''}`}
            title="Manual Hardware Controls"
          >
            Controls
          </button>
        </div>
      </div>

      <div className="guide-column-body">
        {/* ============================================================ */}
        {/* VIEW 1: GUIDED SIMULATION CURRICULUM                         */}
        {/* ============================================================ */}
        {activeTab === 'guided' && (
          <div className="guide-lesson-content">
            {/* Step Progress Pills (1 to 10) */}
            <div className="guide-progress-row">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-cyan-300 tracking-wider uppercase">
                  Step {currentStep.step} of {totalSteps}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}% Complete
                </span>
              </div>
              <div className="progress-pills-container">
                {GUIDED_STEPS.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => goToStep(idx)}
                    className={`step-pill-btn ${
                      idx === currentStepIndex
                        ? 'active'
                        : idx < currentStepIndex
                        ? 'completed'
                        : 'pending'
                    }`}
                    title={`Step ${idx + 1}: ${s.title}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Step Card */}
            <div className="guide-step-card">
              <div className="step-card-header">
                <div className="step-title-wrap">
                  <span className="step-tag-pill">Stage {currentStep.step}</span>
                  <h3 className="step-card-title">{currentStep.title.replace(/^Step \d+ — /, '')}</h3>
                </div>
                {currentStep.focusComponent && (
                  <span className="step-focus-badge">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    {currentStep.focusComponent.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Short Beginner-Friendly Explanation */}
              <p className="step-explanation-text">
                {currentStep.explanation}
              </p>

              {/* Live Synchronized Readings */}
              {renderStepMetrics()}

              {/* 3D Observation Hint */}
              {currentStep.nextHint && (
                <div className="step-hint-box">
                  <span className="text-cyan-400 font-semibold text-[11px]">👀 Look at 3D Scene: </span>
                  <span className="text-slate-300 text-[11px]">{currentStep.nextHint}</span>
                </div>
              )}

              {/* Expandable Detailed Engineering Notes */}
              <div className="step-theory-accordion">
                <button
                  onClick={() => setIsTheoryExpanded(!isTheoryExpanded)}
                  className="theory-accordion-toggle"
                >
                  <BookOpen size={12} className="text-cyan-400" />
                  <span>Technical Engineering Notes</span>
                  {isTheoryExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {isTheoryExpanded && (
                  <div className="theory-accordion-body">
                    <div className="theory-item">
                      <span className="theory-label">STM32 Peripheral:</span>
                      <span className="theory-val font-mono">
                        {currentStep.step === 2 || currentStep.step === 7
                          ? 'TIM1_CH1 Advanced 16-bit PWM (20 kHz, Center-Aligned)'
                          : currentStep.step === 5
                          ? 'TIM2 32-bit Quadrature Encoder Interface (QEI)'
                          : currentStep.step === 6
                          ? 'ARM Cortex-M7 FPU 100 Hz SysTick PID Task'
                          : currentStep.step === 10
                          ? 'FDCAN1 Telemetry Engine & Hardware Comparator Interlock'
                          : 'Cortex-M7 Closed-Loop System'}
                      </span>
                    </div>
                    <div className="theory-item">
                      <span className="theory-label">Physical Principle:</span>
                      <span className="theory-val font-mono">
                        {currentStep.step === 4
                          ? 'J·(dω/dt) = Kt·I - B·ω - T_load'
                          : currentStep.step === 6
                          ? 'u(t) = Kp·e(t) + Ki·∫e dt + Kd·(de/dt)'
                          : currentStep.step === 3
                          ? 'V_avg = V_bus × (Duty / 100)'
                          : 'Closed-loop negative feedback regulation'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation & Auto-Advance Controls */}
            <div className="guide-nav-controls">
              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                  className="guide-ctrl-btn flex-1"
                  title="Previous Step"
                >
                  <ChevronLeft size={15} />
                  <span>Prev</span>
                </button>

                <button
                  onClick={() => setIsAutoPlay(!isAutoPlay)}
                  className={`guide-ctrl-btn flex-1 ${isAutoPlay ? 'active-autoplay' : ''}`}
                  title={isAutoPlay ? 'Pause Auto Progression' : 'Resume Auto Progression'}
                >
                  {isAutoPlay ? (
                    <>
                      <Pause size={13} className="text-cyan-400" />
                      <span>Auto ({Math.max(0, 4 - Math.round(stepElapsed))}s)</span>
                    </>
                  ) : (
                    <>
                      <Play size={13} className="text-slate-300" />
                      <span>Resume</span>
                    </>
                  )}
                </button>

                <button
                  onClick={nextStep}
                  disabled={currentStepIndex === totalSteps - 1}
                  className="guide-ctrl-btn primary flex-1"
                  title="Next Step"
                >
                  <span>{currentStepIndex === totalSteps - 1 ? 'End' : 'Next'}</span>
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* Utility Row (Restart & Auto-Camera) */}
              <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-slate-700/40">
                <button
                  onClick={restartGuided}
                  className="guide-link-btn"
                  title="Restart Demonstration from Step 1"
                >
                  <RotateCcw size={12} />
                  <span>Restart Tour</span>
                </button>

                <button
                  onClick={() => setAutoCameraEnabled(!autoCameraEnabled)}
                  className={`guide-link-btn ${autoCameraEnabled ? 'text-cyan-400' : 'text-slate-500'}`}
                  title="Toggle automatic camera framing"
                >
                  <Camera size={12} />
                  <span>Auto Cam: {autoCameraEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: MANUAL HARDWARE & DRIVE CONTROLS                     */}
        {/* ============================================================ */}
        {activeTab === 'controls' && (
          <div className="guide-manual-controls">
            {/* Primary Start / Stop Drive */}
            <div className="manual-section">
              <span className="section-label">Motor Drive Command</span>
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  onClick={onStart}
                  disabled={isRunning || faults.isLatched}
                  className="btn-drive btn-start flex-1"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Start Drive</span>
                </button>
                <button
                  onClick={onStop}
                  disabled={!isRunning}
                  className="btn-drive btn-stop flex-1"
                >
                  <Square size={14} fill="currentColor" />
                  <span>Stop</span>
                </button>
                <button
                  onClick={onReset}
                  className="btn-drive btn-reset"
                  title="Reset Simulation State"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              {faults.isLatched && (
                <div className="trip-banner mt-2">
                  <ShieldAlert size={14} className="text-red-400" />
                  <div className="flex-1">
                    <span className="font-semibold text-[11px] text-red-300 block">TRIP LATCHED</span>
                    <span className="text-[10px] text-red-200/70 block">{faults.tripReason}</span>
                  </div>
                  <button onClick={handleClearFaults} className="trip-clear-btn">
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Target Speed Setpoint Slider */}
            <div className="manual-section mt-3">
              <div className="flex items-center justify-between">
                <span className="section-label">Target Speed (SP)</span>
                <span className="font-mono text-xs text-cyan-300 font-bold">
                  {formatRpm(targetRpm)} RPM
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="3200"
                step="50"
                value={targetRpm}
                onChange={(e) => onSetTargetRpm(Number(e.target.value))}
                className="range-slider mt-2"
              />
              <div className="speed-preset-grid mt-2">
                {[0, 750, 1500, 2400, 3000].map((rpm) => (
                  <button
                    key={rpm}
                    onClick={() => onSetTargetRpm(rpm)}
                    className={`preset-pill ${targetRpm === rpm ? 'active' : ''}`}
                  >
                    {rpm}
                  </button>
                ))}
              </div>
            </div>

            {/* Mechanical Load Disturbance */}
            <div className="manual-section mt-3">
              <div className="flex items-center justify-between">
                <span className="section-label">Mechanical Brake Load</span>
                <span className="font-mono text-xs text-amber-300 font-bold">
                  {formatTorque(loadTorque)} N·m
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.5"
                step="0.05"
                value={loadTorque}
                onChange={(e) => onSetLoadTorque(Number(e.target.value))}
                className="range-slider mt-2"
              />
              <button
                onClick={() => onTriggerStepLoad(0.45, 3.0)}
                className="step-shock-btn mt-2"
              >
                <Weight size={13} />
                <span>+0.45 N·m Step Load Shock</span>
              </button>
            </div>

            {/* Protective Fault Injections */}
            <div className="manual-section mt-3">
              <span className="section-label">Fault Injection Interlocks</span>
              <div className="fault-toggle-list mt-2">
                <label className="fault-toggle-row">
                  <span className="text-[11px] text-slate-300">Optical Encoder Loss</span>
                  <input
                    type="checkbox"
                    checked={faults.injected.encoderLoss}
                    onChange={() => onToggleFault('encoderLoss')}
                    className="fault-checkbox"
                  />
                </label>
                <label className="fault-toggle-row">
                  <span className="text-[11px] text-slate-300">Overcurrent Spike (12A)</span>
                  <input
                    type="checkbox"
                    checked={faults.injected.overcurrent}
                    onChange={() => onToggleFault('overcurrent')}
                    className="fault-checkbox"
                  />
                </label>
                <label className="fault-toggle-row">
                  <span className="text-[11px] text-slate-300">CAN / FDCAN Bus-Off</span>
                  <input
                    type="checkbox"
                    checked={faults.injected.canFailure}
                    onChange={() => onToggleFault('canFailure')}
                    className="fault-checkbox"
                  />
                </label>
              </div>

              {faults.active.length > 0 && (
                <button onClick={handleClearFaults} className="clear-faults-btn mt-2">
                  Reset & Clear All Faults
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
