/**
 * Guided Simulation State Machine
 *
 * Manages the interactive 10-step embedded motor control lesson:
 * - Deterministic step definitions with physical focus targets
 * - Intelligent camera target mappings
 * - Concise, beginner-friendly explanations tailored for component annotations
 * - Real simulation synchronization (waits for real physical events)
 * - Auto-progression and manual navigation
 */

export const GUIDED_STEPS = [
  {
    step: 1,
    id: 'TARGET_SPEED',
    title: 'Target Speed Selection',
    shortTitle: 'TARGET SPEED',
    focusComponent: 'controller',
    focusWire: null,
    targetRpm: 1500,
    setupAction: 'SET_TARGET_1500',
    signalDirection: 'Host Interface → STM32H7 Core',
    shortExplanation:
      'The engineer selects a target speed setpoint (SP = 1500 RPM). The STM32H7 Cortex-M7 computes the initial error before starting the drive.',
    detailedExplanation:
      'The engineer selects a desired motor speed setpoint (SP = 1500 RPM). The STM32H7 Cortex-M7 microcontroller initializes the closed-loop control task and calculates the initial control error (Error = Target - Actual = 1500 RPM).',
    liveKeys: ['targetRpm', 'actualRpm', 'speedError'],
    nextHint: 'Click "Play" or "Next" to generate the PWM command.',
    autoAdvanceCondition: (state, stepElapsed) => stepElapsed > 3.5,
  },
  {
    step: 2,
    id: 'PWM_GENERATION',
    title: 'PWM Signal Generation',
    shortTitle: 'PWM GENERATION',
    focusComponent: 'controller',
    secondaryFocus: 'driver',
    focusWire: 'pwm',
    setupAction: 'START_DRIVE',
    signalDirection: 'Controller → Motor Driver',
    shortExplanation:
      'The STM32H7 timer generates a 20 kHz PWM signal to control the motor driver\'s output voltage.',
    detailedExplanation:
      'The STM32H7 Advanced Timer (TIM1_CH1) generates a 20 kHz pulse-width modulated (PWM) control signal. The duty cycle dictates the effective average voltage supplied to the motor armature.',
    liveKeys: ['pwmDuty', 'pidOutput', 'speedError'],
    nextHint: 'Observe the cyan pulse packets traveling from the STM32 board to the driver PCB.',
    autoAdvanceCondition: (state, stepElapsed) => state.pwmDuty > 5.0 && stepElapsed > 3.0,
  },
  {
    step: 3,
    id: 'DRIVER_ACTIVATION',
    title: 'Motor Driver Activation',
    shortTitle: 'DRIVER ACTIVATION',
    focusComponent: 'driver',
    focusWire: 'power',
    setupAction: null,
    signalDirection: 'Driver PCB → Motor Terminals',
    shortExplanation:
      'The H-bridge driver receives the PWM logic signal and switches high-power 24V bus current to the motor windings.',
    detailedExplanation:
      'The H-Bridge MOSFET driver PCB receives the low-voltage PWM logic command. Four high-power N-channel MOSFETs switch the 24V DC bus power to the motor phase terminals without dissipating excess voltage as wasteful heat.',
    liveKeys: ['voltage', 'current', 'pwmDuty'],
    nextHint: 'Notice the high-current power path (orange pulses) flowing toward the motor.',
    autoAdvanceCondition: (state, stepElapsed) => state.current > 0.4 && stepElapsed > 3.0,
  },
  {
    step: 4,
    id: 'MOTOR_ACCELERATION',
    title: 'Motor Acceleration',
    shortTitle: 'MOTOR ACCELERATION',
    focusComponent: 'motor',
    focusWire: 'power',
    setupAction: null,
    signalDirection: 'Magnetic Field → Rotor Shaft',
    shortExplanation:
      'Armature current creates electromagnetic torque. The rotor shaft accelerates against mechanical inertia and bearing friction.',
    detailedExplanation:
      'Armature current generates electromagnetic torque (Tm = Kt × I). The motor shaft, flexible spider coupling, and flywheel accelerate against mechanical inertia (J) and bearing friction (B). The shaft cannot jump to speed instantaneously.',
    liveKeys: ['actualRpm', 'current', 'motorTorque'],
    nextHint: 'Watch the rotor shaft timing marker accelerate as speed builds up.',
    autoAdvanceCondition: (state, stepElapsed) => state.actualRpm > 600 && stepElapsed > 2.5,
  },
  {
    step: 5,
    id: 'ENCODER_FEEDBACK',
    title: 'Encoder Speed Feedback',
    shortTitle: 'ENCODER FEEDBACK',
    focusComponent: 'encoder',
    focusWire: 'encoder',
    setupAction: null,
    signalDirection: 'Encoder → STM32H7 TIM2',
    shortExplanation:
      'The optical encoder measures rotation and streams quadrature pulses back to the STM32 timer to calculate precise RPM.',
    detailedExplanation:
      'An optical encoder on the rear shaft rotates its 1024-slit disk between infrared optical interrupters. Two phase-shifted channels (A & B) stream pulses to STM32 Timer TIM2, decoding 4096 quadrature edges/rev to measure precise RPM in real time.',
    liveKeys: ['actualRpm', 'encoderFreq', 'encoderPulses'],
    nextHint: 'Observe emerald green feedback pulses streaming back toward the STM32 board.',
    autoAdvanceCondition: (state, stepElapsed) => state.actualRpm > 1000 && stepElapsed > 3.0,
  },
  {
    step: 6,
    id: 'PID_COMPARISON',
    title: 'PID Error Calculation',
    shortTitle: 'PID CALCULATION',
    focusComponent: 'controller',
    focusWire: null,
    setupAction: null,
    signalDirection: 'Feedback → Error → PID Output',
    shortExplanation:
      'The STM32 PID loop compares target and actual RPM. P, I, and D terms compute the exact correction needed.',
    detailedExplanation:
      'The STM32 100 Hz PID algorithm subtracts actual encoder speed from target speed to calculate error. Proportional (Kp), Integral (Ki with anti-windup), and low-pass filtered Derivative (Kd) terms compute the necessary control effort.',
    liveKeys: ['targetRpm', 'actualRpm', 'speedError', 'pTerm', 'iTerm', 'dTerm'],
    nextHint: 'The PID controller acts as the system brain, balancing responsiveness and stability.',
    autoAdvanceCondition: (state, stepElapsed) => stepElapsed > 3.5,
  },
  {
    step: 7,
    id: 'PWM_ADJUSTMENT',
    title: 'PWM Duty Adjustment',
    shortTitle: 'PWM ADJUSTMENT',
    focusComponent: 'driver',
    secondaryFocus: 'controller',
    focusWire: 'pwm',
    setupAction: null,
    signalDirection: 'Controller → Motor Driver',
    shortExplanation:
      'As rotor speed nears 1500 RPM, the controller throttles PWM duty cycle to prevent overshoot and maintain steady speed.',
    detailedExplanation:
      'As the motor speed nears 1500 RPM, the error diminishes. The controller automatically reduces PWM duty cycle from initial acceleration levels to a steady-state sustaining level (~48% duty cycle).',
    liveKeys: ['pwmDuty', 'speedError', 'current'],
    nextHint: 'Watch the pulse speed and duty cycle settle to maintain the exact speed demand.',
    autoAdvanceCondition: (state, stepElapsed) => Math.abs(state.speedError) < 150 && stepElapsed > 2.5,
  },
  {
    step: 8,
    id: 'SPEED_STABILIZES',
    title: 'Speed Stabilization',
    shortTitle: 'SPEED STABILIZATION',
    focusComponent: 'motor',
    focusWire: null,
    setupAction: null,
    signalDirection: 'Equilibrium: Motor Torque = Drag',
    shortExplanation:
      'The motor achieves steady-state closed-loop regulation. Electromagnetic torque balances bearing friction and minor drag.',
    detailedExplanation:
      'The motor settles at the 1500 RPM target. Steady-state error is eliminated by the integral accumulator. The system is in dynamic equilibrium: electromagnetic motor torque exactly balances friction and minor drag.',
    liveKeys: ['targetRpm', 'actualRpm', 'speedError', 'powerMech'],
    nextHint: 'The motor has achieved closed-loop regulation. Next: test how it responds to mechanical load!',
    autoAdvanceCondition: (state, stepElapsed) => Math.abs(state.speedError) < 40 && stepElapsed > 3.0,
  },
  {
    step: 9,
    id: 'LOAD_DISTURBANCE',
    title: 'Load Disturbance & Recovery',
    shortTitle: 'LOAD DISTURBANCE',
    focusComponent: 'load',
    focusWire: 'power',
    setupAction: 'APPLY_STEP_LOAD',
    signalDirection: 'Brake Torque → Speed Droop → PID Boost',
    shortExplanation:
      'Mechanical brake applies +0.45 N·m opposing load. The encoder detects speed droop, and PID increases PWM to recover 1500 RPM.',
    detailedExplanation:
      'A mechanical brake applies opposing torque (+0.45 N·m). Speed momentarily droops; the encoder detects the drop; PID responds by raising PWM duty cycle and drawing more current to restore 1500 RPM!',
    liveKeys: ['loadTorque', 'actualRpm', 'speedError', 'pwmDuty', 'current'],
    nextHint: 'Notice the transient speed drop and rapid closed-loop recovery.',
    autoAdvanceCondition: (state, stepElapsed) => stepElapsed > 4.5 && Math.abs(state.speedError) < 45,
  },
  {
    step: 10,
    id: 'FAULT_DETECTION',
    title: 'Fault Detection & Safe State',
    shortTitle: 'FAULT INTERLOCK',
    focusComponent: 'encoder',
    secondaryFocus: 'controller',
    focusWire: 'encoder',
    setupAction: 'INJECT_ENCODER_FAULT',
    signalDirection: 'Missing Feedback → PWM 0% Interlock',
    shortExplanation:
      'Encoder failure is detected. The controller locks PWM to 0%, engages safety interlocks, and broadcasts emergency CAN telemetry.',
    detailedExplanation:
      'A fault is injected (Encoder signal loss). The STM32 detects missing feedback. Instead of running blindly out of control, the controller locks PWM to 0%, lights the red FAULT LED, and broadcasts a CAN emergency alert (0x070).',
    liveKeys: ['actualRpm', 'pwmDuty', 'faultStatus', 'busStatus'],
    nextHint: 'Protective shutdown complete! You can click "Clear Trip" or restart the demonstration anytime.',
    autoAdvanceCondition: (state, stepElapsed) => false,
  },
];
