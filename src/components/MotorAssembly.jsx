/**
 * DC Motor 3D Assembly - High-Visibility Machined Aluminum Stator & Polished Shaft
 *
 * Detailed industrial motor with:
 * - Cylindrical metallic silver / aluminum housing with visible longitudinal fins
 * - Polished CNC front and rear end caps with hex socket bolts
 * - Front and rear extending shafts with high-visibility rotation marker
 * - Heavy-duty mounting feet anchored to the workbench
 * - Guided simulation step focus halo support
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function MotorAssembly({
  rotorAngle = 0,
  actualRpm = 0,
  isSelected = false,
  isFocused = false,
  onSelect,
  position = [-1.4, 0.45, 0],
}) {
  const shaftGroupRef = useRef();
  const focusHaloRef = useRef();

  useFrame(({ clock }) => {
    if (shaftGroupRef.current) {
      shaftGroupRef.current.rotation.x = rotorAngle;
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
        onSelect?.('motor');
      }}
    >
      {/* Guided Step Focus Halo / Bounding Highlight */}
      {(isSelected || isFocused) && (
        <group ref={focusHaloRef}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.55, 1.45, 2.45]} />
            <meshBasicMaterial
              color={isFocused ? '#06b6d4' : '#38bdf8'}
              wireframe
              transparent
              opacity={isFocused ? 0.75 : 0.4}
            />
          </mesh>
          {isFocused && (
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.65, 1.55, 2.55]} />
              <meshBasicMaterial color="#22d3ee" transparent opacity={0.15} />
            </mesh>
          )}
        </group>
      )}

      {/* Main Motor Cylindrical Body (Brushed Aluminum Stator Housing) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.55, 1.6, 36]} />
        <meshStandardMaterial
          color="#d1d5db" // Bright brushed silver aluminum
          metalness={0.88}
          roughness={0.22}
        />
      </mesh>

      {/* Longitudinal Cooling Fins (12 extruded fins with sharp specular highlights) */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * Math.PI) / 6;
        const radius = 0.55;
        const x = Math.sin(angle) * radius;
        const y = Math.cos(angle) * radius;
        return (
          <mesh
            key={i}
            position={[x, y, 0]}
            rotation={[Math.PI / 2, 0, -angle]}
            castShadow
          >
            <boxGeometry args={[0.04, 1.52, 0.14]} />
            <meshStandardMaterial
              color="#94a3b8" // Contrasting extruded aluminum fin
              metalness={0.92}
              roughness={0.18}
            />
          </mesh>
        );
      })}

      {/* Front Machined Aluminum End-Cap */}
      <mesh position={[0, 0, 0.82]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.56, 0.56, 0.08, 36]} />
        <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.14} />
      </mesh>

      {/* Front Bearing Hub Collar */}
      <mesh position={[0, 0, 0.9]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.1, 32]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.12} />
      </mesh>

      {/* Rear Machined End-Cap */}
      <mesh position={[0, 0, -0.82]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.56, 0.56, 0.08, 36]} />
        <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.14} />
      </mesh>

      {/* Motor Terminal Junction Box (on top) */}
      <group position={[0, 0.58, -0.2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.22, 0.45]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Lid Hex Screws */}
        <mesh position={[-0.16, 0.115, -0.16]}>
          <cylinderGeometry args={[0.02, 0.02, 0.03, 8]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0.16, 0.115, 0.16]}>
          <cylinderGeometry args={[0.02, 0.02, 0.03, 8]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Brass Cable Gland */}
        <mesh position={[0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.12, 12]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Motor Mounting Feet (Cast mounting anchors bolted to bench) */}
      {[-0.5, 0.5].map((zPos, idx) => (
        <group key={idx} position={[0, -0.5, zPos]}>
          <mesh position={[-0.45, -0.05, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.26, 0.1, 0.26]} />
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[0.45, -0.05, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.26, 0.1, 0.26]} />
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
          </mesh>
          {/* Hex Anchor Bolts */}
          <mesh position={[-0.45, 0.025, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.06, 6]} />
            <meshStandardMaterial color="#ffffff" metalness={0.98} roughness={0.08} />
          </mesh>
          <mesh position={[0.45, 0.025, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.06, 6]} />
            <meshStandardMaterial color="#ffffff" metalness={0.98} roughness={0.08} />
          </mesh>
        </group>
      ))}

      {/* ROTATING SHAFT ASSEMBLY (Extends front and rear) */}
      <group ref={shaftGroupRef}>
        {/* Front Output Shaft (Mirror Polished Steel) */}
        <mesh position={[0, 0, 1.25]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.7, 24]} />
          <meshStandardMaterial
            color="#ffffff"
            metalness={0.98}
            roughness={0.08}
          />
        </mesh>
        {/* High-Visibility Rotation Timing Stripe (Red & White contrast) */}
        <mesh position={[0, 0.092, 1.25]}>
          <boxGeometry args={[0.035, 0.016, 0.45]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0.03, 0.088, 1.25]}>
          <boxGeometry args={[0.015, 0.012, 0.45]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Rear Shaft (Connects to Optical Encoder) */}
        <mesh position={[0, 0, -1.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.4, 24]} />
          <meshStandardMaterial
            color="#f1f5f9"
            metalness={0.95}
            roughness={0.12}
          />
        </mesh>
      </group>

      {/* Nameplate Metal Badge (Model & Voltage specs) */}
      <mesh position={[0, 0.54, 0.3]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.4, 0.01, 0.2]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}
