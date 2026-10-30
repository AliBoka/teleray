export interface FeaturedChannel {
  id: string;
  username: string;
  title: string;
}

export const FEATURED_CHANNELS: FeaturedChannel[] = [
  {
    id: 'feat-1',
    username: 'ConfigsHUB',
    title: 'ConfigsHUB',
  },
  {
    id: 'feat-2',
    username: 'v2ray_collector',
    title: 'V2Ray Collector',
  },
  {
    id: 'feat-3',
    username: 'v2ray_free_conf',
    title: 'V2Ray Free Configs',
  },
  {
    id: 'feat-4',
    username: 'v2ray_outlineir',
    title: 'Outline & V2Ray IR',
  },
  {
    id: 'feat-5',
    username: 'freev2rays',
    title: 'Free V2Rays',
  },
  {
    id: 'feat-6',
    username: 'v2rayng_daily',
    title: 'V2RayNG Daily',
  },
];
