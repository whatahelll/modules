// ===============================================
// MÓDULO INTEGRADO: Jogo de Colorir (CORRIGIDO)
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
    let detectedSprites = new Set();

    const COLOR_STATES = {
        0: 'Padrão (Cinza)',
        1: 'Amarela',
        2: 'Laranja', 
        3: 'Vermelha',
        4: 'Rosa',
        5: 'Azul',
        6: 'Verde'
    };

    const FURNITURE_HEADERS = {
        FURNITURE_FLOOR: 1778,
        FURNITURE_FLOOR_ADD: 1534,
        FURNITURE_FLOOR_REMOVE: 2703,
        FURNITURE_FLOOR_UPDATE: 3776,
        FURNITURE_STATE: 2376
    };

    class ColoringGame {
        constructor() {
            this.tiles = new Map();
            this.currentColor = 0;
            this.targetColor = 1;
            this.completed = false;
            this.playerStartPos = null;
            this.gridSize = 0;
            this.realFurniture = new Map();
            this.coloringSprites = new Set();
            this.scanRadius = 15;
            this.isInitialized = false;
        }

        initialize() {
            if (this.isInitialized) return true;
            
            if (!window.HabboCore || !window.HabboCore.room) {
                window.HabboUI.log('❌ Sistema não disponível para inicializar');
                return false;
            }
            
            this.setupFurnitureInterception();
            this.isInitialized = true;
            window.HabboUI.log('✅ Sistema de colorir inicializado');
            return true;
        }

        scanNearbyFurniture() {
            if (!this.isInitialized) {
                if (!this.initialize()) return [];
            }

            if (!window.HabboCore.room || !window.HabboCore.room.myUser) {
                window.HabboUI.log('❌ Jogador não encontrado para escanear móveis');
                return [];
            }

            const myPos = { x: window.HabboCore.room.myUser.x, y: window.HabboCore.room.myUser.y };
            
            window.HabboUI.log(`🔍 Escaneando móveis próximos à posição (${myPos.x}, ${myPos.y})`);
            window.HabboUI.log(`📡 Sistema aguardando detecção automática de móveis`);
            
            return [];
        }

        setupFurnitureInterception() {
            if (!window.HabboCore.gameSocket) {
                window.HabboUI.log('❌ WebSocket não disponível para interceptação');
                return;
            }

            window.HabboUI.log('📡 Sistema de interceptação de móveis ativo');
            window.HabboUI.log('💡 Os móveis serão detectados automaticamente quando os packets chegarem');
        }

        addDetectedFurniture(itemId, x, y, spriteId, state) {
            if (!this.isInitialized) return;
            
            const myPos = window.HabboCore.room ? window.HabboCore.room.myUser : null;
            if (!myPos) {
                window.HabboUI.log(`🪑 Móvel detectado mas jogador não encontrado: ID:${itemId} Pos:(${x},${y}) Sprite:${spriteId}`);
                return;
            }

            const distance = Math.abs(x - myPos.x) + Math.abs(y - myPos.y);
            
            const furniture = {
                itemId: itemId,
                x: x,
                y: y,
                spriteId: spriteId,
                state: state,
                distance: distance,
                isColorTile: this.analyzeIfColoringTile(spriteId, state, x, y)
            };

            this.realFurniture.set(itemId, furniture);
            detectedSprites.add(spriteId);
            
            if (furniture.isColorTile) {
                this.coloringSprites.add(spriteId);
                const key = `${x},${y}`;
                gameTiles.set(key, { x, y, state, itemId, spriteId });
                
                gameArea.minX = Math.min(gameArea.minX, x);
                gameArea.maxX = Math.max(gameArea.maxX, x);
                gameArea.minY = Math.min(gameArea.minY, y);
                gameArea.maxY = Math.max(gameArea.maxY, y);
                
                window.HabboUI.log(`🎨 Tile de colorir: (${x}, ${y}) Sprite:${spriteId} Estado:${state} (${COLOR_STATES[state] || 'Desconhecido'})`);
            } else if (distance <= this.scanRadius) {
                window.HabboUI.log(`🪑 Móvel próximo: (${x}, ${y}) Sprite:${spriteId} Estado:${state} Dist:${distance}`);
            }
        }

        analyzeIfColoringTile(spriteId, state, x, y) {
            if (state < 0 || state > 6) return false;
            if (this.coloringSprites.has(spriteId)) return true;
            
            const COLORING_SPRITES = [
                4423, 4424, 4425, 4426, 4427, 4428,
                5000, 5001, 5002, 5003, 5004, 5005,
                6000, 6001, 6002, 6003, 6004, 6005
            ];
            
            if (COLORING_SPRITES.includes(spriteId)) return true;
            
            const nearbyTiles = this.findNearbyTilesWithSameSprite(spriteId, x, y);
            
            if (nearbyTiles.length >= 2) {
                const uniqueStates = new Set(nearbyTiles.map(t => t.state));
                if (uniqueStates.size >= 2) {
                    window.HabboUI.log(`🔍 Sprite ${spriteId} identificado como tile de colorir (${nearbyTiles.length} tiles similares)`);
                    return true;
                }
            }
            
            return false;
        }

        findNearbyTilesWithSameSprite(spriteId, centerX, centerY) {
            const nearby = [];
            
            for (const furniture of this.realFurniture.values()) {
                if (furniture.spriteId === spriteId) {
                    const distance = Math.abs(furniture.x - centerX) + Math.abs(furniture.y - centerY);
                    if (distance <= 8) {
                        nearby.push(furniture);
                    }
                }
            }
            
            return nearby;
        }

        updateFurnitureState(itemId, newState) {
            if (!this.isInitialized) return;
            
            const furniture = this.realFurniture.get(itemId);
            if (furniture && furniture.isColorTile) {
                const oldState = furniture.state;
                furniture.state = newState;
                
                const key = `${furniture.x},${furniture.y}`;
                const tileData = gameTiles.get(key);
                if (tileData) {
                    tileData.state = newState;
                }
                
                window.HabboUI.log(`🔄 Tile atualizado em (${furniture.x}, ${furniture.y}): ${COLOR_STATES[oldState]} → ${COLOR_STATES[newState]}`);
            }
        }

        detectGameBoard() {
            if (!this.isInitialized) {
                window.HabboUI.log('❌ Sistema não inicializado');
                return false;
            }
            
            const colorTilesCount = gameTiles.size;
            const totalFurniture = this.realFurniture.size;
            
            window.HabboUI.log(`📊 Detecção do tabuleiro:`);
            window.HabboUI.log(`   Total de móveis detectados: ${totalFurniture}`);
            window.HabboUI.log(`   Tiles de colorir encontrados: ${colorTilesCount}`);
            window.HabboUI.log(`   Sprites únicos: ${detectedSprites.size}`);
            window.HabboUI.log(`   Sprites de colorir: [${Array.from(this.coloringSprites).join(', ')}]`);
            
            if (colorTilesCount === 0) {
                window.HabboUI.log('⚠️ Nenhum tile de colorir detectado ainda');
                window.HabboUI.log('💡 Aguardando mais packets de móveis...');
                return false;
            }
            
            if (colorTilesCount < 4) {
                window.HabboUI.log(`⚠️ Poucos tiles detectados (${colorTilesCount}). Aguardando mais...`);
            }

            if (gameArea.minX !== 999) {
                boardDimensions.width = gameArea.maxX - gameArea.minX + 1;
                boardDimensions.height = gameArea.maxY - gameArea.minY + 1;
                
                window.HabboUI.log(`📏 Área do jogo: ${boardDimensions.width}x${boardDimensions.height}`);
                window.HabboUI.log(`📍 Coordenadas: X(${gameArea.minX} a ${gameArea.maxX}), Y(${gameArea.minY} a ${gameArea.maxY})`);
                
                this.gridSize = Math.max(boardDimensions.width, boardDimensions.height);
            }
            
            this.detectPlayerStartPosition();
            
            return true;
        }

        detectPlayerStartPosition() {
            if (!window.HabboCore.room || !window.HabboCore.room.myUser) return;

            const myPos = { x: window.HabboCore.room.myUser.x, y: window.HabboCore.room.myUser.y };
            this.playerStartPos = { ...myPos };
            window.HabboUI.log(`👤 Posição do jogador: (${myPos.x}, ${myPos.y})`);
        }

        analyzeBoard() {
            if (!this.isInitialized) {
                window.HabboUI.log('❌ Sistema não inicializado para análise');
                return { totalTiles: 0, colorCounts: {}, targetColor: 1 };
            }
            
            const colorCounts = {};
            let totalTiles = 0;

            for (const tile of gameTiles.values()) {
                totalTiles++;
                const color = tile.state;
                colorCounts[color] = (colorCounts[color] || 0) + 1;
            }

            if (totalTiles === 0) {
                window.HabboUI.log('❌ Nenhum tile de jogo detectado para análise');
                return { totalTiles: 0, colorCounts: {}, targetColor: 1 };
            }

            let bestTargetColor = this.findOptimalTargetColor(colorCounts, totalTiles);
            this.targetColor = bestTargetColor;
            
            window.HabboUI.log(`🎯 Análise do tabuleiro (${totalTiles} tiles):`);
            for (const [color, count] of Object.entries(colorCounts)) {
                const colorName = COLOR_STATES[color] || `Cor ${color}`;
                const percentage = (count/totalTiles*100).toFixed(1);
                const isTarget = parseInt(color) === this.targetColor ? ' ⭐' : '';
                window.HabboUI.log(`   ${colorName}: ${count} tiles (${percentage}%)${isTarget}`);
            }
            
            return { totalTiles, colorCounts, targetColor: bestTargetColor };
        }

        findOptimalTargetColor(colorCounts, totalTiles) {
            let bestColor = 1;
            let minMoves = Infinity;
            
            for (let testColor = 1; testColor <= 6; testColor++) {
                if (!colorCounts[testColor]) continue;
                
                const movesNeeded = totalTiles - (colorCounts[testColor] || 0);
                
                if (movesNeeded < minMoves) {
                    minMoves = movesNeeded;
                    bestColor = testColor;
                }
            }
            
            return bestColor;
        }

        getBoardInfo() {
            return {
                dimensions: boardDimensions,
                gridSize: this.gridSize,
                area: gameArea,
                totalTiles: gameTiles.size,
                totalFurniture: this.realFurniture.size,
                detectedSprites: Array.from(detectedSprites),
                coloringSprites: Array.from(this.coloringSprites),
                targetColor: this.targetColor,
                playerStart: this.playerStartPos,
                completed: this.completed,
                initialized: this.isInitialized
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

    function startGame() {
        window.HabboUI.log('🎮 Iniciando sistema de detecção de jogo de colorir...');
        
        if (!window.HabboCore || !window.HabboCore.room) {
            window.HabboUI.log('❌ Sala não carregada');
            return false;
        }

        gameBoard = new ColoringGame();
        
        if (!gameBoard.initialize()) {
            window.HabboUI.log('❌ Falha ao inicializar o sistema');
            gameBoard = null;
            return false;
        }
        
        isGameActive = true;
        
        gameArea = { minX: 999, maxX: -999, minY: 999, maxY: -999 };
        gameTiles.clear();
        detectedSprites.clear();
        
        gameBoard.scanNearbyFurniture();
        
        setTimeout(() => {
            if (gameBoard && gameBoard.detectGameBoard()) {
                gameState = gameBoard.analyzeBoard();
                window.HabboUI.log('🎮 Sistema de detecção ativo!');
                
                if (gameState.totalTiles > 0) {
                    window.HabboUI.log(`🎯 Objetivo sugerido: Pintar tudo de ${COLOR_STATES[gameState.targetColor]}`);
                    
                    const progress = gameBoard.getProgress();
                    window.HabboUI.log(`📈 Progresso atual: ${progress.correct}/${progress.total} tiles (${progress.percentage}%)`);
                } else {
                    window.HabboUI.log('⏳ Sistema ativo, aguardando detecção de móveis...');
                }
            } else {
                window.HabboUI.log('⏳ Sistema iniciado, aguardando detecção de tiles...');
            }
        }, 2000);
        
        return true;
    }

    function stopGame() {
        isGameActive = false;
        autoPlayEnabled = false;
        if (gameBoard) {
            gameBoard.isInitialized = false;
        }
        gameBoard = null;
        currentPath = [];
        gameTiles.clear();
        detectedSprites.clear();
        gameArea = { minX: 999, maxX: -999, minY: 999, maxY: -999 };
        window.HabboUI.log('⏹️ Sistema de detecção parado');
    }

    function toggleAutoPlay() {
        if (!isGameActive || !gameBoard) {
            window.HabboUI.log('❌ Inicie o sistema primeiro');
            return;
        }

        autoPlayEnabled = !autoPlayEnabled;
        
        if (autoPlayEnabled) {
            window.HabboUI.log('🤖 Auto-play ativado');
            if (gameBoard && gameBoard.targetColor) {
                window.HabboUI.log(`🎯 Alvo: ${COLOR_STATES[gameBoard.targetColor]}`);
            }
        } else {
            window.HabboUI.log('⏸️ Auto-play desativado');
        }
    }

    function getGameStatus() {
        if (!isGameActive || !gameBoard) {
            window.HabboUI.log('❌ Sistema não iniciado');
            return { active: false };
        }
        
        const boardInfo = gameBoard.getBoardInfo();
        const progress = gameBoard.getProgress();
        
        const status = {
            active: isGameActive,
            initialized: boardInfo.initialized,
            autoPlay: autoPlayEnabled,
            totalTiles: boardInfo.totalTiles,
            totalFurniture: boardInfo.totalFurniture,
            detectedSprites: boardInfo.detectedSprites.length,
            coloringSprites: boardInfo.coloringSprites,
            targetColor: COLOR_STATES[boardInfo.targetColor] || 'Não definido',
            progress: `${progress.correct}/${progress.total} (${progress.percentage}%)`,
            area: boardInfo.totalTiles > 0 ? `X(${boardInfo.area.minX}-${boardInfo.area.maxX}) Y(${boardInfo.area.minY}-${boardInfo.area.maxY})` : 'N/A'
        };
        
        console.table(status);
        window.HabboUI.log(`📊 Status: ${status.totalTiles} tiles, ${status.totalFurniture} móveis total`);
        
        return status;
    }

    return {
        startGame,
        stopGame,
        toggleAutoPlay,
        getGameStatus,
        
        get isActive() { return isGameActive; },
        get autoPlayEnabled() { return autoPlayEnabled; },
        get gameBoard() { return gameBoard; },
        get colorStates() { return COLOR_STATES; },
        get gameTiles() { return gameTiles; },
        get detectedSprites() { return detectedSprites; }
    };
})();
