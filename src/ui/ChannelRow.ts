// src/ui/ChannelRow.ts

import { Channel } from '../core/Channel';
import { ContextMenu } from './ContextMenu';
import { ChannelPropertiesModal } from './ChannelPropertiesModal';

export class ChannelRow {
    private readonly element: HTMLDivElement;
    private readonly nameElement: HTMLDivElement;
    private readonly hexElement: HTMLDivElement;
    private readonly unitElement: HTMLDivElement;
    private readonly valueElement: HTMLDivElement;
    private readonly graphElement: HTMLDivElement;
    private readonly colorIndicator: HTMLSpanElement;
    private isVisible: boolean = true;

    public onChannelUpdated?: (channel: Channel) => void;

    constructor(public readonly channel: Channel) {
        this.element = document.createElement('div');
        this.element.className = 'channel-row';
        this.element.style.height = `${this.channel.rowHeight}px`;
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
        this.hexElement.className = 'col-description'; 
        this.hexElement.textContent = channel.hexValue;
        this.hexElement.style.fontFamily = 'monospace';
        this.hexElement.style.color = '#38bdf8';

        // 3. Колонка Unit
        this.unitElement = document.createElement('div');
        this.unitElement.className = 'col-unit';
        this.unitElement.textContent = channel.unit;

        // 4. Колонка Physical (Value)
        this.valueElement = document.createElement('div');
        this.valueElement.className = 'col-value';
        this.valueElement.textContent = String(channel.scaledValue);

        // 5. Колонка Graph
        this.graphElement = document.createElement('div');
        this.graphElement.className = 'col-graph';

        this.element.append(
            this.nameElement,
            this.hexElement,
            this.unitElement,
            this.valueElement,
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

        // Обработка ПКМ (Контекстное меню)
        this.element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const container = this.element.parentElement;
            if (container) {
                container.querySelectorAll('.channel-row.selected').forEach(el => {
                    if (el !== this.element) el.classList.remove('selected');
                });
            }
            this.element.classList.add('selected');

            ContextMenu.getInstance().show(e.clientX, e.clientY, [
                {
                    label: 'Удалить',
                    danger: true,
                    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
                    onClick: () => {
                        this.setVisible(false);
                    }
                },
                {
                    label: 'Свойства',
                    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
                    onClick: () => {
                        this.openProperties();
                    }
                }
            ]);
        });
    }

    public openProperties(): void {
        const modal = new ChannelPropertiesModal(this.channel, (updatedChannel, visible) => {
            this.updateHeaderUI();
            this.setVisible(visible);
            if (this.onChannelUpdated) {
                this.onChannelUpdated(updatedChannel);
            }
        });
        modal.open(this.isVisible);
    }

    public updateHeaderUI(): void {
        this.colorIndicator.style.backgroundColor = this.channel.color;
        const titleSpan = this.nameElement.querySelector('.channel-title');
        if (titleSpan) {
            titleSpan.textContent = this.channel.name;
            titleSpan.setAttribute('title', `${this.channel.name} (${this.channel.description})`);
        }
        this.unitElement.textContent = this.channel.unit;
        
        // Применяем высоту
        this.element.style.height = `${this.channel.rowHeight}px`;
    }

    public setVisible(visible: boolean): void {
        this.isVisible = visible;
        this.element.style.display = visible ? '' : 'none';
    }

    public getIsVisible(): boolean {
        return this.isVisible;
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
        if (!this.isVisible) return;

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

