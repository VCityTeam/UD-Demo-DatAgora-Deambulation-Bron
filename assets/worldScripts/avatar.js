/** @format */


let Shared;

module.exports = class Avatar {
  constructor(conf, SharedModule) {
    this.conf = conf;
    Shared = SharedModule;

    this.avatar = null;
    //infos for movements
    this.lastPosition = new Shared.THREE.Vector3();
    this.lastDirection = new Shared.THREE.Vector3();
    this.remainingDistance = Infinity;
  }

  init() {
    //a context containing all references needed for scripting game
    const worldContext = arguments[1];
    const world = worldContext.getWorld();

    this.avatar = new Shared.GameObject({
      name: 'avatar',
      components: {
        Render: { idModel: 'avatar' },
        LocalScript: {
          idScripts: [],
        },
      },
    });

    world.addGameObject(this.avatar, worldContext, world.getGameObject());
  }

  tick() {
    const worldContext = arguments[1];
    const dt = worldContext.getDt();
    const commands = worldContext.getCommands();
    const speedTranslate = 0.03;
    const speedRotate = 0.0006;
    const avatar = this.avatar;

    const thisCommands = this;
    commands.forEach(function (cmd) {
      switch (cmd.getType()) {
        case Shared.Command.TYPE.MOVE_FORWARD:
        {
          let data = cmd.getData();
          //debugger
          //if(!data['position'].equals(avatar.getPosition()) /*|| !data['position'].equals(thisCommands.lastPosition)*/)
          //  break;

          if(!data['position'].equals(thisCommands.lastPosition) || !data['direction'].equals(thisCommands.lastDirection))
          {
            thisCommands.lastPosition.copy(data['position']);
            thisCommands.lastDirection.copy(data['direction']);
            thisCommands.remainingDistance = data['buildingsDepth'];
            //console.log(thisCommands.remainingDistance);

            if(thisCommands.remainingDistance < 15 && !data['position'].equals(avatar.getPosition()))
              break;
          }

          const length = dt * speedTranslate;
          if(length > thisCommands.remainingDistance)
            break;
          
          avatar.move(data['direction'].setLength(length));
          thisCommands.remainingDistance -= length;
          break;
        }
        case Shared.Command.TYPE.MOVE_BACKWARD:
        {
          const length = dt * speedTranslate;
          // if(cmd.getData()['buildingsDepth'] <= length)
          //   break;
          
          const direction = avatar.computeBackwardVector();
          avatar.move(direction.setLength(length));
          break;
        }
        case Shared.Command.TYPE.MOVE_LEFT:
          avatar.rotate(new Shared.THREE.Vector3(0, 0, speedRotate * dt));
          break;
        case Shared.Command.TYPE.MOVE_RIGHT:
          avatar.rotate(new Shared.THREE.Vector3(0, 0, -speedRotate * dt));
          break;
        case Shared.Command.TYPE.Z_UPDATE:
        {
          const z = cmd.getData();
          if (!z) break;
          const currentPos = avatar.getPosition();
          avatar.setPosition(
            new Shared.THREE.Vector3(currentPos.x, currentPos.y, z)
          );
          break;
        }
        case Shared.Command.TYPE.MOVE_TO:
          avatar.setPosition(cmd.getData()['vector']);
          break;
        default:
          throw new Error('command not handled ', cmd.getType());
      }
    });
  }
};
