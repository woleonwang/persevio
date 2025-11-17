import usePlayAudio from "@/hooks/usePlayAudio";
import { Get } from "@/utils/request";
import { useEffect, useState } from "react";
import Icon from "../Icon";
import Volume from "@/assets/icons/volume";
import { message, Slider } from "antd";
import styles from "./style.module.less";
import { formatSeconds } from "@/utils";

interface IProps {
  duration: number;
  payloadUrl: string;
  onPlay: () => void;
  onStop: () => void;
}

const SLIDER_COUNT = 200;
const AudioPlayer = (props: IProps) => {
  const { duration, payloadUrl, onPlay, onStop } = props;
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  const {
    initAudio,
    playAudio,
    pauseAudio,
    setCurrentTime,
    totalSeconds,
    currentSeconds,
    isPlaying,
  } = usePlayAudio();

  useEffect(() => {
    isPlaying ? onPlay() : onStop();
  }, [isPlaying]);

  useEffect(() => {
    setSliderValue(Math.floor((currentSeconds / finalDuration) * SLIDER_COUNT));
  }, [currentSeconds]);
  const play = async () => {
    onPlay();

    if (isLoaded) {
      playAudio();
    } else {
      setIsLoading(true);
      const { code, data } = await Get(payloadUrl);

      if (code === 0) {
        setIsLoaded(true);
        initAudio(data.payload);
        playAudio();
      } else {
        onStop();
        message.error("Failed to load audio");
      }
      setIsLoading(false);
    }
  };

  const finalDuration = totalSeconds || duration / 1000;

  const formatter = (value: number) => {
    const seconds = Math.floor((value / SLIDER_COUNT) * finalDuration);
    return formatSeconds(seconds);
  };

  return (
    <div className={styles.audioPlayer}>
      <div
        className={styles.playButton}
        onClick={() => {
          if (isLoading) return;
          isPlaying ? pauseAudio() : play();
        }}
      >
        <Icon icon={<Volume />} style={{ fontSize: 20 }} />
      </div>
      <Slider
        className={styles.slider}
        tooltip={{ formatter: (value) => formatter(value ?? 0) }}
        value={sliderValue}
        max={SLIDER_COUNT}
        disabled={!isLoaded}
        onChange={(value) => {
          pauseAudio();
          setCurrentTime((value / SLIDER_COUNT) * finalDuration);
          setSliderValue(value);
        }}
        onChangeComplete={() => {
          playAudio();
        }}
      />
      <div className={styles.time}>
        {formatSeconds(currentSeconds)} / {formatSeconds(finalDuration)}
      </div>
    </div>
  );
};

export default AudioPlayer;
