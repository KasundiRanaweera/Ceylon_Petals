# The bouquet-making film

A ~40-second silent film of a florist making a hand-tied bouquet, shown on the home page right after
the "Hand-tied for every *moment*" section (`frontend/src/components/home/BouquetFilm.tsx`).
The section stays hidden until the film files exist, so nothing looks broken in the meantime.

## The film on the site now

The current film is **real footage, not AI**: nine free clips from [Pexels](https://www.pexels.com/license/),
edited into one 40-second story, with a soft piano track: "Gentle" by AlexGrohl
([Pixabay](https://pixabay.com/music/solo-piano-gentle-499635/), Pixabay Content License: free for commercial use,
no credit required), faded in and out so the loop restarts gently. Browsers start videos silently,
so visitors turn the music on with the sound button. The edit trims each clip, crops it around the hands (a wide 16:9
cut for computers, an upright 9:16 cut for phones), gives every shot the same warm golden grade,
and joins them with soft dissolves.

The Pexels licence allows free commercial use with no credit required. It doesn't allow selling the
clips unchanged, or suggesting the people in them endorse the shop. The flowers and studios belong
to other florists, so it shows the craft in general, not our own work. Replace it with footage from
our studio (or an AI film made with the prompts below) when you can.

| # | What it shows | Pexels clip |
| --- | --- | --- |
| 1 | Roses laid out on the table | [6649772](https://www.pexels.com/video/roses-in-different-colors-6649772/) |
| 2 | A hand lifts a sprig of baby's breath | [7607764](https://www.pexels.com/video/hand-holding-a-stem-of-baby-s-breath-7607764/) |
| 3 | Pink roses and baby's breath on the worktable | [34410038](https://www.pexels.com/video/elegant-bouquet-arrangement-with-pink-roses-34410038/) |
| 4 | Hands bring the roses together | [5925967](https://www.pexels.com/video/close-up-video-of-woman-removing-leaves-from-the-stem-5925967/) |
| 5 | Baby's breath gathered round a rose | [6911342](https://www.pexels.com/video/person-arranging-flowers-6911342/) |
| 6 | Tying the ribbon | [6912181](https://www.pexels.com/video/person-tying-flowers-with-a-ribbon-6912181/) |
| 7 | Folding the wrapping paper | [28405817](https://www.pexels.com/video/a-person-is-cutting-a-rose-with-scissors-28405817/) |
| 8 | The wrapped bouquet lifted from the table | [5756290](https://www.pexels.com/video/woman-arranging-flowers-5756290/) |
| 9 | A dome of pink roses | [28405768](https://www.pexels.com/video/a-bouquet-of-pink-roses-is-shown-in-this-photo-28405768/) |

Files: `bouquet-making.mp4` (HD, 1920 × 816, the 2.35 : 1 shape of the frame on the page, 10 MB) and
`bouquet-making-mobile.mp4` (720 × 1080, 6.4 MB), both with music
and their poster images, in `frontend/public/videos/`. To replace the film, overwrite these four
files with the same names. The section needs no code change.

## 1. Before you generate: the reference photo

The reference bouquet photo is **not ours**. "White Lily", another florist's name, is printed on the
wrapping and on the card. So:

- use it only as a **look reference** for the AI tool, never on the website;
- every prompt below asks for **plain, unbranded wrapping** and a **blank card** (or no card);
- reject any clip where a logo or writing appears on the paper, card or ribbon.

Best of all, photograph one of our own finished bouquets in the same style and use that as the reference.

## 2. How to generate it

AI video tools (Google Veo, OpenAI Sora, Kling, Runway, Luma) make short clips, usually 5 to 10
seconds each, so the film is made as **six shots** that are joined afterwards.

1. **Make the final bouquet first, as a still image.** Use an image tool with the reference photo and
   the *Shared look* below, plus "no text, no logo, blank card". Keep the best one. This is the
   **hero still**: every shot should end up looking like it.
2. **Generate shot 6 (the reveal) from the hero still** (image-to-video). The ending then matches exactly.
3. **Generate shots 1–5**, giving the hero still as the reference or "ingredient" image each time.
   If the tool allows a **start frame**, use the last frame of the previous shot, so the flowers and
   hands carry over from shot to shot.
4. Make **2–4 takes of each shot** and keep the one with the most natural hands.
5. For phones, either generate each shot again in **9:16**, or send me the 16:9 shots and I'll crop
   the centre (every prompt keeps the action in the middle, so this works).

**Check every take for:** five fingers per hand, no melting or merging fingers, no roses appearing
from nowhere or changing colour, wrapping that stays the same colour, and no text anywhere.

## 3. Shared look (paste at the end of every prompt)

> Photorealistic, cinematic, shot on 35mm with shallow depth of field and a warm golden-hour grade.
> A warm beige florist studio with dappled golden sunlight and soft leaf shadows falling across the
> wall and a light wooden worktable. Realistic adult female hands with natural, short, neutral nails
> and five fingers per hand, moving slowly and naturally. Flowers: blush-pink and vivid cerise
> hot-pink roses, evenly mixed, with dense white gypsophila (baby's breath). Wrapping: plain pale
> blush-cream paper sheets with thin peach rose-gold edges, no printing. The action stays in the
> centre of the frame. Smooth, slow camera movement. No text, no logos, no watermark, no subtitles.

**Negative prompt** (for tools that take one):

> text, letters, logo, brand name, watermark, subtitles, extra fingers, missing fingers, fused
> fingers, distorted hands, long acrylic nails, floating flowers, flowers appearing or disappearing,
> colour changes, flicker, warped petals, plastic-looking flowers, cartoon, oversaturated, fast cuts

## 4. The six shots (16:9, about 6 seconds each)

**Shot 1 · Choosing the flowers.** Medium close-up over a florist's worktable scattered with loose
long-stemmed blush-pink and cerise roses and bunches of white gypsophila. Two hands reach in and lift
a single blush-pink rose, turning it gently in the sunlight. Slow push-in.

**Shot 2 · Preparing the stems.** Macro close-up. One hand holds a cerise rose stem while the other
strips its lower leaves and cuts the stem at an angle with small floral shears. Leaves fall softly
onto the table. Shallow depth of field, petals sharp, background soft gold.

**Shot 3 · Building the bouquet.** Close-up of hands holding a small round posy of about fifteen
roses, alternating blush-pink and cerise. One hand adds another rose at a slight angle while the
other tucks sprigs of baby's breath into the gaps. The posy grows a little fuller. Slow orbit around
the hands.

**Shot 4 · Shaping.** A full, dome-shaped bouquet of about sixty evenly mixed blush-pink and cerise
roses, packed with baby's breath, held by the stems. The hands slowly rotate it a quarter turn,
nudge one rose into line, add a final sprig of baby's breath, then wind floral tape around the
gathered stems. Gentle camera drift.

**Shot 5 · Wrapping.** The finished dome lies on the table. The hands place pointed sheets of plain
pale blush-cream paper with thin peach edges around it one at a time, overlapping, folding and
pinching each sheet so the layers fan out like petals in a starburst around the roses. Overhead
three-quarter view, slow push-in.

**Shot 6 · The reveal** *(image-to-video from the hero still)*. The wrapped bouquet stands upright
on the table, its stems wrapped in white paper. The hands tie a slim peach ribbon around the stems,
smooth one layer of wrapping, then withdraw out of frame. The camera arcs slowly around the
bouquet, showing the blush and cerise roses, the baby's breath and the layered blush-cream wrapping
in dappled golden light. End holding on the bouquet.

**For phones (9:16):** use the same six prompts and add *"vertical 9:16 frame, bouquet and hands
centred, a little space above the flowers"*.

## 5. Putting it on the website

Send me the chosen clips (any size or format). I'll join them with soft dissolves, trim them to
about 35 seconds so the loop runs smoothly, take out any sound, compress them for the web and make
the poster images. You can also do it yourself; the site expects these files:

| File | What it is |
| --- | --- |
| `frontend/public/videos/bouquet-making.mp4` | 2.35 : 1, 1920 × 816, H.264 with AAC music |
| `frontend/public/videos/bouquet-making-mobile.mp4` | 2 : 3, 720 × 1080, H.264 with AAC music |
| `frontend/public/videos/bouquet-making-poster.jpg` | first frame of the wide film |
| `frontend/public/videos/bouquet-making-mobile-poster.jpg` | first frame of the upright film |

Once the files are there, the section appears by itself: it plays silently on a loop while on
screen, pauses when scrolled away and has a pause button. With "reduce motion" turned on it waits
for a tap on play.

**Rights:** before going live, check the AI tool's terms allow commercial use of what it makes
(the paid plans of the big tools generally do).
