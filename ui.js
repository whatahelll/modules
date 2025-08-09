// ===============================================
// MÓDULO: Interface de Usuário
// ===============================================

window.HabboUI = (function() {
    'use strict';

    function log(message) {
        const logEl = document.getElementById('monitor-log');
        if (logEl) {
            const time = new Date().toLocaleTimeString().split(':').slice(1).join(':');
            logEl.innerHTML += `<div style="color: #00ff00; font-size: 10px;">[${time}] ${message}</div>`;
            logEl.scrollTop = logEl.scrollHeight;

            if (logEl.children.length > 100) {
                logEl.removeChild(logEl.firstChild);
            }
        }
        console.log(`[Habbo Monitor] ${message}`);
    }

    function updateStatus(status) {
        const statusEl = document.getElementById('socketStatus');
        if (statusEl) {
            statusEl.textContent = status;
            statusEl.style.color = status.includes('Conectado') ? '#00ff00' : '#ff6600';
        }
    }

    function updateUserCount() {
        const countEl = document.getElementById('userCount');
        if (countEl && window.HabboCore && window.HabboCore.room) {
            countEl.textContent = `Usuários: ${window.HabboCore.room.getUserCount()}`;
        }
    }

    function refreshNearbyUsers() {
        const nearbyUsersEl = document.getElementById('nearby-count');
        if (nearbyUsersEl && window.HabboCore && window.HabboCore.room && window.HabboCore.room.myUser) {
            const nearby = window.HabboCore.room.getUsersInRange(window.HabboCore.room.myUser.x, window.HabboCore.room.myUser.y, 3);
            nearbyUsersEl.textContent = `Próximos: ${nearby.length}`;
        }
    }

    function createControlPanel() {
        const panel = document.createElement('div');
        panel.id = 'habbo-control-panel';
        panel.style.cssText = `
            position: fixed !important;
            top: 10px !important;
            left: 10px !important;
            width: 400px !important;
            height: 500px !important;
            background: linear-gradient(45deg, #000000, #333333) !important;
            border: 2px solid #00ff00 !important;
            border-radius: 12px !important;
            z-index: 999999 !important;
            color: #00ff00 !important;
            font-family: 'Courier New', monospace !important;
            font-size: 12px !important;
            padding: 15px !important;
            box-shadow: 0 0 30px rgba(0, 255, 0, 0.7) !important;
            overflow-y: auto !important;
        `;

        panel.innerHTML = `
            <div style="margin-bottom: 10px; border-bottom: 2px solid #00ff00; padding-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">
                <strong>🎮 HABBO MONITOR v5.0 MODULAR</strong>
                <button onclick="this.parentElement.parentElement.style.display='none'" style="background: #ff0000; color: white; border: none; padding: 3px 8px; cursor: pointer; border-radius: 3px;">✕</button>
            </div>

            <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
                <div style="font-size: 11px;">Status: <span id="socketStatus">Procurando WebSocket...</span></div>
                <div style="font-size: 11px;" id="userCount">Usuários: 0</div>
            </div>

            <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
                <div style="font-size: 11px;" id="nearby-count">Próximos: 0</div>
                <div style="font-size: 11px;" id="my-position">Posição: (0, 0)</div>
            </div>

            <div style="margin-bottom: 10px; display: flex; gap: 5px;">
                <button id="toggle-packets" style="flex: 1; background: #333; color: #00ff00; border: 1px solid #00ff00; padding: 5px; cursor: pointer; border-radius: 3px; font-size: 10px;">Toggle Packets</button>
                <button id="packet-stats" style="flex: 1; background: #333; color: #00ff00; border: 1px solid #00ff00; padding: 5px; cursor: pointer; border-radius: 3px; font-size: 10px;">Stats</button>
                <button id="nearby-users" style="flex: 1; background: #333; color: #00ff00; border: 1px solid #00ff00; padding: 5px; cursor: pointer; border-radius: 3px; font-size: 10px;">Nearby</button>
            </div>

            <div style="margin-bottom: 8px;">
                <input type="text" id="chat-input" placeholder="Digite uma mensagem..." style="width: 70%; padding: 3px; background: #222; color: #00ff00; border: 1px solid #00ff00; border-radius: 3px;">
                <button id="send-chat" style="width: 25%; padding: 3px; margin-left: 5px; background: #333; color: #00ff00; border: 1px solid #00ff00; cursor: pointer; border-radius: 3px;">Send</button>
            </div>

            <div style="margin-bottom: 10px;">
                <input type="number" id="walk-x" placeholder="X" style="width: 30%; padding: 3px; background: #222; color: #00ff00; border: 1px solid #00ff00; border-radius: 3px;">
                <input type="number" id="walk-y" placeholder="Y" style="width: 30%; padding: 3px; margin: 0 5px; background: #222; color: #00ff00; border: 1px solid #00ff00; border-radius: 3px;">
                <button id="walk-btn" style="width: 30%; padding: 3px; background: #333; color: #00ff00; border: 1px solid #00ff00; cursor: pointer; border-radius: 3px;">Walk</button>
            </div>

            <div style="margin-bottom: 10px; display: flex; gap: 5px;">
                <button id="follow-closest" style="flex: 1; padding: 8px; background: linear-gradient(45deg, #00ff00, #33ff33); color: black; border: none; cursor: pointer; font-weight: bold; border-radius: 5px; font-size: 10px;">🚶 Follow Closest</button>
                <button id="mass-chat" style="flex: 1; padding: 8px; background: linear-gradient(45deg, #ff6600, #ff9900); color: white; border: none; cursor: pointer; font-weight: bold; border-radius: 5px; font-size: 10px;">💬 Mass Chat</button>
            </div>

            <div style="margin-bottom: 10px; display: flex; gap: 5px;">
                <button id="spam-walk" style="flex: 1; background: #444; color: #00ff00; border: 1px solid #00ff00; padding: 6px; cursor: pointer; font-size: 10px; border-radius: 3px;">🚶 Spam Walk</button>
                <button id="auto-follow" style="flex: 1; background: #444; color: #00ff00; border: 1px solid #00ff00; padding: 6px; cursor: pointer; font-size: 10px; border-radius: 3px;">🔄 Auto Follow</button>
            </div>

            <div style="margin-bottom: 10px; display: flex; gap: 5px;">
                <button id="list-all-users" style="flex: 1; background: #444; color: #00ff00; border: 1px solid #00ff00; padding: 6px; cursor: pointer; font-size: 10px; border-radius: 3px;">👥 List All</button>
                <button id="refresh-users" style="flex: 1; background: #444; color: #00ff00; border: 1px solid #00ff00; padding: 6px; cursor: pointer; font-size: 10px; border-radius: 3px;">🔄 Refresh</button>
            </div>

            <div style="margin-bottom: 10px;">
                <button id="debug-packet" style="width: 100%; padding: 8px; background: #666; color: #ffff00; border: 1px solid #ffff00; cursor: pointer; border-radius: 5px;">🔍 Debug Packet Raw</button>
            </div>

            <div id="monitor-log" style="height: 200px; overflow-y: auto; font-size: 9px; background: rgba(0, 0, 0, 0.7); padding: 4px; border: 1px solid #00ff00; border-radius: 3px;"></div>
        `;

        document.body.appendChild(panel);
        setupEventHandlers();
        setupPeriodicUpdates();
        setupKeyboardShortcuts();

        return panel;
    }

    function setupEventHandlers() {
        document.getElementById('toggle-packets').onclick = () => {
            if (window.HabboCore && window.HabboCore.packetMonitor) {
                if (window.HabboCore.packetMonitor.logEnabled) {
                    window.HabboCore.packetMonitor.disableLogging();
                } else {
                    window.HabboCore.packetMonitor.enableLogging();
                }
            }
        };

        document.getElementById('packet-stats').onclick = () => {
            if (window.HabboCore && window.HabboCore.packetMonitor) {
                window.HabboCore.packetMonitor.getStats();
            }
        };

        document.getElementById('nearby-users').onclick = () => {
            const nearby = window.HabboAPI.getUsersNearMe(5);
            log(`🔍 Buscando usuários próximos...`);
            if (nearby.length === 0) {
                log('❌ Nenhum usuário próximo encontrado');
            } else {
                log(`✅ ${nearby.length} usuários próximos:`);
                nearby.forEach(item => {
                    log(`  👤 ${item.user.username} - (${item.user.x}, ${item.user.y}) - Dist: ${item.distance}`);
                });
            }
        };

        document.getElementById('send-chat').onclick = () => {
            const message = document.getElementById('chat-input').value.trim();
            if (message) {
                window.HabboAPI.sendMessage(message);
                document.getElementById('chat-input').value = '';
            } else {
                log('❌ Digite uma mensagem válida');
            }
        };

        document.getElementById('walk-btn').onclick = () => {
            const x = parseInt(document.getElementById('walk-x').value);
            const y = parseInt(document.getElementById('walk-y').value);
            if (!isNaN(x) && !isNaN(y)) {
                window.HabboAPI.walkToPosition(x, y);
            } else {
                log('❌ Digite coordenadas válidas');
            }
        };

        document.getElementById('follow-closest').onclick = () => {
            const nearby = window.HabboAPI.getUsersNearMe(10);
            if (nearby.length > 0) {
                const closest = nearby[0];
                window.HabboAPI.walkToPosition(closest.user.x, closest.user.y);
                log(`🚶 Seguindo ${closest.user.username} em (${closest.user.x}, ${closest.user.y})`);
            } else {
                log('❌ Nenhum usuário próximo encontrado para seguir');
            }
        };

        document.getElementById('mass-chat').onclick = () => {
            window.HabboAPI.massChat('Hello World!', 3, 500);
        };

        document.getElementById('spam-walk').onclick = () => {
            window.HabboAPI.spamWalk(10, 200);
        };

        let autoFollowInterval = null;
        document.getElementById('auto-follow').onclick = () => {
            if (autoFollowInterval) {
                clearInterval(autoFollowInterval);
                autoFollowInterval = null;
                log('⏹️ Auto-follow parado');
                document.getElementById('auto-follow').textContent = '🔄 Auto Follow';
            } else {
                const nearby = window.HabboAPI.getUsersNearMe(10);
                if (nearby.length > 0) {
                    const target = nearby[0].user;
                    autoFollowInterval = setInterval(() => {
                        if (window.HabboCore && window.HabboCore.room && window.HabboCore.room.myUser && target) {
                            const distance = Math.abs(target.x - window.HabboCore.room.myUser.x) + Math.abs(target.y - window.HabboCore.room.myUser.y);
                            if (distance > 1) {
                                window.HabboAPI.walkToPosition(target.x, target.y);
                            }
                        }
                    }, 1000);
                    log(`🔄 Auto-seguindo ${target.username}`);
                    document.getElementById('auto-follow').textContent = '⏹️ Stop Follow';
                } else {
                    log('❌ Nenhum usuário para seguir');
                }
            }
        };

        document.getElementById('list-all-users').onclick = () => {
            const allUsers = window.HabboAPI.getAllUsers();
            if (allUsers.length > 0) {
                log(`👥 Lista de todas as entidades (${allUsers.length}):`);
                allUsers.forEach(user => {
                    const isMine = user.id === (window.HabboCore ? window.HabboCore.myUserId : null) ? ' (EU)' : '';
                    const walking = user.walking ? ' [ANDANDO]' : '';
                    const typeStr = user.userType === 1 ? '👤' : user.userType === 2 ? '🐾' : user.userType === 3 ? '🤖' : '❓';
                    log(`  ${typeStr} ${user.id}: ${user.username}${isMine} - (${user.x}, ${user.y})${walking}`);
                });
            } else {
                log('❌ Nenhuma entidade carregada na sala');
            }
        };

        document.getElementById('refresh-users').onclick = () => {
            window.HabboPackets.sendPacket(window.HabboPackets.Headers.Outgoing.USER_INFO);
            log('🔄 Atualizando dados do usuário...');
        };

        document.getElementById('debug-packet').onclick = () => {
            window.HabboAPI.debugCurrentPacket();
        };

        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('send-chat').click();
            }
        });
    }

    function setupPeriodicUpdates() {
        setInterval(() => {
            if (window.HabboCore && window.HabboCore.room && window.HabboCore.room.myUser) {
                const myPosEl = document.getElementById('my-position');
                if (myPosEl) {
                    myPosEl.textContent = `Posição: (${window.HabboCore.room.myUser.x}, ${window.HabboCore.room.myUser.y})`;
                }
                refreshNearbyUsers();
            }
        }, 1000);
    }

    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey) {
                switch (e.code) {
                    case 'KeyQ':
                        const nearby = window.HabboAPI.getUsersNearMe(5);
                        if (nearby.length > 0) {
                            const closest = nearby[0];
                            window.HabboAPI.walkToPosition(closest.user.x, closest.user.y);
                            log(`🚀 Teleportando para ${closest.user.username}`);
                        }
                        break;
                    case 'KeyW':
                        window.HabboAPI.spamWalk(5, 200);
                        break;
                    case 'KeyE':
                        document.getElementById('toggle-packets').click();
                        break;
                    case 'KeyR':
                        window.HabboAPI.massChat('Test message', 3, 300);
                        break;
                    case 'KeyT':
                        document.getElementById('nearby-users').click();
                        break;
                    case 'KeyL':
                        document.getElementById('list-all-users').click();
                        break;
                }
            }
        });

        log('⌨️ Atalhos: CTRL+SHIFT+Q(Teleport), W(SpamWalk), E(Packets), R(MassChat), T(ShowUsers), L(ListAll)');
    }

    return {
        log,
        updateStatus,
        updateUserCount,
        refreshNearbyUsers,
        createControlPanel,
        setupEventHandlers,
        setupPeriodicUpdates,
        setupKeyboardShortcuts
    };
})();
