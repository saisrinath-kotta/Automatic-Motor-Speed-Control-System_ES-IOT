/**
 * Physical DC Motor and Mechanical Load Mathematical Model
 *
 * Implements coupled differential equations:
 * 1. Electrical:  La * dI/dt = Va - Ke * omega - Ra * I
 * 2. Mechanical:  J * d(omega)/dt = Kt * I - T_load - B * omega - T_coulomb
 * 3. Thermal:     d(Temp)/dt = ((T_ambient + P_loss * R_th) - Temp) / tau_th
 */

import { MOTOR_DEFAULTS } from '../utils/constants.js';

export class MotorModel {
  constructor(params = {}) {
    this.params = { ...MOTOR_DEFAULTS, ...params };
    this.reset();
  }

  reset() {
    this.omega = 0.0;           // Shaft speed in rad/s
    this.current = 0.0;         // Armature current in Amperes
    this.temperature = this.params.ambientTemp; // Motor stator temp in °C
    this.angle = 0.0;           // Rotor mechanical angle in radians [0, 2pi)
    this.torqueMotor = 0.0;     // Electromagnetic torque in N·m
    this.backEmf = 0.0;         // Generated back-EMF in Volts
    this.powerLoss = 0.0;       // Electrical and core power losses in Watts
    this.powerMech = 0.0;       // Useful mechanical power in Watts
  }

  get rpm() {
    return (this.omega * 60.0) / (2.0 * Math.PI);
  }

  get effectiveInertia() {
    return this.params.motorInertia + this.params.loadInertia;
  }

  /**
   * Integrate system dynamics by time step dt
   * @param {number} dt Time step in seconds (e.g. 0.005 to 0.01s)
   * @param {number} pwmDuty Applied duty cycle [0, 100]%
   * @param {number} supplyVoltage Available DC bus voltage (e.g. 24.0V)
   * @param {number} loadTorque Opposing load torque in N·m
   * @param {boolean} driverActive Whether H-bridge gate drive is enabled
   */
  step(dt, pwmDuty, supplyVoltage, loadTorque = 0.0, driverActive = true) {
    if (dt <= 0 || isNaN(dt)) return;

    // Sub-stepping for numerical stability with small electrical time constant (La/Ra ~ 1.6ms)
    const subSteps = 4;
    const subDt = dt / subSteps;

    for (let i = 0; i < subSteps; i++) {
      // 1. Applied armature voltage from PWM duty cycle
      const effectiveDuty = driverActive ? Math.min(100.0, Math.max(0.0, pwmDuty)) : 0.0;
      const vArmature = (effectiveDuty / 100.0) * supplyVoltage;

      // 2. Back Electromotive Force (EMF)
      this.backEmf = this.params.backEmfConstant * this.omega;

      // 3. Electrical sub-step: Armature current differential
      // dI/dt = (Va - E - I*Ra) / La
      const di_dt = (vArmature - this.backEmf - this.current * this.params.armatureResistance) / this.params.armatureInductance;
      this.current += di_dt * subDt;

      // Single-quadrant freewheel diode clamp: motor current cannot be significantly negative in buck drive
      if (this.current < 0.0) {
        this.current = 0.0;
      }

      // 4. Electromagnetic motor torque: Tm = Kt * I
      this.torqueMotor = this.params.torqueConstant * this.current;

      // 5. Mechanical friction and opposing load
      const coulomb = this.omega > 0.05 ? this.params.coulombFriction : 0.0;
      const viscous = this.params.viscousFriction * this.omega;
      const totalOpposing = loadTorque + viscous + coulomb;

      // 6. Mechanical acceleration: d(omega)/dt = (Tm - T_load - Friction) / J
      let domega_dt = (this.torqueMotor - totalOpposing) / this.effectiveInertia;

      // Stiction check when near standstill: if opposing torque exceeds motor torque, motor stays still
      if (this.omega <= 0.02 && (this.torqueMotor - totalOpposing) <= 0.0) {
        domega_dt = 0.0;
        this.omega = 0.0;
      } else {
        this.omega += domega_dt * subDt;
        if (this.omega < 0.0) this.omega = 0.0; // Unidirectional rotation
      }

      // 7. Shaft angle integration for 3D visualization
      this.angle = (this.angle + this.omega * subDt) % (2.0 * Math.PI);
    }

    // 8. Mechanical & electrical power
    this.powerMech = Math.max(0.0, this.torqueMotor * this.omega);
    const copperLoss = Math.pow(this.current, 2) * this.params.armatureResistance;
    const ironLoss = 0.04 * this.powerMech;
    this.powerLoss = copperLoss + ironLoss;

    // 9. Thermal dynamics (lumped stator thermal capacity model)
    const steadyTemp = this.params.ambientTemp + this.powerLoss * this.params.thermalResistance;
    const dTemp_dt = (steadyTemp - this.temperature) / this.params.thermalTimeConstant;
    this.temperature += dTemp_dt * dt;

    // Prevent physical nonsense
    if (this.temperature < this.params.ambientTemp) {
      this.temperature = this.params.ambientTemp;
    }
  }
}
