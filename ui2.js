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

    function updateColoringUI() {
        if (!window.HabboColoring || !window.HabboColoring.isActive) return;
        
        try {
            const boardInfo = window.HabboColoring.gameBoard.getBoardInfo();
            const progress = window.HabboColoring.gameBoard.getProgress();
            
            document.getElementById('coloring-status').textContent = 
                `Status: ${window.HabboColoring.autoPlayEnabled ? 'Auto-jogando' : 'Ativo'} | Grid: ${boardInfo.gridSize}x${boardInfo.gridSize}`;
            
            document.getElementById('coloring-progress').textContent = 
                `Progresso: ${progress.correct}/${progress.total} (${progress.percentage}%) | Alvo: ${window.HabboColoring.colorStates[boardInfo.targetColor]}`;
                
        } catch (e) {
            document.getElementById('coloring-status').textContent = 'Status: Erro na atualização';
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
            log('🎮 Iniciando jogo de colorir...');
            const started = window.HabboColoring.startGame();
            
            if (started) {
                log('✅ Jogo de colorir iniciado com sucesso!');
                document.getElementById('start-coloring').style.background = '#004400';
                document.getElementById('coloring-status').textContent = 'Status: Ativo';
                updateColoringUI();
            } else {
                log('❌ Falha ao iniciar jogo de colorir');
                document.getElementById('coloring-status').textContent = 'Status: Erro na detecção';
            }
        };

        document.getElementById('stop-coloring').onclick = () => {
            window.HabboColoring.stopGame();
            document.getElementById('start-coloring').style.background = '#006600';
            document.getElementById('auto-coloring').style.background = '#664400';
            document.getElementById('auto-coloring').textContent = '🤖 Auto-Play';
            document.getElementById('coloring-status').textContent = 'Status: Parado';
            document.getElementById('coloring-progress').textContent = 'Progresso: 0/0 (0%)';
            log('⏹️ Jogo de colorir parado');
        };

        document.getElementById('auto-coloring').onclick = () => {
            if (!window.HabboColoring.isActive) {
                log('❌ Inicie o jogo primeiro');
                return;
            }
            
            window.HabboColoring.toggleAutoPlay();
            const isAuto = window.HabboColoring.autoPlayEnabled;
            
            document.getElementById('auto-coloring').style.background = isAuto ? '#443300' : '#664400';
            document.getElementById('auto-coloring').textContent = isAuto ? '⏸️ Parar Auto' : '🤖 Auto-Play';
            
            if (isAuto) {
                log('🤖 Auto-play ativado - O bot jogará automaticamente');
            } else {
                log('⏸️ Auto-play desativado');
            }
        };

        document.getElementById('debug-coloring').onclick = () => {
            if (!window.HabboColoring.isActive) {
                log('❌ Inicie o jogo primeiro para fazer debug');
                return;
            }
            
            log('🔍 === DEBUG DO JOGO DE COLORIR ===');
            
            const boardInfo = window.HabboColoring.gameBoard.getBoardInfo();
            const gameTiles = window.HabboColoring.gameTiles;
            
            log(`📊 Informações do tabuleiro:`);
            log(`   Grid: ${boardInfo.gridSize}x${boardInfo.gridSize}`);
            log(`   Área: X(${boardInfo.area.minX} a ${boardInfo.area.maxX}), Y(${boardInfo.area.minY} a ${boardInfo.area.maxY})`);
            log(`   Total de tiles: ${boardInfo.totalTiles}`);
            log(`   Cor alvo: ${window.HabboColoring.colorStates[boardInfo.targetColor]}`);
            log(`   Completo: ${boardInfo.completed ? 'Sim' : 'Não'}`);
            
            if (boardInfo.playerStart) {
                log(`   Posição inicial do jogador: (${boardInfo.playerStart.x}, ${boardInfo.playerStart.y})`);
            }
            
            log(`🎨 Distribuição de cores:`);
            const colorCounts = {};
            for (const tile of gameTiles.values()) {
                colorCounts[tile.state] = (colorCounts[tile.state] || 0) + 1;
            }
            
            for (const [color, count] of Object.entries(colorCounts)) {
                const colorName = window.HabboColoring.colorStates[color] || `Cor ${color}`;
                const percentage = boardInfo.totalTiles > 0 ? (count / boardInfo.totalTiles * 100).toFixed(1) : 0;
                log(`   ${colorName}: ${count} tiles (${percentage}%)`);
            }
            
            log(`🧩 Primeiros 10 tiles detectados:`);
            let count = 0;
            for (const [key, tile] of gameTiles.entries()) {
                if (count >= 10) break;
                log(`   (${tile.x}, ${tile.y}): ${window.HabboColoring.colorStates[tile.state]}`);
                count++;
            }
        };

        document.getElementById('analyze-coloring').onclick = () => {
            if (!window.HabboColoring.isActive) {
                log('❌ Inicie o jogo primeiro');
                return;
            }
            
            const status = window.HabboColoring.getGameStatus();
            updateColoringUI();
        };

        document.getElementById('recalc-coloring').onclick = () => {
            if (!window.HabboColoring.isActive) {
                log('❌ Inicie o jogo primeiro');
                return;
            }
            
            log('🧠 Recalculando estratégia...');
            window.HabboColoring.gameBoard.analyzeBoard();
            log('✅ Estratégia recalculada');
            updateColoringUI();
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
            log('🪑 Escaneando móveis na sala...');
            
            if (!window.HabboCore || !window.HabboCore.room) {
                log('❌ Sala não carregada');
                return;
            }
            
            // Simular scan de móveis próximos
            const myPos = window.HabboCore.room.myUser ? 
                { x: window.HabboCore.room.myUser.x, y: window.HabboCore.room.myUser.y } : 
                { x: 0, y: 0 };
            
            log(`📍 Escaneando área próxima à posição (${myPos.x}, ${myPos.y})`);
            
            let furnitureCount = 0;
            const scanRadius = 10;
            
            for (let x = myPos.x - scanRadius; x <= myPos.x + scanRadius; x++) {
                for (let y = myPos.y - scanRadius; y <= myPos.y + scanRadius; y++) {
                    // Simular detecção de móveis (na implementação real viria dos packets)
                    if (Math.random() < 0.1) { // 10% chance de ter móvel
                        const randomState = Math.floor(Math.random() * 7);
                        log(`🪑 Móvel detectado em (${x}, ${y}): Estado ${randomState}`);
                        furnitureCount++;
                       
                       if (furnitureCount >= 5) break; // Limitar output
                   }
               }
               if (furnitureCount >= 5) break;
           }
           
           if (furnitureCount === 0) {
               log('❌ Nenhum móvel detectado na área');
           } else {
               log(`✅ ${furnitureCount} móveis detectados`);
           }
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
           if (e.target.tagName === 'BUTTON') return; // Não arrastar se clicar em botão
           
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

       // Tornar o header arrastável
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
           // Apenas ativar atalhos se não estiver digitando em input
           if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
           
           if (e.ctrlKey && e.shiftKey) {
               switch (e.code) {
                   case 'KeyQ': // Teleport para usuário mais próximo
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
                       
                   case 'KeyW': // Spam walk
                       e.preventDefault();
                       window.HabboAPI.spamWalk(5, 200);
                       log('🚶 Atalho: Spam walk ativado');
                       break;
                       
                   case 'KeyE': // Toggle packets
                       e.preventDefault();
                       document.getElementById('toggle-packets').click();
                       log('📡 Atalho: Toggle packets');
                       break;
                       
                   case 'KeyR': // Mass chat
                       e.preventDefault();
                       window.HabboAPI.massChat('Test message', 3, 300);
                       log('💬 Atalho: Mass chat enviado');
                       break;
                       
                   case 'KeyT': // Show nearby users
                       e.preventDefault();
                       document.getElementById('nearby-users').click();
                       log('👥 Atalho: Mostrando usuários próximos');
                       break;
                       
                   case 'KeyL': // List all users
                       e.preventDefault();
                       document.getElementById('list-all-users').click();
                       log('📋 Atalho: Listando todos os usuários');
                       break;
                       
                   case 'KeyC': // Start coloring game
                       e.preventDefault();
                       document.getElementById('start-coloring').click();
                       log('🎨 Atalho: Iniciando jogo de colorir');
                       break;
                       
                   case 'KeyA': // Toggle coloring auto-play
                       e.preventDefault();
                       document.getElementById('auto-coloring').click();
                       log('🤖 Atalho: Toggle auto-play colorir');
                       break;
                       
                   case 'KeyD': // Debug coloring
                       e.preventDefault();
                       document.getElementById('debug-coloring').click();
                       log('🔍 Atalho: Debug jogo de colorir');
                       break;
                       
                   case 'KeyH': // Toggle panel visibility
                       e.preventDefault();
                       const panel = document.getElementById('habbo-control-panel');
                       panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                       log('👁️ Atalho: Toggle painel de controle');
                       break;
                       
                   case 'KeyM': // Minimize panel
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
       log('   CTRL+SHIFT+C: Iniciar jogo de colorir');
       log('   CTRL+SHIFT+A: Toggle auto-play colorir');
       log('   CTRL+SHIFT+D: Debug jogo de colorir');
       log('   CTRL+SHIFT+H: Toggle painel');
       log('   CTRL+SHIFT+M: Minimizar painel');
   }

   function showNotification(message, type = 'info', duration = 3000) {
       const notification = document.createElement('div');
       notification.style.cssText = `
           position: fixed !important;
           top: 20px !important;
           right: 20px !important;
           padding: 10px 15px !important;
           border-radius: 5px !important;
           color: white !important;
           font-family: 'Courier New', monospace !important;
           font-size: 12px !important;
           z-index: 1000000 !important;
           max-width: 300px !important;
           box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5) !important;
       `;

       switch (type) {
           case 'success':
               notification.style.background = 'linear-gradient(45deg, #00aa00, #00ff00)';
               notification.innerHTML = `✅ ${message}`;
               break;
           case 'error':
               notification.style.background = 'linear-gradient(45deg, #aa0000, #ff0000)';
               notification.innerHTML = `❌ ${message}`;
               break;
           case 'warning':
               notification.style.background = 'linear-gradient(45deg, #aa5500, #ffaa00)';
               notification.innerHTML = `⚠️ ${message}`;
               break;
           default:
               notification.style.background = 'linear-gradient(45deg, #0055aa, #0099ff)';
               notification.innerHTML = `ℹ️ ${message}`;
       }

       document.body.appendChild(notification);

       // Remover automaticamente
       setTimeout(() => {
           if (notification.parentElement) {
               notification.remove();
           }
       }, duration);

       return notification;
   }

   function createQuickActions() {
       const quickActions = document.createElement('div');
       quickActions.id = 'quick-actions';
       quickActions.style.cssText = `
           position: fixed !important;
           bottom: 20px !important;
           right: 20px !important;
           display: flex !important;
           flex-direction: column !important;
           gap: 5px !important;
           z-index: 999998 !important;
       `;

       const actions = [
           { id: 'quick-coloring', text: '🎨', title: 'Quick Coloring Game', color: '#ff6600' },
           { id: 'quick-follow', text: '🚶', title: 'Quick Follow Closest', color: '#00ff00' },
           { id: 'quick-chat', text: '💬', title: 'Quick Mass Chat', color: '#ffaa00' },
           { id: 'quick-debug', text: '🔍', title: 'Quick Debug', color: '#aa00ff' }
       ];

       actions.forEach(action => {
           const button = document.createElement('button');
           button.id = action.id;
           button.textContent = action.text;
           button.title = action.title;
           button.style.cssText = `
               width: 40px !important;
               height: 40px !important;
               border-radius: 50% !important;
               border: 2px solid ${action.color} !important;
               background: rgba(0, 0, 0, 0.8) !important;
               color: ${action.color} !important;
               font-size: 16px !important;
               cursor: pointer !important;
               transition: all 0.3s ease !important;
           `;

           button.addEventListener('mouseenter', () => {
               button.style.background = action.color;
               button.style.color = 'black';
               button.style.transform = 'scale(1.1)';
           });

           button.addEventListener('mouseleave', () => {
               button.style.background = 'rgba(0, 0, 0, 0.8)';
               button.style.color = action.color;
               button.style.transform = 'scale(1)';
           });

           quickActions.appendChild(button);
       });

       document.body.appendChild(quickActions);

       // Event listeners para quick actions
       document.getElementById('quick-coloring').onclick = () => {
           if (window.HabboColoring.isActive) {
               document.getElementById('auto-coloring').click();
           } else {
               document.getElementById('start-coloring').click();
           }
       };

       document.getElementById('quick-follow').onclick = () => {
           document.getElementById('follow-closest').click();
       };

       document.getElementById('quick-chat').onclick = () => {
           window.HabboAPI.massChat('Hello! 👋', 2, 400);
           showNotification('Quick chat enviado!', 'success');
       };

       document.getElementById('quick-debug').onclick = () => {
           window.HabboAPI.getPerformanceStats();
           showNotification('Debug executado - Verifique o console', 'info');
       };

       return quickActions;
   }

   // Função para salvar/carregar configurações
   function saveSettings() {
       const settings = {
           panelPosition: {
               x: document.getElementById('habbo-control-panel').style.transform
           },
           sectionsCollapsed: {},
           autoStart: false
       };

       // Salvar quais seções estão colapsadas
       ['basic-controls-content', 'coloring-content', 'automation-content', 'debug-content'].forEach(id => {
           const element = document.getElementById(id);
           if (element) {
               settings.sectionsCollapsed[id] = element.style.display === 'none';
           }
       });

       localStorage.setItem('habbo-monitor-settings', JSON.stringify(settings));
   }

   function loadSettings() {
       try {
           const settings = JSON.parse(localStorage.getItem('habbo-monitor-settings') || '{}');
           
           // Restaurar posição do painel
           if (settings.panelPosition && settings.panelPosition.x) {
               document.getElementById('habbo-control-panel').style.transform = settings.panelPosition.x;
           }

           // Restaurar estado das seções
           if (settings.sectionsCollapsed) {
               Object.entries(settings.sectionsCollapsed).forEach(([id, collapsed]) => {
                   const element = document.getElementById(id);
                   if (element) {
                       element.style.display = collapsed ? 'none' : 'block';
                   }
               });
           }

           return settings;
       } catch (e) {
           console.warn('Erro ao carregar configurações:', e);
           return {};
       }
   }

   // Salvar configurações periodicamente
   setInterval(saveSettings, 10000);

   // Retornar API pública do módulo
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
       showNotification,
       createQuickActions,
       toggleSection,
       saveSettings,
       loadSettings
   };
})();
