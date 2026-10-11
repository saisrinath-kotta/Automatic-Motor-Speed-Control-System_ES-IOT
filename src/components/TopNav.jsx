/**
 * TopNav Navigation and Status Header
 */

import React from 'react';
import {
  Cpu,
  Activity,
  Compass,
  Tag,
  BookOpen,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { CAMERA_PRESETS } from '../utils/constants.js';

export function TopNav({
  simState,
  cameraPreset,
  onSelectCameraPreset,
  showLabels,
  onToggleLabels,
  onOpenGuide,
  onResetCamera,
  isGuidedActive = false,
  onToggleGuided,
}) {
  const isLatched = simState.faults.isLatched;
  const isRunning = simState.isRunning;

  return (
    <header className="top-nav">
      <div className="top-nav-brand">
        <div className="brand-logo">
          <Cpu className="text-cyan-400" size={24} />
        </div>
        <div>
          <div className="brand-title">
            STM32H7 Motor Speed Control System
          </div>
          <div className="brand-subtitle">
            Realistic 3D Closed-Loop Engineering Digital Twin &bull; <span>Software-only Simulation</span>
          </div>
        </div>
      </div>

      <div className="top-nav-center">
        {/* State Indicator */}
        <div className={`status-pill ${isLatched ? 'pill-fault' : isRunning ? 'pill-running' : 'pill-stopped'}`}>
          {isLatched ? (
            <>
              <AlertTriangle size={15} />
              <span>TRIPPED: FAULT LATCHED</span>
            </>
          ) : isRunning ? (
            <>
              <Activity size={15} className="pulse-icon" />
              <span>RUNNING (CLOSED-LOOP)</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={15} />
              <span>STANDBY / STOPPED</span>
            </>
          )}
        </div>

        {/* STM32 MCU Specs Pill */}
        <div className="status-pill pill-neutral">
          <Cpu size={14} className="text-blue-400" />
          <span>STM32H743ZI &bull; 480MHz &bull; 100Hz PID</span>
        </div>
      </div>

      <div className="top-nav-actions">
        {/* Camera Preset Selector */}
        <div className="camera-selector">
          <Compass size={15} className="text-slate-400" />
          <select
            value={cameraPreset}
            onChange={(e) => onSelectCameraPreset(e.target.value)}
            className="camera-dropdown"
          >
            {Object.entries(CAMERA_PRESETS).map(([key, config]) => (
              <option key={key} value={key}>
                {config.name}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Camera Button */}
        <button
          onClick={onResetCamera}
          className="nav-btn"
          title="Reset Camera to Lab Overview"
        >
          <RefreshCw size={15} />
          <span>Reset Cam</span>
        </button>

        {/* Toggle Labels */}
        <button
          onClick={onToggleLabels}
          className={`nav-btn ${showLabels ? 'active' : ''}`}
          title="Toggle 3D Component Labels"
        >
          <Tag size={15} />
          <span>Labels</span>
        </button>

        {/* Guided Simulation (10-Step Interactive 3D Lesson) */}
        <button
          onClick={onToggleGuided}
          className={`nav-btn ${isGuidedActive ? 'nav-btn-accent' : 'nav-btn-highlight'}`}
          title="Toggle 10-Step Guided Simulation"
        >
          <Sparkles size={15} className={isGuidedActive ? 'text-cyan-300 animate-spin' : 'text-cyan-400'} />
          <span>{isGuidedActive ? 'Guided Mode (Active)' : 'Guided Simulation'}</span>
        </button>

        {/* Technical Reference Manual */}
        <button
          onClick={onOpenGuide}
          className="nav-btn nav-btn-primary"
          title="Open Embedded Systems Technical Reference"
        >
          <BookOpen size={15} />
          <span>Docs & Formulas</span>
        </button>
      </div>
    </header>
  );
}
