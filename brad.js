// Game variables
const player = document.getElementById('player');
const enemy = document.getElementById('enemy');
const gameContainer = document.getElementById('game-container');
const gameOver = document.getElementById('game-over');
const scoreDisplay = document.getElementById('score-display');
const finalScore = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const healthBarContainer = document.createElement('div');
const healthBar = document.createElement('div');
const healthBarText = document.createElement('div');

// Player variables
let playerX = window.innerWidth / 2;
let playerY = window.innerHeight - 100;
let playerVelocityY = 0;
let playerIsJumping = false;
let playerCanDoubleJump = false;
let playerHasDoubleJumped = false;
let playerOnPlatform = false;
let playerIsDescending = false;
let lastPlayerY = 0;
let coyoteTimeCounter = 0;
let upKeyPressed = false;
let playerBullets = [];
let keys = {};

// Enemy variables
let enemyX, enemyY;
let enemyHealth = 100;
let maxEnemyHealth = 100;
let enemyHitTime = 0;
let bullets = [];

let platforms = [];
let gameActive = false;
let gameTime = 0;
let gameInterval;
let enemyDirection = 1;
let difficultyLevel = 1;
let lastShotTime = 0;
let lastEnemyMove = 0;
let enemySpeed = 3;
let targetEnemyY = 0; 

// Physics 
const GRAVITY = 0.5;
const COYOTE_TIME = 21;
const JUMP_FORCE = -12;
const DOUBLE_JUMP_FORCE = -10;
const TERMINAL_VELOCITY = 12;
const PLATFORM_COUNT = 5;
const PLAYER_HEIGHT = 60;
const PLATFORM_THICKNESS = 15;


// Projectiles
const privacyTerms = [
    "Fourth Amendment", "Katz Test", "Carpenter Test", "Search", "Seizure", 
    "Warrant", "Privacy", "GDPR", "One-party Consent", "Two-party Consent",
    "SCA", "Wiretap Act", "CSLI", "Personal Data", "Personal info", "Consent",
    "Cookies", "Privacy Policy", "Terms of Use", "Web Bugs", "Roe v. Wade",
    "Clarence Thomas", "Stengart v. Loving Care", "Facebook", "Google", "Meta",
    "Riley v. California", "Ontario v. Quon", "Ryan Sandler", "Brad Rosen",
    "Professor Rosen", "Cecillia Xie", "Digital Age", "Nudity", "California v. Greenwood",
    "Carpenter v. U.S.", "Scalia", "Aggregation", "Social Media", "Data Brokers",
    "CCPA", "Data Breach", "Reasonable Expectation", 
    "Third Party Doctrine", "Metadata", "Surveillance", 
    "Data Mining", "Encryption", "Biometrics"
];

// Shoot sound effect
const shootSound = new Audio('audio/shoot.mp3');
shootSound.volume = 1.0;
// Hit sound effect
// Avoid overlapping
const hitSoundPool = [
    new Audio('audio/hit.mp3'),
    new Audio('audio/hit.mp3'),
    new Audio('audio/hit.mp3')
];
hitSoundPool.forEach(sound => sound.volume = 0.4);
let currentHitSound = 0;

// Defeat sound effect
const defeatSound = new Audio('audio/defeat-scream.mp3');
defeatSound.volume = 1.0;

