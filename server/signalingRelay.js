import { C2S, S2C } from '../shared/protocol.js';

export function setupSignaling(socket, io) {
  socket.on(C2S.SIGNAL_OFFER, ({ targetId, offer }) => {
    io.to(targetId).emit(S2C.SIGNAL_OFFER, { fromId: socket.id, offer });
  });

  socket.on(C2S.SIGNAL_ANSWER, ({ targetId, answer }) => {
    io.to(targetId).emit(S2C.SIGNAL_ANSWER, { fromId: socket.id, answer });
  });

  socket.on(C2S.SIGNAL_ICE, ({ targetId, candidate }) => {
    io.to(targetId).emit(S2C.SIGNAL_ICE, { fromId: socket.id, candidate });
  });
}
