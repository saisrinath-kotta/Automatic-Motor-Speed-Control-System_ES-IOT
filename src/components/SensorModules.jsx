/**
 * Current and Temperature Sensors 3D Modules
 *
 * 1. Current Sensor: Isolated Hall-effect current transducer module (ACS724 style)
 *    mounted inline between motor driver and motor.
 * 2. Temperature Sensor: Heavy-duty industrial NTC / PT100 probe mounted in a
 *    threaded thermal well on the motor stator casing with braided lead.
 */

import React from 'react';

export function SensorModules({
  current = 0,
  temperature = 25,
  isSelected = false,
  isFocused = false,
  onSelect,
}) {
  return (
    <group>
      {/* ============================================================== */}
      {/* CURRENT TRANSDUCER MODULE                                      */}
      {/* ============================================================== */}
      <group
        position={[-0.3, 0.08, 0.4]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.('currentSensor');
        }}
      >
        {/* Selection Glow */}
        {isSelected === 'currentSensor' && (
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.55, 0.35, 0.55]} />
            <meshBasicMaterial color="#eab308" wireframe transparent opacity={0.4} />
          </mesh>
        )}

        {/* Purple/Blue breakout PCB */}
        <mesh receiveShadow castShadow>
          <boxGeometry args={[0.42, 0.025, 0.42]} />
          <meshStandardMaterial color="#4338ca" roughness={0.3} metalness={0.2} />
        </mesh>

        {/* Hall-Effect IC (SOIC-8 with copper lead frame) */}
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.12, 0.02, 0.12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} />
        </mesh>

        {/* Input/Output Screw Terminals */}
        {[-0.14, 0.14].map((x, idx) => (
          <group key={idx} position={[x, 0.06, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.1, 0.1, 0.2]} />
              <meshStandardMaterial color="#1e3a8a" />
            </mesh>
            <mesh position={[0, 0.055, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.02, 8]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
          </group>
        ))}

        {/* Status LED (Amber glow proportional to current) */}
        <mesh position={[0, 0.02, -0.15]}>
          <boxGeometry args={[0.02, 0.015, 0.02]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* TEMPERATURE SENSOR PROBE (Attached directly to Motor Stator)  */}
      {/* ============================================================== */}
      <group
        position={[-1.4, 0.95, -0.2]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.('tempSensor');
        }}
      >
        {/* Selection Glow */}
        {isSelected === 'tempSensor' && (
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.4} />
          </mesh>
        )}

        {/* Threaded Brass Thermal Well Bushing */}
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.1, 16]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Hexagonal Nut Collar */}
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 6]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Stainless Steel Probe Cap & Spring Relief */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.12, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Temperature Alert LED Indicator on probe */}
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshBasicMaterial
            color={temperature > 75 ? '#ef4444' : temperature > 50 ? '#f59e0b' : '#10b981'}
          />
        </mesh>
      </group>
    </group>
  );
}
