/**
 * ControlPanel: Motor Operation, Target Speed, Load, PID Tuning & Fault Injection
 */

import React, { useState } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Gauge,
  Weight,
  Sliders,
  Zap,
  AlertOctagon,
  ShieldAlert,
  Flame,
  Radio,
  RadioTower,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatRpm } from '../utils/formatters.js';

export function ControlPanel({
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
}) {
  const [activeTab, setActiveTab] = useState('operation'); // 'operation' | 'tuning' | 'faults'
  const [faultClearMsg, setFaultClearMsg] = useState(null);

  const {
    isRunning,
    targetRpm,
    loadTorque,
    voltage,
    pid,
    faults,
    stepTest,
  } = simState;

  const handleClearFaults = () => {
    const res = onClearFaults();
    if (!res.success) {
      setFaultClearMsg(res.reason);
      setTimeout(() => setFaultClearMsg(null), 3000);
    } else {
      setFaultClearMsg(null);
    }
  };

  const applyPidPreset = (preset) => {
    if (preset === 'optimal') {
      onSetPidGains(0.085, 0.320, 0.004);
    } else if (preset === 'underdamped') {
      onSetPidGains(0.180, 0.650, 0.001);
    } else if (preset === 'aggressive') {
      onSetPidGains(0.220, 0.450, 0.012);
    } else if (preset === 'sluggish') {
      onSetPidGains(0.040, 0.060, 0.002);
    }
  };

  return (
    <aside className="control-panel">
      {/* Tab Navigation */}
      <div className="panel-tabs">
        <button
          className={`tab-btn ${activeTab === 'operation' ? 'active' : ''}`}
          onClick={() => setActiveTab('operation')}
        >
          <Gauge size={14} />
          <span>Operation</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'tuning' ? 'active' : ''}`}
          onClick={() => setActiveTab('tuning')}
        >
          <Sliders size={14} />
          <span>PID Tuning</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'faults' ? 'active' : ''} ${faults.active.length > 0 ? 'tab-alert' : ''}`}
          onClick={() => setActiveTab('faults')}
        >
          <AlertOctagon size={14} />
          <span>Faults ({faults.active.length})</span>
        </button>
      </div>

      <div className="panel-content">
        {/* ============================================================== */}
        {/* TAB 1: MOTOR OPERATION & SETPOINTS                             */}
        {/* ============================================================== */}
        {activeTab === 'operation' && (
          <div className="tab-pane">
            {/* Primary Action Buttons */}
            <div className="action-buttons-group">
              <button
                className="btn btn-start"
                onClick={onStart}
                disabled={isRunning || faults.isLatched}
              >
                <Play size={16} fill="currentColor" />
                <span>Start Drive</span>
              </button>
              <button
                className="btn btn-stop"
                onClick={onStop}
                disabled={!isRunning}
              >
                <Square size={16} fill="currentColor" />
                <span>Stop</span>
              </button>
              <button
                className="btn btn-reset"
                onClick={onReset}
              >
                <RotateCcw size={15} />
                <span>Reset</span>
              </button>
            </div>

            {/* Latched Fault Warning Banner */}
            {faults.isLatched && (
              <div className="fault-warning-box">
                <ShieldAlert size={18} className="text-red-400" />
                <div>
                  <div className="font-semibold text-red-300">PROTECTIVE TRIP ACTIVE</div>
                  <div className="text-xs text-red-200/80">{faults.tripReason}</div>
                </div>
                <button
                  onClick={handleClearFaults}
                  className="btn-clear-trip"
                >
                  Clear Trip
                </button>
              </div>
            )}

            {/* Target Speed Control */}
            <div className="control-group">
              <div className="control-label-row">
                <span className="control-label">
                  <Gauge size={15} className="text-cyan-400" />
                  Target Speed (Setpoint)
                </span>
                <span className="control-val">{formatRpm(targetRpm)} RPM</span>
              </div>
              <input
                type="range"
                min="0"
                max="3000"
                step="50"
                value={targetRpm}
                onChange={(e) => onSetTargetRpm(Number(e.target.value))}
                className="range-slider"
              />
              <div className="preset-buttons">
                {[500, 1000, 1500, 2200, 2800].map((rpm) => (
                  <button
                    key={rpm}
                    className={`preset-btn ${targetRpm === rpm ? 'active' : ''}`}
                    onClick={() => onSetTargetRpm(rpm)}
                  >
                    {rpm}
                  </button>
                ))}
              </div>
            </div>

            {/* Mechanical Load Control */}
            <div className="control-group">
              <div className="control-label-row">
                <span className="control-label">
                  <Weight size={15} className="text-amber-400" />
                  Opposing Load Torque
                </span>
                <span className="control-val">{loadTorque.toFixed(2)} N&bull;m</span>
              </div>
              <input
                type="range"
                min="0"
                max="2.2"
                step="0.05"
                value={loadTorque}
                onChange={(e) => onSetLoadTorque(Number(e.target.value))}
                className="range-slider"
              />
              <div className="preset-buttons">
                {[
                  { label: '0 N·m (Idle)', val: 0.0 },
                  { label: '0.4 N·m', val: 0.4 },
                  { label: '1.0 N·m', val: 1.0 },
                  { label: '1.8 N·m', val: 1.8 },
                ].map(({ label, val }) => (
                  <button
                    key={val}
                    className={`preset-btn ${Math.abs(loadTorque - val) < 0.05 ? 'active' : ''}`}
                    onClick={() => onSetLoadTorque(val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step Load Disturbance Test Button */}
            <div className="control-group">
              <button
                className={`step-test-btn ${stepTest.active ? 'active-test' : ''}`}
                onClick={() => onTriggerStepLoad(0.45, 2.5)}
                disabled={!isRunning}
              >
                <Zap size={16} />
                <span>
                  {stepTest.active
                    ? `Shock Load Active (${(stepTest.duration - stepTest.elapsed).toFixed(1)}s)`
                    : 'Apply +0.45 N·m Step Disturbance (2.5s)'}
                </span>
              </button>
              <div className="text-xs text-slate-400 mt-1">
                Injects an instantaneous load shock to test PID recovery and speed droop.
              </div>
            </div>

            {/* DC Benchtop Power Supply Voltage */}
            <div className="control-group">
              <div className="control-label-row">
                <span className="control-label">
                  <Zap size={15} className="text-blue-400" />
                  DC Supply Voltage
                </span>
                <span className="control-val">{voltage.toFixed(1)} V</span>
              </div>
              <input
                type="range"
                min="12"
                max="32"
                step="1"
                value={voltage}
                onChange={(e) => onSetSupplyVoltage(Number(e.target.value))}
                className="range-slider"
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: PID CONTROLLER TUNING                                  */}
        {/* ============================================================== */}
        {activeTab === 'tuning' && (
          <div className="tab-pane">
            <div className="text-xs text-slate-300 mb-3 bg-slate-800/60 p-2.5 rounded border border-slate-700">
              Discrete-Time PID running inside STM32H7 FreeRTOS control task at 100 Hz (Ts = 10ms).
              Features integral anti-windup &amp; low-pass filtered derivative.
            </div>

            {/* Kp Gain */}
            <div className="control-group">
              <div className="control-label-row">
                <span className="control-label font-mono">Kp (Proportional)</span>
                <span className="control-val font-mono">{pid.kp.toFixed(4)}</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.45"
                step="0.005"
                value={pid.kp}
                onChange={(e) => onSetPidGains(Number(e.target.value), pid.ki, pid.kd)}
                className="range-slider"
              />
            </div>

            {/* Ki Gain */}
            <div className="control-group">
              <div className="control-label-row">
                <span className="control-label font-mono">Ki (Integral)</span>
                <span className="control-val font-mono">{pid.ki.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="1.20"
                step="0.01"
                value={pid.ki}
                onChange={(e) => onSetPidGains(pid.kp, Number(e.target.value), pid.kd)}
                className="range-slider"
              />
            </div>

            {/* Kd Gain */}
            <div className="control-group">
              <div className="control-label-row">
                <span className="control-label font-mono">Kd (Derivative)</span>
                <span className="control-val font-mono">{pid.kd.toFixed(4)}</span>
              </div>
              <input
                type="range"
                min="0.000"
                max="0.035"
                step="0.001"
                value={pid.kd}
                onChange={(e) => onSetPidGains(pid.kp, pid.ki, Number(e.target.value))}
                className="range-slider"
              />
            </div>

            {/* Quick Presets */}
            <div className="control-group">
              <div className="text-xs font-semibold text-slate-300 mb-2">Tuning Presets:</div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  className="preset-btn"
                  onClick={() => applyPidPreset('optimal')}
                >
                  Optimal (Critical)
                </button>
                <button
                  className="preset-btn"
                  onClick={() => applyPidPreset('underdamped')}
                >
                  Underdamped (Overshoot)
                </button>
                <button
                  className="preset-btn"
                  onClick={() => applyPidPreset('aggressive')}
                >
                  Aggressive Gain
                </button>
                <button
                  className="preset-btn"
                  onClick={() => applyPidPreset('sluggish')}
                >
                  Sluggish (Low Ki)
                </button>
              </div>
            </div>

            {/* Real-time PID Component Breakdown */}
            <div className="pid-breakdown-box">
              <div className="text-xs font-semibold text-slate-300 mb-1">Live Term Breakdown:</div>
              <div className="text-xs font-mono text-cyan-300">P-Term: {pid.pTerm.toFixed(2)}%</div>
              <div className="text-xs font-mono text-emerald-300">I-Term: {pid.iTerm.toFixed(2)}%</div>
              <div className="text-xs font-mono text-amber-300">D-Term: {pid.dTerm.toFixed(2)}%</div>
              <div className="text-xs font-mono text-white font-bold pt-1 border-t border-slate-700">
                Saturated Output: {pid.output.toFixed(1)}% PWM
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: FAULT INJECTION & SAFETY INTERLOCKS                     */}
        {/* ============================================================== */}
        {activeTab === 'faults' && (
          <div className="tab-pane">
            <div className="text-xs text-slate-300 mb-3 bg-slate-800/60 p-2.5 rounded border border-slate-700">
              Test embedded protection mechanisms and safe-state degraded behavior by injecting real hardware faults.
            </div>

            {faultClearMsg && (
              <div className="text-xs bg-red-950 border border-red-700 text-red-200 p-2 rounded mb-2">
                {faultClearMsg}
              </div>
            )}

            {/* 1. Overcurrent Fault */}
            <div className="fault-toggle-item">
              <div className="fault-info">
                <div className="fault-title">
                  <ShieldAlert size={15} className="text-amber-400" />
                  <span>Overcurrent Trip (I &gt; 11.5A)</span>
                </div>
                <div className="fault-desc">Forces current threshold trip; shuts down PWM drive.</div>
              </div>
              <input
                type="checkbox"
                checked={faults.injected.overcurrent}
                onChange={() => onToggleFault('overcurrent')}
                className="fault-checkbox"
              />
            </div>

            {/* 2. Overtemperature Fault */}
            <div className="fault-toggle-item">
              <div className="fault-info">
                <div className="fault-title">
                  <Flame size={15} className="text-red-400" />
                  <span>Overtemperature Cutoff (T &gt; 80&deg;C)</span>
                </div>
                <div className="fault-desc">Simulates stator thermal overload; triggers cutoff.</div>
              </div>
              <input
                type="checkbox"
                checked={faults.injected.overtemp}
                onChange={() => onToggleFault('overtemp')}
                className="fault-checkbox"
              />
            </div>

            {/* 3. Encoder Signal Loss */}
            <div className="fault-toggle-item">
              <div className="fault-info">
                <div className="fault-title">
                  <Radio size={15} className="text-emerald-400" />
                  <span>Encoder Feedback Loss</span>
                </div>
                <div className="fault-desc">Invalidates quadrature pulses; halts closed-loop control.</div>
              </div>
              <input
                type="checkbox"
                checked={faults.injected.encoderLoss}
                onChange={() => onToggleFault('encoderLoss')}
                className="fault-checkbox"
              />
            </div>

            {/* 4. CAN / FDCAN Failure */}
            <div className="fault-toggle-item">
              <div className="fault-info">
                <div className="fault-title">
                  <RadioTower size={15} className="text-purple-400" />
                  <span>FDCAN Bus-Off Failure</span>
                </div>
                <div className="fault-desc">Halts telemetry frames; enters error passive state.</div>
              </div>
              <input
                type="checkbox"
                checked={faults.injected.canFailure}
                onChange={() => onToggleFault('canFailure')}
                className="fault-checkbox"
              />
            </div>

            {/* Clear Latched Faults Button */}
            <button
              onClick={handleClearFaults}
              className="btn btn-clear-all-faults mt-4"
              disabled={!faults.isLatched && faults.active.length === 0}
            >
              <RotateCcw size={15} />
              <span>Reset &amp; Clear Latched Faults</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
