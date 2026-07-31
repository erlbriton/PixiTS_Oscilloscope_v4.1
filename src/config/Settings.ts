// src/config/Settings.ts

export interface ColumnWidths {
    name: number;
    description: number;
    value: number;
    unit: number;
}

export class Settings {
    public columnWidths: ColumnWidths = {
        name: 90,
        description: 220,
        value: 90,
        unit: 60,
    };

    public rowHeight: number = 20; // height in px of each channel row (по умолчанию 20px)
    public timeWindowMs: number = 2000; // total duration visible on screen (ms) (2s default)
    public showGrid: boolean = true;
    public gridDivisionsX: number = 10;
    public gridDivisionsY: number = 4;
    public autoScale: boolean = true;
    
    // Cursors
    public enableCursors: boolean = false;
    public cursorX1Percent: number = 25; // % of graph width
    public cursorX2Percent: number = 75; // % of graph width

    // Color theme
    public backgroundColor: string = '#050505';
    public gridColor: string = '#1f293d';
    public textColor: string = '#94a3b8';

    // Timebase options in ms (100ms, 200ms, 500ms, 1s, 2s, 5s, 10s, 20s)
    public availableTimeWindows: number[] = [200, 500, 1000, 2000, 5000, 10000, 20000];

    public updateColumnWidth(column: keyof ColumnWidths, width: number): void {
        this.columnWidths[column] = Math.max(30, width);
        this.applyCSSTemplateVariables();
    }

    public setRowHeight(height: number): void {
        this.rowHeight = Math.max(15, height);
        document.documentElement.style.setProperty('--row-height', `${this.rowHeight}px`);
    }

    public applyCSSTemplateVariables(): void {
        document.documentElement.style.setProperty('--col-name', `${this.columnWidths.name}px`);
        document.documentElement.style.setProperty('--col-description', `${this.columnWidths.description}px`);
        document.documentElement.style.setProperty('--col-value', `${this.columnWidths.value}px`);
        document.documentElement.style.setProperty('--col-unit', `${this.columnWidths.unit}px`);
        document.documentElement.style.setProperty('--row-height', `${this.rowHeight}px`);
    }
}
