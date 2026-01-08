import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { StageConfig, DEFAULT_STAGE } from '../StageConfig';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    
    // Stage configuration
    private currentStage: StageConfig;
    
    // Background bounds
    private backgroundBounds: { left: number; right: number; top: number; bottom: number };
    
    // Pachinko game state
    private score: number = 0;
    private ballsRemaining: number = 10;
    private currentBall: Phaser.Physics.Matter.Image | null = null;
    private isLaunching: boolean = false;
    private pins: Phaser.Physics.Matter.Image[] = [];
    private multiplierZones: { zone: Phaser.GameObjects.Zone, multiplier: number, graphics: Phaser.GameObjects.Graphics }[] = [];
    private pockets: { sensor: MatterJS.BodyType, value: number, x: number }[] = [];
    
    // UI elements
    private scoreText: Phaser.GameObjects.Text;
    private ballsText: Phaser.GameObjects.Text;
    private multiplierText: Phaser.GameObjects.Text | null = null;
    private currentMultiplier: number = 1;

    constructor ()
    {
        super('Game');
    }

    init(data: { stage?: StageConfig })
    {
        // Use provided stage or default to football
        this.currentStage = data?.stage || DEFAULT_STAGE;
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x0A1F0A);

        // Add stage-specific background (preserve aspect ratio)
        const bgKey = `bg-${this.currentStage.id}`;
        this.background = this.add.image(512, 384, bgKey);
        // Scale proportionally to fit within the game area (contain, not cover)
        const scaleX = 1024 / this.background.width;
        const scaleY = 768 / this.background.height;
        const scale = Math.min(scaleX, scaleY);  // Use min to contain and preserve aspect ratio
        this.background.setScale(scale);
        this.background.setAlpha(0.85);
        this.background.setDepth(-1);

        // Calculate background bounds for constraining game elements
        const bgWidth = this.background.width * scale;
        const bgHeight = this.background.height * scale;
        this.backgroundBounds = {
            left: 512 - bgWidth / 2,
            right: 512 + bgWidth / 2,
            top: 384 - bgHeight / 2,
            bottom: 384 + bgHeight / 2
        };

        // Setup game state
        this.score = 0;
        this.ballsRemaining = this.currentStage.ballsPerGame;
        this.currentMultiplier = 1;

        // Create game elements
        this.createBoundaries();
        this.createPinField();
        this.createMultiplierZones();
        this.createScoringPockets();
        this.createUI();
        
        // Setup collision handlers
        this.setupCollisions();
        
        // Listen for launch events from Angular
        EventBus.on('power-meter-release', this.launchBall, this);
        EventBus.on('game-start', this.resetGame, this);

        // Notify Angular that scene is ready
        EventBus.emit('current-scene-ready', this);
        EventBus.emit('launch-ready');
        EventBus.emit('balls-remaining', { count: this.ballsRemaining });
        EventBus.emit('score-updated', { score: this.score, delta: 0 });
    }
    
    createBoundaries()
    {
        const wallThickness = 20;
        
        // Left wall - at background edge
        const leftWallX = this.backgroundBounds.left + wallThickness / 2;
        const leftWall = this.matter.add.rectangle(
            leftWallX,
            (this.backgroundBounds.top + this.backgroundBounds.bottom) / 2,
            wallThickness,
            this.backgroundBounds.bottom - this.backgroundBounds.top,
            {
                isStatic: true,
                label: 'wall',
                restitution: 0.8,  // High bounce to send ball back
                friction: 0.1
            }
        );
        
        // Right wall - at background edge
        const rightWallX = this.backgroundBounds.right - wallThickness / 2;
        const rightWall = this.matter.add.rectangle(
            rightWallX,
            (this.backgroundBounds.top + this.backgroundBounds.bottom) / 2,
            wallThickness,
            this.backgroundBounds.bottom - this.backgroundBounds.top,
            {
                isStatic: true,
                label: 'wall',
                restitution: 0.8,  // High bounce to send ball back
                friction: 0.1
            }
        );
        
        // Top wall - at background edge
        const topWall = this.matter.add.rectangle(
            (this.backgroundBounds.left + this.backgroundBounds.right) / 2,
            this.backgroundBounds.top + wallThickness / 2,
            this.backgroundBounds.right - this.backgroundBounds.left,
            wallThickness,
            {
                isStatic: true,
                label: 'wall',
                restitution: 0.5
            }
        );
        
        // Draw wall visuals at background edges
        const graphics = this.add.graphics();
        graphics.fillStyle(0xE81E2B, 0.3);
        graphics.fillRect(
            this.backgroundBounds.left,
            this.backgroundBounds.top,
            wallThickness,
            this.backgroundBounds.bottom - this.backgroundBounds.top
        ); // Left
        graphics.fillRect(
            this.backgroundBounds.right - wallThickness,
            this.backgroundBounds.top,
            wallThickness,
            this.backgroundBounds.bottom - this.backgroundBounds.top
        ); // Right
        graphics.fillRect(
            this.backgroundBounds.left,
            this.backgroundBounds.top,
            this.backgroundBounds.right - this.backgroundBounds.left,
            wallThickness
        ); // Top
    }
    
    createPinField()
    {
        const pinRadius = this.currentStage.pinRadius;
        
        // Create invisible pins from stage configuration (matching integrated background pins)
        this.currentStage.pins.forEach((pinPos, index) => {
            // Check if pin is within background bounds
            if (pinPos.x < this.backgroundBounds.left || pinPos.x > this.backgroundBounds.right ||
                pinPos.y < this.backgroundBounds.top || pinPos.y > this.backgroundBounds.bottom) {
                return; // Skip pins outside background
            }
            
            // Create invisible physics body only (no visual)
            // The background image already contains the pin graphics
            const pin = this.matter.add.circle(pinPos.x, pinPos.y, pinRadius, {
                isStatic: true,
                label: 'pin',
                restitution: 1.0,        // Perfect bounce for fluid gameplay
                friction: 0,             // No friction for smooth bounces
                frictionStatic: 0,
                frictionAir: 0
            });
            
            this.pins.push(pin as any);
        });
    }
    
    createMultiplierZones()
    {
        // Use multiplier zones from stage configuration
        this.currentStage.multiplierZones.forEach(zoneData => {
            // Create visual representation with football field styling
            const graphics = this.add.graphics();
            
            // Pulsing glow effect
            graphics.fillStyle(zoneData.color, 0.2);
            graphics.fillCircle(zoneData.x, zoneData.y, zoneData.radius);
            
            // Stadium-style rings
            graphics.lineStyle(3, zoneData.color, 0.9);
            graphics.strokeCircle(zoneData.x, zoneData.y, zoneData.radius);
            graphics.lineStyle(2, 0xFFFFFF, 0.5);
            graphics.strokeCircle(zoneData.x, zoneData.y, zoneData.radius - 5);
            
            // Add multiplier text with football score styling
            this.add.text(zoneData.x, zoneData.y, `${zoneData.multiplier}x`, {
                fontSize: '28px',
                color: '#FFFFFF',
                fontFamily: 'Arial Black',
                stroke: '#000000',
                strokeThickness: 5
            }).setOrigin(0.5);
            
            // Create zone for detection
            const zone = this.add.zone(zoneData.x, zoneData.y, zoneData.radius * 2, zoneData.radius * 2);
            
            this.multiplierZones.push({ zone, multiplier: zoneData.multiplier, graphics });
            
            // Pulsing animation
            this.tweens.add({
                targets: graphics,
                alpha: 0.5,
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
        });
    }
    
    createScoringPockets()
    {
        const numPockets = 7;
        const pocketWidth = 80;
        const pocketHeight = 60;
        
        // Position pockets within background bounds
        const pocketAreaWidth = this.backgroundBounds.right - this.backgroundBounds.left - pocketWidth;
        const spacing = pocketAreaWidth / (numPockets - 1);
        const startX = this.backgroundBounds.left + pocketWidth / 2;
        const y = this.backgroundBounds.bottom - 40; // 40px from bottom of background
        
        // Pocket values from stage configuration
        const values = this.currentStage.pocketValues;
        const colors = this.currentStage.pocketColors;  // Use sport-themed colors
        
        for (let i = 0; i < numPockets; i++) {
            const x = startX + i * spacing;
            
            // Draw pocket with football goal theme
            const graphics = this.add.graphics();
            graphics.fillStyle(colors[i], 0.9);
            graphics.fillRoundedRect(x - pocketWidth / 2, y - pocketHeight / 2, pocketWidth, pocketHeight, 8);
            graphics.lineStyle(3, 0xFFFFFF, 0.7);
            graphics.strokeRoundedRect(x - pocketWidth / 2, y - pocketHeight / 2, pocketWidth, pocketHeight, 8);
            
            // Add value text
            this.add.text(x, y, values[i].toString(), {
                fontSize: '20px',
                color: '#ffffff',
                fontFamily: 'Arial Black',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            
            // Create sensor (no collision, just detection)
            const sensor = this.matter.add.rectangle(x, y, pocketWidth, pocketHeight, {
                isStatic: true,
                isSensor: true,
                label: 'pocket-' + i
            });
            
            this.pockets.push({ sensor, value: values[i], x });
        }
    }
    
    createUI()
    {
        const { width } = this.cameras.main;
        
        // Score display
        this.scoreText = this.add.text(width / 2, 40, 'SCORE: 0', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial Black',
            stroke: '#E81E2B',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(100);
        
        // Balls remaining display
        this.ballsText = this.add.text(width - 150, 40, 'BALLS: 10', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial Black',
            stroke: '#E81E2B',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);
        
        // Betclic branding with stage name
        this.add.text(width / 2, 80, `BETCLIC ${this.currentStage.displayName.toUpperCase()} PACHINKO`, {
            fontSize: '18px',
            color: '#E81E2B',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5).setDepth(100);
    }
    
    setupCollisions()
    {
        // Listen for collision events
        this.matter.world.on('collisionstart', (event: any) => {
            event.pairs.forEach((pair: any) => {
                const { bodyA, bodyB } = pair;
                
                // Check if ball hit a pocket
                if ((bodyA.label?.includes('pocket') && bodyB.label === 'ball') ||
                    (bodyB.label?.includes('pocket') && bodyA.label === 'ball')) {
                    
                    const pocketLabel = bodyA.label?.includes('pocket') ? bodyA.label : bodyB.label;
                    const pocketIndex = parseInt(pocketLabel.split('-')[1]);
                    
                    if (this.currentBall && !this.isLaunching) {
                        this.handleBallInPocket(pocketIndex);
                    }
                }
                
                // Check if ball hit a pin (for sound/visual effects)
                if ((bodyA.label === 'pin' && bodyB.label === 'ball') ||
                    (bodyB.label === 'pin' && bodyA.label === 'ball')) {
                    EventBus.emit('pin-hit');
                }
            });
        });
    }
    
    launchBall(data: { power: number })
    {
        if (this.isLaunching || this.ballsRemaining <= 0) {
            return;
        }
        
        this.isLaunching = true;
        EventBus.emit('launch-disabled');
        
        const launchX = 512;
        const launchY = 100;
        
        // Select random ball variant from stage assets
        const ballIndex = Phaser.Math.Between(1, this.currentStage.assets.balls.length);
        const ballKey = `ball-${this.currentStage.id}-${ballIndex}`;
        
        // Create ball with physics (fluid and bouncy)
        this.currentBall = this.matter.add.image(launchX, launchY, ballKey, undefined, {
            label: 'ball',
            circleRadius: this.currentStage.ballRadius,
            restitution: 0.95,       // Very bouncy
            friction: 0,              // No friction for fluid movement
            frictionAir: 0.001,       // Minimal air resistance
            frictionStatic: 0,        // No static friction
            slop: 0.05,               // Allow slight overlap to prevent jamming
            density: 0.001            // Light ball for more lively movement
        });
        
        // Calculate launch velocity based on power (0-100)
        const power = data.power || 50;
        const velocityY = 2 + (power / 100) * 3; // 2 to 5
        const velocityX = (Math.random() - 0.5) * 2; // Small random horizontal velocity
        
        this.currentBall.setVelocity(velocityX, velocityY);
        
        // Reset multiplier
        this.currentMultiplier = 1;
        
        // Allow launching again after a short delay
        this.time.delayedCall(1000, () => {
            this.isLaunching = false;
        });
    }
    
    override update()
    {
        // Check if ball passed through multiplier zones and prevent stuck balls
        if (this.currentBall && this.currentBall.active) {
            // Anti-stuck mechanism: check if ball is moving too slowly
            const velocity = this.currentBall.body as MatterJS.BodyType;
            const speed = Math.sqrt(velocity.velocity.x ** 2 + velocity.velocity.y ** 2);
            
            // If ball is nearly stopped in the pin field, give it a gentle nudge
            if (speed < 0.3 && this.currentBall.y > 150 && this.currentBall.y < 650) {
                const nudgeX = (Math.random() - 0.5) * 0.5;
                const nudgeY = 0.3;
                this.currentBall.setVelocity(
                    velocity.velocity.x + nudgeX,
                    velocity.velocity.y + nudgeY
                );
            }
            
            this.multiplierZones.forEach(({ zone, multiplier }) => {
                const bounds = zone.getBounds();
                if (this.currentBall && 
                    Phaser.Geom.Rectangle.Contains(bounds, this.currentBall.x, this.currentBall.y)) {
                    
                    if (this.currentMultiplier < multiplier) {
                        this.currentMultiplier = multiplier;
                        this.showMultiplierFeedback(multiplier);
                        EventBus.emit('multiplier-activated', { multiplier });
                    }
                }
            });
            
            // Check if ball is out of bounds (below screen)
            if (this.currentBall.y > this.cameras.main.height + 50) {
                this.resetBallState();
            }
        }
    }
    
    showMultiplierFeedback(multiplier: number)
    {
        if (this.multiplierText) {
            this.multiplierText.destroy();
        }
        
        this.multiplierText = this.add.text(this.cameras.main.width / 2, 200, `${multiplier}x MULTIPLIER!`, {
            fontSize: '40px',
            color: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(101);
        
        this.tweens.add({
            targets: this.multiplierText,
            alpha: 0,
            y: 150,
            duration: 1500,
            onComplete: () => {
                if (this.multiplierText) {
                    this.multiplierText.destroy();
                    this.multiplierText = null;
                }
            }
        });
    }
    
    handleBallInPocket(pocketIndex: number)
    {
        const pocket = this.pockets[pocketIndex];
        const baseScore = pocket.value;
        const scoreDelta = baseScore * this.currentMultiplier;
        
        this.score += scoreDelta;
        this.scoreText.setText(`SCORE: ${this.score}`);
        
        // Visual feedback
        const feedbackText = this.add.text(pocket.x, this.cameras.main.height - 150, `+${scoreDelta}`, {
            fontSize: '32px',
            color: '#FFD700',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(101);
        
        this.tweens.add({
            targets: feedbackText,
            alpha: 0,
            y: this.cameras.main.height - 200,
            duration: 1000,
            onComplete: () => feedbackText.destroy()
        });
        
        // Emit to Angular
        EventBus.emit('score-updated', { score: this.score, delta: scoreDelta });
        EventBus.emit('pocket-landed', { pocketValue: baseScore, multiplier: this.currentMultiplier });
        
        // Remove ball and prepare for next
        this.resetBallState();
    }
    
    resetBallState()
    {
        if (this.currentBall) {
            this.currentBall.destroy();
            this.currentBall = null;
        }
        
        this.ballsRemaining--;
        this.ballsText.setText(`BALLS: ${this.ballsRemaining}`);
        EventBus.emit('balls-remaining', { count: this.ballsRemaining });
        
        if (this.ballsRemaining <= 0) {
            this.time.delayedCall(2000, () => {
                this.endGame();
            });
        } else {
            this.time.delayedCall(500, () => {
                EventBus.emit('launch-ready');
            });
        }
    }
    
    endGame()
    {
        EventBus.emit('game-over', { finalScore: this.score, highScore: false });
        this.scene.start('GameOver', { score: this.score });
    }
    
    resetGame()
    {
        this.score = 0;
        this.ballsRemaining = this.currentStage.ballsPerGame;
        this.currentMultiplier = 1;
        
        this.scoreText.setText('SCORE: 0');
        this.ballsText.setText(`BALLS: ${this.ballsRemaining}`);
        
        EventBus.emit('score-updated', { score: 0, delta: 0 });
        EventBus.emit('balls-remaining', { count: this.ballsRemaining });
        EventBus.emit('launch-ready');
    }

    changeScene ()
    {
        this.scene.start('GameOver', { score: this.score });
    }
    
    shutdown()
    {
        EventBus.off('power-meter-release', this.launchBall, this);
        EventBus.off('game-start', this.resetGame, this);
    }
}
