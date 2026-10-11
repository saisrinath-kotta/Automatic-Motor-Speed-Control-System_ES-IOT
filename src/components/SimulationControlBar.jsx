/**
 * SimulationControlBar Component
 *
 * Compact, professional simulation control bar positioned at the bottom of the 3D lab:
 * - Idle state: Prompts user to start guided simulation
 * - Active state: Step status, progress indicator, Play/Pause, Prev, Next, Restart, Auto-Cam toggle, Reset Cam
 * - Minimal footprint leaving 95% of the 3D laboratory visible
 */

import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Camera,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { GUIDED_STEPS } from '../simulation/guidedSimulation.js';

export function SimulationControlBar({
  guided,
  onResetCamera,
}) {
  const {
    isGuidedActive,
    currentStepIndex,
    currentStep,
    totalSteps,
    isAutoPlay,
    setIsAutoPlay,
    autoCameraEnabled,
    setAutoCameraEnabled,
    stepElapsed,
    startGuided,
    stopGuided,
    restartGuided,
    nextStep,
    prevStep,
    goToStep,
  } = guided;

  // 1. Idle Prompt State (Before starting guided simulation)
  if (!isGuidedActive) {
    return (
      <div className="sim-control-bar-idle" role="region" aria-label="Guided Simulation Launcher">
        <div className="sim-idle-text-group">
          <Sparkles size={16} className="text-cyan-400 shrink-0 animate-pulse" />
          <span className="sim-idle-prompt">
            Ready to explore? Start the guided simulation to follow the motor-control process.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={startGuided}
            className="sim-play-cta-btn"
            title="Start 10-step guided simulation with automatic camera tour"
          >
            <Play size={15} fill="currentColor" />
            <span>Play Guided Simulation</span>
          </button>

          <button
            onClick={onResetCamera}
            className="sim-icon-btn"
            title="Reset Camera to Lab Overview"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    );
  }

  // 2. Active Guided Simulation State (Compact bottom toolbar)
  return (
    <div className="sim-control-bar-active" role="region" aria-label="Simulation Controls">
      {/* Left: Step Number, Title & Progress Dots */}
      <div className="sim-bar-left">
        <div className="sim-step-indicator">
          <span className="sim-step-num">STEP {currentStep.step} / {totalSteps}</span>
          <span className="sim-step-divider">&bull;</span>
          <span className="sim-step-title">{currentStep.shortTitle || currentStep.title}</span>
        </div>

        {/* 10 Micro-Progress Dots */}
        <div className="sim-progress-dots">
          {GUIDED_STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => goToStep(idx)}
              className={`sim-progress-dot ${
                idx === currentStepIndex
                  ? 'active'
                  : idx < currentStepIndex
                  ? 'completed'
                  : 'pending'
              }`}
              title={`Jump to Step ${idx + 1}: ${s.title}`}
            >
              <span>{idx + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Center: Playback Navigation Controls */}
      <div className="sim-bar-center">
        {/* Previous Button */}
        <button
          onClick={prevStep}
          disabled={currentStepIndex === 0}
          className="sim-nav-btn"
          title="Previous Step"
        >
          <ChevronLeft size={16} />
          <span>Prev</span>
        </button>

        {/* Play / Pause Auto-Advance Toggle */}
        <button
          onClick={() => setIsAutoPlay(!isAutoPlay)}
          className={`sim-nav-btn ${isAutoPlay ? 'sim-btn-active' : ''}`}
          title={isAutoPlay ? 'Pause Auto-Progression' : 'Resume Auto-Progression'}
        >
          {isAutoPlay ? (
            <>
              <Pause size={14} className="text-cyan-400" />
              <span>Auto ({Math.max(0, 4 - Math.round(stepElapsed))}s)</span>
            </>
          ) : (
            <>
              <Play size={14} fill="currentColor" className="text-slate-300" />
              <span>Resume</span>
            </>
          )}
        </button>

        {/* Next Button */}
        <button
          onClick={nextStep}
          disabled={currentStepIndex === totalSteps - 1}
          className="sim-nav-btn primary"
          title="Next Step"
        >
          <span>{currentStepIndex === totalSteps - 1 ? 'Finish' : 'Next'}</span>
          <ChevronRight size={16} />
        </button>

        {/* Restart Button */}
        <button
          onClick={restartGuided}
          className="sim-icon-btn"
          title="Restart Tour from Step 1"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Right: Camera and View Controls */}
      <div className="sim-bar-right">
        {/* Auto Camera Toggle */}
        <button
          onClick={() => setAutoCameraEnabled(!autoCameraEnabled)}
          className={`sim-toggle-btn ${autoCameraEnabled ? 'active' : ''}`}
          title={autoCameraEnabled ? 'Auto Camera is ON (Click to disable forced camera movement)' : 'Auto Camera is OFF (Manual camera control)'}
        >
          <Camera size={13} />
          <span>Auto Cam: {autoCameraEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* Reset Camera */}
        <button
          onClick={onResetCamera}
          className="sim-icon-btn"
          title="Reset Camera to Lab Overview"
        >
          <RefreshCw size={14} />
        </button>

        {/* Exit Tour */}
        <button
          onClick={stopGuided}
          className="sim-icon-btn sim-close-btn"
          title="Exit Guided Demonstration"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
