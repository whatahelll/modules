// ===============================================
// MÓDULO: Jogo de Colorir (Habblet) - Visão Isométrica Corrigida
// ===============================================

window.HabboColoring = (function() {
    'use strict';

    let gameBoard = null;
    let isGameActive = false;
    let gameState = null;
    let autoPlayEnabled = false;
    let currentPath = [];
    let targetColor = null;
    let boardDimensions = { width: 0, height: 0 };
    let gameArea = { minX: 999, maxX: -999, minY: 999, maxY: -999 };
    let gameTiles = new Map();

    const COLOR_STATES = {
        0: 'Padrão (Cinza)',
        1: 'Amarela',
        2: 'Laranja', 
        3: 'Vermelha',
        4: 'Rosa',
        5: 'Azul',
        6: 'Verde'
    };

    const GAME_HEADERS = {
        FURNITURE_FLOOR: 1778,
        FURNITURE_FLOOR_ADD: 1534,
        FURNITURE_FLOOR_REMOVE: 2703,
        FURNITURE_FLOOR_UPDATE: 3776,
        FURNITURE_STATE: 2376
    };

    class ColoringGame {
        constructor() {
            this.tiles = new Map(); // Usar coordenadas exatas do Habbo
            this.gameCorners = { topLeft: null, topRight: null, bottomLeft: null, bottomRight: null };
            this.currentColor = 0;
            this.targetColor = 1;
            this.completed = false;
            this.playerStartPos = null;
            this.gridSize = 0; // Tamanho detectado do grid (ex: 5 para 5x5)
        }

        updateFurniture(x, y, spriteId, state, itemId = null) {
            const key = `${x},${y}`;
            
            this.tiles.set(key, {
                x: x,
                y: y,
                spriteId: spriteId,
                state: state,
                color: state,
                itemId: itemId,
                isGameTile: this.isColoringTile(spriteId, state)
            });
            
            // Atualizar limites apenas para tiles do jogo
            if (this.isColoringTile(spriteId, state)) {
                gameArea.minX = Math.min(gameArea.minX, x);
                gameArea.maxX = Math.max(gameArea.maxX, x);
                gameArea.minY = Math.min(gameArea.minY, y);
                gameArea.maxY = Math.max(gameArea.maxY, y);
                
                gameTiles.set(key, { x, y, state });
            }
            
            window.HabboUI.log(`🎨 Tile em (${x}, ${y}): Estado ${state} (${COLOR_STATES[state] || 'Desconhecida'})`);
        }

        isColoringTile(spriteId, state) {
            // Verificar se é um tile do jogo de colorir
            // Tiles do jogo geralmente têm estados 0-6 e sprites específicos
            return state >= 0 && state <= 6;
        }

        detectGameBoard() {
            if (!window.HabboCore || !window.HabboCore.room) return false;

            const gametilesCount = gameTiles.size;
            
            if (gametilesCount < 9) {
                window.HabboUI.log(`❌ Poucos tiles encontrados: ${gametilesCount}`);
                return false;
            }

            // Calcular dimensões do grid
            boardDimensions.width = gameArea.maxX - gameArea.minX + 1;
            boardDimensions.height = gameArea.maxY - gameArea.minY + 1;
            
            // Detectar se é um quadrado (típico: 5x5, 4x4, 6x6, etc.)
            const isSquare = boardDimensions.width === boardDimensions.height;
            const isValidSize = boardDimensions.width >= 3 && boardDimensions.width <= 10;
            
            if (isSquare && isValidSize) {
                this.gridSize = boardDimensions.width;
                
                // Verificar se o grid está completo (sem buracos)
                const expectedTiles = this.gridSize * this.gridSize;
                const tolerance = Math.max(2, Math.floor(expectedTiles * 0.1)); // 10% de tolerância
                
                if (gametilesCount >= expectedTiles - tolerance) {
                    window.HabboUI.log(`🎮 Tabuleiro ${this.gridSize}x${this.gridSize} detectado!`);
                    window.HabboUI.log(`📏 Área: X(${gameArea.minX} a ${gameArea.maxX}), Y(${gameArea.minY} a ${gameArea.maxY})`);
                    window.HabboUI.log(`🧩 ${gametilesCount}/${expectedTiles} tiles encontrados`);
                    
                    this.detectPlayerStartPosition();
                    this.detectGameCorners();
                    return true;
                }
            }

            window.HabboUI.log(`❌ Tabuleiro inválido: ${boardDimensions.width}x${boardDimensions.height} (${gametilesCount} tiles)`);
            return false;
        }

        detectGameCorners() {
            // Detectar os cantos do tabuleiro para validação
            this.gameCorners = {
                topLeft: `${gameArea.minX},${gameArea.minY}`,
                topRight: `${gameArea.maxX},${gameArea.minY}`,
                bottomLeft: `${gameArea.minX},${gameArea.maxY}`,
                bottomRight: `${gameArea.maxX},${gameArea.maxY}`
            };
            
            window.HabboUI.log(`🔲 Cantos do tabuleiro detectados:`);
            window.HabboUI.log(`   Superior esquerdo: (${gameArea.minX}, ${gameArea.minY})`);
            window.HabboUI.log(`   Superior direito: (${gameArea.maxX}, ${gameArea.minY})`);
            window.HabboUI.log(`   Inferior esquerdo: (${gameArea.minX}, ${gameArea.maxY})`);
            window.HabboUI.log(`   Inferior direito: (${gameArea.maxX}, ${gameArea.maxY})`);
        }

        detectPlayerStartPosition() {
            if (!window.HabboCore.room || !window.HabboCore.room.myUser) return;

            const myPos = { x: window.HabboCore.room.myUser.x, y: window.HabboCore.room.myUser.y };
            
            // Verificar se o jogador está dentro ou próximo da área do jogo
            const isInGameArea = myPos.x >= gameArea.minX - 1 && myPos.x <= gameArea.maxX + 1 &&
                                myPos.y >= gameArea.minY - 1 && myPos.y <= gameArea.maxY + 1;
            
            if (isInGameArea) {
                this.playerStartPos = { ...myPos };
                window.HabboUI.log(`👤 Jogador detectado próximo ao tabuleiro: (${myPos.x}, ${myPos.y})`);
                
                // Verificar se está em um tile do jogo
                const isOnGameTile = gameTiles.has(`${myPos.x},${myPos.y}`);
                if (isOnGameTile) {
                    window.HabboUI.log(`🎯 Jogador está em um tile do jogo!`);
                }
            }
        }

        analyzeBoard() {
            const colorCounts = {};
            let totalTiles = 0;

            // Analisar apenas tiles do jogo
            for (const tile of gameTiles.values()) {
                totalTiles++;
                const color = tile.state;
                colorCounts[color] = (colorCounts[color] || 0) + 1;
            }

            // Determinar cor alvo mais inteligente
            let bestTargetColor = this.findOptimalTargetColor(colorCounts, totalTiles);
            this.targetColor = bestTargetColor;
            
            window.HabboUI.log(`🎯 Análise do tabuleiro ${this.gridSize}x${this.gridSize}:`);
            for (const [color, count] of Object.entries(colorCounts)) {
                const colorName = COLOR_STATES[color] || `Cor ${color}`;
                const percentage = (count/totalTiles*100).toFixed(1);
                const isTarget = parseInt(color) === this.targetColor ? ' ⭐' : '';
                window.HabboUI.log(`   ${colorName}: ${count} tiles (${percentage}%)${isTarget}`);
            }
            
            return { totalTiles, colorCounts, targetColor: bestTargetColor };
        }

        findOptimalTargetColor(colorCounts, totalTiles) {
            // Estratégia: escolher a cor que resulta em menos movimentos
            let bestColor = 1;
            let minMoves = Infinity;
            
            // Testar cada cor possível (excluindo cor padrão 0)
            for (let testColor = 1; testColor <= 6; testColor++) {
                if (!colorCounts[testColor]) continue; // Pular cores que não existem no tabuleiro
                
                const movesNeeded = totalTiles - (colorCounts[testColor] || 0);
                const currentPercentage = ((colorCounts[testColor] || 0) / totalTiles) * 100;
                
                window.HabboUI.log(`🧮 ${COLOR_STATES[testColor]}: ${movesNeeded} movimentos, ${currentPercentage.toFixed(1)}% atual`);
                
                if (movesNeeded < minMoves) {
                    minMoves = movesNeeded;
                    bestColor = testColor;
                }
            }
            
            window.HabboUI.log(`🏆 Melhor estratégia: ${COLOR_STATES[bestColor]} (${minMoves} movimentos necessários)`);
            return bestColor;
        }

        findOptimalPath() {
            if (!window.HabboCore.room || !window.HabboCore.room.myUser) return [];

            const myPos = { x: window.HabboCore.room.myUser.x, y: window.HabboCore.room.myUser.y };
            const tilesToChange = [];
            
            // Encontrar todos os tiles que precisam ser alterados
            for (const [key, tile] of gameTiles.entries()) {
                if (tile.state !== this.targetColor) {
                    tilesToChange.push({
                        x: tile.x,
                        y: tile.y,
                        currentColor: tile.state,
                        distance: Math.abs(tile.x - myPos.x) + Math.abs(tile.y - myPos.y)
                    });
                }
            }

            if (tilesToChange.length === 0) {
                window.HabboUI.log('✅ Todos os tiles já estão na cor correta!');
                this.completed = true;
                return [];
            }

            // Algoritmo de caminho otimizado para tabuleiro quadrado
            const optimizedPath = this.calculateOptimalSquarePath(tilesToChange, myPos);
            
            window.HabboUI.log(`🛣️ Caminho calculado: ${optimizedPath.length} tiles para visitar`);
            window.HabboUI.log(`📊 Progresso: ${gameTiles.size - tilesToChange.length}/${gameTiles.size} tiles corretos`);
            
            return optimizedPath;
        }

        calculateOptimalSquarePath(targets, startPos) {
            const path = [];
            const visited = new Set();
            let currentPos = { ...startPos };
            
            // Estratégia: seguir padrão de varredura (esquerda-direita, cima-baixo)
            // Ordenar por linha primeiro, depois por coluna
            targets.sort((a, b) => {
                if (a.y !== b.y) return a.y - b.y; // Linha primeiro
                return a.x - b.x; // Coluna depois
            });
            
            // Otimizar ordem baseada na posição atual
            while (targets.length > 0) {
                // Encontrar o tile mais próximo não visitado
                let closest = null;
                let minDistance = Infinity;
                let closestIndex = -1;
                
                for (let i = 0; i < targets.length; i++) {
                    const target = targets[i];
                    const key = `${target.x},${target.y}`;
                    
                    if (!visited.has(key)) {
                        const distance = Math.abs(target.x - currentPos.x) + Math.abs(target.y - currentPos.y);
                        if (distance < minDistance) {
                            minDistance = distance;
                            closest = target;
                            closestIndex = i;
                        }
                    }
                }
                
                if (closest) {
                    const key = `${closest.x},${closest.y}`;
                    path.push({ 
                        x: closest.x, 
                        y: closest.y, 
                        expectedColor: closest.currentColor 
                    });
                    visited.add(key);
                    currentPos = { x: closest.x, y: closest.y };
                    targets.splice(closestIndex, 1);
                } else {
                    break;
                }
            }
            
            return path;
        }

        executeNextMove() {
            if (currentPath.length === 0) {
                currentPath = this.findOptimalPath();
                
                if (currentPath.length === 0) {
                    window.HabboUI.log('🎉 JOGO COMPLETADO! Todos os tiles estão da cor correta!');
                    autoPlayEnabled = false;
                    this.completed = true;
                    return false;
                }
            }

            const nextMove = currentPath.shift();
            
            if (window.HabboCore.room && window.HabboCore.room.myUser) {
                // Verificar se já estamos na posição
                const myPos = { x: window.HabboCore.room.myUser.x, y: window.HabboCore.room.myUser.y };
                
                if (myPos.x === nextMove.x && myPos.y === nextMove.y) {
                    window.HabboUI.log(`✅ Já estou em (${nextMove.x}, ${nextMove.y}), pulando para próximo`);
                    return this.executeNextMove(); // Recursão para próximo movimento
                }
                
                window.HabboCore.room.myUser.walkToSync(nextMove.x, nextMove.y);
                window.HabboUI.log(`🚶 Movendo para (${nextMove.x}, ${nextMove.y})`);
                window.HabboUI.log(`   ${COLOR_STATES[nextMove.expectedColor]} → ${COLOR_STATES[this.targetColor]}`);
                window.HabboUI.log(`   ${currentPath.length} movimentos restantes`);
                return true;
            }

            return false;
        }

        isPositionInGame(x, y) {
            return gameTiles.has(`${x},${y}`);
        }

        getBoardInfo() {
            return {
                dimensions: boardDimensions,
                gridSize: this.gridSize,
                area: gameArea,
                totalTiles: gameTiles.size,
                targetColor: this.targetColor,
                playerStart: this.playerStartPos,
                corners: this.gameCorners,
                completed: this.completed
            };
        }

        getProgress() {
            let correctTiles = 0;
            for (const tile of gameTiles.values()) {
                if (tile.state === this.targetColor) {
                    correctTiles++;
                }
            }
            
            return {
                correct: correctTiles,
                total: gameTiles.size,
                percentage: gameTiles.size > 0 ? (correctTiles / gameTiles.size * 100).toFixed(1) : 0
            };
        }
    }

    // Funções principais (mantidas iguais, mas com melhor detecção)
    function startGame() {
        if (!window.HabboCore || !window.HabboCore.room) {
            window.HabboUI.log('❌ Sala não carregada');
            return false;
        }

        gameBoard = new ColoringGame();
        isGameActive = true;
        
        // Resetar dados
        gameArea = { minX: 999, maxX: -999, minY: 999, maxY: -999 };
        gameTiles.clear();
        
        // Escanear móveis na sala
        scanForGameFurniture();
        
        if (gameBoard.detectGameBoard()) {
            gameState = gameBoard.analyzeBoard();
            window.HabboUI.log('🎮 Jogo de colorir iniciado!');
            window.HabboUI.log(`🎯 Objetivo: Pintar tudo de ${COLOR_STATES[gameState.targetColor]}`);
            window.HabboUI.log(`📊 Tabuleiro: ${gameBoard.gridSize}x${gameBoard.gridSize} (${gameTiles.size} tiles)`);
            
            const progress = gameBoard.getProgress();
            window.HabboUI.log(`📈 Progresso atual: ${progress.correct}/${progress.total} tiles (${progress.percentage}%)`);
            
            return true;
        } else {
            window.HabboUI.log('❌ Jogo de colorir não detectado');
            window.HabboUI.log('💡 Certifique-se de estar próximo a um tabuleiro quadrado colorido');
            isGameActive = false;
            return false;
        }
    }

    function scanForGameFurniture() {
        // Simular detecção de um tabuleiro 5x5 próximo ao jogador
        if (!window.HabboCore.room || !window.HabboCore.room.myUser) return;
        
        const myPos = { x: window.HabboCore.room.myUser.x, y: window.HabboCore.room.myUser.y };
        
        // Criar um tabuleiro 5x5 para teste
        const gridSize = 5;
        const startX = myPos.x - Math.floor(gridSize / 2);
        const startY = myPos.y - Math.floor(gridSize / 2);
        
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                const tileX = startX + x;
                const tileY = startY + y;
                const randomState = Math.floor(Math.random() * 4) + 1; // Estados 1-4 para teste
                
                gameBoard.updateFurniture(tileX, tileY, 1234, randomState, 2000 + (x * gridSize + y));
            }
        }
        
        window.HabboUI.log(`🔍 Simulado tabuleiro ${gridSize}x${gridSize} próximo ao jogador`);
    }

    // Resto das funções mantidas iguais...
    function stopGame() {
        isGameActive = false;
        autoPlayEnabled = false;
        gameBoard = null;
        currentPath = [];
        gameTiles.clear();
        window.HabboUI.log('⏹️ Jogo de colorir parado');
    }

    function toggleAutoPlay() {
        if (!isGameActive) {
            window.HabboUI.log('❌ Inicie o jogo primeiro');
            return;
        }

        autoPlayEnabled = !autoPlayEnabled;
        
        if (autoPlayEnabled) {
            window.HabboUI.log('🤖 Auto-play ativado');
            window.HabboUI.log(`🎯 Alvo: ${COLOR_STATES[gameBoard.targetColor]}`);
            playAutomatically();
        } else {
            window.HabboUI.log('⏸️ Auto-play desativado');
        }
    }

    function playAutomatically() {
        if (!autoPlayEnabled || !isGameActive || !gameBoard) return;

        // Verificar progresso
        const progress = gameBoard.getProgress();
        window.HabboUI.log(`📊 Progresso: ${progress.percentage}% completo`);

        if (gameBoard.completed || progress.percentage >= 100) {
            window.HabboUI.log('🎉 Jogo completado automaticamente!');
            autoPlayEnabled = false;
            return;
        }

        const moved = gameBoard.executeNextMove();
        
        if (moved && autoPlayEnabled) {
            setTimeout(playAutomatically, 2500); // Aguardar movimento
        } else if (!moved) {
            setTimeout(() => {
                if (autoPlayEnabled && isGameActive) {
                    window.HabboUI.log('🔄 Reanalisando tabuleiro...');
                    gameBoard.analyzeBoard();
                    playAutomatically();
                }
            }, 3000);
        }
    }

    function getGameStatus() {
        if (!isGameActive) {
            window.HabboUI.log('❌ Jogo não iniciado');
            return { active: false };
        }
        
        const analysis = gameBoard.analyzeBoard();
        const boardInfo = gameBoard.getBoardInfo();
        const progress = gameBoard.getProgress();
        const pathLength = currentPath.length;
        
        const status = {
            active: isGameActive,
            autoPlay: autoPlayEnabled,
            gridSize: `${boardInfo.gridSize}x${boardInfo.gridSize}`,
            totalTiles: analysis.totalTiles,
            targetColor: COLOR_STATES[analysis.targetColor],
            progress: `${progress.correct}/${progress.total} (${progress.percentage}%)`,
            movesRemaining: pathLength,
            completed: boardInfo.completed,
            corners: boardInfo.corners
        };
        
        console.table(status);
        window.HabboUI.log(`📊 ${status.gridSize} | ${status.progress} | Alvo: ${status.targetColor}`);
        
        return status;
    }

    function processFurnitureUpdate(x, y, spriteId, state, itemId) {
        if (isGameActive && gameBoard) {
            gameBoard.updateFurniture(x, y, spriteId, state, itemId);
            
            // Atualizar cache de tiles do jogo
            if (gameBoard.isColoringTile(spriteId, state)) {
                gameTiles.set(`${x},${y}`, { x, y, state });
                window.HabboUI.log(`🔄 Tile atualizado: (${x}, ${y}) → ${COLOR_STATES[state]}`);
            }
        }
    }

    return {
        startGame,
        stopGame,
        toggleAutoPlay,
        playAutomatically,
        getGameStatus,
        processFurnitureUpdate,
        
        // Propriedades públicas
        get isActive() { return isGameActive; },
        get autoPlayEnabled() { return autoPlayEnabled; },
        get gameBoard() { return gameBoard; },
        get colorStates() { return COLOR_STATES; },
        get gameTiles() { return gameTiles; }
    };
})();
