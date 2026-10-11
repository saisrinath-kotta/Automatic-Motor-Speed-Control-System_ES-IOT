/**
 * Master Simulation Engine
 *
 * Coordinates:
 * - Real-time DC motor differential equations
 * - STM32H7 100Hz PID control task
 * - Optical encoder pulse emulation
 * - Fault detection & protective interlocks
 * - FDCAN telemetry transmission
 */

import { MotorModel } from './motorModel.js';
import { PidController } from './pidController.js';
import { FaultManager } from './faultManager.js';
import { CanTelemetryManager } from './telemetry.js';
import { EventLogger } from './eventLogger.js';
import { ENCODER_CONFIG } from '../utils/constants.js';

export class SimulationEngine {
  constructor() {
    this.motor = new MotorModel();
    this.pid = new PidController();
    this.faults = new FaultManager();
    this.telemetry = new CanTelemetryManager();
    this.logger = new EventLogger();

    this.simTime = 0.0;
    this.isRunning = false;
    this.targetRpm = 1500;       // Default target 1500 RPM
    this.rampedSetpoint = 0.0;   // Ramped setpoint for soft start
    this.loadTorque = 0.0;       // Opposing torque in N·m
    this.supplyVoltage = 24.0;   // DC Bus voltage

    this.encoderPulses = 0;
    this.encoderFreq = 0;
    this.measuredRpm = 0.0;
    this.pwmDuty = 0.0;

    // Load step test helper
    this.stepTest = {
      active: false,
      duration: 2.0,
      elapsed: 0.0,
      prevLoad: 0.0,
      stepLoad: 1.2,
    };
  }

  reset() {
    this.motor.reset();
    this.pid.reset();
    this.faults.reset();
    this.telemetry.reset();
    this.logger.reset();

    this.simTime = 0.0;
    this.isRunning = false;
    this.rampedSetpoint = 0.0;
    this.encoderPulses = 0;
    this.encoderFreq = 0;
    this.measuredRpm = 0.0;
    this.pwmDuty = 0.0;
    this.stepTest.active = false;
  }

  start() {
    this.isRunning = true;
  }

  stop() {
    this.isRunning = false;
    this.pwmDuty = 0.0;
    this.pid.reset();
  }

  setTargetRpm(val) {
    this.targetRpm = Math.max(0, Math.min(3200, Number(val)));
  }

  setLoadTorque(val) {
    this.loadTorque = Math.max(0.0, Math.min(2.5, Number(val)));
  }

  setSupplyVoltage(val) {
    this.supplyVoltage = Math.max(12.0, Math.min(36.0, Number(val)));
  }

  triggerStepLoad(stepAmount = 0.45, duration = 2.5) {
    this.stepTest = {
      active: true,
      duration: duration,
      elapsed: 0.0,
      prevLoad: this.loadTorque,
      stepLoad: Math.min(2.0, this.loadTorque + stepAmount),
    };
    this.loadTorque = this.stepTest.stepLoad;
  }

