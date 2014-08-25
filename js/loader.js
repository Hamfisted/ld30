function defineSheets (version) {
  version = version || "";
  var spritesFile = 'sprites' + version + '.png';
  var tilesFile = 'tiles' + version + '.png';

  Q.compileSheets(spritesFile, 'sprites.json');
  Q.sheet('tiles', tilesFile, { tilew: 32, tileh: 32 });
  Q.sheet('falling-block', tilesFile, { sx:64, sy:0, cols:1, tilew:32, tileh:32, frames:1 });

  // A hack to invalidate TileLayer canvas cache
  if (Q.stage()) {
    Q.stage()._collisionLayers.forEach(function (layer) {
      layer.blocks = [];
    });
  }
}

// ## Asset Loading and Game Launch
var assetsList = [
  'sprites.png',
  'sprites2.png',
  'sprites.json',
  'tiles.png',
  'tiles2.png',
  'background-wall.png',
  'level0.json',
  'level1.json',
  'level2.json',
  'level3.json'
];

Q.load(assetsList, function () {
  defineSheets();

  Q.animations("player", {
    die: { frames: [1,2,3,4], rate: 1/8, loop: false }
  });
  Q.animations("tower", {
    rescue: { frames: [1,2,3,4], rate: 1/4, loop: false },
  });

  Q.stageScene("startGame");
});
