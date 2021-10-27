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
  }

  tick() {}
};
