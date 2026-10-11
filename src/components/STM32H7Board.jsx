/**
 * STM32H7 Development Board 3D Assembly
 *
 * Detailed representation of an STM32 Nucleo-144 industrial dev board:
 * - Characteristic dark blue PCB with white silkscreen markings
 * - Central ARM Cortex-M7 LQFP-144 microcontroller chip (480 MHz)
 * - Dual double-row Morpho & Arduino Uno V3 pin headers
 * - ST-LINK/V3 onboard debugger with USB connector
 * - User buttons (Blue B1, Black Reset B2)
 * - Tri-color status LEDs (LD1 3V3 Power, LD2 SysTick Heartbeat, LD3 Red Fault)
 * - Crystal oscillators, decoupling arrays, and educational peripheral callouts
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function STM32H7Board({
  isRunning = false,
  isTripLatched = false,
  isSelected = false,
  isFocused = false,
  onSelect,
  position = [2.0, 0.08, 0.4],
}) {
  const heartbeatRef = useRef();
  const focusHaloRef = useRef();

  useFrame(({ clock }) => {
    if (heartbeatRef.current) {
      // SysTick Heartbeat pulse (blinks steadily when MCU is active)
      const t = clock.getElapsedTime();
      const intensity = Math.sin(t * 6.0) > 0 ? 1.0 : 0.15;
      heartbeatRef.current.material.opacity = intensity;
    }
    if (focusHaloRef.current && isFocused) {
      const t = clock.getElapsedTime();
      focusHaloRef.current.scale.setScalar(1.0 + Math.sin(t * 4.0) * 0.04);
    }
  });

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.('controller');
      }}
    >
      {/* Guided Step Focus Halo */}
      {(isSelected || isFocused) && (
        <group ref={focusHaloRef}>
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[1.55, 0.48, 1.85]} />
            <meshBasicMaterial
              color={isFocused ? '#38bdf8' : '#3b82f6'}
              wireframe
              transparent
              opacity={isFocused ? 0.75 : 0.4}
            />
          </mesh>
          {isFocused && (
            <mesh position={[0, 0.15, 0]}>
              <boxGeometry args={[1.65, 0.55, 1.95]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.15} />
            </mesh>
          )}
        </group>
      )}

      {/* PCB Brass Standoffs (4 corners) */}
      {[
        [-0.55, -0.7],
        [0.55, -0.7],
        [-0.55, 0.7],
        [0.55, 0.7],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.04, z]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.08, 12]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* Main PCB Substrate (STM32 Deep Royal Blue) */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.25, 0.03, 1.55]} />
        <meshStandardMaterial
          color="#1e3a8a" // STM32 classic deep blue
          roughness={0.35}
          metalness={0.25}
        />
      </mesh>

      {/* White Silkscreen Perimeter Outline */}
      <mesh position={[0, 0.016, 0]}>
        <boxGeometry args={[1.18, 0.001, 1.48]} />
        <meshStandardMaterial color="#2563eb" roughness={0.5} />
      </mesh>

      {/* ============================================================== */}
      {/* CENTRAL MCU: STM32H743ZIT6 ARM Cortex-M7 480MHz (LQFP-144)    */}
      {/* ============================================================== */}
      <group position={[0, 0.025, 0.1]}>
        {/* Black Epoxy Package */}
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.025, 0.42]} />
          <meshStandardMaterial color="#090d16" roughness={0.2} />
        </mesh>
        {/* Pin 1 Index Notch */}
        <mesh position={[-0.17, 0.014, -0.17]}>
          <cylinderGeometry args={[0.018, 0.018, 0.005, 16]} />
          <meshBasicMaterial color="#334155" />
        </mesh>
        {/* Laser Engraved White Text Badge */}
        <mesh position={[0, 0.014, 0]}>
          <boxGeometry args={[0.3, 0.001, 0.12]} />
          <meshBasicMaterial color="#cbd5e1" />
        </mesh>
        {/* 144 Gull-wing Tin Leads (Visual perimeter frame) */}
        {[-0.23, 0.23].map((x, idx) => (
          <mesh key={idx} position={[x, -0.005, 0]}>
            <boxGeometry args={[0.03, 0.012, 0.38]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} />
          </mesh>
        ))}
        {[-0.23, 0.23].map((z, idx) => (
          <mesh key={idx} position={[0, -0.005, z]}>
            <boxGeometry args={[0.38, 0.012, 0.03]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} />
          </mesh>
        ))}
      </group>

      {/* High-Speed Crystal Oscillator (HSE 8MHz Can) */}
      <mesh position={[0.28, 0.03, 0.1]} castShadow>
        <boxGeometry args={[0.08, 0.03, 0.14]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* ============================================================== */}
      {/* ST-LINK V3 DEBUGGER SECTION (Top Portion of Board)            */}
      {/* ============================================================== */}
      <group position={[0, 0, -0.55]}>
        {/* Perforated Break-off Silk Line */}
        <mesh position={[0, 0.016, 0.12]}>
          <boxGeometry args={[1.2, 0.001, 0.015]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* ST-LINK Microcontroller */}
        <mesh position={[0, 0.025, 0]}>
          <boxGeometry args={[0.22, 0.02, 0.22]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} />
        </mesh>
        {/* USB-C / Micro-USB Connector */}
        <mesh position={[0, 0.04, -0.18]} castShadow>
          <boxGeometry args={[0.22, 0.08, 0.16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* PIN HEADERS: Double-row Morpho Headers (Left and Right)        */}
      {/* ============================================================== */}
      {[-0.48, 0.48].map((xPos, idx) => (
        <group key={idx} position={[xPos, 0.05, 0.15]}>
          {/* Black Plastic Header Shroud */}
          <mesh castShadow>
            <boxGeometry args={[0.1, 0.07, 0.95]} />
            <meshStandardMaterial color="#111827" />
          </mesh>
          {/* Gold Pin Contacts */}
          {Array.from({ length: 16 }).map((_, p) => (
            <mesh key={p} position={[0, 0.045, -0.42 + p * 0.056]}>
              <cylinderGeometry args={[0.006, 0.006, 0.05, 8]} />
              <meshStandardMaterial color="#eab308" metalness={0.95} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Arduino Uno V3 Compatible Inner Headers */}
      {[-0.32, 0.32].map((xPos, idx) => (
        <group key={idx} position={[xPos, 0.04, 0.2]}>
          <mesh>
            <boxGeometry args={[0.06, 0.06, 0.65]} />
            <meshStandardMaterial color="#111827" />
          </mesh>
        </group>
      ))}

      {/* ============================================================== */}
      {/* USER BUTTONS: B1 (Blue User Button) & B2 (Black Reset)         */}
      {/* ============================================================== */}
      {/* B1 User Button (Blue) */}
      <group position={[-0.35, 0.035, 0.62]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.04, 0.1]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.04, 16]} />
          <meshStandardMaterial color="#2563eb" />
        </mesh>
      </group>

      {/* B2 Reset Button (Black) */}
      <group position={[0.35, 0.035, 0.62]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.04, 0.1]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.04, 16]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* STATUS LEDS: LD1 (Power), LD2 (Heartbeat), LD3 (Fault)         */}
      {/* ============================================================== */}
      {/* LD1 Power (Green - always on) */}
      <mesh position={[-0.12, 0.025, 0.58]}>
        <boxGeometry args={[0.025, 0.015, 0.03]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>

      {/* LD2 Heartbeat / SysTick LED (Green blinking) */}
      <mesh ref={heartbeatRef} position={[0, 0.025, 0.58]}>
        <boxGeometry args={[0.025, 0.015, 0.03]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={1.0} />
      </mesh>

      {/* LD3 Fault LED (Red when error latched) */}
      <mesh position={[0.12, 0.025, 0.58]}>
        <boxGeometry args={[0.025, 0.015, 0.03]} />
        <meshBasicMaterial color={isTripLatched ? '#ef4444' : '#1e293b'} />
      </mesh>

      {/* Board Title Silkscreen Strip */}
      <mesh position={[0, 0.017, -0.22]}>
        <boxGeometry args={[0.6, 0.001, 0.06]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
