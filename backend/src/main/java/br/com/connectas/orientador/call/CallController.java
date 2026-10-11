package br.com.connectas.orientador.call;

import br.com.connectas.orientador.security.SessionPrincipal;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/calls")
class CallController {
    private final CallService calls;
    CallController(CallService calls) { this.calls = calls; }
    @PostMapping public CallSessionResponse start(Authentication auth) { return calls.start(((SessionPrincipal) auth.getPrincipal()).userId()); }
    @PostMapping("/{sessionId}/transcription-secret")
    TranscriptionSecretResponse transcriptionSecret(Authentication auth, @PathVariable UUID sessionId) { return calls.createTranscriptionSecret(((SessionPrincipal) auth.getPrincipal()).userId(), sessionId); }
    @PostMapping("/{sessionId}/segments") @ResponseStatus(HttpStatus.NO_CONTENT)
    void segment(Authentication auth, @PathVariable UUID sessionId, @Valid @RequestBody TranscriptSegmentRequest request) { calls.append(((SessionPrincipal) auth.getPrincipal()).userId(), sessionId, request); }
    @PostMapping("/{sessionId}/end") @ResponseStatus(HttpStatus.NO_CONTENT)
    void end(Authentication auth, @PathVariable UUID sessionId) { calls.end(((SessionPrincipal) auth.getPrincipal()).userId(), sessionId); }
}