// Background music
const backgroundMusic = new Audio('audio/background-music.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.2;

// Track frame timing
let lastFrameTime = 0;
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

// Initialize player position
function initPlayer() {
    playerX = 100;
    playerY = window.innerHeight - 100;
    lastPlayerY = playerY;
    playerVelocityY = 0;
    playerIsJumping = false;
    playerCanDoubleJump = false;
    playerHasDoubleJumped = false;
    playerOnPlatform = false;
    playerIsDescending = false;
    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';
}

// Initialize Brad position
function initEnemy() {
    enemyX = window.innerWidth - 150;
    enemyY = 100;
    targetEnemyY = enemyY;
    enemy.style.left = enemyX + 'px';
    enemy.style.top = enemyY + 'px';

    // Initialize Brad health
    enemyHealth = 100 + (difficultyLevel * 20);
    maxEnemyHealth = enemyHealth;

    // Create health bar if it doesn't exist
    if (!healthBarContainer.parentElement) {
        // Health bar container
        healthBarContainer.className = 'health-bar-container';
        healthBarContainer.style.position = 'fixed';
        healthBarContainer.style.top = '10px';
        healthBarContainer.style.left = '10px';
        healthBarContainer.style.width = '80%';
        healthBarContainer.style.height = '25px';
        healthBarContainer.style.backgroundColor = '#333';
        healthBarContainer.style.border = '2px solid #000';
        healthBarContainer.style.borderRadius = '5px';
        
        // Actual health bar
        healthBar.className = 'health-bar';
        healthBar.style.width = '100%';
        healthBar.style.height = '100%';
        healthBar.style.backgroundColor = '#ff0000';
        healthBar.style.transition = 'width 0.2s';
        
        // Health text
        healthBarText.className = 'health-bar-text';
        healthBarText.style.position = 'absolute';
        healthBarText.style.top = '0';
        healthBarText.style.width = '100%';
        healthBarText.style.height = '100%';
        healthBarText.style.display = 'flex';
        healthBarText.style.alignItems = 'center';
        healthBarText.style.justifyContent = 'center';
        healthBarText.style.color = 'white';
        healthBarText.style.fontWeight = 'bold';
        healthBarText.style.textShadow = '1px 1px 1px #000';
        
        healthBarContainer.appendChild(healthBar);
        healthBarContainer.appendChild(healthBarText);
        document.body.appendChild(healthBarContainer);
    }
    
    // Update health display
    updateHealthBar()
    lastFrameTime = 0;
}

// Update and visualize the health bar
function updateHealthBar() {
    const healthPercent = (enemyHealth / maxEnemyHealth) * 100;
    healthBar.style.width = healthPercent + '%';
    healthBarText.textContent = `Professor Rosen's Health: ${Math.ceil(enemyHealth)}/${maxEnemyHealth}`;
    
    // Change color based on remaining health
    if (healthPercent > 50) {
        healthBar.style.backgroundColor = '#ff0000';
    } else if (healthPercent > 25) {
        healthBar.style.backgroundColor = '#ff7700';
    } else {
        healthBar.style.backgroundColor = '#ff9900';
    }
}


// Generate a new random target
function updateEnemyTarget() {
    // Randomize target position
    const margin = 150;
    targetEnemyY = Math.random() * (window.innerHeight - margin * 2) + margin;
    
    // Higher difficulty = more erratic and faster movement
    enemySpeed = 3 + (difficultyLevel * 0.8);
}

// Game loop
function gameLoop(timestamp) {
    if (!gameActive) return;

    // Calculate delta time for frame rate independence
    if (!lastFrameTime) lastFrameTime = timestamp;
    const deltaTime = (timestamp - lastFrameTime) / FRAME_TIME;
    lastFrameTime = timestamp;
        
    const cappedDelta = Math.min(deltaTime, 3);

    // Apply gravity to player
    if (!playerOnPlatform || playerIsJumping) {
        playerVelocityY += GRAVITY * cappedDelta;
        
        if (playerVelocityY > TERMINAL_VELOCITY) {
            playerVelocityY = TERMINAL_VELOCITY;
        }
    }

    // Handle horizontal movement
    const moveSpeed = 7 * cappedDelta;
    if (keys.ArrowLeft && playerX > 0) {
        playerX -= moveSpeed;
    }
    if (keys.ArrowRight && playerX < window.innerWidth - 60) {
        playerX += moveSpeed;
    }
    
    // Handle jumping 
    if (keys.ArrowUp && !upKeyPressed) {
        upKeyPressed = true;
        
        if (playerOnPlatform || coyoteTimeCounter > 0) {
            // First jump from platform or during coyote time
            playerVelocityY = JUMP_FORCE;
            playerIsJumping = true;
            playerOnPlatform = false;
            playerCanDoubleJump = true;
            playerHasDoubleJumped = false;
            playerIsDescending = false;
            coyoteTimeCounter = 0;
        } else if (playerIsDescending) {
            // Allow jumping out of descending state
            playerVelocityY = JUMP_FORCE;
            playerIsJumping = true;
            playerIsDescending = false;
            
            playerCanDoubleJump = true;
            playerHasDoubleJumped = false;
        } else if (playerCanDoubleJump && !playerHasDoubleJumped) {
            // Double jump in mid-air
            playerVelocityY = DOUBLE_JUMP_FORCE;
            playerHasDoubleJumped = true;
            playerCanDoubleJump = false;
        }
    } else if (!keys.ArrowUp) {
        upKeyPressed = false;
    }
    
    // Handle descending through platforms
    if (keys.ArrowDown && playerOnPlatform) {
        // Check if player is on a platform that's not ground
        let onNonGroundPlatform = false;
        for (const platform of platforms) {
            if (!platform.isGround) {
                const playerBottom = playerY + PLAYER_HEIGHT;
                const playerLeft = playerX;
                const playerRight = playerX + 60;
                
                if (playerBottom >= platform.y - 2 && 
                    playerBottom <= platform.y + 5 && 
                    playerRight > platform.x && 
                    playerLeft < platform.x + platform.width) {
                    onNonGroundPlatform = true;
                    break;
                }
            }
        }

        // Only allow descending if on a non-ground platform
        if (onNonGroundPlatform) {
            playerIsDescending = true;
            playerOnPlatform = false;
            playerY += 5; 
        }
    }

    // Apply vertical velocity
    playerY += playerVelocityY * cappedDelta;

    // Check if player falls off the bottom of the screen (past the ground platform)
    if (playerY > window.innerHeight + 100 || (playerX > window.innerWidth/2 && playerY > window.innerHeight - PLAYER_HEIGHT - 30)) {
        endGame();
        return;
    }

    if (playerY > window.innerHeight - PLAYER_HEIGHT - 20) { // -20 is ground height
        playerY = window.innerHeight - PLAYER_HEIGHT - 20;
        playerVelocityY = 0;
        playerIsJumping = false;
        playerOnPlatform = true;
        playerCanDoubleJump = false;
        playerHasDoubleJumped = false;
    }
    
    // Check platform collisions
    handlePlatformCollisions();
    
    // Prevent player from going below the screen
    if (playerY > window.innerHeight - PLAYER_HEIGHT) {
        playerY = window.innerHeight - PLAYER_HEIGHT;
        playerVelocityY = 0;
        playerIsJumping = false;
        playerOnPlatform = true;
        playerCanDoubleJump = false;
        playerHasDoubleJumped = false;
    }

    // Handle player shooting
    if (keys[' '] && gameActive) {
        // Limit shooting rate - one shot every 300ms
        const currentTime = Date.now();
        if (currentTime - lastShotTime > 300) {
            shootPlayerBullet();
            lastShotTime = currentTime;
        }
    }
    
    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';

    const currentTime = Date.now();
    
    // Randomly change direction more frequently as difficulty increases
    // Higher difficulty = more frequent direction changes
    const changeInterval = Math.max(3000 - (difficultyLevel * 250), 300);
    if (currentTime - lastEnemyMove > changeInterval) {
        updateEnemyTarget();
        lastEnemyMove = currentTime;
    }
    
    // Move enemy toward target position
    if (Math.abs(enemyY - targetEnemyY) > 5) {
        // Move toward target with speed based on difficulty
        const adjustedSpeed = enemySpeed * cappedDelta;
        if (enemyY < targetEnemyY) {
            enemyY += adjustedSpeed;
        } else {
            enemyY -= adjustedSpeed;
        }
    } else {
        // for more erratic movement at higher difficulties
        if (Math.random() < 0.01 * difficultyLevel) {
            updateEnemyTarget();
        }
    }
    
    // Keep enemy in bounds
    if (enemyY <= 50) {
        enemyY = 50;
        updateEnemyTarget(); // Bounce off top
    } else if (enemyY >= window.innerHeight - 180) {
        enemyY = window.innerHeight - 180;
        updateEnemyTarget(); // Bounce off bottom
    }

    // Ensure enemy stays on right side of screen
    enemyX = window.innerWidth - 150;
    enemy.style.left = enemyX + 'px';
    enemy.style.top = enemyY + 'px';
    
    enemy.style.top = enemyY + 'px';
    
    // Update bullets
    updateBullets();

    // Update player bullets
    updatePlayerBullets();
    
    // Check collisions
    checkCollisions();
    
    // Update score
    gameTime += 0.016 * cappedDelta;
    scoreDisplay.textContent = `Time: ${Math.floor(gameTime)}s`;
    
    // Increase difficulty based on time
    difficultyLevel = 1 + Math.floor(gameTime / 10);
    
    requestAnimationFrame(gameLoop);
}

// Create a new bullet
function createBullet() {
    if (!gameActive) return;
    
    // Create either a regular bullet or a privacy term bullet
    const privacyTermChance = 0.3 + (difficultyLevel * 0.02);
    const useTextBullet = Math.random() < privacyTermChance;
    
    if (useTextBullet) {
        // Create a privacy term bullet
        const term = document.createElement('div');
        term.className = 'privacy-term';
        term.textContent = privacyTerms[Math.floor(Math.random() * privacyTerms.length)];
        
        // Position the bullet
        const bulletX = enemyX + 65 - term.clientWidth;
        const bulletY = enemyY + 65;
        
        term.style.left = bulletX + 'px';
        term.style.top = bulletY + 'px';
        
        // Calculate direction towards player with some randomness
        // More randomness and higher speed at higher difficulties
        const randomFactor = 0.4 + (difficultyLevel * 0.1);
        const angle = Math.atan2((playerY + 30) - bulletY, (playerX + 30) - bulletX) + 
                      (Math.random() - 0.5) * randomFactor;
        
        // Increase speed with difficulty
        const speedMultiplier = 1.8 + (difficultyLevel * 0.4);
        
        // Store bullet data
        bullets.push({
            element: term,
            x: bulletX,
            y: bulletY,
            speedX: Math.cos(angle) * speedMultiplier,
            speedY: Math.sin(angle) * speedMultiplier,
            isText: true
        });
        
        gameContainer.appendChild(term);
    } else {
        // Create a regular bullet
        const bullet = document.createElement('div');
        bullet.className = 'bullet';
        
        // Position the bullet
        const bulletX = enemyX;
        const bulletY = enemyY + 65;
        
        bullet.style.left = bulletX + 'px';
        bullet.style.top = bulletY + 'px';
        
        // Calculate direction towards player with some randomness
        // More randomness and higher speed at higher difficulties
        const randomFactor = 0.3 + (difficultyLevel * 0.1);
        const angle = Math.atan2((playerY + 30) - bulletY, (playerX + 30) - bulletX) + 
                      (Math.random() - 0.5) * randomFactor;
        
        // Increase speed with difficulty
        const speedMultiplier = 3 + (difficultyLevel * 0.7);
        
        // Store bullet data
        bullets.push({
            element: bullet,
            x: bulletX,
            y: bulletY,
            speedX: Math.cos(angle) * speedMultiplier,
            speedY: Math.sin(angle) * speedMultiplier,
            isText: false
        });
        
        gameContainer.appendChild(bullet);
    }
}

// Create a new player bullet
function shootPlayerBullet() {
    if (!gameActive) return;
    
    // Play shooting sound
    if (shootSound.paused || shootSound.ended) {
        // Only reset and play if not already playing
        shootSound.currentTime = 0;
        shootSound.play();
    }

    // Create a player bullet
    const bullet = document.createElement('div');
    bullet.className = 'bullet player-bullet';
    
    // Position the bullet at player position
    const bulletX = playerX + 60;
    const bulletY = playerY + 30 - 7.5;
    
    bullet.style.left = bulletX + 'px';
    bullet.style.top = bulletY + 'px';
    
    // Store bullet data
    playerBullets.push({
        element: bullet,
        x: bulletX,
        y: bulletY,
        speedX: 18,
        speedY: 0 
    });
    
    gameContainer.appendChild(bullet);
}

// Update bullets position
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // Move bullet
        bullet.x += bullet.speedX;
        bullet.y += bullet.speedY;
        
        // Update position
        bullet.element.style.left = bullet.x + 'px';
        bullet.element.style.top = bullet.y + 'px';
        
        // Remove bullets that are out of bounds
        if (bullet.x < -50 || bullet.x > window.innerWidth + 50 || 
            bullet.y < -50 || bullet.y > window.innerHeight + 50) {
            gameContainer.removeChild(bullet.element);
            bullets.splice(i, 1);
        }
    }
}

