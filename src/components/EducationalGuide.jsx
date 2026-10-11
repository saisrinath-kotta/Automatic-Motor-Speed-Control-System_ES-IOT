/**
 * EducationalGuide: Interactive 10-Step Laboratory Tutorial & Embedded Theory
 */

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

const TUTORIAL_STEPS = [
  {
    step: 1,
    title: 'The Closed-Loop Motor Control Concept',
    cameraPreset: 'overview',
    content: 'Welcome to the STM32H7 Embedded Control Laboratory! In an open-loop system, if you power a motor and load changes, it slows down and nobody knows. In this closed-loop system, the STM32H7 microcontroller continuously measures actual speed, calculates error against target speed, and auto-adjusts PWM power 100 times every second.',
    tip: 'Notice the entire drive train: DC Motor, Optical Encoder, Flexible Coupler, and Friction Brake.',
  },
  {
    step: 2,
    title: 'Step 1: Starting the Motor Drive',
    cameraPreset: 'motor',
    content: 'Click the green "Start Drive" button on the left panel. As the motor starts, the H-bridge driver outputs a high PWM duty cycle. The armature current surges briefly as electrical energy builds torque (Tm = Kt × I) to accelerate the mechanical inertia of the rotor and flywheel.',
    tip: 'Watch the white stripe on the spinning motor shaft and observe the actual RPM rising toward the target setpoint.',
  },
  {
    step: 3,
    title: 'Step 2: Pulse Width Modulation (PWM)',
    cameraPreset: 'driver',
    content: 'Why not just change the voltage linearly? Linear transistors drop excess voltage as wasteful heat. Instead, the STM32 TIM1 timer switches the MOSFETs fully ON and fully OFF at 20 kHz. By varying the duty cycle (e.g. 50%), the average motor voltage is exactly 12V with over 95% electrical efficiency.',
    tip: 'Look at the cyan traveling pulses along the wire from STM32 to the Driver board. When duty cycle increases, pulse activity intensifies!',
  },
  {
    step: 4,
    title: 'Step 3: Optical Encoder Speed Feedback',
    cameraPreset: 'motor',
    content: 'Attached to the rear shaft is an optical encoder with a transparent slotted disk (1024 slots). As it spins, it interrupts infrared light beams, creating high-frequency pulses. The STM32 TIM2 hardware counter reads these pulses to calculate the exact real-time speed in RPM without burdening the CPU.',
    tip: 'Notice the green pulses streaming from the encoder back to the STM32 board. Fast spinning means higher pulse frequency!',
  },
  {
    step: 5,
    title: 'Step 4: Mechanical Load Disturbance',
    cameraPreset: 'overview',
    content: 'When machinery cuts metal, rolls conveyor belts, or climbs a hill, mechanical resistance increases. Try moving the "Opposing Load Torque" slider to 1.2 N·m, or click "Apply Step Disturbance". The opposing torque suddenly retards the shaft, causing actual RPM to drop momentarily.',
    tip: 'Check the live Oscilloscope chart at the bottom: you will see a clear speed drop ("droop") at the instant load increases.',
  },
  {
    step: 6,
    title: 'Step 5: PID Closed-Loop Recovery',
    cameraPreset: 'controller',
    content: 'When speed drops, Error = (Target - Actual) becomes positive. The PID algorithm instantly calculates: P increases output proportionally, I ramps up to eliminate steady-state offset, and D cushions oscillation. Within tenths of a second, the controller raises PWM duty cycle and restores speed to target despite heavy load!',
    tip: 'PID gives the motor "muscles": it automatically applies more electrical current when heavy mechanical work is demanded.',
  },
  {
    step: 7,
    title: 'Step 6: Current Sensing & Electrical Limits',
    cameraPreset: 'driver',
    content: 'To produce higher torque under load, the motor draws more current (I = T / Kt). The inline Hall-effect sensor measures this current and sends an analog voltage to the STM32 ADC1. Watch the Armature Current gauge rise from 1.5A up to 6A or 8A as load increases.',
    tip: 'Continuous rated current is 8.0 A. Currents above 11.5 A threaten to destroy the MOSFETs and trigger an overcurrent trip.',
  },
  {
    step: 8,
    title: 'Step 7: Motor Thermal Dynamics',
    cameraPreset: 'motor',
    content: 'Every ampere passing through the 1.25 Ω motor winding generates resistive heat (P_loss = I² × Ra). The thermal probe attached to the motor stator monitors temperature in real time. Under prolonged high load, the stator heats up asymptotically toward steady state.',
    tip: 'If temperature reaches 80°C, the STM32 executes an immediate protective thermal shutdown.',
  },
  {
    step: 9,
    title: 'Step 8: Fault Injection & Safety Interlocks',
    cameraPreset: 'overview',
    content: 'Now test the system safety interlocks! Go to the "Faults" tab on the left panel and check "Encoder Feedback Loss". When feedback pulses cease, the controller realizes the feedback is invalid. Rather than running blindly out of control, it immediately inhibits PWM gate drive to ensure machinery safety.',
    tip: 'Notice the encoder wire turning dark, the controller showing "PROTECTIVE TRIP", and emergency alerts appearing on the CAN bus.',
  },
  {
    step: 10,
    title: 'Step 9: CAN / FDCAN Industrial Telemetry',
    cameraPreset: 'controller',
    content: 'In modern industrial automation, the controller does not operate in isolation. The STM32H7 FDCAN peripheral broadcasts speed, current, temperature, and diagnostics to a supervisory PLC or SCADA system. Click the "CAN Telemetry" tab at the bottom to inspect real-time bus frames!',
    tip: 'Congratulations! You have explored the complete closed-loop embedded motor control architecture. You can now freely experiment with custom PID gains and load profiles.',
  },
];

