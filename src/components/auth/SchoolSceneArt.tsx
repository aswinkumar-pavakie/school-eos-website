// Exact decorative scene from the approved design ("School EOS Login Redesign"
// .dc.html export) -- clouds, a soft rolling ground "band", distant hills, and a
// schoolhouse with a bell tower, clock and two flanking trees. Ported as literal
// SVG shapes/colors from that file (not the app's own --color-primary token set)
// so this renders pixel-identical to the approved design; scoped to the auth
// screens only.

/** A single flying bird in profile -- pointed beak, raised wing with two
 * feather-separation lines, tapered tail -- drawn as one continuous outline
 * so it reads as a real bird rather than the plain double-arc chevron this
 * replaces. viewBox is its own 0 0 100 80 local space; callers position and
 * scale the wrapping <g>. */
function Bird({ transform, opacity = 1 }: { transform: string; opacity?: number }) {
  return (
    <g transform={transform} opacity={opacity} fill="none" stroke="#9DB0F4" strokeLinecap="round" strokeLinejoin="round">
      <path
        strokeWidth="3.2"
        d="M5 45 Q10 32 28 24 Q45 8 90 5 Q65 18 55 30 Q80 35 95 60 Q80 45 72 52 Q60 65 40 62 Q15 60 5 45 Z"
      />
      <path strokeWidth="2.2" d="M35 22 Q50 15 68 12" />
      <path strokeWidth="2.2" d="M40 30 Q55 25 72 20" />
    </g>
  );
}

export function Clouds() {
  return (
    <div
      data-el="clouds"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <svg viewBox="0 0 240 96" className="absolute left-[46%] top-14 h-auto w-[196px]">
        <Bird transform="translate(4 10) scale(0.34) rotate(-4)" opacity={0.85} />
        <Bird transform="translate(92 -6) scale(0.26) rotate(6)" opacity={0.7} />
        <Bird transform="translate(150 46) scale(0.22) rotate(-8)" opacity={0.6} />
      </svg>
    </div>
  );
}

export function GroundBand() {
  return (
    <svg
      data-el="band"
      viewBox="0 0 1600 150"
      preserveAspectRatio="none"
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[130px] w-full max-[767px]:h-20 max-[1023px]:h-[90px]"
    >
      <path d="M0 54C180 18 420 6 700 26s520 40 900 10v60H0z" fill="#EEF2FF" />
      <path d="M0 74C240 48 560 46 880 62s470 24 720 8v66H0z" fill="#DBE4FF" />
      <path d="M0 118c260-16 620-14 940 2s440 12 660 2v28H0z" fill="#C7D2FE" opacity="0.55" />
    </svg>
  );
}

export function Hills() {
  return (
    <svg
      data-el="hills"
      viewBox="0 0 1600 220"
      preserveAspectRatio="none"
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-[108px] h-[150px] w-full opacity-55 max-[1023px]:hidden"
    >
      <path d="M0 220 320 66 560 220z" fill="#EEF2FF" />
      <path d="M420 220 760 40 1080 220z" fill="#E4EAFF" />
      <path d="M980 220 1290 90 1600 220z" fill="#EEF2FF" />
    </svg>
  );
}

export function SchoolBuilding({ className }: { className?: string }) {
  return (
    <svg
      data-el="building"
      viewBox="0 0 1010 520"
      preserveAspectRatio="xMinYMax meet"
      aria-hidden
      className={className}
    >
      <ellipse cx="500" cy="500" rx="300" ry="16" fill="#C7D2FE" opacity="0.7" />

      <g stroke="#93A9F5" strokeWidth="2" strokeLinejoin="round">
        <g fill="#FFFFFF">
          <rect x="70" y="268" width="300" height="204" />
          <rect x="630" y="268" width="300" height="204" />
          <rect x="370" y="220" width="260" height="252" />
          <rect x="438" y="96" width="124" height="124" />
        </g>
        <g fill="#93A9F5" stroke="none">
          <path d="M58 268l30-34h294l30 34z" />
          <path d="M618 268l30-34h294l30 34z" />
          <path d="M356 220l32-30h224l32 30z" />
          <path d="M500 34l74 62H426z" />
        </g>
        <g fill="#DBE4FF">
          <rect x="104" y="296" width="52" height="42" />
          <rect x="176" y="296" width="52" height="42" />
          <rect x="248" y="296" width="52" height="42" />
          <rect x="316" y="296" width="34" height="42" />
          <rect x="104" y="378" width="52" height="42" />
          <rect x="176" y="378" width="52" height="42" />
          <rect x="248" y="378" width="52" height="42" />
          <rect x="316" y="378" width="34" height="42" />
          <rect x="650" y="296" width="34" height="42" />
          <rect x="700" y="296" width="52" height="42" />
          <rect x="772" y="296" width="52" height="42" />
          <rect x="844" y="296" width="52" height="42" />
          <rect x="650" y="378" width="34" height="42" />
          <rect x="700" y="378" width="52" height="42" />
          <rect x="772" y="378" width="52" height="42" />
          <rect x="844" y="378" width="52" height="42" />
          <rect x="392" y="296" width="48" height="40" />
          <rect x="560" y="296" width="48" height="40" />
        </g>
        <g fill="none" stroke="#C7D2FE" strokeWidth="1.4">
          <path
            d="M130 296v42M104 317h52M202 296v42M176 317h52M274 296v42M248 317h52
                     M130 378v42M104 399h52M202 378v42M176 399h52M274 378v42M248 399h52
                     M726 296v42M700 317h52M798 296v42M772 317h52M870 296v42M844 317h52
                     M726 378v42M700 399h52M798 378v42M772 399h52M870 378v42M844 399h52"
          />
        </g>
        <circle cx="500" cy="158" r="40" fill="#FFFFFF" stroke="#2952E3" strokeWidth="3" />
        <g stroke="#2952E3" strokeWidth="3" strokeLinecap="round">
          <path d="M500 158V134M500 158l18 12" />
        </g>
        <g fill="#2952E3" stroke="none">
          <circle cx="500" cy="126" r="2.4" />
          <circle cx="532" cy="158" r="2.4" />
          <circle cx="500" cy="190" r="2.4" />
          <circle cx="468" cy="158" r="2.4" />
        </g>
        <path d="M466 472v-70a34 34 0 0 1 68 0v70z" fill="#DBE4FF" />
        <path d="M500 402v70" stroke="#93A9F5" strokeWidth="2" />
        <path d="M436 472h128l16 22H420z" fill="#EEF2FF" />
      </g>
      <text
        x="500"
        y="256"
        textAnchor="middle"
        fill="#2952E3"
        style={{ fontFamily: "Inter, sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: 6 }}
      >
        SCHOOL
      </text>
      <g>
        <path d="M40 472V368" stroke="#93A9F5" strokeWidth="8" strokeLinecap="round" />
        <circle cx="40" cy="336" r="56" fill="#DBE4FF" />
        <circle cx="12" cy="366" r="34" fill="#EEF2FF" />
        <circle cx="74" cy="360" r="30" fill="#EEF2FF" />
        <path d="M962 472V352" stroke="#93A9F5" strokeWidth="8" strokeLinecap="round" />
        <circle cx="962" cy="320" r="62" fill="#DBE4FF" />
        <circle cx="924" cy="356" r="34" fill="#EEF2FF" />
        <circle cx="996" cy="352" r="30" fill="#EEF2FF" />
      </g>
      <g fill="#C7D2FE" opacity="0.7">
        <ellipse cx="500" cy="500" rx="290" ry="16" />
      </g>
    </svg>
  );
}
