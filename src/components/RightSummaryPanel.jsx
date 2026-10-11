/**
 * RightSummaryPanel Component
 *
 * Dedicated Right-Column Panel (~20% width):
 * - Live System Summary with compact, readable engineering rows
 * - Group 1: Motor Dynamics (Target RPM, Actual RPM, Error, Rotor Angle)
 * - Group 2: Control & Drive (PWM Duty, PWM Frequency, Controller State, PID Output)
 * - Group 3: Electrical & Thermal (Current, Voltage, Motor Torque, Load Torque, Temperature)
 * - Group 4: Communication & Feedback (Encoder Status, CAN Status, Active Faults)
 * - Component Technical Inspector section if a 3D component is clicked
 * - Translucent glassmorphism styling
 */

import React from 'react';
import {
  Gauge,
  Cpu,
  Zap,
  Flame,
  Radio,
  RadioTower,
  Activity,
  Layers,
  X,
  ShieldCheck,
  ShieldAlert,
  Info,
} from 'lucide-react';
import {
  formatRpm,
  formatCurrent,
  formatTemp,
  formatDuty,
  formatTorque,
} from '../utils/formatters.js';

export function RightSummaryPanel({
  simState,
  selectedComponent = null,
  onDeselectComponent,
}) {
  const {
    targetRpm,
    actualRpm,
    speedError,
    pwmDuty,
    current,
    voltage,
    temperature,
    loadTorque,
    motorTorque,
    powerMech,
    rotorAngle,
    encoderFreq,
    encoderPulses,
    pid,
    faults,
    telemetry,
    isRunning,
  } = simState;

  // Visual percent indicators
  const rpmPercent = Math.min(100, Math.max(0, (actualRpm / 3200) * 100));
  const currentPercent = Math.min(100, Math.max(0, (current / 15.0) * 100));
  const tempPercent = Math.min(100, Math.max(0, ((temperature - 20) / 60) * 100));
  const rotorDeg = Math.round(((rotorAngle % (2 * Math.PI)) / (2 * Math.PI)) * 360);

  // Controller State string
  const getControllerState = () => {
    if (faults.isLatched) return 'TRIPPED / SHUTDOWN';
    if (!isRunning) return 'STANDBY';
    if (Math.abs(speedError) < 25) return 'CLOSED-LOOP (LOCKED)';
    return 'CLOSED-LOOP (SLEWING)';
  };

  return (
    <aside className="right-summary-column">
      {/* Top Header */}
      <div className="summary-column-header">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-cyan-400" />
          <h2 className="summary-column-title">Live System Summary</h2>
        </div>
        <span className="summary-rate-badge">100 Hz Loop</span>
      </div>

      <div className="summary-column-body">
        {/* ============================================================ */}
        {/* COMPONENT INSPECTOR DRAWER (If 3D object clicked)            */}
        {/* ============================================================ */}
        {selectedComponent && (
          <div className="inspector-inline-card">
            <div className="inspector-card-header">
              <div className="flex items-center gap-1.5">
                <Layers size={13} className="text-cyan-400" />
                <span className="text-xs font-bold text-slate-100 uppercase">
                  {selectedComponent.toUpperCase()} INSPECTOR
                </span>
              </div>
              <button
                onClick={onDeselectComponent}
                className="inspector-close-mini"
                title="Close Inspector"
              >
                <X size={13} />
              </button>
            </div>
            <div className="inspector-card-body">
              <span className="text-[11px] text-slate-300 leading-tight block">
                {selectedComponent === 'motor' && '24V DC Actuator. Torque Tm = Kt × I. Back-EMF limits speed.'}
                {selectedComponent === 'encoder' && '1024 CPR Optical Quadrature Encoder streaming to TIM2 counter.'}
                {selectedComponent === 'driver' && 'H-Bridge MOSFET inverter switching 24V bus at 20 kHz.'}
                {selectedComponent === 'controller' && 'STM32H743ZI Cortex-M7 running 100 Hz PID closed-loop task.'}
                {selectedComponent === 'load' && 'Inertia flywheel & adjustable friction brake assembly.'}
                {selectedComponent === 'powerSupply' && '24.0V DC regulated laboratory bus power supply.'}
                {selectedComponent === 'canTransceiver' && 'Physical differential CAN/FDCAN bus transceiver.'}
                {selectedComponent === 'currentSensor' && 'Isolated Hall-effect ACS724 current transducer.'}
                {selectedComponent === 'tempSensor' && 'Industrial PT100 thermal sensor in stator well.'}
              </span>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* GROUP 1: MOTOR DYNAMICS                                      */}
        {/* ============================================================ */}
        <div className="summary-group">
          <div className="group-header">
            <Gauge size={13} className="text-cyan-400" />
            <span>Motor Dynamics</span>
          </div>

          <div className="metric-row">
            <span className="metric-name">Target Speed (SP)</span>
            <span className="metric-value text-slate-300 font-mono">
              {formatRpm(targetRpm)} RPM
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-name">Actual Speed (PV)</span>
            <span className="metric-value text-cyan-300 font-mono font-bold">
              {formatRpm(actualRpm)} RPM
            </span>
          </div>

          {/* Speed Visual Bar */}
          <div className="metric-bar-track">
            <div
              className="metric-bar-fill fill-cyan"
              style={{ width: `${rpmPercent}%` }}
            />
          </div>

          <div className="metric-row">
            <span className="metric-name">Speed Error (SP - PV)</span>
            <span
              className={`metric-value font-mono font-semibold ${
                Math.abs(speedError) < 20 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {speedError >= 0 ? `+${Math.round(speedError)}` : Math.round(speedError)} RPM
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-name">Rotor Angle (θ)</span>
            <span className="metric-value text-slate-400 font-mono">
              {rotorDeg}&deg; ({(rotorAngle % (2 * Math.PI)).toFixed(2)} rad)
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* GROUP 2: CONTROL & DRIVE                                     */}
        {/* ============================================================ */}
        <div className="summary-group">
          <div className="group-header">
            <Cpu size={13} className="text-blue-400" />
            <span>Control &amp; Drive</span>
          </div>

          <div className="metric-row">
            <span className="metric-name">PWM Duty Cycle</span>
            <span className="metric-value text-blue-300 font-mono font-bold">
              {formatDuty(pwmDuty)}%
            </span>
          </div>

          {/* PWM Visual Bar */}
          <div className="metric-bar-track">
            <div
              className="metric-bar-fill fill-blue"
              style={{ width: `${Math.min(100, pwmDuty)}%` }}
            />
          </div>

          <div className="metric-row">
            <span className="metric-name">PWM Frequency</span>
            <span className="metric-value text-slate-400 font-mono">20.0 kHz (TIM1)</span>
          </div>

          <div className="metric-row">
            <span className="metric-name">Controller State</span>
            <span
              className={`metric-value font-mono text-[10.5px] font-semibold ${
                faults.isLatched
                  ? 'text-red-400'
                  : isRunning
                  ? 'text-emerald-400'
                  : 'text-slate-400'
              }`}
            >
              {getControllerState()}
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-name">PID Gains (Kp/Ki/Kd)</span>
            <span className="metric-value text-slate-400 font-mono text-[10.5px]">
              {pid.kp.toFixed(3)} / {pid.ki.toFixed(2)} / {pid.kd.toFixed(3)}
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* GROUP 3: ELECTRICAL & THERMAL                                */}
        {/* ============================================================ */}
        <div className="summary-group">
          <div className="group-header">
            <Zap size={13} className="text-amber-400" />
            <span>Electrical &amp; Thermal</span>
          </div>

          <div className="metric-row">
            <span className="metric-name">Armature Current</span>
            <span
              className={`metric-value font-mono font-bold ${
                current > 9.0 ? 'text-red-400' : current > 5.0 ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              {formatCurrent(current)} A
            </span>
          </div>

          {/* Current Visual Bar */}
          <div className="metric-bar-track">
            <div
              className={`metric-bar-fill ${current > 10.0 ? 'fill-red' : 'fill-amber'}`}
              style={{ width: `${currentPercent}%` }}
            />
          </div>

          <div className="metric-row">
            <span className="metric-name">Supply Bus Voltage</span>
            <span className="metric-value text-slate-300 font-mono">
              {voltage.toFixed(1)} V
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-name">Electromagnetic Torque</span>
            <span className="metric-value text-cyan-300 font-mono">
              {formatTorque(motorTorque || 0)} N·m
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-name">Mechanical Load</span>
            <span className="metric-value text-amber-300 font-mono">
              {formatTorque(loadTorque)} N·m
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-name">Stator Temperature</span>
            <span
              className={`metric-value font-mono ${
                temperature > 70 ? 'text-red-400' : 'text-slate-200'
              }`}
            >
              {formatTemp(temperature)} &deg;C
            </span>
          </div>

          {/* Temperature Visual Bar */}
          <div className="metric-bar-track">
            <div
              className={`metric-bar-fill ${temperature > 65 ? 'fill-red' : 'fill-rose'}`}
              style={{ width: `${tempPercent}%` }}
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* GROUP 4: COMMUNICATION & FEEDBACK                            */}
        {/* ============================================================ */}
        <div className="summary-group">
          <div className="group-header">
            <RadioTower size={13} className="text-purple-400" />
            <span>Communication &amp; Feedback</span>
          </div>

          <div className="metric-row">
            <span className="metric-name">Encoder Feedback</span>
            <span
              className={`metric-value font-mono font-bold text-[10.5px] ${
                faults.isEncoderHealthy ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {faults.isEncoderHealthy ? 'QUAD_OK (1024 CPR)' : 'SIGNAL LOSS (TRIP)'}
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-name">Encoder Pulse Rate</span>
            <span className="metric-value text-slate-300 font-mono">
              {Math.round(encoderFreq || 0)} Hz ({encoderPulses} total)
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-name">CAN / FDCAN Status</span>
            <span
              className={`metric-value font-mono text-[10.5px] ${
                faults.isCanHealthy ? 'text-purple-300' : 'text-red-400'
              }`}
            >
              {faults.isCanHealthy ? 'BUS ACTIVE (1 Mbps)' : 'BUS-OFF (FAULT)'}
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-name">Active Faults</span>
            <span
              className={`metric-value font-mono text-[10.5px] font-bold ${
                faults.active.length > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {faults.active.length > 0 ? faults.active.join(', ') : 'SYSTEM NORMAL'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
