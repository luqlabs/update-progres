import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX } from "lucide-react";

interface AudioPlayerProps {
  audioUrl?: string;
  defaultVolume?: number;
  shouldPlay?: boolean;
}

const AudioPlayer = ({ audioUrl, defaultVolume = 50, shouldPlay = false }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const [volume, setVolume] = useState(defaultVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [isYouTube, setIsYouTube] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (!audioUrl) return;

    const isYouTubeUrl = audioUrl.includes("youtube.com") || audioUrl.includes("youtu.be");
    setIsYouTube(isYouTubeUrl);

    if (isYouTubeUrl) {
      const videoIdMatch = audioUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
      if (videoIdMatch) {
        setVideoId(videoIdMatch[1]);
      }
    }
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.setVolume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted]);

  // Load YouTube IFrame API and initialize player
  useEffect(() => {
    if (!isYouTube || !videoId) return;
    
    const loadYouTubeAPI = () => {
      return new Promise((resolve) => {
        if ((window as any).YT && (window as any).YT.Player) {
          resolve(true);
          return;
        }
        
        if (!(window as any).onYouTubeIframeAPIReady) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(tag);
          
          (window as any).onYouTubeIframeAPIReady = () => {
            resolve(true);
          };
        }
      });
    };
    
    loadYouTubeAPI().then(() => {
      const player = new (window as any).YT.Player('youtube-audio-player', {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          loop: 1,
          playlist: videoId,
          controls: 0,
          fs: 0,
          modestbranding: 1,
          enablejsapi: 1
        },
        events: {
          onReady: (event: any) => {
            youtubePlayerRef.current = event.target;
            event.target.setVolume(isMuted ? 0 : volume);
            // Play immediately if shouldPlay is true when player becomes ready
            if (shouldPlay) {
              event.target.playVideo();
            }
          }
        }
      });
    });
    
    return () => {
      if (youtubePlayerRef.current && youtubePlayerRef.current.destroy) {
        youtubePlayerRef.current.destroy();
        youtubePlayerRef.current = null;
      }
    };
  }, [isYouTube, videoId]);

  // Handle shouldPlay changes for YouTube
  useEffect(() => {
    if (!youtubePlayerRef.current) return;
    
    if (shouldPlay) {
      youtubePlayerRef.current.playVideo();
    } else {
      youtubePlayerRef.current.pauseVideo();
    }
  }, [shouldPlay]);

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (audioRef.current) {
      audioRef.current.muted = newMutedState;
    }
    
    if (youtubePlayerRef.current) {
      if (newMutedState) {
        youtubePlayerRef.current.mute();
      } else {
        youtubePlayerRef.current.unMute();
      }
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (isMuted) setIsMuted(false);
  };

  if (!audioUrl) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* YouTube Player (hidden) */}
      {isYouTube && videoId && (
        <div className="hidden">
          <div id="youtube-audio-player" />
        </div>
      )}

      {/* Direct Audio Player */}
      {!isYouTube && (
        <audio
          ref={audioRef}
          src={audioUrl}
          autoPlay={shouldPlay}
          loop
          className="hidden"
        />
      )}

      {/* Audio Controls */}
      <div className="bg-card border shadow-none rounded-lg p-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="shrink-0"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </Button>
        
        {/* Show volume slider ONLY for direct audio files */}
        {!isYouTube && (
          <>
            <Slider
              value={[isMuted ? 0 : volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={5}
              className="w-full sm:w-[120px] sm:min-w-[120px]"
            />
            <span className="text-sm text-muted-foreground min-w-[3ch] tabular-nums">
              {isMuted ? 0 : volume}%
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;
