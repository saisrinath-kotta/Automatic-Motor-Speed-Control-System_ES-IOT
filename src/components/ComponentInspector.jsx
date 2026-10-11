/**
 * ComponentInspector: Deep Technical Information Drawer
 *
 * Displays hardware schematics, signal I/O, operating principles,
 * and live parameters for whichever 3D component is currently clicked/selected.
 */

import React from 'react';
import { X, Info, Zap, ArrowRight, Activity, BookOpen, Layers } from 'lucide-react';
import {
  formatRpm,
  formatCurrent,
  formatTemp,
  formatDuty,
  formatTorque,
} from '../utils/formatters.js';

const COMPONENT_DETAILS = {
  motor: {
    title: 'Industrial DC Servo Motor',
    subtitle: 'Brushless / Permanent Magnet DC Actuator',
    purpose: 'Converts electrical power into rotary mechanical torque to drive the shaft and attached mechanical load.',
    principle: 'Electromagnetic Lorentz force (F = I × B × L) creates torque proportional to armature current (Tm = Kt × I). When spinning, rotating conductors cut the stator magnetic field, generating opposing Back-EMF (E = Ke × ω) that naturally limits maximum no-load speed.',
    inputs: [
      { name: 'Motor Phase Power (M+, M-)', source: 'Motor Driver PCB', type: 'Chopped DC Voltage (0-24V PWM)' },
    ],
    outputs: [
      { name: 'Shaft Torque & Rotation', dest: 'Coupling & Load Assembly', type: 'Mechanical Angular Velocity (ω)' },
      { name: 'Stator Joule Heat', dest: 'Environment / Temp Sensor', type: 'Thermal dissipation (I²Ra watts)' },
    ],
    formula: 'J · dω/dt = Kt·I - T_load - B·ω - T_coulomb',
  },
  encoder: {
    title: 'Optical Quadrature Encoder',
    subtitle: '1024 CPR Dual-Channel Incremental Encoder',
    purpose: 'Measures high-resolution shaft position and angular velocity, providing instantaneous feedback to the STM32H7 controller.',
    principle: 'An optical disc with 1024 etched radial slots rotates between an infrared LED and phototransistors. Two channels (A and B) generate square waves phase-shifted by 90° (quadrature). Hardware quadrature decoders (TIM2 in STM32) count all 4 edges per slot, yielding 4096 counts/rev to accurately compute speed.',
    inputs: [
      { name: 'Mechanical Rotor Shaft', source: 'Motor Rear Shaft', type: 'Rotational Angle (θ)' },
      { name: 'VCC / GND', source: 'STM32 Board (5V/3.3V)', type: 'DC Sensor Power' },
    ],
    outputs: [
      { name: 'Channel A / Channel B Pulses', dest: 'STM32 TIM2_CH1 / CH2', type: 'Quadrature TTL Pulses (0-55 kHz)' },
      { name: 'Index Z Pulse', dest: 'STM32 GPIO', type: '1 Pulse / Revolution' },
    ],
    formula: 'RPM = (ΔPulses / (1024 × 4 × Δt)) × 60',
  },
  driver: {
    title: 'H-Bridge MOSFET Motor Driver PCB',
    subtitle: 'High-Current Solid-State Power Inverter',
    purpose: 'Switches high-voltage / high-current DC power to the motor based on low-power logic PWM signals from the STM32 microcontroller.',
    principle: 'Uses four N-channel Power MOSFETs arranged in an H-bridge configuration with a dedicated high/low side gate driver IC. By switching at 20 kHz, average voltage applied to the motor is precisely regulated as V_motor = V_supply × (Duty Cycle / 100), without significant dissipative resistor losses.',
    inputs: [
      { name: 'PWM Control Signal', source: 'STM32 TIM1_CH1', type: '20 kHz 3.3V Logic PWM' },
      { name: 'DC Bus Power (+24V, GND)', source: 'Benchtop Power Supply', type: 'High-Current DC (0-15A)' },
    ],
    outputs: [
      { name: 'Armature Drive Output', dest: 'DC Motor Phase Terminals', type: 'Modulated DC Voltage (0-24V)' },
      { name: 'Current Sense Analog', dest: 'Current Transducer / STM32', type: 'Low-Side Shunt Drop' },
    ],
    formula: 'V_applied = V_bus × (PWM_Duty / 100.0)',
  },
  controller: {
    title: 'STM32H7 Development Board',
    subtitle: 'STM32H743ZI &bull; ARM Cortex-M7 @ 480 MHz',
    purpose: 'Executes the real-time closed-loop PID control algorithm, manages timer peripherals, samples analog sensors, and transmits FDCAN telemetry.',
    principle: 'The Cortex-M7 core runs a deterministic 100 Hz control loop. Advanced Timer TIM1 generates 20 kHz center-aligned PWM with dead-time. General-purpose Timer TIM2 runs in hardware quadrature encoder mode to calculate RPM. Dual 16-bit ADCs sample current and temperature. A discrete-time PID algorithm computes error and adjusts PWM duty cycle in microseconds.',
    inputs: [
      { name: 'TIM2 Encoder Inputs', source: 'Optical Encoder', type: 'Hardware Counter Pulses' },
      { name: 'ADC1 / ADC2 Channels', source: 'Current & Temp Sensors', type: 'Analog Voltage (0-3.3V)' },
    ],
    outputs: [
      { name: 'TIM1_CH1 PWM Out', dest: 'Motor Driver Logic In', type: '20 kHz PWM Duty' },
      { name: 'FDCAN1 Telemetry Bus', dest: 'CAN Transceiver', type: 'CAN-FD Data Frames' },
    ],
    formula: 'Output[k] = Kp·e[k] + Ki·∑e·Ts - Kd·(dPV/dt)',
  },
  load: {
    title: 'Mechanical Load & Friction Brake',
    subtitle: 'Flexible Spider Coupling, Bearings & Disc Caliper',
    purpose: 'Simulates mechanical work, rotational inertia, friction, and unpredictable dynamic disturbances encountered in real industrial machinery.',
    principle: 'A flexible polyurethane spider coupling absorbs minor shaft misalignments. Dual precision pillow block bearings support the load shaft. The caliper brake applies friction torque against the disc, forcing the motor to draw more electrical current to maintain rotational speed.',
    inputs: [
      { name: 'Drive Shaft Torque', source: 'DC Motor Output Shaft', type: 'Mechanical Coupler' },
      { name: 'Brake Actuator Load', source: 'User Load Slider / Shock Test', type: 'Frictional Retarding Torque (N·m)' },
    ],
    outputs: [
      { name: 'Reaction Torque', dest: 'Motor Shaft', type: 'Opposing Mechanical Torque (T_load)' },
    ],
    formula: 'T_net = T_motor - T_load - B·ω - T_coulomb',
  },
  currentSensor: {
    title: 'Hall-Effect Current Transducer',
    subtitle: 'Isolated Low-Resistance Sensor (ACS724)',
    purpose: 'Measures instantaneous motor armature current for PID monitoring, power calculation, and high-speed overcurrent protection.',
    principle: 'Uses internal Hall-effect semiconductor elements placed near an internal copper conduction path. Current flowing through the conductor produces a localized magnetic field which the Hall sensor converts to a proportional analog voltage isolated up to 2.4 kV.',
    inputs: [
      { name: 'Primary Current Path', source: 'Driver PCB Phase Out', type: 'High Current (0-15A DC)' },
    ],
    outputs: [
      { name: 'Analog Sense Voltage', dest: 'STM32 ADC1_IN3', type: 'V_out = 1.65V + (I × 100mV/A)' },
    ],
    formula: 'I_motor = (V_adc - 1.65V) / Sensitivity',
  },
  tempSensor: {
    title: 'Motor Stator Temperature Probe',
    subtitle: 'NTC Thermistor / PT100 Embedded Sensor',
    purpose: 'Monitors the internal stator winding temperature to detect thermal overload and prevent insulation breakdown.',
    principle: 'As the motor operates under load, copper I²R losses generate internal heat. The probe resistance changes predictably with temperature. An STM32 analog input reads this via a precision voltage divider and converts it using the Steinhart-Hart equation.',
    inputs: [
      { name: 'Stator Thermal Heat', source: 'Motor Housing', type: 'Thermal Conduction' },
    ],
    outputs: [
      { name: 'Analog Divider Voltage', dest: 'STM32 ADC2_IN5', type: 'Temperature-dependent Voltage' },
    ],
    formula: 'dTemp/dt = ((Tamb + Ploss·Rth) - Temp) / tau_th',
  },
  powerSupply: {
    title: 'Programmable Benchtop DC Power Supply',
    subtitle: '24V / 15A Precision Laboratory Supply',
    purpose: 'Provides stable regulated DC power to the motor inverter and gate drive circuits.',
    principle: 'Converts AC mains to isolated, low-ripple DC voltage with selectable constant voltage (CV) or constant current (CC) limiting.',
    inputs: [
      { name: 'AC Mains Power', source: 'Laboratory Grid', type: '230V / 50Hz AC' },
    ],
    outputs: [
      { name: 'Regulated DC Bus', dest: 'Motor Driver Board', type: '12V - 32V DC @ up to 15A' },
    ],
    formula: 'P_electrical = V_bus × I_bus (Watts)',
  },
  canTransceiver: {
    title: 'CAN / FDCAN Physical Layer Transceiver',
    subtitle: 'SN65HVD230 High-Speed 3.3V CAN Transceiver',
    purpose: 'Converts STM32 single-ended logic signals into differential CAN_H and CAN_L voltages for robust industrial fieldbus telemetry.',
    principle: 'CAN-FD uses differential voltage (V_diff = CAN_H - CAN_L) to eliminate common-mode electromagnetic noise. A 120Ω termination resistor at the bus ends prevents signal reflections on high-speed transmission lines.',
    inputs: [
      { name: 'CAN_TX / CAN_RX', source: 'STM32H7 FDCAN1 Controller', type: '3.3V Digital UART/Bitstream' },
    ],
    outputs: [
      { name: 'Differential Bus (CAN_H, CAN_L)', dest: 'Industrial Fieldbus Network', type: 'Dominant 2.0V diff / Recessive 0V' },
    ],
    formula: 'V_diff = V_CANH - V_CANL',
  },
};

