import { EventEmitter } from './EventEmitter.js';
import { gsap } from '../lib/gsap.js';

/**
 * Reproductor de pasos: sólo sabe moverse por una lista (play, pausa, avanzar, retroceder, saltar).
 * No conoce el diagrama ni el vector; avisa con eventos:
 *  - 'step'  { index, step, mode: 'forward' | 'seek' }
 *  - 'state' { playing }
 */
export class Player extends EventEmitter {
  #steps = [];
  #index = -1;
  #speed = 1;
  #timer = null;
  #playing = false;

  constructor({ baseDelay = 0.75 } = {}) {
    super();
    this.baseDelay = baseDelay;
  }

  get index() { return this.#index; }
  get total() { return this.#steps.length; }
  get playing() { return this.#playing; }
  /** Segundos entre pasos con la velocidad actual. */
  get delay() { return this.baseDelay / this.#speed; }
  get atEnd() { return this.#index >= this.#steps.length - 1; }

  load(steps) {
    this.pause();
    this.#steps = steps;
    this.seek(-1);
  }

  play() {
    if (this.atEnd) this.seek(-1);
    this.#setPlaying(true);
    this.#schedule();
  }

  pause() {
    this.#timer?.kill();
    this.#timer = null;
    this.#setPlaying(false);
  }

  toggle() {
    if (this.#playing) this.pause();
    else this.play();
  }

  next() {
    if (this.atEnd) return false;
    this.#index += 1;
    this.#emitStep('forward');
    return true;
  }

  prev() {
    if (this.#index >= 0) this.seek(this.#index - 1);
  }

  seek(index) {
    this.#index = Math.max(-1, Math.min(index, this.#steps.length - 1));
    this.#emitStep('seek');
  }

  setSpeed(speed) {
    this.#speed = speed;
  }

  #schedule() {
    this.#timer = gsap.delayedCall(this.delay, () => {
      if (this.next() && !this.atEnd) this.#schedule();
      else this.pause();
    });
  }

  #setPlaying(playing) {
    if (this.#playing === playing) return;
    this.#playing = playing;
    this.emit('state', { playing });
  }

  #emitStep(mode) {
    this.emit('step', { index: this.#index, step: this.#steps[this.#index] ?? null, mode });
  }
}