// Update player bullets position
function updatePlayerBullets() {
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        
        // Move bullet
        bullet.x += bullet.speedX;
        bullet.y += bullet.speedY;
        
        // Update position
        bullet.element.style.left = bullet.x + 'px';
        bullet.element.style.top = bullet.y + 'px';
        
        // Check for collision with Brad
        const bulletRect = bullet.element.getBoundingClientRect();
        const enemyRect = enemy.getBoundingClientRect();
        
        if (bulletRect.left < enemyRect.right && 
            bulletRect.right > enemyRect.left && 
            bulletRect.top < enemyRect.bottom && 
            bulletRect.bottom > enemyRect.top) {
            // Bullet hit Brad
            gameContainer.removeChild(bullet.element);
            playerBullets.splice(i, 1);
            
            // Play hit sound from the pool
            const hitSound = hitSoundPool[currentHitSound];
            hitSound.currentTime = 0;
            hitSound.play();
            // Cycle to next sound in pool
            currentHitSound = (currentHitSound + 1) % hitSoundPool.length;
            
            // Flash Brad white when hit
            enemy.classList.add('hit-flash');
            setTimeout(() => {
                enemy.classList.remove('hit-flash');
            }, 100);
            
            // Reduce Brad health
            enemyHealth -= 1;
            updateHealthBar();
            
            // Check if  Brad is defeated
            if (enemyHealth <= 0) {
                victoryGame();
            }
            
            continue;
        }
        
        // Remove bullets that are out of bounds
        if (bullet.x < -50 || bullet.x > window.innerWidth + 50 || 
            bullet.y < -50 || bullet.y > window.innerHeight + 50) {
            gameContainer.removeChild(bullet.element);
            playerBullets.splice(i, 1);
        }
    }

    // Reset Brad flash effect after a short time
    if (enemyHitTime > 0 && Date.now() - enemyHitTime > 100) {
        enemy.style.filter = 'none';
        enemyHitTime = 0;
    }
}


