/**
 * MetricsPanel: Live Engineering Telemetry Gauges and Readouts
 */

import React from 'react';
import {
  Gauge,
  Zap,
  Flame,
  Activity,
  Cpu,
  Radio,
  RadioTower,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  formatRpm,
  formatCurrent,
  formatTemp,
  formatDuty,
  formatTorque,
} from '../utils/formatters.js';

export function MetricsPanel({ simState }) {
  const {
    targetRpm,
    actualRpm,
    speedError,
    pwmDuty,
    current,
    voltage,
    temperature,
    loadTorque,
    powerMech,
    encoderFreq,
    faults,
    telemetry,
  } = simState;

  // Percentage for visual bars
  const rpmPercent = Math.min(100, Math.max(0, (actualRpm / 3200) * 100));
  const currentPercent = Math.min(100, Math.max(0, (current / 15.0) * 100));
  const tempPercent = Math.min(100, Math.max(0, ((temperature - 20) / 70) * 100));

  return (
    <div className="metrics-hud">
      {/* 1. Main Speed Dual Readout */}
      <div className="hud-card speed-card">
        <div className="hud-card-header">
          <span className="hud-title">
            <Gauge size={14} className="text-cyan-400" />
            Motor Speed (RPM)
          </span>
          <span className="hud-tag">PV / SP</span>
        </div>
        <div className="hud-metric-row">
          <div className="metric-large font-mono text-cyan-300">
            {formatRpm(actualRpm)}
          </div>
          <div className="metric-target font-mono text-slate-400">
            / {formatRpm(targetRpm)}
          </div>
        </div>
        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill fill-cyan"
            style={{ width: `${rpmPercent}%` }}
          />
        </div>
        <div className="hud-footer-row">
          <span className="text-xs text-slate-400">
            Error: <span className={Math.abs(speedError) < 15 ? 'text-emerald-400' : 'text-amber-400'}>
              {speedError >= 0 ? `+${Math.round(speedError)}` : Math.round(speedError)} RPM
            </span>
          </span>
          <span className="text-xs text-slate-400">
            Enc: {Math.round(encoderFreq)} Hz
          </span>
        </div>
      </div>

      {/* 2. PWM Duty Cycle */}
      <div className="hud-card">
        <div className="hud-card-header">
          <span className="hud-title">
            <Cpu size={14} className="text-blue-400" />
            PWM Duty Cycle
          </span>
          <span className="hud-val font-mono">{formatDuty(pwmDuty)}%</span>
        </div>
        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill fill-blue"
            style={{ width: `${pwmDuty}%` }}
          />
        </div>
        <div className="hud-footer-row">
          <span className="text-xs text-slate-400">TIM1 Freq: 20.0 kHz</span>
          <span className="text-xs text-slate-400">Bus: {voltage.toFixed(1)}V</span>
        </div>
      </div>

      {/* 3. Armature Current */}
      <div className="hud-card">
        <div className="hud-card-header">
          <span className="hud-title">
            <Zap size={14} className="text-amber-400" />
            Armature Current
          </span>
          <span className={`hud-val font-mono ${current > 8.0 ? 'text-amber-300' : 'text-emerald-300'}`}>
            {formatCurrent(current)} A
          </span>
        </div>
        <div className="progress-bar-bg">
          <div
            className={`progress-bar-fill ${current > 10.0 ? 'fill-red' : 'fill-amber'}`}
            style={{ width: `${currentPercent}%` }}
          />
        </div>
        <div className="hud-footer-row">
          <span className="text-xs text-slate-400">
            P_mech: {powerMech.toFixed(1)} W
          </span>
          <span className="text-xs text-slate-400">
            Trip: &gt;11.5 A
          </span>
        </div>
      </div>

      {/* 4. Motor Temperature */}
      <div className="hud-card">
        <div className="hud-card-header">
          <span className="hud-title">
            <Flame size={14} className="text-rose-400" />
            Stator Temperature
          </span>
          <span className={`hud-val font-mono ${temperature > 65.0 ? 'text-red-400' : 'text-slate-200'}`}>
            {formatTemp(temperature)} &deg;C
          </span>
        </div>
        <div className="progress-bar-bg">
          <div
            className={`progress-bar-fill ${temperature > 70 ? 'fill-red' : 'fill-rose'}`}
            style={{ width: `${tempPercent}%` }}
          />
        </div>
        <div className="hud-footer-row">
          <span className="text-xs text-slate-400">
            Ambient: 24.0&deg;C
          </span>
          <span className="text-xs text-slate-400">
            Cutoff: 80.0&deg;C
          </span>
        </div>
      </div>

      {/* 5. Subsystem Status Matrix */}
      <div className="hud-card status-matrix-card">
        <div className="status-grid">
          <div className="status-item">
            <span className="text-slate-400 text-xs">Load Torque:</span>
            <span className="font-mono text-xs text-slate-200">{formatTorque(loadTorque)} N&bull;m</span>
          </div>
          <div className="status-item">
            <span className="text-slate-400 text-xs">Encoder Feedback:</span>
            <span className={`font-mono text-xs ${faults.isEncoderHealthy ? 'text-emerald-400' : 'text-red-400'}`}>
              {faults.isEncoderHealthy ? 'QUAD_OK' : 'FAULT_LOST'}
            </span>
          </div>
          <div className="status-item">
            <span className="text-slate-400 text-xs">FDCAN Bus:</span>
            <span className={`font-mono text-xs ${faults.isCanHealthy ? 'text-purple-400' : 'text-red-400'}`}>
              {faults.isCanHealthy ? 'ACTIVE_1M' : 'BUS_OFF'}
            </span>
          </div>
          <div className="status-item">
            <span className="text-slate-400 text-xs">Gate Drive:</span>
            <span className={`font-mono text-xs ${!faults.isLatched && simState.isRunning ? 'text-cyan-400' : 'text-slate-400'}`}>
              {!faults.isLatched && simState.isRunning ? 'ENABLED' : 'INHIBITED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
