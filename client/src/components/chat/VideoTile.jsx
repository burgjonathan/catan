import { useEffect, useRef } from 'react';
import './VideoTile.css';

export default function VideoTile({ stream, name, color, muted, isLocal }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
      // Explicit play() to fix black screen in many browsers
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  const hasVideo = stream && stream.getVideoTracks().length > 0;

  return (
    <div className="video-tile">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted || isLocal}
        className="video-element"
        style={{ display: hasVideo ? 'block' : 'none' }}
      />
      {!hasVideo && (
        <div className="video-placeholder">
          <div className="video-avatar" style={{ borderColor: color || '#666' }}>
            {name?.[0]?.toUpperCase() || '?'}
          </div>
        </div>
      )}
      <div className="video-name" style={{ color: color || '#fff' }}>
        {name}
      </div>
    </div>
  );
}
