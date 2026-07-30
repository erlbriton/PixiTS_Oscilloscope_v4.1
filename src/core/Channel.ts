// src/core/Channel.ts

export interface ChannelConfig {
    id: string;
    name: string;
    description: string;
    value: number | string;
    unit: string;
    color?: string;
    min?: number;
    max?: number;
    type?: 'analog' | 'digital';
    scale?: number;
    offset?: number;
    visible?: boolean;
}

export class Channel {
    public readonly id: string;
    public name: string;
    public description: string;
    public value: number | string;
    public unit: string;
    public color: string;
    public min: number;
    public max: number;
    public type: 'analog' | 'digital';
    public scale: number;
    public offset: number;
    public visible: boolean;

    constructor(config: ChannelConfig) {
        this.id = config.id;
        this.name = config.name;
        this.description = config.description;
        this.value = config.value;
        this.unit = config.unit;
        this.color = config.color || '#00ff66';
        this.min = config.min !== undefined ? config.min : -100;
        this.max = config.max !== undefined ? config.max : 100;
        this.type = config.type || 'analog';
        this.scale = config.scale !== undefined ? config.scale : 1.0;
        this.offset = config.offset !== undefined ? config.offset : 0.0;
        this.visible = config.visible !== undefined ? config.visible : true;
    }

    public setValue(value: number | string): void {
        this.value = value;
    }

    public getNumericValue(): number {
        if (typeof this.value === 'number') {
            return this.value;
        }
        const parsed = parseFloat(this.value);
        return isNaN(parsed) ? 0 : parsed;
    }
}
