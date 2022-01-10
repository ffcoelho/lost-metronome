import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { MetronomeComponent } from './metronome/metronome.component';

import { BeatsPipe } from './pipes/beats.pipe';

@NgModule({
  declarations: [
    AppComponent,
    MetronomeComponent,
    BeatsPipe
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
