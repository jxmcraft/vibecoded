import Image from "next/image";

/**
 * Licensed reference stills (see `public/profile-ref/`). Decorative only; `aria-hidden` on wrapper.
 */
export function ProfileBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0">
        <Image
          src="/profile-ref/image_3.png"
          alt=""
          fill
          className="object-cover object-[center_35%] opacity-[0.2]"
          sizes="100vw"
          priority={false}
        />
      </div>
      <div className="absolute inset-0 bg-linear-to-br from-black via-black/88 to-persona-red/30" />
      <div className="absolute -right-[6%] top-[-5%] h-[85%] w-[min(58vw,520px)] min-w-[200px]">
        <Image
          src="/profile-ref/image_4.png"
          alt=""
          fill
          className="object-contain object-right object-top opacity-[0.34]"
          sizes="(max-width:1024px) 70vw, 520px"
        />
      </div>
      <div className="absolute left-[10%] top-[16%] h-[36%] w-[min(40vw,320px)] min-w-[130px] opacity-[0.14] mix-blend-screen">
        <Image
          src="/profile-ref/image_2.png"
          alt=""
          fill
          className="object-contain object-left-top"
          sizes="40vw"
        />
      </div>
      <div
        className="absolute inset-0 opacity-[0.055] mix-blend-overlay"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "5px 5px",
        }}
      />
    </div>
  );
}
