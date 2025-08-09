// ===============================================
// MÓDULO: Classe Furni (CORRIGIDA)
// ===============================================

window.Furni = class Furni {
    constructor(packet) {
        try {
            this.id = packet.readInt();
            this.spriteId = packet.readInt();
            this.x = packet.readInt();
            this.y = packet.readInt();
            this.direction = ((packet.readInt() % 8) * 45);
            this.z = parseFloat(packet.readStringSafe());
            this.stackHeight = parseFloat(packet.readStringSafe());
            this.extra = packet.readInt();
            this.data = null;

            let flags = packet.readInt();

            // Criar data object padrão
            this.data = {
                parseWrapper: function(packet) {
                    try {
                        this.state = '';
                        this.flags = flags & 0xFF00;
                    } catch (e) {
                        this.state = '';
                    }
                },
                getLegacyString: function() {
                    return this.state || '0';
                }
            };

            const dataType = flags & 0xFF;
            
            switch(dataType) {
                case 0: // Legacy
                    this.data.parseWrapper = function(packet) {
                        try {
                            this.data = packet.readStringSafe();
                            this.flags = flags & 0xFF00;
                            if((this.flags & 256) > 0) {
                                if (packet.canRead(8)) {
                                    this.uniqueNumber = packet.readInt();
                                    this.uniqueSeries = packet.readInt();
                                }
                            }
                        } catch (e) {
                            this.data = '0';
                        }
                    };
                    this.data.getLegacyString = function() {
                        return this.data || '0';
                    };
                    break;

                case 1: // Map
                    this.data.parseWrapper = function(packet) {
                        try {
                            this.data = {};
                            this.flags = flags & 0xFF00;
                            
                            if (packet.canRead(4)) {
                                const totalSets = packet.readInt();
                                if (totalSets >= 0 && totalSets < 100) {
                                    for(let i = 0; i < totalSets; i++) {
                                        if (packet.canRead(4)) {
                                            const key = packet.readStringSafe();
                                            const value = packet.readStringSafe();
                                            if (key && value) {
                                                this.data[key] = value;
                                            }
                                        }
                                    }
                                }
                            }
                            
                            if((this.flags & 256) > 0) {
                                if (packet.canRead(8)) {
                                    this.uniqueNumber = packet.readInt();
                                    this.uniqueSeries = packet.readInt();
                                }
                            }
                        } catch (e) {
                            this.data = {};
                        }
                    };
                    this.data.getLegacyString = function() {
                        if(!this.data) return '0';
                        const state = this.data.state;
                        if(state === undefined || state === null) return '0';
                        return state;
                    };
                    break;

                case 2: // String
                    this.data.parseWrapper = function(packet) {
                        try {
                            this.data = [];
                            this.flags = flags & 0xFF00;
                            
                            if (packet.canRead(4)) {
                                const totalStrings = packet.readInt();
                                if (totalStrings >= 0 && totalStrings < 100) {
                                    for(let i = 0; i < totalStrings; i++) {
                                        const str = packet.readStringSafe();
                                        if (str) {
                                            this.data.push(str);
                                        }
                                    }
                                }
                            }
                            
                            if((this.flags & 256) > 0) {
                                if (packet.canRead(8)) {
                                    this.uniqueNumber = packet.readInt();
                                    this.uniqueSeries = packet.readInt();
                                }
                            }
                        } catch (e) {
                            this.data = [];
                        }
                    };
                    this.data.getLegacyString = function() {
                        if(!this.data || !this.data.length) return '0';
                        return this.data[0] || '0';
                    };
                    break;

                case 5: // Number
                    this.data.parseWrapper = function(packet) {
                        try {
                            this.data = [];
                            this.flags = flags & 0xFF00;
                            
                            if (packet.canRead(4)) {
                                const totalNumbers = packet.readInt();
                                if (totalNumbers >= 0 && totalNumbers < 100) {
                                    for(let i = 0; i < totalNumbers; i++) {
                                        if (packet.canRead(4)) {
                                            this.data.push(packet.readInt());
                                        }
                                    }
                                }
                            }
                            
                            if((this.flags & 256) > 0) {
                                if (packet.canRead(8)) {
                                    this.uniqueNumber = packet.readInt();
                                    this.uniqueSeries = packet.readInt();
                                }
                            }
                        } catch (e) {
                            this.data = [0];
                        }
                    };
                    this.data.getLegacyString = function() {
                        if(!this.data || !this.data.length) return '0';
                        return this.data[0].toString();
                    };
                    break;

                default:
                    // Para todos os outros tipos, usar implementação simples
                    this.data.parseWrapper = function(packet) {
                        try {
                            this.state = '0';
                            this.flags = flags & 0xFF00;
                            
                            // Tentar pular dados desconhecidos
                            const remainingBytes = packet.getRemainingBytes();
                            if (remainingBytes > 0) {
                                // Pular alguns bytes para tentar recuperar
                                packet.skip(Math.min(remainingBytes, 20));
                            }
                        } catch (e) {
                            this.state = '0';
                        }
                    };
                    break;
            }

            this.data.flags = (flags & 0xFF00);

            try {
                this.data.parseWrapper(packet);
            } catch (e) {
                console.warn(`Erro ao processar data do móvel ID ${this.id}:`, e);
                this.data.state = '0';
            }

            this.state = parseFloat(this.data.getLegacyString()) || 0;
            
            // Ler campos finais de forma segura
            if (packet.canRead(4)) {
                this.expires = packet.readInt();
            } else {
                this.expires = -1;
            }
            
            if (packet.canRead(4)) {
                this.usagePolicy = packet.readInt();
            } else {
                this.usagePolicy = 0;
            }
            
            if (packet.canRead(4)) {
                this.userId = packet.readInt();
            } else {
                this.userId = -1;
            }

            if(this.spriteId < 0 && packet.canRead(2)) {
                this.spriteName = packet.readStringSafe();
            }
            
        } catch (e) {
            console.error(`Erro fatal ao processar móvel:`, e);
            // Valores padrão em caso de erro
            this.id = -1;
            this.spriteId = -1;
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.state = 0;
            this.direction = 0;
            this.expires = -1;
            this.usagePolicy = 0;
            this.userId = -1;
            throw e; // Re-throw para que o parser possa lidar
        }
    }

    use() {
        if (window.HabboCore && window.HabboCore.gameSocket) {
            try {
                const packet = new window.HabboBinary.BinaryWriter(99)
                    .writeInt(this.id)
                    .writeInt(0)
                    .compose();
                window.HabboCore.gameSocket.send(packet);
            } catch (e) {
                console.error('Erro ao usar móvel:', e);
            }
        }
    }
};
