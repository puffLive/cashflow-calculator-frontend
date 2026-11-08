"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketEvents = void 0;
// Socket.io Event Names
var SocketEvents;
(function (SocketEvents) {
    // Connection Events
    SocketEvents["JOIN_ROOM"] = "join:room";
    SocketEvents["LEAVE_ROOM"] = "leave:room";
    // Player Events
    SocketEvents["PLAYER_JOINED"] = "player:joined";
    SocketEvents["PLAYER_UPDATED"] = "player:updated";
    SocketEvents["PLAYER_DISCONNECTED"] = "player:disconnected";
    SocketEvents["PLAYER_RECONNECTED"] = "player:reconnected";
    SocketEvents["PLAYER_REMOVED"] = "player:removed";
    // Game Events
    SocketEvents["GAME_STARTED"] = "game:started";
    // Transaction Events
    SocketEvents["TRANSACTION_PENDING"] = "transaction:pending";
    SocketEvents["TRANSACTION_FINALIZED"] = "transaction:finalized";
    SocketEvents["TRANSACTION_REJECTED"] = "transaction:rejected";
    // Payday Events
    SocketEvents["PAYDAY_COLLECTED"] = "payday:collected";
    // Fast Track Events
    SocketEvents["FASTTRACK_ACHIEVED"] = "fasttrack:achieved";
    // Session Events
    SocketEvents["SESSION_EXPIRY_WARNING"] = "session:expiry_warning";
    SocketEvents["SESSION_EXPIRED"] = "session:expired";
})(SocketEvents || (exports.SocketEvents = SocketEvents = {}));
//# sourceMappingURL=socket.js.map