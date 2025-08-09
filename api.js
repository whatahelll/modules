// ===============================================
// MÓDULO: API Pública
// ===============================================

window.HabboAPI = (function() {
    'use strict';

    function getUsersNearMe(maxDistance = 2) {
        if (!window.HabboCore.room || !window.HabboCore.room.myUser) {
            window.HabboUI.log("❌ Usuário não encontrado na sala");
            return [];
        }

        return window.HabboCore.room.getUsersInRange(
            window.HabboCore.room.myUser.x,
            window.HabboCore.room.myUser.y,
            maxDistance
        );
    }

    function walkToPosition(x, y) {
        if (window.HabboCore.room && window.HabboCore.room.myUser) {
            return window.HabboCore.room.myUser.walkToSync(x, y);
        }
        return false;
    }

    function sendMessage(message) {
        if (window.HabboCore.room && window.HabboCore.room.myUser) {
            return window.HabboCore.room.myUser.say(message);
        }
        return false;
    }

    function shoutMessage(message) {
        if (window.HabboCore.room && window.HabboCore.room.myUser) {
            return window.HabboCore.room.myUser.shout(message);
        }
        return false;
    }

    function getAllUsers() {
        if (window.HabboCore.room) {
            return window.HabboCore.room.getAllUsers().map(user => ({
                id: user.id,
                username: user.username,
                x: user.x,
                y: user.y,
                userType: user.userType,
                walking: user.walking,
                lastUpdate: user.lastUpdate
            }));
        }
        return [];
    }

    function findUserByName(username) {
        if (!window.HabboCore.room) return null;
        return window.HabboCore.room.findUsersByName(username)[0] || null;
    }

    function getUsersInRadius(radius = 3) {
        if (!window.HabboCore.room || !window.HabboCore.room.myUser) return [];
        return window.HabboCore.room.getUsersInRange(
            window.HabboCore.room.myUser.x,
            window.HabboCore.room.myUser.y,
            radius
        );
    }

    function massChat(message, count = 5, delay = 500) {
        if (!window.HabboCore.room || !window.HabboCore.room.myUser) {
            window.HabboUI.log('❌ Usuário não disponível');
            return;
        }

        window.HabboUI.log(`💬 Enviando ${count}x: "${message}"`);

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                window.HabboCore.room.myUser.say(`${message} ${i + 1}`);
            }, i * delay);
        }
    }

    function teleportToUser(username) {
        const targetUser = findUserByName(username);
        if (!targetUser) {
            window.HabboUI.log(`❌ Usuário ${username} não encontrado`);
            return;
        }

        if (window.HabboCore.room.myUser) {
            window.HabboCore.room.myUser.walkToSync(targetUser.x, targetUser.y);
            window.HabboUI.log(`🚀 Teleportando para ${targetUser.username} (${targetUser.x}, ${targetUser.y})`);
        }
    }

    function spamWalk(count = 10, delay = 100) {
        if (!window.HabboCore.room || !window.HabboCore.room.myUser) {
            window.HabboUI.log('❌ Usuário não disponível');
            return;
        }

        const myX = window.HabboCore.room.myUser.x;
        const myY = window.HabboCore.room.myUser.y;

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const randomX = myX + Math.floor(Math.random() * 6) - 3;
                const randomY = myY + Math.floor(Math.random() * 6) - 3;
                window.HabboCore.room.myUser.walkToSync(Math.max(0, randomX), Math.max(0, randomY));
            }, i * delay);
        }
        window.HabboUI.log(`🚶 Spam walk iniciado (${count}x)`);
    }

    function autoFollowUser(username) {
        if (!window.HabboCore.room) {
            window.HabboUI.log('❌ Sala não disponível');
            return null;
        }

        const targetUser = window.HabboCore.room.findUsersByName(username)[0];

        if (!targetUser) {
            window.HabboUI.log(`❌ Usuário ${username} não encontrado`);
            return null;
        }

        const followInterval = setInterval(() => {
            if (!window.HabboCore.room.myUser || !targetUser) {
                clearInterval(followInterval);
                return;
            }

            const distance = Math.abs(targetUser.x - window.HabboCore.room.myUser.x) + Math.abs(targetUser.y - window.HabboCore.room.myUser.y);
            if (distance > 1) {
                window.HabboCore.room.myUser.walkToSync(targetUser.x, targetUser.y);
            }
        }, 1000);

        window.HabboUI.log(`🚶 Auto-seguindo ${targetUser.username}`);
        return followInterval;
    }

    function getMyPosition() {
        if (window.HabboCore.room && window.HabboCore.room.myUser) {
            return {
                x: window.HabboCore.room.myUser.x,
                y: window.HabboCore.room.myUser.y,
                z: window.HabboCore.room.myUser.z
            };
        }
        return null;
    }

    function getRoomStats() {
        if (!window.HabboCore.room) return null;

        const users = window.HabboCore.room.getAllUsers();
        const userTypes = users.reduce((acc, user) => {
            acc[user.userType] = (acc[user.userType] || 0) + 1;
            return acc;
        }, {});

        return {
            totalEntities: window.HabboCore.room.getUserCount(),
            userTypes: userTypes,
            isLoaded: window.HabboCore.room.isLoaded,
            myUser: window.HabboCore.room.myUser ? {
                id: window.HabboCore.room.myUser.id,
                username: window.HabboCore.room.myUser.username,
                position: {
                    x: window.HabboCore.room.myUser.x,
                    y: window.HabboCore.room.myUser.y,
                    z: window.HabboCore.room.myUser.z
                }
            } : null,
            usersNearMe: getUsersNearMe(3).length
        };
    }

    function debugCurrentPacket() {
        if (window.lastUnitPacket) {
            const packet = new window.HabboBinary.BinaryReader(window.lastUnitPacket);
            packet.readInt();
            packet.readShort();

            const userCount = packet.readInt();
            window.HabboUI.log(`🔍 Debug: ${userCount} entidades no packet`);

            for (let i = 0; i < Math.min(userCount, 3); i++) {
                const startOffset = packet.getOffset();
                try {
                    const id = packet.readInt();
                    const nameLen = packet.view.getUint16(packet.offset);
                    window.HabboUI.log(`🔍 Entidade ${i+1}: ID=${id}, offset=${startOffset}, nameLen=${nameLen}`);

                    if (nameLen < 100) {
                        const name = packet.readString();
                        window.HabboUI.log(`📝 Nome: "${name}"`);
                    } else {
                        window.HabboUI.log(`⚠️ Name length muito grande: ${nameLen}`);
                        break;
                    }
                } catch (e) {
                    window.HabboUI.log(`❌ Erro na entidade ${i+1}: ${e.message}`);
                    break;
                }
            }
        } else {
            window.HabboUI.log('❌ Nenhum packet UNIT capturado ainda');
        }
    }

    function analyzeHexPacket(hexString) {
        try {
            const cleanHex = hexString.replace(/\s/g, '');
            const bytes = new Uint8Array(cleanHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
            const packet = new window.HabboBinary.BinaryReader(bytes.buffer);

            window.HabboUI.log(`🔍 Analisando packet de ${bytes.length} bytes`);

            const size = packet.readInt();
            const header = packet.readShort();

            window.HabboUI.log(`📦 Tamanho: ${size}, Header: ${header}`);

            if (header === window.HabboPackets.Headers.Incoming.UNIT) {
                window.HabboUI.log('📋 Packet UNIT detectado, iniciando parsing...');
                const result = window.HabboPackets.parseUnitPacketSafe(packet);
                window.HabboUI.log(`✅ Parsing concluído: ${result} entidades`);
            } else {
                window.HabboUI.log(`❓ Header desconhecido: ${header}`);
            }

        } catch (e) {
            window.HabboUI.log(`❌ Erro ao analisar hex: ${e.message}`);
        }
    }

    function createTestUser(id, name, x = 5, y = 5) {
        if (!window.HabboCore.room) {
            window.HabboUI.log('❌ Sala não carregada');
            return;
        }

        const testUser = new window.HabboUser.User(id, name, 'Test Motto', 'test-figure', 0, x, y, 0, 2, 'M', 1);
        window.HabboCore.room.addUser(testUser);
        window.HabboUI.log(`🧪 Usuário teste criado: ${name} (ID: ${id}) em (${x}, ${y})`);
        window.HabboUI.updateUserCount();
    }

    function resetAll() {
        if (window.HabboCore.room) {
            window.HabboCore.room.clear();
            window.HabboUI.log('🧹 Todos os dados limpos');
        }
        if (window.HabboCore.packetMonitor) {
            window.HabboCore.packetMonitor.incomingPackets.clear();
            window.HabboCore.packetMonitor.outgoingPackets.clear();
            window.HabboUI.log('🧹 Stats de packets limpos');
        }
        window.HabboCore.myUserId = null;
        window.HabboCore.player = null;
        window.HabboUI.log('🧹 Reset completo realizado');
    }

    function getPerformanceStats() {
        const stats = {
            usersCount: window.HabboCore.room ? window.HabboCore.room.getUserCount() : 0,
            packetsIn: window.HabboCore.packetMonitor ? window.HabboCore.packetMonitor.incomingPackets.size : 0,
            packetsOut: window.HabboCore.packetMonitor ? window.HabboCore.packetMonitor.outgoingPackets.size : 0,
            socketState: window.HabboCore.gameSocket ? window.HabboCore.gameSocket.readyState : -1,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            } : 'N/A'
        };

        console.table(stats);
        return stats;
    }

    // Funções de debug avançadas
    function debugRoom() {
        if (window.HabboCore.room) {
            console.group('%cRoom Debug Info', 'color: #ffff00; font-weight: bold;');
            console.log('My User:', window.HabboCore.room.myUser);
            console.log('Total Entities:', window.HabboCore.room.getUserCount());
            console.log('All Users:', window.HabboCore.room.getAllUsers());
            console.log('Is Loaded:', window.HabboCore.room.isLoaded);
            console.log('Room Stats:', getRoomStats());
            console.groupEnd();
        } else {
            console.log('%cNo room loaded', 'color: #ff0000;');
        }
    }

    function debugSocket() {
        console.group('%cSocket Debug Info', 'color: #ffff00; font-weight: bold;');
        console.log('Game Socket:', window.HabboCore.gameSocket);
        console.log('Ready State:', window.HabboCore.gameSocket ? window.HabboCore.gameSocket.readyState : 'null');
        console.log('My User ID:', window.HabboCore.myUserId);
        console.log('Player Object:', window.HabboCore.player);
        console.groupEnd();
    }

    function testPacketParsing() {
        if (!window.lastUnitPacket) {
            window.HabboUI.log('❌ Nenhum packet UNIT capturado para testar');
            return;
        }

        window.HabboUI.log('🧪 Iniciando teste de parsing...');

        const originalPacket = new window.HabboBinary.BinaryReader(window.lastUnitPacket);
        originalPacket.readInt();
        originalPacket.readShort();

        const backupUsers = new Map(window.HabboCore.room.users);
        window.HabboCore.room.users.clear();

        const result = window.HabboPackets.parseUnitPacketSafe(originalPacket);

        window.HabboUI.log(`🧪 Teste concluído: ${result} usuários processados`);
        window.HabboUI.log(`📊 Usuários antes do teste: ${backupUsers.size}`);
        window.HabboUI.log(`📊 Usuários após o teste: ${window.HabboCore.room.users.size}`);

        if (window.HabboCore.room.users.size === 0 && backupUsers.size > 0) {
            window.HabboUI.log('🔄 Restaurando backup dos usuários...');
            window.HabboCore.room.users = backupUsers;
        }
    }

    // Exportar todas as funções da API
    return {
        // Funções básicas
        getUsersNearMe,
        walkToPosition,
        sendMessage,
        shoutMessage,
        getAllUsers,
        findUserByName,
        getUsersInRadius,
        getMyPosition,
        getRoomStats,

        // Funções avançadas
        massChat,
        teleportToUser,
        spamWalk,
        autoFollowUser,

        // Funções de debug
        debugCurrentPacket,
        analyzeHexPacket,
        createTestUser,
        resetAll,
        getPerformanceStats,
        debugRoom,
        debugSocket,
        testPacketParsing,

        // Aliases para compatibilidade
        sendPacket: window.HabboPackets ? window.HabboPackets.sendPacket : null,
        BinaryWriter: window.HabboBinary ? window.HabboBinary.BinaryWriter : null,
        BinaryReader: window.HabboBinary ? window.HabboBinary.BinaryReader : null,
        Headers: window.HabboPackets ? window.HabboPackets.Headers : null
    };
})();

// Exportar algumas funções para o escopo global para compatibilidade
window.getUsersNearMe = window.HabboAPI.getUsersNearMe;
window.sendPacket = window.HabboAPI.sendPacket;
window.walkToPosition = window.HabboAPI.walkToPosition;
window.sendMessage = window.HabboAPI.sendMessage;
window.getAllUsers = window.HabboAPI.getAllUsers;
window.massChat = window.HabboAPI.massChat;
window.spamWalk = window.HabboAPI.spamWalk;
window.teleportToUser = window.HabboAPI.teleportToUser;
window.debugCurrentPacket = window.HabboAPI.debugCurrentPacket;
