/**
 * ChartsPanel: Real-time Oscilloscope Graphs using Recharts
 *
 * Visualizes:
 * 1. Speed Tracking: Target RPM vs Actual RPM (step response, overshoot, droop)
 * 2. Controller Output: PWM Duty Cycle (%)
 * 3. Armature Current: Inrush & load current (A)
 * 4. Stator Temperature: Joule heating (°C)
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Activity, Cpu, Zap, Flame } from 'lucide-react';

export function ChartsPanel({ history = [] }) {
  const [chartView, setChartView] = useState('speed'); // 'speed' | 'pwm' | 'current' | 'temperature' | 'quad'

  return (
    <div className="charts-container">
      {/* Chart View Switcher Header */}
      <div className="charts-header">
        <div className="charts-title-row">
          <Activity size={15} className="text-cyan-400" />
          <span className="font-semibold text-slate-200 text-sm">
            Real-Time Oscilloscope &bull; Bounded History Window
          </span>
        </div>
        <div className="chart-tab-buttons">
          <button
            className={`chart-tab ${chartView === 'speed' ? 'active' : ''}`}
            onClick={() => setChartView('speed')}
          >
            Speed (RPM)
          </button>
          <button
            className={`chart-tab ${chartView === 'pwm' ? 'active' : ''}`}
            onClick={() => setChartView('pwm')}
          >
            PWM Duty (%)
          </button>
          <button
            className={`chart-tab ${chartView === 'current' ? 'active' : ''}`}
            onClick={() => setChartView('current')}
          >
            Current (A)
          </button>
          <button
            className={`chart-tab ${chartView === 'temperature' ? 'active' : ''}`}
            onClick={() => setChartView('temperature')}
          >
            Temperature (&deg;C)
          </button>
          <button
            className={`chart-tab ${chartView === 'quad' ? 'active' : ''}`}
            onClick={() => setChartView('quad')}
          >
            4-Trace Grid
          </button>
        </div>
      </div>

      {/* Main Graph Area */}
      <div className="chart-body">
        {history.length === 0 ? (
          <div className="chart-empty-state">
            Waiting for simulation data... Start the motor to record live waveforms.
          </div>
        ) : chartView === 'quad' ? (
          /* 4-Trace Grid View */
          <div className="quad-chart-grid">
            {/* 1. Speed */}
            <div className="quad-card">
              <div className="quad-card-title text-cyan-400">Motor Speed (RPM)</div>
              <ResponsiveContainer width="100%" height={110}>
                <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <YAxis domain={[0, 3200]} stroke="#64748b" fontSize={10} />
                  <Line type="monotone" dataKey="targetRpm" stroke="#94a3b8" strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="actualRpm" stroke="#38bdf8" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 2. PWM */}
            <div className="quad-card">
              <div className="quad-card-title text-blue-400">PWM Output (%)</div>
              <ResponsiveContainer width="100%" height={110}>
                <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} />
                  <Line type="monotone" dataKey="pwmDuty" stroke="#60a5fa" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 3. Current */}
            <div className="quad-card">
              <div className="quad-card-title text-amber-400">Armature Current (A)</div>
              <ResponsiveContainer width="100%" height={110}>
                <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <YAxis domain={[0, 14]} stroke="#64748b" fontSize={10} />
                  <Line type="monotone" dataKey="current" stroke="#f59e0b" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 4. Temp */}
            <div className="quad-card">
              <div className="quad-card-title text-rose-400">Stator Temp (&deg;C)</div>
              <ResponsiveContainer width="100%" height={110}>
                <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <YAxis domain={[20, 85]} stroke="#64748b" fontSize={10} />
                  <Line type="monotone" dataKey="temperature" stroke="#f43f5e" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          /* Single Dedicated Detailed Chart */
          <ResponsiveContainer width="100%" height={180}>
            {chartView === 'speed' ? (
              <LineChart data={history} margin={{ top: 8, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} unit="s" />
                <YAxis domain={[0, 3200]} stroke="#64748b" fontSize={11} unit=" RPM" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '12px' }}
                />
                <Legend verticalAlign="top" height={26} wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="targetRpm" name="Target Setpoint (SP)" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="actualRpm" name="Actual Speed (PV)" stroke="#06b6d4" strokeWidth={2.2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="measuredRpm" name="Encoder Measured" stroke="#10b981" strokeWidth={1.2} strokeDasharray="2 2" dot={false} isAnimationActive={false} />
              </LineChart>
            ) : chartView === 'pwm' ? (
              <LineChart data={history} margin={{ top: 8, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} unit="s" />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '12px' }}
                />
                <Legend verticalAlign="top" height={26} wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="pwmDuty" name="PWM Duty Cycle (%)" stroke="#3b82f6" strokeWidth={2.2} dot={false} isAnimationActive={false} />
              </LineChart>
            ) : chartView === 'current' ? (
              <LineChart data={history} margin={{ top: 8, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} unit="s" />
                <YAxis domain={[0, 14]} stroke="#64748b" fontSize={11} unit=" A" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '12px' }}
                />
                <Legend verticalAlign="top" height={26} wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="current" name="Armature Current (A)" stroke="#f59e0b" strokeWidth={2.2} dot={false} isAnimationActive={false} />
              </LineChart>
            ) : (
              <LineChart data={history} margin={{ top: 8, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} unit="s" />
                <YAxis domain={[20, 85]} stroke="#64748b" fontSize={11} unit=" °C" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '12px' }}
                />
                <Legend verticalAlign="top" height={26} wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="temperature" name="Stator Temperature (°C)" stroke="#f43f5e" strokeWidth={2.2} dot={false} isAnimationActive={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
