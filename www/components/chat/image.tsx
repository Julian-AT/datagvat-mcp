import type { Experimental_GeneratedImage } from 'ai';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export type ImageProps = Experimental_GeneratedImage & {
  className?: string;
  alt?: string;
};

export const Image = ({ base64, uint8Array, mediaType, ...props }: ImageProps) => (
  // biome-ignore lint/performance/noImgElement: base64 data URLs require native img
  <Image
    {...props}
    alt={props.alt}
    className={cn('h-auto max-w-full overflow-hidden rounded-md', props.className)}
    src={`data:${mediaType};base64,${base64}`}
    width={100}
    height={100}
  />
);
