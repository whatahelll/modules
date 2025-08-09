// ===============================================
// MÓDULO: Sistema de Usuários
// ===============================================

window.HabboUser = (function() {
    'use strict';

    class User extends window.HabboEvents.EventEmitter {
        constructor(id, username, motto, figure, roomIndex, x, y, z, direction, gender = 'M', userType = 1, achievementScore = 0, isModerator = false) {
            super();
            this.id = id;
            this.username = username || `User_${id}`;
            this.motto = motto || '';
            this.figure = figure || '';
            this.roomIndex = roomIndex;
            this.x = x;
            this.y = y;
            this.z = z;
            this.direction = direction;
            this.gender = gender;
            this.userType = userType;
            this.achievementScore = achievementScore;
            this.isModerator = isModerator;
            this.walking = false;
            this.lastUpdate = Date.now();
        }

        updatePosition(x, y, z) {
            const oldX = this.x;
            const oldY = this.y;
            this.x = x;
            this.y = y;
            this.z = z;
            this.lastUpdate = Date.now();

            if (oldX !== x || oldY !== y) {
                this.emit('position-changed', this, oldX, oldY);
                if (window.HabboCore && window.HabboCore.room) {
                    window.HabboCore.room.emit('user-position-changed', this, oldX, oldY);
                }
            }
        }

        walkToSync(x, y) {
            const gameSocket = window.HabboCore ? window.HabboCore.gameSocket : null;
            
            if (!gameSocket || gameSocket.readyState !== WebSocket.OPEN) {
                window.HabboUI.log('❌ WebSocket não conectado');
                return;
            }

            const myUserId = window.HabboCore ? window.HabboCore.myUserId : null;
            
            if (this.id !== myUserId) {
                window.HabboUI.log('❌ Só posso mover meu próprio usuário');
                return;
            }

            try {
                const packet = new window.HabboBinary.BinaryWriter(window.HabboPackets.Headers.Outgoing.UNIT_WALK)
                    .writeInt(x)
                    .writeInt(y)
                    .compose();

                gameSocket.send(packet);

                const hexPacket = Array.from(packet, byte => byte.toString(16).padStart(2, '0')).join('');
                window.HabboUI.log(`🚶 Caminhando para (${x}, ${y}) - Packet: ${hexPacket}`);
            } catch (e) {
                window.HabboUI.log(`❌ Erro ao caminhar: ${e.message}`);
            }
        }

        say(message) {
            const gameSocket = window.HabboCore ? window.HabboCore.gameSocket : null;
            
            if (!gameSocket || gameSocket.readyState !== WebSocket.OPEN) {
                window.HabboUI.log('❌ WebSocket não conectado');
                return;
            }

            const myUserId = window.HabboCore ? window.HabboCore.myUserId : null;
            
            if (this.id !== myUserId) {
                window.HabboUI.log('❌ Só posso falar pelo meu próprio usuário');
                return;
            }

            try {
                const packet = new window.HabboBinary.BinaryWriter(window.HabboPackets.Headers.Outgoing.UNIT_CHAT)
                    .writeString(message)
                    .writeInt(0)
                    .compose();

                gameSocket.send(packet);
                window.HabboUI.log(`💬 Disse: ${message}`);
            } catch (e) {
                window.HabboUI.log(`❌ Erro ao falar: ${e.message}`);
            }
        }

        shout(message) {
            const gameSocket = window.HabboCore ? window.HabboCore.gameSocket : null;
            
            if (!gameSocket || gameSocket.readyState !== WebSocket.OPEN) {
                window.HabboUI.log('❌ WebSocket não conectado');
                return;
            }

            const myUserId = window.HabboCore ? window.HabboCore.myUserId : null;
            
            if (this.id !== myUserId) {
                window.HabboUI.log('❌ Só posso gritar pelo meu próprio usuário');
                return;
            }

            try {
                const packet = new window.HabboBinary.BinaryWriter(window.HabboPackets.Headers.Outgoing.UNIT_CHAT_SHOUT)
                    .writeString(message)
                    .writeInt(0)
                    .compose();

                gameSocket.send(packet);
                window.HabboUI.log(`📢 Gritou: ${message}`);
            } catch (e) {
                window.HabboUI.log(`❌ Erro ao gritar: ${e.message}`);
            }
        }
    }

    return {
        User
    };
})();
