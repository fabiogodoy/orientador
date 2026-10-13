package br.com.connectas.orientador.call;
enum CaptureSource { microphone, tab; TranscriptSpeaker speaker() { return this == microphone ? TranscriptSpeaker.USER : TranscriptSpeaker.CLIENT; } }
