interface SVGMountainProps {
  className?: string;
}

export function SVGMountain({ className = "" }: SVGMountainProps) {
  return (
    <svg viewBox="0 0 1200 400" className={className} preserveAspectRatio="xMidYMid slice">
      <path d="M 0 200 L 150 100 L 300 200 L 0 200" className="fill-primary" opacity="0.3" />
      <path d="M 250 200 L 400 80 L 550 200 L 250 200" className="fill-primary" opacity="0.3" />
      <path d="M 700 200 L 850 90 L 1000 200 L 700 200" className="fill-primary" opacity="0.3" />
      <path d="M 0 250 L 200 120 L 400 250 L 0 250" className="fill-primary" opacity="0.5" />
      <path d="M 350 250 L 550 100 L 750 250 L 350 250" className="fill-primary" opacity="0.5" />
      <path d="M 800 250 L 1000 130 L 1200 250 L 800 250" className="fill-primary" opacity="0.5" />
      <path d="M 0 300 L 180 80 L 360 300 L 0 300" className="fill-primary" />
      <path d="M 250 300 L 450 90 L 650 300 L 250 300" className="fill-primary" />
      <path d="M 550 300 L 750 110 L 950 300 L 550 300" className="fill-primary" />
      <path d="M 900 300 L 1100 120 L 1200 300 L 900 300" className="fill-primary" />
      <path d="M 180 80 L 200 120 L 160 120 Z" className="fill-background" opacity="0.8" />
      <path d="M 450 90 L 470 140 L 430 140 Z" className="fill-background" opacity="0.8" />
      <path d="M 750 110 L 770 160 L 730 160 Z" className="fill-background" opacity="0.8" />
      <path d="M 1100 120 L 1120 170 L 1080 170 Z" className="fill-background" opacity="0.8" />
    </svg>
  );
}
