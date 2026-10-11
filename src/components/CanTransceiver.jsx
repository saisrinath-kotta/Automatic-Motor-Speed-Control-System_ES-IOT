/**
 * CAN / FDCAN Transceiver 3D Module
 *
 * Dedicated physical layer transceiver (SN65HVD230 / TCAN330):
 * - Purple industrial breakout PCB
 * - Transceiver SOIC-8 IC with ESD protection diodes
 * - 120Ω bus termination jumper block
 * - 3-pin CAN_H, CAN_L, GND screw terminal block
 * - Dynamic TX/RX communication activity LED
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function CanTransceiver({
  isHealthy = true,
  isSelected = false,
  isFocused = false,
  onSelect,
  position = [1.8, 0.08, 1.4],
}) {
  const ledRef = useRef();

  useFrame(({ clock }) => {
    if (ledRef.current) {
      if (isHealthy) {
        // Fast packet activity flicker
        const t = clock.getElapsedTime();
        const flicker = Math.sin(t * 25.0) > 0.2 ? 1.0 : 0.2;
        ledRef.current.material.opacity = flicker;
      } else {
        // Dark / Error when bus off
        ledRef.current.material.opacity = 0.0;
      }
    }
  });

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.('canTransceiver');
      }}
    >
      {/* Selection Glow / Focus Halo */}
      {(isSelected || isFocused) && (
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.72, 0.38, 0.62]} />
          <meshBasicMaterial
            color={isFocused ? '#c084fc' : '#a855f7'}
            wireframe
            transparent
            opacity={isFocused ? 0.75 : 0.4}
          />
        </mesh>
      )}

      {/* PCB Substrate (Industrial Violet / Purple) */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[0.55, 0.025, 0.45]} />
        <meshStandardMaterial color="#6b21a8" roughness={0.35} metalness={0.2} />
      </mesh>

      {/* Transceiver IC (SN65HVD230 SOIC-8) */}
      <mesh position={[-0.05, 0.02, 0]}>
        <boxGeometry args={[0.1, 0.02, 0.12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} />
      </mesh>

      {/* 120-Ohm Termination Jumper */}
      <group position={[-0.18, 0.03, -0.12]}>
        <mesh>
          <boxGeometry args={[0.04, 0.04, 0.06]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
      </group>

      {/* Industrial Screw Terminal Block (CAN_H, CAN_L, GND) */}
      <group position={[0.18, 0.06, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.12, 0.1, 0.3]} />
          <meshStandardMaterial color="#1e3a8a" />
        </mesh>
        {[-0.08, 0, 0.08].map((z, idx) => (
          <mesh key={idx} position={[0, 0.052, z]}>
            <cylinderGeometry args={[0.015, 0.015, 0.02, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Logic Header to STM32 (3.3V, TXD, RXD, GND) */}
      <group position={[-0.2, 0.04, 0.12]}>
        <mesh>
          <boxGeometry args={[0.05, 0.04, 0.16]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        {Array.from({ length: 4 }).map((_, i) => (
          <mesh key={i} position={[0, 0.03, -0.06 + i * 0.04]}>
            <cylinderGeometry args={[0.005, 0.005, 0.04, 8]} />
            <meshStandardMaterial color="#ca8a04" metalness={0.95} />
          </mesh>
        ))}
      </group>

      {/* TX/RX Activity LED (Violet/Magenta) */}
      <mesh
        ref={ledRef}
        position={[0.05, 0.022, 0.14]}
      >
        <boxGeometry args={[0.02, 0.015, 0.02]} />
        <meshBasicMaterial
          color={isHealthy ? '#c084fc' : '#475569'}
          transparent
          opacity={1.0}
        />
      </mesh>
    </group>
  );
}
