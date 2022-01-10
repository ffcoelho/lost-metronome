import { Injectable } from '@angular/core';
import { INITIAL_METRONOME_SETTINGS as INITIAL_SETTINGS, MetronomeSettings } from '../models/metronome.model';

@Injectable({
  providedIn: 'root'
})
export class CoreService {

  localStorageError: boolean = false;

  settings!: MetronomeSettings;

  constructor() { }

  initialize(): void {
    try {
      const loaded = localStorage.getItem('settings');
      if (!loaded) {
        this.settings = INITIAL_SETTINGS;
        localStorage.setItem('settings', JSON.stringify(this.settings));
        return;
      }
      this.settings = JSON.parse(loaded);
      return;
    } catch (err) {
      this.settings = INITIAL_SETTINGS;
      this.localStorageError = true;
    }
  }

  updateSettings(data: MetronomeSettings): void {
    if (this.localStorageError) {
      return;
    }
    try {
      this.settings = data;
      localStorage.setItem('settings', JSON.stringify(this.settings));
    } catch (err) {
      this.localStorageError = true;
    }
  }
}
