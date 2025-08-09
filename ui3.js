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

   // ===============================================
   // MÓDULO INTEGRADO: Jogo de Colorir
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
               this.scanRadius = 10;
           }

           scanNearbyFurniture() {
               if (!window.HabboCore.room || !window.HabboCore.room.myUser) {
                   window.HabboUI.log('❌ Jogador não encontrado para escanear móveis');
                   return;
               }

               const myPos = { x: window.HabboCore.room.myUser.x, y: window.HabboCore.room.myUser.y };
               
               window.HabboUI.log(`🔍 Escaneando móveis próximos à posição (${myPos.x}, ${myPos.y})`);
               window.HabboUI.log(`📡 Interceptação de packets configurada para detectar móveis reais`);
               
               this.setupFurnitureInterception();
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
               const myPos = window.HabboCore.room.myUser;
               if (!myPos) return;

               const distance = Math.abs(x - myPos.x) + Math.abs(y - myPos.y);
               
               if (distance <= this.scanRadius) {
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
                       
                       window.HabboUI.log(`🎨 Tile de colorir detectado: (${x}, ${y}) SpriteID ${spriteId}, Estado ${state} (${COLOR_STATES[state] || 'Desconhecido'})`);
                   } else {
                       window.HabboUI.log(`🪑 Móvel próximo: (${x}, ${y}) SpriteID ${spriteId}, Estado ${state}, Distância ${distance}`);
                   }
               }
           }

           analyzeIfColoringTile(spriteId, state, x, y) {
               if (state < 0 || state > 6) return false;
               if (this.coloringSprites.has(spriteId)) return true;
               
               const nearbyTiles = this.findNearbyTilesWithSameSprite(spriteId, x, y);
               
               if (nearbyTiles.length >= 3) {
                   const uniqueStates = new Set(nearbyTiles.map(t => t.state));
                   if (uniqueStates.size >= 2) {
                       window.HabboUI.log(`🔍 Sprite ${spriteId} identificado como tile de colorir`);
                       return true;
                   }
               }
               
               return true;
           }

           findNearbyTilesWithSameSprite(spriteId, centerX, centerY) {
               const nearby = [];
               
               for (const furniture of this.realFurniture.values()) {
                   if (furniture.spriteId === spriteId) {
                       const distance = Math.abs(furniture.x - centerX) + Math.abs(furniture.y - centerY);
                       if (distance <= 5) {
                           nearby.push(furniture);
                       }
                   }
               }
               
               return nearby;
           }

           updateFurnitureState(itemId, newState) {
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
               const colorTilesCount = gameTiles.size;
               const totalFurniture = this.realFurniture.size;
               
               window.HabboUI.log(`📊 Escaneamento completo:`);
               window.HabboUI.log(`   Total de móveis próximos: ${totalFurniture}`);
               window.HabboUI.log(`   Tiles de colorir detectados: ${colorTilesCount}`);
               window.HabboUI.log(`   Sprites únicos encontrados: ${detectedSprites.size}`);
               window.HabboUI.log(`   Sprites de colorir: [${Array.from(this.coloringSprites).join(', ')}]`);
               
               if (colorTilesCount === 0) {
                   window.HabboUI.log('❌ Nenhum tile de colorir detectado');
                   window.HabboUI.log('💡 Sistema aguardando detecção de móveis via packets');
                   return false;
               }
               
               if (colorTilesCount < 4) {
                   window.HabboUI.log(`⚠️ Poucos tiles detectados (${colorTilesCount}). Continuando para análise.`);
               }

               boardDimensions.width = gameArea.maxX - gameArea.minX + 1;
               boardDimensions.height = gameArea.maxY - gameArea.minY + 1;
               
               window.HabboUI.log(`📏 Área do jogo: ${boardDimensions.width}x${boardDimensions.height}`);
               window.HabboUI.log(`📍 Coordenadas: X(${gameArea.minX} a ${gameArea.maxX}), Y(${gameArea.minY} a ${gameArea.maxY})`);
               
               this.gridSize = Math.max(boardDimensions.width, boardDimensions.height);
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
               
               window.HabboUI.log(`🎯 Análise do tabuleiro:`);
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

       function startGame() {
           window.HabboUI.log('🎮 Iniciando sistema de detecção de jogo de colorir...');
           
           if (!window.HabboCore || !window.HabboCore.room) {
               window.HabboUI.log('❌ Sala não carregada');
               return false;
           }

           gameBoard = new ColoringGame();
           isGameActive = true;
           
           gameArea = { minX: 999, maxX: -999, minY: 999, maxY: -999 };
           gameTiles.clear();
           detectedSprites.clear();
           
           gameBoard.scanNearbyFurniture();
           
           setTimeout(() => {
               if (gameBoard.detectGameBoard()) {
                   gameState = gameBoard.analyzeBoard();
                   window.HabboUI.log('🎮 Sistema de detecção ativo!');
                   
                   if (gameState.totalTiles > 0) {
                       window.HabboUI.log(`🎯 Objetivo sugerido: Pintar tudo de ${COLOR_STATES[gameState.targetColor]}`);
                       
                       const progress = gameBoard.getProgress();
                       window.HabboUI.log(`📈 Progresso atual: ${progress.correct}/${progress.total} tiles (${progress.percentage}%)`);
                   }
               }
           }, 1000);
           
           return true;
       }

       function stopGame() {
           isGameActive = false;
           autoPlayEnabled = false;
           gameBoard = null;
           currentPath = [];
           gameTiles.clear();
           detectedSprites.clear();
           window.HabboUI.log('⏹️ Sistema de detecção parado');
       }

       function toggleAutoPlay() {
           if (!isGameActive) {
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
           if (!isGameActive) {
               window.HabboUI.log('❌ Sistema não iniciado');
               return { active: false };
           }
           
           const boardInfo = gameBoard.getBoardInfo();
           const progress = gameBoard.getProgress();
           
           const status = {
               active: isGameActive,
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
