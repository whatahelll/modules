// ===============================================
// MÓDULO: Sistema de Salas (ATUALIZADO)
// ===============================================

window.HabboRoom = (function() {
    'use strict';

    class Room extends window.HabboEvents.EventEmitter {
        constructor() {
            super();
            this.myUser = null;
            this.users = new Map();
            this.furnis = new Map();
            this.heightMap = [];
            this.isLoaded = false;
        }

        getUserById(id) {
            return this.users.get(id);
        }

        getUserByRoomIndex(roomIndex) {
            for (const user of this.users.values()) {
                if (user.roomIndex === roomIndex) {
                    return user;
                }
            }
            return null;
        }

        addUser(user) {
            const existingUser = this.getUserById(user.id);
            if (existingUser) {
                existingUser.username = user.username || existingUser.username;
                existingUser.motto = user.motto;
                existingUser.figure = user.figure;
                existingUser.roomIndex = user.roomIndex;
                existingUser.updatePosition(user.x, user.y, user.z);
                existingUser.direction = user.direction;
                existingUser.gender = user.gender;
                existingUser.userType = user.userType;
                existingUser.achievementScore = user.achievementScore;
                existingUser.isModerator = user.isModerator;
                existingUser.lastUpdate = Date.now();

                this.emit("user-updated", existingUser);
                return existingUser;
            } else {
                this.users.set(user.id, user);
                this.emit("user-load", user);
                if (window.HabboUI) {
                    window.HabboUI.updateUserCount();
                }
                return user;
            }
        }

        addFurni(furni) {
            this.furnis.set(furni.id, furni);
            this.emit("furni-load", furni);
        }

        removeFurni(furniId) {
            const furni = this.furnis.get(furniId);
            if (furni) {
                this.furnis.delete(furniId);
                this.emit("furni-remove", furni);
            }
        }

        getAllFurnis() {
            return Array.from(this.furnis.values());
        }

        getFurniCount() {
            return this.furnis.size;
        }

        updateUserPosition(roomIndex, x, y, z, direction = null, actions = '') {
            const user = this.getUserByRoomIndex(roomIndex);
            if (user) {
                const oldX = user.x;
                const oldY = user.y;

                if (direction !== null) {
                    user.direction = direction;
                }

                if (actions && actions.includes('mv')) {
                    const actionParts = actions.split('/');
                    for (const action of actionParts) {
                        const parts = action.split(' ');
                        if (parts[0] === 'mv' && parts.length >= 2) {
                            const values = parts[1].split(',');
                            if (values.length >= 3) {
                                const targetX = parseInt(values[0]);
                                const targetY = parseInt(values[1]);
                                const targetZ = parseFloat(values[2]);
                                user.walking = true;
                                user.updatePosition(targetX, targetY, targetZ);
                                this.emit("user-walk", user, oldX, oldY);
                                break;
                            }
                        }
                    }
                } else {
                    if (user.walking) {
                        user.walking = false;
                        this.emit("user-stop-walk", user);
                    }
                    user.updatePosition(x, y, z);
                }

                if (oldX !== user.x || oldY !== user.y) {
                    this.emit("user-move", user, oldX, oldY);
                    const myUserId = window.HabboCore ? window.HabboCore.myUserId : null;
                    if (user.id === myUserId) {
                        window.HabboUI.log(`🚶 Minha posição: (${user.x}, ${user.y})`);
                    }
                }
            }
        }

        removeUser(id) {
            const user = this.users.get(id);
            if (user) {
                this.users.delete(id);
                this.emit("user-remove", user);
                window.HabboUI.log(`👋 ${user.username} saiu da sala`);
                if (window.HabboUI) {
                    window.HabboUI.updateUserCount();
                }
            }
        }

        getAllUsers() {
            return Array.from(this.users.values());
        }

        getUserCount() {
            return this.users.size;
        }

        clear() {
            this.users.clear();
            this.furnis.clear();
            this.myUser = null;
            this.isLoaded = false;
            window.HabboUI.log('🏠 Sala limpa');
            if (window.HabboUI) {
                window.HabboUI.updateUserCount();
            }
        }

        findUsersByName(searchTerm) {
            const results = [];
            const search = searchTerm.toLowerCase();

            for (const user of this.users.values()) {
                if (user.username.toLowerCase().includes(search)) {
                    results.push(user);
                }
            }

            return results;
        }

        getUsersInRange(centerX, centerY, maxDistance = 2) {
            const nearbyUsers = [];
            const myUserId = window.HabboCore ? window.HabboCore.myUserId : null;

            for (const user of this.users.values()) {
                if (user.id === myUserId) continue;

                const distance = Math.abs(user.x - centerX) + Math.abs(user.y - centerY);

                if (distance <= maxDistance) {
                    nearbyUsers.push({
                        user: user,
                        distance: distance,
                        position: { x: user.x, y: user.y }
                    });
                }
            }

            nearbyUsers.sort((a, b) => a.distance - b.distance);
            return nearbyUsers;
        }
    }

    return {
        Room
    };
})();
