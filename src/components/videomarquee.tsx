import { Card, CardContent } from '@/components/ui/card';
import { Marquee } from '@/components/ui/marquee';

// Example video data for the marquee
const videos = [
  {
    src: '/free.mp4',
    poster: '/play.png',
    title: 'Stress-Free Freedom',
    desc: 'Relax and let your worries melt away.',
  },
  {
    src: '/negotiate.mp4',
    poster: '/play.png',
    title: "Let us handle the boring work",
    desc: "Focus on what matters—landing the deals.",
  },
  {
    src: '/vacation.mp4',
    poster: '/play.png',
    title: 'Vacation Time',
    desc: 'Finally, get your time (and sanity) back while everything runs smoothly.',
  },
  {
    src: '/growth.mp4',
    poster: '/play.png',
    title: 'Hop Into Effortless Growth',
    desc: 'Watch your business grow effortlessly with full support behind the scenes.',
  },
];

function VideoCard({ src, poster, title, desc }: typeof videos[number]) {
  return (
    <Card className="w-80 flex-shrink-0 bg-background/95">
      <CardContent className="p-3">
        <div>
          <video 
            src={src} 
            poster={poster}
            autoPlay
            muted
            loop
            preload="none"
            className="w-full h-44 rounded-md object-cover bg-black"
            style={{ backgroundColor: "#000" }}
          />
          <div className="pt-2 flex flex-col">
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VideoMarquee() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center gap-1 overflow-hidden py-8">
      {/* Marquee moving left to right (default) */}
      <Marquee pauseOnHover repeat={3} className="[--duration:120s]">
        {videos.map((video, idx) => (
          <VideoCard key={`video-ltr-${idx}`} {...video} />
        ))}
      </Marquee>
      
      {/* Stylish gradient overlays */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background/95 to-transparent"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background/95 to-transparent"></div>
      <div className="pointer-events-none absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-background/90 to-transparent"></div>
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-background/90 to-transparent"></div>
    </div>
  );
}
