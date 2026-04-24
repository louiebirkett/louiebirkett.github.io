// ============================================
// CONFIGURATION - Edit this section to add your videos!
// ============================================

// Add your video filenames here (place videos in a 'videos' folder)
const videoSources = [
    'videos/1.mp4',
    'videos/2.mp4',
    'videos/3.mp4',
    'videos/4.mp4',
    'videos/5.mp4',
    'videos/6.mp4',
    'videos/7.mp4',
    'videos/8.mp4',
    'videos/9.mp4',
    'videos/10.mp4',
    'videos/11.mp4',
     'videos/12.mp4',
    'videos/13.mp4',
    'videos/14.mp4',
    'videos/15.mp4',
    'videos/16.mp4',
    'videos/17.mp4',
    'videos/18.mp4',
    'videos/19.mp4',
    'videos/20.mp4'
];

// Placeholder emojis used when no videos are provided
const placeholderEmojis = ['🎬', '🎥', '📱', '🎪', '🎭'];


// Return to Player percentages and Win Payout
const RTP = 0.15;           // 35% chance that a spin is a "win"
const WIN_PAYOUT = 100;     // payout for 5-of-a-kind


// ============================================
// GAME STATE
// ============================================

const ITEM_HEIGHT = 425; // Must match CSS .slot-item height
const ITEMS_PER_REEL = 5;
const SPIN_COST = 10;
let credits = 100;
let isSpinning = false;
let useVideos = videoSources.length >= ITEMS_PER_REEL;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Handle start button (needed for browser autoplay policy)
    document.getElementById('start-btn').addEventListener('click', () => {
        document.getElementById('start-overlay').classList.add('hidden');
        initializeReels();
    });
    
    document.getElementById('spin-btn').addEventListener('click', spin);
    updateCreditsDisplay();
});

function initializeReels() {
    const reels = ['reel1', 'reel2', 'reel3', 'reel4', 'reel5'];
    
    reels.forEach(reelId => {
        const reel = document.getElementById(reelId);
        reel.innerHTML = '';
        
        // Create items (we need extras for seamless looping)
        // Pattern: [last, 0, 1, 2, 3, 4, 5, 0, 1] for smooth wrapping
        const indices = [ITEMS_PER_REEL - 1];
        for (let i = 0; i < ITEMS_PER_REEL; i++) indices.push(i);
        for (let i = 0; i < 2; i++) indices.push(i);
        
        indices.forEach(index => {
            const item = createSlotItem(index);
            reel.appendChild(item);
        });
        
        // Start at a random position
        const randomStart = Math.floor(Math.random() * ITEMS_PER_REEL);
        reel.style.transform = `translateY(-${(randomStart + 1) * ITEM_HEIGHT}px)`;
        reel.dataset.currentIndex = randomStart;
    });

    
    // Play initial visible videos
    playVisibleVideos();
}

function playVisibleVideos() {
    const reels = ['reel1', 'reel2', 'reel3', 'reel4', 'reel5'];
    
    reels.forEach(reelId => {
        const reel = document.getElementById(reelId);
        const currentIndex = parseInt(reel.dataset.currentIndex);
        const items = reel.querySelectorAll('.slot-item');
        
        items.forEach(item => {
            const video = item.querySelector('video');
            if (!video) return;
            
            if (parseInt(item.dataset.index) === currentIndex) {
                video.currentTime = 0;
                video.play().catch(e => console.log('Autoplay blocked:', e));
            } else {
                video.pause();
            }
        });
    });
}



function createSlotItem(index) {
    const item = document.createElement('div');
    item.className = 'slot-item';
    item.dataset.index = index;
    
    if (useVideos && videoSources[index]) {
        const video = document.createElement('video');
        video.src = videoSources[index];
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        item.appendChild(video);
    } else {
        // Use placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder';
        placeholder.textContent = placeholderEmojis[index] || '🎰';
        item.appendChild(placeholder);
    }
    
    return item;
}

// ============================================
// SPINNING LOGIC
// ============================================

function randomIndex() {
    return Math.floor(Math.random() * ITEMS_PER_REEL);
}

function generateResults() {
    const isWin = Math.random() < RTP;

    // WIN: force all reels to same symbol
    if (isWin) {
        const winIndex = randomIndex();
        return [winIndex, winIndex, winIndex, winIndex, winIndex];
    }

    // LOSE: ensure not all reels match
    let results;
    do {
        results = [
            randomIndex(),
            randomIndex(),
            randomIndex(),
            randomIndex(),
            randomIndex()
        ];
    } while (results.every(r => r === results[0]));

    return results;
}


function spin() {
    if (isSpinning) return;
    resetAllVideoAudio();

    if (credits < SPIN_COST) {
        showResult('NOT ENOUGH CREDITS!', 'lose');
        return;
    }

    isSpinning = true;
    credits -= SPIN_COST;
    updateCreditsDisplay();
    showResult('SPINNING...', '');

    // Clear previous winners
    document.querySelectorAll('.slot-item.winner').forEach(el => {
        el.classList.remove('winner');
    });

    // Pause all videos
    document.querySelectorAll('.slot-item video').forEach(v => v.pause());

    const reels = ['reel1', 'reel2', 'reel3', 'reel4', 'reel5'];

    // 🔥 CONTROLLED RESULTS
    const results = generateResults();

    reels.forEach((reelId, reelIndex) => {
        const reel = document.getElementById(reelId);
        const targetIndex = results[reelIndex];

        const stopDelay = 1000 + (reelIndex * 500);

        animateReel(reel, targetIndex, stopDelay, () => {
            if (reelIndex === reels.length - 1) {
                checkWin(results);
            }
        });
    });
}


