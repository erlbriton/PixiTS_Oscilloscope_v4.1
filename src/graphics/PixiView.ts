// src/graphics/PixiView.ts

import { Application, Container, Graphics } from 'pixi.js';

export interface ViewportBounds {
    width: number;
    height: number;
}

export class PixiView {
    public app: Application;
    public stage: Container;
    public gridGraphics: Graphics;
    public waveGraphics: Graphics;
    public cursorGraphics: Graphics;
    public containerElement: HTMLElement;
    private initialized: boolean = false;
    private resizeObserver: ResizeObserver | null = null;
    public bounds: ViewportBounds = { width: 300, height: 120 };

    constructor(containerElement: HTMLElement) {
        this.containerElement = containerElement;
        this.app = new Application();
        this.stage = new Container();
        this.gridGraphics = new Graphics();
        this.waveGraphics = new Graphics();
        this.cursorGraphics = new Graphics();

        this.stage.addChild(this.gridGraphics);
        this.stage.addChild(this.waveGraphics);
        this.stage.addChild(this.cursorGraphics);
    }

    public async init(): Promise<void> {
        if (this.initialized) return;

        const rect = this.containerElement.getBoundingClientRect();
        const width = Math.max(50, Math.floor(rect.width || 400));
        const height = Math.max(10, Math.floor(rect.height || 20));
        this.bounds = { width, height };

        await this.app.init({
            width,
            height,
            backgroundColor: 0x050505,
            antialias: true,
            autoDensity: true,
            resolution: window.devicePixelRatio || 1,
        });

        // Attach Pixi canvas to HTML graph container
        const canvas = this.app.canvas as HTMLCanvasElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';

        // Clear existing children in container and append canvas
        this.containerElement.innerHTML = '';
        this.containerElement.appendChild(canvas);

        this.app.stage.addChild(this.stage);

        // Setup resize observer
        this.resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const w = Math.max(50, Math.floor(entry.contentRect.width));
                const h = Math.max(10, Math.floor(entry.contentRect.height));
                if (w !== this.bounds.width || h !== this.bounds.height) {
                    this.resize(w, h);
                }
            }
        });
        this.resizeObserver.observe(this.containerElement);

        this.initialized = true;
    }

    public resize(width: number, height: number): void {
        this.bounds = { width, height };
        if (this.app && this.app.renderer) {
            this.app.renderer.resize(width, height);
        }
    }

    public destroy(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.app) {
            this.app.destroy(true, { children: true, texture: true });
        }
    }
}
