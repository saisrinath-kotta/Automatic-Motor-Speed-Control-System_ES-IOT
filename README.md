# Automatic Motor Speed Control System Using STM32H7 — Realistic 3D Engineering Simulation

An interactive digital twin and 3D engineering laboratory simulating closed-loop DC motor speed regulation using the **STM32H7** microcontroller concept, discrete-time PID control, pulse-width modulation (PWM), optical quadrature encoder feedback, and industrial FDCAN telemetry.

> **Important Notice:** This is a deterministic **software simulation and digital twin**, not a real STM32H7 physical hardware measurement or connection to a physical microcontroller board.

---

## 1. Project Purpose

The purpose of this digital twin is to provide engineering students, embedded systems developers, and control engineers with a realistic, hands-on industrial workstation simulator. Users can inspect, perturb, tune, and test how an embedded motor control system operates in real time:
- Selecting target speeds (0–3000 RPM)
- Observing discrete-time PID control calculations and anti-windup clamping
- Generating 20 kHz PWM signals to drive a high-current H-bridge MOSFET power stage
- Driving mechanical inertia and viscous load disturbances
- Reading 1024 CPR optical quadrature encoder feedback
- Monitoring Hall-effect armature current and stator thermal dynamics
- Broadcasting periodic and event-triggered CAN/FDCAN frames
- Injecting hardware faults (overcurrent, overtemperature, encoder loss, and CAN bus error) and observing protective safe-state shutdown behavior.

---

## 2. Technology Stack

