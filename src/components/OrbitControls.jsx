/**
 * Lightweight native Three.js OrbitControls wrapper for React Three Fiber
 * Directly wraps three/examples/jsm/controls/OrbitControls without drei/three-stdlib overhead.
 */

import React, { useEffect, useRef, forwardRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';

export const OrbitControls = forwardRef(function OrbitControls(
  {
    target = [0, 0, 0],
    minDistance = 1.8,
    maxDistance = 18,
    maxPolarAngle = Math.PI / 2 - 0.05,
    dampingFactor = 0.05,
    enableDamping = true,
  },
  forwardedRef
) {
  const { camera, gl } = useThree();
  const controlsRef = useRef(null);

  useEffect(() => {
    const controls = new ThreeOrbitControls(camera, gl.domElement);
    controls.target.set(...target);
    controls.minDistance = minDistance;
    controls.maxDistance = maxDistance;
    controls.maxPolarAngle = maxPolarAngle;
    controls.dampingFactor = dampingFactor;
    controls.enableDamping = enableDamping;

    controlsRef.current = controls;

    if (forwardedRef) {
      if (typeof forwardedRef === 'function') {
        forwardedRef(controls);
      } else {
        forwardedRef.current = controls;
      }
    }

    return () => {
      controls.dispose();
    };
  }, [camera, gl.domElement]);

  useFrame(() => {
    if (controlsRef.current && enableDamping) {
      controlsRef.current.update();
    }
  });

  return null;
});
