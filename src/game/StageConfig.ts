/**
 * Stage Configuration System
 * Defines sport-specific stages with assets, pin positions, and gameplay settings
 */

export interface PinPosition {
    x: number;
    y: number;
}

export interface MultiplierZone {
    x: number;
    y: number;
    multiplier: number;
    color: number;
    radius: number;
}

export interface StageAssets {
    background: string;
    balls: string[]; // Array of ball variant paths (e.g., ball_football1.png, ball_football2.png, etc.)
}

export interface StageConfig {
    id: string;
    name: string;
    displayName: string;
    theme: string;
    
    // Asset paths
    assets: StageAssets;
    
    // Pin positions (hardcoded based on background image)
    pins: PinPosition[];
    
    // Multiplier zones
    multiplierZones: MultiplierZone[];
    
    // Scoring configuration
    pocketValues: number[];
    
    // Gameplay settings
    ballsPerGame: number;
    ballRadius: number;
    pinRadius: number;
}

/**
 * Football Stage Configuration
 * Pins are hardcoded to match the bg_football.png background
 */
export const FOOTBALL_STAGE: StageConfig = {
    id: 'football',
    name: 'football',
    displayName: 'Football',
    theme: 'Premier League',
    
    assets: {
        background: 'bg_football.png',
        balls: [
            'ball_football1.png',
            'ball_football2.png',
            'ball_football3.png',
            'ball_football4.png'
        ]
    },
    
    // Honeycomb pattern pins matching football field background
    pins: generateHoneycombPins({
        startX: 100,
        startY: 150,
        rows: 12,
        pinsPerRow: 10,
        horizontalSpacing: 80,
        verticalSpacing: 50
    }),
    
    multiplierZones: [
        { x: 300, y: 350, multiplier: 2, color: 0xE81E2B, radius: 50 }, // Betclic red
        { x: 600, y: 450, multiplier: 3, color: 0xFF2E3E, radius: 50 }, // Bright red
        { x: 450, y: 250, multiplier: 5, color: 0xFFD700, radius: 50 }  // Gold
    ],
    
    pocketValues: [100, 250, 500, 1000, 500, 250, 100],
    
    ballsPerGame: 10,
    ballRadius: 10,
    pinRadius: 8
};

/**
 * Basketball Stage Configuration
 * Pins are hardcoded to match the bg_basketball.png background
 */
export const BASKETBALL_STAGE: StageConfig = {
    id: 'basketball',
    name: 'basketball',
    displayName: 'Basketball',
    theme: 'NBA Court',
    
    assets: {
        background: 'bg_basketball.png',
        balls: [
            'ball_basketball1.png',
            'ball_basketball2.png',
            'ball_basketball3.png',
            'ball_basketball4.png'
        ]
    },
    
    // Different pin layout for basketball court
    pins: generateHoneycombPins({
        startX: 120,
        startY: 140,
        rows: 11,
        pinsPerRow: 9,
        horizontalSpacing: 85,
        verticalSpacing: 55
    }),
    
    multiplierZones: [
        { x: 280, y: 320, multiplier: 2, color: 0xFF6B35, radius: 50 }, // Orange (basketball)
        { x: 650, y: 420, multiplier: 3, color: 0xFF8C42, radius: 50 }, // Bright orange
        { x: 480, y: 230, multiplier: 5, color: 0xFFD700, radius: 50 }  // Gold (championship)
    ],
    
    pocketValues: [150, 300, 600, 1500, 600, 300, 150], // Higher values for basketball
    
    ballsPerGame: 10,
    ballRadius: 10,
    pinRadius: 8
};

/**
 * Helper function to generate honeycomb pin pattern
 */
function generateHoneycombPins(config: {
    startX: number;
    startY: number;
    rows: number;
    pinsPerRow: number;
    horizontalSpacing: number;
    verticalSpacing: number;
}): PinPosition[] {
    const pins: PinPosition[] = [];
    
    for (let row = 0; row < config.rows; row++) {
        const offsetX = (row % 2) * (config.horizontalSpacing / 2); // Offset every other row
        
        for (let col = 0; col < config.pinsPerRow; col++) {
            pins.push({
                x: config.startX + col * config.horizontalSpacing + offsetX,
                y: config.startY + row * config.verticalSpacing
            });
        }
    }
    
    return pins;
}

/**
 * All available stages
 */
export const STAGES: StageConfig[] = [
    FOOTBALL_STAGE,
    BASKETBALL_STAGE
];

/**
 * Get stage configuration by ID
 */
export function getStageById(id: string): StageConfig | undefined {
    return STAGES.find(stage => stage.id === id);
}

/**
 * Default stage (football)
 */
export const DEFAULT_STAGE = FOOTBALL_STAGE;
