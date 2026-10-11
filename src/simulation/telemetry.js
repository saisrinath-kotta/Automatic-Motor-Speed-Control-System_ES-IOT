/**
 * Simulated CAN / FDCAN Telemetry Bus Protocol
 *
 * Implements realistic STM32H7 FDCAN peripheral message generation:
 * - Standard 11-bit identifier framing
 * - Periodic cyclic telemetry broadcast (20ms, 50ms, 100ms)
 * - Event-triggered emergency broadcast (ID 0x070)
 * - Raw 8-byte payload packing and engineering unit decoding
 */

import { CAN_IDS } from '../utils/constants.js';

export class CanTelemetryManager {
  constructor(maxLogSize = 40) {
    this.maxLogSize = maxLogSize;
    this.messageLog = [];
    this.timers = {
      speed: 0.0,
      electrical: 0.0,
      thermal: 0.0,
      encoder: 0.0,
    };
    this.busStatus = 'OPERATIONAL (CAN-FD 1Mbps/5Mbps)';
    this.totalTxCount = 0;
  }

  reset() {
    this.messageLog = [];
    this.timers = {
      speed: 0.0,
      electrical: 0.0,
      thermal: 0.0,
      encoder: 0.0,
    };
    this.busStatus = 'OPERATIONAL (CAN-FD 1Mbps/5Mbps)';
    this.totalTxCount = 0;
  }

  /**
   * Pack integer into 2 bytes big-endian
   */
  static packInt16(val) {
    const clamped = Math.max(-32768, Math.min(32767, Math.round(val)));
    const unsigned = clamped < 0 ? clamped + 65536 : clamped;
    return [(unsigned >> 8) & 0xFF, unsigned & 0xFF];
  }

  /**
   * Pack unsigned 16-bit
   */
  static packUint16(val) {
    const clamped = Math.max(0, Math.min(65535, Math.round(val)));
    return [(clamped >> 8) & 0xFF, clamped & 0xFF];
  }

  /**
   * Process telemetry cycle
   */
  update(simState, dt, isCanHealthy = true) {
    if (!isCanHealthy) {
      this.busStatus = 'BUS_OFF (Error Passive - Transceiver Fail)';
      return this.messageLog;
    }

    this.busStatus = 'OPERATIONAL (CAN-FD 1Mbps / 5Mbps)';

    const {
      simTime,
      targetRpm,
      actualRpm,
      pwmDuty,
      current,
      voltage,
      temperature,
      encoderPulses,
      encoderFreq,
      isTripLatched,
      activeFaults,
    } = simState;

    this.timers.speed += dt;
    this.timers.electrical += dt;
    this.timers.thermal += dt;
    this.timers.encoder += dt;

    // 1. Cyclic Message: Motor Speed & Control (Every 20ms)
    if (this.timers.speed >= 0.02) {
      this.timers.speed = 0.0;
      const bTarget = CanTelemetryManager.packUint16(targetRpm);
      const bActual = CanTelemetryManager.packUint16(actualRpm);
      const bPwm = CanTelemetryManager.packUint16(pwmDuty * 100); // 0.01% resolution
      const flags = isTripLatched ? 0x01 : 0x00;

      this.addMessage({
        timestamp: simTime,
        canId: CAN_IDS.SPEED_ACTUAL,
        name: 'MOTOR_SPEED_ACTUAL',
        dlc: 8,
        data: [...bTarget, ...bActual, ...bPwm, flags, 0x00],
        decoded: `SP: ${Math.round(targetRpm)} RPM | PV: ${Math.round(actualRpm)} RPM | PWM: ${pwmDuty.toFixed(1)}%`,
        status: isTripLatched ? 'FAULT' : 'OK',
      });
    }

    // 2. Cyclic Message: Electrical Telemetry (Every 50ms)
    if (this.timers.electrical >= 0.05) {
      this.timers.electrical = 0.0;
      const bCurr = CanTelemetryManager.packUint16(current * 100); // 10mA resolution
      const bVolt = CanTelemetryManager.packUint16(voltage * 100); // 10mV resolution
      const pWatts = Math.round(current * voltage);
      const bPwr = CanTelemetryManager.packUint16(pWatts);

      this.addMessage({
        timestamp: simTime,
        canId: CAN_IDS.ELECTRICAL_DATA,
        name: 'MOTOR_ELECTRICAL',
        dlc: 8,
        data: [...bCurr, ...bVolt, ...bPwr, 0x00, 0x00],
        decoded: `I: ${current.toFixed(2)} A | V: ${voltage.toFixed(1)} V | P: ${pWatts} W`,
        status: current > 10.0 ? 'WARN' : 'OK',
      });
    }

    // 3. Cyclic Message: Thermal Telemetry (Every 100ms)
    if (this.timers.thermal >= 0.10) {
      this.timers.thermal = 0.0;
      const bTemp = CanTelemetryManager.packUint16(temperature * 10); // 0.1°C resolution
      const bInverter = CanTelemetryManager.packUint16((temperature * 0.75 + 15) * 10);

      this.addMessage({
        timestamp: simTime,
        canId: CAN_IDS.THERMAL_DATA,
        name: 'MOTOR_THERMAL',
        dlc: 8,
        data: [...bTemp, ...bInverter, 0x00, 0x00, 0x00, 0x00],
        decoded: `Stator: ${temperature.toFixed(1)}°C | Inverter: ${(temperature * 0.75 + 15).toFixed(1)}°C`,
        status: temperature > 70 ? 'WARN' : 'OK',
      });
    }

    // 4. Cyclic Message: Optical Encoder (Every 20ms)
    if (this.timers.encoder >= 0.02) {
      this.timers.encoder = 0.0;
      const bPulses = CanTelemetryManager.packUint16(encoderPulses % 65536);
      const bFreq = CanTelemetryManager.packUint16(encoderFreq);

      this.addMessage({
        timestamp: simTime,
        canId: CAN_IDS.ENCODER_RAW,
        name: 'ENCODER_FEEDBACK',
        dlc: 8,
        data: [...bPulses, ...bFreq, 0x00, 0x00, 0x00, 0x00],
        decoded: `Raw Count: ${encoderPulses} | Freq: ${Math.round(encoderFreq)} Hz`,
        status: 'OK',
      });
    }

    // 5. Emergency Fault Frame (Triggered on critical alert)
    if (isTripLatched && activeFaults.length > 0) {
      // Fire occasionally during fault (every 500ms or on trigger)
      const lastMsg = this.messageLog[0];
      if (!lastMsg || lastMsg.canId !== CAN_IDS.EMERGENCY_FAULT || (simTime - lastMsg.timestamp > 0.5)) {
        this.addMessage({
          timestamp: simTime,
          canId: CAN_IDS.EMERGENCY_FAULT,
          name: 'SYSTEM_ALERT_FAULT',
          dlc: 8,
          data: [0xFF, 0xAA, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00],
          decoded: `CRITICAL TRIP: ${activeFaults[0]?.name || 'Protective Shutdown'}`,
          status: 'ALERT',
        });
      }
    }

    return this.messageLog;
  }

  addMessage(msg) {
    this.totalTxCount++;
    this.messageLog.unshift({
      ...msg,
      id: this.totalTxCount,
    });
    if (this.messageLog.length > this.maxLogSize) {
      this.messageLog.pop();
    }
  }
}
