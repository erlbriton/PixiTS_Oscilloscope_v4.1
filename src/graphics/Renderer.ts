// src/graphics/Renderer.ts

import { Color } from 'pixi.js';
import { Channel } from '../core/Channel';
import { Archive, Sample } from '../core/Archive';
import { Settings } from '../config/Settings';
import { PixiView } from './PixiView';

export class Renderer {
    private settings: Settings;
    private archive: Archive;

    constructor(settings: Settings, archive: Archive) {
        this.settings = settings;
        this.archive = archive;
    }

    /**
     * Renders background grid, signal waveform, and cursors for a given channel row
     */
    public renderChannelGraph(channel: Channel, view: PixiView): void {
        const { width, height } = view.bounds;
        if (width <= 0 || height <= 0) return;

        // 1. Render Grid
        this.renderGrid(view, width, height);

        // 2. Fetch recent signal samples from Archive
        const now = Date.now();
        const duration = this.settings.timeWindowMs;
        const samples = this.archive.getRecentSamples(channel.id, duration, now);

        // 3. Render Waveform
        if (samples.length > 0) {
            if (channel.type === 'digital') {
                this.renderDigitalWaveform(channel, samples, view, width, height, now, duration);
            } else {
                this.renderAnalogWaveform(channel, samples, view, width, height, now, duration);
            }
        } else {
            view.waveGraphics.clear();
        }

        // 4. Render Cursors if enabled
        if (this.settings.enableCursors) {
            this.renderCursors(view, width, height);
        } else {
            view.cursorGraphics.clear();
        }
    }

    private renderGrid(view: PixiView, width: number, height: number): void {
        const g = view.gridGraphics;
        g.clear();

        if (!this.settings.showGrid) return;

        const gridColor = new Color(this.settings.gridColor).toNumber();
        const divX = this.settings.gridDivisionsX;
        const divY = this.settings.gridDivisionsY;

        // Vertical division lines (Time axis)
        const stepX = width / divX;
        for (let i = 1; i < divX; i++) {
            const x = Math.floor(i * stepX);
            g.moveTo(x, 0);
            g.lineTo(x, height);
            g.stroke({ width: 1, color: gridColor, alpha: 0.4 });
        }

        // Horizontal division lines (Amplitude axis)
        const stepY = height / divY;
        for (let j = 1; j < divY; j++) {
            const y = Math.floor(j * stepY);
            g.moveTo(0, y);
            g.lineTo(width, y);
            g.stroke({ width: 1, color: gridColor, alpha: 0.4 });
        }

        // Center zero axis dashed line
        const centerY = Math.floor(height / 2);
        g.moveTo(0, centerY);
        g.lineTo(width, centerY);
        g.stroke({ width: 1, color: gridColor, alpha: 0.8 });
    }

    private renderAnalogWaveform(
        channel: Channel,
        samples: Sample[],
        view: PixiView,
        width: number,
        height: number,
        currentTime: number,
        duration: number
    ): void {
        const g = view.waveGraphics;
        g.clear();

        if (samples.length < 2) return;

        // Determine Vertical Range (min / max)
        let min = channel.min;
        let max = channel.max;

        if (this.settings.autoScale) {
            const range = this.archive.getMinMax(channel.id, duration, currentTime);
            if (range.min !== range.max) {
                // Add 10% margin top and bottom
                const margin = (range.max - range.min) * 0.1 || 1;
                min = range.min - margin;
                max = range.max + margin;
            }
        }

        const vRange = max - min || 1;
        const startTime = currentTime - duration;
        const colorNum = new Color(channel.color).toNumber();

        // Map time to X pixel, value to Y pixel
        const getX = (t: number) => ((t - startTime) / duration) * width;
        const getY = (val: number) => height - ((val - min) / vRange) * height;

        g.moveTo(getX(samples[0].time), getY(samples[0].value));

        for (let i = 1; i < samples.length; i++) {
            const x = getX(samples[i].time);
            const y = getY(samples[i].value);
            g.lineTo(x, y);
        }

        // Glow stroke + sharp line
        g.stroke({ width: 2, color: colorNum, alpha: 0.95 });
    }

    private renderDigitalWaveform(
        channel: Channel,
        samples: Sample[],
        view: PixiView,
        width: number,
        height: number,
        currentTime: number,
        duration: number
    ): void {
        const g = view.waveGraphics;
        g.clear();

        if (samples.length < 2) return;

        const startTime = currentTime - duration;
        const colorNum = new Color(channel.color).toNumber();

        const getX = (t: number) => ((t - startTime) / duration) * width;
        const highY = height * 0.2; // High state line
        const lowY = height * 0.8;  // Low state line

        const getY = (v: number) => (v >= 0.5 ? highY : lowY);

        let prevX = getX(samples[0].time);
        let prevY = getY(samples[0].value);

        g.moveTo(prevX, prevY);

        for (let i = 1; i < samples.length; i++) {
            const currentX = getX(samples[i].time);
            const currentY = getY(samples[i].value);

            // Step transition: Horizontal then Vertical
            g.lineTo(currentX, prevY);
            g.lineTo(currentX, currentY);

            prevX = currentX;
            prevY = currentY;
        }

        g.stroke({ width: 2, color: colorNum, alpha: 1.0 });
    }

    private renderCursors(view: PixiView, width: number, height: number): void {
        const g = view.cursorGraphics;
        g.clear();

        const x1 = (this.settings.cursorX1Percent / 100) * width;
        const x2 = (this.settings.cursorX2Percent / 100) * width;

        // Cursor 1 (Cyan line)
        g.moveTo(x1, 0);
        g.lineTo(x1, height);
        g.stroke({ width: 1.5, color: 0x06b6d4, alpha: 0.9 });

        // Cursor 2 (Amber line)
        g.moveTo(x2, 0);
        g.lineTo(x2, height);
        g.stroke({ width: 1.5, color: 0xf59e0b, alpha: 0.9 });
    }
}
