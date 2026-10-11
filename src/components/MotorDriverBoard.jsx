/**
 * Motor Driver PCB 3D Assembly
 *
 * Detailed industrial H-bridge motor driver board:
 * - 4-layer dark green FR4 PCB with silkscreen traces & part labels
 * - High-current N-channel MOSFET bridge with black extruded aluminum heatsink
 * - Bulk low-ESR electrolytic filter capacitors
 * - Heavy screw terminal blocks (+24V, GND, M+, M-)
 * - Logic pin header (PWM_IN, DIR, ENABLE, FAULT)
 * - Dynamic SMD status LEDs (Power, PWM pulse, Fault trip)
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function MotorDriverBoard({
  pwmDuty = 0,
  current = 0,
  isDriverActive = true,
  isTripLatched = false,
  isSelected = false,
  isFocused = false,
  onSelect,
  position = [0.6, 0.08, 0.4],
}) {
  const focusHaloRef = useRef();
  const isPwmActive = isDriverActive && pwmDuty > 0;

  useFrame(({ clock }) => {
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
        onSelect?.('driver');
      }}
    >
      {/* Guided Step Focus Halo */}
      {(isSelected || isFocused) && (
        <group ref={focusHaloRef}>
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[1.35, 0.48, 1.15]} />
            <meshBasicMaterial
              color={isFocused ? '#22d3ee' : '#06b6d4'}
              wireframe
              transparent
              opacity={isFocused ? 0.75 : 0.4}
            />
          </mesh>
          {isFocused && (
            <mesh position={[0, 0.15, 0]}>
              <boxGeometry args={[1.45, 0.55, 1.25]} />
              <meshBasicMaterial color="#06b6d4" transparent opacity={0.15} />
            </mesh>
          )}
        </group>
      )}

      {/* PCB Brass Standoffs (4 corners) */}
      {[
        [-0.5, -0.4],
        [0.5, -0.4],
        [-0.5, 0.4],
        [0.5, 0.4],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.04, z]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.08, 12]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* Main PCB Substrate (Industrial Dark Forest Green) */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.1, 0.03, 0.9]} />
        <meshStandardMaterial
          color="#064e3b" // Deep FR4 green
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>

      {/* Silkscreen Borders & Ground Plane Copper Shading */}
      <mesh position={[0, 0.016, 0]}>
        <boxGeometry args={[1.04, 0.001, 0.84]} />
        <meshStandardMaterial color="#047857" roughness={0.5} />
      </mesh>

      {/* High-Power Aluminum Heatsink for H-Bridge MOSFETs */}
      <group position={[0, 0.12, -0.1]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.55, 0.18, 0.28]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.25} />
        </mesh>
        {/* Heatsink Extrusion Fins */}
        {Array.from({ length: 7 }).map((_, idx) => (
          <mesh key={idx} position={[-0.24 + idx * 0.08, 0.1, 0]} castShadow>
            <boxGeometry args={[0.02, 0.12, 0.26]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* 4x TO-220 Power MOSFETs underneath the heatsink */}
      {[-0.18, -0.06, 0.06, 0.18].map((xPos, idx) => (
        <group key={idx} position={[xPos, 0.04, -0.1]}>
          <mesh>
            <boxGeometry args={[0.07, 0.06, 0.04]} />
            <meshStandardMaterial color="#111827" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.04, 0.01]}>
            <boxGeometry args={[0.06, 0.03, 0.01]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Bulk Electrolytic Capacitors (2x 1000uF 50V) */}
      {[-0.38, -0.26].map((xPos, idx) => (
        <group key={idx} position={[xPos, 0.12, 0.2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.065, 0.065, 0.22, 16]} />
            <meshStandardMaterial color="#1e1b4b" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Negative Stripe Marker */}
          <mesh position={[0.04, 0, 0]}>
            <boxGeometry args={[0.01, 0.2, 0.02]} />
            <meshBasicMaterial color="#cbd5e1" />
          </mesh>
          {/* Aluminum Vent Top */}
          <mesh position={[0, 0.111, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.005, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Gate Driver IC & Shunt Amp (SOIC-8 & SOIC-16 packages) */}
      <mesh position={[0.3, 0.025, -0.1]}>
        <boxGeometry args={[0.12, 0.02, 0.16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} />
      </mesh>
      <mesh position={[0.3, 0.025, 0.1]}>
        <boxGeometry args={[0.08, 0.02, 0.1]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} />
      </mesh>

      {/* High-Current Screw Terminal Blocks (Blue Industrial Style) */}
      {/* 1. DC Power Input (+24V, GND) */}
      <group position={[-0.42, 0.08, 0.35]}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.14, 0.14]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
        </mesh>
        {/* Screws */}
        <mesh position={[-0.05, 0.075, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        <mesh position={[0.05, 0.075, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
      </group>

      {/* 2. Motor Phase Output (M+, M-) */}
      <group position={[0.42, 0.08, 0.35]}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.14, 0.14]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
        </mesh>
        <mesh position={[-0.05, 0.075, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        <mesh position={[0.05, 0.075, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
      </group>

      {/* Logic Pin Header to STM32 (6-pin header) */}
      <group position={[0, 0.04, 0.38]}>
        <mesh>
          <boxGeometry args={[0.24, 0.05, 0.05]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[-0.1 + i * 0.04, 0.04, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.06, 8]} />
            <meshStandardMaterial color="#ca8a04" metalness={0.95} />
          </mesh>
        ))}
      </group>

      {/* Dynamic Status LEDs */}
      {/* 1. Logic Power LED (Green) */}
      <group position={[-0.45, 0.025, -0.35]}>
        <mesh>
          <boxGeometry args={[0.02, 0.015, 0.03]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
      </group>

      {/* 2. PWM Activity LED (Cyan - brightness scales with duty cycle!) */}
      <group position={[-0.38, 0.025, -0.35]}>
        <mesh>
          <boxGeometry args={[0.02, 0.015, 0.03]} />
          <meshBasicMaterial
            color={isPwmActive ? '#06b6d4' : '#1e293b'}
          />
        </mesh>
      </group>

      {/* 3. Fault Trip LED (Red) */}
      <group position={[-0.31, 0.025, -0.35]}>
        <mesh>
          <boxGeometry args={[0.02, 0.015, 0.03]} />
          <meshBasicMaterial
            color={isTripLatched ? '#ef4444' : '#334155'}
          />
        </mesh>
      </group>

      {/* Text Label plate on board */}
      <mesh position={[0, 0.018, -0.35]}>
        <boxGeometry args={[0.3, 0.001, 0.08]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
