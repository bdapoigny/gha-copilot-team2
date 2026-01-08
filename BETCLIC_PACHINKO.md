# Betclic Pachinko Game

A physics-based Pachinko game built with Angular 19 and Phaser 3, featuring Betclic's signature red branding.

## 🎮 Game Features

### Core Mechanics
- **Physics-Based Gameplay**: Utilizes Matter.js physics engine for realistic ball movement and collisions
- **Pin Field**: 12 rows of gold pins arranged in a honeycomb pattern for unpredictable ball paths
- **Scoring Pockets**: 7 scoring zones at the bottom with values ranging from 100 to 1000 points
- **Ball Management**: Start with 10 balls per game session

### Distinctive Features
- **Multiplier Zones**: 3 special zones scattered across the playfield that multiply your score:
  - 2x Multiplier (Red zone)
  - 3x Multiplier (Betclic red zone)
  - 5x Multiplier (Gold zone - jackpot!)
- **Dynamic Scoring**: Score is multiplied by the highest multiplier zone the ball passes through
- **Real-Time Feedback**: Visual feedback when balls hit multiplier zones and land in pockets

### Power Meter System
- **Hold-and-Release Mechanic**: Hold the launch button to charge power (0-100%)
- **Sweet Spot**: Hitting 80-90% power zone gives optimal launch (highlighted in gold)
- **Visual Feedback**: Color-coded power bar:
  - Gray (0-30%): Weak launch
  - Orange (31-70%): Medium launch
  - Red (71-100%): Strong launch
  - Gold (80-90%): Sweet spot!

### Betclic Branding
- **Color Scheme**:
  - Primary Red: `#E81E2B`
  - Dark Red: `#B8162A`
  - Bright Red: `#FF2E3E`
  - Gold Accent: `#FFD700`
  - Dark Background: `#0A1F0A` (football field green tint)
- **Styled UI**: All game elements feature Betclic's signature colors
- **Branded Scenes**: Main Menu, Game, and Game Over screens all use Betclic styling
- **Football Theme**: Pins styled as footballs, multiplier zones with stadium effects

## 🚀 Running the Game

```bash
# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev

# Open browser to http://localhost:4200
```

## 🎨 Adding Custom Betclic Assets

The game is currently using programmatically generated graphics (circles and shapes). To add your custom Betclic-branded sprites:

### 1. Prepare Your Assets

Create the following image files:
- `ball.png` - Betclic-branded ball sprite (recommended: 20x20px, red with logo)
- `pin.png` - Pin/peg sprite (recommended: 16x16px, gold or metallic)
- `pocket.png` - Scoring pocket background (optional, can use multiple colors)
- `betclic-logo.png` - Your company logo for splash screen
- `background.png` - Custom background pattern (optional)

### 2. Add Assets to Project

Place your assets in the `/public/assets/` folder.

### 3. Update Preloader Scene

Edit `src/game/scenes/Preloader.ts` and uncomment the asset loading lines:

```typescript
preload ()
{
    this.load.setPath('assets');

    // Uncomment these lines:
    this.load.image('ball', 'ball.png');
    this.load.image('pin', 'pin.png');
    this.load.image('pocket', 'pocket.png');
    this.load.image('betclic-logo', 'betclic-logo.png');
}
```

### 4. Update Game Scene

Edit `src/game/scenes/Game.ts`:

**For Pins:**
Replace the pin creation code (around line 104) with:
```typescript
const pin = this.matter.add.image(x, y, 'pin', undefined, {
    isStatic: true,
    label: 'pin',
    circleRadius: pinRadius,
    restitution: 0.8,
    friction: 0.001
});
```

**For Ball:**
Replace the ball creation code (around line 290) with:
```typescript
this.currentBall = this.matter.add.image(launchX, launchY, 'ball', undefined, {
    label: 'ball',
    circleRadius: 10,
    restitution: 0.7,
    friction: 0.001,
    frictionAir: 0.01
});
```

### 5. Update Main Menu Scene

Edit `src/game/scenes/MainMenu.ts` to show your logo (around line 31):

```typescript
// Uncomment this line:
this.logo = this.add.image(512, 400, 'betclic-logo').setDepth(100);
```

## 🎯 Game Controls

- **Launch Ball**: Hold down the launch button to charge power, release to launch
- **Restart Game**: Click "Play Again" after game over
- **Main Menu**: Click "Main Menu" button to return to the main menu

## 📊 Scoring System

### Base Points (Pockets)
- Edge pockets: 100 points
- Mid pockets: 250 points
- Good pockets: 500 points
- Center pocket: 1000 points (jackpot!)

### Multipliers
- Pass through 2x zone: Double your pocket score
- Pass through 3x zone: Triple your pocket score
- Pass through 5x zone: 5x your pocket score (maximum!)

**Example:** Ball lands in center pocket (1000 pts) after passing through 5x zone = **5000 points!**

## 🔧 Configuration

### Adjusting Game Difficulty

Edit `src/game/scenes/Game.ts`:

**Change number of balls:**
```typescript
this.ballsRemaining = 10; // Line 43 and 428
```

**Adjust gravity:**
```typescript
// In src/game/main.ts, line 19
gravity: { x: 0, y: 1 }, // Increase y for faster falling
```

**Modify pin layout:**
```typescript
// In createPinField() method, around line 88
const rows = 12; // More rows = longer gameplay
const pinsPerRow = 10; // More pins = more chaos
```

**Change multiplier zones:**
```typescript
// In createMultiplierZones() method, around line 121
const zones = [
    { x: 300, y: 350, multiplier: 2, color: 0xFF1744, radius: 50 },
    // Add more zones or adjust positions
];
```

## 🎨 EventBus Communication

The game uses EventBus for Angular-Phaser communication:

### Phaser → Angular Events
- `score-updated`: { score, delta } - Score changes
- `balls-remaining`: { count } - Balls left
- `multiplier-activated`: { multiplier } - Multiplier hit
- `launch-ready`: Ball can be launched
- `launch-disabled`: Ball is currently in play
- `game-over`: { finalScore } - Game ended

### Angular → Phaser Events
- `power-meter-release`: { power } - Launch ball with power level
- `game-start`: Restart game

## 🐛 Troubleshooting

**Ball doesn't fall:**
- Check that Matter.js physics is configured in `src/game/main.ts`
- Verify gravity is set to `{ x: 0, y: 1 }`

**Power meter not working:**
- Ensure you're holding the button down (not clicking)
- Check browser console for EventBus errors

**Assets not loading:**
- Verify asset files are in `/public/assets/`
- Check browser console for 404 errors
- Ensure file names match exactly in Preloader.ts

## 📝 Technical Details

- **Framework**: Angular 19.2.0
- **Game Engine**: Phaser 3.90.0
- **Physics Engine**: Matter.js (built into Phaser)
- **Styling**: CSS with CSS Variables for Betclic colors
- **TypeScript**: 5.7.2

## 🎮 Future Enhancement Ideas

1. **Sound Effects**: Add audio for pin hits, pocket scoring, and multiplier activation
2. **Particle Effects**: Add visual effects for special events
3. **Combo System**: Reward consecutive successful launches
4. **Power-Up Pins**: Special pins that trigger bonus effects
5. **Leaderboard**: Track high scores
6. **Mobile Optimization**: Touch-optimized controls and portrait mode
7. **Achievements**: Unlock achievements for special plays
8. **Fever Mode**: Activate special mode after scoring streak

## 📄 License

MIT License - See LICENSE file for details

---

**Enjoy your Betclic-branded Pachinko game! 🎰**
