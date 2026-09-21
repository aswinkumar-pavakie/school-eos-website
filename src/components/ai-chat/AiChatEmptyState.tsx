// The panel's first-open empty state -- pixel-matched to the user's own
// reference (Cloudflare's empty "Ask AI" panel: dotted background + a big
// centered brand mark), but with the reference's decorative orange blob
// replaced by the real Pavakie "P" mark (public/brand/pavakie-logo.png,
// extracted 1:1 from brain/pavakie_logo.png, not redrawn/approximated) and
// the dot background recolored to this app's own real --color-primary
// instead of the reference's orange.
//
// The mark's 3D read comes from real extrusion, not just rotation: a stack
// of darkened copies of the same flat image sit a few pixels "behind" the
// front-facing copy on the Z axis (.pavakie-logo-layer, translateZ, all
// inside one preserve-3d stage) so turning the stage reveals genuine
// thickness/edges between the layers, the way a solid object -- not a
// flat card -- looks when it rotates. The mark spins continuously (a slow,
// full 360deg turntable loop, .pavakie-logo-spin) with an independent
// gentle vertical bob nested inside it (.pavakie-logo-bob) -- always
// moving, not just on hover, per explicit follow-up feedback that an
// earlier small oscillating swing read as barely-there. The shadow is a
// single static, soft ambient drop-shadow on the whole stage -- no pulsing
// floor-contact pill, per separate feedback that the earlier shadow was
// "too much". Shown only while there are zero messages -- AiChatScreen
// itself swaps this out for the real message list the moment a first
// exchange exists, never shown again in the same conversation.
//
// Real asset aspect ratio is 447x560 (taller than wide, not a square badge
// like the earlier circular mark) -- width/height below are proportional to
// that, never a forced square that would stretch the mark.

import Image from "next/image";

const LOGO_W = 90;
const LOGO_H = 113;

// Back-to-front depth layers: index 0 is deepest/darkest, closest to the
// stage's own far side; the plain front copy (no filter) sits at Z=0.
const DEPTH_LAYERS = [4, 3, 2, 1];

export function AiChatEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="pavakie-logo-stage">
        <div className="pavakie-logo-anim relative" style={{ width: LOGO_W, height: LOGO_H }}>
          <div className="pavakie-logo-spin relative" style={{ width: LOGO_W, height: LOGO_H }}>
            <div className="pavakie-logo-bob">
              {DEPTH_LAYERS.map((depth) => (
                <div
                  key={depth}
                  className="pavakie-logo-layer"
                  style={{
                    transform: `translateZ(-${depth * 2.4}px)`,
                    filter: `brightness(${1 - depth * 0.11}) saturate(${1 - depth * 0.08})`,
                    opacity: 0.85,
                  }}
                  aria-hidden
                >
                  <Image src="/brand/pavakie-logo.png" alt="" width={LOGO_W} height={LOGO_H} />
                </div>
              ))}
              <div className="pavakie-logo-layer">
                <Image src="/brand/pavakie-logo.png" alt="" width={LOGO_W} height={LOGO_H} priority />
                <div className="pavakie-logo-sheen pointer-events-none absolute inset-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-[15px] font-bold text-text">Ask the Assistant</p>
        <p className="max-w-[280px] text-[13px] leading-relaxed text-text-muted">
          Ask a question about school records, policies or anything else — the assistant will help.
        </p>
      </div>
    </div>
  );
}
