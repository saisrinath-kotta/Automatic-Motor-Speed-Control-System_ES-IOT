/**
 * Lightweight native Three.js OrbitControls wrapper for React Three Fiber
 * Directly uses 'three/examples/jsm/controls/OrbitControls.js'
 * Avoids heavy barrel bundle overhead of @react-three/drei
 */

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const OrbitControls = forwardRef(function OrbitControls(
  {
    target = [0, 0, 0],
    minDistance = 1.8,
    maxDistance = 18,
    maxPolarAngle = Math.PI / 2 - 0.05,
    dampingFactor = 0.05,
    enableDamping = true,
  },
  ref
) {
  const { camera, gl } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    const controls = new ThreeOrbitControls(camera, gl.domElement);
    controls.minDistance = minDistance;
    controls.maxDistance = maxDistance;
    controls.maxPolarAngle = maxPolarAngle;
    controls.dampingFactor = dampingFactor;
    controls.enableDamping = enableDamping;
    controls.target.set(...target);
    controlsRef.current = controls;

    return () => {
      controls.dispose();
    };
  }, [camera, gl.domElement]);

  useImperativeHandle(ref, () => controlsRef.current, []);

  useFrame(() => {
    if (controlsRef.current && enableDamping) {
      controlsRef.current.update();
    }
  });

  return null;
});

// Lightweight realistic ground shadow disc under hardware
export function ContactShadowDisc({ position = [0, 0.066, 0], radius = 3.6, opacity = 0.55 }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[radius * 2, radius * 1.6]} />
      <meshBasicMaterial
        color="#090d16"
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
}
