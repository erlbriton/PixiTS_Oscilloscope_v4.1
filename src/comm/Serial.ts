// src/comm/Serial.ts

import { Channel } from '../core/Channel';
import { Archive } from '../core/Archive';
import { Modbus } from './Modbus';

export type SerialState = 'disconnected' | 'connecting' | 'connected' | 'simulating' | 'error';

export interface SignalGenParams {
    frequency: number;  // Base signal frequency in Hz (e.g., 50 Hz)
    noiseLevel: number; // Random noise amplitude (0 to 10)
    harmonics: boolean; // Add 3rd/5th harmonics
    phaseShift: boolean;// Enable 120-degree 3-phase shift
}

export class Serial {
    private state: SerialState = 'simulating';
    private port: any = null;
    private reader: any = null;
    private baudRate: number = 115200;
    private archive: Archive;
    private channels: Channel[] = [];
    private stateChangeCallbacks: ((state: SerialState, msg?: string) => void)[] = [];

    // Generator settings
    public simParams: SignalGenParams = {
        frequency: 50,
        noiseLevel: 0.5,
        harmonics: true,
        phaseShift: true
    };

    private simTimeMs: number = 0;

    constructor(archive: Archive) {
        this.archive = archive;
    }

    public setChannels(channels: Channel[]): void {
        this.channels = channels;
    }

    public onStateChange(cb: (state: SerialState, msg?: string) => void): void {
        this.stateChangeCallbacks.push(cb);
    }

    private setState(state: SerialState, msg?: string): void {
        this.state = state;
        this.stateChangeCallbacks.forEach(cb => cb(state, msg));
    }

    public getState(): SerialState {
        return this.state;
    }

    public isWebSerialSupported(): boolean {
        return 'serial' in navigator;
    }

    /**
     * Connects to hardware serial port via Web Serial API
     */
    public async connect(baudRate: number = 115200): Promise<boolean> {
        this.baudRate = baudRate;
        if (!this.isWebSerialSupported()) {
            this.setState('simulating', 'Web Serial API is not supported in this browser environment. Using Signal Simulator.');
            return false;
        }

        try {
            this.setState('connecting', 'Requesting serial port permission...');
            const navSerial = (navigator as any).serial;
            this.port = await navSerial.requestPort();
            await this.port.open({ baudRate: this.baudRate });

            this.setState('connected', `Connected via Serial Port @ ${this.baudRate} baud.`);
            this.startReading();
            return true;
        } catch (err: any) {
            console.warn('Web Serial connection failed or cancelled:', err);
            this.setState('simulating', `Serial port connection not established (${err.message || 'Cancelled'}). Using Simulator.`);
            return false;
        }
    }

    public async disconnect(): Promise<void> {
        try {
            if (this.reader) {
                await this.reader.cancel();
                this.reader.releaseLock();
                this.reader = null;
            }
            if (this.port) {
                await this.port.close();
                this.port = null;
            }
        } catch (e) {
            console.error('Error closing serial port:', e);
        }
        this.setState('simulating', 'Serial port disconnected. Switched to Simulation Mode.');
    }

    private async startReading(): Promise<void> {
        if (!this.port || !this.port.readable) return;

        try {
            while (this.port.readable && this.state === 'connected') {
                this.reader = this.port.readable.getReader();
                try {
                    while (true) {
                        const { value, done } = await this.reader.read();
                        if (done) break;
                        if (value) {
                            this.processIncomingBytes(value);
                        }
                    }
                } catch (readErr) {
                    console.error('Serial stream read error:', readErr);
                } finally {
                    this.reader.releaseLock();
                }
            }
        } catch (err) {
            console.error('Port reading loop failed:', err);
            this.setState('error', 'Serial communication error');
        }
    }

    private rxBuffer: number[] = [];
    private processIncomingBytes(data: Uint8Array): void {
        for (let i = 0; i < data.length; i++) {
            this.rxBuffer.push(data[i]);
        }

        // Try parsing Modbus RTU frames or line-delimited ASCII values
        if (this.rxBuffer.length >= 7) {
            const buf = new Uint8Array(this.rxBuffer);
            const modbusRes = Modbus.parseReadResponse(buf);
            if (modbusRes) {
                const now = Date.now();
                modbusRes.registers.forEach((regValue, idx) => {
                    if (idx < this.channels.length) {
                        const ch = this.channels[idx];
                        ch.setValue(regValue);
                        this.archive.addSample(ch.id, now, regValue);
                    }
                });
                this.rxBuffer = [];
                return;
            }
        }

        // Keep buffer trimmed
        if (this.rxBuffer.length > 512) {
            this.rxBuffer = this.rxBuffer.slice(-256);
        }
    }

    /**
     * Updates simulation generators on each frame ticker tick
     */
    public tickSimulation(dtMs: number): void {
        if (this.state !== 'simulating' && this.state !== 'disconnected') {
            return;
        }

        this.simTimeMs += dtMs;
        const now = Date.now();
        const t = this.simTimeMs / 1000;
        const freq = this.simParams.frequency;
        const noise = this.simParams.noiseLevel;

        this.channels.forEach((ch, idx) => {
            let val = 0;
            const phaseShift = this.simParams.phaseShift ? (idx % 3) * ((2 * Math.PI) / 3) : 0;
            const omega = 2 * Math.PI * freq;

            if (ch.type === 'digital') {
                // Digital signal (0 or 1 clock wave)
                const pulsePeriod = 1.0 / Math.max(0.1, freq / 10);
                const isHigh = Math.sin(omega * 0.2 * t + phaseShift) > 0;
                val = isHigh ? 1 : 0;
            } else {
                // Analog signal simulation (Sine, harmonics, modulation)
                let baseWave = Math.sin(omega * t + phaseShift);

                if (this.simParams.harmonics) {
                    baseWave += 0.2 * Math.sin(3 * omega * t) + 0.1 * Math.sin(5 * omega * t);
                }

                // Add amplitude scaling based on channel max
                const amp = (ch.max - ch.min) * 0.4;
                const mid = (ch.max + ch.min) / 2;

                // Add random noise component
                const noiseVal = (Math.random() - 0.5) * noise;

                val = mid + baseWave * amp + noiseVal;
            }

            const roundedVal = Math.round(val * 100) / 100;
            ch.setValue(roundedVal);
            this.archive.addSample(ch.id, now, roundedVal);
        });
    }
}
