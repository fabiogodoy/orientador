package br.com.connectas.orientador.call;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.Test;

class OpenAiLanguageSupportTest {
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void configuresRealtimeTranscriptionForPortugueseAndEnglish() throws Exception {
        JsonNode transcription = mapper.readTree(OpenAiRealtimeClient.TRANSCRIPTION_SESSION_BODY)
                .path("session").path("audio").path("input").path("transcription");

        assertEquals("gpt-live-transcribe", transcription.path("model").asText());
        assertEquals(List.of("pt", "en"), mapper.convertValue(transcription.path("languages"), mapper.getTypeFactory().constructCollectionType(List.class, String.class)));
        assertEquals("low", transcription.path("delay").asText());
    }

    @Test
    void requiresSuggestionToFollowLastClientSpeechLanguageInBilingualCalls() {
        assertTrue(OpenAiSuggestionClient.INSTRUCTIONS.contains("mesmo idioma da última fala do interlocutor"));
        assertTrue(OpenAiSuggestionClient.INSTRUCTIONS.contains("português"));
        assertTrue(OpenAiSuggestionClient.INSTRUCTIONS.contains("inglês"));
        assertTrue(OpenAiSuggestionClient.INSTRUCTIONS.contains("conversa pode alternar"));
        assertTrue(OpenAiSuggestionClient.INSTRUCTIONS.contains("nunca invente ou afirme como confirmados"));
    }
}