  /**
   * Advance simulation by dt seconds
   * @param {number} dt Time step in seconds
   */
  step(dt) {
    if (dt <= 0 || isNaN(dt)) return this.getState();

    // Cap dt to prevent numerical explosion on background tab throttling
    const safeDt = Math.min(dt, 0.05);
    this.simTime += safeDt;

    // Handle temporary step load disturbance
    if (this.stepTest.active) {
      this.stepTest.elapsed += safeDt;
      if (this.stepTest.elapsed >= this.stepTest.duration) {
        this.loadTorque = this.stepTest.prevLoad;
        this.stepTest.active = false;
      }
    }

    // 1. Smooth setpoint acceleration ramp generator (1500 RPM / second)
    if (this.isRunning) {
      const maxRampStep = 1800.0 * safeDt;
      if (this.rampedSetpoint < this.targetRpm) {
        this.rampedSetpoint = Math.min(this.targetRpm, this.rampedSetpoint + maxRampStep);
      } else if (this.rampedSetpoint > this.targetRpm) {
        this.rampedSetpoint = Math.max(this.targetRpm, this.rampedSetpoint - maxRampStep);
      }
    } else {
      this.rampedSetpoint = 0.0;
    }

    // 2. Evaluate safety interlocks and faults
    const faultStatus = this.faults.evaluate({
      current: this.motor.current,
      temperature: this.motor.temperature,
      simTime: this.simTime,
      dt: safeDt,
    });

    const isDriverAllowed = faultStatus.isDriverAllowed && this.isRunning;
    const isEncoderHealthy = faultStatus.isEncoderHealthy;

    // 3. Optical Encoder measurement emulation
    // 1024 CPR quadrature encoder
    if (isEncoderHealthy) {
      // Measured RPM represents actual motor RPM with a minor quantization and sensor noise
      this.measuredRpm = this.motor.rpm;
      this.encoderFreq = (this.measuredRpm / 60.0) * ENCODER_CONFIG.linesPerRev;
      const dPulses = Math.round((this.motor.omega / (2.0 * Math.PI)) * ENCODER_CONFIG.linesPerRev * safeDt);
      this.encoderPulses += Math.max(0, dPulses);
    } else {
      // Feedback lost! Invalid or 0
      this.measuredRpm = null;
      this.encoderFreq = 0;
    }

    // 4. STM32H7 PID Control Loop (100 Hz timer task)
    if (isDriverAllowed && isEncoderHealthy) {
      this.pwmDuty = this.pid.compute(this.rampedSetpoint, this.measuredRpm, safeDt, true);
    } else {
      // When stopped, faulted, or encoder missing, drive is disabled (PWM = 0%)
      this.pwmDuty = 0.0;
      this.pid.compute(0, 0, safeDt, false);
    }

    // 5. Physical Motor Integration
    this.motor.step(safeDt, this.pwmDuty, this.supplyVoltage, this.loadTorque, isDriverAllowed);

    // 5. CAN / FDCAN Telemetry Generation
    this.telemetry.update({
      simTime: this.simTime,
      targetRpm: this.targetRpm,
      actualRpm: this.motor.rpm,
      pwmDuty: this.pwmDuty,
      current: this.motor.current,
      voltage: this.supplyVoltage,
      temperature: this.motor.temperature,
      encoderPulses: this.encoderPulses,
      encoderFreq: this.encoderFreq,
      isTripLatched: faultStatus.isTripLatched,
      activeFaults: faultStatus.activeFaults,
    }, safeDt, faultStatus.isCanHealthy);

    const state = this.getState();
    this.logger.update(state);
    return state;
  }

  getState() {
    return {
      simTime: this.simTime,
      isRunning: this.isRunning,
      targetRpm: this.targetRpm,
      actualRpm: this.motor.rpm,
      measuredRpm: this.measuredRpm,
      speedError: this.targetRpm - this.motor.rpm,
      pwmDuty: this.pwmDuty,
      current: this.motor.current,
      voltage: this.supplyVoltage,
      temperature: this.motor.temperature,
      loadTorque: this.loadTorque,
      motorTorque: this.motor.torqueMotor,
      powerMech: this.motor.powerMech,
      powerLoss: this.motor.powerLoss,
      rotorAngle: this.motor.angle,
      encoderPulses: this.encoderPulses,
      encoderFreq: this.encoderFreq,
      pid: {
        kp: this.pid.kp,
        ki: this.pid.ki,
        kd: this.pid.kd,
        pTerm: this.pid.pTerm,
        iTerm: this.pid.iTerm,
        dTerm: this.pid.dTerm,
        output: this.pid.output,
      },
      faults: {
        active: this.faults.activeFaults,
        isLatched: this.faults.latchedTrip,
        tripReason: this.faults.tripReason,
        injected: { ...this.faults.injectedFaults },
        isEncoderHealthy: !this.faults.injectedFaults.encoderLoss,
        isCanHealthy: !this.faults.injectedFaults.canFailure,
      },
      telemetry: {
        messages: this.telemetry.messageLog,
        busStatus: this.telemetry.busStatus,
        totalTx: this.telemetry.totalTxCount,
      },
      stepTest: { ...this.stepTest },
      events: this.logger.events,
    };
  }
}
