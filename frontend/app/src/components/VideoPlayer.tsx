import React, { useEffect, useRef } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import '../styles/videoplayer.css';

interface VideoPlayerProps {
  src?: string;
  autoPlay?: boolean;
  fluid?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src = '',
  autoPlay = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);

  useEffect(() => {
    if (videoRef.current && !playerRef.current) {
      playerRef.current = new Plyr(videoRef.current, {
        controls: [
          'play-large',
          'play',
          'mute',
          'volume',
          'fullscreen'
        ],
        autopause: true,
        hideControls: true,
        resetOnEnd: true
      });

      if (autoPlay) {
        playerRef.current.play();
      }
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [autoPlay]);

  useEffect(() => {
    if (playerRef.current && src) {
      playerRef.current.source = {
        type: 'video',
        sources: [
          {
            src: src,
            type: src.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4',
          },
        ],
      };
    }
  }, [src]);

  return (
    <div className="plyr-container">
      <video
        ref={videoRef}
        className="plyr-video"
        crossOrigin="anonymous"
        playsInline
      >
        <source src={src} type={src.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'} />
      </video>
    </div>
  );
};

export default VideoPlayer;