/**
 * Discrete-time Industrial PID Speed Controller
 *
 * Designed for STM32H7 Embedded Control Tasks:
 * - Anti-windup clamping on integral accumulator
 * - Derivative-on-measurement (D on PV) to prevent setpoint kick
 * - First-order low-pass filter on derivative term
 * - Saturated output to 0.0% - 100.0% PWM duty cycle
 * - Robust handling of missing/invalid encoder feedback
 */

import { PID_DEFAULTS } from '../utils/constants.js';

export class PidController {
  constructor(gains = {}) {
    this.kp = gains.kp ?? PID_DEFAULTS.kp;
    this.ki = gains.ki ?? PID_DEFAULTS.ki;
    this.kd = gains.kd ?? PID_DEFAULTS.kd;
    this.minOutput = gains.minOutput ?? PID_DEFAULTS.minOutput;
    this.maxOutput = gains.maxOutput ?? PID_DEFAULTS.maxOutput;
    this.sampleTime = gains.sampleTime ?? PID_DEFAULTS.sampleTime;
    this.tau = gains.derivativeFilterTau ?? PID_DEFAULTS.derivativeFilterTau;

    this.reset();
  }

  reset() {
    this.integral = 0.0;
    this.prevMeasured = 0.0;
    this.prevError = 0.0;
    this.dFiltered = 0.0;
    this.output = 0.0;
    this.pTerm = 0.0;
    this.iTerm = 0.0;
    this.dTerm = 0.0;
    this.lastError = 0.0;
    this.timeSinceLastSample = 0.0;
  }

  setGains(kp, ki, kd) {
    if (typeof kp === 'number') this.kp = Math.max(0.0, kp);
    if (typeof ki === 'number') this.ki = Math.max(0.0, ki);
    if (typeof kd === 'number') this.kd = Math.max(0.0, kd);
  }

  /**
   * Update PID calculation
   * @param {number} targetRpm Target setpoint in RPM
   * @param {number|null} measuredRpm Feedback speed in RPM from encoder (or null if faulty)
   * @param {number} dt Time elapsed since last call
   * @param {boolean} isEncoderValid True if encoder signal is healthy
   * @returns {number} Saturated PWM duty cycle [0, 100]%
   */
  compute(targetRpm, measuredRpm, dt, isEncoderValid = true) {
    if (!isEncoderValid || measuredRpm === null || isNaN(measuredRpm)) {
      // Degraded safe state: Cannot perform closed-loop control without valid feedback
      this.pTerm = 0.0;
      this.iTerm = 0.0;
      this.dTerm = 0.0;
      this.output = 0.0;
      return 0.0;
    }

    const Ts = dt > 0 ? dt : this.sampleTime;

    // 1. Error calculation: e[k] = SP[k] - PV[k]
    const error = targetRpm - measuredRpm;
    this.lastError = error;

    // 2. Proportional Term: P = Kp * error
    this.pTerm = this.kp * error;

    // 3. Integral Term with anti-windup clamping:
    // Only accumulate integral when output is not saturated, or if error opposes saturation
    const tentativeIntegral = this.integral + error * Ts;
    const tentativeOutput = this.pTerm + this.ki * tentativeIntegral;

    if (tentativeOutput >= this.minOutput && tentativeOutput <= this.maxOutput) {
      this.integral = tentativeIntegral;
    } else {
      // Clamp integral if we would saturate further in that direction
      if ((tentativeOutput > this.maxOutput && error < 0) || (tentativeOutput < this.minOutput && error > 0)) {
        this.integral = tentativeIntegral;
      }
    }
    this.iTerm = this.ki * this.integral;

    // 4. Derivative-on-measurement (D on PV) with low-pass filter
    // dPV/dt: we differentiate -PV to avoid setpoint kick on target step change
    const deltaPv = measuredRpm - this.prevMeasured;
    const rawD = Ts > 0 ? -deltaPv / Ts : 0.0;
    
    // Low-pass filter: alpha = Ts / (tau + Ts)
    const alpha = Ts / (this.tau + Ts);
    this.dFiltered = this.dFiltered + alpha * (rawD - this.dFiltered);
    this.dTerm = this.kd * this.dFiltered;

    this.prevMeasured = measuredRpm;
    this.prevError = error;

    // 5. Total Unconstrained Output
    const rawOutput = this.pTerm + this.iTerm + this.dTerm;

    // 6. Saturation limits: [0%, 100%] PWM duty cycle
    this.output = Math.max(this.minOutput, Math.min(this.maxOutput, rawOutput));

    // When target speed is 0 and motor is stopped, reset integral to prevent creep
    if (targetRpm <= 0 && measuredRpm < 5) {
      this.integral = 0.0;
      this.output = 0.0;
    }

    return this.output;
  }
}
