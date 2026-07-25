"use client";

import { usePlayer } from "../context/PlayerContext";

export default function TrackCard({ track, queue = [] }) {
  const { playTrack, playQueue, currentTrack, isPlaying } = usePlayer();

  const isCurrent =
    currentTrack?.name === track?.name &&
    currentTrack?.artists === track?.artists;

  const handlePlay = () => {
    // Agar queue available hai to queue ke saath play karo
    if (queue.length > 0) {
      const index = queue.findIndex(
        (item) =>
          item.name === track.name &&
          item.artists === track.artists
      );

      playQueue(queue, index >= 0 ? index : 0);
    } else {
      // Sirf ek track play karo
      playTrack(track);
    }
  };

  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-paper/10 bg-paper/5 p-3 hover:border-paper/30 transition">
      
      {/* Album Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-ink/40">
        {track.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={track.image}
            alt={track.album || track.name}
            className="h-full w-full object-cover group-hover:scale-105 transition"
          />
        )}

        {/* Play Button */}
        <button
          onClick={handlePlay}
          className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-paper text-ink flex items-center justify-center shadow-lg hover:scale-110 transition"
          title={isCurrent && isPlaying ? "Playing" : "Play"}
        >
          {isCurrent && isPlaying ? "⏸" : "▶"}
        </button>
      </div>

      {/* Song Info */}
      <div>
        <p className="font-body text-sm text-paper truncate">
          {track.name}
        </p>

        <p className="font-body text-xs text-paper/50 truncate">
          {track.artists}
        </p>
      </div>

      {/* Preview Audio - fallback */}
      {track.previewUrl && (
        <audio
          controls
          preload="none"
          src={track.previewUrl}
          className="w-full h-8"
        />
      )}
    </div>
  );
}