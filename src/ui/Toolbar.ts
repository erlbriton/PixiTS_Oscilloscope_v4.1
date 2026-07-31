// src/ui/Toolbar.ts

import { Settings } from '../config/Settings';
import { Recorder } from '../core/Recorder';
import { Serial } from '../comm/Serial';
import { ToolbarComponents } from './ToolbarComponents';

export class Toolbar {
    private container: HTMLElement;
    private settings: Settings;
    private recorder: Recorder;
    private serial: Serial;

    private connectBtn!: HTMLButtonElement;
    private baudSelect!: HTMLSelectElement;
    private recordBtn!: HTMLButtonElement;
    private timebaseSelect!: HTMLSelectElement;
    private autoscaleBtn!: HTMLButtonElement;
    private cursorBtn!: HTMLButtonElement;
    private generatorBtn!: HTMLButtonElement;
    private propertiesBtn!: HTMLButtonElement;
    private exportBtn!: HTMLButtonElement;
    private statusBadge!: HTMLSpanElement;

    private onOpenGeneratorModalCallback?: () => void;
    private onOpenWebSerialModalCallback?: () => void;
    private onOpenPropertiesCallback?: () => void;

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

    public onOpenGeneratorModal(cb: () => void): void {
        this.onOpenGeneratorModalCallback = cb;
    }

    public onOpenWebSerialModal(cb: () => void): void {
        this.onOpenWebSerialModalCallback = cb;
    }

    public onOpenProperties(cb: () => void): void {
        this.onOpenPropertiesCallback = cb;
    }

    public initialize(): void {
        this.container.innerHTML = '';

        // Group 1: Connection & Brand
        const groupLeft = document.createElement('div');
        groupLeft.className = 'toolbar-group';

        const title = document.createElement('div');
        title.className = 'toolbar-title';
        title.innerHTML = `⚡ PixiTS Oscilloscope v4.1`;

        this.connectBtn = ToolbarComponents.createButton('🔌', 'primary', () => this.handleConnectClick(), 'Подключить Web Serial');
        this.baudSelect = ToolbarComponents.createBaudSelect(115200);
        this.baudSelect.title = 'Скорость передачи (Baud)';

        groupLeft.append(title, this.connectBtn, this.baudSelect);

        // Group 2: Controls & INI File Selection
        const groupCenter = document.createElement('div');
        groupCenter.className = 'toolbar-group';

        const timebaseLabel = document.createElement('span');
        timebaseLabel.style.fontSize = '12px';
        timebaseLabel.style.color = '#94a3b8';
        timebaseLabel.textContent = 'Timebase:';

        const timebaseOpts = [
            { label: '200 ms', val: 200 },
            { label: '500 ms', val: 500 },
            { label: '1.0 sec', val: 1000 },
            { label: '2.0 sec', val: 2000 },
            { label: '5.0 sec', val: 5000 },
            { label: '10 sec', val: 10000 }
        ];

        this.timebaseSelect = ToolbarComponents.createSelect(timebaseOpts, this.settings.timeWindowMs, (val) => {
            this.settings.timeWindowMs = val;
        });
        this.timebaseSelect.title = 'Временная шкала (Timebase)';

        this.autoscaleBtn = ToolbarComponents.createButton('📐', this.settings.autoScale ? 'active' : '', () => {
            this.settings.autoScale = !this.settings.autoScale;
            this.autoscaleBtn.classList.toggle('active', this.settings.autoScale);
        }, 'Автомасштабирование (Auto-Scale)');

        this.cursorBtn = ToolbarComponents.createButton('📏', this.settings.enableCursors ? 'active' : '', () => {
            this.settings.enableCursors = !this.settings.enableCursors;
            this.cursorBtn.classList.toggle('active', this.settings.enableCursors);
            const footer = document.getElementById('footer');
            if (footer) footer.style.display = this.settings.enableCursors ? 'flex' : 'none';
        }, 'Курсоры измерения (Cursors)');

        this.generatorBtn = ToolbarComponents.createButton('📁', 'primary', () => {
            if (this.onOpenGeneratorModalCallback) this.onOpenGeneratorModalCallback();
        }, 'Выбрать .ini файлы');

        groupCenter.append(timebaseLabel, this.timebaseSelect, this.autoscaleBtn, this.cursorBtn, this.generatorBtn);

        // Group 3: Recording & Export
        const groupRight = document.createElement('div');
        groupRight.className = 'toolbar-group';

        this.propertiesBtn = ToolbarComponents.createButton(
            `⚙️`,
            'icon-btn',
            () => {
                if (this.onOpenPropertiesCallback) this.onOpenPropertiesCallback();
            },
            'Свойства просмотра параметров'
        );

        this.recordBtn = ToolbarComponents.createButton('🔴', 'success', () => this.handleRecordClick(), 'Запись в CSV');
        this.exportBtn = ToolbarComponents.createButton('💾', '', () => {
            window.dispatchEvent(new CustomEvent('oscilloscope-export-csv'));
        }, 'Экспорт CSV');

        this.statusBadge = document.createElement('span');
        this.statusBadge.className = 'status-badge disconnected';
        this.statusBadge.textContent = 'DISCONNECTED';

        groupRight.append(this.propertiesBtn, this.recordBtn, this.exportBtn, this.statusBadge);

        this.container.append(groupLeft, groupCenter, groupRight);

        this.serial.onStateChange((state) => {
            if (state === 'connected') {
                this.statusBadge.className = 'status-badge connected';
                this.statusBadge.textContent = 'SERIAL CONNECTED';
                this.connectBtn.innerHTML = `🔌`;
                this.connectBtn.title = 'Отключить Web Serial';
            } else if (state === 'error') {
                this.statusBadge.className = 'status-badge disconnected';
                this.statusBadge.textContent = 'ERROR';
                this.connectBtn.innerHTML = `🔌`;
                this.connectBtn.title = 'Подключить Web Serial';
            } else {
                this.statusBadge.className = 'status-badge disconnected';
                this.statusBadge.textContent = 'DISCONNECTED';
                this.connectBtn.innerHTML = `🔌`;
                this.connectBtn.title = 'Подключить Web Serial';
            }
        });
    }

