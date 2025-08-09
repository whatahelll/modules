// ===============================================
// MÓDULO: Interface de Usuário (CORRIGIDO)
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

    function updateColoringUI() {
        if (!window.HabboColoring || !window.HabboColoring.isActive) return;
        
        try {
            const boardInfo = window.HabboColoring.gameBoard ? window.HabboColoring.gameBoard.getBoardInfo() : null;
            const progress = window.HabboColoring.gameBoard ? window.HabboColoring.gameBoard.getProgress() : { correct: 0, total: 0, percentage: 0 };
            
            const statusEl = document.getElementById('coloring-status');
            const progressEl = document.getElementById('coloring-progress');
            
            if (statusEl) {
                if (boardInfo) {
                    statusEl.textContent = `Status: ${window.HabboColoring.autoPlayEnabled ? 'Auto-jogando' : 'Ativo'} | Tiles: ${boardInfo.totalTiles}`;
                } else {
                    statusEl.textContent = 'Status: Aguardando detecção...';
                }
            }
            
            if (progressEl) {
                if (boardInfo && boardInfo.targetColor) {
                    const colorName = window.HabboColoring.colorStates[boardInfo.targetColor] || 'N/A';
                    progressEl.textContent = `Progresso: ${progress.correct}/${progress.total} (${progress.percentage}%) | Alvo: ${colorName}`;
                } else {
                    progressEl.textContent = 'Progresso: Analisando...';
                }
            }
                
        } catch (e) {
            const statusEl = document.getElementById('coloring-status');
            if (statusEl) {
                statusEl.textContent = 'Status: Erro na atualização';
            }
        }
    }

    function createControlPanel() {
        const panel = document.createElement('div');
        panel.id = 'habbo-control-panel';
        panel.style.cssText = `
            position: fixed !important;
            top: 10px !important;
            left: 10px !important;
            width: 420px !important;
            height: 600px !important;
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
                <div style="display: flex; gap: 5px;">
                    <button id="minimize-panel" style="background: #ffaa00; color: black; border: none; padding: 3px 8px; cursor: pointer; border-radius: 3px; font-weight: bold;">−</button>
                    <button onclick="this.parentElement.parentElement.parentElement.style.display='none'" style="background: #ff0000; color: white; border: none; padding: 3px 8px; cursor: pointer; border-radius: 3px; font-weight: bold;">✕</button>
                </div>
            </div>

            <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
                <div style="font-size: 11px;">Status: <span id="socketStatus">Procurando WebSocket...</span></div>
                <div style="font-size: 11px;" id="userCount">Usuários: 0</div>
            </div>

            <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
                <div style="font-size: 11px;" id="nearby-count">Próximos: 0</div>
                <div style="font-size: 11px;" id="my-position">Posição: (0, 0)</div>
            </div>

            <!-- SEÇÃO DE CONTROLES BÁSICOS -->
            <div id="basic-controls" style="margin-bottom: 10px; border: 1px solid #444; border-radius: 5px; padding: 8px;">
                <div style="margin-bottom: 5px; font-weight: bold; color: #00ff00; cursor: pointer;" onclick="toggleSection('basic-controls-content')">⚡ CONTROLES BÁSICOS</div>
                
                <div id="basic-controls-content" style="display: block;">
                    <div style="margin-bottom: 8px; display: flex; gap: 5px;">
                        <button id="toggle-packets" style="flex: 1; background: #333; color: #00ff00; border: 1px solid #00ff00; padding: 5px; cursor: pointer; border-radius: 3px; font-size: 10px;">Toggle Packets</button>
                        <button id="packet-stats" style="flex: 1; background: #333; color: #00ff00; border: 1px solid #00ff00; padding: 5px; cursor: pointer; border-radius: 3px; font-size: 10px;">Stats</button>
                        <button id="nearby-users" style="flex: 1; background: #333; color: #00ff00; border: 1px solid #00ff00; padding: 5px; cursor: pointer; border-radius: 3px; font-size: 10px;">Nearby</button>
                    </div>

                    <div style="margin-bottom: 8px;">
                        <input type="text" id="chat-input" placeholder="Digite uma mensagem..." style="width: 70%; padding: 3px; background: #222; color: #00ff00; border: 1px solid #00ff00; border-radius: 3px;">
                        <button id="send-chat" style="width: 25%; padding: 3px; margin-left: 5px; background: #333; color: #00ff00; border: 1px solid #00ff00; cursor: pointer; border-radius: 3px;">Send</button>
                    </div>

                    <div style="margin-bottom: 8px;">
                        <input type="number" id="walk-x" placeholder="X" style="width: 30%; padding: 3px; background: #222; color: #00ff00; border: 1px solid #00ff00; border-radius: 3px;">
                        <input type="number" id="walk-y" placeholder="Y" style="width: 30%; padding: 3px; margin: 0 5px; background: #222; color: #00ff00; border: 1px solid #00ff00; border-radius: 3px;">
                        <button id="walk-btn" style="width: 30%; padding: 3px; background: #333; color: #00ff00; border: 1px solid #00ff00; cursor: pointer; border-radius: 3px;">Walk</button>
                    </div>
                </div>
            </div>

            <!-- SEÇÃO JOGO DE COLORIR -->
            <div id="coloring-section" style="margin-bottom: 10px; border: 1px solid #ff6600; border-radius: 5px; padding: 8px;">
                <div style="margin-bottom: 5px; font-weight: bold; color: #ff6600; cursor: pointer;" onclick="toggleSection('coloring-content')">🎨 JOGO DE COLORIR</div>
                
                <div id="coloring-content" style="display: block;">
                    <div style="margin-bottom: 5px; font-size: 10px;" id="coloring-status">Status: Não iniciado</div>
                    <div style="margin-bottom: 8px; font-size: 10px;" id="coloring-progress">Progresso: 0/0 (0%)</div>
                    
                    <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                        <button id="start-coloring" style="flex: 1; background: #006600; color: #00ff00; border: 1px solid #00ff00; padding: 6px; cursor: pointer; font-size: 10px; border-radius: 3px;">🎮 Iniciar Jogo</button>
                        <button id="stop-coloring" style="flex: 1; background: #660000; color: #ff6666; border: 1px solid #ff6666; padding: 6px; cursor: pointer; font-size: 10px; border-radius: 3px;">⏹️ Parar</button>
                    </div>
                    
                    <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                        <button id="auto-coloring" style="flex: 1; background: #664400; color: #ffaa00; border: 1px solid #ffaa00; padding: 6px; cursor: pointer; font-size: 10px; border-radius: 3px;">🤖 Auto-Play</button>
                        <button id="debug-coloring" style="flex: 1; background: #440066; color: #aa00ff; border: 1px solid #aa00ff; padding: 6px; cursor: pointer; font-size: 10px; border-radius: 3px;">🔍 Debug</button>
                    </div>
                    
                    <div style="display: flex; gap: 5px;">
                        <button id="analyze-coloring" style="flex: 1; background: #444; color: #00ff00; border: 1px solid #00ff00; padding: 6px; cursor: pointer; font-size: 10px; border-radius: 3px;">📊 Analisar</button>
                        <button id="recalc-coloring" style="flex: 1; background: #444; color: #00ff00; border: 1px solid #00ff00; padding: 6px; cursor: pointer; font-size: 10px; border-radius: 3px;">🧠 Recalcular</button>
                    </div>
                </div>
            </div>

            <!-- SEÇÃO DE AUTOMAÇÃO -->
            <div id="automation-section" style="margin-bottom: 10px; border: 1px solid #ffff00; border-radius: 5px; padding: 8px;">
                <div style="margin-bottom: 5px; font-weight: bold; color: #ffff00; cursor: pointer;" onclick="toggleSection('automation-content')">🤖 AUTOMAÇÃO</div>
                
                <div id="automation-content" style="display: none;">
                    <div style="margin-bottom: 8px; display: flex; gap: 5px;">
                        <button id="follow-closest" style="flex: 1; padding: 6px; background: linear-gradient(45deg, #00ff00, #33ff33); color: black; border: none; cursor: pointer; font-weight: bold; border-radius: 3px; font-size: 10px;">🚶 Follow Closest</button>
                        <button id="mass-chat" style="flex: 1; padding: 6px; background: linear-gradient(45deg, #ff6600, #ff9900); color: white; border: none; cursor: pointer; font-weight: bold; border-radius: 3px; font-size: 10px;">💬 Mass Chat</button>
                    </div>

                    <div style="margin-bottom: 8px; display: flex; gap: 5px;">
                        <button id="spam-walk" style="flex: 1; background: #444; color: #00ff00; border: 1px solid #00ff00; padding: 6px; cursor: pointer; font-size: 10px; border-radius: 3px;">🚶 Spam Walk</button>
                        <button id="auto-follow" style="flex: 1; background: #444; color: #00ff00; border: 1px solid #00ff00; padding: 6px; cursor: pointer; font-size: 10px; border-radius: 3px;">🔄 Auto Follow</button>
                    </div>

                    <div style="margin-bottom: 8px;">
                        <input type="text" id="auto-username" placeholder="Nome do usuário para seguir..." style="width: 65%; padding: 3px; background: #222; color: #00ff00; border: 1px solid #00ff00; border-radius: 3px;">
                        <button id="follow-user" style="width: 30%; padding: 3px; margin-left: 5px; background: #333; color: #00ff00; border: 1px solid #00ff00; cursor: pointer; border-radius: 3px;">Follow</button>
                    </div>
                </div>
            </div>

            <!-- SEÇÃO DE DEBUG -->
            <div id="debug-section" style="margin-bottom: 10px; border: 1px solid #ff00ff; border-radius: 5px; padding: 8px;">
                <div style="margin-bottom: 5px; font-weight: bold; color: #ff00ff; cursor: pointer;" onclick="toggleSection('debug-content')">🔍 DEBUG & ANÁLISE</div>
                
                <div id="debug-content" style="display: none;">
                    <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                        <button id="list-all-users" style="flex: 1; background: #444; color: #00ff00; border: 1px solid #00ff00; padding: 6px; cursor: pointer; font-size: 10px; border-radius: 3px;">👥 List Users</button>
                        <button id="refresh-users" style="flex: 1; background: #444; color: #00ff00; border: 1px solid #00ff00; padding: 6px; cursor: pointer; font-size: 10px; border-radius: 3px;">🔄 Refresh</button>
                    </div>
                    
                    <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                        <button id="debug-packet" style="flex: 1; background: #666; color: #ffff00; border: 1px solid #ffff00; cursor: pointer; padding: 6px; border-radius: 3px; font-size: 10px;">🔍 Debug Packet</button>
                        <button id="scan-furniture" style="flex: 1; background: #666; color: #ffff00; border: 1px solid #ffff00; cursor: pointer; padding: 6px; border-radius: 3px; font-size: 10px;">🪑 Scan Furniture</button>
                    </div>

                    <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                        <button id="debug-room" style="flex: 1; background: #666; color: #ffff00; border: 1px solid #ffff00; cursor: pointer; padding: 6px; border-radius: 3px; font-size: 10px;">🏠 Debug Room</button>
                        <button id="performance-stats" style="flex: 1; background: #666; color: #ffff00; border: 1px solid #ffff00; cursor: pointer; padding: 6px; border-radius: 3px; font-size: 10px;">📈 Performance</button>
                    </div>

                    <div style="margin-bottom: 8px;">
                        <input type="text" id="hex-input" placeholder="Cole hex do packet para analisar..." style="width: 65%; padding: 3px; background: #222; color: #00ff00; border: 1px solid #00ff00; border-radius: 3px;">
                        <button id="analyze-hex" style="width: 30%; padding: 3px; margin-left: 5px; background: #333; color: #00ff00; border: 1px solid #00ff00; cursor: pointer; border-radius: 3px;">Analisar</button>
                    </div>
                </div>
            </div>

            <div id="monitor-log" style="height: 180px; overflow-y: auto; font-size: 9px; background: rgba(0, 0, 0, 0.7); padding: 4px; border: 1px solid #00ff00; border-radius: 3px;"></div>
        `;

        document.body.appendChild(panel);
        setupEventHandlers();
        setupPeriodicUpdates();
        setupKeyboardShortcuts();

        return panel;
    }

    function toggleSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = section.style.display === 'none' ? 'block' : 'none';
        }
    }

    function setupEventHandlers() {
        // === CONTROLES BÁSICOS ===
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

        // Chat e movimento
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

        // === CONTROLES DO JOGO DE COLORIR ===
        document.getElementById('start-coloring').onclick = () => {
            log('🎮 Iniciando detecção de jogo de colorir...');
            
            if (!window.HabboColoring) {
                log('❌ Sistema de colorir não disponível');
                return;
            }
            
            const started = window.HabboColoring.startGame();
            
            if (started) {
                log('✅ Sistema de detecção iniciado!');
                document.getElementById('start-coloring').style.background = '#004400';
                document.getElementById('coloring-status').textContent = 'Status: Escaneando...';
                updateColoringUI();
            } else {
                log('❌ Falha ao iniciar sistema de detecção');
                document.getElementById('coloring-status').textContent = 'Status: Erro na inicialização';
            }
        };

        document.getElementById('stop-coloring').onclick = () => {
            if (window.HabboColoring) {
                window.HabboColoring.stopGame();
            }
            document.getElementById('start-coloring').style.background = '#006600';
            document.getElementById('auto-coloring').style.background = '#664400';
            document.getElementById('auto-coloring').textContent = '🤖 Auto-Play';
            document.getElementById('coloring-status').textContent = 'Status: Parado';
            document.getElementById('coloring-progress').textContent = 'Progresso: 0/0 (0%)';
            log('⏹️ Sistema de detecção parado');
        };

        document.getElementById('auto-coloring').onclick = () => {
            if (!window.HabboColoring || !window.HabboColoring.isActive) {
                log('❌ Inicie o sistema primeiro');
                return;
            }
            
            window.HabboColoring.toggleAutoPlay();
            const isAuto = window.HabboColoring.autoPlayEnabled;
            
            document.getElementById('auto-coloring').style.background = isAuto ? '#443300' : '#664400';
            document.getElementById('auto-coloring').textContent = isAuto ? '⏸️ Parar Auto' : '🤖 Auto-Play';
            
            if (isAuto) {
                log('🤖 Auto-play ativado');
            } else {
                log('⏸️ Auto-play desativado');
            }
        };

        document.getElementById('debug-coloring').onclick = () => {
            if (!window.HabboColoring || !window.HabboColoring.isActive) {
                log('❌ Inicie o sistema primeiro para fazer debug');
                return;
            }
            
            log('🔍 === DEBUG DO SISTEMA DE COLORIR ===');
            
            if (!window.HabboColoring.gameBoard) {
                log('❌ GameBoard não disponível');
                return;
            }
            
            const boardInfo = window.HabboColoring.gameBoard.getBoardInfo();
            
            log(`📊 Informações do sistema:`);
            log(`   Sistema inicializado: ${boardInfo.initialized ? 'Sim' : 'Não'}`);
            log(`   Total de tiles detectados: ${boardInfo.totalTiles}`);
            log(`   Total de móveis próximos: ${boardInfo.totalFurniture}`);
            log(`   Sprites detectados: ${boardInfo.detectedSprites.length}`);
            log(`   Sprites de colorir: [${boardInfo.coloringSprites.join(', ')}]`);
            
            if (boardInfo.area && boardInfo.totalTiles > 0) {
                log(`   Área: X(${boardInfo.area.minX} a ${boardInfo.area.maxX}), Y(${boardInfo.area.minY} a ${boardInfo.area.maxY})`);
            }
            
            if (boardInfo.playerStart) {
                log(`   Posição do jogador: (${boardInfo.playerStart.x}, ${boardInfo.playerStart.y})`);
            }
            
            if (boardInfo.targetColor && window.HabboColoring.colorStates) {
                log(`   Cor alvo sugerida: ${window.HabboColoring.colorStates[boardInfo.targetColor]}`);
            }
            
            log(`🧩 Tiles detectados:`);
            const gameTiles = window.HabboColoring.gameTiles;
            let count = 0;
            for (const [key, tile] of gameTiles.entries()) {
                if (count >= 10) {
                    log(`   ... e mais ${gameTiles.size - 10} tiles`);
                    break;
                }
                const colorName = window.HabboColoring.colorStates ? 
                    (window.HabboColoring.colorStates[tile.state] || `Estado ${tile.state}`) : 
                    `Estado ${tile.state}`;
                log(`   (${tile.x}, ${tile.y}): ${colorName} [Sprite: ${tile.spriteId}, ID: ${tile.itemId}]`);
                count++;
            }
            
            if (gameTiles.size === 0) {
                log('   Nenhum tile de colorir detectado ainda');
            }
        };

        document.getElementById('analyze-coloring').onclick = () => {
            if (!window.HabboColoring || !window.HabboColoring.isActive) {
                log('❌ Inicie o sistema primeiro');
                return;
            }
            
            const status = window.HabboColoring.getGameStatus();
            updateColoringUI();
        };

        document.getElementById('recalc-coloring').onclick = () => {
            if (!window.HabboColoring || !window.HabboColoring.isActive) {
                log('❌ Inicie o sistema primeiro');
                return;
            }
            
            log('🧠 Recalculando estratégia...');
            if (window.HabboColoring.gameBoard && window.HabboColoring.gameBoard.analyzeBoard) {
                window.HabboColoring.gameBoard.analyzeBoard();
                log('✅ Estratégia recalculada');
                updateColoringUI();
            }
        };

        // === CONTROLES DE AUTOMAÇÃO ===
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

        document.getElementById('follow-user').onclick = () => {
            const username = document.getElementById('auto-username').value.trim();
            if (username) {
                window.HabboAPI.teleportToUser(username);
                document.getElementById('auto-username').value = '';
            } else {
                log('❌ Digite um nome de usuário válido');
            }
        };

        // === CONTROLES DE DEBUG ===
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

       document.getElementById('scan-furniture').onclick = () => {
           log('🪑 Iniciando escaneamento manual de móveis...');
           
           if (!window.HabboCore || !window.HabboCore.room) {
               log('❌ Sala não carregada');
               return;
           }
           
           const myPos = window.HabboCore.room.myUser ? 
               { x: window.HabboCore.room.myUser.x, y: window.HabboCore.room.myUser.y } : 
               { x: 0, y: 0 };
           
           log(`📍 Posição do jogador: (${myPos.x}, ${myPos.y})`);
           log('📡 Este escaneamento depende da interceptação de packets de móveis');
           log('💡 Para detectar móveis reais, use o sistema de colorir ou monitore os packets');
       };

       document.getElementById('debug-room').onclick = () => {
           window.HabboAPI.debugRoom();
       };

       document.getElementById('performance-stats').onclick = () => {
           window.HabboAPI.getPerformanceStats();
       };

       document.getElementById('analyze-hex').onclick = () => {
           const hexString = document.getElementById('hex-input').value.trim();
           if (hexString) {
               window.HabboAPI.analyzeHexPacket(hexString);
               document.getElementById('hex-input').value = '';
           } else {
               log('❌ Cole um hex válido para analisar');
           }
       };

       // Minimizar painel
       document.getElementById('minimize-panel').onclick = () => {
           const panel = document.getElementById('habbo-control-panel');
           const isMinimized = panel.style.height === '60px';
           
           if (isMinimized) {
               panel.style.height = '600px';
               panel.style.overflow = 'auto';
               document.getElementById('minimize-panel').textContent = '−';
               // Mostrar todas as seções
               document.querySelectorAll('#habbo-control-panel > div:not(:first-child)').forEach(div => {
                   div.style.display = 'block';
               });
           } else {
               panel.style.height = '60px';
               panel.style.overflow = 'hidden';
               document.getElementById('minimize-panel').textContent = '+';
               // Esconder todas as seções exceto header
               document.querySelectorAll('#habbo-control-panel > div:not(:first-child)').forEach(div => {
                   div.style.display = 'none';
               });
           }
       };

       // Event listeners para Enter
       document.getElementById('chat-input').addEventListener('keypress', (e) => {
           if (e.key === 'Enter') {
               document.getElementById('send-chat').click();
           }
       });

       document.getElementById('auto-username').addEventListener('keypress', (e) => {
           if (e.key === 'Enter') {
               document.getElementById('follow-user').click();
           }
       });

       document.getElementById('hex-input').addEventListener('keypress', (e) => {
           if (e.key === 'Enter') {
               document.getElementById('analyze-hex').click();
           }
       });

       // Event listeners para coordenadas
       document.getElementById('walk-x').addEventListener('keypress', (e) => {
           if (e.key === 'Enter') {
               document.getElementById('walk-btn').click();
           }
       });

       document.getElementById('walk-y').addEventListener('keypress', (e) => {
           if (e.key === 'Enter') {
               document.getElementById('walk-btn').click();
           }
       });

       // Drag and drop para o painel
       let isDragging = false;
       let currentX;
       let currentY;
       let initialX;
       let initialY;
       let xOffset = 0;
       let yOffset = 0;

       const dragElement = document.querySelector('#habbo-control-panel div:first-child');
       
       dragElement.addEventListener('mousedown', dragStart);
       document.addEventListener('mousemove', drag);
       document.addEventListener('mouseup', dragEnd);

       function dragStart(e) {
           if (e.target.tagName === 'BUTTON') return;
           
           initialX = e.clientX - xOffset;
           initialY = e.clientY - yOffset;

           if (e.target === dragElement) {
               isDragging = true;
               dragElement.style.cursor = 'grabbing';
           }
       }

       function drag(e) {
           if (isDragging) {
               e.preventDefault();
               currentX = e.clientX - initialX;
               currentY = e.clientY - initialY;

               xOffset = currentX;
               yOffset = currentY;

               const panel = document.getElementById('habbo-control-panel');
               panel.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
           }
       }

       function dragEnd(e) {
           initialX = currentX;
           initialY = currentY;
           isDragging = false;
           dragElement.style.cursor = 'grab';
       }

       dragElement.style.cursor = 'grab';
       dragElement.style.userSelect = 'none';
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
           
           // Atualizar UI do jogo de colorir
           if (window.HabboColoring && window.HabboColoring.isActive) {
               updateColoringUI();
           }
       }, 2000);

       // Update mais frequente para status do socket
       setInterval(() => {
           if (window.HabboCore && window.HabboCore.gameSocket) {
               const socket = window.HabboCore.gameSocket;
               let status = 'Desconhecido';
               
               switch (socket.readyState) {
                   case WebSocket.CONNECTING:
                       status = 'Conectando...';
                       break;
                   case WebSocket.OPEN:
                       status = 'Conectado - Ativo';
                       break;
                   case WebSocket.CLOSING:
                       status = 'Desconectando...';
                       break;
                   case WebSocket.CLOSED:
                       status = 'Desconectado';
                       break;
               }
               
               updateStatus(status);
           }
       }, 1000);
   }

   function setupKeyboardShortcuts() {
       document.addEventListener('keydown', (e) => {
           if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
           
           if (e.ctrlKey && e.shiftKey) {
               switch (e.code) {
                   case 'KeyQ':
                       e.preventDefault();
                       const nearby = window.HabboAPI.getUsersNearMe(5);
                       if (nearby.length > 0) {
                           const closest = nearby[0];
                           window.HabboAPI.walkToPosition(closest.user.x, closest.user.y);
                           log(`🚀 Atalho: Teleportando para ${closest.user.username}`);
                       } else {
                           log('❌ Atalho: Nenhum usuário próximo');
                       }
                       break;
                       
                   case 'KeyW':
                       e.preventDefault();
                       window.HabboAPI.spamWalk(5, 200);
                       log('🚶 Atalho: Spam walk ativado');
                       break;
                       
                   case 'KeyE':
                       e.preventDefault();
                       document.getElementById('toggle-packets').click();
                       log('📡 Atalho: Toggle packets');
                       break;
                       
                   case 'KeyR':
                       e.preventDefault();
                       window.HabboAPI.massChat('Test message', 3, 300);
                       log('💬 Atalho: Mass chat enviado');
                       break;
                       
                   case 'KeyT':
                       e.preventDefault();
                       document.getElementById('nearby-users').click();
                       log('👥 Atalho: Mostrando usuários próximos');
                       break;
                       
                   case 'KeyL':
                       e.preventDefault();
                       document.getElementById('list-all-users').click();
                       log('📋 Atalho: Listando todos os usuários');
                       break;
                       
                   case 'KeyC':
                       e.preventDefault();
                       document.getElementById('start-coloring').click();
                       log('🎨 Atalho: Iniciando sistema de colorir');
                       break;
                       
                   case 'KeyA':
                       e.preventDefault();
                       document.getElementById('auto-coloring').click();
                       log('🤖 Atalho: Toggle auto-play colorir');
                       break;
                       
                   case 'KeyD':
                       e.preventDefault();
                       document.getElementById('debug-coloring').click();
                       log('🔍 Atalho: Debug sistema de colorir');
                       break;
                       
                   case 'KeyH':
                       e.preventDefault();
                       const panel = document.getElementById('habbo-control-panel');
                       panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                       log('👁️ Atalho: Toggle painel de controle');
                       break;
                       
                   case 'KeyM':
                       e.preventDefault();
                       document.getElementById('minimize-panel').click();
                       log('📦 Atalho: Minimizar painel');
                       break;
               }
           }
       });

       log('⌨️ Atalhos configurados:');
       log('   CTRL+SHIFT+Q: Teleport para mais próximo');
       log('   CTRL+SHIFT+W: Spam walk');
       log('   CTRL+SHIFT+E: Toggle packets');
       log('   CTRL+SHIFT+R: Mass chat');
       log('   CTRL+SHIFT+T: Mostrar usuários próximos');
       log('   CTRL+SHIFT+L: Listar todos usuários');
       log('   CTRL+SHIFT+C: Iniciar sistema de colorir');
       log('   CTRL+SHIFT+A: Toggle auto-play colorir');
       log('   CTRL+SHIFT+D: Debug sistema de colorir');
       log('   CTRL+SHIFT+H: Toggle painel');
       log('   CTRL+SHIFT+M: Minimizar painel');
   }

   return {
       log,
       updateStatus,
       updateUserCount,
       refreshNearbyUsers,
       updateColoringUI,
       createControlPanel,
       setupEventHandlers,
       setupPeriodicUpdates,
       setupKeyboardShortcuts,
       toggleSection
   };
})();
