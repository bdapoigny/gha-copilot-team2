import { Component, viewChild } from '@angular/core';
import { PhaserGame } from './phaser-game.component';
import { Game } from '../game/scenes/Game';
import { CommonModule } from '@angular/common';
import { EventBus } from '../game/EventBus';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, PhaserGame],
    templateUrl: './app.component.html'
})
export class AppComponent
{
    // Pachinko game state
    public score = 0;
    public ballsRemaining = 10;
    public currentMultiplier = 1;
    public powerLevel = 0;
    public isCharging = false;
    public canLaunch = false;
    public gameOver = false;
    
    private chargeInterval: any = null;
    private readonly chargeSpeed = 2; // % per frame
    private readonly maxPower = 100;

    // New way to get the component instance
    phaserRef = viewChild.required(PhaserGame);

    constructor()
    {
        // Subscribe to game events
        EventBus.on('current-scene-ready', (scene: Phaser.Scene) => {
            if (scene.scene.key === 'Game') {
                this.canLaunch = true;
                this.gameOver = false;
            }
        });
        
        EventBus.on('score-updated', (data: { score: number, delta: number }) => {
            this.score = data.score;
        });
        
        EventBus.on('balls-remaining', (data: { count: number }) => {
            this.ballsRemaining = data.count;
        });
        
        EventBus.on('multiplier-activated', (data: { multiplier: number }) => {
            this.currentMultiplier = data.multiplier;
        });
        
        EventBus.on('launch-ready', () => {
            this.canLaunch = true;
        });
        
        EventBus.on('launch-disabled', () => {
            this.canLaunch = false;
            this.currentMultiplier = 1;
        });
        
        EventBus.on('game-over', (data: { finalScore: number }) => {
            this.gameOver = true;
            this.canLaunch = false;
        });
    }
    
    // Power meter controls
    public startCharging()
    {
        if (!this.canLaunch || this.isCharging) {
            return;
        }
        
        this.isCharging = true;
        this.powerLevel = 0;
        
        this.chargeInterval = setInterval(() => {
            if (this.powerLevel < this.maxPower) {
                this.powerLevel += this.chargeSpeed;
                if (this.powerLevel > this.maxPower) {
                    this.powerLevel = this.maxPower;
                }
            }
        }, 16); // ~60fps
    }
    
    public releaseCharge()
    {
        if (!this.isCharging) {
            return;
        }
        
        this.isCharging = false;
        
        if (this.chargeInterval) {
            clearInterval(this.chargeInterval);
            this.chargeInterval = null;
        }
        
        // Send launch event to Phaser with power level
        EventBus.emit('power-meter-release', { power: this.powerLevel });
        
        // Reset power after short delay
        setTimeout(() => {
            this.powerLevel = 0;
        }, 200);
    }
    
    public cancelCharge()
    {
        if (this.isCharging) {
            this.isCharging = false;
            
            if (this.chargeInterval) {
                clearInterval(this.chargeInterval);
                this.chargeInterval = null;
            }
            
            this.powerLevel = 0;
        }
    }
    
    public getPowerBarColor(): string
    {
        if (this.powerLevel >= 80 && this.powerLevel <= 90) {
            return '#FFD700'; // Gold for sweet spot
        } else if (this.powerLevel > 70) {
            return '#E81E2B'; // Betclic red for high power
        } else if (this.powerLevel > 30) {
            return '#FF9800'; // Orange for medium power
        } else {
            return '#888888'; // Gray for low power
        }
    }
    
    public isInSweetSpot(): boolean
    {
        return this.powerLevel >= 80 && this.powerLevel <= 90;
    }
    
    public restartGame()
    {
        this.score = 0;
        this.ballsRemaining = 10;
        this.currentMultiplier = 1;
        this.powerLevel = 0;
        this.gameOver = false;
        
        EventBus.emit('game-start');
    }
    
    public goToMainMenu()
    {
        const scene = this.phaserRef().scene;
        if (scene) {
            scene.scene.start('MainMenu');
        }
    }
}
