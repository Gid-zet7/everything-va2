import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Marquee } from '@/components/ui/marquee';

// EverythingVA testimonials data
const testimonials = [
  {
    name: 'Sarah Chen',
    username: '@sarah',
    body: 'EverythingVA transformed my email management! AI prioritization is incredible.',
    img: 'https://randomuser.me/api/portraits/women/32.jpg',
    country: '🇦🇺 Australia',
  },
  {
    name: 'Marcus Weber',
    username: '@marcus',
    body: 'Finally, an email client that understands context. Game changer!',
    img: 'https://randomuser.me/api/portraits/men/68.jpg',
    country: '🇩🇪 Germany',
  },
  {
    name: 'Elena Rossi',
    username: '@elena',
    body: 'The search functionality is lightning fast. Found emails instantly!',
    img: 'https://randomuser.me/api/portraits/women/51.jpg',
    country: '🇮🇹 Italy',
  },
  {
    name: 'Arjun Patel',
    username: '@arjun',
    body: 'Keyboard shortcuts make me so much more productive. Love it!',
    img: 'https://randomuser.me/api/portraits/men/53.jpg',
    country: '🇮🇳 India',
  },
  {
    name: 'Jessica Thompson',
    username: '@jessica',
    body: 'Clean, minimal design with powerful AI features. Perfect balance!',
    img: 'https://randomuser.me/api/portraits/women/33.jpg',
    country: '🇺🇸 USA',
  },
  {
    name: 'Pierre Dubois',
    username: '@pierre',
    body: 'The AI email organization saves me hours every week.',
    img: 'https://randomuser.me/api/portraits/men/22.jpg',
    country: '🇫🇷 France',
  },
  {
    name: 'Yuki Tanaka',
    username: '@yuki',
    body: 'Best email client I\'ve ever used. Intuitive and powerful.',
    img: 'https://randomuser.me/api/portraits/women/85.jpg',
    country: '🇯🇵 Japan',
  },
  {
    name: 'David Kim',
    username: '@david',
    body: 'EverythingVA made email management enjoyable again. Highly recommend!',
    img: 'https://randomuser.me/api/portraits/men/45.jpg',
    country: '🇨🇦 Canada',
  },
  {
    name: 'Isabella Garcia',
    username: '@isabella',
    body: 'The AI insights help me stay on top of important emails.',
    img: 'https://randomuser.me/api/portraits/women/61.jpg',
    country: '🇪🇸 Spain',
  },
];

function TestimonialCard({ img, name, username, body, country }: (typeof testimonials)[number]) {
  return (
    <Card className="w-64">
      <CardContent>
        <div className="flex items-center gap-2.5">
          <Avatar className="size-9">
            <AvatarImage src={img} alt="@reui_io" />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <figcaption className="text-sm font-medium text-foreground flex items-center gap-1">
              {name} <span className="text-xs">{country}</span>
            </figcaption>
            <p className="text-xs font-medium text-muted-foreground">{username}</p>
          </div>
        </div>
        <blockquote className="mt-3 text-sm text-econdary-foreground">{body}</blockquote>
      </CardContent>
    </Card>
  );
}

export default function Component() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center gap-1 overflow-hidden py-8">
      {/* Marquee moving left to right (default) */}
      <Marquee pauseOnHover repeat={3} className="[--duration:120s]">
        {testimonials.map((review) => (
          <TestimonialCard key={review.username} {...review} />
        ))}
      </Marquee>
      {/* Marquee moving right to left (reverse) */}
      <Marquee pauseOnHover reverse repeat={3} className="[--duration:120s]">
        {testimonials.map((review) => (
          <TestimonialCard key={review.username} {...review} />
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
