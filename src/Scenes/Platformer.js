class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.score = 0;
        this.perish = this.perish.bind(this);
    }
    perish() {  
        this.add.particles(my.sprite.player.body.x, my.sprite.player.body.y, "kenny-particles", {
            frame: ['dirt_02.png'],
            // TODO: Try: add random: true
            scale: {start: 0.1, end: 0.4}, 
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 1050, duration: 1050, maxAliveParticles: 8,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0}, gravityY: -600
        });
        my.sprite.player.body.x = this.spawn[0].x;
        my.sprite.player.body.y = this.spawn[0].y;
        my.sprite.player.body.velocity.x = 0;
        my.sprite.player.body.velocity.y = 0;
    }

    preload(){
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    }
    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);


        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.water= this.map.createLayer("Water", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });
        
        this.water.setCollisionByProperty({
            water: true
        });
        
        // Find coins in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "coin"
        // Assign the coin texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        this.spawn = this.map.createFromObjects("Objects", {
            name: "spawnpoint",
            key: "tilemap_sheet",
            frame: 151
        });
        
        this.shroom = this.map.createFromObjects("Objects", {
            name: "shrooms",
            key: "tilemap_sheet",
            frame: 128
        });
        
        this.scorer = this.add.text(10,10,this.score);
        // TODO: Add turn into Arcade Physics here
        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.spawn, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.shroom, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(this.spawn[0].x, this.spawn[0].y, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        this.physics.add.collider(my.sprite.player, this.water, this.perish);

        // TODO: Add coin collision handler
        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            this.add.particles(obj2.x, obj2.y, "kenny-particles", {
                frame: ['circle_01.png'],
                // TODO: Try: add random: true
                scale: {start: 0, end: 0.4}, 
                // TODO: Try: maxAliveParticles: 8,
                lifespan: 350, duration: 250, maxAliveParticles: 1,
                // TODO: Try: gravityY: -400,
                alpha: {start: 1, end: 0}
            });
            this.score+= 1;
            obj2.destroy(); // remove coin on overlap
        });

        this.physics.add.overlap(my.sprite.player, this.shroom[0], (obj1, obj2) => {
            obj2.destroy();
            this.JUMP_VELOCITY = this.JUMP_VELOCITY * 1.3;
        });
        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // TODO: Add movement vfx here
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            // TODO: Try: add random: true
            scale: {start: 0.01, end: 0.09, random: true},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 350, maxAliveParticles:8,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0.1}, gravityY: -400
        });

        my.vfx.walking.stop();


        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        
        this.animatedTiles.init(this.map);

    }

    update() {
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }
        
        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            my.sprite.player.setAccelerationX(0);

            my.sprite.player.setDragX(this.DRAG);

            my.sprite.player.anims.play('idle');
            
            my.vfx.walking.stop();

        }
        this.scorer.destroy();
        this.scorer = this.add.text(10, 10, "Coins: " + this.score);
        
        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
                
            my.vfx.walking.stop();
            
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
        
    }
}