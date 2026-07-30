// src/config/IniParser.ts

import { ChannelConfig } from '../core/Channel';

export interface ParsedIni {
    device?: {
        name?: string;
        baudRate?: number;
        protocol?: string;
    };
    channels: ChannelConfig[];
}

export class IniParser {
    public static parse(content: string): ParsedIni {
        const lines = content.split(/\r?\n/);
        const result: ParsedIni = {
            device: {},
            channels: []
        };

        let currentSection = '';
        let currentChannel: Partial<ChannelConfig> | null = null;

        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith(';') || line.startsWith('#')) {
                continue; // Skip comments and empty lines
            }

            // Section header
            if (line.startsWith('[') && line.endsWith(']')) {
                if (currentChannel && currentChannel.id && currentChannel.name) {
                    result.channels.push(this.completeChannel(currentChannel));
                    currentChannel = null;
                }

                currentSection = line.substring(1, line.length - 1).trim();

                if (currentSection.startsWith('CHANNEL_') || currentSection.startsWith('CH_')) {
                    currentChannel = { id: currentSection.toLowerCase() };
                }
                continue;
            }

            const eqIdx = line.indexOf('=');
            if (eqIdx === -1) continue;

            const key = line.substring(0, eqIdx).trim().toLowerCase();
            const val = line.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');

            if (currentSection.toLowerCase() === 'device') {
                if (key === 'name') result.device!.name = val;
                if (key === 'baudrate') result.device!.baudRate = parseInt(val, 10);
                if (key === 'protocol') result.device!.protocol = val;
            } else if (currentChannel) {
                if (key === 'id') currentChannel.id = val;
                if (key === 'name') currentChannel.name = val;
                if (key === 'description' || key === 'desc') currentChannel.description = val;
                if (key === 'unit') currentChannel.unit = val;
                if (key === 'value') currentChannel.value = isNaN(Number(val)) ? val : Number(val);
                if (key === 'color') currentChannel.color = val;
                if (key === 'min') currentChannel.min = parseFloat(val);
                if (key === 'max') currentChannel.max = parseFloat(val);
                if (key === 'type') currentChannel.type = val === 'digital' ? 'digital' : 'analog';
            }
        }

        if (currentChannel && currentChannel.id && currentChannel.name) {
            result.channels.push(this.completeChannel(currentChannel));
        }

        return result;
    }

    private static completeChannel(ch: Partial<ChannelConfig>): ChannelConfig {
        return {
            id: ch.id || `ch_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: ch.name || 'Channel',
            description: ch.description || '',
            value: ch.value !== undefined ? ch.value : 0,
            unit: ch.unit || '',
            color: ch.color || '#00ff66',
            min: ch.min !== undefined ? ch.min : -100,
            max: ch.max !== undefined ? ch.max : 100,
            type: ch.type || 'analog'
        };
    }

    public static stringify(iniData: ParsedIni): string {
        let out = `[DEVICE]\n`;
        out += `name=${iniData.device?.name || 'Oscilloscope Device'}\n`;
        out += `baudRate=${iniData.device?.baudRate || 115200}\n`;
        out += `protocol=${iniData.device?.protocol || 'ModbusRTU'}\n\n`;

        iniData.channels.forEach((ch, idx) => {
            out += `[CHANNEL_${idx + 1}]\n`;
            out += `id=${ch.id}\n`;
            out += `name=${ch.name}\n`;
            out += `description=${ch.description}\n`;
            out += `unit=${ch.unit}\n`;
            out += `color=${ch.color}\n`;
            out += `min=${ch.min}\n`;
            out += `max=${ch.max}\n`;
            out += `type=${ch.type}\n\n`;
        });

        return out;
    }
}
