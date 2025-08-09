// ===============================================
// MÓDULO: Sistema de Packets
// ===============================================

window.HabboPackets = (function() {
    'use strict';

    const Headers = {
        Incoming: {
            UNIT: 374,
            UNIT_STATUS: 1640,
            UNIT_CHAT: 1446,
            ROOM_HEIGHT_MAP: 2753,
            ROOM_MODEL_NAME: 2031,
            ROOM_PAINT: 2454,
            ROOM_ENTER: 758,
            USER_INFO: 2725,
            UNIT_REMOVE: 3301
        },
        Outgoing: {
            UNIT_WALK: 3320,
            UNIT_CHAT: 1314,
            UNIT_CHAT_SHOUT: 2085,
            UNIT_CHAT_WHISPER: 1543,
            USER_INFO: 357
        }
    };

    class PacketMonitor {
        constructor() {
            this.incomingPackets = new Map();
            this.outgoingPackets = new Map();
            this.logEnabled = false;
        }

        enableLogging() {
            this.logEnabled = true;
            window.HabboUI.log('📡 Packet logging ativado');
        }

        disableLogging() {
            this.logEnabled = false;
            window.HabboUI.log('📡 Packet logging desativado');
        }

        logIncoming(header, data) {
            if (!this.logEnabled) return;
            console.log(`%c[IN] Header: ${header}`, 'color: #00aaff;', data);

            this.incomingPackets.set(header, {
                count: (this.incomingPackets.get(header)?.count || 0) + 1,
                lastTime: Date.now()
            });
        }

        logOutgoing(header, data) {
            if (!this.logEnabled) return;
            console.log(`%c[OUT] Header: ${header}`, 'color: #ff8800;', data);

            this.outgoingPackets.set(header, {
                count: (this.outgoingPackets.get(header)?.count || 0) + 1,
                lastTime: Date.now()
            });
        }

        getStats() {
            console.group('%cPacket Statistics', 'color: #ffff00; font-weight: bold;');
            console.log('Incoming packets:', this.incomingPackets.size);
            console.log('Outgoing packets:', this.outgoingPackets.size);
            console.log('Incoming details:', Array.from(this.incomingPackets.entries()));
            console.log('Outgoing details:', Array.from(this.outgoingPackets.entries()));
            console.groupEnd();
        }
    }

    function findNextEntityOffset(packet, currentStart) {
        const searchStart = currentStart + 4;
        const searchEnd = Math.min(packet.binary.byteLength - 8, searchStart + 250);

        window.HabboUI.log(`🔧 Recuperando... Buscando próxima entidade entre os offsets ${searchStart} e ${searchEnd}`);

        for (let offset = searchStart; offset < searchEnd; offset++) {
            try {
                const possibleId = packet.view.getInt32(offset);

                if (possibleId !== 0 && Math.abs(possibleId) < 2000000000) {
                    const possibleLengthOffset = offset + 4;
                    if (possibleLengthOffset + 2 <= packet.binary.byteLength) {
                        const possibleLength = packet.view.getUint16(possibleLengthOffset);

                        if (possibleLength >= 0 && possibleLength <= 50) {
                            window.HabboUI.log(`🔧 Ponto de recuperação encontrado no offset ${offset} (ID provável: ${possibleId}, Comprimento do nome: ${possibleLength})`);
                            return offset;
                        }
                    }
                }
            } catch (e) {
                continue;
            }
        }

        window.HabboUI.log(`🔧 Não foi possível encontrar um ponto de recuperação válido.`);
        return -1;
    }

    function parseUnitPacketSafe(packet) {
        let successCount = 0;
        let errorCount = 0;

        try {
            if (!packet.canRead(4)) {
                window.HabboUI.log('⚠️ [UNIT Parser] Pacote muito curto para ler a contagem de entidades.');
                return 0;
            }

            const userCount = packet.readInt();
            window.HabboUI.log(`👥 Processando ${userCount} entidades no pacote UNIT...`);

            for (let i = 0; i < userCount; i++) {
                const entityStartOffset = packet.getOffset();
                let entityId = -1;

                try {
                    if (!packet.canRead(4)) {
                        window.HabboUI.log(`⚠️ [Entidade #${i + 1}] Dados insuficientes para ler.`);
                        break;
                    }

                    entityId = packet.readInt();
                    const username = window.HabboBinary.readStringSafeAdvanced(packet, `username_${i+1}`);
                    const motto = window.HabboBinary.readStringSafeAdvanced(packet, `motto_${i+1}`);
                    const figure = window.HabboBinary.readStringSafeAdvanced(packet, `figure_${i+1}`);
                    const roomIndex = packet.readInt();
                    const x = packet.readInt();
                    const y = packet.readInt();
                    const zStr = window.HabboBinary.readStringSafeAdvanced(packet, `z_str_${i+1}`);
                    const z = parseFloat(zStr) || 0;
                    const direction = packet.readInt();
                    const userType = packet.readInt();

                    let user;

                    if (userType === 1) {
                        const gender = window.HabboBinary.readStringSafeAdvanced(packet, `gender_${i+1}`);
                        const groupID = packet.readInt();
                        const groupStatus = packet.readInt();
                        const groupName = window.HabboBinary.readStringSafeAdvanced(packet, `groupName_${i+1}`);
                        const swimFigure = window.HabboBinary.readStringSafeAdvanced(packet, `swimFigure_${i+1}`);
const achievementScore = packet.readInt();
                        const isModerator = packet.readBoolean();

                        user = new window.HabboUser.User(entityId, username, motto, figure, roomIndex, x, y, z, direction, gender, userType, achievementScore, isModerator);
                        window.HabboUI.log(`✅ 👤 [Tipo:1] Habblet ${user.username} (ID: ${user.id}) adicionado.`);

                    } else if (userType === 4) {
                        const gender = window.HabboBinary.readStringSafeAdvanced(packet, `gender_${i+1}`);
                        const ownerId = packet.readInt();
                        const ownerName = window.HabboBinary.readStringSafeAdvanced(packet, `ownerName_${i+1}`);

                        const skillsCount = packet.readInt();
                        const botSkills = [];
                        for (let j = 0; j < skillsCount; j++) {
                            if (packet.canRead(2)) {
                                botSkills.push(packet.readShort());
                            }
                        }

                        user = new window.HabboUser.User(entityId, username, motto, figure, roomIndex, x, y, z, direction, gender, userType);
                        user.botSkills = botSkills;
                        user.ownerId = ownerId;
                        user.ownerName = ownerName;
                        window.HabboUI.log(`✅ 🤖 [Tipo:4] Bot ${user.username} (ID: ${user.id}) adicionado.`);

                    } else {
                        user = new window.HabboUser.User(entityId, username, motto, figure, roomIndex, x, y, z, direction, 'M', userType);
                        window.HabboUI.log(`✅ ❓ [Tipo:${userType}] Entidade ${user.username} (ID: ${user.id}) adicionada.`);
                    }

                    if (window.HabboCore && window.HabboCore.room) {
                        window.HabboCore.room.addUser(user);
                    }
                    successCount++;

                } catch (e) {
                    errorCount++;
                    window.HabboUI.log(`❌ Erro ao processar entidade #${i + 1} (ID provável: ${entityId}): ${e.message}`);

                    const nextOffset = findNextEntityOffset(packet, entityStartOffset);
                    if (nextOffset > 0 && nextOffset > entityStartOffset) {
                        window.HabboUI.log(`⏩ Tentando se recuperar, pulando para o offset ${nextOffset}.`);
                        packet.setOffset(nextOffset);
                    } else {
                        window.HabboUI.log(`⏹️ Não foi possível se recuperar. Interrompendo o parsing.`);
                        break;
                    }
                }
            }

            window.HabboUI.log(`📊 Parsing do pacote UNIT finalizado. Sucessos: ${successCount}, Erros: ${errorCount}`);
            return successCount;

        } catch (e) {
            window.HabboUI.log(`❌ Erro fatal no parser UNIT: ${e.message}`);
            return 0;
        }
    }

    function sendPacket(header, ...args) {
        const gameSocket = window.HabboCore ? window.HabboCore.gameSocket : null;
        
        if (!gameSocket || gameSocket.readyState !== WebSocket.OPEN) {
            window.HabboUI.log('❌ WebSocket não conectado');
            return false;
        }

        try {
            const writer = new window.HabboBinary.BinaryWriter(header);

            for (const arg of args) {
                if (typeof arg === 'string') {
                    writer.writeString(arg);
                } else if (typeof arg === 'number') {
                    if (Number.isInteger(arg)) {
                        writer.writeInt(arg);
                    }
                } else if (typeof arg === 'boolean') {
                    writer.writeInt(arg ? 1 : 0);
                }
            }

            const packet = writer.compose();
            gameSocket.send(packet);

            const hexPacket = Array.from(packet, byte => byte.toString(16).padStart(2, '0')).join('');
            window.HabboUI.log(`📤 Packet enviado: ${header} - ${hexPacket}`);
            return true;
        } catch (e) {
            window.HabboUI.log(`❌ Erro ao enviar packet: ${e.message}`);
            return false;
        }
    }

    return {
        Headers,
        PacketMonitor,
        parseUnitPacketSafe,
        sendPacket,
        findNextEntityOffset
    };
})();