// Generate platforms
function generatePlatforms() {
    // Clear existing platforms
    platforms.forEach(platform => {
        if (platform.element) {
            gameContainer.removeChild(platform.element);
        }
    });
    platforms = [];
    
    // Calculate platform distribution
    const gameSectionHeight = window.innerHeight - 100;
    const sectionHeight = gameSectionHeight / PLATFORM_COUNT;
    
    // Create ground platform at the bottom
    const ground = document.createElement('div');
    ground.className = 'platform ground';
    ground.style.left = '0px';
    ground.style.top = (window.innerHeight - 20) + 'px';
    ground.style.width = (window.innerWidth / 2) + 'px';
    ground.style.height = '20px';
    gameContainer.appendChild(ground);
    
    platforms.push({
        element: ground,
        x: 0,
        y: window.innerHeight - 20,
        width: window.innerWidth / 2,
        height: 20,
        isGround: true
    });

    // Track the previous platform for positioning
    let prevPlatformX = window.innerWidth / 4;
    let prevPlatformWidth = 0;
    
    // Create elevated platforms
    for (let i = 1; i < PLATFORM_COUNT; i++) {
        const platform = document.createElement('div');
        platform.className = 'platform';
        
        // Vary platform width 
        const width = Math.random() * 120 + 100;
        
        // Calculate max jump distance (horizontal)
        const maxJumpDistance = 160;
        
        // Calculate a valid x position that's reachable from previous platform
        // Randomize position
        let x;
        
        if (i === 1) {
            // Force first platform to be reachable
            x = Math.random() * 200 + 50; // 50-250px from left
        } else {
            // Calculate a position relative to previous platform
            const minX = Math.max(0, prevPlatformX - maxJumpDistance);
            const maxX = Math.min(window.innerWidth / 2 - width, prevPlatformX + prevPlatformWidth + maxJumpDistance);
            
            // Ensure valid range
            if (minX < maxX) {
                x = Math.random() * (maxX - minX) + minX;
            } else {
                x = Math.random() * (window.innerWidth / 2 - width);
            }
        }
        
        // Calculate y position with a smaller jump between platforms
        const verticalVariance = 20;
        const baseHeight = window.innerHeight - (i * sectionHeight) - 20;
        const y = baseHeight + (Math.random() * verticalVariance - verticalVariance/2);
        
        platform.style.left = x + 'px';
        platform.style.top = y + 'px';
        platform.style.width = width + 'px';
        platform.style.height = PLATFORM_THICKNESS + 'px';
        
        gameContainer.appendChild(platform);
        
        platforms.push({
            element: platform,
            x: x,
            y: y,
            width: width,
            height: PLATFORM_THICKNESS
        });
        
        // Save this platform's position for next iteration
        prevPlatformX = x;
        prevPlatformWidth = width;
    }
}

