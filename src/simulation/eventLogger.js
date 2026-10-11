/**
 * Event Logger for STM32H7 Motor Simulation
 *
 * Tracks and logs chronological simulation transitions:
 * - Setpoint changes
 * - Drive start/stop
 * - Initial acceleration detection
 * - Encoder feedback acquisition
 * - Near-setpoint stabilization
 * - Load disturbances and droop
 * - PID compensation recovery
 * - Fault trips and clearances
 */

export class EventLogger {
  constructor(maxEvents = 60) {
    this.maxEvents = maxEvents;
    this.events = [];
    this.idCounter = 0;

    // State memory for edge detection
    this.prevState = {
      isRunning: false,
      targetRpm: 0,
      hasAccelerated: false,
      hasStabilized: false,
      prevLoad: 0,
      prevTrip: false,
      isDrooping: false,
      isRecovered: false,
    };
  }

  reset() {
    this.events = [];
    this.idCounter = 0;
    this.prevState = {
      isRunning: false,
      targetRpm: 0,
      hasAccelerated: false,
      hasStabilized: false,
      prevLoad: 0,
      prevTrip: false,
      isDrooping: false,
      isRecovered: false,
    };
    this.log(0.0, 'SYSTEM_RESET', 'Simulation reset to documented initial conditions', 'INFO');
  }

  log(simTime, type, message, severity = 'INFO') {
    this.idCounter++;
    const event = {
      id: this.idCounter,
      time: Number(simTime.toFixed(2)),
      type,
      message,
      severity, // 'INFO' | 'SUCCESS' | 'WARN' | 'ALERT'
    };
    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }
    return event;
  }

  /**
   * Monitor simulation state transitions and generate real event entries
   */
  update(simState) {
    const {
      simTime,
      isRunning,
      targetRpm,
      actualRpm,
      loadTorque,
      pwmDuty,
      faults,
    } = simState;

    // 1. Drive Start / Stop detection
    if (isRunning && !this.prevState.isRunning) {
      this.log(simTime, 'DRIVE_START', `Motor drive initiated: Target set to ${Math.round(targetRpm)} RPM`, 'INFO');
      this.prevState.hasAccelerated = false;
      this.prevState.hasStabilized = false;
    } else if (!isRunning && this.prevState.isRunning) {
      this.log(simTime, 'DRIVE_STOP', 'Motor drive stopped: Inverter output disabled (0% PWM)', 'WARN');
    }
    this.prevState.isRunning = isRunning;

    // 2. Target RPM changes
    if (Math.abs(targetRpm - this.prevState.targetRpm) > 20 && isRunning) {
      this.log(simTime, 'SETPOINT_CHANGE', `Target speed changed from ${Math.round(this.prevState.targetRpm)} to ${Math.round(targetRpm)} RPM`, 'INFO');
      this.prevState.hasStabilized = false;
    }
    this.prevState.targetRpm = targetRpm;

    // 3. Acceleration detection
    if (isRunning && !this.prevState.hasAccelerated && actualRpm > 100) {
      this.log(simTime, 'ACCEL_DETECTED', `Motor accelerating against inertia: Speed > 100 RPM (PWM: ${pwmDuty.toFixed(1)}%)`, 'SUCCESS');
      this.prevState.hasAccelerated = true;
    }

    // 4. Speed stabilization near setpoint (|error| < 40 RPM for non-zero setpoint)
    const speedError = Math.abs(targetRpm - actualRpm);
    if (isRunning && targetRpm > 200 && speedError < 45 && !this.prevState.hasStabilized && this.prevState.hasAccelerated) {
      this.log(simTime, 'SPEED_STABILIZED', `Speed reached setpoint band: ${Math.round(actualRpm)} RPM (Error: ${Math.round(targetRpm - actualRpm)} RPM)`, 'SUCCESS');
      this.prevState.hasStabilized = true;
    }

    // 5. Load disturbance detection
    if (loadTorque > this.prevState.prevLoad + 0.15 && isRunning) {
      this.log(simTime, 'LOAD_INCREASE', `Mechanical load applied: +${(loadTorque - this.prevState.prevLoad).toFixed(2)} N·m (Total: ${loadTorque.toFixed(2)} N·m)`, 'WARN');
      this.prevState.isDrooping = true;
      this.prevState.isRecovered = false;
      this.prevState.hasStabilized = false;
    } else if (loadTorque < this.prevState.prevLoad - 0.15 && isRunning) {
      this.log(simTime, 'LOAD_RELEASE', `Mechanical load released: Load reduced to ${loadTorque.toFixed(2)} N·m`, 'INFO');
    }
    this.prevState.prevLoad = loadTorque;

    // 6. Speed droop and recovery
    if (this.prevState.isDrooping && speedError > 70) {
      this.log(simTime, 'SPEED_DROOP', `Speed droop observed: Motor slowed to ${Math.round(actualRpm)} RPM under load torque`, 'WARN');
      this.prevState.isDrooping = false;
    }

    if (!this.prevState.isRecovered && this.prevState.prevLoad > 0.2 && speedError < 40 && actualRpm > 300) {
      this.log(simTime, 'PID_COMPENSATION', `PID closed-loop restored target speed: ${Math.round(actualRpm)} RPM (Compensated PWM: ${pwmDuty.toFixed(1)}%)`, 'SUCCESS');
      this.prevState.isRecovered = true;
    }

    // 7. Fault latched / cleared
    if (faults.isLatched && !this.prevState.prevTrip) {
      this.log(simTime, 'FAULT_TRIP', `PROTECTIVE SHUTDOWN: ${faults.tripReason || 'Hardware Safety Trip'}`, 'ALERT');
    } else if (!faults.isLatched && this.prevState.prevTrip) {
      this.log(simTime, 'FAULT_CLEARED', 'Fault latch cleared; system restored to safe standby', 'SUCCESS');
    }
    this.prevState.prevTrip = faults.isLatched;

    return this.events;
  }
}
