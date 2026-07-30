// src/ui/Toolbar.ts

import { Settings } from '../config/Settings';
import { Recorder } from '../core/Recorder';
import { Serial } from '../comm/Serial';
import { DEVICE_PRESETS } from '../config/DeviceModels';

export class Toolbar {
    private container: HTMLElement;
    private settings: Settings;
    private recorder: Recorder;
    private serial: Serial;

    private connectBtn!: HTMLButtonElement;
    private baudSelect!: HTMLSelectElement;
    private presetSelect!: HTMLSelectElement;
    private recordBtn!: HTMLButtonElement;
    private timebaseSelect!: HTMLSelectElement;
    private autoscaleBtn!: HTMLButtonElement;
    private cursorBtn!: HTMLButtonElement;
    private generatorBtn!: HTMLButtonElement;
    private exportBtn!: HTMLButtonElement;
    private statusBadge!: HTMLSpanElement;

    private onPresetChangeCallback?: (presetId: string) => void;
    private onOpenGeneratorModalCallback?: () => void;

    constructor(
        container: HTMLElement,
        settings: Settings,
        recorder: Recorder,
        serial: Serial
    ) {
        this.container = container;
        this.settings = settings;
        this.recorder = recorder;
        this.serial = serial;
    }

    public onPresetChange(cb: (presetId: string) => void): void {
        this.onPresetChangeCallback = cb;
    }

    public onOpenGeneratorModal(cb: () => void): void {
        this.onOpenGeneratorModalCallback = cb;
    }

