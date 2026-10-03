import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Home,
  Pause,
  Play as PlayIcon,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { NeonRushGame, type GameState, type HudData } from "@/game/neonRush";

const BEST_KEY = "neon-rush-best";

const INITIAL_HUD: HudData = { score: 0, speedKmh: 0, orbs: 0 };

export default function Play() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<NeonRushGame | null>(null);
  const hudRef = useRef<HudData>(INITIAL_HUD);
  const [hud, setHud] = useState<HudData>(INITIAL_HUD);
  const [state, setState] = useState<GameState>("idle");
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY) ?? 0));
  const [isNewBest, setIsNewBest] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const game = new NeonRushGame(el, {
      onHud: (h) => {
        hudRef.current = h;
        setHud(h);
      },
      onStateChange: (s) => {
        setState(s);
        if (s === "over") {
          const finalScore = hudRef.current.score;
          const prev = Number(localStorage.getItem(BEST_KEY) ?? 0);
          if (finalScore > prev) {
            localStorage.setItem(BEST_KEY, String(finalScore));
            setBest(finalScore);
            setIsNewBest(true);
          } else {
            setBest(prev);
            setIsNewBest(false);
          }
        }
      },
    });
    gameRef.current = game;
    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, []);

  const toggleMute = () => {
    setMuted((m) => {
      gameRef.current?.setMuted(!m);
      return !m;
    });
  };

  const playing = state === "running" || state === "paused";

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background text-foreground select-none">
      {/* three.js canvas */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Top bar */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-border/60 bg-card/60 backdrop-blur"
          >
            <Link to="/">
              <ArrowLeft className="size-4" />
              หน้าแรก
            </Link>
          </Button>
          <span className="neon-text hidden text-sm font-bold tracking-widest text-primary sm:block">
            NEON RUSH
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label={muted ? "เปิดเสียง" : "ปิดเสียง"}
            className="border-border/60 bg-card/60 backdrop-blur"
            onClick={toggleMute}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="หยุดชั่วคราว"
            disabled={!playing}
            className="border-border/60 bg-card/60 backdrop-blur"
            onClick={() => gameRef.current?.togglePause()}
          >
            <Pause className="size-4" />
          </Button>
        </div>
      </header>

      {/* HUD */}
      {playing && (
        <div className="pointer-events-none absolute top-16 left-4 z-10 sm:top-20 sm:left-6">
          <div className="neon-text text-4xl font-bold tabular-nums text-primary sm:text-5xl">
            {hud.score.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Trophy className="size-3.5 text-yellow-400" />
              สถิติ {best.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <Zap className="size-3.5 text-cyan-400" />
              {hud.orbs}
            </span>
            <span className="inline-flex items-center gap-1">
              <Gauge className="size-3.5 text-pink-400" />
              {hud.speedKmh} km/h
            </span>
          </div>
        </div>
      )}

      {/* Desktop control hint */}
      {state === "running" && (
        <div className="pointer-events-none absolute right-4 bottom-4 z-10 hidden text-xs text-muted-foreground sm:block">
          <KbdGroup>
            <Kbd>←</Kbd>
            <Kbd>→</Kbd>
          </KbdGroup>{" "}
          เปลี่ยนช่อง · <Kbd>P</Kbd> หยุด
        </div>
      )}

      {/* Mobile lane buttons */}
      {state === "running" && (
        <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center gap-24 sm:hidden">
          <button
            aria-label="เลื่อนซ้าย"
            onPointerDown={(e) => {
              e.preventDefault();
              gameRef.current?.moveLane(-1);
            }}
            className="flex size-16 touch-manipulation items-center justify-center rounded-full border border-cyan-400/40 bg-card/70 backdrop-blur transition active:scale-90"
          >
            <ChevronLeft className="size-8 text-cyan-300" />
          </button>
          <button
            aria-label="เลื่อนขวา"
            onPointerDown={(e) => {
              e.preventDefault();
              gameRef.current?.moveLane(1);
            }}
            className="flex size-16 touch-manipulation items-center justify-center rounded-full border border-cyan-400/40 bg-card/70 backdrop-blur transition active:scale-90"
          >
            <ChevronRight className="size-8 text-cyan-300" />
          </button>
        </div>
      )}

      {/* Overlays */}
      <AnimatePresence>
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-background/70 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="max-w-md text-center"
            >
              <h1 className="neon-text bg-gradient-to-r from-primary via-pink-400 to-cyan-400 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl">
                NEON RUSH
              </h1>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                ขับยานฮือเลี่ยงสิ่งกีดขวางในเมืองนีออน
                <br />
                เล่นได้ทันที ไม่ต้องต่อเน็ต ไม่ต้องสมัครสมาชิก
              </p>

              <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                <p>
                  <KbdGroup>
                    <Kbd>←</Kbd> <Kbd>→</Kbd>
                  </KbdGroup>{" "}
                  หรือ{" "}
                  <KbdGroup>
                    <Kbd>A</Kbd> <Kbd>D</Kbd>
                  </KbdGroup>{" "}
                  เปลี่ยนช่อง
                </p>
                <p>
                  <Kbd>Space</Kbd> เริ่ม/เล่นต่อ · <Kbd>P</Kbd> หยุดชั่วคราว ·
                  บนมือถือสไวป์ซ้าย-ขวา
                </p>
              </div>

              <Button
                size="lg"
                className="mt-8 px-10 text-base font-bold shadow-lg shadow-primary/30"
                onClick={() => gameRef.current?.start()}
              >
                <PlayIcon className="size-5" />
                เริ่มเกม
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                หรือกด <Kbd>Space</Kbd> เพื่อเริ่ม
              </p>
            </motion.div>
          </motion.div>
        )}

        {state === "paused" && (
          <motion.div
            key="paused"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-background/70 p-6 backdrop-blur-sm"
          >
            <div className="max-w-sm text-center">
              <h2 className="text-3xl font-bold">พักเกมอยู่</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                คะแนนปัจจุบัน {hud.score.toLocaleString()} · สถิติ{" "}
                {best.toLocaleString()}
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button size="lg" onClick={() => gameRef.current?.resume()}>
                  <PlayIcon className="size-5" />
                  เล่นต่อ
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/">
                    <Home className="size-5" />
                    หน้าแรก
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {state === "over" && (
          <motion.div
            key="over"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-background/75 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="max-w-md text-center"
            >
              <h2 className="text-3xl font-bold sm:text-4xl">เกมจบแล้ว!</h2>
              {isNewBest && (
                <div className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-4 py-1.5 text-sm font-semibold text-yellow-300">
                  <Trophy className="size-4" />
                  สถิติใหม่!
                </div>
              )}
              <div className="neon-text mt-4 text-6xl font-black tabular-nums text-primary">
                {hud.score.toLocaleString()}
              </div>
              <div className="mt-2 flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Trophy className="size-4 text-yellow-400" />
                  สถิติ {best.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Zap className="size-4 text-cyan-400" />
                  เก็บพลังงาน {hud.orbs}
                </span>
              </div>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="px-8 font-bold shadow-lg shadow-primary/30"
                  onClick={() => gameRef.current?.start()}
                >
                  <RotateCcw className="size-5" />
                  เล่นอีกครั้ง
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/">
                    <Home className="size-5" />
                    หน้าแรก
                  </Link>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                กด <Kbd>Space</Kbd> เพื่อเล่นอีกครั้ง
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
