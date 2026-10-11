/**
 * Functional Animated 3D Signal & Power Wires
 *
 * Implements physically routed 3D Catmull-Rom spline conduits with
 * prominent dynamic traveling pulse packets and directional flow chevrons:
 * 1. DC Power Path: Power Supply -> Driver PCB -> Current Sensor -> Motor
 * 2. PWM Control Path: STM32H7 TIM1 -> Driver PCB (travels MCU -> Driver)
 * 3. Encoder Feedback Path: Encoder -> STM32H7 TIM2 (travels Encoder -> MCU)
 * 4. Sensor ADC Paths: Current & Temp Sensors -> STM32H7 ADCs (travels Sensors -> MCU)
 * 5. CAN / FDCAN Path: STM32H7 FDCAN -> Transceiver Breakout (travels MCU -> CAN)
 */

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Helper to calculate orientation tangent for directional chevron markers
function FlowChevron({ curve, u, color = '#38bdf8', scale = 0.05 }) {
  const { position, rotation } = useMemo(() => {
    const p = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    const rot = new THREE.Euler().setFromQuaternion(quat);
    return { position: [p.x, p.y, p.z], rotation: [rot.x, rot.y, rot.z] };
  }, [curve, u]);

  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <coneGeometry args={[0.5, 1.2, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} />
    </mesh>
  );
}

