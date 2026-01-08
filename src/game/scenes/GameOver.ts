import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class GameOver extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    gameOverText: Phaser.GameObjects.Text;
    scoreText: Phaser.GameObjects.Text;
    finalScore: number = 0;

    constructor ()
    {
        super('GameOver');
    }
    
    init(data: { score: number })
    {
        this.finalScore = data.score || 0;
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x121212);

        const { width, height } = this.cameras.main;

        // Betclic branding background
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x1a0305, 0x1a0305, 0x121212, 0x121212, 1, 1, 1, 1);
        graphics.fillRect(0, 0, width, height);

        // Game Over title
        this.gameOverText = this.add.text(width / 2, height / 2 - 100, 'GAME OVER', {
            fontFamily: 'Arial Black', 
            fontSize: '72px', 
            color: '#E81E2B',
            stroke: '#000000', 
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // Betclic branding
        this.add.text(width / 2, height / 2 - 30, 'BETCLIC PACHINKO', {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Final score display
        this.scoreText = this.add.text(width / 2, height / 2 + 50, `FINAL SCORE: ${this.finalScore}`, {
            fontFamily: 'Arial Black',
            fontSize: '48px',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // Instructions
        this.add.text(width / 2, height / 2 + 130, 'Click to return to Main Menu', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Pulsing animation on score
        this.tweens.add({
            targets: this.scoreText,
            scale: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Click to continue
        this.input.once('pointerdown', () => {
            this.changeScene();
        });
        
        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('MainMenu');
    }
}
