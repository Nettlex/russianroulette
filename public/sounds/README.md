# 🔊 Sound Effects Required

## Add Your Sound Files Here

Place these 3 sound files in the `/public/sounds/` directory:

### Required Files:
1. **click1.mp3**, **click2.mp3**, **click3.mp3** - Empty chamber click variations
2. **bang.mp3** - Gunshot sound (when you die)  
3. **spin1.mp3**, **spin2.mp3** - Chamber spinning sound variations
4. **loading.mp3** - Bullet loading sound (cylinder opening/closing)

## Quick Setup

### Option 1: Download Free Sounds
Visit these sites and search for gun sounds:
- **Freesound.org**: https://freesound.org/ (best quality, free)
- **Zapsplat**: https://www.zapsplat.com/ (requires free account)
- **Pixabay**: https://pixabay.com/sound-effects/ (no account needed)

**Search for:**
- "gun click" or "trigger click" → save as `click1.mp3`, `click2.mp3`, `click3.mp3`
- "gunshot" or "revolver shot" → save as `bang.mp3`
- "gun spin" or "cylinder spin" → save as `spin1.mp3`, `spin2.mp3`
- "gun reload" or "revolver cylinder open" → save as `loading.mp3`

### Option 2: Use Placeholder Sounds (For Testing)
If you don't have sounds yet, the app will still work - it just won't play audio. You can add them later!

## File Format
- Format: MP3 (preferred) or WAV
- File size: Keep under 100KB each for fast loading
- Sample rate: 44.1kHz is fine
- Mono or stereo: Either works

## Placement
```
public/
  sounds/
    click.mp3  ← Place here
    bang.mp3   ← Place here
    spin.mp3   ← Place here
    README.md  ← You're here!
```

## The App Uses These Sounds For:
- `click1.mp3`, `click2.mp3`, `click3.mp3` - Plays when trigger pulled and chamber is empty (random variation)
- `bang.mp3` - Plays when you get shot (chamber had bullet)
- `spin1.mp3`, `spin2.mp3` - Plays when you spin the cylinder (random variation)
- `loading.mp3` - Plays when loading bullet into cylinder (STEP 0)

## Volume
Default volume is set to 50% (0.5). You can adjust this in the code if needed.

## License Note
Make sure any sound effects you download have appropriate licenses for your use case (commercial vs personal).

---

**Quick Test:** After adding files, click Load Bullet → Pull Trigger and you should hear the click sound!