export function SignalWires({
  isRunning = false,
  pwmDuty = 0,
  actualRpm = 0,
  current = 0,
  isDriverActive = true,
  isEncoderHealthy = true,
  isCanHealthy = true,
  isTripLatched = false,
  focusedWire = null, // 'pwm' | 'power' | 'encoder' | 'sensor' | 'can' | null
}) {
  // Define 3D spline curves for each distinct harness
  const curves = useMemo(() => {
    return {
      // 1. Power Supply (+24V Red) to Driver PCB
      pwrPos: new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.64, 0.43, -2.0),
        new THREE.Vector3(-1.2, 0.12, -1.8),
        new THREE.Vector3(-0.4, 0.08, -0.6),
        new THREE.Vector3(0.0, 0.08, 0.2),
        new THREE.Vector3(0.18, 0.14, 0.72),
      ]),

      // Power Supply (GND Black) to Driver PCB
      pwrNeg: new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.16, 0.43, -2.0),
        new THREE.Vector3(-0.9, 0.12, -1.75),
        new THREE.Vector3(-0.35, 0.08, -0.55),
        new THREE.Vector3(0.05, 0.08, 0.25),
        new THREE.Vector3(0.24, 0.14, 0.72),
      ]),

      // Driver PCB to Current Sensor (Phase line)
      driverToCurrentSensor: new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.02, 0.14, 0.72),
        new THREE.Vector3(0.8, 0.08, 0.9),
        new THREE.Vector3(0.2, 0.08, 0.8),
        new THREE.Vector3(-0.16, 0.14, 0.4),
      ]),

      // Current Sensor to Motor Terminal Junction Box
      currentSensorToMotor: new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.44, 0.14, 0.4),
        new THREE.Vector3(-0.8, 0.08, 0.3),
        new THREE.Vector3(-1.16, 0.5, 0.0),
        new THREE.Vector3(-1.16, 0.6, -0.2),
      ]),

      // 2. PWM Control Line (STM32H7 TIM1_CH1 -> Driver PWM_IN)
      pwmControl: new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.52, 0.12, 0.55),
        new THREE.Vector3(1.3, 0.08, 0.65),
        new THREE.Vector3(0.9, 0.08, 0.75),
        new THREE.Vector3(0.6, 0.12, 0.78),
      ]),

      // 3. Encoder Feedback Line (Encoder M12 -> STM32H7 TIM2_CH1/CH2)
      encoderFeedback: new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.4, 0.15, -1.3),
        new THREE.Vector3(-0.8, 0.08, -1.1),
        new THREE.Vector3(0.4, 0.08, -0.4),
        new THREE.Vector3(1.4, 0.08, 0.1),
        new THREE.Vector3(2.48, 0.12, 0.55),
      ]),

      // 4. Temperature Sensor RTD line (Motor Thermal Probe -> STM32 ADC2)
      tempSensor: new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.4, 1.05, -0.2),
        new THREE.Vector3(-0.9, 0.5, -0.1),
        new THREE.Vector3(0.1, 0.08, 0.1),
        new THREE.Vector3(1.52, 0.12, 0.35),
      ]),

      // Current Sensor Analog out to STM32 ADC1
      currentSensorAnalog: new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.3, 0.1, 0.4),
        new THREE.Vector3(0.3, 0.08, 0.5),
        new THREE.Vector3(1.2, 0.08, 0.45),
        new THREE.Vector3(1.52, 0.12, 0.45),
      ]),

      // 5. CAN / FDCAN Bus Twisted Pair (STM32H7 FDCAN1 -> Transceiver Breakout)
      canBus: new THREE.CatmullRomCurve3([
        new THREE.Vector3(2.48, 0.12, 0.75),
        new THREE.Vector3(2.3, 0.08, 1.1),
        new THREE.Vector3(2.0, 0.08, 1.3),
        new THREE.Vector3(1.6, 0.12, 1.52),
      ]),
    };
  }, []);

  // Multi-mesh particle references for prominent pulses
  const pwmPacketsRef = useRef([]);
  const encoderPacketsRef = useRef([]);
  const sensorPacketsRef = useRef([]);
  const canPacketsRef = useRef([]);
  const pwrSupplyPacketsRef = useRef([]);
  const pwrMotorPacketsRef = useRef([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 1. PWM Pulse Packets (Direction: STM32 -> Driver)
    if (pwmPacketsRef.current.length > 0) {
      const active = isRunning && isDriverActive && pwmDuty > 1.0 && !isTripLatched;
      const speed = active ? 0.35 + (pwmDuty / 100.0) * 1.65 : 0.0;
      pwmPacketsRef.current.forEach((mesh, idx) => {
        if (!mesh) return;
        if (active) {
          mesh.visible = true;
          const u = ((t * speed + idx * 0.18) % 1.0);
          const pos = curves.pwmControl.getPointAt(u);
          mesh.position.copy(pos);
          const pulseScale = focusedWire === 'pwm' ? 1.4 : 1.0;
          mesh.scale.setScalar(pulseScale);
        } else {
          mesh.visible = false;
        }
      });
    }

    // 2. Encoder Pulse Packets (Direction: Encoder -> STM32)
    if (encoderPacketsRef.current.length > 0) {
      const active = isRunning && isEncoderHealthy && Math.abs(actualRpm) > 5;
      const speed = active ? Math.min(2.8, 0.25 + (actualRpm / 3000.0) * 2.2) : 0.0;
      encoderPacketsRef.current.forEach((mesh, idx) => {
        if (!mesh) return;
        if (active) {
          mesh.visible = true;
          const u = ((t * speed + idx * 0.15) % 1.0);
          const pos = curves.encoderFeedback.getPointAt(u);
          mesh.position.copy(pos);
          const pulseScale = focusedWire === 'encoder' ? 1.4 : 1.0;
          mesh.scale.setScalar(pulseScale);
        } else {
          mesh.visible = false;
        }
      });
    }

    // 3. Sensor Acquisition Packets (Direction: Sensors -> STM32)
    if (sensorPacketsRef.current.length > 0) {
      const active = isRunning && !isTripLatched;
      const speed = active ? 0.75 : 0.0;
      sensorPacketsRef.current.forEach((mesh, idx) => {
        if (!mesh) return;
        if (active) {
          mesh.visible = true;
          const u = ((t * speed + idx * 0.25) % 1.0);
          const curve = idx % 2 === 0 ? curves.currentSensorAnalog : curves.tempSensor;
          const pos = curve.getPointAt(u);
          mesh.position.copy(pos);
          const pulseScale = focusedWire === 'sensor' ? 1.3 : 1.0;
          mesh.scale.setScalar(pulseScale);
        } else {
          mesh.visible = false;
        }
      });
    }

    // 4. CAN Telemetry Packets (Direction: STM32 -> Transceiver)
    if (canPacketsRef.current.length > 0) {
      const active = isCanHealthy && isRunning;
      const speed = active ? 1.4 : 0.0;
      canPacketsRef.current.forEach((mesh, idx) => {
        if (!mesh) return;
        if (active) {
          mesh.visible = true;
          const u = ((t * speed + idx * 0.25) % 1.0);
          const pos = curves.canBus.getPointAt(u);
          mesh.position.copy(pos);
          const pulseScale = focusedWire === 'can' ? 1.35 : 1.0;
          mesh.scale.setScalar(pulseScale);
        } else {
          mesh.visible = false;
        }
      });
    }

    // 5. Power Supply -> Driver Packets (PSU to Driver DC IN)
    if (pwrSupplyPacketsRef.current.length > 0) {
      const active = isRunning && isDriverActive && current > 0.15 && !isTripLatched;
      const speed = active ? Math.min(2.0, 0.4 + current * 0.15) : 0.0;
      pwrSupplyPacketsRef.current.forEach((mesh, idx) => {
        if (!mesh) return;
        if (active) {
          mesh.visible = true;
          const u = ((t * speed + idx * 0.22) % 1.0);
          const pos = curves.pwrPos.getPointAt(u);
          mesh.position.copy(pos);
          const pulseScale = focusedWire === 'power' ? 1.35 : 1.0;
          mesh.scale.setScalar(pulseScale);
        } else {
          mesh.visible = false;
        }
      });
    }

    // 6. Driver -> Current Sensor -> Motor Packets (Driver to Motor)
    if (pwrMotorPacketsRef.current.length > 0) {
      const active = isRunning && isDriverActive && current > 0.15 && !isTripLatched;
      const speed = active ? Math.min(2.0, 0.4 + current * 0.15) : 0.0;
      pwrMotorPacketsRef.current.forEach((mesh, idx) => {
        if (!mesh) return;
        if (active) {
          mesh.visible = true;
          const u = ((t * speed + idx * 0.22) % 1.0);
          const pos = curves.currentSensorToMotor.getPointAt(u);
          mesh.position.copy(pos);
          const pulseScale = focusedWire === 'power' ? 1.35 : 1.0;
          mesh.scale.setScalar(pulseScale);
        } else {
          mesh.visible = false;
        }
      });
    }
  });

  // Wire opacity / highlighting based on focus
  const getWireOpacity = (wireType) => {
    if (!focusedWire) return 1.0;
    return focusedWire === wireType ? 1.0 : 0.45;
  };

  return (
    <group>
      {/* ============================================================== */}
      {/* 3D PHYSICAL CONDUITS (Continuous Wires)                         */}
      {/* ============================================================== */}

      {/* 1. DC Power Wires (PSU -> Driver) */}
      <group>
        <mesh>
          <tubeGeometry args={[curves.pwrPos, 64, 0.018, 8, false]} />
          <meshStandardMaterial
            color="#dc2626"
            roughness={0.25}
            metalness={0.2}
            transparent
            opacity={getWireOpacity('power')}
            emissive={focusedWire === 'power' ? '#7f1d1d' : '#000000'}
            emissiveIntensity={focusedWire === 'power' ? 0.6 : 0}
          />
        </mesh>
        <mesh>
          <tubeGeometry args={[curves.pwrNeg, 64, 0.018, 8, false]} />
          <meshStandardMaterial
            color="#0f172a"
            roughness={0.3}
            metalness={0.2}
            transparent
            opacity={getWireOpacity('power')}
          />
        </mesh>

        {/* Driver -> Current Sensor Phase Wire */}
        <mesh>
          <tubeGeometry args={[curves.driverToCurrentSensor, 48, 0.016, 8, false]} />
          <meshStandardMaterial
            color="#ea580c"
            roughness={0.25}
            metalness={0.2}
            transparent
            opacity={getWireOpacity('power')}
            emissive={focusedWire === 'power' ? '#7c2d12' : '#000000'}
            emissiveIntensity={focusedWire === 'power' ? 0.6 : 0}
          />
        </mesh>

        {/* Current Sensor -> Motor Terminal Box */}
        <mesh>
          <tubeGeometry args={[curves.currentSensorToMotor, 48, 0.016, 8, false]} />
          <meshStandardMaterial
            color="#ea580c"
            roughness={0.25}
            metalness={0.2}
            transparent
            opacity={getWireOpacity('power')}
            emissive={focusedWire === 'power' ? '#7c2d12' : '#000000'}
            emissiveIntensity={focusedWire === 'power' ? 0.6 : 0}
          />
        </mesh>
      </group>

      {/* 2. PWM Control Wire (Cyan) */}
      <mesh>
        <tubeGeometry args={[curves.pwmControl, 48, 0.012, 8, false]} />
        <meshStandardMaterial
          color="#06b6d4"
          roughness={0.25}
          metalness={0.2}
          transparent
          opacity={getWireOpacity('pwm')}
          emissive={focusedWire === 'pwm' ? '#0891b2' : '#000000'}
          emissiveIntensity={focusedWire === 'pwm' ? 0.8 : 0}
        />
      </mesh>

      {/* 3. Encoder Feedback Cable (Emerald Green) */}
      <mesh>
        <tubeGeometry args={[curves.encoderFeedback, 64, 0.014, 8, false]} />
        <meshStandardMaterial
          color={isEncoderHealthy ? '#10b981' : '#64748b'}
          roughness={0.25}
          metalness={0.2}
          transparent
          opacity={getWireOpacity('encoder')}
          emissive={focusedWire === 'encoder' ? '#059669' : '#000000'}
          emissiveIntensity={focusedWire === 'encoder' ? 0.8 : 0}
        />
      </mesh>

      {/* 4. Sensor Acquisition Wires (Amber Yellow) */}
      <group>
        <mesh>
          <tubeGeometry args={[curves.tempSensor, 64, 0.011, 8, false]} />
          <meshStandardMaterial
            color="#f59e0b"
            roughness={0.25}
            metalness={0.2}
            transparent
            opacity={getWireOpacity('sensor')}
            emissive={focusedWire === 'sensor' ? '#d97706' : '#000000'}
            emissiveIntensity={focusedWire === 'sensor' ? 0.6 : 0}
          />
        </mesh>
        <mesh>
          <tubeGeometry args={[curves.currentSensorAnalog, 48, 0.011, 8, false]} />
          <meshStandardMaterial
            color="#f59e0b"
            roughness={0.25}
            metalness={0.2}
            transparent
            opacity={getWireOpacity('sensor')}
            emissive={focusedWire === 'sensor' ? '#d97706' : '#000000'}
            emissiveIntensity={focusedWire === 'sensor' ? 0.6 : 0}
          />
        </mesh>
      </group>

      {/* 5. CAN / FDCAN Twisted Pair (Purple / Magenta) */}
      <mesh>
        <tubeGeometry args={[curves.canBus, 48, 0.013, 8, false]} />
        <meshStandardMaterial
          color={isCanHealthy ? '#a855f7' : '#64748b'}
          roughness={0.25}
          metalness={0.2}
          transparent
          opacity={getWireOpacity('can')}
          emissive={focusedWire === 'can' ? '#7e22ce' : '#000000'}
          emissiveIntensity={focusedWire === 'can' ? 0.8 : 0}
        />
      </mesh>

      {/* ============================================================== */}
      {/* DIRECTIONAL FLOW CHEVRONS (Indicate signal direction clearly)   */}
      {/* ============================================================== */}
      {/* Power Flow: PSU -> Driver -> Motor */}
      <FlowChevron curve={curves.pwrPos} u={0.5} color="#ef4444" scale={0.035} />
      <FlowChevron curve={curves.currentSensorToMotor} u={0.5} color="#f97316" scale={0.035} />

      {/* PWM Flow: STM32 -> Driver */}
      <FlowChevron curve={curves.pwmControl} u={0.5} color="#22d3ee" scale={0.032} />

      {/* Encoder Flow: Encoder -> STM32 */}
      <FlowChevron curve={curves.encoderFeedback} u={0.3} color="#34d399" scale={0.032} />
      <FlowChevron curve={curves.encoderFeedback} u={0.7} color="#34d399" scale={0.032} />

      {/* Sensor Flow: Sensor -> STM32 */}
      <FlowChevron curve={curves.tempSensor} u={0.5} color="#fbbf24" scale={0.03} />
      <FlowChevron curve={curves.currentSensorAnalog} u={0.5} color="#fbbf24" scale={0.03} />

      {/* CAN Flow: STM32 -> Transceiver */}
      <FlowChevron curve={curves.canBus} u={0.5} color="#c084fc" scale={0.032} />

      {/* ============================================================== */}
      {/* DYNAMIC TRAVELING PULSE PACKETS (Prominent & High-Visibility)   */}
      {/* ============================================================== */}

      {/* 1. PWM Pulses (Cyan glowing beads, STM32 -> Driver) */}
      {Array.from({ length: 5 }).map((_, i) => (
        <group
          key={`pwm-${i}`}
          ref={(el) => (pwmPacketsRef.current[i] = el)}
          visible={false}
        >
          {/* Glowing core */}
          <mesh>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshBasicMaterial color="#67e8f9" />
          </mesh>
          {/* Luminous halo shell */}
          <mesh>
            <sphereGeometry args={[0.075, 10, 10]} />
            <meshBasicMaterial color="#06b6d4" transparent opacity={0.45} />
          </mesh>
        </group>
      ))}

      {/* 2. Encoder Pulses (Emerald Green glowing beads, Encoder -> STM32) */}
      {Array.from({ length: 6 }).map((_, i) => (
        <group
          key={`enc-${i}`}
          ref={(el) => (encoderPacketsRef.current[i] = el)}
          visible={false}
        >
          {/* Glowing core */}
          <mesh>
            <sphereGeometry args={[0.042, 12, 12]} />
            <meshBasicMaterial color="#6ee7b7" />
          </mesh>
          {/* Luminous halo shell */}
          <mesh>
            <sphereGeometry args={[0.07, 10, 10]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.45} />
          </mesh>
        </group>
      ))}

      {/* 3. Sensor ADC Pulses (Amber glowing beads, Sensor -> STM32) */}
      {Array.from({ length: 4 }).map((_, i) => (
        <group
          key={`sensor-${i}`}
          ref={(el) => (sensorPacketsRef.current[i] = el)}
          visible={false}
        >
          <mesh>
            <sphereGeometry args={[0.038, 12, 12]} />
            <meshBasicMaterial color="#fde047" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.065, 10, 10]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.45} />
          </mesh>
        </group>
      ))}

      {/* 4. CAN Bus Pulses (Violet glowing beads, STM32 -> Transceiver) */}
      {Array.from({ length: 4 }).map((_, i) => (
        <group
          key={`can-${i}`}
          ref={(el) => (canPacketsRef.current[i] = el)}
          visible={false}
        >
          <mesh>
            <sphereGeometry args={[0.042, 12, 12]} />
            <meshBasicMaterial color="#e9d5ff" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.07, 10, 10]} />
            <meshBasicMaterial color="#a855f7" transparent opacity={0.45} />
          </mesh>
        </group>
      ))}

      {/* 5. Power Supply -> Driver Pulses (Red/Orange glowing beads) */}
      {Array.from({ length: 4 }).map((_, i) => (
        <group
          key={`pwr-psu-${i}`}
          ref={(el) => (pwrSupplyPacketsRef.current[i] = el)}
          visible={false}
        >
          <mesh>
            <sphereGeometry args={[0.048, 12, 12]} />
            <meshBasicMaterial color="#fca5a5" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.45} />
          </mesh>
        </group>
      ))}

      {/* 6. Driver -> Motor Phase Pulses (Orange glowing beads) */}
      {Array.from({ length: 4 }).map((_, i) => (
        <group
          key={`pwr-mtr-${i}`}
          ref={(el) => (pwrMotorPacketsRef.current[i] = el)}
          visible={false}
        >
          <mesh>
            <sphereGeometry args={[0.048, 12, 12]} />
            <meshBasicMaterial color="#fed7aa" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshBasicMaterial color="#ea580c" transparent opacity={0.45} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