function animateReel(reel, targetIndex, stopDelay, onComplete) {
    const currentIndex = parseInt(reel.dataset.currentIndex) || 0;
    
    // Calculate spins (at least 2 full rotations + distance to target)
    const fullSpins = 2;
    const totalItems = ITEMS_PER_REEL;
    
    // We want to land on targetIndex
    // The reel array is: [last, 0, 1, 2, 3, 4, 5, 0, 1]
    // So index 0 is at position 1, index 1 at position 2, etc.
    const targetPosition = targetIndex + 1;
    
    // Start spinning animation
    reel.classList.add('spinning');
    reel.classList.remove('stopping');
    
    let currentOffset = (currentIndex + 1) * ITEM_HEIGHT;
    let spinSpeed = 50; // pixels per frame
    const spinInterval = 16; // ~60fps
    
    const spinAnimation = setInterval(() => {
        currentOffset += spinSpeed;
        
        // Wrap around when we've gone past all items
        const maxOffset = (ITEMS_PER_REEL + 1) * ITEM_HEIGHT;
        if (currentOffset >= maxOffset) {
            currentOffset = ITEM_HEIGHT; // Reset to first real item
        }
        
        reel.style.transform = `translateY(-${currentOffset}px)`;
    }, spinInterval);
    
    // Stop after delay
    setTimeout(() => {
        clearInterval(spinAnimation);
        
        // Smoothly stop at target
        reel.classList.remove('spinning');
        reel.classList.add('stopping');
        
const reelWindow = reel.parentElement;
const windowHeight = reelWindow.offsetHeight;

// Centering offset
const centerOffset = (windowHeight / 2) - (ITEM_HEIGHT / 2);

// Final position
const finalOffset = (targetPosition * ITEM_HEIGHT) - centerOffset;

reel.style.transform = `translateY(-${finalOffset}px)`;
        reel.dataset.currentIndex = targetIndex;
        
        // Play sound effect (optional - add your own sound file)
        // playStopSound();
        
        // Wait for CSS transition to complete
        setTimeout(() => {
            reel.classList.remove('stopping');
            onComplete();
        }, 1000);
        
    }, stopDelay);
}

function resetAllVideoAudio() {
    document.querySelectorAll('.slot-item video').forEach(video => {
        video.pause();
        video.muted = true;
        video.currentTime = 0;
    });
}

// ============================================
// WIN CHECKING
// ============================================

function checkWin(results) {
    isSpinning = false;

    playVisibleVideos();

    const uniqueSymbols = new Set(results).size;
    let payout = 0;

    if (uniqueSymbols === 1) payout = WIN_PAYOUT;       // 5 of a kind
    else if (uniqueSymbols === 2) payout = 15;  // 4+1
    else if (uniqueSymbols === 3) payout = 5;   // 3 match

    if (payout > 0) {
        credits += payout;
        updateCreditsDisplay()
        showResult(`🎉 WIN! +${payout} CREDITS 🎉`, 'win');
        highlightWinners(results);
         if (payout >= WIN_PAYOUT) {
        showBigWin();
        playWinSound();
        launchConfetti();
        playBigWinVideoAudio();
    }
        
    } else {
        showResult('TRY AGAIN!', 'lose');
    }

    document.getElementById('spin-btn').disabled = false;
}
function showBigWin() {
    const banner = document.getElementById("big-win-banner");
    banner.classList.remove("hidden");

    setTimeout(() => {
        banner.classList.add("hidden");
    }, 2500);
}


function highlightWinners(results) {
    const reels = ['reel1', 'reel2', 'reel3', 'reel4', 'reel5'];
    
    reels.forEach((reelId, i) => {
        const reel = document.getElementById(reelId);
        const items = reel.querySelectorAll('.slot-item');
        
        // Find the visible item (the one at currentIndex)
        items.forEach(item => {
            if (parseInt(item.dataset.index) === results[i]) {
                item.classList.add('winner');
            }
        });
    });
}

function playBigWinVideoAudio() {
    const reels = document.querySelectorAll('.reel');

    reels.forEach(reel => {
        const items = reel.querySelectorAll('.slot-item');

        items.forEach(item => {
            const video = item.querySelector('video');
            if (!video) return;

            // ONLY unmute winning visuals
            if (item.classList.contains('winner')) {
                video.muted = false;
                video.volume = 0.8;
                video.currentTime = 0;
                video.play().catch(e => console.log(e));
            }
        });
    });
}

// ============================================
// UI UPDATES
// ============================================

function updateCreditsDisplay() {
    document.getElementById('credits').textContent = credits;
    
    // Disable spin button if not enough credits
    const spinBtn = document.getElementById('spin-btn');
    if (credits < SPIN_COST) {
        spinBtn.disabled = true;
    }
}

function showResult(text, className) {
    const resultEl = document.getElementById('result-text');
    resultEl.textContent = text;
    resultEl.className = className;
}

// ============================================
// OPTIONAL: Sound effects (uncomment if you add sound files)
// ============================================


function playStopSound() {
    const audio = new Audio('sounds/stop.mp3');
    audio.volume = 0.3;
    audio.play();
}

function playWinSound() {
    const audio = new Audio('sounds/win.mp3');
    audio.volume = 0.5;
    audio.play();
}
function launchConfetti() {
    const duration = 2 * 1000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 6,
            spread: 70,
            startVelocity: 35,
            origin: { x: Math.random(), y: Math.random() - 0.2 }
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
}

