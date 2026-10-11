/**
 * System Constants for STM32H7 Motor Speed Control Digital Twin
 */

export const MOTOR_DEFAULTS = {
  nominalVoltage: 24.0,       // Volts
  armatureResistance: 1.25,   // Ohms (Ra)
  armatureInductance: 0.002,  // Henrys (La) - 2 mH
  torqueConstant: 0.065,      // Nm / A (Kt)
  backEmfConstant: 0.065,     // V / (rad/s) (Ke)
  motorInertia: 0.0008,       // kg·m² (J_motor)
  loadInertia: 0.0016,        // kg·m² (J_load flywheel)
  viscousFriction: 0.00035,   // Nm·s/rad (B)
  coulombFriction: 0.015,     // Nm (dry friction stiction)
  maxRpm: 3200,               // Mechanical limit
  ratedCurrent: 8.0,          // Continuous rated Amperes
  peakCurrent: 15.0,          // Peak stall Amperes
  ambientTemp: 24.0,          // Celsius
  thermalResistance: 1.85,    // °C / Watt
  thermalTimeConstant: 40.0,  // seconds (scaled for responsive visual feedback)
};

export const ENCODER_CONFIG = {
  linesPerRev: 1024,          // CPR (Counts Per Revolution)
  quadratureFactor: 4,        // 4x hardware quadrature decoding in STM32 TIM
  samplePeriodSec: 0.01,      // 10ms speed calculation window (100 Hz timer)
};

export const PID_DEFAULTS = {
  kp: 0.085,
  ki: 0.320,
  kd: 0.004,
  minOutput: 0.0,             // 0% PWM duty cycle
  maxOutput: 100.0,           // 100% PWM duty cycle
  sampleTime: 0.01,           // 10 ms (100 Hz STM32 FreeRTOS control task)
  derivativeFilterTau: 0.015, // Low-pass filter time constant on derivative
};

export const FAULT_THRESHOLDS = {
  overcurrentTripA: 11.5,     // Trips when current exceeds 11.5 A
  overcurrentWarningA: 8.5,
  overtempTripC: 80.0,        // Trips when stator temperature exceeds 80.0 °C
  overtempWarningC: 65.0,
  voltageUnderMinV: 14.0,
  voltageOverMaxV: 34.0,
};

export const CAN_IDS = {
  SPEED_ACTUAL: 0x180,
  ELECTRICAL_DATA: 0x181,
  THERMAL_DATA: 0x182,
  ENCODER_RAW: 0x183,
  SYSTEM_STATUS: 0x190,
  EMERGENCY_FAULT: 0x070,
};

export const CAMERA_PRESETS = {
  overview: {
    position: [5.6, 4.4, 6.2],
    target: [0.0, 0.4, 0.2],
    fov: 40,
    name: 'Lab Overview'
  },
  motor: {
    position: [-0.6, 2.2, 3.2],
    target: [-1.2, 0.6, -0.2],
    fov: 35,
    name: 'Motor & Encoder'
  },
  controller: {
    position: [2.8, 2.6, 2.4],
    target: [2.0, 0.4, 0.4],
    fov: 35,
    name: 'STM32H7 Controller'
  },
  driver: {
    position: [1.2, 2.2, 3.4],
    target: [0.6, 0.4, 0.3],
    fov: 35,
    name: 'Driver PCB'
  },
  wiring: {
    position: [0.0, 6.2, 4.5],
    target: [0.2, 0.3, 0.0],
    fov: 40,
    name: 'Harness & Wiring'
  }
};

/**
 * Intelligent Step-Specific Camera Viewing Targets
 * Smoothly frames the exact hardware components involved in each step
 */
export const STEP_CAMERA_CONFIG = {
  1: { // Step 1: Target speed setpoint on STM32H7 board
    position: [2.8, 1.8, 2.0],
    target: [2.0, 0.35, 0.5],
    fov: 34,
    name: 'STM32H7 Controller',
  },
  2: { // Step 2: TIM1 PWM signal generated (STM32 & Driver & PWM wire)
    position: [1.4, 2.0, 2.3],
    target: [1.3, 0.35, 0.6],
    fov: 36,
    name: 'PWM Signal Path',
  },
  3: { // Step 3: Motor driver activates (H-Bridge PCB & Power wires)
    position: [0.6, 1.8, 2.1],
    target: [0.6, 0.35, 0.6],
    fov: 34,
    name: 'Motor Driver PCB',
  },
  4: { // Step 4: Motor accelerates against inertia (DC Motor & rotating shaft)
    position: [-0.2, 2.0, 2.7],
    target: [-1.4, 0.6, 0.4],
    fov: 36,
    name: 'DC Motor & Shaft',
  },
  5: { // Step 5: Optical encoder feedback (Rear encoder & green cable)
    position: [-0.5, 1.7, -0.4],
    target: [-1.4, 0.5, -1.3],
    fov: 33,
    name: 'Optical Encoder Feedback',
  },
  6: { // Step 6: PID error comparison (STM32H7 PID control loop)
    position: [2.8, 1.8, 2.0],
    target: [2.0, 0.35, 0.5],
    fov: 34,
    name: 'STM32H7 PID Loop',
  },
  7: { // Step 7: Controller modulates PWM duty cycle (Driver & PWM wire)
    position: [1.4, 2.0, 2.3],
    target: [1.3, 0.35, 0.6],
    fov: 36,
    name: 'PWM Duty Adjustment',
  },
  8: { // Step 8: Speed stabilizes at steady state (Wide view motor + controller)
    position: [0.6, 3.2, 4.4],
    target: [0.0, 0.45, 0.2],
    fov: 38,
    name: 'Closed-Loop Regulation',
  },
  9: { // Step 9: Load disturbance & recovery (Flywheel & red brake caliper)
    position: [-0.2, 1.8, 3.6],
    target: [-1.4, 0.55, 2.0],
    fov: 35,
    name: 'Load & Brake Assembly',
  },
  10: { // Step 10: Fault detection & safe shutdown (Encoder failure & interlock)
    position: [-0.5, 1.8, -0.3],
    target: [-1.4, 0.5, -1.3],
    fov: 34,
    name: 'Fault Detection & Safety',
  },
};