// Apply platform physics
function handlePlatformCollisions() {
    // Track previous platform state for coyote time
    const wasOnPlatform = playerOnPlatform;
    
    // Reset platform states
    playerOnPlatform = false;

    // Record player's downward trajectory
    const isFalling = playerY > lastPlayerY;
    
    // Check each platform for collision
    for (const platform of platforms) {
        // Player dimensions
        const playerLeft = playerX;
        const playerRight = playerX + 60;
        const playerTop = playerY;
        const playerBottom = playerY + PLAYER_HEIGHT;
        
        // Platform dimensions
        const platformLeft = platform.x;
        const platformRight = platform.x + platform.width;
        const platformTop = platform.y;
        const platformBottom = platform.y + platform.height;
        
        // Check if player is directly on a platform
        const isOnPlatform = playerBottom >= platformTop - 2 && 
                           playerBottom <= platformTop + 5 && 
                           playerRight > platformLeft && 
                           playerLeft < platformRight && 
                           playerVelocityY >= 0;
        
        // Check if player passed through platform this frame
        // This helps catch cases where velocity is so high it passes through
        const passedThroughPlatform = 
            lastPlayerY + PLAYER_HEIGHT <= platformTop && 
            playerBottom >= platformTop &&
            playerRight > platformLeft && 
            playerLeft < platformRight;
        
        // If the player is falling and on/passed through a platform
        if ((isOnPlatform || (isFalling && passedThroughPlatform)) && playerVelocityY >= 0) {
            // Ground platform should NEVER be passed through
            if (platform.isGround) {
                playerY = platformTop - PLAYER_HEIGHT;
                playerVelocityY = 0;
                playerIsJumping = false;
                playerOnPlatform = true;
                playerCanDoubleJump = false;
                playerHasDoubleJumped = false;
                playerIsDescending = false;
                break; // Exit the loop - ground takes precedence
            }
            
            // Only descend through platforms if DOWN key is actively pressed
            if (keys.ArrowDown && !platform.isGround) {
                playerIsDescending = true;
                continue; // Skip this platform
            } else {
                // Not pressing down - land on platform
                playerY = platformTop - PLAYER_HEIGHT;
                playerVelocityY = 0;
                playerIsJumping = false;
                playerOnPlatform = true;
                playerCanDoubleJump = false;
                playerHasDoubleJumped = false;
                playerIsDescending = false;
                break; // Once landed, don't check other platforms
            }
        }
    }
    
    // Handle coyote time
    if (wasOnPlatform && !playerOnPlatform && !playerIsJumping) {
        // Just walked off a platform
        coyoteTimeCounter = COYOTE_TIME;
    } else if (!playerOnPlatform) {
        // Decrement coyote time while in air
        coyoteTimeCounter = Math.max(0, coyoteTimeCounter - 1);
    }
    
    // Update last position for next frame
    lastPlayerY = playerY;
}

