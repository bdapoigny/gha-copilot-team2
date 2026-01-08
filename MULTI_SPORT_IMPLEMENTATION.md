# Multi-Sport Implementation Guide

## Overview
The Betclic Pachinko game now supports multiple sport stages (Football and Basketball initially). Each stage has its own background, ball variants, and hardcoded pin positions.

## Key Changes Made

### 1. Stage Configuration System (`src/game/StageConfig.ts`)
- **Purpose**: Central configuration for all sport stages
- **Features**:
  - Defines `StageConfig` interface with assets, pins, multipliers, and gameplay settings
  - Exports `FOOTBALL_STAGE` and `BASKETBALL_STAGE` configurations
  - Helper function `generateHoneycombPins()` for pin layout patterns
  - `getStageById()` utility function

### 2. Dynamic Asset Loading (`src/game/scenes/Preloader.ts`)
- **Changes**: 
  - Imports `STAGES` from StageConfig
  - Loops through all stages to load backgrounds and ball variants
  - Asset naming convention: `bg-{stageId}` and `ball-{stageId}-{1-4}`

### 3. Stage Selection Scene (`src/game/scenes/StageSelection.ts`)
- **New Scene**: Interactive stage selection interface
- **Features**:
  - Displays cards for each available sport
  - Preview of stage backgrounds
  - "PLAY" button per stage
  - Back button to return to main menu
  - Emits `stage-selected` event with chosen stage config
  - Passes stage data to Game scene

### 4. Main Game Registration (`src/game/main.ts`)
- **Changes**: Added `StageSelection` to scene array between MainMenu and Game scenes

### 5. Refactored Game Scene (`src/game/scenes/Game.ts`)
- **Major Changes**:
  - Added `currentStage` property to store selected stage
  - New `init()` method receives stage data from scene transition
  - Dynamic background loading based on `currentStage.id`
  - Pin creation from hardcoded positions in config (not procedurally generated)
  - Random ball variant selection from stage's ball array
  - Multiplier zones from stage config
  - Pocket values from stage config
  - Ball count per game from stage config
  - Stage name in UI title

### 6. Main Menu Navigation (`src/game/scenes/MainMenu.ts`)
- **Changes**: Modified `changeScene()` to navigate to `StageSelection` instead of directly to `Game`

## Asset Structure

```
/public/assets/
├── bg_football.png          # Football field with integrated pins
├── bg_basketball.png        # Basketball court with integrated pins
├── ball_football1.png       # Football ball variant 1
├── ball_football2.png       # Football ball variant 2
├── ball_football3.png       # Football ball variant 3
├── ball_football4.png       # Football ball variant 4
├── ball_basketball1.png     # Basketball ball variant 1
├── ball_basketball2.png     # Basketball ball variant 2
├── ball_basketball3.png     # Basketball ball variant 3
├── ball_basketball4.png     # Basketball ball variant 4
├── betclic-logo.png         # Existing Betclic branding
└── background.png           # Existing (used in Boot scene)
```

## Game Flow

1. **Boot** → Loads initial assets
2. **Preloader** → Loads all stage assets (backgrounds + balls for all sports)
3. **MainMenu** → Click to continue
4. **StageSelection** → Choose Football or Basketball
5. **Game** → Play with selected stage configuration
6. **GameOver** → Show results

## Pin Position Implementation

### Background-Based Approach
Pins are hardcoded in `StageConfig.ts` to match the white/black pins already drawn on the background images:

```typescript
pins: [
    { x: 100, y: 150 },
    { x: 180, y: 150 },
    // ... more positions matching background
]
```

### Current Implementation
Uses `generateHoneycombPins()` helper that creates a honeycomb pattern. You can:
1. **Keep generated patterns**: Adjust parameters in StageConfig
2. **Replace with manual coordinates**: Replace the array with exact x,y positions matching your background

Example of manual pin positions:
```typescript
pins: [
    { x: 120, y: 140 },
    { x: 200, y: 140 },
    { x: 280, y: 140 },
    // ... continue for all visible pins in background
]
```

## Customization Guide

### Adding a New Sport (e.g., Tennis)

1. **Add assets to `/public/assets/`**:
   - `bg_tennis.png`
   - `ball_tennis1.png` through `ball_tennis4.png`

