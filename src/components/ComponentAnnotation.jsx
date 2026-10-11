/**
 * ComponentAnnotation Component
 *
 * Compact, non-intrusive annotation positioned near the active component in the 3D scene:
 * - Shows concise step title, short explanation, signal direction, and live metrics
 * - Smooth transition between steps
 * - Does not occlude 3D motor, driver, or controller
 * - Expandable "More Info" drawer for in-depth engineering details
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
  ArrowRight,
  Info,
  CheckCircle,
} from 'lucide-react';

export function ComponentAnnotation({
  guidedStep,
  simState,
  isControlOpen = false,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!guidedStep) return null;

  // Render live metrics relevant to the active step
  const renderLiveMetrics = () => {
    switch (guidedStep.id) {
      case 'TARGET_SPEED':
        return (
          <div className="annotation-metrics-row">
            <div className="annotation-metric-badge">
              <span className="lbl">Target Setpoint</span>
              <span className="val text-cyan-400">{Math.round(simState.targetRpm)} RPM</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">Actual Rotor</span>
              <span className="val text-emerald-400">{Math.round(simState.actualRpm)} RPM</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">Speed Error</span>
              <span className="val text-amber-400">{Math.round(simState.speedError)} RPM</span>
            </div>
          </div>
        );

      case 'PWM_GENERATION':
        return (
          <div className="annotation-metrics-row">
            <div className="annotation-metric-badge">
              <span className="lbl">PWM Duty Cycle</span>
              <span className="val text-cyan-400">{simState.pwmDuty.toFixed(1)}%</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">PWM Frequency</span>
              <span className="val text-slate-300">20.0 kHz</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">Timer Channel</span>
              <span className="val text-cyan-400">TIM1_CH1</span>
            </div>
          </div>
        );

      case 'DRIVER_ACTIVATION':
        return (
          <div className="annotation-metrics-row">
            <div className="annotation-metric-badge">
              <span className="lbl">Bus Voltage</span>
              <span className="val text-amber-400">{simState.voltage.toFixed(1)} V</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">Armature Current</span>
              <span className="val text-orange-400">{simState.current.toFixed(2)} A</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">H-Bridge State</span>
              <span className="val text-emerald-400">4× N-MOSFETs Active</span>
            </div>
          </div>
        );

      case 'MOTOR_ACCELERATION':
        return (
          <div className="annotation-metrics-row">
            <div className="annotation-metric-badge">
              <span className="lbl">Rotor Speed</span>
              <span className="val text-emerald-400">{Math.round(simState.actualRpm)} RPM</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">Armature Current</span>
              <span className="val text-orange-400">{simState.current.toFixed(2)} A</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">Motor Torque</span>
              <span className="val text-cyan-400">{(simState.motorTorque || 0).toFixed(3)} N·m</span>
            </div>
          </div>
        );

      case 'ENCODER_FEEDBACK':
        return (
          <div className="annotation-metrics-row">
            <div className="annotation-metric-badge">
              <span className="lbl">Measured Speed</span>
              <span className="val text-emerald-400">{Math.round(simState.actualRpm)} RPM</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">Pulse Frequency</span>
              <span className="val text-cyan-400">{Math.round(simState.encoderFreq || 0)} Hz</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">Resolution</span>
              <span className="val text-slate-300">1024 CPR (4096 QEI)</span>
            </div>
          </div>
        );

      case 'PID_COMPARISON':
        return (
          <div className="annotation-metrics-row">
            <div className="annotation-metric-badge">
              <span className="lbl">Speed Error</span>
              <span className="val text-amber-400">{Math.round(simState.speedError)} RPM</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">P-Term / I-Term</span>
              <span className="val text-cyan-400">P:{simState.pid.pTerm.toFixed(1)} | I:{simState.pid.iTerm.toFixed(1)}</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">PID Output</span>
              <span className="val text-emerald-400">{simState.pid.output.toFixed(1)}%</span>
            </div>
          </div>
        );

      case 'PWM_ADJUSTMENT':
        return (
          <div className="annotation-metrics-row">
            <div className="annotation-metric-badge">
              <span className="lbl">Modulated PWM</span>
              <span className="val text-cyan-400">{simState.pwmDuty.toFixed(1)}%</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">Speed Error</span>
              <span className="val text-amber-400">{Math.round(simState.speedError)} RPM</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">Current Draw</span>
              <span className="val text-orange-400">{simState.current.toFixed(2)} A</span>
            </div>
          </div>
        );

      case 'SPEED_STABILIZES':
        return (
          <div className="annotation-metrics-row">
            <div className="annotation-metric-badge">
              <span className="lbl">Target / Actual</span>
              <span className="val text-emerald-400">{Math.round(simState.targetRpm)} / {Math.round(simState.actualRpm)} RPM</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">Steady-State Error</span>
              <span className="val text-cyan-400">{Math.round(simState.speedError)} RPM</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">Regulation State</span>
              <span className="val text-emerald-400">Locked Equilibrium</span>
            </div>
          </div>
        );

      case 'LOAD_DISTURBANCE':
        return (
          <div className="annotation-metrics-row">
            <div className="annotation-metric-badge">
              <span className="lbl">Brake Torque</span>
              <span className="val text-red-400">+{simState.loadTorque.toFixed(2)} N·m</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">Speed Error</span>
              <span className="val text-amber-400">{Math.round(simState.speedError)} RPM</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">Current Demand</span>
              <span className="val text-orange-400">{simState.current.toFixed(2)} A</span>
            </div>
          </div>
        );

      case 'FAULT_DETECTION':
        return (
          <div className="annotation-metrics-row">
            <div className="annotation-metric-badge">
              <span className="lbl">Injected Fault</span>
              <span className="val text-red-400">Encoder Signal Loss</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">PWM Output</span>
              <span className="val text-slate-300">0.0% (Interlocked)</span>
            </div>
            <div className="annotation-metric-badge">
              <span className="lbl">Emergency Alert</span>
              <span className="val text-purple-400">CAN 0x070 Active</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <aside
      className={`component-annotation-card ${isControlOpen ? 'offset-left' : ''}`}
      aria-label="Step Explanation"
    >
      {/* Step Header */}
      <div className="annotation-header">
        <div className="flex items-center gap-2">
          <span className="annotation-step-badge">
            STEP {guidedStep.step} OF 10
          </span>
          <span className="annotation-focus-pill">
            🎯 {guidedStep.focusComponent.toUpperCase()}
          </span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="annotation-expand-btn"
          title={isExpanded ? 'Collapse Detailed Notes' : 'Expand Engineering Details'}
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>{isExpanded ? 'Less' : 'Details'}</span>
        </button>
      </div>

      {/* Main Title & Concise Explanation */}
      <div className="annotation-body">
        <h3 className="annotation-title">
          {guidedStep.shortTitle || guidedStep.title}
        </h3>

        <p className="annotation-explanation">
          {guidedStep.shortExplanation}
        </p>

        {/* Signal Flow Path Indicator */}
        {guidedStep.signalDirection && (
          <div className="annotation-signal-flow">
            <span className="signal-label">Signal Flow:</span>
            <span className="signal-path">{guidedStep.signalDirection}</span>
          </div>
        )}

        {/* Live Synchronized Physical Metrics */}
        {renderLiveMetrics()}

        {/* Optional Expandable Technical Notes */}
        {isExpanded && (
          <div className="annotation-expanded-notes">
            <p className="text-xs text-slate-300 leading-relaxed mb-2">
              {guidedStep.detailedExplanation}
            </p>
            {guidedStep.nextHint && (
              <div className="annotation-hint-chip">
                <Info size={12} className="text-cyan-400 shrink-0" />
                <span>{guidedStep.nextHint}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
