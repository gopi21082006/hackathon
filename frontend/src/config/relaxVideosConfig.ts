import type { MoodType } from './moodsConfig';

export interface CalmingVideo {
  id: string;
  title: string;
  titleTa: string;
  category: 'nature' | 'rain' | 'space' | 'ocean' | 'ambient';
  duration: string;
  embedUrl: string;
  thumbnail: string;
  description: string;
  matchingMoods: MoodType[];
}

export const CALMING_VIDEOS: CalmingVideo[] = [
  {
    id: 'vid_1',
    title: 'Peaceful Rainforest Waterfall & Gentle Streams',
    titleTa: 'அமைதியான மழைக்காடு அருவி',
    category: 'nature',
    duration: '3 Hours',
    embedUrl: 'https://www.youtube-nocookie.com/embed/eKFTSSKCzWA',
    thumbnail: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&auto=format&fit=crop&q=80',
    description: '4K natural waterfall soundscapes with soft birdsong for deep mental grounding.',
    matchingMoods: ['anxious', 'stressed', 'neutral']
  },
  {
    id: 'vid_2',
    title: 'Gentle Ocean Sunset Waves on Soft Sand',
    titleTa: 'மாலை நேர அமைதியான கடல் அலைகள்',
    category: 'ocean',
    duration: '2 Hours',
    embedUrl: 'https://www.youtube-nocookie.com/embed/nep_fO3jYgU',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    description: 'Rhythmic ocean surf filmed at golden hour. Naturally slows heart rate and anxiety.',
    matchingMoods: ['sad', 'anxious', 'tired']
  },
  {
    id: 'vid_3',
    title: 'Cozy Rain on Window with Warm Fireplace',
    titleTa: 'ஜன்னலில் பெய்யும் மிதமான மழை',
    category: 'rain',
    duration: '4 Hours',
    embedUrl: 'https://www.youtube-nocookie.com/embed/mPZkdNFkNps',
    thumbnail: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&auto=format&fit=crop&q=80',
    description: 'Soft pattering raindrops outside a glowing window for maximum comfort.',
    matchingMoods: ['sad', 'tired', 'angry']
  },
  {
    id: 'vid_4',
    title: 'Floating Through the Deep Cosmic Starfield',
    titleTa: 'விண்வெளியில் அமைதியான பயணம்',
    category: 'space',
    duration: '1 Hour',
    embedUrl: 'https://www.youtube-nocookie.com/embed/1la9tV5z0c4',
    thumbnail: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80',
    description: 'Weightless cosmic drift with soft nebulas. Helps dissolve tight overthinking.',
    matchingMoods: ['happy', 'stressed', 'tired']
  },
  {
    id: 'vid_5',
    title: 'Bamboo Garden & Koi Pond Sanctuary',
    titleTa: 'ஜென் மூங்கில் தோட்டம்',
    category: 'nature',
    duration: '2 Hours',
    embedUrl: 'https://www.youtube-nocookie.com/embed/lTRiuFIWV54',
    thumbnail: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?w=600&auto=format&fit=crop&q=80',
    description: 'Traditional Japanese zen garden with flowing water trickles and peaceful carp.',
    matchingMoods: ['angry', 'stressed', 'neutral']
  }
];

export function getVideosForMood(mood: MoodType): CalmingVideo[] {
  const matched = CALMING_VIDEOS.filter(v => v.matchingMoods.includes(mood));
  return matched.length > 0 ? matched : CALMING_VIDEOS;
}
