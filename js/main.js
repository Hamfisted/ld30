var DEV = true;

var Q = window.Q = Quintus()
        .include("Sprites, Scenes, Input, 2D, Anim, Touch, UI")
        .setup({ maximize: true }) // Maximize this game to the size of the browser
        .controls().touch();       // And turn on default input controls and touch input

Q.input.keyboardControls({
  UP: 'up',       W: 'up',    SPACE: 'up',
  LEFT: 'left',   A: 'left',
  DOWN: 'down',   S: 'down',
  RIGHT: 'right', D: 'right',
  R: 'fire'
});

Q.Sprite.extend("Player",{

  init: function (p) {

    this._super(p, {
      sheet: 'player',
      sprite: 'player',
      type: Q.SPRITE_ACTIVE,
      collisionMask: Q.SPRITE_DEFAULT | Q.SPRITE_ENEMY,
      cx: 9,
      x: 200,
      y: 50,
      z: 10,
      dead: false,
      won: false,
      animTimer: 0,
      points:     [ [ -9,  -15 ], [ -9, 15 ], [ 9, 15 ], [ 9, -15 ] ],
      deadPoints: [ [ -15, -15 ], [ -15, 15 ], [ 15, 15 ], [ 15, -15 ] ],
    });

    this.add('2d, platformerControls, animation');
    this.on('die');

    Q.input.on('fire', this, 'endLevel');
  },

  step: function () {
    if (this.p.dead || this.p.won) {
      this.del('platformerControls');
      this.p.vx = 0;
      this.p.animTimer++;
      // If dead, end level after 40 frames. Otherwise end after 64 frames
      if ( (this.p.dead && this.p.animTimer > 40) || this.p.animTimer > 64 ) {
        this.endLevel();
      }
      return;
    }

    if (this.p.vx > 0) {
      this.p.flip = false;
    } else if (this.p.vx < 0) {
      this.p.flip = 'x';
    }

    if (this.p.y > 800) {
      this.die();
    }
  },

  die: function () {
    if (this.p.dead) { return; }
    this.p.collisionMask ^= Q.SPRITE_ENEMY;
    this.p.dead = true;
    // set correct width & collision points when playing death animation
    this.p.cx = 15;
    this.p.points = this.p.deadPoints;
    this.play('die');
  },

  endLevel: function () {
    this.destroy();
    Q.stageScene("endLevel", 1, { won: this.p.won });
  }

});


Q.Sprite.extend("Tower", {
  init: function (p) {
    this._super(p, {
      sheet: 'tower',
      sprite: 'tower',
      cy: 33,
      points: [ [ -9, -15 ], [ -9, 15 ], [ 9, 15 ],  [ 9, -15 ] ],
      z: 20,
      flip: 'x',
      winActive: true,
      rescued: false,
      rescueAnimTimer: 0
    });

    this.add('animation');

    this.on("hit.sprite", function (collision) {
      if (!this.p.winActive || this.p.rescued) { return; }
      if (collision.obj.isA("Player")) {
        collision.obj.p.won = true;
        this.p.rescued = true;
        this.play('rescue');
      }
    });

    Q.state.on("change.lightdark", this, function(isDark) {
      this.p.winActive = !isDark;
    });
  }
});

Q.Sprite.extend("Switch", {
  init: function (p) {
    this._super(p, {
      sheet: 'switch',
      sprite: 'switch',
      z: 2,
      sensor: true,
      _whenLastPressed: -1
    });

    this.on("sensor");
  },
  sensor: function (col) {
    if ( col.p.dead ) { return; }

    if ( (this.p._whenLastPressed < Q._loopFrame - 1) ) {
      this.stage.dark = !this.stage.dark;
      Q.state.set("lightdark", this.stage.dark);
    }
    this.p._whenLastPressed = Q._loopFrame;
  }

});

Q.Sprite.extend("Enemy",{
  init: function (p) {
    this._super(p, {
      sheet: 'enemy',
      z: 3,
      vx: 100,
      type: Q.SPRITE_ENEMY,
      collisionMask: Q.SPRITE_DEFAULT | Q.SPRITE_ENEMY,
    });
    this.p.hurtplayer = true;

    // Enemies use the Bounce AI to change direction whenever they run into something.
    this.add('2d, aiBounce');

    this.on("hit.sprite", function (collision) {
      if (!this.p.hurtplayer) { return; }
      if (collision.obj.isA("Player")) {
        collision.obj.trigger('die');
      }
    });

    Q.state.on("change.lightdark", this, function(isDark) {
      this.p.hurtplayer = !isDark;
      if (isDark) {
        this.p.oldVx = this.p.vx;
        this.p.vx = 0;
      } else {
        this.p.vx = this.p.oldVx;
      }
    });

  }
});

Q.Sprite.extend("Web", {
  init: function (p) {
    this._super(p, {
      sheet: 'web',
      sprite: 'web',
      z: 1,
      type: Q.SPRITE_FRIENDLY,
      collisionMask: Q.SPRITE_NONE
    });

    Q.state.on("change.lightdark", this, function(isDark) {
      if (isDark) {
        this.p.collisionMask = Q.SPRITE_DEFAULT | Q.SPRITE_ACTIVE;
      } else {
        this.p.collisionMask = Q.SPRITE_NONE;
      }
    });
  },
  step: function () {
    this.stage.collide(this);
  }
});

