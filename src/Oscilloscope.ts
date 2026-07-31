// src/Oscilloscope.ts

import { Channel } from './core/Channel';
import { Archive } from './core/Archive';
import { Recorder } from './core/Recorder';
import { Settings } from './config/Settings';
import { Serial } from './comm/Serial';
import { Table } from './ui/Table';
import { Toolbar } from './ui/Toolbar';
import { Resizer } from './ui/Resizer';
import { Layout } from './ui/Layout';
import { WebSerialModal } from './ui/WebSerialModal';
import { IniPanel, IniFileItem } from './ui/IniPanel';
import { Renderer } from './graphics/Renderer';
import { PixiView } from './graphics/PixiView';
import { IniParser, ParsedRamParam } from './core/IniParser';

export class Oscilloscope {
    private settings: Settings;
    private archive: Archive;
    private recorder: Recorder;
    private serial: Serial;
    private table!: Table;
    private toolbar!: Toolbar;
    private resizer!: Resizer;
    private renderer!: Renderer;
    private iniPanel!: IniPanel;

    private channels: Channel[] = [];
    private pixiViews: Map<string, PixiView> = new Map();
    private isRunning: boolean = false;
    private lastFrameTime: number = 0;
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
        this.settings.applyCSSTemplateVariables();

        const layoutElements = Layout.createSkeleton(rootElement);

        this.table = new Table(layoutElements.rowsContainer);
        this.toolbar = new Toolbar(layoutElements.toolbarContainer, this.settings, this.recorder, this.serial);
        this.toolbar.initialize();

        this.resizer = new Resizer(this.settings, layoutElements.headerContainer);
        this.resizer.initialize();

        this.webSerialModal = new WebSerialModal(this.serial);
        this.iniPanel = new IniPanel(layoutElements.iniPanelContainer);
        
        this.bindEvents();

        this.isRunning = true;
        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    private bindEvents(): void {
        this.toolbar.onOpenGeneratorModal(() => this.iniPanel.openFilePicker());
        this.toolbar.onOpenWebSerialModal(() => this.webSerialModal.open());

        this.iniPanel.onFileSelect((fileItem: IniFileItem) => {
            this.loadIniContent(fileItem.content);
        });

        window.addEventListener('oscilloscope-export-csv', () => {
            this.recorder.downloadCSV(this.channels);
        });
    }

    public loadIniContent(iniContent: string): void {
        const parsed = IniParser.parse(iniContent);
        this.applyParsedRamParams(parsed.ramParams);
    }

    public applyParsedRamParams(ramParams: ParsedRamParam[]): void {
        const newChannels = ramParams.map(param => new Channel({
            id: param.id,
            name: param.name,
            description: param.description,
            dataType: param.type,
            unit: param.unit,
            scale: param.scale,
            rawDecValue: param.rawDec,
            hexValue: param.rawHex,
            isBit: param.isBit,
            modbusReg: param.modbusReg,
            min: param.isBit ? 0 : -50,
            max: param.isBit ? 1 : 500
        }));

        this.setChannels(newChannels);
    }

    public setChannels(newChannels: Channel[]): void {
        this.pixiViews.forEach(view => view.destroy());
        this.pixiViews.clear();
        this.table.clear();
        this.archive.clear();

        this.channels = newChannels;
        this.serial.setChannels(this.channels);

        this.channels.forEach(async (channel) => {
            const row = this.table.addChannel(channel);
            const pixiView = new PixiView(row.getGraphContainer());
            await pixiView.init();
            this.pixiViews.set(channel.id, pixiView);
        });
    }

    private loop(now: number): void {
        if (!this.isRunning) return;

        this.lastFrameTime = now;

        this.table.updateValues();
        this.toolbar.updateRecordTimer();

        this.channels.forEach(channel => {
            const row = this.table.getRow(channel.id);
            if (row && !row.getIsVisible()) return;

            const view = this.pixiViews.get(channel.id);
            if (view) this.renderer.renderChannelGraph(channel, view);
        });

        if (this.settings.enableCursors) this.updateCursorsFooter();

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
