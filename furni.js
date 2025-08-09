// ===============================================
// MÓDULO: Classe Furni
// ===============================================

window.Furni = class Furni {
    constructor(packet) {
        this.id = packet.readInt();
        this.spriteId = packet.readInt();
        this.x = packet.readInt();
        this.y = packet.readInt();
        this.direction = ((packet.readInt() % 8) * 45);
        this.z = parseFloat(packet.readString());
        this.stackHeight = parseFloat(packet.readString());
        this.extra = packet.readInt();
        this.data = null;

        let flags = packet.readInt();

        switch(flags & 0xFF) {
            case 7: // Crackable
                this.data = {
                    parseWrapper(packet) {
                        this.state = packet.readString();
                        this.hits = packet.readInt();
                        this.target = packet.readInt();

                        if((this.flags & 256) > 0) {
                            this.uniqueNumber = packet.readInt();
                            this.uniqueSeries = packet.readInt();
                        }
                    },
                    getLegacyString() {
                        return this.state;
                    }
                }
                break;
            case 4: // Empty
                this.data = {
                    parseWrapper(packet) {
                        if(!packet) return;
                        this.state = '';

                        if((this.flags & 256) > 0) {
                            this.uniqueNumber = packet.readInt();
                            this.uniqueSeries = packet.readInt();
                        }
                    },
                    getLegacyString() {
                        return this.state;
                    }
                }
                break;
            case 6: // Highscore
                this.data = {
                    entries: [],
                    parseWrapper(packet) {
                        if(!packet) return;

                        this.state = packet.readString();
                        this.scoreType = packet.readInt();
                        this.clearType = packet.readInt();

                        let totalScores = packet.readInt();

                        while(totalScores > 0) {
                            const data = {
                                users: []
                            }

                            data.score = packet.readInt();

                            let totalUsers = packet.readInt();

                            while(totalUsers > 0) {
                                data.users.push(packet.readString());
                                totalUsers--;
                            }

                            this.entries.push(data);
                            totalScores--;
                        }

                        if((this.flags & 256) > 0) {
                            this.uniqueNumber = packet.readInt();
                            this.uniqueSeries = packet.readInt();
                        }
                    },
                    getLegacyString() {
                        return this.state;
                    }
                }
                break;
            case 0: // Legacy
                this.data = {
                    parseWrapper(packet) {
                        if(!packet) return;
                        this.data = packet.readString();

                        if((this.flags & 256) > 0) {
                            this.uniqueNumber = packet.readInt();
                            this.uniqueSeries = packet.readInt();
                        }
                    },
                    getLegacyString() {
                        return this.data;
                    }
                }
                break;
            case 1: // Map
                this.data = {
                    parseWrapper(packet) {
                        if(!packet) return;

                        this.data = {};

                        const totalSets = packet.readInt();

                        if(totalSets) for(let i = 0; i < totalSets; i++) this.data[packet.readString()] = packet.readString();

                        if((this.flags & 256) > 0) {
                            this.uniqueNumber = packet.readInt();
                            this.uniqueSeries = packet.readInt();
                        }
                    },
                    getLegacyString() {
                        if(!this.data) return '';

                        const state = this.data.state;

                        if(state === undefined || state === null) return '';

                        return state;
                    }
                }
                break;
            case 5: // Number
                this.data = {
                    parseWrapper(packet) {
                        if(!packet) return;

                        this.data = [];

                        const totalNumbers = packet.readInt();

                        if(totalNumbers) for(let i = 0; i < totalNumbers; i++) this.data.push(packet.readInt());

                        if((this.flags & 256) > 0) {
                            this.uniqueNumber = packet.readInt();
                            this.uniqueSeries = packet.readInt();
                        }
                    },
                    getLegacyString() {
                        if(!this.data || !this.data.length) return '';

                        return this.data[0].toString();
                    }
                }
                break;
            case 2: // String
                this.data = {
                    parseWrapper(packet) {
                        this.data = [];

                        const totalStrings = packet.readInt();

                        if(totalStrings) for(let i = 0; i < totalStrings; i++) this.data.push(packet.readString());

                        if((this.flags & 256) > 0) {
                            this.uniqueNumber = packet.readInt();
                            this.uniqueSeries = packet.readInt();
                        }
                    },
                    getLegacyString() {
                        if(!this.data || !this.data.length) return '';

                        return this.data[0];
                    }
                }
                break;
            case 3: // Vote
                this.data = {
                    parseWrapper(packet) {
                        this.state = packet.readString();
                        this.result = packet.readInt();

                        if((this.flags & 256) > 0) {
                            this.uniqueNumber = packet.readInt();
                            this.uniqueSeries = packet.readInt();
                        }
                    },
                    getLegacyString() {
                        return this.state;
                    }
                }
                break;
        }

        if(!this.data) {
            console.warn("Furni data not found for type:", flags & 0xFF);
            this.data = {
                parseWrapper() {},
                getLegacyString() { return '0'; }
            };
        }

        this.data.flags = (flags & 0xFF00);

        try {
            this.data.parseWrapper(packet);
        } catch (e) {
            console.warn("Error parsing furni data:", e);
        }

        this.state = parseFloat(this.data && this.data.getLegacyString()) || 0;
        this.expires = packet.readInt();
        this.usagePolicy = packet.readInt();
        this.userId = packet.readInt();

        if(this.spriteId < 0) this.spriteName = packet.readString();
    }

    use() {
        if (window.HabboCore && window.HabboCore.gameSocket) {
            const packet = new window.HabboBinary.BinaryWriter(99)
                .writeInt(this.id)
                .writeInt(0)
                .compose();
            window.HabboCore.gameSocket.send(packet);
        }
    }
};
