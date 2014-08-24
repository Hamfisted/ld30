function defineSheets (version) {
  version = version || "";
  var spritesFile = 'sprites' + version + '.png';
  var tilesFile = 'tiles' + version + '.png';

  Q.compileSheets(spritesFile, 'sprites.json');
  Q.sheet('tiles', tilesFile, { tilew: 32, tileh: 32 });
  Q.sheet('switch', tilesFile, { sx:64, sy:0, cols:1, tilew:32, tileh:32, frames:1 });

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
];

Q.load(assetsList, function () {
  defineSheets();
  Q.animations("player", {
    right: { frames: [0], flip: false },
    left:  { frames: [0], flip: "x" },
  });
  Q.animations("tower", {
    right: { frames: [0], flip: false },
    left:  { frames: [0], flip: "x" },
  });
  Q.stageScene("startGame");
});
