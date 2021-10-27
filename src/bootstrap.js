import { Game, Templates } from 'ud-viz';

const myWorld = new Game.Shared.World({
  name: 'My World',
  origin: { lat: 45.7530993, lng: 4.8452654, alt: 300 },
  gameObject: {
    name: 'GameManager',
    static: true,
    components: {
      WorldScript: {
        idScripts: ['avatar'],
      },
      LocalScript: {
        conf: {
          nameGO2Focus: 'avatar',
          cameraAngle: 0,
          offsetZ: 2,
          minDist: 5,
          maxDist: 20,
        },
        idScripts: ['focus', 'localAvatar'],
      },
    }, 
  },
});

const app = new Templates.LocalGame();
app.start(myWorld, './assets/config/local_game_config.json');