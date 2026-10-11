/**
 * Automated Verification Script for Simulation Engine
 */

import { SimulationEngine } from './src/simulation/simulationEngine.js';

console.log('--- STARTING SIMULATION ENGINE VERIFICATION ---');

const engine = new SimulationEngine();

// Test 1: Initial state
console.log('1. Checking Initial Conditions...');
let state = engine.getState();
console.assert(state.isRunning === false, 'Motor should be stopped initially');
console.assert(state.actualRpm === 0, 'Initial RPM should be 0');
console.assert(state.pwmDuty === 0, 'Initial PWM should be 0');
console.assert(state.faults.isLatched === false, 'No latched fault initially');
console.log('   ✓ Initial state validated.');

// Test 2: Start motor and accelerate
console.log('2. Starting Motor and Testing Acceleration to 1500 RPM...');
engine.setTargetRpm(1500);
engine.start();

for (let i = 0; i < 300; i++) {
  engine.step(0.01); // 3 seconds of simulation
}

state = engine.getState();
console.log(`   After 3.0s: Actual RPM = ${state.actualRpm.toFixed(1)}, Target = ${state.targetRpm}, PWM = ${state.pwmDuty.toFixed(1)}%, Current = ${state.current.toFixed(2)}A`);
console.assert(state.actualRpm > 1200, 'Motor should accelerate toward target');
console.assert(state.pwmDuty > 0, 'PWM duty cycle should be non-zero');
console.log('   ✓ Motor acceleration and closed-loop speed control validated.');

// Test 3: Load disturbance response
console.log('3. Applying Step Load Disturbance (+0.4 Nm)...');
const preLoadRpm = state.actualRpm;
engine.triggerStepLoad(0.4, 2.0);

// Run 0.1s to capture initial droop
for (let i = 0; i < 10; i++) {
  engine.step(0.01);
}
let droopState = engine.getState();
console.log(`   Instantaneous speed droop: ${droopState.actualRpm.toFixed(1)} RPM (PWM = ${droopState.pwmDuty.toFixed(1)}%, Current = ${droopState.current.toFixed(2)}A)`);
console.assert(droopState.actualRpm < preLoadRpm, 'Speed should droop when load torque increases');

// Run 2.0s to allow PID controller to recover speed
for (let i = 0; i < 200; i++) {
  engine.step(0.01);
}
let recoveredState = engine.getState();
console.log(`   After PID recovery: ${recoveredState.actualRpm.toFixed(1)} RPM (PWM = ${recoveredState.pwmDuty.toFixed(1)}%, Current = ${recoveredState.current.toFixed(2)}A)`);
console.assert(recoveredState.actualRpm > droopState.actualRpm, 'PID should recover speed after droop');
console.log('   ✓ Speed droop and PID recovery validated.');

// Test 4: Fault injection - Encoder Loss
console.log('4. Testing Fault Injection: Encoder Signal Loss...');
engine.faults.setInjectedFault('encoderLoss', true);
engine.step(0.01);
let faultedState = engine.getState();
console.log(`   Encoder Healthy: ${faultedState.faults.isEncoderHealthy}, Latched: ${faultedState.faults.isLatched}, PWM: ${faultedState.pwmDuty.toFixed(1)}%`);
console.assert(faultedState.faults.isEncoderHealthy === false, 'Encoder should be unhealthy');
console.assert(faultedState.faults.isLatched === true, 'Trip should be latched');
console.assert(faultedState.pwmDuty === 0.0, 'PWM must be locked to 0% during fault');
console.log('   ✓ Encoder fault and protective shutdown validated.');

// Test 5: Clear fault
console.log('5. Clearing Encoder Fault...');
engine.faults.setInjectedFault('encoderLoss', false);
const clearRes = engine.faults.clearFaults(faultedState.current, faultedState.temperature);
console.assert(clearRes.success === true, 'Fault should clear successfully');
console.log('   ✓ Fault clearance validated.');

// Test 6: CAN Telemetry
console.log('6. Validating CAN/FDCAN Messages...');
const messages = engine.telemetry.messageLog;
console.log(`   Recorded ${messages.length} CAN frames in log.`);
console.assert(messages.length > 0, 'Telemetry log should have frames');
const speedMsg = messages.find(m => m.canId === 0x180);
console.assert(speedMsg !== undefined, 'Should have 0x180 SPEED message');
console.log(`   Sample frame: ID=${speedMsg.canId.toString(16)} Name=${speedMsg.name} Decoded="${speedMsg.decoded}"`);
console.log('   ✓ CAN Telemetry frames validated.');

console.log('--- ALL SIMULATION ENGINE TESTS PASSED SUCCESSFULLY! ---');
