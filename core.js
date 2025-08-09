// ===============================================
// MÓDULO: Core do Sistema
// ===============================================

window.HabboCore = (function() {
    'use strict';

    let gameSocket = null;
    let injectionCount = 0;
    let room = null;
    let packetMonitor = null;
    let myUserId = null;
    let player = null;

    function injectIntoWindow(targetWindow, context) {
        try {
            if (!targetWindow || !targetWindow.WebSocket || targetWindow.__habbo_injected) {
                return false;
            }

            const originalWebSocket = targetWindow.WebSocket;

            targetWindow.WebSocket = function(...args) {
                const ws = new originalWebSocket(...args);

                if (args[0] && args[0].includes('proxy.habblet.city')) {
                    gameSocket = ws;
                    targetWindow.wss = ws;
                    targetWindow.gameSocket = ws;
                    window.HabboUI.log(`🎯 WebSocket capturado [${context}] - ${args[0]}`);
                    window.HabboUI.updateStatus('WebSocket Encontrado');

                    ws.addEventListener('open', () => {
                        window.HabboUI.log('✅ Conectado ao jogo');
                        window.HabboUI.updateStatus('Conectado - Pronto!');
                        setupPacketInterception(ws, targetWindow);
                    });

                    ws.addEventListener('close', () => {
                        window.HabboUI.log('🔌 Desconectado');
                        window.HabboUI.updateStatus('Desconectado');
                        gameSocket = null;
                    });

                    ws.addEventListener('error', (e) => {
                        window.HabboUI.log('❌ Erro no WebSocket');
                    });
                }

                return ws;
            };

            Object.setPrototypeOf(targetWindow.WebSocket, originalWebSocket);
            Object.setPrototypeOf(targetWindow.WebSocket.prototype, originalWebSocket.prototype);

            targetWindow.__habbo_injected = true;
            return true;

        } catch (e) {
            window.HabboUI.log(`❌ Erro injeção: ${e.message}`);
            return false;
        }
    }

    function setupPacketInterception(ws, targetWindow) {
        room = new window.HabboRoom.Room();
        packetMonitor = new window.HabboPackets.PacketMonitor();

        // Exportar para o objeto core
        window.HabboCore.room = room;
        window.HabboCore.packetMonitor = packetMonitor;
        window.HabboCore.gameSocket = ws;

        // Também exportar para window global para compatibilidade
        window.room = room;
        window.packetMonitor = packetMonitor;
        window.wss = ws;
        window.gameSocket = ws;
        targetWindow.room = room;

        if (targetWindow.player) {
            player = targetWindow.player;
            myUserId = player.id;
            window.HabboCore.myUserId = myUserId;
            window.HabboCore.player = player;
            window.HabboUI.log(`👤 Player encontrado: ID ${player.id}`);
        }

        // Event listeners da room
        room.on('user-load', (user) => {
            if (user.id === myUserId) {
                room.myUser = user;
                window.HabboUI.log(`✅ Meu usuário carregado: ${user.username} em (${user.x}, ${user.y})`);
            } else {
                window.HabboUI.log(`👥 Usuário carregado: ${user.username} [Tipo: ${user.userType}] em (${user.x}, ${user.y})`);
            }
        });

        room.on('user-position-changed', (user, oldX, oldY) => {
            if (user.id === myUserId) {
                window.HabboUI.log(`📍 Minha posição atualizada: (${oldX}, ${oldY}) → (${user.x}, ${user.y})`);
                window.HabboUI.refreshNearbyUsers();
            } else {
                window.HabboUI.log(`📍 ${user.username}: (${oldX}, ${oldY}) → (${user.x}, ${user.y})`);
            }
        });

        // Interceptar envio de packets
        const originalSend = ws.send;
        ws.send = function(data) {
            if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
                try {
                    const packet = new window.HabboBinary.BinaryReader(data instanceof ArrayBuffer ? data : data.buffer);
                    packet.readInt();
                    const header = packet.readShort();

                    const hexPacket = Array.from(new Uint8Array(data instanceof ArrayBuffer ? data : data.buffer),
                        byte => byte.toString(16).padStart(2, '0')).join('');

                    packetMonitor.logOutgoing(header, `Packet sent: ${hexPacket}`);
                } catch (e) {}
            }
            return originalSend.call(this, data);
        };

        // Interceptar recebimento de packets
        ws.addEventListener('message', async (message) => {
            try {
                const data = await new Response(message.data).arrayBuffer();
                const packet = new window.HabboBinary.BinaryReader(data);
                packet.readInt();
                const header = packet.readShort();

                packetMonitor.logIncoming(header, 'Packet received');

                // Processar packets específicos
                if (header === 2725) { // USER_INFO
                    try {
                        const userId = packet.readInt();
                        const username = packet.readString();
                        myUserId = userId;
                        window.HabboCore.myUserId = myUserId;

                        if (!player) {
                            player = { id: userId, username: username };
                            window.HabboCore.player = player;
                            targetWindow.player = player;
                        }

                        window.HabboUI.log(`👤 Meu ID: ${userId}, Username: ${username}`);

                        if (!room.myUser) {
                            const myUser = new window.HabboUser.User(userId, username, '', '', -1, 0, 0, 0, 0);
                            room.users.set(userId, myUser);
                            room.myUser = myUser;
                            window.HabboUI.log(`✅ Meu usuário criado: ${username}`);
                        }
                    } catch (e) {
                        window.HabboUI.log(`❌ Erro ao processar USER_INFO: ${e.message}`);
                    }
                }
                else if (header === window.HabboPackets.Headers.Incoming.UNIT_STATUS) {
                    try {
                        let userCount = packet.readInt();
                        while (userCount-- > 0) {
                            const roomIndex = packet.readInt();
                            const x = packet.readInt();
                            const y = packet.readInt();
                            const z = parseFloat(packet.readString());
                            const headDirection = packet.readInt();
                            const direction = packet.readInt();
                            const actions = packet.readString();

                            room.updateUserPosition(roomIndex, x, y, z, direction, actions);
                        }
                    } catch (e) {
                        window.HabboUI.log(`❌ Erro ao processar UNIT_STATUS: ${e.message}`);
                    }
                }
                else if (header === window.HabboPackets.Headers.Incoming.UNIT) {
                    window.lastUnitPacket = data;
                    window.HabboUI.log(`📦 Packet UNIT capturado (${data.byteLength} bytes)`);

                    const entitiesProcessed = window.HabboPackets.parseUnitPacketSafe(packet);

                    room.isLoaded = true;
                    window.HabboUI.log(`✅ Processamento UNIT completo: ${entitiesProcessed} entidades processadas`);
                    window.HabboUI.updateUserCount();
                }
                else if (header === window.HabboPackets.Headers.Incoming.UNIT_REMOVE) {
                    try {
                        const userId = packet.readInt();
                        room.removeUser(userId);
                    } catch (e) {
                        window.HabboUI.log(`❌ Erro ao processar UNIT_REMOVE: ${e.message}`);
                    }
                }
else if (header === window.HabboPackets.Headers.Incoming.ROOM_MODEL_NAME) {
                    room.clear();
                    window.HabboUI.updateUserCount();
                    window.HabboUI.log('🏠 Nova sala detectada, limpando dados...');
                }
                else if (header === window.HabboPackets.Headers.Incoming.UNIT_CHAT) {
                    try {
                        const roomIndex = packet.readInt();
                        const text = packet.readString();
                        const user = room.getUserByRoomIndex(roomIndex);
                        if (user) {
                            window.HabboUI.log(`💬 ${user.username}: ${text}`);
                        }
                    } catch (e) {
                        window.HabboUI.log(`❌ Erro ao processar chat: ${e.message}`);
                    }
                }
            } catch (error) {
                console.error('Erro ao processar packet:', error);
            }
        });

        // Solicitar informações do usuário após conectar
        setTimeout(() => {
            try {
                const packet = new window.HabboBinary.BinaryWriter(window.HabboPackets.Headers.Outgoing.USER_INFO).compose();
                ws.send(packet);
                window.HabboUI.log('📝 Solicitando informações do usuário');
            } catch (e) {
                window.HabboUI.log('❌ Erro ao solicitar info do usuário');
            }
        }, 1000);

        window.HabboUI.log('📡 Interceptação de packets ativa');
    }

    function scanForGameSocket() {
        injectionCount++;
        window.HabboUI.log(`🔍 Scan #${injectionCount}`);

        injectIntoWindow(window, 'main');

        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe, index) => {
            try {
                if (iframe.contentWindow) {
                    injectIntoWindow(iframe.contentWindow, `iframe-${index}`);
                }
            } catch (e) {
                // Silently ignore cross-origin errors
            }
        });

        if (!gameSocket && injectionCount < 15) {
            setTimeout(scanForGameSocket, 1500);
        }
    }

    function setupMonitoring() {
        // Keepalive para manter a conexão
        setInterval(() => {
            if (gameSocket && gameSocket.readyState === WebSocket.OPEN) {
                window.HabboPackets.sendPacket(window.HabboPackets.Headers.Outgoing.USER_INFO);
            }
        }, 30000);

        // Monitor de status da conexão
        setInterval(() => {
            if (gameSocket) {
                if (gameSocket.readyState === WebSocket.OPEN) {
                    window.HabboUI.updateStatus('Conectado - Ativo');
                } else if (gameSocket.readyState === WebSocket.CONNECTING) {
                    window.HabboUI.updateStatus('Conectando...');
                } else if (gameSocket.readyState === WebSocket.CLOSING) {
                    window.HabboUI.updateStatus('Desconectando...');
                } else {
                    window.HabboUI.updateStatus('Desconectado');
                    gameSocket = null;
                }
            }
        }, 2000);

        // Auto-retry para reconexão
        setInterval(() => {
            if (!gameSocket && injectionCount < 50) {
                window.HabboUI.log('🔄 Tentando reconectar...');
                scanForGameSocket();
            }
        }, 10000);
    }

    function init() {
        window.HabboUI.log('🎮 Habbo Monitor v5.0 Modular iniciado');

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => window.HabboUI.createControlPanel(), 800);
            });
        } else {
            setTimeout(() => window.HabboUI.createControlPanel(), 800);
        }

        setTimeout(scanForGameSocket, 300);
        setupMonitoring();
    }

    // Retornar API pública do módulo
    return {
        init,
        scanForGameSocket,
        setupMonitoring,
        injectIntoWindow,
        setupPacketInterception,
        // Propriedades que serão definidas durante a execução
        gameSocket: null,
        room: null,
        packetMonitor: null,
        myUserId: null,
        player: null
    };
})();