// Check for collisions
function checkCollisions() {
    const playerRect = player.getBoundingClientRect();
    
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        const bulletRect = bullet.element.getBoundingClientRect();
        
        // Check for collision with player
        if (playerRect.left < bulletRect.right && 
            playerRect.right > bulletRect.left && 
            playerRect.top < bulletRect.bottom && 
            playerRect.bottom > bulletRect.top) {
            endGame();
            return;
        }
    }
}

// Declare victory for player
function victoryGame() {
    gameActive = false;
    finalScore.textContent = Math.floor(gameTime);
    gameOver.textContent = 'VICTORY! YOU HAVE BECOME THE BRADONATOR!';
    gameOver.style.display = 'block';
    
    // Stop bullet creation
    clearInterval(gameInterval);

    // Stop background music
    backgroundMusic.pause();
}


// End the game
function endGame() {
    gameActive = false;
    finalScore.textContent = Math.floor(gameTime);
    gameOver.style.display = 'block';

    // Play defeat sound
    defeatSound.currentTime = 0;
    defeatSound.play();
    
    // Stop bullet creation
    clearInterval(gameInterval);

    // Stop background music
    backgroundMusic.pause();
}

// Start the game
function startGame() {
    // Reset variables
    gameActive = true;
    gameTime = 0;
    bullets.forEach(bullet => gameContainer.removeChild(bullet.element));
    bullets = [];
    playerBullets.forEach(bullet => gameContainer.removeChild(bullet.element));
    playerBullets = [];
    difficultyLevel = 1;
    lastEnemyMove = Date.now();
    enemySpeed = 3;
    playerVelocityY = 0;
    coyoteTimeCounter = 0;
    playerIsJumping = false;
    playerOnPlatform = false;
    playerCanDoubleJump = false;
    playerHasDoubleJumped = false;
    playerIsDescending = false;
    upKeyPressed = false;
    enemyHitTime = 0;
    
    // Initialize positions
    initPlayer();
    initEnemy();

    // Generate platforms
    generatePlatforms();
    
    // Hide start screen and game over screen
    startScreen.style.display = 'none';
    gameOver.style.display = 'none';
    gameOver.style.innerText = 'GAME OVER';

    lastFrameTime = 0;
    
    // Start game loop
    requestAnimationFrame(gameLoop);

    // Reset health display
    updateHealthBar();
    
    // Set interval for creating bullets
    gameInterval = setInterval(() => {
        // Create 1-3 bullets based on difficulty
        const bulletsToCreate = Math.min(1 + Math.floor(difficultyLevel / 3), 3);
        for (let i = 0; i < bulletsToCreate; i++) {
            setTimeout(() => createBullet(), i * (250 - difficultyLevel * 10));
        }
    }, 1300 - Math.min(difficultyLevel * 50, 500));

    // Play background music
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();

}