export function EducationalGuide({ isOpen, onClose, onSelectCameraPreset }) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  if (!isOpen) return null;

  const current = TUTORIAL_STEPS[currentStepIdx];

  const handleNext = () => {
    if (currentStepIdx < TUTORIAL_STEPS.length - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      if (TUTORIAL_STEPS[nextIdx].cameraPreset) {
        onSelectCameraPreset(TUTORIAL_STEPS[nextIdx].cameraPreset);
      }
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      const prevIdx = currentStepIdx - 1;
      setCurrentStepIdx(prevIdx);
      if (TUTORIAL_STEPS[prevIdx].cameraPreset) {
        onSelectCameraPreset(TUTORIAL_STEPS[prevIdx].cameraPreset);
      }
    }
  };

  return (
    <div className="guide-modal-overlay">
      <div className="guide-modal-dialog">
        <div className="guide-modal-header">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-cyan-400" />
            <span className="font-bold text-white text-base">
              Embedded Motor Control Interactive Tutorial
            </span>
          </div>
          <button onClick={onClose} className="guide-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Step Progress Dots */}
        <div className="step-dots-row">
          {TUTORIAL_STEPS.map((s, idx) => (
            <button
              key={s.step}
              className={`step-dot ${idx === currentStepIdx ? 'dot-active' : idx < currentStepIdx ? 'dot-completed' : ''}`}
              onClick={() => {
                setCurrentStepIdx(idx);
                onSelectCameraPreset(s.cameraPreset);
              }}
              title={`Step ${s.step}: ${s.title}`}
            >
              {s.step}
            </button>
          ))}
        </div>

        <div className="guide-modal-content">
          <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            Step {current.step} of {TUTORIAL_STEPS.length}
          </div>
          <h2 className="text-xl font-bold text-white mb-3">{current.title}</h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {current.content}
          </p>

          <div className="tip-box">
            <Lightbulb size={18} className="text-amber-400 flex-shrink-0" />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <strong>Observation Tip:</strong> {current.tip}
            </div>
          </div>
        </div>

        <div className="guide-modal-footer">
          <button
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            className="guide-nav-btn"
          >
            <ArrowLeft size={15} />
            <span>Previous</span>
          </button>

          <div className="text-xs text-slate-400 font-mono">
            {currentStepIdx + 1} / {TUTORIAL_STEPS.length}
          </div>

          {currentStepIdx < TUTORIAL_STEPS.length - 1 ? (
            <button onClick={handleNext} className="guide-nav-btn guide-nav-btn-next">
              <span>Next Step</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <button onClick={onClose} className="guide-nav-btn guide-nav-btn-finish">
              <CheckCircle2 size={15} />
              <span>Finish Tutorial</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
