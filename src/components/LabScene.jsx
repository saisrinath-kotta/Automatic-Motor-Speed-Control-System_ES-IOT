/**
 * LabScene 3D Workstation Environment
 *
 * Professional engineering laboratory workbench hosting:
 * - DC Motor & Encoder & Load drive train (central prominence)
 * - STM32H7 Development Board
 * - Motor Driver PCB
 * - DC Power Supply & Sensors & CAN Transceiver
 * - Animated Signal Wiring Harness with traveling luminous pulses
 * - Studio lighting, contact shadows, OrbitControls, and Camera transitions
 * - Guided simulation 3D stage highlighting
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadowDisc } from './Controls3D.jsx';
import * as THREE from 'three';

import { MotorAssembly } from './MotorAssembly.jsx';
import { EncoderAssembly } from './EncoderAssembly.jsx';
import { LoadAssembly } from './LoadAssembly.jsx';
import { MotorDriverBoard } from './MotorDriverBoard.jsx';
import { STM32H7Board } from './STM32H7Board.jsx';
import { SensorModules } from './SensorModules.jsx';
import { PowerSupply } from './PowerSupply.jsx';
import { CanTransceiver } from './CanTransceiver.jsx';
import { SignalWires } from './SignalWires.jsx';
import { CAMERA_PRESETS, STEP_CAMERA_CONFIG } from '../utils/constants.js';

// Camera transition helper
function CameraRig({
  currentPreset,
  guidedStep,
  controlsRef,
  autoCameraEnabled = true,
}) {
  const { camera } = useThree();
  const prevStepRef = useRef(null);

  useEffect(() => {
    let targetConfig = null;

    // Check if we are responding to a guided step change
    if (guidedStep) {
      if (!autoCameraEnabled && prevStepRef.current !== null) {
        // Auto camera is disabled by user: do not force camera movement on step advance
        prevStepRef.current = guidedStep.step;
        return;
      }
      prevStepRef.current = guidedStep.step;
      targetConfig = STEP_CAMERA_CONFIG[guidedStep.step] || CAMERA_PRESETS.overview;
    } else {
      prevStepRef.current = null;
      targetConfig = CAMERA_PRESETS[currentPreset] || CAMERA_PRESETS.overview;
    }

    if (!targetConfig || !controlsRef.current) return;

    // Smoothly animate camera position and look-at target
    const startPos = camera.position.clone();
    const endPos = new THREE.Vector3(...targetConfig.position);
    const startTarget = controlsRef.current.target.clone();
    const endTarget = new THREE.Vector3(...targetConfig.target);

    // Skip if already very close
    if (startPos.distanceTo(endPos) < 0.05 && startTarget.distanceTo(endTarget) < 0.05) {
      return;
    }

    let startTime = null;
    const duration = 950; // ms (silky smooth industrial transition)

    const step = (now) => {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1.0);
      // Smooth cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(startPos, endPos, ease);
      controlsRef.current.target.lerpVectors(startTarget, endTarget, ease);
      controlsRef.current.update();

      if (progress < 1.0) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [
    guidedStep ? guidedStep.step : null,
    currentPreset,
    camera,
    controlsRef,
    autoCameraEnabled,
  ]);

  return null;
}

// Lightweight, crisp 3D Billboard Label using CanvasTexture
function Label3D({ text, position, color = '#38bdf8', isHighlight = false }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = isHighlight ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = isHighlight ? '#38bdf8' : color;
    ctx.lineWidth = isHighlight ? 8 : 4;
    if (ctx.roundRect) {
      ctx.roundRect(8, 8, 496, 112, 18);
    } else {
      ctx.rect(8, 8, 496, 112);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isHighlight ? '#ffffff' : color;
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);
    return new THREE.CanvasTexture(canvas);
  }, [text, color, isHighlight]);

  const scale = isHighlight ? [1.6, 0.4, 1] : [1.3, 0.32, 1];

  return (
    <sprite position={position} scale={scale}>
      <spriteMaterial attach="material" map={texture} transparent opacity={0.95} />
    </sprite>
  );
}

// Guided Stage Floating Annotation
function GuidedFocusAnnotation({ guidedStep }) {
  if (!guidedStep || !guidedStep.focusComponent) return null;

  // Approximate top center coordinate of each target component
  const positions = {
    motor: [-1.4, 1.8, 0],
    encoder: [-1.4, 1.45, -1.3],
    load: [-1.4, 1.85, 2.65],
    driver: [0.6, 1.05, 0.4],
    controller: [2.0, 1.05, 0.4],
    powerSupply: [-1.4, 1.75, -2.6],
    canTransceiver: [1.8, 0.95, 1.4],
    sensors: [-0.3, 0.9, 0.4],
  };

  const pos = positions[guidedStep.focusComponent] || [-1.4, 1.8, 0];
  const labelText = `STAGE ${guidedStep.step}: ${guidedStep.focusComponent.toUpperCase()}`;

  return (
    <group position={pos}>
      <Label3D text={labelText} position={[0, 0, 0]} color="#06b6d4" isHighlight={true} />
    </group>
  );
}

export function LabScene({
  simState,
  selectedComponent,
  onSelectComponent,
  cameraPreset = 'overview',
  showLabels = true,
  guidedStep = null,
  autoCameraEnabled = true,
}) {
  const controlsRef = useRef();

  // Active camera preset: use guidedStep preset if active, otherwise user preset
  const activeCameraPreset =
    guidedStep && autoCameraEnabled && guidedStep.cameraPreset
      ? guidedStep.cameraPreset
      : cameraPreset;

  const focusComp = guidedStep ? guidedStep.focusComponent : null;
  const focusWire = guidedStep ? guidedStep.focusWire : null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        camera={{
          position: CAMERA_PRESETS.overview.position,
          fov: CAMERA_PRESETS.overview.fov,
          near: 0.1,
          far: 50,
        }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            onSelectComponent?.(null);
          }
        }}
      >
        {/* Medium-light Graphite Laboratory Background (prevents pitch-black silhouette) */}
        <color attach="background" args={['#1e2538']} />

        {/* Ambient & Studio Directional Lighting */}
        <ambientLight intensity={1.25} color="#e2e8f0" />

        {/* Primary Key Directional Light (sharp contact shadows) */}
        <directionalLight
          position={[6, 10, 7]}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />

        {/* Rear-side Fill Light (prevents back-face darkening) */}
        <directionalLight position={[-6, 7, -4]} intensity={0.85} color="#bfdbfe" />

        {/* Front Direct Fill Light (brightens motor housing, shaft, and controls) */}
        <directionalLight position={[-1.5, 3.5, 5]} intensity={1.1} color="#ffffff" />

        {/* Focused Overhead Spotlight on Motor & Shaft assembly */}
        <pointLight position={[-1.4, 4.2, 0.5]} intensity={2.2} distance={10} color="#ffffff" />

        {/* Focused Fill on STM32H7 Development Board */}
        <pointLight position={[2.0, 3.0, 0.6]} intensity={1.5} distance={8} color="#bae6fd" />

        {/* Camera Rig & OrbitControls */}
        <CameraRig
          currentPreset={activeCameraPreset}
          guidedStep={guidedStep}
          controlsRef={controlsRef}
          autoCameraEnabled={autoCameraEnabled}
        />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={CAMERA_PRESETS.overview.target}
          minDistance={1.8}
          maxDistance={18}
          maxPolarAngle={Math.PI / 2 - 0.05} // Do not dip below the bench
          dampingFactor={0.05}
          enableDamping
        />

        {/* ============================================================ */}
        {/* WORKBENCH & LAB ENVIRONMENT                                  */}
        {/* ============================================================ */}
        <group position={[0, -0.06, 0]}>
          {/* Main Heavy Duty Workbench Top (Medium Industrial Slate) */}
          <mesh position={[0, 0, 0]} receiveShadow>
            <boxGeometry args={[7.2, 0.12, 6.2]} />
            <meshStandardMaterial
              color="#334155"
              roughness={0.45}
              metalness={0.3}
            />
          </mesh>

          {/* Anodized Aluminum Workbench Edge Trim */}
          <mesh position={[0, 0.061, 3.1]} receiveShadow>
            <boxGeometry args={[7.22, 0.04, 0.04]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.061, -3.1]} receiveShadow>
            <boxGeometry args={[7.22, 0.04, 0.04]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[3.6, 0.061, 0]} receiveShadow>
            <boxGeometry args={[0.04, 0.04, 6.22]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[-3.6, 0.061, 0]} receiveShadow>
            <boxGeometry args={[0.04, 0.04, 6.22]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Anti-Static ESD Rubber Mat (Dark Slate with high contrast) */}
          <mesh position={[0, 0.062, 0]} receiveShadow>
            <boxGeometry args={[6.8, 0.006, 5.8]} />
            <meshStandardMaterial
              color="#1e293b"
              roughness={0.65}
              metalness={0.15}
            />
          </mesh>

          {/* ESD Grid Markings on Workbench (High contrast for spatial clarity) */}
          <gridHelper
            args={[6.4, 32, '#94a3b8', '#475569']}
            position={[0, 0.068, 0]}
          />

          {/* Heavy Steel Bench Legs */}
          {[
            [-3.4, -1.8, -2.8],
            [3.4, -1.8, -2.8],
            [-3.4, -1.8, 2.8],
            [3.4, -1.8, 2.8],
          ].map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]} castShadow>
              <boxGeometry args={[0.2, 3.6, 0.2]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
            </mesh>
          ))}

          {/* Realistic Contact Shadow directly onto the mat */}
          <ContactShadowDisc
            position={[0, 0.066, 0]}
            radius={3.6}
            opacity={0.65}
          />
        </group>

        {/* ============================================================ */}
        {/* 3D HARDWARE ASSEMBLIES                                       */}
        {/* ============================================================ */}

        {/* 1. DC Motor (Central Hero Component) */}
        <MotorAssembly
          rotorAngle={simState.rotorAngle}
          actualRpm={simState.actualRpm}
          isSelected={selectedComponent === 'motor'}
          isFocused={focusComp === 'motor'}
          onSelect={onSelectComponent}
        />

        {/* 2. Optical Quadrature Encoder */}
        <EncoderAssembly
          rotorAngle={simState.rotorAngle}
          actualRpm={simState.actualRpm}
          isHealthy={simState.faults.isEncoderHealthy}
          isSelected={selectedComponent === 'encoder'}
          isFocused={focusComp === 'encoder'}
          onSelect={onSelectComponent}
        />

        {/* 3. Mechanical Coupling, Brake & Load */}
        <LoadAssembly
          rotorAngle={simState.rotorAngle}
          loadTorque={simState.loadTorque}
          isSelected={selectedComponent === 'load'}
          isFocused={focusComp === 'load'}
          onSelect={onSelectComponent}
        />

        {/* 4. Motor Driver PCB */}
        <MotorDriverBoard
          pwmDuty={simState.pwmDuty}
          current={simState.current}
          isDriverActive={simState.isRunning && !simState.faults.isLatched}
          isTripLatched={simState.faults.isLatched}
          isSelected={selectedComponent === 'driver'}
          isFocused={focusComp === 'driver'}
          onSelect={onSelectComponent}
        />

        {/* 5. STM32H7 Development Board */}
        <STM32H7Board
          isRunning={simState.isRunning}
          isTripLatched={simState.faults.isLatched}
          isSelected={selectedComponent === 'controller'}
          isFocused={focusComp === 'controller'}
          onSelect={onSelectComponent}
        />

        {/* 6. Current & Temperature Sensors */}
        <SensorModules
          current={simState.current}
          temperature={simState.temperature}
          isSelected={selectedComponent}
          isFocused={focusComp === 'sensors'}
          onSelect={onSelectComponent}
        />

        {/* 7. Benchtop DC Power Supply */}
        <PowerSupply
          voltage={simState.voltage}
          current={simState.current}
          isRunning={simState.isRunning}
          isSelected={selectedComponent === 'powerSupply'}
          isFocused={focusComp === 'powerSupply'}
          onSelect={onSelectComponent}
        />

        {/* 8. CAN / FDCAN Transceiver Breakout */}
        <CanTransceiver
          isHealthy={simState.faults.isCanHealthy}
          isSelected={selectedComponent === 'canTransceiver'}
          isFocused={focusComp === 'canTransceiver'}
          onSelect={onSelectComponent}
        />

        {/* 9. Animated Signal and Power Wiring Harness */}
        <SignalWires
          isRunning={simState.isRunning}
          pwmDuty={simState.pwmDuty}
          actualRpm={simState.actualRpm}
          current={simState.current}
          isDriverActive={simState.isRunning && !simState.faults.isLatched}
          isEncoderHealthy={simState.faults.isEncoderHealthy}
          isCanHealthy={simState.faults.isCanHealthy}
          isTripLatched={simState.faults.isLatched}
          focusedWire={focusWire}
        />

        {/* Guided Stage Focus Annotation */}
        <GuidedFocusAnnotation guidedStep={guidedStep} />

        {/* Optional 3D Component floating labels */}
        {showLabels && !guidedStep && (
          <group>
            <Label3D position={[-1.4, 1.45, 0]} text="DC MOTOR (24V)" color="#38bdf8" />
            <Label3D position={[-1.4, 1.05, -1.3]} text="1024 CPR ENCODER" color="#34d399" />
            <Label3D position={[-1.4, 1.45, 2.65]} text="LOAD & BRAKE DISC" color="#fbbf24" />
            <Label3D position={[0.6, 0.65, 0.4]} text="H-BRIDGE DRIVER" color="#22d3ee" />
            <Label3D position={[2.0, 0.65, 0.4]} text="STM32H7 CONTROLLER" color="#60a5fa" />
            <Label3D position={[-1.4, 1.35, -2.6]} text="24V DC BENCH SUPPLY" color="#f87171" />
            <Label3D position={[1.8, 0.55, 1.4]} text="FDCAN TRANSCEIVER" color="#c084fc" />
          </group>
        )}
      </Canvas>
    </div>
  );
}
