// ===============================================
// MÓDULO: Utilitários Binários
// ===============================================

window.HabboBinary = (function() {
    'use strict';

    class BinaryReader {
        constructor(binary) {
            this.binary = binary;
            this.view = new DataView(binary);
            this.offset = 0;
        }

        readInt() {
            if (this.offset + 4 > this.binary.byteLength) {
                throw new Error(`Cannot read int at offset ${this.offset}, remaining: ${this.getRemainingBytes()}`);
            }
            const value = this.view.getInt32(this.offset);
            this.offset += 4;
            return value;
        }

        readShort() {
            if (this.offset + 2 > this.binary.byteLength) {
                throw new Error(`Cannot read short at offset ${this.offset}, remaining: ${this.getRemainingBytes()}`);
            }
            const value = this.view.getInt16(this.offset);
            this.offset += 2;
            return value;
        }

        readBoolean() {
            if (this.offset + 1 > this.binary.byteLength) {
                throw new Error(`Cannot read boolean at offset ${this.offset}, remaining: ${this.getRemainingBytes()}`);
            }
            const value = !!this.view.getUint8(this.offset++);
            return value;
        }

        readString() {
            if (this.offset + 2 > this.binary.byteLength) {
                throw new Error(`Cannot read string length at offset ${this.offset}, remaining: ${this.getRemainingBytes()}`);
            }

            const length = this.view.getUint16(this.offset);
            this.offset += 2;

            if (length < 0 || length > 1000) {
                throw new Error(`Invalid string length: ${length} at offset ${this.offset - 2}`);
            }

            if (length === 0) {
                return '';
            }

            if (this.offset + length > this.binary.byteLength) {
                throw new Error(`Cannot read string data at offset ${this.offset}, length: ${length}, remaining: ${this.getRemainingBytes()}`);
            }

            const bytes = new Uint8Array(this.binary, this.offset, length);
            this.offset += length;

            try {
                return new TextDecoder('utf-8').decode(bytes);
            } catch (e) {
                try {
                    return new TextDecoder('latin1').decode(bytes);
                } catch (e2) {
                    return `[DECODE_ERROR_${length}]`;
                }
            }
        }

        readStringSafe() {
            try {
                if (this.offset + 2 > this.binary.byteLength) {
                    return `[NO_DATA_${this.offset}]`;
                }

                const length = this.view.getUint16(this.offset);
                this.offset += 2;

                if (length < 0 || length > 2000) {
                    this.offset -= 2;
                    this.skip(1);
                    return `[BAD_LENGTH_${length}]`;
                }

                if (length === 0) {
                    return '';
                }

                if (this.offset + length > this.binary.byteLength) {
                    const available = this.binary.byteLength - this.offset;
                    if (available > 0) {
                        const bytes = new Uint8Array(this.binary, this.offset, available);
                        this.offset = this.binary.byteLength;
                        try {
                            return new TextDecoder('utf-8').decode(bytes);
                        } catch (e) {
                            return `[PARTIAL_${available}]`;
                        }
                    }
                    return `[OVERFLOW_${length}]`;
                }

                const bytes = new Uint8Array(this.binary, this.offset, length);
                this.offset += length;

                try {
                    return new TextDecoder('utf-8').decode(bytes);
                } catch (e) {
                    try {
                        return new TextDecoder('latin1').decode(bytes);
                    } catch (e2) {
                        return `[DECODE_ERROR_${length}]`;
                    }
                }
            } catch (e) {
                return `[FATAL_ERROR_${this.offset}]`;
            }
        }

        getRemainingBytes() {
            return this.binary.byteLength - this.offset;
        }

        skip(bytes) {
            this.offset = Math.min(this.binary.byteLength, this.offset + bytes);
        }

        getOffset() {
            return this.offset;
        }

        setOffset(newOffset) {
            this.offset = Math.max(0, Math.min(this.binary.byteLength, newOffset));
        }

        canRead(bytes) {
            return this.offset + bytes <= this.binary.byteLength;
        }

        debugHex(length = 32) {
            const start = Math.max(0, this.offset - 8);
            const end = Math.min(this.binary.byteLength, this.offset + length);
            const bytes = new Uint8Array(this.binary, start, end - start);
            const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(' ');
            const pos = Math.min(8, this.offset - start) * 3;
            return `${hex.substring(0, pos)}[${hex.substring(pos, pos + 2)}]${hex.substring(pos + 3)}`;
        }
    }

    class BinaryWriter {
        constructor(header) {
            this.binary = [];
            this.offset = 0;
            this.writeInt(0);
            this.writeShort(header);
        }

        writeInt(value) {
            this.binary[this.offset++] = (value >> 24) & 0xFF;
            this.binary[this.offset++] = (value >> 16) & 0xFF;
            this.binary[this.offset++] = (value >> 8) & 0xFF;
            this.binary[this.offset++] = value & 0xFF;
            return this;
        }

        writeShort(value) {
            this.binary[this.offset++] = (value >> 8) & 0xFF;
            this.binary[this.offset++] = value & 0xFF;
            return this;
        }

        writeString(value) {
            const data = new TextEncoder().encode(value);
            this.writeShort(data.length);
            for (let i = 0; i < data.length; i++) {
                this.binary[this.offset + i] = data[i];
            }
            this.offset += data.length;
            return this;
        }

        compose() {
            this.offset = 0;
            this.writeInt(this.binary.length - 4);
            return new Uint8Array(this.binary);
        }
    }

    // Função utilitária para leitura avançada de strings
    function readStringSafeAdvanced(packet, context) {
        try {
            if (packet.offset + 2 > packet.binary.byteLength) {
                console.log(`⚠️ [${context}] Sem dados para length`);
                return '';
            }

            const length = packet.view.getUint16(packet.offset);

            if (length < 0 || length > 500) {
                console.log(`⚠️ [${context}] Length inválido: ${length}`);
                let found = false;
                for (let i = 1; i < 10 && packet.offset + i + 2 < packet.binary.byteLength; i++) {
                    const testLength = packet.view.getUint16(packet.offset + i);
                    if (testLength >= 0 && testLength <= 100) {
                        packet.offset += i;
                        found = true;
                        console.log(`🔧 [${context}] Ajustado offset +${i}, novo length: ${testLength}`);
                        break;
                    }
                }
                if (!found) {
                    packet.offset += 2;
                    return `[ERROR_${context}]`;
                }
                return readStringSafeAdvanced(packet, context + '_retry');
            }

            packet.offset += 2;

            if (length === 0) {
                return '';
            }

            if (packet.offset + length > packet.binary.byteLength) {
                console.log(`⚠️ [${context}] Length ${length} excede dados disponíveis`);
                const available = packet.binary.byteLength - packet.offset;
                packet.offset = packet.binary.byteLength;
                return available > 0 ? `[PARTIAL_${available}]` : '';
            }

            const bytes = new Uint8Array(packet.binary, packet.offset, length);
            packet.offset += length;

            try {
                return new TextDecoder('utf-8').decode(bytes);
            } catch (e) {
                try {
                    return new TextDecoder('latin1').decode(bytes);
                } catch (e2) {
                    console.log(`⚠️ [${context}] Erro de decode`);
                    return `[DECODE_ERROR_${length}]`;
                }
            }
        } catch (e) {
            console.log(`❌ [${context}] Erro fatal: ${e.message}`);
            return `[FATAL_${context}]`;
        }
    }

    return {
        BinaryReader,
        BinaryWriter,
        readStringSafeAdvanced
    };
})();
