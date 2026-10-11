/**
 * Mechanical Load and Brake Assembly - High Contrast Industrial Drive Train
 *
 * Connected coaxially to motor output shaft via flexible jaw coupling:
 * - Precision flexible spider coupling (machined aluminum hubs + blue polyurethane insert)
 * - Ground load shaft supported by dual cast-iron pillow block bearings with brass grease zerks
 * - Ventilated steel flywheel / brake disc with radial ventilation slots
 * - High-visibility red disc brake caliper with dynamic friction glow
 * - Guided simulation step focus halo support
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function LoadAssembly({
  rotorAngle = 0,
  loadTorque = 0.0,
  isSelected = false,
  isFocused = false,
  onSelect,
  position = [-1.4, 0.45, 1.8],
}) {
  const rotatingGroupRef = useRef();
  const focusHaloRef = useRef();

  useFrame(({ clock }) => {
    if (rotatingGroupRef.current) {
      rotatingGroupRef.current.rotation.x = rotorAngle;
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
        onSelect?.('load');
      }}
    >
      {/* Guided Step Focus Halo */}
      {(isSelected || isFocused) && (
        <group ref={focusHaloRef}>
          <mesh position={[0, 0, 0.6]}>
            <boxGeometry args={[1.65, 1.55, 1.85]} />
            <meshBasicMaterial
              color={isFocused ? '#f59e0b' : '#fbbf24'}
              wireframe
              transparent
              opacity={isFocused ? 0.75 : 0.4}
            />
          </mesh>
          {isFocused && (
            <mesh position={[0, 0, 0.6]}>
              <boxGeometry args={[1.75, 1.65, 1.95]} />
              <meshBasicMaterial color="#f59e0b" transparent opacity={0.15} />
            </mesh>
          )}
        </group>
      )}

      {/* ROTATING DRIVE TRAIN (Coupling, Shaft, Flywheel/Disc) */}
      <group ref={rotatingGroupRef}>
        {/* Flexible Jaw Coupling (Motor-to-Load interface) */}
        {/* Hub 1 (Motor side - Polished Aluminum) */}
        <mesh position={[0, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.14, 24]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Blue Polyurethane Spider Insert */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.165, 0.165, 0.08, 16]} />
          <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.3} />
        </mesh>
        {/* Hub 2 (Load side - Polished Aluminum) */}
        <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.14, 24]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Precision Ground Load Shaft */}
        <mesh position={[0, 0, 0.65]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 1.1, 24]} />
          <meshStandardMaterial color="#ffffff" metalness={0.98} roughness={0.08} />
        </mesh>

        {/* Heavy Flywheel / Ventilated Brake Disc */}
        <group position={[0, 0, 0.85]}>
          {/* Main Disc Body (Ground Steel) */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.55, 0.55, 0.075, 36]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.92}
              roughness={0.18}
            />
          </mesh>
          {/* Circumferential Friction Track */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.54, 0.54, 0.076, 36]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* 8 Radial Ventilation Slots */}
          {Array.from({ length: 8 }).map((_, i) => {
            const rot = (i * Math.PI) / 4;
            return (
              <mesh key={i} rotation={[0, 0, rot]} position={[0, 0, 0.039]}>
                <boxGeometry args={[0.05, 0.34, 0.008]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
              </mesh>
            );
          })}
          {/* Central Mounting Hub with hex clamping bolts */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.14, 24]} />
            <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.15} />
          </mesh>
          {Array.from({ length: 6 }).map((_, i) => {
            const rot = (i * Math.PI) / 3;
            const r = 0.15;
            return (
              <mesh key={i} position={[Math.cos(rot) * r, Math.sin(rot) * r, 0.075]}>
                <cylinderGeometry args={[0.015, 0.015, 0.02, 6]} />
                <meshStandardMaterial color="#ffffff" metalness={0.98} />
              </mesh>
            );
          })}
        </group>
      </group>

      {/* STATIC PILLOW BLOCK BEARINGS (Bolted securely to workbench) */}
      {[0.35, 1.15].map((zPos, idx) => (
        <group key={idx} position={[0, -0.22, zPos]}>
          {/* Cast Iron Bearing Housing */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.55, 0.38, 0.16]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.35} />
          </mesh>
          {/* Machined Bearing Collar */}
          <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.18, 24]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Brass Grease Zerk Nipple */}
          <mesh position={[0, 0.31, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.05, 8]} />
            <meshStandardMaterial color="#ca8a04" metalness={0.95} roughness={0.2} />
          </mesh>
          {/* Mounting Bolts */}
          <mesh position={[-0.22, -0.2, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.06, 6]} />
            <meshStandardMaterial color="#ffffff" metalness={0.98} roughness={0.1} />
          </mesh>
          <mesh position={[0.22, -0.2, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.06, 6]} />
            <meshStandardMaterial color="#ffffff" metalness={0.98} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* CALIPER / ELECTROMAGNETIC BRAKE MECHANISM */}
      <group position={[0.42, 0.32, 0.85]}>
        {/* Bright Red Caliper Housing */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.34, 0.38, 0.26]} />
          <meshStandardMaterial color="#dc2626" metalness={0.7} roughness={0.25} />
        </mesh>
        {/* Brake Actuator Cylinder */}
        <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.22, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Dynamic Load Friction Glow (illuminates when load torque > 0) */}
        {loadTorque > 0.05 && (
          <mesh position={[-0.14, 0, 0]}>
            <boxGeometry args={[0.025, 0.26, 0.16]} />
            <meshBasicMaterial
              color="#fbbf24"
              transparent
              opacity={Math.min(0.9, 0.2 + loadTorque * 0.45)}
            />
          </mesh>
        )}
      </group>

      {/* Torque Reaction Load Cell Arm */}
      <group position={[0.42, -0.05, 0.85]}>
        <mesh>
          <boxGeometry args={[0.06, 0.35, 0.06]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}