- **Framework**: React 18 with Vite 5 (JavaScript only, no TypeScript)
- **3D Graphics & WebGL**: Three.js, React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`)
- **Real-Time Data Visualization**: Recharts (High-performance multi-trace oscilloscope graphs)
- **Icons & UI**: Lucide React
- **Design System**: Industrial dark mode CSS with custom typography (`Inter` & `JetBrains Mono`), glassmorphism, responsive docking panels, and accessible HUD controls

---

## 3. Architecture & Project Structure

```
d:/Motor_speed_control/
├── index.html                  # HTML5 entry with meta tags and Google Fonts
├── vite.config.js              # Vite configuration with chunk splitting
├── package.json                # Project dependencies and script declarations
├── test_simulation.js          # Automated simulation physics and control verification suite
├── src/
│   ├── main.jsx                # React DOM root entry
│   ├── App.jsx                 # Master application layout, dock state & overlays
│   ├── styles/
│   │   └── global.css          # Industrial dark theme styling, HUD cards & responsive layout
│   ├── components/
│   │   ├── LabScene.jsx        # 3D Laboratory environment, lighting, workbench, orbit controls
│   │   ├── MotorAssembly.jsx   # 3D DC Motor with cooling fins, end caps, and rotating shaft marker
│   │   ├── EncoderAssembly.jsx # 3D Optical Quadrature Encoder with spinning slotted code disc
│   │   ├── LoadAssembly.jsx    # 3D Mechanical flexible coupling, pillow bearings, flywheel & brake
│   │   ├── MotorDriverBoard.jsx# 3D H-Bridge MOSFET PCB with heatsink, terminals, and PWM/fault LEDs
│   │   ├── STM32H7Board.jsx    # 3D STM32 Nucleo-144 board with Cortex-M7, ST-LINK, and pin headers
│   │   ├── SensorModules.jsx   # 3D Hall-effect current module and stator RTD temperature probe
│   │   ├── PowerSupply.jsx     # 3D Benchtop 24V DC laboratory power supply with digital readouts
│   │   ├── CanTransceiver.jsx  # 3D CAN/FDCAN breakout board with termination jumper & activity LED
│   │   ├── SignalWires.jsx     # 3D Catmull-Rom conduits with dynamic traveling pulse particles
│   │   ├── TopNav.jsx          # Header with system status pills, camera view presets & guide trigger
│   │   ├── ControlPanel.jsx    # Motor operation, target speed, load disturbance, PID tuning & faults
│   │   ├── MetricsPanel.jsx    # Real-time engineering telemetry HUD with glanceable gauges
│   │   ├── ComponentInspector.jsx# Technical documentation, signal I/O, formulas and live parameters
│   │   ├── ChartsPanel.jsx     # Live oscilloscope graphs (Speed, PWM %, Current A, Temp °C)
│   │   ├── TelemetryPanel.jsx  # Terminal-style CAN/FDCAN message monitor with hex byte view
│   │   └── EducationalGuide.jsx# Interactive 10-step laboratory tutorial and embedded theory
│   ├── simulation/
│   │   ├── motorModel.js       # Coupled electrical, mechanical, and thermal differential equations
│   │   ├── pidController.js    # Discrete-time PID with anti-windup & filtered derivative on PV
│   │   ├── faultManager.js     # Deterministic safety interlocks and protective latch management
│   │   ├── telemetry.js        # Periodic & emergency CAN-FD frame pack/unpack protocol engine
│   │   └── simulationEngine.js # Master fixed-step coordinator tying physics, PID, faults & CAN
│   ├── hooks/
│   │   └── useSimulation.js    # React hook managing 60FPS animation loop, history ring-buffer & dispatch
│   └── utils/
│       ├── constants.js        # Physical parameters, thresholds, CAN IDs, and camera presets
│       └── formatters.js       # Formatting utilities for engineering units, hex bytes, and time
```

---

## 4. Mathematical Model & Control Theory

### A. Mechanical Subsystem
The rotational dynamics of the motor shaft, coupling, and load flywheel are governed by Newton's rotational second law:
$$J \cdot \frac{d\omega}{dt} = T_{\text{motor}} - T_{\text{load}} - B \cdot \omega - T_{\text{coulomb}}$$
- $\omega$: Angular velocity in $\text{rad/s}$ ($\text{RPM} = \omega \times \frac{60}{2\pi}$)
- $J = J_{\text{motor}} + J_{\text{load}} = 0.0008 + 0.0016 = 0.0024\ \text{kg}\cdot\text{m}^2$: Total effective rotational inertia
- $T_{\text{motor}} = K_t \cdot I$: Electromagnetic motor torque ($K_t = 0.065\ \text{N}\cdot\text{m/A}$)
- $T_{\text{load}}$: Opposing load torque applied by the mechanical brake caliper ($0.0 - 2.2\ \text{N}\cdot\text{m}$)
- $B = 0.00035\ \text{N}\cdot\text{m}\cdot\text{s/rad}$: Viscous friction damping coefficient
- $T_{\text{coulomb}} = 0.015\ \text{N}\cdot\text{m}$: Dry static stiction friction

### B. Electrical Subsystem
The motor armature circuit obeys Kirchhoff's voltage law with internal winding inductance:
$$L_a \frac{dI}{dt} = V_{\text{applied}} - E_{\text{bemf}} - R_a \cdot I$$
- $V_{\text{applied}} = V_{\text{bus}} \times \left(\frac{\text{PWM Duty}}{100.0}\right)$: Chopped armature voltage from the H-bridge inverter
- $E_{\text{bemf}} = K_e \cdot \omega$: Opposing Back-EMF generated by the spinning rotor ($K_e = 0.065\ \text{V}/(\text{rad/s})$)
- $R_a = 1.25\ \Omega$: Armature winding resistance
- $L_a = 2.0\ \text{mH}$: Armature winding inductance

### C. Thermal Subsystem
Joule heating ($I^2 R_a$) and core iron losses increase stator temperature over time:
$$P_{\text{loss}} = I^2 \cdot R_a + 0.04 \cdot P_{\text{mech}}$$
$$\frac{dT_{\text{motor}}}{dt} = \frac{(T_{\text{ambient}} + P_{\text{loss}} \cdot R_{\text{th}}) - T_{\text{motor}}}{\tau_{\text{thermal}}}$$
- $R_{\text{th}} = 1.85\ ^\circ\text{C/W}$: Thermal resistance to ambient air
- $\tau_{\text{thermal}} = 40.0\ \text{s}$: Thermal time constant (scaled for observable interactive dynamics)

### D. Discrete-Time PID Speed Controller
Running inside a simulated STM32 FreeRTOS control task at $100\ \text{Hz}$ ($T_s = 0.01\ \text{s}$):
1. **Error**: $e[k] = \text{Target\_RPM}[k] - \text{Measured\_RPM}[k]$
2. **Proportional Term**: $P[k] = K_p \cdot e[k]$
3. **Integral Term with Anti-Windup Clamping**:
   $$I_{\text{tentative}} = I[k-1] + e[k] \cdot T_s$$
   Clamped when the total actuator output reaches $0\%$ or $100\%$ saturation.
4. **Filtered Derivative on Measurement (D on PV)**:
   $$\Delta \text{PV} = \text{Measured\_RPM}[k] - \text{Measured\_RPM}[k-1]$$
   Filtered through a first-order low-pass filter ($\tau_d = 0.015\ \text{s}$) to avoid setpoint kick upon step changes.
5. **Output**: Saturated between $0.0\%$ and $100.0\%$ PWM duty cycle.

---

## 5. Fault Detection & Protection

| Fault Type | Threshold / Trigger | Protective Action | Recovery Behavior |
| :--- | :--- | :--- | :--- |
| **Armature Overcurrent** | Sustained $I > 11.5\ \text{A}$ for $>60\ \text{ms}$ or manual toggle | PWM gate drive immediately inhibited ($0\%$ duty), red fault LED lit, emergency CAN alert frame (0x070) | Latched; requires "Reset Faults" once load/current is safe |
| **Stator Overtemperature** | Stator $T > 80.0\ ^\circ\text{C}$ or manual toggle | Thermal shutdown; PWM output locked to $0\%$ until temperature cools | Latched; cleared once stator temperature falls below trip limit |
| **Encoder Signal Loss** | Quadrature pulses drop to $0$ / invalid signal toggle | Closed-loop feedback marked `INVALID`; drive disabled for machinery safety | Resumes closed-loop regulation once encoder connection is restored and cleared |
| **FDCAN Bus-Off** | Transceiver disconnect toggle | Enters error-passive state; halts CAN frame broadcast | Local speed control continues; CAN transmission resumes upon bus restoration |

---

## 6. Simulated CAN / FDCAN Telemetry Bus

| CAN ID | Protocol | Message Name | Cycle Rate | Decoded Engineering Fields |
| :---: | :---: | :--- | :---: | :--- |
| `0x180` | CAN-FD | `MOTOR_SPEED_ACTUAL` | 20 ms | Target RPM, Actual RPM, PWM Duty Cycle (%), Drive Status |
| `0x181` | CAN-FD | `MOTOR_ELECTRICAL` | 50 ms | Armature Current (A), Bus Voltage (V), Power (W) |
| `0x182` | CAN-FD | `MOTOR_THERMAL` | 100 ms | Stator Temperature (°C), Driver Inverter Temp (°C) |
| `0x183` | CAN-FD | `ENCODER_FEEDBACK` | 20 ms | Quadrature Pulse Counter, Frequency (Hz), Status |
| `0x070` | CAN-FD | `SYSTEM_ALERT_FAULT` | Event / 10ms | Critical trip code, protective action, latch status |

---

## 7. Installation & Execution

### Prerequisites
- Node.js (v18, v20, v22, or v24)
- npm (v9, v10, or v11)

### Commands

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run automated simulation verification suite:**
   ```bash
   npm test
   ```
   *Validates motor differential equations, PID acceleration, step load droop & recovery, fault interlocks, and CAN telemetry frames.*

3. **Start local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Build production bundle:**
   ```bash
   npm run build
   ```
   Generates an optimized production bundle in `dist/`.

5. **Preview production build locally:**
   ```bash
   npm run preview
   ```

---

## 8. Interactive Features & Guide

- **3D Camera Navigation**: Full OrbitControls (left-click drag to rotate, right-click drag to pan, scroll wheel to zoom).
- **Camera Presets**: Instant smooth transitions to `Lab Overview`, `Motor & Encoder`, `STM32H7 Controller`, `Driver PCB`, and `Harness & Wiring`.
- **Clickable 3D Component Inspector**: Click any 3D hardware assembly (Motor, Encoder, Driver, STM32, Load, Sensors, Power Supply, CAN Transceiver) to view its engineering principles, signal I/O, equations, and live telemetry.
- **Dynamic 3D Signal Paths**: Color-coded conduits with animated traveling pulse particles indicating signal flow direction (PWM from MCU to driver, encoder feedback returning to MCU, sensor data to ADCs, CAN traffic to transceiver).
- **Live Oscilloscope**: Real-time Recharts displays for Speed tracking (SP vs PV), Controller PWM duty %, Armature current, and Stator temperature, with a 4-trace grid option.
- **Step Disturbance Test**: Injects instantaneous $+0.45\ \text{N}\cdot\text{m}$ load shocks to observe speed droop and closed-loop PID recovery in real time.
- **Lab Tutorial Modal**: Built-in 10-step guided tour explaining closed-loop control, PWM modulation, optical encoders, Back-EMF, and protection mechanisms.

---

## 9. Important Limitations

1. This is a **software simulation**, not a physical hardware interface to a real microcontroller.
2. The motor model uses simplified lumped-parameter differential equations suitable for control theory demonstration, without multi-phase harmonics or magnetic saturation modeling.
3. Thermal dynamics are accelerated ($\tau_{\text{thermal}} = 40\text{ s}$) to allow interactive evaluation within a student lab session rather than requiring hours of thermal equilibrium.
