/**
 * Fault Detection and Protection Manager
 *
 * Implements deterministic safety interlocks:
 * - Overcurrent hardware comparator / digital threshold trip
 * - Stator overtemperature thermal cutoff
 * - Incremental encoder signal loss detection
 * - CAN / FDCAN bus error injection and bus-off latch
 */

import { FAULT_THRESHOLDS } from '../utils/constants.js';

export const FAULT_CODES = {
  NONE: 'NONE',
  OVERCURRENT: 'ERR_OVERCURRENT',
  OVERTEMP: 'ERR_OVERTEMPERATURE',
  ENCODER_LOSS: 'ERR_ENCODER_SIGNAL_LOSS',
  CAN_BUS_OFF: 'ERR_CAN_BUS_FAILURE',
};

export class FaultManager {
  constructor(thresholds = {}) {
    this.thresholds = { ...FAULT_THRESHOLDS, ...thresholds };
    this.reset();
  }

  reset() {
    this.injectedFaults = {
      overcurrent: false,
      overtemp: false,
      encoderLoss: false,
      canFailure: false,
    };

    this.activeFaults = [];
    this.latchedTrip = false;
    this.tripReason = null;
    this.tripTimestamp = null;
    this.protectionActive = false;
    this.overcurrentTimer = 0.0;
  }

  /**
   * Inject or clear manual fault
   */
  setInjectedFault(faultKey, isEnabled) {
    if (this.injectedFaults[faultKey] !== undefined) {
      this.injectedFaults[faultKey] = Boolean(isEnabled);
    }
  }

  toggleInjectedFault(faultKey) {
    if (this.injectedFaults[faultKey] !== undefined) {
      this.injectedFaults[faultKey] = !this.injectedFaults[faultKey];
      return this.injectedFaults[faultKey];
    }
    return false;
  }

  /**
   * Evaluate simulation state against safety thresholds and injected faults
   * @param {object} state Current simulation parameters { current, temperature, simTime, dt }
   */
  evaluate(state) {
    const { current, temperature, simTime, dt = 0.01 } = state;
    const newFaults = [];

    // 1. Overcurrent check (physical sustained or injected)
    if (current > this.thresholds.overcurrentTripA) {
      this.overcurrentTimer += dt;
    } else {
      this.overcurrentTimer = Math.max(0.0, this.overcurrentTimer - dt * 2);
    }

    // Trips after 60ms of sustained overcurrent or immediately on manual injection
    const isOvercurrent = this.injectedFaults.overcurrent || (this.overcurrentTimer >= 0.06);
    if (isOvercurrent) {
      newFaults.push({
        code: FAULT_CODES.OVERCURRENT,
        name: 'Overcurrent Trip (I > 11.5A)',
        severity: 'CRITICAL',
        protectiveAction: 'PWM Gate Drive Disabled immediately to protect H-bridge',
        time: simTime,
      });
      if (!this.latchedTrip) {
        this.latchedTrip = true;
        this.tripReason = 'Motor Armature Overcurrent Trip';
        this.tripTimestamp = simTime;
      }
    }

    // 2. Overtemperature check (physical or injected)
    const isOvertemp = this.injectedFaults.overtemp || (temperature > this.thresholds.overtempTripC);
    if (isOvertemp) {
      newFaults.push({
        code: FAULT_CODES.OVERTEMP,
        name: 'Stator Overtemperature Cutoff (T > 80°C)',
        severity: 'CRITICAL',
        protectiveAction: 'Thermal Shutdown: PWM Output Locked at 0%',
        time: simTime,
      });
      if (!this.latchedTrip) {
        this.latchedTrip = true;
        this.tripReason = 'Stator Thermal Limit Exceeded';
        this.tripTimestamp = simTime;
      }
    }

    // 3. Encoder signal loss
    if (this.injectedFaults.encoderLoss) {
      newFaults.push({
        code: FAULT_CODES.ENCODER_LOSS,
        name: 'Encoder Quad Signal Loss',
        severity: 'CRITICAL',
        protectiveAction: 'Closed-loop Feedback Invalid: Controller Disables Drive for Safety',
        time: simTime,
      });
      if (!this.latchedTrip) {
        this.latchedTrip = true;
        this.tripReason = 'Encoder Feedback Signal Broken';
        this.tripTimestamp = simTime;
      }
    }

    // 4. CAN / FDCAN bus failure
    if (this.injectedFaults.canFailure) {
      newFaults.push({
        code: FAULT_CODES.CAN_BUS_OFF,
        name: 'FDCAN1 Bus-Off / Transceiver Disconnect',
        severity: 'WARNING',
        protectiveAction: 'CAN Frame Transmission Halted; Local Speed Control Continues',
        time: simTime,
      });
    }

    this.activeFaults = newFaults;
    this.protectionActive = this.latchedTrip;

    return {
      activeFaults: this.activeFaults,
      isTripLatched: this.latchedTrip,
      tripReason: this.tripReason,
      isDriverAllowed: !this.latchedTrip,
      isEncoderHealthy: !this.injectedFaults.encoderLoss,
      isCanHealthy: !this.injectedFaults.canFailure,
    };
  }

  /**
   * Attempt to clear latched faults (e.g. after user fixes condition)
   */
  clearFaults(current, temperature) {
    // Cannot clear if conditions still exceed trip limits or fault is still injected
    if (this.injectedFaults.overcurrent || current > this.thresholds.overcurrentTripA) {
      return { success: false, reason: 'Current still exceeds safe limit or fault is injected' };
    }
    if (this.injectedFaults.overtemp || temperature > this.thresholds.overtempTripC) {
      return { success: false, reason: 'Motor temperature still above thermal cutoff (80°C)' };
    }
    if (this.injectedFaults.encoderLoss) {
      return { success: false, reason: 'Encoder signal loss toggle is still active' };
    }

    this.latchedTrip = false;
    this.tripReason = null;
    this.tripTimestamp = null;
    this.protectionActive = false;
    return { success: true };
  }
}
