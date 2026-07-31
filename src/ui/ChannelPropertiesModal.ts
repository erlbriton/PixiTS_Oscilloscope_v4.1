// src/ui/ChannelPropertiesModal.ts

import { Channel } from '../core/Channel';

export class ChannelPropertiesModal {
    private overlay: HTMLDivElement | null = null;

    constructor(
        private channel: Channel,
        private onSave: (updatedChannel: Channel, visible: boolean) => void
    ) {}

    public open(currentlyVisible: boolean = true): void {
        this.close();

        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.style.zIndex = '20000';

        const content = document.createElement('div');
        content.className = 'modal-content';
        content.style.maxWidth = '480px';
        content.style.width = '100%';

        content.innerHTML = `
            <div class="modal-header">
                <div class="modal-title" style="display:flex; align-items:center; gap:8px;">
                    <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background-color:${this.channel.color};"></span>
                    Свойства параметра: ${this.escapeHtml(this.channel.name)}
                </div>
                <button class="modal-close" id="prop-modal-close">&times;</button>
            </div>
            <div class="modal-body" style="display:flex; flex-direction:column; gap:14px;">
                <div class="form-group" style="margin-bottom:0;">
                    <label>Идентификатор (ID / Tag)</label>
                    <input type="text" class="form-input" value="${this.escapeHtml(this.channel.id)}" disabled style="opacity:0.7; cursor:not-allowed;" />
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label>Наименование (Имя)</label>
                    <input type="text" id="prop-name" class="form-input" value="${this.escapeHtml(this.channel.name)}" />
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label>Описание</label>
                    <input type="text" id="prop-desc" class="form-input" value="${this.escapeHtml(this.channel.description)}" />
                </div>
                <div style="display:flex; gap:12px;">
                    <div class="form-group" style="flex:1; margin-bottom:0;">
                        <label>Единица измерения</label>
                        <input type="text" id="prop-unit" class="form-input" value="${this.escapeHtml(this.channel.unit)}" />
                    </div>
                    <div class="form-group" style="flex:1; margin-bottom:0;">
                        <label>Множитель (Scale)</label>
                        <input type="number" step="any" id="prop-scale" class="form-input" value="${this.channel.scale}" />
                    </div>
                </div>
                <div style="display:flex; gap:12px;">
                    <div class="form-group" style="flex:1; margin-bottom:0;">
                        <label>Цвет графика</label>
                        <input type="color" id="prop-color" class="form-input" value="${this.channel.color}" style="height:38px; padding:2px; cursor:pointer;" />
                    </div>
                    <div class="form-group" style="flex:1; margin-bottom:0;">
                        <label>Тип данных</label>
                        <input type="text" class="form-input" value="${this.escapeHtml(this.channel.dataType)}" disabled style="opacity:0.7; cursor:not-allowed;" />
                    </div>
                </div>
                <div style="display:flex; gap:12px;">
                    <div class="form-group" style="flex:1; margin-bottom:0;">
                        <label>Modbus Регистр</label>
                        <input type="text" class="form-input" value="${this.escapeHtml(this.channel.modbusReg || '—')}" disabled style="opacity:0.7; cursor:not-allowed;" />
                    </div>
                    <div class="form-group" style="flex:1; margin-bottom:0; display:flex; flex-direction:column; justify-content:flex-end;">
                        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; color:#e0e0e0; margin-bottom:8px;">
                            <input type="checkbox" id="prop-visible" ${currentlyVisible ? 'checked' : ''} style="width:16px; height:16px; accent-color:#00d2ff; cursor:pointer;" />
                            Отображать в графиках
                        </label>
                    </div>
                </div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px; padding-top:14px; border-top:1px solid #2a2a2c;">
                <button class="toolbar-btn" id="prop-btn-cancel">Отмена</button>
                <button class="toolbar-btn primary" id="prop-btn-save">Сохранить</button>
            </div>
        `;

        this.overlay.appendChild(content);
        document.body.appendChild(this.overlay);

        const closeBtn = content.querySelector('#prop-modal-close') as HTMLButtonElement;
        const cancelBtn = content.querySelector('#prop-btn-cancel') as HTMLButtonElement;
        const saveBtn = content.querySelector('#prop-btn-save') as HTMLButtonElement;

        closeBtn?.addEventListener('click', () => this.close());
        cancelBtn?.addEventListener('click', () => this.close());

        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        saveBtn?.addEventListener('click', () => {
            const nameInput = content.querySelector('#prop-name') as HTMLInputElement;
            const descInput = content.querySelector('#prop-desc') as HTMLInputElement;
            const unitInput = content.querySelector('#prop-unit') as HTMLInputElement;
            const scaleInput = content.querySelector('#prop-scale') as HTMLInputElement;
            const colorInput = content.querySelector('#prop-color') as HTMLInputElement;
            const visibleInput = content.querySelector('#prop-visible') as HTMLInputElement;

            if (nameInput) this.channel.name = nameInput.value.trim() || this.channel.name;
            if (descInput) this.channel.description = descInput.value.trim();
            if (unitInput) this.channel.unit = unitInput.value.trim();
            if (scaleInput && !isNaN(parseFloat(scaleInput.value))) {
                this.channel.scale = parseFloat(scaleInput.value);
            }
            if (colorInput) this.channel.color = colorInput.value;

            const isVisible = visibleInput ? visibleInput.checked : true;

            this.onSave(this.channel, isVisible);
            this.close();
        });
    }

    public close(): void {
        if (this.overlay && this.overlay.parentElement) {
            this.overlay.parentElement.removeChild(this.overlay);
            this.overlay = null;
        }
    }

    private escapeHtml(str: string): string {
        return (str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}