    public initialize(): void {
        this.container.innerHTML = '';

        // Group 1: Connection & Presets
        const groupLeft = document.createElement('div');
        groupLeft.className = 'toolbar-group';

        const title = document.createElement('div');
        title.className = 'toolbar-title';
        title.innerHTML = `⚡ PixiTS Oscilloscope`;

        // Connect Button
        this.connectBtn = document.createElement('button');
        this.connectBtn.className = 'toolbar-btn primary';
        this.connectBtn.innerHTML = `🔌 Web Serial`;
        this.connectBtn.addEventListener('click', () => this.handleConnectClick());

        // Baud Select
        this.baudSelect = document.createElement('select');
        this.baudSelect.className = 'toolbar-select';
        [9600, 19200, 38400, 57600, 115200, 230400].forEach(baud => {
            const opt = document.createElement('option');
            opt.value = String(baud);
            opt.textContent = `${baud} Baud`;
            if (baud === 115200) opt.selected = true;
            this.baudSelect.appendChild(opt);
        });

        // Device Presets Select
        this.presetSelect = document.createElement('select');
        this.presetSelect.className = 'toolbar-select';
        DEVICE_PRESETS.forEach(preset => {
            const opt = document.createElement('option');
            opt.value = preset.id;
            opt.textContent = `📋 Preset: ${preset.name.split(' ')[0]}`;
            this.presetSelect.appendChild(opt);
        });
        this.presetSelect.addEventListener('change', (e) => {
            const val = (e.target as HTMLSelectElement).value;
            if (this.onPresetChangeCallback) this.onPresetChangeCallback(val);
        });

        groupLeft.append(title, this.connectBtn, this.baudSelect, this.presetSelect);

        // Group 2: Controls (Timebase, Auto-Scale, Cursors, Signal Gen)
        const groupCenter = document.createElement('div');
        groupCenter.className = 'toolbar-group';

        // Timebase Select
        const timebaseLabel = document.createElement('span');
        timebaseLabel.style.fontSize = '12px';
        timebaseLabel.style.color = '#94a3b8';
        timebaseLabel.textContent = 'Timebase:';

        this.timebaseSelect = document.createElement('select');
        this.timebaseSelect.className = 'toolbar-select';
        [
            { label: '200 ms', val: 200 },
            { label: '500 ms', val: 500 },
            { label: '1.0 sec', val: 1000 },
            { label: '2.0 sec', val: 2000 },
            { label: '5.0 sec', val: 5000 },
            { label: '10 sec', val: 10000 }
        ].forEach(t => {
            const opt = document.createElement('option');
            opt.value = String(t.val);
            opt.textContent = t.label;
            if (t.val === this.settings.timeWindowMs) opt.selected = true;
            this.timebaseSelect.appendChild(opt);
        });
        this.timebaseSelect.addEventListener('change', (e) => {
            this.settings.timeWindowMs = parseInt((e.target as HTMLSelectElement).value, 10);
        });

        // Autoscale Toggle
        this.autoscaleBtn = document.createElement('button');
        this.autoscaleBtn.className = `toolbar-btn ${this.settings.autoScale ? 'active' : ''}`;
        this.autoscaleBtn.innerHTML = `📐 Auto-Scale`;
        this.autoscaleBtn.addEventListener('click', () => {
            this.settings.autoScale = !this.settings.autoScale;
            this.autoscaleBtn.classList.toggle('active', this.settings.autoScale);
        });

        // Cursors Toggle
        this.cursorBtn = document.createElement('button');
        this.cursorBtn.className = `toolbar-btn ${this.settings.enableCursors ? 'active' : ''}`;
        this.cursorBtn.innerHTML = `📏 Cursors`;
        this.cursorBtn.addEventListener('click', () => {
            this.settings.enableCursors = !this.settings.enableCursors;
            this.cursorBtn.classList.toggle('active', this.settings.enableCursors);
            const footer = document.getElementById('footer');
            if (footer) footer.style.display = this.settings.enableCursors ? 'flex' : 'none';
        });

        // Signal Gen Controls Button
        this.generatorBtn = document.createElement('button');
        this.generatorBtn.className = 'toolbar-btn';
        this.generatorBtn.innerHTML = `🌊 Signal Gen`;
        this.generatorBtn.addEventListener('click', () => {
            if (this.onOpenGeneratorModalCallback) this.onOpenGeneratorModalCallback();
        });

        groupCenter.append(timebaseLabel, this.timebaseSelect, this.autoscaleBtn, this.cursorBtn, this.generatorBtn);

        // Group 3: Recording & Export
        const groupRight = document.createElement('div');
        groupRight.className = 'toolbar-group';

        this.recordBtn = document.createElement('button');
        this.recordBtn.className = 'toolbar-btn success';
        this.recordBtn.innerHTML = `🔴 Record`;
        this.recordBtn.addEventListener('click', () => this.handleRecordClick());

        this.exportBtn = document.createElement('button');
        this.exportBtn.className = 'toolbar-btn';
        this.exportBtn.innerHTML = `💾 Export CSV`;
        this.exportBtn.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('oscilloscope-export-csv'));
        });

        this.statusBadge = document.createElement('span');
        this.statusBadge.className = 'status-badge simulating';
        this.statusBadge.textContent = 'SIMULATOR ACTIVE';

        groupRight.append(this.recordBtn, this.exportBtn, this.statusBadge);

        this.container.append(groupLeft, groupCenter, groupRight);

        // Listen for serial state changes
        this.serial.onStateChange((state, msg) => {
            if (state === 'connected') {
                this.statusBadge.className = 'status-badge connected';
                this.statusBadge.textContent = 'SERIAL CONNECTED';
                this.connectBtn.innerHTML = `🔌 Disconnect`;
            } else if (state === 'simulating') {
                this.statusBadge.className = 'status-badge simulating';
                this.statusBadge.textContent = 'SIMULATOR ACTIVE';
                this.connectBtn.innerHTML = `🔌 Web Serial`;
            }
        });
    }

    private async handleConnectClick(): Promise<void> {
        if (this.serial.getState() === 'connected') {
            await this.serial.disconnect();
        } else {
            const baud = parseInt(this.baudSelect.value, 10);
            await this.serial.connect(baud);
        }
    }

    private handleRecordClick(): void {
        const state = this.recorder.getState();
        if (state === 'idle') {
            this.recorder.start();
            this.recordBtn.innerHTML = `⏸️ Recording...`;
            this.recordBtn.classList.remove('success');
            this.recordBtn.classList.add('primary');
            this.statusBadge.className = 'status-badge recording';
            this.statusBadge.textContent = 'REC 0.0s';
        } else if (state === 'recording') {
            this.recorder.stop();
            this.recordBtn.innerHTML = `🔴 Record`;
            this.recordBtn.classList.remove('primary');
            this.recordBtn.classList.add('success');
            this.statusBadge.className = this.serial.getState() === 'connected' ? 'status-badge connected' : 'status-badge simulating';
            this.statusBadge.textContent = this.serial.getState() === 'connected' ? 'SERIAL CONNECTED' : 'SIMULATOR ACTIVE';
        }
    }

    public updateRecordTimer(): void {
        if (this.recorder.getState() === 'recording') {
            const sec = (this.recorder.getElapsedMs() / 1000).toFixed(1);
            this.statusBadge.textContent = `REC ${sec}s`;
        }
    }
}
