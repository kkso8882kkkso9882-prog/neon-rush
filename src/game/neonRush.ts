import * as THREE from "three";

export type GameState = "idle" | "running" | "paused" | "over";

export interface HudData {
  score: number;
  speedKmh: number;
  orbs: number;
}

export interface NeonRushOptions {
  onHud?: (hud: HudData) => void;
  onStateChange?: (state: GameState) => void;
}

const LANE_X = [-3.4, 0, 3.4];
const SHIP_Y = 0.55;
const SPAWN_Z = -150;
const DESPAWN_Z = 14;
const BASE_SPEED = 17;
const MAX_SPEED = 44;

/**
 * NEON RUSH — offline 3D endless runner (three.js).
 * Pure canvas engine, no React inside: React only renders HUD overlays.
 */
export class NeonRushGame {
  private container: HTMLElement;
  private opts: NeonRushOptions;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private raf = 0;
  private disposed = false;

  state: GameState = "idle";
  private elapsed = 0;
  private distance = 0;
  private speed = BASE_SPEED;
  private orbPoints = 0;
  private orbCount = 0;
  private lastHudScore = -1;

  private lane = 1;
  private ship!: THREE.Group;
  private grid!: THREE.GridHelper;

  private barriers: { mesh: THREE.Mesh; lane: number; active: boolean }[] = [];
  private orbs: { mesh: THREE.Mesh; baseY: number; active: boolean }[] = [];
  private rings: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; life: number }[] = [];

  private barrierTimer = 1;
  private orbTimer = 0.5;
  private deathTime = 0;

  private audio: AudioContext | null = null;
  private muted = false;

  private resizeObserver: ResizeObserver;

  constructor(container: HTMLElement, opts: NeonRushOptions = {}) {
    this.container = container;
    this.opts = opts;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.buildEnvironment();
    this.buildShip();
    this.buildPools();

    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 500);
    this.camera.position.set(0, 5, 8.6);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();

    window.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("visibilitychange", this.onVisibility);
    container.addEventListener("pointerdown", this.onPointerDown);
    container.addEventListener("pointerup", this.onPointerUp);

    this.raf = requestAnimationFrame(this.tick);
  }

  /* ---------- public API ---------- */

  start() {
    if (this.state === "running") return;
    this.reset();
    this.ensureAudio();
    if (this.audio?.state === "suspended") void this.audio.resume().catch(() => {});
    this.setState("running");
  }

  pause() {
    if (this.state !== "running") return;
    this.setState("paused");
  }

  resume() {
    if (this.state !== "paused") return;
    this.clock.getDelta();
    this.setState("running");
  }

  togglePause() {
    if (this.state === "running") this.pause();
    else if (this.state === "paused") this.resume();
  }

  moveLane(dir: -1 | 1) {
    if (this.state !== "running") return;
    const next = THREE.MathUtils.clamp(this.lane + dir, 0, 2);
    if (next !== this.lane) {
      this.lane = next;
      this.beep(200, 340, 0.05, "triangle", 0.03);
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    window.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.container.removeEventListener("pointerdown", this.onPointerDown);
    this.container.removeEventListener("pointerup", this.onPointerUp);
    this.scene.traverse((obj) => {
      const m = obj as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
    void this.audio?.close().catch(() => {});
  }

  /* ---------- setup ---------- */

  private buildEnvironment() {
    this.scene.background = new THREE.Color(0x070214);
    this.scene.fog = new THREE.Fog(0x070214, 34, 150);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(500, 500),
      new THREE.MeshStandardMaterial({ color: 0x0b0518, roughness: 0.95, metalness: 0 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -100;
    this.scene.add(floor);

    this.grid = new THREE.GridHelper(360, 90, 0xff3d9a, 0x3b1d6e);
    const gridMat = this.grid.material as THREE.Material;
    gridMat.transparent = true;
    gridMat.opacity = 0.55;
    this.grid.position.y = 0.02;
    this.scene.add(this.grid);

    const railMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    for (const x of [-6.2, 6.2]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 360), railMat);
      rail.position.set(x, 0.1, -100);
      this.scene.add(rail);
    }

    const sunHalo = new THREE.Mesh(
      new THREE.CircleGeometry(30, 48),
      new THREE.MeshBasicMaterial({ color: 0xff4fa3, transparent: true, opacity: 0.22, fog: false }),
    );
    sunHalo.position.set(0, 16, -236);
    this.scene.add(sunHalo);

    const sun = new THREE.Mesh(
      new THREE.CircleGeometry(20, 48),
      new THREE.MeshBasicMaterial({ color: 0xff4fa3, fog: false }),
    );
    sun.position.set(0, 16, -235);
    this.scene.add(sun);

    const starCount = 420;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 1] = 12 + Math.random() * 90;
      positions[i * 3 + 2] = -120 - Math.random() * 260;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.scene.add(
      new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({
          color: 0xcdd6ff,
          size: 0.8,
          fog: false,
          transparent: true,
          opacity: 0.9,
        }),
      ),
    );

    this.scene.add(new THREE.AmbientLight(0x8899ff, 1.1));
    const dir = new THREE.DirectionalLight(0xff9ad5, 2.2);
    dir.position.set(6, 14, 6);
    this.scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0x22d3ee, 1.2);
    dir2.position.set(-8, 6, -10);
    this.scene.add(dir2);
  }

  private buildShip() {
    const ship = new THREE.Group();

    const hull = new THREE.Mesh(
      new THREE.ConeGeometry(0.72, 2.6, 4),
      new THREE.MeshStandardMaterial({
        color: 0x1a1040,
        metalness: 0.7,
        roughness: 0.25,
        emissive: 0x241245,
        emissiveIntensity: 0.6,
      }),
    );
    hull.rotation.set(-Math.PI / 2, Math.PI / 4, 0);
    ship.add(hull);

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x140a30,
      metalness: 0.6,
      roughness: 0.3,
      emissive: 0xff2e88,
      emissiveIntensity: 0.9,
    });
    const wingGeo = new THREE.BoxGeometry(1.5, 0.07, 0.85);
    for (const s of [-1, 1]) {
      const wing = new THREE.Mesh(wingGeo, wingMat);
      wing.position.set(s * 0.95, -0.05, 0.55);
      wing.rotation.z = s * 0.18;
      ship.add(wing);
    }

    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 12),
      new THREE.MeshStandardMaterial({
        color: 0x67e8f9,
        emissive: 0x22d3ee,
        emissiveIntensity: 1.6,
        metalness: 0.2,
        roughness: 0.1,
      }),
    );
    canopy.scale.set(1, 0.7, 1.6);
    canopy.position.set(0, 0.22, -0.1);
    ship.add(canopy);

    const engine = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0x8ff7ff }),
    );
    engine.position.set(0, 0, 1.25);
    ship.add(engine);

    const glow = new THREE.PointLight(0x22d3ee, 60, 30, 1.8);
    glow.position.set(0, 0.4, 1);
    ship.add(glow);

    const trailMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.5 });
    for (const s of [-1, 1]) {
      const trail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.2), trailMat);
      trail.position.set(s * 0.32, 0, 2.2);
      ship.add(trail);
    }

    ship.position.set(0, SHIP_Y, 0);
    this.ship = ship;
    this.scene.add(ship);
  }

  private buildPools() {
    const barrierGeo = new THREE.BoxGeometry(2.6, 1.7, 0.7);
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0x2a0a3f,
      emissive: 0xff2e88,
      emissiveIntensity: 0.85,
      roughness: 0.35,
      metalness: 0.3,
    });
    const edgeGeo = new THREE.EdgesGeometry(barrierGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xffb3dd });
    for (let i = 0; i < 26; i++) {
      const mesh = new THREE.Mesh(barrierGeo, barrierMat);
      mesh.add(new THREE.LineSegments(edgeGeo, edgeMat));
      mesh.visible = false;
      this.scene.add(mesh);
      this.barriers.push({ mesh, lane: 1, active: false });
    }

    const orbGeo = new THREE.IcosahedronGeometry(0.42, 0);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x0e7490,
      emissive: 0x22d3ee,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.4,
    });
    for (let i = 0; i < 20; i++) {
      const mesh = new THREE.Mesh(orbGeo, orbMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.orbs.push({ mesh, baseY: 0.95, active: false });
    }

    const ringGeo = new THREE.RingGeometry(0.32, 0.5, 32);
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(ringGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.rings.push({ mesh, mat, life: 0 });
    }
  }

  /* ---------- game flow ---------- */

  private reset() {
    this.distance = 0;
    this.speed = BASE_SPEED;
    this.orbPoints = 0;
    this.orbCount = 0;
    this.elapsed = 0;
    this.deathTime = 0;
    this.lane = 1;
    this.lastHudScore = -1;
    this.barrierTimer = 1.2;
    this.orbTimer = 0.6;
    this.ship.position.set(0, SHIP_Y, 0);
    this.ship.rotation.set(0, 0, 0);
    for (const b of this.barriers) {
      b.active = false;
      b.mesh.visible = false;
    }
    for (const o of this.orbs) {
      o.active = false;
      o.mesh.visible = false;
    }
    for (const r of this.rings) {
      r.life = 0;
      r.mesh.visible = false;
    }
  }

  private crash() {
    this.setState("over");
    this.deathTime = 0;
    this.beep(320, 55, 0.5, "sawtooth", 0.14);
  }

  private setState(state: GameState) {
    if (this.state === state) return;
    this.state = state;
    this.opts.onStateChange?.(state);
  }

  private get score() {
    return Math.floor(this.distance * 0.6) + this.orbPoints;
  }

  /* ---------- loop ---------- */

  private tick = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private update(dt: number) {
    this.elapsed += dt;
    const s = this.state;

    if (s === "running") {
      this.distance += this.speed * dt;
      this.speed = Math.min(MAX_SPEED, BASE_SPEED + this.distance * 0.011);
      this.spawnLogic(dt);
      this.moveWorld(dt);
      this.checkCollisions();
      this.grid.position.z = this.distance % 4;
    } else if (s === "over") {
      this.updateDeath(dt);
    } else if (s === "idle") {
      this.distance += 6 * dt;
      this.grid.position.z = this.distance % 4;
    }

    if (s === "running" || s === "idle") {
      const targetX = LANE_X[this.lane];
      const prevX = this.ship.position.x;
      this.ship.position.x = THREE.MathUtils.damp(prevX, targetX, 9, dt);
      this.ship.position.y = SHIP_Y + Math.sin(this.elapsed * 3.2) * 0.08;
      this.ship.rotation.z = THREE.MathUtils.clamp((prevX - targetX) * 0.28, -0.5, 0.5);
    }

    for (const o of this.orbs) {
      if (o.active) o.mesh.rotation.y += dt * 3;
    }
    for (const r of this.rings) {
      if (r.life <= 0) continue;
      r.life -= dt * 2.2;
      if (r.life <= 0) {
        r.mesh.visible = false;
        continue;
      }
      r.mesh.scale.setScalar(0.4 + (1 - r.life) * 2.2);
      r.mat.opacity = r.life * 0.9;
    }

    const camX = this.ship.position.x * 0.45;
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, camX, 6, dt);
    this.camera.position.y = 5;
    this.camera.position.z = 8.6;
    if (s === "over" && this.deathTime < 0.5) {
      this.camera.position.x += (Math.random() - 0.5) * 0.25;
      this.camera.position.y += (Math.random() - 0.5) * 0.2;
    }
    this.camera.lookAt(this.ship.position.x * 0.55, 1.5, -20);

    if (s === "running" || s === "over") {
      const score = this.score;
      if (score !== this.lastHudScore) {
        this.lastHudScore = score;
        this.opts.onHud?.({
          score,
          speedKmh: Math.round(this.speed * 3.6 * 1.35),
          orbs: this.orbCount,
        });
      }
    }
  }

  private moveWorld(dt: number) {
    const dz = this.speed * dt;
    for (const b of this.barriers) {
      if (!b.active) continue;
      b.mesh.position.z += dz;
      if (b.mesh.position.z > DESPAWN_Z) {
        b.active = false;
        b.mesh.visible = false;
      }
    }
    for (const o of this.orbs) {
      if (!o.active) continue;
      o.mesh.position.z += dz;
      o.mesh.position.y = o.baseY + Math.sin(this.elapsed * 4 + o.mesh.position.x) * 0.15;
      if (o.mesh.position.z > DESPAWN_Z) {
        o.active = false;
        o.mesh.visible = false;
      }
    }
  }

  private spawnLogic(dt: number) {
    this.barrierTimer -= dt;
    if (this.barrierTimer <= 0) {
      const diff = Math.min(1, this.distance / 2600);
      this.barrierTimer =
        THREE.MathUtils.lerp(1.15, 0.55, diff) * (0.85 + Math.random() * 0.3);
      const open = Math.floor(Math.random() * 3);
      const blockChance = 0.18 + diff * 0.5;
      for (let lane = 0; lane < 3; lane++) {
        if (lane === open) continue;
        if (Math.random() < blockChance) this.spawnBarrier(lane);
      }
    }

    this.orbTimer -= dt;
    if (this.orbTimer <= 0) {
      this.orbTimer = 0.75 * (0.8 + Math.random() * 0.4);
      this.spawnOrb(Math.floor(Math.random() * 3));
    }
  }

  private spawnBarrier(lane: number) {
    const b = this.barriers.find((x) => !x.active);
    if (!b) return;
    b.lane = lane;
    b.active = true;
    b.mesh.position.set(LANE_X[lane], 0.85, SPAWN_Z);
    b.mesh.visible = true;
  }

  private spawnOrb(lane: number) {
    const o = this.orbs.find((x) => !x.active);
    if (!o) return;
    o.active = true;
    o.mesh.position.set(LANE_X[lane], o.baseY, SPAWN_Z - 3);
    o.mesh.visible = true;
  }

  private checkCollisions() {
    const sx = this.ship.position.x;
    for (const b of this.barriers) {
      if (!b.active) continue;
      const z = b.mesh.position.z;
      if (z > -1.5 && z < 1.5 && Math.abs(sx - LANE_X[b.lane]) < 1.7) {
        this.crash();
        return;
      }
    }
    for (const o of this.orbs) {
      if (!o.active) continue;
      const z = o.mesh.position.z;
      if (z > -1.8 && z < 1.8 && Math.abs(sx - o.mesh.position.x) < 1.8) {
        o.active = false;
        o.mesh.visible = false;
        this.orbCount++;
        this.orbPoints += 15;
        this.popRing(o.mesh.position.clone());
        this.beep(760, 1400, 0.14, "sine", 0.1);
      }
    }
  }

  private popRing(pos: THREE.Vector3) {
    const r = this.rings.find((x) => x.life <= 0);
    if (!r) return;
    r.life = 1;
    r.mesh.position.copy(pos);
    r.mesh.scale.setScalar(0.4);
    r.mat.opacity = 0.9;
    r.mesh.visible = true;
  }

  private updateDeath(dt: number) {
    this.deathTime += dt;
    this.ship.rotation.z += dt * 5;
    this.ship.rotation.y += dt * 3;
    this.ship.position.y = Math.max(0.12, this.ship.position.y - dt * 1.6);
    this.ship.position.z += dt * 5;
  }

  /* ---------- input ---------- */

  private onKeyDown = (e: KeyboardEvent) => {
    switch (e.code) {
      case "ArrowLeft":
      case "KeyA":
        e.preventDefault();
        this.moveLane(-1);
        break;
      case "ArrowRight":
      case "KeyD":
        e.preventDefault();
        this.moveLane(1);
        break;
      case "Space":
      case "Enter":
        e.preventDefault();
        if (this.state === "idle" || this.state === "over") this.start();
        else if (this.state === "paused") this.resume();
        break;
      case "KeyP":
      case "Escape":
        e.preventDefault();
        this.togglePause();
        break;
    }
  };

  private onVisibility = () => {
    if (document.hidden && this.state === "running") this.pause();
  };

  private pointerStart: { x: number; y: number } | null = null;
  private onPointerDown = (e: PointerEvent) => {
    this.pointerStart = { x: e.clientX, y: e.clientY };
  };
  private onPointerUp = (e: PointerEvent) => {
    if (!this.pointerStart) return;
    const dx = e.clientX - this.pointerStart.x;
    const dy = e.clientY - this.pointerStart.y;
    this.pointerStart = null;
    if (Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy)) {
      this.moveLane(dx > 0 ? 1 : -1);
    } else if (Math.abs(dx) <= 24 && Math.abs(dy) <= 24) {
      if (this.state === "idle" || this.state === "over") this.start();
    }
  };

  /* ---------- audio ---------- */

  private ensureAudio() {
    if (this.audio || this.muted) return;
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (Ctx) this.audio = new Ctx();
    } catch {
      this.audio = null;
    }
  }

  private beep(
    freqStart: number,
    freqEnd: number,
    dur: number,
    type: OscillatorType,
    gain: number,
  ) {
    if (!this.audio || this.muted) return;
    try {
      const t0 = this.audio.currentTime;
      const osc = this.audio.createOscillator();
      const g = this.audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), t0 + dur);
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g).connect(this.audio.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch {
      /* ignore audio errors */
    }
  }

  /* ---------- resize ---------- */

  private resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}
