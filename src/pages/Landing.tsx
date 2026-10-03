import { motion } from "framer-motion";
import {
  ArrowRight,
  Gamepad2,
  Gauge,
  Play,
  Trophy,
  WifiOff,
  Smartphone,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const BEST_KEY = "neon-rush-best";

function readBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY) ?? 0);
  } catch {
    return 0;
  }
}

export default function Landing() {
  const best = readBest();

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-screen overflow-hidden bg-background text-foreground"
    >
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen flex-col">
        {/* Nav */}
        <header className="relative z-10 flex items-center justify-between px-6 py-5">
          <a href="/" className="group flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Gamepad2 className="size-5" />
            </div>
            <span className="neon-text text-lg font-black tracking-widest text-primary">
              NEON RUSH
            </span>
          </a>

          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="transition-colors hover:text-foreground">
              ฟีเจอร์
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              วิธีเล่น
            </a>
            <a href="#offline" className="transition-colors hover:text-foreground">
              เล่นออฟไลน์
            </a>
          </nav>

          <Button asChild size="sm" className="font-bold shadow-lg shadow-primary/30">
            <a href="/play">
              <Play className="size-4" />
              เล่นเลย
            </a>
          </Button>
        </header>

        {/* Hero */}
        <section className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pt-10 pb-16 lg:grid-cols-2 lg:pt-16">
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-cyan-300"
            >
              <WifiOff className="size-3.5" />
              เกม 3 มิติ · เล่นออฟไลน์ได้ 100%
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="neon-text mt-5 text-5xl font-black tracking-tight sm:text-7xl"
            >
              <span className="bg-gradient-to-r from-primary via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                NEON RUSH
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground lg:mx-0"
            >
              ขับยานฮือพาดผ่านเมืองไซเบอร์ไม่มีวันสิ้นสุด หลบสิ่งกีดขวาง
              เก็บพลังงาน แล้วดูความเร็วที่ไต่ขึ้นเรื่อยๆ — เปิดเล่นได้ทันที
              ไม่ต้องสมัคร ไม่ต้องโหลดแอป
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
            >
              <Button
                asChild
                size="lg"
                className="px-8 text-base font-bold shadow-xl shadow-primary/40"
              >
                <a href="/play">
                  <Play className="size-5" />
                  เล่นฟรี ไม่ต้องสมัคร
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-8 text-base">
                <a href="#how">
                  ดูวิธีเล่น
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            </motion.div>

            {best > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1.5 text-sm font-semibold text-yellow-300"
              >
                <Trophy className="size-4" />
                สถิติสูงสุดของคุณ: {best.toLocaleString()} คะแนน
              </motion.div>
            )}
          </div>

          {/* Synthwave horizon panel */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative overflow-hidden rounded-2xl border border-primary/25 bg-[#0a0518] shadow-2xl shadow-primary/20"
          >
            <div className="relative h-72 overflow-hidden sm:h-96 [perspective:520px]">
              {/* Sun */}
              <div className="absolute top-10 left-1/2 size-32 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#ffd166] via-[#ff4fa3] to-[#ff2e88] opacity-90 blur-[1px]" />
              <div className="absolute top-8 left-1/2 size-44 -translate-x-1/2 rounded-full bg-[#ff4fa3]/30 blur-3xl" />

              {/* Horizon glow */}
              <div className="absolute inset-x-0 top-[56%] h-28 bg-gradient-to-b from-transparent via-[#ff2e88]/30 to-transparent" />

              {/* Animated grid floor */}
              <div className="neon-grid-floor absolute top-[62%] left-[-30%] h-[140%] w-[160%] origin-top [transform:rotateX(62deg)]" />

              {/* Ship chip */}
              <div className="absolute bottom-4 left-4 rounded-lg border border-cyan-400/30 bg-black/50 px-3 py-1.5 text-xs font-medium text-cyan-300 backdrop-blur">
                ⚡ ความเร็วไต่ขึ้นเรื่อยๆ
              </div>
              <div className="absolute right-4 bottom-4 rounded-lg border border-primary/30 bg-black/50 px-3 py-1.5 text-xs font-medium text-pink-300 backdrop-blur">
                ◆ หลบ · เก็บ · อย่าชน
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="relative z-10 border-y border-border/60 bg-card/30 px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center">
              <motion.h2
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-2xl font-bold tracking-tight sm:text-3xl"
              >
                เกมเล็กที่ทำเสร็จจริง ใช้งานได้จริง
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-3 text-muted-foreground"
              >
                ไม่ใช่หน้าโชว์เฉยๆ — กดเข้าไปเล่นได้เลยทั้งบนคอมและมือถือ
              </motion.p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Boxes,
                  title: "3 มิติเรียลไทม์",
                  body: "เรนเดอร์ด้วย three.js/WebGL 60 เฟรมต่อวินาที ฉากเมืองนีออนที่วิ่งเข้าหาคุณไม่หยุด",
                },
                {
                  icon: WifiOff,
                  title: "ออฟไลน์ 100%",
                  body: "ไม่ต้องต่อเน็ต ไม่มีการโหลดข้อมูลระหว่างเล่น เปิดแท็บเดิมแล้วเล่นต่อได้ทันที",
                },
                {
                  icon: Trophy,
                  title: "บันทึกสถิติ",
                  body: "สถิติสูงสุดถูกเก็บไว้ในเครื่องของคุณเอง (localStorage) กลับมาแตกสถิติตัวเองได้เสมอ",
                },
                {
                  icon: Smartphone,
                  title: "เล่นได้ทุกจอ",
                  body: "คอมใช้คีย์บอร์ด มือถือสไวป์ซ้าย-ขวาหรือกดปุ่มบนหน้าจอ รองรับทั้งแนวตั้งและแนวนอน",
                },
              ].map((f) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How to play */}
        <section id="how" className="relative z-10 px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center">
              <motion.h2
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-2xl font-bold tracking-tight sm:text-3xl"
              >
                เรียนรู้ใน 10 วินาที
              </motion.h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "เปลี่ยนช่อง",
                  body: "กด ← → หรือ A / D เพื่อสลับ 3 เลน บนมือถือใช้การสไวป์หรือปุ่มลูกศรบนจอ",
                },
                {
                  step: "02",
                  title: "หลบและเก็บ",
                  body: "กำแพงสีชมพูคือสิ่งกีดขวาง — หลบให้ได้ ลูกแก้วสีฟ้าคือพลังงาน เก็บได้ +15 คะแนน",
                },
                {
                  step: "03",
                  title: "อยู่ให้นานที่สุด",
                  body: "ยิ่งวิ่งนาน ความเร็วยิ่งสูง คะแนนยิ่งพุ่ง ชนแป๊บเดียวจบเลย ลองแตกสถิติตัวเองดู",
                },
              ].map((s) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="inline-flex rounded-full bg-primary/15 px-3.5 py-1 text-sm font-bold text-primary">
                    {s.step}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </motion.div>
              ))}
            </div>

            <div id="offline" className="mt-12 text-center text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2">
                <Gauge className="size-4 text-cyan-400" />
                เคล็ดลับ: อย่าเก็บพลังงานทุกลูกถ้าต้องแลกกับการเสี่ยงชน — รอก
                มันคือเกมของการตัดสินใจ
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative z-10 px-6 pb-20">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/10 to-transparent p-10 text-center">
            <h2 className="neon-text text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              พร้อมวิ่งแล้วหรือยัง?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              ไม่มีอะไรต้องตั้งค่า ไม่มีอีเมล ไม่มีการชำระเงิน กดแล้วเล่นเลย
            </p>
            <Button
              asChild
              size="lg"
              className="mt-6 px-10 text-base font-bold shadow-xl shadow-primary/40"
            >
              <a href="/play">
                <Play className="size-5" />
                เริ่มเล่น NEON RUSH
              </a>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 mt-auto border-t border-border/60">
          <div className="mx-auto max-w-5xl px-6 py-8 text-center text-sm text-muted-foreground">
            <p>
              NEON RUSH — สร้างด้วย React + three.js · เกมออฟไลน์ 3 มิติ
              เล่นได้ทุกที่
            </p>
          </div>
        </footer>
      </div>
    </motion.div>
  );
}
