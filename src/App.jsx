/**
 * STM32H7 Motor Speed Control System - Digital Twin Laboratory
 *
 * Master Application Component
 *
 * Implements a Three-Column Immersive Engineering Layout:
 * - LEFT (23%): Guided Simulation Curriculum & Manual Hardware Controls
 * - MIDDLE (57%): 3D Engineering Laboratory & Viewport Controls (Hero Visual Focus)
 * - RIGHT (20%): Live System Summary & Component Inspector
 * - BOTTOM: Collapsible Oscilloscope, Event Timeline & Telemetry Dock
 */

import React, { useState, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Activity,
  RadioTower,
  Clock,
  Info,
  RefreshCw,
  Tag,
} from 'lucide-react';

import { useSimulation } from './hooks/useSimulation.js';
import { useGuidedSimulation } from './hooks/useGuidedSimulation.js';
import { LabScene } from './components/LabScene.jsx';
import { TopNav } from './components/TopNav.jsx';
import { LeftGuidePanel } from './components/LeftGuidePanel.jsx';
import { RightSummaryPanel } from './components/RightSummaryPanel.jsx';
import { ChartsPanel } from './components/ChartsPanel.jsx';
import { TelemetryPanel } from './components/TelemetryPanel.jsx';
import { EventTimelinePanel } from './components/EventTimelinePanel.jsx';
import { EducationalGuide } from './components/EducationalGuide.jsx';
import { CAMERA_PRESETS } from './utils/constants.js';