Q.Sprite.extend("FallingBlock", {
  init: function (p) {
    this._super(p, {
      sheet: 'falling-block',
      sprite: 'falling-block',
      z: 5,
      collisionMask: Q.SPRITE_ACTIVE,
      gravity: 0,
      activated: false,
      fallTimer: 0
    });

    this.add('2d');

    this.on("bump.top", function (col) {
      if (col.obj.isA("Player")) {
        this.p.activated = true;
        // make player stick to the block when it's falling
        col.obj.p.vy = this.p.vy;
      }
    });
  },
  step: function () {
    if (this.p.activated) {
      this.p.fallTimer++;
      // Ramp up gravity after a few frames
      if ( this.p.fallTimer >= 6 ) {
        this.p.gravity = Math.min(0.9, this.p.fallTimer/32);
      }
      if ( this.p.y > 1500) {
        this.destroy();
      }
      return;
    }
  }
});


Q.state.on('change.lightdark', function (isDark) {
  var version = isDark ? '2' : '';
  defineSheets(version);
});


Q.scene("level0", function (stage) {
  stage.insert(
    new Q.Repeater({ asset: "background-wall.png", speedX: 0.5, speedY: 0.5 })
  );
  stage.collisionLayer(
    window.tiles = new Q.TileLayer({ dataAsset: 'level0.json', sheet: 'tiles' })
  );

  stage.insert(new Q.Tower({ x: 592, y: 17 }));
  stage.insert(new Q.Switch({ x: 304, y: 48 }));
  stage.insert(new Q.Switch({ x: 560, y: -40 }));

  stage.insert(new Q.Enemy({ x: 400, y: 80 }));

  var player = stage.insert(new Q.Player({ x: 80, y: 80} ));
  stage.add("viewport").follow(player);
});

Q.scene("level1", function (stage) {
  stage.insert(
    new Q.Repeater({ asset: "background-wall.png", speedX: 0.5, speedY: 0.5 })
  );
  stage.collisionLayer(
    window.tiles = new Q.TileLayer({ dataAsset: 'level1.json', sheet: 'tiles' })
  );

  stage.insert(new Q.Tower({ x: 688, y: 177 }));
  stage.insert(new Q.Switch({ x: 496, y: 80 }));
  stage.insert(new Q.Switch({ x: 592, y: 112 }));

  stage.insert(new Q.Enemy({ x: 400, y: 112 }));
  stage.insert(new Q.Enemy({ x: 592, y: 177 }));

  var player = stage.insert(new Q.Player({ x: 144, y: 160 }));
  stage.add("viewport").follow(player);
});

Q.scene("level2", function (stage) {
  stage.insert(
    new Q.Repeater({ asset: "background-wall.png", speedX: 0.5, speedY: 0.5 })
  );
  stage.collisionLayer(
    window.tiles = new Q.TileLayer({ dataAsset: 'level2.json', sheet: 'tiles' })
  );

  stage.insert(new Q.Tower({ x: 240, y: 49, flip: false }));
  stage.insert(new Q.Switch({ x: 176, y: 208 }));
  stage.insert(new Q.Switch({ x: 496, y: 80 }));

  stage.insert(new Q.Enemy({ x: 304, y: 208 }));
  stage.insert(new Q.Enemy({ x: 400, y: 112 }));

  stage.insert(new Q.FallingBlock({ x: 176, y: 144 }));

  stage.insert(new Q.Web({ x: 112, y: 206 }));

  var player = stage.insert(new Q.Player({ x: 32, y: 0 }));
  stage.add("viewport").follow(player);
});

Q.scene("level3", function (stage) {
  stage.insert(
    new Q.Repeater({ asset: "background-wall.png", speedX: 0.5, speedY: 0.5 })
  );
  stage.collisionLayer(
    window.tiles = new Q.TileLayer({ dataAsset: 'level3.json', sheet: 'tiles' })
  );

  stage.insert(new Q.Tower({ x: 240, y: 49, flip: false }));
  stage.insert(new Q.Switch({ x: 176, y: 208 }));
  stage.insert(new Q.Switch({ x: 496, y: 80 }));

  stage.insert(new Q.Enemy({ x: 304, y: 208 }));
  stage.insert(new Q.Enemy({ x: 400, y: 112 }));

  stage.insert(new Q.FallingBlock({ x: 144, y: 144 }));
  stage.insert(new Q.FallingBlock({ x: 176, y: 144 }));

  var player = stage.insert(new Q.Player({ x: 32, y: 0 }));
  stage.add("viewport").follow(player);
});


Q.scene('overlay', function (stage) {
  stage.insert(new Q.UI.Text({
    x: Q.width/2, y: Q.height - 40,
    label: 'Arrow keys or WASD to move.   R to reset.',
    color: 'white',
    family: 'KenPixel Mini',
    weight: 400,
    size: 20,
    outlineColor: 'black',
    outlineWidth: 5
  }));
});


// To display a game over / game won popup box,
// create a endGame scene that takes in a `label` option
// to control the displayed message.
Q.scene('endGame', function (stage) {
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
    Q.stageScene('startGame');
  });

  // Expand the container to visibily fit it's contents (with a padding of 20 pixels)
  container.fit(20);
});

var NUM_LEVELS = 4;

Q.scene("endLevel", function (stage) {
  if (stage.options.won) {
    Q.state.inc("currentLevel", 1);
  }
  var nextLevel = Q.state.get("currentLevel");
  if (nextLevel >= NUM_LEVELS) {
    return Q.stageScene("endGame", 1, { label: "The End" });
  }
  Q.stageScene('startLevel');
});

Q.scene('startGame', function (stage) {
  Q.stageScene('overlay', 2);
  Q.state.set("currentLevel", 0);
  Q.stageScene('startLevel');
});

Q.scene('startLevel', function (stage) {
  var currentLevel = Q.state.get("currentLevel");
  Q.state.set("lightdark", false);
  Q.stageScene("level" + currentLevel, {sort: true});
});
