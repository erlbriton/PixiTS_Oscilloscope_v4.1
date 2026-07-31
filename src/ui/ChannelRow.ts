// src/ui/ChannelRow.ts

import { Channel } from '../core/Channel';

export class ChannelRow {
    private readonly element: HTMLDivElement;
    private readonly nameElement: HTMLDivElement;
    private readonly hexElement: HTMLDivElement;
    private readonly valueElement: HTMLDivElement;
    private readonly unitElement: HTMLDivElement;
    private readonly graphElement: HTMLDivElement;
    private readonly colorIndicator: HTMLSpanElement;

    constructor(public readonly channel: Channel) {
        this.element = document.createElement('div');
        this.element.className = 'channel-row';
        this.element.dataset.channelId = channel.id;

        // 1. Колонка Имя (Name)
        this.nameElement = document.createElement('div');
        this.nameElement.className = 'col-name';

        this.colorIndicator = document.createElement('span');
        this.colorIndicator.className = 'channel-color-indicator';
        this.colorIndicator.style.backgroundColor = channel.color;

        const titleSpan = document.createElement('span');
        titleSpan.className = 'channel-title';
        titleSpan.textContent = channel.name;
        titleSpan.title = `${channel.name} (${channel.description})`;

        this.nameElement.append(this.colorIndicator, titleSpan);

        // 2. Колонка HEX значение (hex)
        this.hexElement = document.createElement('div');
        this.hexElement.className = 'col-description'; // Используем существующий CSS класс разметки
        this.hexElement.textContent = channel.hexValue;
        this.hexElement.style.fontFamily = 'monospace';
        this.hexElement.style.color = '#38bdf8';

        // 3. Колонка Десятичное значение * Шкала (Value)
        this.valueElement = document.createElement('div');
        this.valueElement.className = 'col-value';
        this.valueElement.textContent = String(channel.scaledValue);

        // 4. Колонка Единица измерения (Unit)
        this.unitElement = document.createElement('div');
        this.unitElement.className = 'col-unit';
        this.unitElement.textContent = channel.unit;

        // 5. Колонка Графика PixiJS (Graph)
        this.graphElement = document.createElement('div');
        this.graphElement.className = 'col-graph';

        this.element.append(
            this.nameElement,
            this.hexElement,
            this.valueElement,
            this.unitElement,
            this.graphElement
        );

        this.element.addEventListener('click', () => {
            const container = this.element.parentElement;
            if (container) {
                container.querySelectorAll('.channel-row.selected').forEach(el => {
                    if (el !== this.element) el.classList.remove('selected');
                });
            }
            this.element.classList.add('selected');
        });
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
        // Обновляем HEX значение во 2-й колонке
        this.hexElement.textContent = this.channel.hexValue;

        // Обновляем Десятичное значение * Шкала в 3-й колонке
        const val = this.channel.scaledValue;
        if (typeof val === 'number') {
            this.valueElement.textContent = Number.isInteger(val) ? val.toString() : val.toFixed(3);
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
