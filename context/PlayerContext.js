"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [volume, setVolumeState] = useState(100);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState("off");

  // Create audio element
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = 1;

    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setStatus("ready");
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setStatus("playing");
    };

    const handlePause = () => {
      setIsPlaying(false);

      if (!audio.ended) {
        setStatus("paused");
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);

      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }

      setCurrentIndex((index) => {
        if (queue.length === 0) return index;

        let nextIndex;

        if (shuffle) {
          nextIndex = Math.floor(Math.random() * queue.length);
        } else {
          nextIndex = index + 1;
        }

        if (nextIndex >= queue.length) {
          if (repeatMode === "all") {
            nextIndex = 0;
          } else {
            setStatus("ended");
            return index;
          }
        }

        setCurrentTrack(queue[nextIndex]);
        setIsPlaying(true);

        return nextIndex;
      });
    };

    const handleWaiting = () => {
      setStatus("loading");
    };

    const handleCanPlay = () => {
      if (!audio.paused) {
        setStatus("playing");
      } else {
        setStatus("ready");
      }
    };

    const handleError = () => {
      setIsPlaying(false);
      setStatus("error");
      setErrorMessage("Unable to play this song.");
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.pause();

      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);

      audioRef.current = null;
    };
  }, [queue.length, repeatMode, shuffle]);

  // Load current track
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !currentTrack) return;

    const audioUrl =
      currentTrack.audioUrl ||
      currentTrack.audio ||
      currentTrack.url ||
      currentTrack.previewUrl;

    if (!audioUrl) {
      setStatus("error");
      setErrorMessage("Audio URL not found for this song.");
      return;
    }

    setErrorMessage("");
    setStatus("loading");
    setCurrentTime(0);
    setDuration(0);

    audio.src = audioUrl;
    audio.volume = volume / 100;
    audio.load();

    if (isPlaying) {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setStatus("playing");
        })
        .catch((error) => {
          console.error("Audio play error:", error);
          setIsPlaying(false);
          setStatus("error");
          setErrorMessage("Browser blocked audio playback.");
        });
    }
  }, [currentTrack]);

  // Play / Pause
  const togglePlay = async () => {
    const audio = audioRef.current;

    if (!audio || !currentTrack) return;

    if (audio.paused) {
      try {
        setStatus("loading");
        await audio.play();
        setIsPlaying(true);
        setStatus("playing");
      } catch (error) {
        console.error("Play error:", error);
        setIsPlaying(false);
        setStatus("error");
        setErrorMessage("Song could not be played.");
      }
    } else {
      audio.pause();
      setIsPlaying(false);
      setStatus("paused");
    }
  };

  // Play one track
  const playTrack = (track) => {
    if (!track) return;

    setQueue([track]);
    setCurrentIndex(0);
    setCurrentTrack(track);
    setIsPlaying(true);
    setErrorMessage("");
  };

  // Play queue
  const playQueue = (tracks, index = 0) => {
    if (!tracks || tracks.length === 0) return;

    const safeIndex = Math.max(
      0,
      Math.min(index, tracks.length - 1)
    );

    setQueue(tracks);
    setCurrentIndex(safeIndex);
    setCurrentTrack(tracks[safeIndex]);
    setIsPlaying(true);
    setErrorMessage("");
  };

  // Next
  const next = () => {
    if (!queue.length) return;

    let nextIndex;

    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = currentIndex + 1;
    }

    if (nextIndex >= queue.length) {
      if (repeatMode === "all") {
        nextIndex = 0;
      } else {
        return;
      }
    }

    setCurrentIndex(nextIndex);
    setCurrentTrack(queue[nextIndex]);
    setIsPlaying(true);
  };

  // Previous
  const prev = () => {
    const audio = audioRef.current;

    if (audio && audio.currentTime > 5) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (!queue.length) return;

    let previousIndex = currentIndex - 1;

    if (previousIndex < 0) {
      if (repeatMode === "all") {
        previousIndex = queue.length - 1;
      } else {
        previousIndex = 0;
      }
    }

    setCurrentIndex(previousIndex);
    setCurrentTrack(queue[previousIndex]);
    setIsPlaying(true);
  };

  // Seek
  const seekTo = (time) => {
    const audio = audioRef.current;

    if (!audio || !Number.isFinite(time)) return;

    const safeTime = Math.max(
      0,
      Math.min(time, audio.duration || 0)
    );

    audio.currentTime = safeTime;
    setCurrentTime(safeTime);
  };

  // Volume
  const setVolume = (value) => {
    const safeVolume = Math.max(
      0,
      Math.min(100, Number(value))
    );

    setVolumeState(safeVolume);

    if (audioRef.current) {
      audioRef.current.volume = safeVolume / 100;
    }
  };

  // Shuffle
  const toggleShuffle = () => {
    setShuffle((prev) => !prev);
  };

  // Repeat
  const cycleRepeat = () => {
    setRepeatMode((current) => {
      if (current === "off") return "all";
      if (current === "all") return "one";
      return "off";
    });
  };

  const value = {
    currentTrack,
    queue,
    currentIndex,

    isPlaying,
    status,
    errorMessage,

    currentTime,
    duration,

    shuffle,
    repeatMode,
    volume,

    playTrack,
    playQueue,

    togglePlay,
    seekTo,

    next,
    prev,

    toggleShuffle,
    cycleRepeat,

    setVolume,
    setIsPlaying,

    setQueue,
    setCurrentTrack,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error(
      "usePlayer must be used inside PlayerProvider"
    );
  }

  return context;
}