// Window resize handler
function handleWindowResize() {
    if (gameActive) {
        // Adjust  Brad position
        enemyX = window.innerWidth - 150;
        enemy.style.left = enemyX + 'px';
        
        // Ensure Brad is within vertical bounds
        if (enemyY >= window.innerHeight - 180) {
            enemyY = window.innerHeight - 180;
            enemy.style.top = enemyY + 'px';
        }
        
        // Keep player in bounds
        if (playerX > window.innerWidth - 60) {
            playerX = window.innerWidth - 60;
            player.style.left = playerX + 'px';
        }
        
        // Adjust platform positions
        adjustPlatforms();
    }
}

// Adjust platforms after window resize
function adjustPlatforms() {
    // Update ground platform width
    const groundPlatform = platforms.find(p => p.isGround);
    if (groundPlatform) {
        groundPlatform.width = window.innerWidth / 2;
        groundPlatform.element.style.width = groundPlatform.width + 'px';
    }
    
    // Remove any platforms that are now off-screen
    for (let i = platforms.length - 1; i >= 0; i--) {
        const platform = platforms[i];
        if (!platform.isGround && (platform.x > window.innerWidth || platform.y > window.innerHeight)) {
            if (platform.element) {
                gameContainer.removeChild(platform.element);
            }
            platforms.splice(i, 1);
        }
    }
}

// Event listeners
window.addEventListener('resize', handleWindowResize);

window.addEventListener('keydown', e => {
    keys[e.key] = true;
});

window.addEventListener('keyup', e => {
    keys[e.key] = false;
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// Initialize game
initPlayer();
initEnemy();