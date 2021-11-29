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
      noLocalUpdate: true,
      components: {
        Render: { idModel: 'avatar' },
        LocalScript: {
          idScripts: [],
        },
      },
    });

    world.addGameObject(this.avatar, worldContext, world.getGameObject());

    /*
    const campusY = new Shared.GameObject({
      name: 'campusY',
      components: {
        Render: { idModel: 'campus_Yael' },
        LocalScript: {
          idScripts: [],
        },
      },
    });
    //campusY.object3D.scale.multiply(new Shared.THREE.Vector3(-1, -1, 1));
    campusY.object3D.rotateOnAxis(new Shared.THREE.Vector3(0, 0, 1), -1*Math.PI);
    //campusY.object3D.position.add(-world.origin);
    //campusY.object3D.position.add(new Shared.THREE.Vector3(50, 0, 0));
    campusY.object3D.position.set(5522.95180710312, -3322.608827644959, -110.02345057404978);
    
    //campusY.object3D.position.add(new Shared.THREE.Vector3(-1843551.0294686693, -5174222.462082106, -300));
    //campusY.object3D.position.add(new Shared.THREE.Vector3(-5174222.462082106, -1843551.0294686693, -300));
    campusY.setOutdated(true);
    // world.addGameObject(campusY, worldContext, world.getGameObject());
    console.log("worldGO", world.getGameObject())
    //world.addGameObject(campusY, worldContext, world.parent.parent);

    //world.addGameObject(campusR, worldContext, world.getGameObject());
    //*/
  }

  tick() {}
};
