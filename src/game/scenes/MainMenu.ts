import { GameObjects, Scene } from 'phaser';

import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    logoTween: Phaser.Tweens.Tween | null;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const { width, height } = this.cameras.main;
        
        // Betclic branded background
        this.cameras.main.setBackgroundColor(0x121212);
        
        // Optional background image (if provided)
        // this.background = this.add.image(512, 384, 'background').setAlpha(0.3);

        // Betclic logo
        this.logo = this.add.image(width / 2, 250, 'betclic-logo').setDepth(100);
        this.logo.setScale(0.5);

        // Subtitle
        this.add.text(width / 2, 400, 'FOOTBALL PACHINKO', {
            fontFamily: 'Arial Black',
            fontSize: '42px',
            color: '#ffffff',
            stroke: '#E81E2B',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // Instructions
        const instructionText = this.add.text(width / 2, height - 100, 'Click to Start', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // Pulsing animation on instruction text
        this.tweens.add({
            targets: instructionText,
            alpha: 0.3,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Optional logo (when provided by user)
        // this.logo = this.add.image(512, 400, 'betclic-logo').setDepth(100);

        // Click to start
        this.input.once('pointerdown', () => {
            this.changeScene();
        });

        EventBus.emit('current-scene-ready', this);
    }
    
    changeScene ()
    {
        if (this.logoTween)
        {
            this.logoTween.stop();
            this.logoTween = null;
        }

        this.scene.start('Game');
    }

    moveLogo (vueCallback: ({ x, y }: { x: number, y: number }) => void)
    {
        if (this.logoTween)
        {
            if (this.logoTween.isPlaying())
            {
                this.logoTween.pause();
            }
            else
            {
                this.logoTween.play();
            }
        } 
        else
        {
            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: { value: 750, duration: 3000, ease: 'Back.easeInOut' },
                y: { value: 80, duration: 1500, ease: 'Sine.easeOut' },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (vueCallback)
                    {
                        vueCallback({
                            x: Math.floor(this.logo.x),
                            y: Math.floor(this.logo.y)
                        });
                    }
                }
            });
        }
    }
}
