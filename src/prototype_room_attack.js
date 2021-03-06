'use strict';

/**
 * attack42 is called so because 42 is the only true answer :-)
 *
 * USAGE: get a Room Object then .attack42('targetRoomName')
 * e.g. Game.rooms[Memory.myRooms[0]].attack42('targetRoomName');
 * TODO add an attack42 event if invader is seen by reserver, sourcer or carry
 *
 * @param {String} roomName should be your targetRoomName
 * @param {Array} [spawn] yourCustomSpawn Array of {creeps: creepsToAdd, role: 'rolesToAdd'}
 */
Room.prototype.attack42 = function(roomName, spawn) {
  spawn = spawn || [{
      creep: 1,
      role: 'autoattackmelee'
    }, {
      creep: 1,
      role: 'defender'
    }, {
      creep: 1,
      role: 'squadheal'
    },

    {
      creep: 2,
      role: 'autoattackmelee'
    }, {
      creep: 2,
      role: 'defender'
    }, {
      creep: 2,
      role: 'squadheal'
    }
  ];

  let closestSpawn = this.closestSpawn(roomName);
  // this.log('closestSpawn ' + JSON.stringify(closestSpawn, null, 2));
  if (closestSpawn && closestSpawn.id) {
    brain.startMeleeSquad(closestSpawn.room, roomName
      //, spawn
    );
  }
};

Room.prototype.attackRoom = function() {
  function attack0(room) {
    room.log('Queuing level 0 attack');
    if (config.autoattack.notify) {
      Game.notify(Game.time + ' ' + room.name + ' Queuing autoattacker');
    }

    let sortByDistance = function(object) {
      return Game.map.getRoomLinearDistance(room.name, object);
    };

    let roomsMy = _.sortBy(Memory.myRooms, sortByDistance);

    brain.startAutoSquad(roomsMy[0], room.name);

    return true;
  }

  function attack1(room) {
    room.log('Queuing level 1 attack');
    if (config.autoattack.notify) {
      Game.notify(Game.time + ' ' + room.name + ' Queuing attack');
    }

    let roomsMy = Memory.myRooms;
    let towers = room.find(FIND_STRUCTURES, {
      filter: function(object) {
        return object.structureType == STRUCTURE_TOWER;
      }
    });
    for (let rooms of roomsMy) {
      if (Game.rooms[rooms].controller.level < 4) {
        roomsMy.splice(roomsMy.indexOf(rooms));
      }
      if (room.controller.level > 4 && towers.length > 1) {
        if (Game.rooms[rooms].controller.level < 6) {
          roomsMy.splice(roomsMy.indexOf(rooms));
        }
      }
    }

    let sortByDistance = function(object) {
      return Game.map.getRoomLinearDistance(room.name, object);
    };

    roomsMy = _.sortBy(roomsMy, sortByDistance);
    let roomFrom = roomsMy[0];
    if (towers.length > 1 && roomsMy.length > 1) {
      let roomFrom2 = roomsMy[1];
      brain.startAutoSquad(roomFrom, room.name);
      brain.startMeleeSquad(roomFrom2, room.name);
      brain.startSquad(roomFrom, room.name);
    } else {
      brain.startAutoSquad(roomFrom, room.name);
      brain.startMeleeSquad(roomFrom, room.name);
      brain.startSquad(roomFrom, room.name);
    }

    return true;
  }

  if (config.autoattack.disabled) {
    return true;
  }
  var name;
  if (this.controller.owner) {
    name = this.controller.owner.username;
  } else {
    if (this.controller.reservation) {
      name = this.controller.reservation.username;
    } else {
      return;
    }
  }

  // We only exclude players in the friends.js
  if (friends.indexOf(name) > -1) {
    return false;
  }

  let getPlayer = function(name) {
    brain.increaseIdiot(name, 0);
    return Memory.players[name];
  };

  var player = getPlayer(name);

  let addRoom = function(player, room) {
    if (!player.rooms) {
      player.rooms = {};
    }
    if (!player.rooms[room.name]) {
      player.rooms[room.name] = {
        visited: Game.time
      };
      Memory.players[player.name] = player;
    }
  };

  addRoom(player, this);
  Memory.players[name] = player;
  if (player.level === 0) {
    attack0(this);
    player.counter++;
  } else if (this.controller.level < 7 && player.level == 1) {
    attack1(this);
    player.counter++;
  }
  if (player.counter >= 1) {
    player.level = 1;
  }
  return true;
};
