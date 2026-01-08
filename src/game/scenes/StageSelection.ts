import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { STAGES, StageConfig } from '../StageConfig';

export class StageSelection extends Scene
{
    constructor ()
    {
        super('StageSelection');
    }

    create ()
    {
        const { width, height } = this.cameras.main;
        
        // Dark background
        this.cameras.main.setBackgroundColor(0x0A0A0A);
        
        // Title
        this.add.text(width / 2, 80, 'SELECT YOUR SPORT', {
            fontFamily: 'Arial Black',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#E81E2B',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, 140, 'Choose your playing field', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#CCCCCC',
            align: 'center'
        }).setOrigin(0.5);

        // Create stage cards
        const cardWidth = 320;
        const cardHeight = 400;
        const spacing = 100;
        const startX = (width - (STAGES.length * cardWidth + (STAGES.length - 1) * spacing)) / 2 + cardWidth / 2;
        const cardY = height / 2 + 40;

        STAGES.forEach((stage, index) => {
            const x = startX + index * (cardWidth + spacing);
            this.createStageCard(stage, x, cardY, cardWidth, cardHeight, index);
        });

        // Back button
        this.createBackButton();

        EventBus.emit('current-scene-ready', this);
    }

    createStageCard(stage: StageConfig, x: number, y: number, width: number, height: number, index: number)
    {
        // Card container
        const container = this.add.container(x, y);

        // Card background with border
        const cardBg = this.add.rectangle(0, 0, width, height, 0x1A1A1A);
        cardBg.setStrokeStyle(4, 0x333333);
        container.add(cardBg);

        // Background preview (if asset is loaded)
        const bgKey = `bg-${stage.id}`;
        if (this.textures.exists(bgKey)) {
            const preview = this.add.image(0, -60, bgKey);
            preview.setDisplaySize(width - 40, 200);
            container.add(preview);
        } else {
            // Placeholder if background not loaded
            const placeholder = this.add.rectangle(0, -60, width - 40, 200, 0x333333);
            container.add(placeholder);
            const placeholderText = this.add.text(0, -60, 'PREVIEW', {
                fontSize: '18px',
                color: '#666666'
            }).setOrigin(0.5);
            container.add(placeholderText);
        }

        // Sport name
        const title = this.add.text(0, 80, stage.displayName.toUpperCase(), {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        container.add(title);

        // Theme description
        const theme = this.add.text(0, 120, stage.theme, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#CCCCCC',
            align: 'center'
        }).setOrigin(0.5);
        container.add(theme);

        // Play button
        const buttonBg = this.add.rectangle(0, 170, 200, 50, 0xE81E2B);
        buttonBg.setInteractive({ useHandCursor: true });
        container.add(buttonBg);

        const buttonText = this.add.text(0, 170, 'PLAY', {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(buttonText);

        // Hover effects
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0xFF2E3E);
            buttonBg.setScale(1.05);
            cardBg.setStrokeStyle(4, 0xE81E2B);
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0xE81E2B);
            buttonBg.setScale(1);
            cardBg.setStrokeStyle(4, 0x333333);
        });

        buttonBg.on('pointerdown', () => {
            buttonBg.setScale(0.95);
        });

        buttonBg.on('pointerup', () => {
            buttonBg.setScale(1.05);
            this.selectStage(stage);
        });

        // Card entrance animation
        container.setAlpha(0);
        container.setY(y + 50);
        this.tweens.add({
            targets: container,
            alpha: 1,
            y: y,
            duration: 500,
            delay: index * 150,
            ease: 'Back.easeOut'
        });
    }

    createBackButton()
    {
        const backButton = this.add.text(50, 50, '← BACK', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#CCCCCC'
        }).setOrigin(0, 0.5);

        backButton.setInteractive({ useHandCursor: true });

        backButton.on('pointerover', () => {
            backButton.setColor('#ffffff');
            backButton.setScale(1.1);
        });

        backButton.on('pointerout', () => {
            backButton.setColor('#CCCCCC');
            backButton.setScale(1);
        });

        backButton.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }

    selectStage(stage: StageConfig)
    {
        // Emit stage selection event
        EventBus.emit('stage-selected', stage);

        // Transition to game with selected stage
        this.cameras.main.fadeOut(300, 0, 0, 0);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Game', { stage });
        });
    }
}
