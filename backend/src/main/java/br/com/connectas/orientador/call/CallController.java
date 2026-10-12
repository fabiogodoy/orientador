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
    @PostMapping
    CallSessionResponse start(Authentication auth, @Valid @RequestBody(required = false) CallStartRequest request) {
        return calls.start(((SessionPrincipal) auth.getPrincipal()).userId(), request == null ? null : request.title());
    }
    @PostMapping("/{sessionId}/transcription-secret")
    TranscriptionSecretResponse transcriptionSecret(Authentication auth, @PathVariable UUID sessionId) { return calls.createTranscriptionSecret(((SessionPrincipal) auth.getPrincipal()).userId(), sessionId); }
    @PostMapping("/{sessionId}/segments") @ResponseStatus(HttpStatus.NO_CONTENT)
    void segment(Authentication auth, @PathVariable UUID sessionId, @Valid @RequestBody TranscriptSegmentRequest request) { calls.append(((SessionPrincipal) auth.getPrincipal()).userId(), sessionId, request); }
    @PatchMapping("/{sessionId}/title")
    CallTitleResponse title(Authentication auth, @PathVariable UUID sessionId, @Valid @RequestBody CallTitleRequest request) {
        return new CallTitleResponse(calls.updateTitle(((SessionPrincipal) auth.getPrincipal()).userId(), sessionId, request.title(), request.automatic()));
    }
    @PostMapping("/{sessionId}/end") @ResponseStatus(HttpStatus.NO_CONTENT)
    void end(Authentication auth, @PathVariable UUID sessionId) { calls.end(((SessionPrincipal) auth.getPrincipal()).userId(), sessionId); }
}
