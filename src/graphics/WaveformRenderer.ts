// src/graphics/WaveformRenderer.ts

import { Color } from 'pixi.js';
import { Channel } from '../core/Channel';
import { Archive, Sample } from '../core/Archive';
import { Settings } from '../config/Settings';
import { PixiView } from './PixiView';

export class WaveformRenderer {
    public static renderAnalogWaveform(
        channel: Channel,
        samples: Sample[],
        view: PixiView,
        width: number,
        height: number,
        currentTime: number,
        duration: number,
        settings: Settings,
        archive: Archive
    ): void {
        const g = view.waveGraphics;
        g.clear();

        if (samples.length < 1) return;

        let min = channel.min;
        let max = channel.max;

        if (settings.autoScale) {
            const range = archive.getMinMax(channel.id, duration, currentTime);
            if (range.min !== range.max) {
                const margin = (range.max - range.min) * 0.1 || 1;
                const targetMin = range.min - margin;
                const targetMax = range.max + margin;

                if (channel.currentDisplayMin === undefined || isNaN(channel.currentDisplayMin)) {
                    channel.currentDisplayMin = targetMin;
                    channel.currentDisplayMax = targetMax;
                } else {
                    channel.currentDisplayMin += (targetMin - channel.currentDisplayMin) * 0.1;
                    channel.currentDisplayMax += (targetMax - channel.currentDisplayMax) * 0.1;
                }
                min = channel.currentDisplayMin;
                max = channel.currentDisplayMax;
            }
        } else {
            channel.currentDisplayMin = undefined;
            channel.currentDisplayMax = undefined;
        }

        const vRange = max - min || 1;
        const startTime = currentTime - duration;
        const colorNum = new Color(channel.color).toNumber();

        const getX = (t: number) => ((t - startTime) / duration) * width;
        const getY = (val: number) => Math.max(-10, Math.min(height + 10, height - ((val - min) / vRange) * height));

        const startX = getX(samples[0].time);
        const startY = getY(samples[0].value);

        g.moveTo(startX, startY);

        for (let i = 1; i < samples.length; i++) {
            const x = getX(samples[i].time);
            const y = getY(samples[i].value);
            g.lineTo(x, y);
        }

        const lastSample = samples[samples.length - 1];
        const lastX = getX(lastSample.time);
        if (lastX < width) {
            const lastY = getY(lastSample.value);
            g.lineTo(width, lastY);
        }

        g.stroke({ width: 2, color: colorNum, alpha: 0.95 });
    }

    public static renderDigitalWaveform(
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

        if (samples.length < 1) return;

        const startTime = currentTime - duration;
        const colorNum = new Color(channel.color).toNumber();

        const getX = (t: number) => ((t - startTime) / duration) * width;
        const highY = height * 0.2;
        const lowY = height * 0.8;
        const getY = (v: number) => (v >= 0.5 ? highY : lowY);

        let prevX = getX(samples[0].time);
        let prevY = getY(samples[0].value);

        g.moveTo(prevX, prevY);

        for (let i = 1; i < samples.length; i++) {
            const currentX = getX(samples[i].time);
            const currentY = getY(samples[i].value);

            g.lineTo(currentX, prevY);
            g.lineTo(currentX, currentY);

            prevX = currentX;
            prevY = currentY;
        }

        if (prevX < width) {
            g.lineTo(width, prevY);
        }

        g.stroke({ width: 2, color: colorNum, alpha: 1.0 });
    }
}
