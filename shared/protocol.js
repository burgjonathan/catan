// Client -> Server events
export const C2S = {
  CREATE_ROOM: 'room:create',
  JOIN_ROOM: 'room:join',
  LEAVE_ROOM: 'room:leave',
  START_GAME: 'game:start',

  ROLL_DICE: 'game:rollDice',
  BUILD_SETTLEMENT: 'game:buildSettlement',
  BUILD_CITY: 'game:buildCity',
  BUILD_ROAD: 'game:buildRoad',
  BUY_DEV_CARD: 'game:buyDevCard',
  PLAY_DEV_CARD: 'game:playDevCard',
  END_TURN: 'game:endTurn',

  MOVE_ROBBER: 'game:moveRobber',
  STEAL_RESOURCE: 'game:stealResource',
  DISCARD_RESOURCES: 'game:discardResources',

  TRADE_OFFER: 'game:tradeOffer',
  TRADE_ACCEPT: 'game:tradeAccept',
  TRADE_REJECT: 'game:tradeReject',
  TRADE_CANCEL: 'game:tradeCancel',
  TRADE_WITH_BANK: 'game:tradeWithBank',

  PLACE_INITIAL_SETTLEMENT: 'game:placeInitialSettlement',
  PLACE_INITIAL_ROAD: 'game:placeInitialRoad',

  CHAT_MESSAGE: 'chat:message',

  CREATE_PUBLIC_ROOM: 'room:createPublic',
  BROWSE_ROOMS: 'lobby:browse',
  STOP_BROWSING: 'lobby:stopBrowse',
  QUICK_PLAY: 'lobby:quickPlay',

  SIGNAL_OFFER: 'signal:offer',
  SIGNAL_ANSWER: 'signal:answer',
  SIGNAL_ICE: 'signal:ice',
};

// Server -> Client events
export const S2C = {
  ROOM_CREATED: 'room:created',
  ROOM_JOINED: 'room:joined',
  ROOM_UPDATED: 'room:updated',
  ROOM_ERROR: 'room:error',
  PLAYER_LEFT: 'room:playerLeft',

  GAME_STATE: 'game:state',
  GAME_ERROR: 'game:error',
  GAME_LOG: 'game:log',
  GAME_OVER: 'game:over',

  DICE_RESULT: 'game:diceResult',
  MUST_DISCARD: 'game:mustDiscard',
  MUST_MOVE_ROBBER: 'game:mustMoveRobber',

  TRADE_OFFERED: 'game:tradeOffered',
  TRADE_RESOLVED: 'game:tradeResolved',

  CHAT_MESSAGE: 'chat:message',

  PUBLIC_ROOM_LIST: 'lobby:roomList',

  SIGNAL_OFFER: 'signal:offer',
  SIGNAL_ANSWER: 'signal:answer',
  SIGNAL_ICE: 'signal:ice',
};
