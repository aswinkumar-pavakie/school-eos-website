// Shared shell for every public auth screen (login, forgot password) -- ported
// exactly from the approved design ("School EOS Login Redesign" .dc.html export):
// gradient header, a school scene (clouds/hills/ground band/schoolhouse) behind a
// two-column welcome text + card layout, gradient footer. Breakpoints are the
// design's own 1023px/767px tiers, mapped onto Tailwind's lg(1024)/md(768) --
// close enough to be visually identical. Colors here are literal hex values from
// that approved design, not this app's own --color-primary token (which is a
// close but different blue) -- deliberate, scoped only to these two screens, so
// this renders pixel-identical to what was approved.

import type { ReactNode } from "react";
import { BookOpenIcon, LockIcon } from "./icons";
import { Clouds, GroundBand, Hills, SchoolBuilding } from "./SchoolSceneArt";

const NAV_COLOR = "#1D4ED8";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#F8FAFC]">
      <header
        className="flex flex-none items-center gap-3.5 px-5 py-5 md:px-10 md:py-5"
        style={{ background: NAV_COLOR }}
      >
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-white/[0.16]">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/[0.22]">
            <BookOpenIcon className="h-[17px] w-[17px] text-white" />
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[19px] font-extrabold leading-[1.1] tracking-[-0.01em] text-white">
            School EOS
          </span>
          <span className="text-[11px] font-semibold tracking-[0.16em] text-[#C7D2FE]">
            LEARN · TEACH · GROW
          </span>
        </div>
      </header>

      <div
        className="relative flex min-h-0 flex-1 flex-col items-stretch overflow-hidden lg:flex-row"
        style={{ background: "linear-gradient(180deg, #E9EFFE 0%, #F2F6FD 46%, #F8FAFC 100%)" }}
      >
        <Clouds />
        <GroundBand />
        <Hills />

        <SchoolBuilding
          className="pointer-events-none relative z-0 mx-auto order-2 mb-2 w-full max-w-[220px] self-center
            md:mb-4 md:max-w-[400px]
            lg:absolute lg:inset-auto lg:bottom-8 lg:left-[170px] lg:z-auto lg:order-none lg:mx-0 lg:mb-0 lg:w-[700px] lg:max-w-[54%] lg:self-auto"
        />

        <div
          className="relative z-10 order-1 flex w-full flex-none flex-col justify-center px-5 pb-3 pt-6
            md:px-10 md:pb-4 md:pt-10
            lg:order-none lg:w-[58%] lg:flex-[0_0_58%] lg:px-20 lg:pb-[300px] lg:pt-10"
        >
          <div className="relative flex flex-col font-sans">
            <span className="text-[17px] font-normal text-[#475569] md:text-xl">Welcome to</span>
            <h1 className="m-0 mt-1 text-[32px] font-extrabold leading-[1.02] tracking-[-0.03em] text-[#1D4ED8] md:text-[56px]">
              School EOS
            </h1>
            <div className="mt-3 h-[5px] w-[72px] rounded-[3px] bg-[#1D4ED8]" />
            <p className="m-0 mt-6 max-w-[420px] text-base leading-[1.6] text-[#64748B]" style={{ textWrap: "pretty" }}>
              One platform for admissions, attendance, fees, timetables and
              approvals — the same real-time record for students, faculty,
              parents and staff.
            </p>
          </div>
        </div>

        <div
          className="relative z-10 order-3 flex w-full flex-none items-center justify-center px-5 pb-6 pt-4
            md:px-10 md:pb-10 md:pt-2
            lg:order-none lg:w-[42%] lg:flex-[0_0_42%] lg:px-12 lg:py-6"
        >
          <div className="w-full max-w-[440px]">
            <div className="flex w-full flex-col gap-6 rounded-[20px] bg-white px-6 py-7 shadow-[0_24px_64px_rgba(30,58,138,0.18)] md:rounded-[24px] md:px-10 md:py-9">
              <div className="flex flex-col items-center gap-3.5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF2FF]">
                  <LockIcon className="h-[30px] w-[30px] text-[#2952E3]" />
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <h2 className="m-0 text-[28px] font-bold tracking-[-0.02em] text-[#0F172A]">{title}</h2>
                  <p className="m-0 text-[15px] text-[#64748B]">{subtitle}</p>
                </div>
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>

      <footer
        className="flex flex-none flex-col items-center justify-between gap-2 px-5 py-3 text-center md:flex-row md:gap-4 md:px-10 md:text-left"
        style={{ background: NAV_COLOR }}
      >
        <span className="text-sm text-[#C7D2FE]">&copy; {new Date().getFullYear()} School EOS. All rights reserved.</span>
        <span className="text-sm text-[#C7D2FE]">Need help? Contact your school&apos;s admin office.</span>
      </footer>
    </div>
  );
}
