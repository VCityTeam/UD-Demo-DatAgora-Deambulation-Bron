/** @format */

let Shared;

module.exports = class WorldGameManager {
  constructor(conf, SharedModule) {
    this.conf = conf;
    Shared = SharedModule;
  }

  init() {
    //a context containing all references needed for scripting game
    //const worldContext = arguments[1];
    //const world = worldContext.getWorld();
  }

  tick() {
    //const worldContext = arguments[1];
    //const dt = worldContext.getDt();
    //const commands = worldContext.getCommands();
    //const speedTranslate = 0.05;
    //const speedRotate = 0.0003;
    //const zeppelin = this.zeppelin;

    //commands.forEach(function (cmd) {
    //  switch (cmd.getType()) {
    //    case Shared.Command.TYPE.MOVE_FORWARD:
    //      //zeppelin.move(
    //      //  zeppelin.computeForwardVector().setLength(dt * speedTranslate)
    //      //);
    //      break;
    //    case Shared.Command.TYPE.MOVE_BACKWARD:
    //      //zeppelin.move(
    //      //  zeppelin.computeBackwardVector().setLength(dt * speedTranslate)
    //      //);
    //      break;
    //    case Shared.Command.TYPE.MOVE_LEFT:
    //      zeppelin.rotate(new Shared.THREE.Vector3(0, 0, speedRotate * dt));
    //      break;
    //    case Shared.Command.TYPE.MOVE_RIGHT:
    //      zeppelin.rotate(new Shared.THREE.Vector3(0, 0, -speedRotate * dt));
    //      break;
    //    default:
    //      throw new Error('command not handle ', cmd.getType());
    //  }
    //});
  }
};
