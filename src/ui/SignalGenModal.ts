// src/ui/SignalGenModal.ts

import { Serial } from '../comm/Serial';
import { IniParser } from '../config/IniParser';
import { Channel } from '../core/Channel';

export class SignalGenModal {
    private serial: Serial;
    private modalOverlay: HTMLElement | null = null;
    private onChannelsLoadedCallback?: (channels: Channel[]) => void;

    constructor(serial: Serial) {
        this.serial = serial;
    }

    public onChannelsLoaded(cb: (channels: Channel[]) => void): void {
        this.onChannelsLoadedCallback = cb;
    }

    public open(): void {
        if (this.modalOverlay) return;

        this.modalOverlay = document.createElement('div');
        this.modalOverlay.className = 'modal-overlay';
        this.modalOverlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <span class="modal-title">🌊 Signal Generator & Configuration</span>
                    <button class="modal-close" id="modal-close-btn">&times;</button>
                </div>
                
                <div class="form-group">
                    <label>Signal Frequency: <span id="freq-val">${this.serial.simParams.frequency}</span> Hz</label>
                    <input type="range" class="form-range" id="freq-slider" min="1" max="200" value="${this.serial.simParams.frequency}">
                </div>

                <div class="form-group">
                    <label>Noise Level: <span id="noise-val">${this.serial.simParams.noiseLevel}</span></label>
                    <input type="range" class="form-range" id="noise-slider" min="0" max="10" step="0.1" value="${this.serial.simParams.noiseLevel}">
                </div>

                <div class="form-group" style="display: flex; gap: 16px; margin-top: 12px;">
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                        <input type="checkbox" id="harmonics-chk" ${this.serial.simParams.harmonics ? 'checked' : ''}>
                        Add Harmonics (3rd & 5th)
                    </label>
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                        <input type="checkbox" id="phase-chk" ${this.serial.simParams.phaseShift ? 'checked' : ''}>
                        120° 3-Phase Shift
                    </label>
                </div>

                <hr style="border: 0; border-top: 1px solid #334155; margin: 16px 0;">

                <div class="form-group">
                    <label>Import INI Configuration File</label>
                    <input type="file" id="ini-file-input" accept=".ini,.txt" style="font-size: 12px; color: #cbd5e1;">
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;">
                    <button class="toolbar-btn primary" id="modal-done-btn">Done</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.modalOverlay);

        // Bind events
        const closeBtn = this.modalOverlay.querySelector('#modal-close-btn');
        const doneBtn = this.modalOverlay.querySelector('#modal-done-btn');
        const freqSlider = this.modalOverlay.querySelector('#freq-slider') as HTMLInputElement;
        const noiseSlider = this.modalOverlay.querySelector('#noise-slider') as HTMLInputElement;
        const harmonicsChk = this.modalOverlay.querySelector('#harmonics-chk') as HTMLInputElement;
        const phaseChk = this.modalOverlay.querySelector('#phase-chk') as HTMLInputElement;
        const fileInput = this.modalOverlay.querySelector('#ini-file-input') as HTMLInputElement;

        closeBtn?.addEventListener('click', () => this.close());
        doneBtn?.addEventListener('click', () => this.close());

        freqSlider?.addEventListener('input', (e) => {
            const val = parseFloat((e.target as HTMLInputElement).value);
            this.serial.simParams.frequency = val;
            const freqValSpan = this.modalOverlay?.querySelector('#freq-val');
            if (freqValSpan) freqValSpan.textContent = String(val);
        });

        noiseSlider?.addEventListener('input', (e) => {
            const val = parseFloat((e.target as HTMLInputElement).value);
            this.serial.simParams.noiseLevel = val;
            const noiseValSpan = this.modalOverlay?.querySelector('#noise-val');
            if (noiseValSpan) noiseValSpan.textContent = String(val);
        });

        harmonicsChk?.addEventListener('change', (e) => {
            this.serial.simParams.harmonics = (e.target as HTMLInputElement).checked;
        });

        phaseChk?.addEventListener('change', (e) => {
            this.serial.simParams.phaseShift = (e.target as HTMLInputElement).checked;
        });

        fileInput?.addEventListener('change', (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                if (text) {
                    const parsed = IniParser.parse(text);
                    if (parsed.channels.length > 0 && this.onChannelsLoadedCallback) {
                        const newChannels = parsed.channels.map(cfg => new Channel(cfg));
                        this.onChannelsLoadedCallback(newChannels);
                        this.close();
                    }
                }
            };
            reader.readAsText(file);
        });
    }

    public close(): void {
        if (this.modalOverlay && this.modalOverlay.parentElement) {
            this.modalOverlay.parentElement.removeChild(this.modalOverlay);
            this.modalOverlay = null;
        }
    }
}