2. **Create stage config in `StageConfig.ts`**:
```typescript
export const TENNIS_STAGE: StageConfig = {
    id: 'tennis',
    name: 'tennis',
    displayName: 'Tennis',
    theme: 'Grand Slam',
    assets: {
        background: 'bg_tennis.png',
        balls: ['ball_tennis1.png', 'ball_tennis2.png', 'ball_tennis3.png', 'ball_tennis4.png']
    },
    pins: generateHoneycombPins({ /* params */ }),
    multiplierZones: [
        { x: 320, y: 340, multiplier: 2, color: 0x00FF00, radius: 50 },
        // ... more zones
    ],
    pocketValues: [200, 400, 800, 2000, 800, 400, 200],
    ballsPerGame: 10,
    ballRadius: 10,
    pinRadius: 8
};
```

3. **Add to STAGES array**:
```typescript
export const STAGES: StageConfig[] = [
    FOOTBALL_STAGE,
    BASKETBALL_STAGE,
    TENNIS_STAGE  // Add here
];
```

4. **Done!** The game will automatically:
   - Load the new assets in Preloader
   - Display the new stage in StageSelection
   - Support gameplay with the new configuration

### Adjusting Pin Positions

To match pins exactly to your background image:

1. Open your background in an image editor
2. Note the x,y coordinates of each pin
3. Replace the generated pins array in StageConfig:

```typescript
pins: [
    { x: 115, y: 145 },  // Top-left pin
    { x: 195, y: 145 },  // Next pin to the right
    { x: 275, y: 145 },  // Continue...
    { x: 355, y: 145 },
    // Row 2 (offset for honeycomb)
    { x: 155, y: 195 },
    { x: 235, y: 195 },
    // ... continue for all pins
]
```

### Modifying Multiplier Zones

Each stage can have different multiplier placements and colors:

```typescript
multiplierZones: [
    { 
        x: 300,           // Horizontal position
        y: 350,           // Vertical position
        multiplier: 2,    // Score multiplier value
        color: 0xE81E2B,  // Zone color (hex)
        radius: 50        // Zone size
    },
    // ... more zones
]
```

### Changing Pocket Values

Customize scoring for each sport:

```typescript
pocketValues: [100, 250, 500, 1000, 500, 250, 100],  // Football
pocketValues: [150, 300, 600, 1500, 600, 300, 150],  // Basketball (higher)
```

## Ball Variant System

### How It Works
1. Game scene receives stage configuration
2. On each ball launch, randomly selects one of the 4 ball variants
3. Loads the corresponding asset key: `ball-{stageId}-{1-4}`

### Implementation
```typescript
// In Game.ts launchBall() method
const ballIndex = Phaser.Math.Between(1, this.currentStage.assets.balls.length);
const ballKey = `ball-${this.currentStage.id}-${ballIndex}`;
this.currentBall = this.matter.add.image(launchX, launchY, ballKey, ...);
```

## Testing Checklist

- [ ] All assets load without 404 errors
- [ ] Stage selection displays both sports correctly
- [ ] Clicking PLAY on each stage starts the game
- [ ] Background changes based on selected stage
- [ ] Balls appear with sport-specific designs
- [ ] Random ball variants show up (play multiple times)
- [ ] Pins match the background image positions
- [ ] Multiplier zones work correctly for each stage
- [ ] Pocket values differ between sports
- [ ] Back button from stage selection works
- [ ] Score and balls remaining display correctly
- [ ] Game over works after all balls used

## Future Enhancements

1. **Stage Unlocking**: Add `unlockRequirement` to stage configs
2. **Stage Stats**: Track best scores per stage
3. **Difficulty Levels**: Easy/Medium/Hard variations per sport
4. **Seasonal Themes**: Holiday-themed variants of existing stages
5. **Tournament Mode**: Play all stages in sequence
6. **Custom Pin Physics**: Different pin materials per sport (rubber for basketball, harder for football)

## Troubleshooting

**Assets not loading:**
- Check file paths match exactly (case-sensitive)
- Verify assets are in `/public/assets/`
- Open browser console to see 404 errors
- Check Network tab in DevTools

**Pins don't match background:**
- Use image editor to get exact coordinates
- Remember: origin is top-left (0,0)
- Test with visible pins (uncomment debug mode in main.ts)

**Stage selection not appearing:**
- Verify StageSelection is registered in main.ts scene array
- Check MainMenu navigates to 'StageSelection' not 'Game'
- Look for errors in browser console

**Wrong ball appearing:**
- Check asset naming: `ball_[sport][1-4].png`
- Verify Preloader loads all 4 variants
- Check texture keys in Phaser DevTools
