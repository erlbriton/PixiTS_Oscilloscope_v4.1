// src/graphics/Renderer.ts

import { Color } from 'pixi.js';
import { Channel } from '../core/Channel';
import { Archive } from '../core/Archive';
import { Settings } from '../config/Settings';
import { PixiView } from './PixiView';
import { WaveformRenderer } from './WaveformRenderer';

export class Renderer {
    private settings: Settings;
    private archive: Archive;

    constructor(settings: Settings, archive: Archive) {
        this.settings = settings;
        this.archive = archive;
    }

    public renderChannelGraph(channel: Channel, view: PixiView): void {
        const { width, height } = view.bounds;
        if (width <= 0 || height <= 0) return;

        this.renderGrid(view, width, height);

        const now = Date.now();
        const duration = this.settings.timeWindowMs;
        const samples = this.archive.getRecentSamples(channel.id, duration, now);

        if (samples.length > 0) {
            if (channel.type === 'digital') {
                WaveformRenderer.renderDigitalWaveform(channel, samples, view, width, height, now, duration);
            } else {
                WaveformRenderer.renderAnalogWaveform(channel, samples, view, width, height, now, duration, this.settings, this.archive);
            }
        } else {
            view.waveGraphics.clear();
        }

        if (this.settings.enableCursors) {
            this.renderCursors(view, width, height);
        } else {
            view.cursorGraphics.clear();
        }

        view.present();
    }

    private renderGrid(view: PixiView, width: number, height: number): void {
        const g = view.gridGraphics;
        g.clear();

        if (!this.settings.showGrid) return;

        const gridColor = new Color(this.settings.gridColor).toNumber();
        const divX = this.settings.gridDivisionsX;
        const divY = this.settings.gridDivisionsY;

        const stepX = width / divX;
        for (let i = 1; i < divX; i++) {
            const x = Math.floor(i * stepX);
            g.moveTo(x, 0);
            g.lineTo(x, height);
            g.stroke({ width: 1, color: gridColor, alpha: 0.4 });
        }

        const stepY = height / divY;
        for (let j = 1; j < divY; j++) {
            const y = Math.floor(j * stepY);
            g.moveTo(0, y);
            g.lineTo(width, y);
            g.stroke({ width: 1, color: gridColor, alpha: 0.4 });
        }

        const centerY = Math.floor(height / 2);
        g.moveTo(0, centerY);
        g.lineTo(width, centerY);
        g.stroke({ width: 1, color: gridColor, alpha: 0.8 });
    }

    private renderCursors(view: PixiView, width: number, height: number): void {
        const g = view.cursorGraphics;
        g.clear();

        const x1 = (this.settings.cursorX1Percent / 100) * width;
        const x2 = (this.settings.cursorX2Percent / 100) * width;

        g.moveTo(x1, 0);
        g.lineTo(x1, height);
        g.stroke({ width: 1.5, color: 0x06b6d4, alpha: 0.9 });

        g.moveTo(x2, 0);
        g.lineTo(x2, height);
        g.stroke({ width: 1.5, color: 0xf59e0b, alpha: 0.9 });
    }
}