export function ComponentInspector({ selectedKey, onClose, simState }) {
  if (!selectedKey || !COMPONENT_DETAILS[selectedKey]) return null;

  const data = COMPONENT_DETAILS[selectedKey];

  return (
    <div className="inspector-modal">
      <div className="inspector-header">
        <div>
          <div className="inspector-badge">3D COMPONENT INSPECTOR</div>
          <div className="inspector-title">{data.title}</div>
          <div className="inspector-subtitle">{data.subtitle}</div>
        </div>
        <button onClick={onClose} className="inspector-close-btn" title="Close Inspector">
          <X size={18} />
        </button>
      </div>

      <div className="inspector-body">
        {/* Purpose */}
        <div className="inspector-section">
          <div className="section-title">
            <Info size={14} className="text-cyan-400" />
            Purpose &amp; System Role
          </div>
          <div className="section-text">{data.purpose}</div>
        </div>

        {/* Operating Principle */}
        <div className="inspector-section">
          <div className="section-title">
            <BookOpen size={14} className="text-blue-400" />
            Engineering Operating Principle
          </div>
          <div className="section-text">{data.principle}</div>
        </div>

        {/* Governing Equation */}
        <div className="inspector-section">
          <div className="section-title">
            <Activity size={14} className="text-purple-400" />
            Governing Physics / Math Formula
          </div>
          <div className="formula-box font-mono">{data.formula}</div>
        </div>

        {/* Live Operating Telemetry for this component */}
        <div className="inspector-section">
          <div className="section-title">
            <Zap size={14} className="text-amber-400" />
            Live Operating Parameters
          </div>
          <div className="live-params-grid">
            {selectedKey === 'motor' && (
              <>
                <div className="param-item">
                  <span className="param-label">Actual Speed:</span>
                  <span className="param-val">{formatRpm(simState.actualRpm)} RPM</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Motor Torque:</span>
                  <span className="param-val">{formatTorque(simState.motorTorque)} N&bull;m</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Mechanical Power:</span>
                  <span className="param-val">{simState.powerMech.toFixed(1)} W</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Back-EMF:</span>
                  <span className="param-val">{((simState.actualRpm * 2 * Math.PI / 60) * 0.065).toFixed(1)} V</span>
                </div>
              </>
            )}

            {selectedKey === 'encoder' && (
              <>
                <div className="param-item">
                  <span className="param-label">Pulse Frequency:</span>
                  <span className="param-val">{Math.round(simState.encoderFreq)} Hz</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Total Pulses:</span>
                  <span className="param-val">{simState.encoderPulses.toLocaleString()}</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Signal Status:</span>
                  <span className={`param-val ${simState.faults.isEncoderHealthy ? 'text-emerald-400' : 'text-red-400'}`}>
                    {simState.faults.isEncoderHealthy ? 'HEALTHY' : 'INVALID (DISCONNECTED)'}
                  </span>
                </div>
                <div className="param-item">
                  <span className="param-label">Resolution:</span>
                  <span className="param-val">1024 CPR (4096 Quad)</span>
                </div>
              </>
            )}

            {selectedKey === 'driver' && (
              <>
                <div className="param-item">
                  <span className="param-label">Applied PWM:</span>
                  <span className="param-val">{formatDuty(simState.pwmDuty)}%</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Switching Freq:</span>
                  <span className="param-val">20.0 kHz</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Effective Voltage:</span>
                  <span className="param-val">{((simState.pwmDuty / 100) * simState.voltage).toFixed(1)} V</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Inverter State:</span>
                  <span className="param-val">{simState.isRunning && !simState.faults.isLatched ? 'DRIVING' : 'DISABLED'}</span>
                </div>
              </>
            )}

            {selectedKey === 'controller' && (
              <>
                <div className="param-item">
                  <span className="param-label">Core Clock:</span>
                  <span className="param-val">480 MHz (Cortex-M7)</span>
                </div>
                <div className="param-item">
                  <span className="param-label">PID Loop Rate:</span>
                  <span className="param-val">100 Hz (Ts = 10ms)</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Speed Error:</span>
                  <span className="param-val">{Math.round(simState.speedError)} RPM</span>
                </div>
                <div className="param-item">
                  <span className="param-label">SysTick Status:</span>
                  <span className="param-val text-emerald-400">ACTIVE TICK</span>
                </div>
              </>
            )}

            {selectedKey === 'load' && (
              <>
                <div className="param-item">
                  <span className="param-label">Load Torque:</span>
                  <span className="param-val">{formatTorque(simState.loadTorque)} N&bull;m</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Flywheel Inertia:</span>
                  <span className="param-val">0.0016 kg&bull;m&sup2;</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Coupling Type:</span>
                  <span className="param-val">Flexible Jaw Spider</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Brake Drag:</span>
                  <span className="param-val">{((simState.loadTorque / 2.2) * 100).toFixed(0)}% Saturated</span>
                </div>
              </>
            )}

            {(selectedKey === 'currentSensor' || selectedKey === 'powerSupply') && (
              <>
                <div className="param-item">
                  <span className="param-label">Current:</span>
                  <span className="param-val">{formatCurrent(simState.current)} A</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Bus Voltage:</span>
                  <span className="param-val">{simState.voltage.toFixed(1)} V</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Input Power:</span>
                  <span className="param-val">{(simState.current * simState.voltage).toFixed(1)} W</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Trip Threshold:</span>
                  <span className="param-val">&gt; 11.5 A</span>
                </div>
              </>
            )}

            {selectedKey === 'tempSensor' && (
              <>
                <div className="param-item">
                  <span className="param-label">Stator Temp:</span>
                  <span className="param-val">{formatTemp(simState.temperature)} &deg;C</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Ambient Temp:</span>
                  <span className="param-val">24.0 &deg;C</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Sensor Type:</span>
                  <span className="param-val">Class A PT100 RTD</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Thermal Cutoff:</span>
                  <span className="param-val">80.0 &deg;C</span>
                </div>
              </>
            )}

            {selectedKey === 'canTransceiver' && (
              <>
                <div className="param-item">
                  <span className="param-label">Bus Status:</span>
                  <span className="param-val">{simState.telemetry.busStatus}</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Frames Sent:</span>
                  <span className="param-val">{simState.telemetry.totalTx}</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Nominal Bitrate:</span>
                  <span className="param-val">1 Mbps (5 Mbps Data)</span>
                </div>
                <div className="param-item">
                  <span className="param-label">Termination:</span>
                  <span className="param-val">120 &Omega; Active</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Signal Inputs & Outputs */}
        <div className="inspector-section">
          <div className="section-title">
            <Layers size={14} className="text-emerald-400" />
            Signal Interconnects
          </div>
          <div className="io-group">
            <div className="io-col">
              <div className="io-heading">Inputs:</div>
              {data.inputs.map((inp, idx) => (
                <div key={idx} className="io-card">
                  <div className="font-semibold text-slate-200">{inp.name}</div>
                  <div className="text-slate-400 text-xs">From: {inp.source}</div>
                  <div className="text-cyan-300 font-mono text-xs">{inp.type}</div>
                </div>
              ))}
            </div>
            <div className="io-col">
              <div className="io-heading">Outputs:</div>
              {data.outputs.map((out, idx) => (
                <div key={idx} className="io-card">
                  <div className="font-semibold text-slate-200">{out.name}</div>
                  <div className="text-slate-400 text-xs">To: {out.dest}</div>
                  <div className="text-emerald-300 font-mono text-xs">{out.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
