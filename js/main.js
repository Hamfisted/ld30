var DEV = true;

var Q = window.Q = Quintus()
        .include("Sprites, Scenes, Input, 2D, Anim, Touch, UI")
        .setup({ maximize: true }) // Maximize this game to the size of the browser
        .controls().touch();       // And turn on default input controls and touch input


Q.Sprite.extend("Player",{

  init: function (p) {

    this._super(p, {
      sheet: "player",  // Setting a sprite sheet sets sprite width and height
      x: 200,           // You can also set additional properties that can
      y: 50             // be overridden on object creation
    });

    this.add('2d, platformerControls');

    this.on("hit.sprite", function (collision) {

      if (collision.obj.isA("Tower")) {
        Q.stageScene("endGame",1, { label: "You Won!" });
        this.destroy();
      }
    });

  }

});


Q.Sprite.extend("Tower", {
  init: function (p) {
    this._super(p, { sheet: 'tower' });
  }
});

Q.Sprite.extend("Switch", {
  init: function (p) {
    this._super(p, { sheet: 'switch' });
  }
});

Q.Sprite.extend("Enemy",{
  init: function (p) {
    this._super(p, { sheet: 'enemy', vx: 100 });

    // Enemies use the Bounce AI to change direction whenever they run into something.
    this.add('2d, aiBounce');

    this.on("bump.left,bump.right,bump.bottom", function (collision) {
      if (collision.obj.isA("Player")) {
        Q.stageScene("endGame",1, { label: "You Died" });
        collision.obj.destroy();
      }
    });

  }
});


Q.scene("level0", function (stage) {

  stage.insert(
    new Q.Repeater({ asset: "background-wall.png", speedX: 0.5, speedY: 0.5 })
  );

  stage.collisionLayer(
    new Q.TileLayer({ dataAsset: 'level0.json', sheet: 'tiles' })
  );

  var player = stage.insert(new Q.Player({ x: 80, y: 80} ));
  stage.add("viewport").follow(player);

  stage.insert(new Q.Enemy({ x: 400, y: 80 }));

  stage.insert(new Q.Tower({ x: 592, y: 17 }));
  stage.insert(new Q.Switch({ x: 304, y: 48 }));
});


// To display a game over / game won popup box,
// create a endGame scene that takes in a `label` option
// to control the displayed message.
Q.scene('endGame', function (stage) {
  // skip this annoying process for debuggin
  if (DEV) { return Q.stageScene('level0'); }

  var container = stage.insert(new Q.UI.Container({
    x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
  }));

  var button = container.insert(
    new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC", label: "Play Again" })
  );
  var label = container.insert(
    new Q.UI.Text({x:10, y: -10 - button.p.h, label: stage.options.label })
  );

  // When the button is clicked, clear all the stages and restart the game.
  button.on("click", function () {
    Q.clearStages();
    Q.stageScene('level0');
  });

  // Expand the container to visibily fit it's contents (with a padding of 20 pixels)
  container.fit(20);
});

// ## Asset Loading and Game Launch
// Q.load can be called at any time to load additional assets
// assets that are already loaded will be skipped
// The callback will be triggered when everything is loaded
Q.load("sprites.png, sprites.json, level0.json, tiles.png, background-wall.png", function () {
  // Sprites sheets can be created manually
  Q.sheet("tiles","tiles.png", { tilew: 32, tileh: 32 });

  Q.sheet("switch","tiles.png", {"sx":64,"sy":0,"cols":1,"tilew":32,"tileh":32,"frames":1});

  // Or from a .json asset that defines sprite locations
  Q.compileSheets("sprites.png","sprites.json");

  Q.stageScene("level0");
});
