/**
 * Optical Quadrature Encoder 3D Assembly - High Contrast Inspection Unit
 *
 * Mounted coaxially at the rear of the motor.
 * Includes:
 * - Machined aluminum housing with clear observation window
 * - Rotating slotted optical code disc
 * - Dual-channel optical sensor bracket (Ch A / Ch B)
 * - Active pulse indicator LEDs (react to rotation and encoder faults)
 * - Shielded industrial M12 cable connector
 * - Guided simulation step focus halo support
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function EncoderAssembly({
  rotorAngle = 0,
  actualRpm = 0,
  isHealthy = true,
  isSelected = false,
  isFocused = false,
  onSelect,
  position = [-1.4, 0.45, -1.3],
}) {
  const discRef = useRef();
  const focusHaloRef = useRef();

  useFrame(({ clock }) => {
    if (discRef.current) {
      discRef.current.rotation.z = rotorAngle;
    }
    if (focusHaloRef.current && isFocused) {
      const t = clock.getElapsedTime();
      focusHaloRef.current.scale.setScalar(1.0 + Math.sin(t * 4.0) * 0.05);
    }
  });

  const isSpinning = isHealthy && Math.abs(actualRpm) > 5;

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.('encoder');
      }}
    >
      {/* Guided Step Focus Halo */}
      {(isSelected || isFocused) && (
        <group ref={focusHaloRef}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.95, 0.95, 0.85]} />
            <meshBasicMaterial
              color={isFocused ? '#10b981' : '#34d399'}
              wireframe
              transparent
              opacity={isFocused ? 0.75 : 0.4}
            />
          </mesh>
          {isFocused && (
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.05, 1.05, 0.95]} />
              <meshBasicMaterial color="#10b981" transparent opacity={0.15} />
            </mesh>
          )}
        </group>
      )}

      {/* Main Encoder Metal Housing (Machined Anodized Slate Aluminum) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.45, 32]} />
        <meshStandardMaterial
          color="#334155" // Clean industrial slate
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      {/* Polished Front Flange attached to motor rear */}
      <mesh position={[0, 0, 0.24]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.38, 0.05, 32]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Clear Transparent Observation Window (Allows viewing spinning disk) */}
      <mesh position={[0, 0, -0.23]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.02, 32]} />
        <meshPhysicalMaterial
          color="#bfdbfe"
          transmission={0.88}
          opacity={0.65}
          transparent
          roughness={0.08}
          ior={1.48}
        />
      </mesh>

      {/* INTERNAL ROTATING OPTICAL CODE DISC */}
      <group position={[0, 0, -0.05]}>
        <group ref={discRef}>
          {/* Base Precision Glass/Metallic Disc */}
          <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.015, 32]} />
            <meshStandardMaterial
              color="#38bdf8"
              metalness={0.7}
              roughness={0.15}
              transparent
              opacity={0.85}
            />
          </mesh>

          {/* High-frequency optical slots (16 visual spokes representing 1024 CPR) */}
          {Array.from({ length: 16 }).map((_, i) => {
            const rot = (i * Math.PI) / 8;
            return (
              <mesh key={i} rotation={[0, 0, rot]} position={[0, 0, 0.009]}>
                <boxGeometry args={[0.02, 0.22, 0.005]} />
                <meshBasicMaterial color="#0f172a" />
              </mesh>
            );
          })}

          {/* High-Contrast Index Z-Channel Marker */}
          <mesh position={[0.18, 0, 0.01]}>
            <boxGeometry args={[0.04, 0.02, 0.005]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      </group>

      {/* Optical Sensor Head Bracket (U-shaped Photo-Interrupter) */}
      <group position={[0.18, 0.1, -0.05]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.12, 0.08]} />
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Optical Sensor Aperture */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.08, 0.03, 0.04]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      </group>

      {/* Status LEDs on top of encoder */}
      {/* Channel A Pulse LED */}
      <group position={[-0.1, 0.35, -0.05]}>
        <mesh>
          <sphereGeometry args={[0.028, 16, 16]} />
          <meshBasicMaterial
            color={
              !isHealthy
                ? '#ef4444' // Red if faulty
                : isSpinning
                ? '#10b981' // Green flashing/glow
                : '#64748b'
            }
          />
        </mesh>
      </group>

      {/* Channel B Pulse LED */}
      <group position={[0.1, 0.35, -0.05]}>
        <mesh>
          <sphereGeometry args={[0.028, 16, 16]} />
          <meshBasicMaterial
            color={
              !isHealthy
                ? '#ef4444'
                : isSpinning
                ? '#38bdf8'
                : '#64748b'
            }
          />
        </mesh>
      </group>

      {/* Industrial M12 Cable Connector (Exits to STM32) */}
      <group position={[0, -0.34, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.16, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
        </mesh>
      </group>
    </group>
  );
}
