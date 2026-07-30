// src/Oscilloscope.ts

import { Channel } from './core/Channel';
import { Archive } from './core/Archive';
import { Recorder } from './core/Recorder';
import { Settings } from './config/Settings';
import { DEVICE_PRESETS } from './config/DeviceModels';
import { Serial } from './comm/Serial';
import { Table } from './ui/Table';
import { Toolbar } from './ui/Toolbar';
import { Resizer } from './ui/Resizer';
import { Layout } from './ui/Layout';
import { SignalGenModal } from './ui/SignalGenModal';
import { WebSerialModal } from './ui/WebSerialModal';
import { Renderer } from './graphics/Renderer';
import { PixiView } from './graphics/PixiView';

export class Oscilloscope {
    private settings: Settings;
    private archive: Archive;
    private recorder: Recorder;
    private serial: Serial;
    private table!: Table;
    private toolbar!: Toolbar;
    private resizer!: Resizer;
    private renderer!: Renderer;

    private channels: Channel[] = [];
    private pixiViews: Map<string, PixiView> = new Map();
    private isRunning: boolean = false;
    private lastFrameTime: number = 0;
    private signalGenModal!: SignalGenModal;
    private webSerialModal!: WebSerialModal;

    constructor() {
        this.settings = new Settings();
        this.archive = new Archive(50000);
        this.recorder = new Recorder(this.archive);
        this.serial = new Serial(this.archive);
        this.renderer = new Renderer(this.settings, this.archive);
    }

    public async initialize(): Promise<void> {
        const rootElement = document.getElementById('root') || document.body;

        // Apply initial CSS variables for column widths & row heights
        this.settings.applyCSSTemplateVariables();

        // Build HTML Layout
        const layoutElements = Layout.createSkeleton(rootElement);

        // Initialize UI components
        this.table = new Table(layoutElements.rowsContainer);
        this.toolbar = new Toolbar(
            layoutElements.toolbarContainer,
            this.settings,
            this.recorder,
            this.serial
        );
        this.toolbar.initialize();

        this.resizer = new Resizer(this.settings, layoutElements.headerContainer);
        this.resizer.initialize();

        this.signalGenModal = new SignalGenModal(this.serial);
        this.signalGenModal.onChannelsLoaded((newChannels) => {
            this.setChannels(newChannels);
        });

        this.webSerialModal = new WebSerialModal(this.serial);

        this.toolbar.onOpenGeneratorModal(() => {
            this.signalGenModal.open();
        });

        this.toolbar.onOpenWebSerialModal(() => {
            this.webSerialModal.open();
        });

        this.toolbar.onPresetChange((presetId) => {
            this.loadPreset(presetId);
        });

        // Listen for export CSV event
        window.addEventListener('oscilloscope-export-csv', () => {
            this.recorder.downloadCSV(this.channels);
        });

        // Load Default Preset (3-Phase Power System)
        this.loadPreset('3phase_power');

        // Start animation frame update loop
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    public setChannels(newChannels: Channel[]): void {
        // Destroy existing Pixi views
        this.pixiViews.forEach(view => view.destroy());
        this.pixiViews.clear();
        this.table.clear();
        this.archive.clear();

        this.channels = newChannels;
        this.serial.setChannels(this.channels);

        // Create Channel Rows and initialize PixiView for each graph container
        this.channels.forEach(async (channel) => {
            const row = this.table.addChannel(channel);
            const graphContainer = row.getGraphContainer();

            const pixiView = new PixiView(graphContainer);
            await pixiView.init();

            this.pixiViews.set(channel.id, pixiView);
        });
    }

    public loadPreset(presetId: string): void {
        const preset = DEVICE_PRESETS.find(p => p.id === presetId) || DEVICE_PRESETS[0];
        const newChannels = preset.channels.map(cfg => new Channel(cfg));
        this.setChannels(newChannels);
    }

    private loop(now: number): void {
        if (!this.isRunning) return;

        const dtMs = Math.min(100, now - this.lastFrameTime);
        this.lastFrameTime = now;

        // 1. Tick simulation generator if Web Serial is inactive
        this.serial.tickSimulation(dtMs);

        // 2. Update Table row numeric value labels
        this.table.updateValues();

        // 3. Update Record timer badge in toolbar
        this.toolbar.updateRecordTimer();

        // 4. Render PixiJS signal waveforms
        this.channels.forEach(channel => {
            const view = this.pixiViews.get(channel.id);
            if (view) {
                this.renderer.renderChannelGraph(channel, view);
            }
        });

        // 5. Update Cursors measurements footer if enabled
        if (this.settings.enableCursors) {
            this.updateCursorsFooter();
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    private updateCursorsFooter(): void {
        const curX1 = document.getElementById('cur-x1');
        const curX2 = document.getElementById('cur-x2');
        const curDt = document.getElementById('cur-dt');
        const curFreq = document.getElementById('cur-freq');

        if (curX1 && curX2 && curDt && curFreq) {
            const x1Pct = this.settings.cursorX1Percent;
            const x2Pct = this.settings.cursorX2Percent;
            const dtMs = (Math.abs(x2Pct - x1Pct) / 100) * this.settings.timeWindowMs;
            const freqHz = dtMs > 0 ? (1000 / dtMs).toFixed(2) : '0';

            curX1.textContent = `${x1Pct.toFixed(1)}%`;
            curX2.textContent = `${x2Pct.toFixed(1)}%`;
            curDt.textContent = `${dtMs.toFixed(1)} ms`;
            curFreq.textContent = `${freqHz} Hz`;
        }
    }
}
