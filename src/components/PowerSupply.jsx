/**
 * Benchtop DC Power Supply 3D Module
 *
 * Professional laboratory programmable DC power supply:
 * - Industrial powder-coated steel instrument enclosure
 * - Digital LED displays for Voltage and Current
 * - Coarse/Fine rotary parameter adjustment encoders
 * - Safety banana binding posts (Positive Red, Negative Black, Earth Green)
 * - Main illuminated power rocker switch
 */

import React from 'react';

export function PowerSupply({
  voltage = 24.0,
  current = 0.0,
  isRunning = true,
  isSelected = false,
  isFocused = false,
  onSelect,
  position = [-1.4, 0.45, -2.6],
}) {
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.('powerSupply');
      }}
    >
      {/* Selection Glow / Focus Halo */}
      {(isSelected || isFocused) && (
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[1.55, 1.25, 1.55]} />
          <meshBasicMaterial
            color={isFocused ? '#f87171' : '#ef4444'}
            wireframe
            transparent
            opacity={isFocused ? 0.75 : 0.35}
          />
        </mesh>
      )}

      {/* Main Metal Enclosure */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.75, 1.1]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Front Bezel Panel (Light Gray / Metallic) */}
      <mesh position={[0, 0.22, 0.56]}>
        <boxGeometry args={[1.14, 0.7, 0.03]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Rubber Feet (4 corners) */}
      {[
        [-0.5, -0.4],
        [0.5, -0.4],
        [-0.5, 0.4],
        [0.5, 0.4],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.16, z]}>
          <cylinderGeometry args={[0.05, 0.05, 0.04, 12]} />
          <meshStandardMaterial color="#020617" roughness={0.9} />
        </mesh>
      ))}

      {/* Digital Readout Screen 1: Voltage Display */}
      <group position={[-0.26, 0.38, 0.58]}>
        <mesh>
          <boxGeometry args={[0.42, 0.18, 0.01]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        {/* Glow Segment Box */}
        <mesh position={[0, 0, 0.006]}>
          <boxGeometry args={[0.38, 0.14, 0.001]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
      </group>

      {/* Digital Readout Screen 2: Current Display */}
      <group position={[0.26, 0.38, 0.58]}>
        <mesh>
          <boxGeometry args={[0.42, 0.18, 0.01]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        <mesh position={[0, 0, 0.006]}>
          <boxGeometry args={[0.38, 0.14, 0.001]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
      </group>

      {/* Rotary Knobs (Coarse & Fine Control) */}
      {[-0.2, 0.2].map((x, i) => (
        <mesh key={i} position={[x, 0.18, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.05, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} />
        </mesh>
      ))}

      {/* Output Binding Posts (Banana Terminals) */}
      {/* Positive (+ Red) */}
      <group position={[-0.24, -0.02, 0.6]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.08, 16]} />
          <meshStandardMaterial color="#dc2626" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.03, 12]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.9} />
        </mesh>
      </group>

      {/* Earth / Ground (Green) */}
      <group position={[0, -0.02, 0.6]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.08, 16]} />
          <meshStandardMaterial color="#16a34a" roughness={0.3} />
        </mesh>
      </group>

      {/* Negative (- Black) */}
      <group position={[0.24, -0.02, 0.6]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.08, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.03, 12]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.9} />
        </mesh>
      </group>

      {/* Master Illuminated Power Switch */}
      <group position={[-0.42, -0.02, 0.58]}>
        <mesh>
          <boxGeometry args={[0.08, 0.12, 0.02]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0, 0, 0.015]}>
          <boxGeometry args={[0.05, 0.08, 0.02]} />
          <meshBasicMaterial color={isRunning ? '#ef4444' : '#7f1d1d'} />
        </mesh>
      </group>
    </group>
  );
}
