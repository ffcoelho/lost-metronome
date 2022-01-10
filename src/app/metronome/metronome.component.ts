import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CoreService } from '../services/core.service';
import { Beat, MetronomeSettings, NoteValue } from '../models/metronome.model';

@Component({
  selector: 'app-metronome',
  templateUrl: './metronome.component.html',
  styleUrls: ['./metronome.component.scss']
})
export class MetronomeComponent implements AfterViewInit {

  @ViewChild('leds', { static: true })
  leds!: ElementRef<HTMLCanvasElement>;
  private ledsCtx!: CanvasRenderingContext2D | null;

  audioCtx!: AudioContext;
  metronomeWorker: Worker;

  playing: boolean = false;
  settings: MetronomeSettings;
  beatQueue: Beat[] = [];

  handlerTimeMs: number = 100;
  audioDurationMs: number = 40;
  workerIntervalMs: number = 25;

  nextBeatTime: number = 0;
  nextBeatIdx: number = 0;
  lastLedBeat: number = -1;

  constructor(private core: CoreService) {
    this.settings = this.core.settings;
    this.metronomeWorker = new Worker('/assets/metronome-worker.js');
    this.metronomeWorker.onmessage = (e: any) => {
      if (e.data == "tick") {
        this.beatHandler();
      }
    };
  }

  ngAfterViewInit(): void {
    this.leds.nativeElement.width = 300;
    this.leds.nativeElement.height = 30;
    this.ledsCtx = this.leds.nativeElement.getContext('2d');
    this.ledsInit();
  }

  // CONTROLS

  onToggle(): void {
    this.playing = !this.playing;
    if (!this.playing) {
      this.metronomeWorker.postMessage('stop');
      setTimeout(() => {
        this.resetMetronome();
      }, 100);
      return;
    }
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    this.nextBeatTime = this.audioCtx.currentTime;
    this.metronomeWorker.postMessage('start');
    const buffer = this.audioCtx.createBuffer(1, 1, 22050);
    const node = this.audioCtx.createBufferSource();
    this.ledsUpdate();
    node.buffer = buffer;
    node.start(0);
    this.metronomeWorker.postMessage({'interval': this.workerIntervalMs});
  }

  onBeatsChange(value: number): void {
    const beats = this.settings.beats + value;
    if (beats < 1 || beats > 12) {
      return;
    }
    this.settings.beats = beats;
    this.nextBeatIdx = 0;
    this.saveSettings();
  }

  onNoteChange(down?: boolean): void {
    switch (this.settings.note) {
      case NoteValue.WHOLE:
        if (!down) {
          this.settings.note = NoteValue.HALF;
        } else {
          return;
        }
      break;
      case NoteValue.HALF:
        if (!down) {
          this.settings.note = NoteValue.QUARTER;
        } else {
          this.settings.note = NoteValue.WHOLE;
        }
      break;
      case NoteValue.QUARTER:
        if (down) {
          this.settings.note = NoteValue.HALF;
        } else {
          this.settings.note = NoteValue.EIGHTH;
        }
      break;
      case NoteValue.EIGHTH:
        if (down) {
          this.settings.note = NoteValue.QUARTER;
        } else {
          return;
        }
      break;
    }
    this.saveSettings();
  }

  onTempoChange(value: number): void {
    const tempo = this.settings.bpm + value;
    if (tempo > 300) {
      this.settings.bpm = 300;
    } else if (tempo < 33) {
      this.settings.bpm = 33;
    } else {
      this.settings.bpm = tempo;
    }
    this.saveSettings();
  }

  resetMetronome(): void {
    this.audioCtx = new AudioContext();
    this.lastLedBeat = -1;
    this.nextBeatIdx = 0;
    this.ledsInit();
  }

  saveSettings(): void {
    this.core.updateSettings(this.settings);
  }

  // METRONOME

  nextBeat() {
    this.nextBeatIdx++;
    if (this.nextBeatIdx === this.settings.beats) {
      this.nextBeatIdx = 0;
    }
    const interval = 60 / this.settings.bpm;
    this.nextBeatTime += (1 / this.settings.note) * interval;
  }

  addBeat(beatNumber: number, time: number) {
    this.beatQueue.push({ beat: beatNumber, time: time });

    const osc = this.audioCtx.createOscillator();
    osc.connect(this.audioCtx.destination);
    if (beatNumber % this.settings.beats === 0) {
      osc.frequency.value = 880;
    } else {
      osc.frequency.value = 440;
    }

    osc.start(time);
    osc.stop(time + this.audioDurationMs / 1000);
  }

  beatHandler() {
    while (this.nextBeatTime < this.audioCtx.currentTime + this.handlerTimeMs / 1000) {
      this.addBeat(this.nextBeatIdx, this.nextBeatTime);
      this.nextBeat();
    }
  }

  // CANVAS

  ledsInit() {
    const x = (this.leds.nativeElement.width - this.settings.beats * 7) / (this.settings.beats - 1);
    this.ledsCtx!.clearRect(0 , 0, this.leds.nativeElement.width, this.leds.nativeElement.height); 
    for (let i = 0; i < this.settings.beats; i++) {
      this.ledsCtx!.fillStyle = '#0A0A0A';
      this.ledsCtx!.fillRect((x + 7) * i, 3, 7, 24);
    }
  }

  ledsUpdate() {
    let beat = this.lastLedBeat;
    const currentTime = this.audioCtx.currentTime;

    while (this.beatQueue.length && this.beatQueue[0].time < currentTime) {
      beat = this.beatQueue[0].beat;
      this.beatQueue.splice(0, 1);
    }

    if (this.lastLedBeat != beat) {
      const x = (this.leds.nativeElement.width - this.settings.beats * 7) / (this.settings.beats - 1);
      this.ledsCtx!.clearRect(0 , 0, this.leds.nativeElement.width, this.leds.nativeElement.height); 
      for (let i = 0; i < this.settings.beats; i++) {
        this.ledsCtx!.fillStyle = (beat == i) ? ((beat % this.settings.beats === 0) ? 'red' : 'blue') : '#0A0A0A';
        this.ledsCtx!.fillRect((x + 7) * i, 0, 7, 24);
      }
      this.lastLedBeat = beat;
    }

    window.requestAnimationFrame(() => this.ledsUpdate());
  }
}
