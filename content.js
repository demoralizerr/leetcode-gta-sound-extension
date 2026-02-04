console.log("🎮 LeetCode GTA Extension Loaded");

let audioUnlocked = false;
let submissionInProgress = false;
let lastVerdict = null;

// Track elements that existed before submit
let existingVerdictTexts = new Set();

/* ---------- AUDIO ---------- */
function unlockAudio() {
    if (audioUnlocked) return;
    const a = new Audio();
    a.play().catch(() => {});
    audioUnlocked = true;
    console.log("🔓 Audio unlocked");
}

function playSound(file) {
    const audio = new Audio(chrome.runtime.getURL(`sounds/${file}`));
    audio.volume = 0.6;
    audio.play().catch(err => console.error("🔇 Audio error:", err));
}

/* ---------- INITIAL EXISTING VERDICTS ---------- */
function captureExistingVerdicts() {
    const selectors = [
        '[data-e2e-locator="submission-result"]',
        '.result__status',
        '.text-green-s',
        '.text-red-s',
        '.result__state'
    ];
    existingVerdictTexts.clear();
    selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            if (el.innerText.trim()) existingVerdictTexts.add(el.innerText.trim());
        });
    });
}

/* ---------- SUBMIT CLICK ---------- */
document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    if (btn.innerText?.toLowerCase().includes("submit")) {
        console.log("🚀 Submit clicked");
        unlockAudio();
        submissionInProgress = true;
        lastVerdict = null;
        captureExistingVerdicts(); // remember existing badges
    }
});

/* ---------- VERDICT OBSERVER ---------- */
const INTERMEDIATE = ["pending", "running", "judging"];
const VERDICT_SELECTORS = [
    '[data-e2e-locator="submission-result"]',
    '.result__status',
    '.text-green-s',
    '.text-red-s',
    '.result__state'
];

const observer = new MutationObserver(() => {
    if (!submissionInProgress) return;

    let verdictText = "";

    for (const sel of VERDICT_SELECTORS) {
        const el = document.querySelector(sel);
        if (el && el.innerText.trim() && !existingVerdictTexts.has(el.innerText.trim())) {
            verdictText = el.innerText.trim();
            break;
        }
    }

    if (!verdictText) return;

    // Ignore intermediate states
    const lower = verdictText.toLowerCase();
    if (INTERMEDIATE.some(s => lower.includes(s))) return;

    // Only trigger once per submit
    if (verdictText === lastVerdict) return;
    lastVerdict = verdictText;
    submissionInProgress = false;

    if (lower.includes("accepted")) {
        console.log("🎉 Mission Passed");
        playSound("gta-mission-passed.mp3");
    } else {
        console.log("💀 Mission Failed");
        playSound("gta-mission-failed.mp3");
    }
});

/* ---------- START OBSERVING ---------- */
observer.observe(document.body, {
    childList: true,
    subtree: true
});