export default function App() {
  const {
    simState,
    history,
    start,
    stop,
    reset,
    setTargetRpm,
    setLoadTorque,
    setSupplyVoltage,
    setPidGains,
    toggleFault,
    clearFaults,
    triggerStepLoad,
  } = useSimulation(90);

  // Guided Simulation State Machine
  const guided = useGuidedSimulation({
    simState,
    start,
    stop,
    setTargetRpm,
    triggerStepLoad,
    toggleFault,
    clearFaults,
  });

  // UI state
  const [cameraPreset, setCameraPreset] = useState('overview');
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [isDockExpanded, setIsDockExpanded] = useState(false);
  const [dockTab, setDockTab] = useState('charts'); // 'charts' | 'events' | 'telemetry' | 'legend'
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleResetCamera = useCallback(() => {
    setCameraPreset('overview');
  }, []);

  const handleSelectComponent = useCallback((key) => {
    setSelectedComponent(key);
  }, []);

  return (
    <div className="app-container">
      {/* Top Engineering Navigation Bar */}
      <TopNav
        simState={simState}
        cameraPreset={cameraPreset}
        onSelectCameraPreset={setCameraPreset}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels(!showLabels)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onResetCamera={handleResetCamera}
        isGuidedActive={guided.isGuidedActive}
        onToggleGuided={guided.isGuidedActive ? guided.stopGuided : guided.startGuided}
      />

      {/* Main Workspace: Three-Column Immersive Layout */}
      <main className="main-workspace">
        {/* ============================================================ */}
        {/* COLUMN 1: LEFT GUIDED SIMULATION & LAB CONTROLS (~23%)       */}
        {/* ============================================================ */}
        <LeftGuidePanel
          guided={guided}
          simState={simState}
          onStart={start}
          onStop={stop}
          onReset={reset}
          onSetTargetRpm={setTargetRpm}
          onSetLoadTorque={setLoadTorque}
          onSetSupplyVoltage={setSupplyVoltage}
          onSetPidGains={setPidGains}
          onToggleFault={toggleFault}
          onClearFaults={clearFaults}
          onTriggerStepLoad={triggerStepLoad}
        />

        {/* ============================================================ */}
        {/* COLUMN 2: CENTER 3D ENGINEERING LABORATORY (~57%)             */}
        {/* Visual hero: DC Motor, shaft, coupling, and wiring harness  */}
        {/* ============================================================ */}
        <div className="center-lab-column">
          {/* 3D Scene Viewport */}
          <div className="center-canvas-wrapper">
            <LabScene
              simState={simState}
              selectedComponent={selectedComponent}
              onSelectComponent={handleSelectComponent}
              cameraPreset={cameraPreset}
              showLabels={showLabels}
              guidedStep={guided.isGuidedActive ? guided.currentStep : null}
              autoCameraEnabled={guided.autoCameraEnabled}
            />
          </div>

          {/* Floating Camera & View Controls in Center 3D Viewport */}
          <div className="center-camera-toolbar">
            <select
              value={cameraPreset}
              onChange={(e) => setCameraPreset(e.target.value)}
              className="center-cam-dropdown"
              title="Camera View Angle"
            >
              {Object.entries(CAMERA_PRESETS).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleResetCamera}
              className="center-cam-btn"
              title="Reset Camera to Lab Overview"
            >
              <RefreshCw size={12} />
              <span>Reset</span>
            </button>

            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`center-cam-btn ${showLabels ? 'active' : ''}`}
              title="Toggle 3D Hardware Labels"
            >
              <Tag size={12} />
              <span>Labels</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* COLUMN 3: RIGHT LIVE SYSTEM SUMMARY & METRICS (~20%)         */}
        {/* ============================================================ */}
        <RightSummaryPanel
          simState={simState}
          selectedComponent={selectedComponent}
          onDeselectComponent={() => setSelectedComponent(null)}
        />
      </main>

      {/* ============================================================== */}
      {/* BOTTOM COLLAPSIBLE DOCK: Charts, Event Timeline & Telemetry    */}
      {/* ============================================================== */}
      <footer className={`bottom-dock ${isDockExpanded ? 'expanded' : 'minimized'}`}>
        <div className="dock-header-bar">
          <div className="dock-tabs">
            {/* Oscilloscope Tab */}
            <button
              className={`dock-tab-btn ${dockTab === 'charts' ? 'active' : ''}`}
              onClick={() => {
                setDockTab('charts');
                setIsDockExpanded(true);
              }}
            >
              <Activity size={14} className="text-cyan-400" />
              <span>Oscilloscope Charts</span>
            </button>

            {/* Event Timeline Tab */}
            <button
              className={`dock-tab-btn ${dockTab === 'events' ? 'active' : ''}`}
              onClick={() => {
                setDockTab('events');
                setIsDockExpanded(true);
              }}
            >
              <Clock size={14} className="text-amber-400" />
              <span>Event Timeline ({simState.events?.length || 0})</span>
            </button>

            {/* Telemetry Tab */}
            <button
              className={`dock-tab-btn ${dockTab === 'telemetry' ? 'active' : ''}`}
              onClick={() => {
                setDockTab('telemetry');
                setIsDockExpanded(true);
              }}
            >
              <RadioTower size={14} className="text-purple-400" />
              <span>CAN / FDCAN Telemetry ({simState.telemetry.messages.length})</span>
            </button>

            {/* Signal Legend Tab */}
            <button
              className={`dock-tab-btn ${dockTab === 'legend' ? 'active' : ''}`}
              onClick={() => {
                setDockTab('legend');
                setIsDockExpanded(true);
              }}
            >
              <Info size={14} className="text-slate-400" />
              <span>Signal Wiring Legend</span>
            </button>
          </div>

          <div className="dock-actions">
            <button
              className="dock-toggle-btn"
              onClick={() => setIsDockExpanded(!isDockExpanded)}
              title={isDockExpanded ? 'Minimize Dock' : 'Expand Dock'}
            >
              {isDockExpanded ? (
                <>
                  <ChevronDown size={14} />
                  <span>Minimize</span>
                </>
              ) : (
                <>
                  <ChevronUp size={14} />
                  <span>Expand Data</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dock Content Body */}
        {isDockExpanded && (
          <div className="dock-body">
            {dockTab === 'charts' && (
              <ChartsPanel history={history} />
            )}

            {dockTab === 'events' && (
              <EventTimelinePanel events={simState.events || []} />
            )}

            {dockTab === 'telemetry' && (
              <TelemetryPanel
                telemetry={simState.telemetry}
                isHealthy={simState.faults.isCanHealthy}
              />
            )}

            {dockTab === 'legend' && (
              <div className="wire-legend-container">
                <div className="text-xs text-slate-300">
                  Visible 3D conduits and dynamic traveling pulses represent physical signal interconnects in the workstation:
                </div>
                <div className="wire-legend-grid">
                  <div className="legend-card">
                    <div className="flex items-center text-xs font-semibold text-red-400">
                      <span className="legend-color-dot" style={{ backgroundColor: '#dc2626' }} />
                      Power Path (+24V / GND)
                    </div>
                    <div className="text-xs text-slate-400">
                      Power Supply &rarr; Driver PCB &rarr; Motor Phase terminals. Heavy gauge current conduits.
                    </div>
                  </div>

                  <div className="legend-card">
                    <div className="flex items-center text-xs font-semibold text-cyan-400">
                      <span className="legend-color-dot" style={{ backgroundColor: '#06b6d4' }} />
                      PWM Control Path
                    </div>
                    <div className="text-xs text-slate-400">
                      STM32 TIM1_CH1 &rarr; Driver Gate Logic. 20 kHz pulse stream with speed-scaled traveling particles.
                    </div>
                  </div>

                  <div className="legend-card">
                    <div className="flex items-center text-xs font-semibold text-emerald-400">
                      <span className="legend-color-dot" style={{ backgroundColor: '#10b981' }} />
                      Encoder Feedback Path
                    </div>
                    <div className="text-xs text-slate-400">
                      Optical Encoder &rarr; STM32 TIM2. Channels A/B pulses returning to hardware counter.
                    </div>
                  </div>

                  <div className="legend-card">
                    <div className="flex items-center text-xs font-semibold text-amber-400">
                      <span className="legend-color-dot" style={{ backgroundColor: '#f59e0b' }} />
                      Sensor Acquisition Path
                    </div>
                    <div className="text-xs text-slate-400">
                      Current Transducer &amp; Temp Probe &rarr; STM32 ADCs. Analog telemetry acquisition.
                    </div>
                  </div>

                  <div className="legend-card">
                    <div className="flex items-center text-xs font-semibold text-purple-400">
                      <span className="legend-color-dot" style={{ backgroundColor: '#a855f7' }} />
                      CAN/FDCAN Telemetry Path
                    </div>
                    <div className="text-xs text-slate-400">
                      STM32 FDCAN1 &rarr; Physical Transceiver. Periodic differential telemetry broadcast.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </footer>

      {/* Educational Guide & Interactive Tutorial Modal */}
      <EducationalGuide
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onSelectCameraPreset={setCameraPreset}
      />
    </div>
  );
}
