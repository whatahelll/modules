// ===============================================
// MÓDULO: Sistema de Eventos
// ===============================================

window.HabboEvents = (function() {
    'use strict';

    class EventEmitter {
        constructor() {
            this.events = {};
        }

        emit(eventName, ...args) {
            if (this.events[eventName]) {
                const events = [];
                for (const event of this.events[eventName]) {
                    if (!event.once) {
                        events.push(event);
                    }
                    try {
                        event.cb(...args);
                    } catch (e) {
                        console.error('Event error:', e);
                    }
                }
                this.events[eventName] = events;
            }
        }

        on(eventName, cb) {
            if (!this.events[eventName]) {
                this.events[eventName] = [];
            }
            this.events[eventName].push({ cb, once: false });
        }

        once(eventName, cb) {
            if (!this.events[eventName]) {
                this.events[eventName] = [];
            }
            this.events[eventName].push({ cb, once: true });
        }

        removeListener(eventName, cb) {
            if (!this.events[eventName]) {
                return;
            }
            this.events[eventName] = this.events[eventName].filter(event => event.cb !== cb);
        }
    }

    return {
        EventEmitter
    };
})();
