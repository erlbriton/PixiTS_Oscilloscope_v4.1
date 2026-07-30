// src/ui/ChannelRow.ts

import { Channel } from '../core/Channel';

export class ChannelRow {
    private readonly element: HTMLDivElement;
    private readonly nameElement: HTMLDivElement;
    private readonly descriptionElement: HTMLDivElement;
    private readonly valueElement: HTMLDivElement;
    private readonly unitElement: HTMLDivElement;
    private readonly graphElement: HTMLDivElement;
    private readonly colorIndicator: HTMLSpanElement;

    constructor(public readonly channel: Channel) {
        this.element = document.createElement('div');
        this.element.className = 'channel-row';
        this.element.dataset.channelId = channel.id;

        // Name Column
        this.nameElement = document.createElement('div');
        this.nameElement.className = 'col-name';

        this.colorIndicator = document.createElement('span');
        this.colorIndicator.className = 'channel-color-indicator';
        this.colorIndicator.style.backgroundColor = channel.color;

        const titleSpan = document.createElement('span');
        titleSpan.className = 'channel-title';
        titleSpan.textContent = channel.name;

        this.nameElement.append(this.colorIndicator, titleSpan);

        // Description Column
        this.descriptionElement = document.createElement('div');
        this.descriptionElement.className = 'col-description';
        this.descriptionElement.textContent = channel.description;

        // Value Column
        this.valueElement = document.createElement('div');
        this.valueElement.className = 'col-value';
        this.valueElement.textContent = String(channel.value);

        // Unit Column
        this.unitElement = document.createElement('div');
        this.unitElement.className = 'col-unit';
        this.unitElement.textContent = channel.unit;

        // PixiJS Canvas Graph Column
        this.graphElement = document.createElement('div');
        this.graphElement.className = 'col-graph';

        this.element.append(
            this.nameElement,
            this.descriptionElement,
            this.valueElement,
            this.unitElement,
            this.graphElement
        );
    }

    public attach(parent: HTMLElement): void {
        parent.appendChild(this.element);
    }

    public remove(): void {
        if (this.element.parentElement) {
            this.element.parentElement.removeChild(this.element);
        }
    }

    public updateValue(): void {
        const val = this.channel.value;
        if (typeof val === 'number') {
            this.valueElement.textContent = val % 1 === 0 ? val.toString() : val.toFixed(2);
        } else {
            this.valueElement.textContent = String(val);
        }
    }

    public getGraphContainer(): HTMLElement {
        return this.graphElement;
    }

    public getElement(): HTMLElement {
        return this.element;
    }
}