    private async handleConnectClick(): Promise<void> {
        if (this.serial.getState() === 'connected') {
            await this.serial.disconnect();
            return;
        }

        const isIframe = window.self !== window.top;
        if (isIframe && this.onOpenWebSerialModalCallback) {
            this.onOpenWebSerialModalCallback();
            return;
        }

        const baud = parseInt(this.baudSelect.value, 10);
        const success = await this.serial.connect(baud);
        if (!success && this.onOpenWebSerialModalCallback) {
            this.onOpenWebSerialModalCallback();
        }
    }

    private handleRecordClick(): void {
        const state = this.recorder.getState();
        if (state === 'idle') {
            this.recorder.start();
            this.recordBtn.innerHTML = `⏸️`;
            this.recordBtn.title = 'Остановить запись';
            this.recordBtn.classList.remove('success');
            this.recordBtn.classList.add('primary');
            this.statusBadge.className = 'status-badge recording';
            this.statusBadge.textContent = 'REC 0.0s';
        } else if (state === 'recording') {
            this.recorder.stop();
            this.recordBtn.innerHTML = `🔴`;
            this.recordBtn.title = 'Запись в CSV';
            this.recordBtn.classList.remove('primary');
            this.recordBtn.classList.add('success');
            this.statusBadge.className = this.serial.getState() === 'connected' ? 'status-badge connected' : 'status-badge disconnected';
            this.statusBadge.textContent = this.serial.getState() === 'connected' ? 'SERIAL CONNECTED' : 'DISCONNECTED';
        }
    }

    public updateRecordTimer(): void {
        if (this.recorder.getState() === 'recording') {
            const sec = (this.recorder.getElapsedMs() / 1000).toFixed(1);
            this.statusBadge.textContent = `REC ${sec}s`;
        }
    }
}
