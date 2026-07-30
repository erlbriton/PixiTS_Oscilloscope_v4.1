// src/config/DeviceModels.ts

import { ChannelConfig } from '../core/Channel';

export interface DevicePreset {
    id: string;
    name: string;
    description: string;
    baudRate: number;
    channels: ChannelConfig[];
}

export const DEVICE_PRESETS: DevicePreset[] = [
    {
        id: '3phase_power',
        name: '3-Phase Power System (IA, IB, IC, UA, UB, UC)',
        description: 'Standard 3-phase electrical motor & inverter monitoring',
        baudRate: 115200,
        channels: [
            { id: 'ch_ia', name: 'IA', description: 'Phase A Current', value: 12.54, unit: 'A', color: '#ff3366', min: -30, max: 30, type: 'analog' },
            { id: 'ch_ib', name: 'IB', description: 'Phase B Current', value: -6.27, unit: 'A', color: '#33ccff', min: -30, max: 30, type: 'analog' },
            { id: 'ch_ic', name: 'IC', description: 'Phase C Current', value: -6.27, unit: 'A', color: '#ffcc00', min: -30, max: 30, type: 'analog' },
            { id: 'ch_ua', name: 'UA', description: 'Phase A Voltage', value: 220.5, unit: 'V', color: '#00ff66', min: -350, max: 350, type: 'analog' },
            { id: 'ch_ub', name: 'UB', description: 'Phase B Voltage', value: -110.2, unit: 'V', color: '#ff66cc', min: -350, max: 350, type: 'analog' },
            { id: 'ch_uc', name: 'UC', description: 'Phase C Voltage', value: -110.2, unit: 'V', color: '#a855f7', min: -350, max: 350, type: 'analog' },
            { id: 'ch_pwr_ok', name: 'PWR_OK', description: 'Grid Power Good Status', value: 1, unit: 'FLAG', color: '#22c55e', min: 0, max: 1, type: 'digital' },
            { id: 'ch_trip', name: 'TRIP', description: 'Overcurrent Relay Trip', value: 0, unit: 'FLAG', color: '#ef4444', min: 0, max: 1, type: 'digital' },
        ]
    },
    {
        id: 'hvac_sensors',
        name: 'HVAC & Environmental Sensors',
        description: 'Multi-channel temperature, humidity, pressure & fan control',
        baudRate: 9600,
        channels: [
            { id: 'ch_temp1', name: 'TEMP_IN', description: 'Indoor Temperature', value: 23.4, unit: '°C', color: '#f97316', min: 0, max: 50, type: 'analog' },
            { id: 'ch_temp2', name: 'TEMP_OUT', description: 'Outdoor Temperature', value: 14.8, unit: '°C', color: '#06b6d4', min: -20, max: 50, type: 'analog' },
            { id: 'ch_hum', name: 'HUMID', description: 'Relative Humidity', value: 45.2, unit: '%', color: '#3b82f6', min: 0, max: 100, type: 'analog' },
            { id: 'ch_press', name: 'PRESS', description: 'Barometric Pressure', value: 1013.2, unit: 'hPa', color: '#8b5cf6', min: 900, max: 1100, type: 'analog' },
            { id: 'ch_fan', name: 'FAN_STATE', description: 'Air Blower Relay', value: 1, unit: 'STATE', color: '#10b981', min: 0, max: 1, type: 'digital' }
        ]
    },
    {
        id: 'ecg_medical',
        name: 'Bio-Signal / Heart Rate Monitoring',
        description: 'High-frequency analog biosignals (ECG & Pulse Ox)',
        baudRate: 57600,
        channels: [
            { id: 'ch_ecg', name: 'ECG_LEAD1', description: 'Electrocardiogram Lead I', value: 0.12, unit: 'mV', color: '#10b981', min: -2.5, max: 2.5, type: 'analog' },
            { id: 'ch_resp', name: 'RESP', description: 'Respiration Waveform', value: 12.0, unit: 'BPM', color: '#06b6d4', min: 0, max: 30, type: 'analog' },
            { id: 'ch_spo2', name: 'SpO2', description: 'Blood Oxygen Level', value: 98.5, unit: '%', color: '#f43f5e', min: 80, max: 100, type: 'analog' },
            { id: 'ch_pacing', name: 'PACE_PULSE', description: 'Pacemaker Detect Event', value: 0, unit: 'TRIG', color: '#eab308', min: 0, max: 1, type: 'digital' }
        ]
    }
];
