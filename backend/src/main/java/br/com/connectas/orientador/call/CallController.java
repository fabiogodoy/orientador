package br.com.connectas.orientador.call;

import br.com.connectas.orientador.security.SessionPrincipal;
import jakarta.validation.Valid;
import java.util.UUID;
import jakarta.servlet.http.HttpServletRequest;
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
        return calls.start(((SessionPrincipal) auth.getPrincipal()).userId(), request == null ? null : request.title(), request == null ? null : request.meetingContext(), request == null ? null : request.knowledgeBaseId());
    }
    @GetMapping
    CallHistoryPage history(Authentication auth, @RequestParam(defaultValue = "0") int page) {
        return calls.history(((SessionPrincipal) auth.getPrincipal()).userId(), page);
    }
    @GetMapping("/{sessionId}")
    CallHistoryDetail detail(Authentication auth, @PathVariable UUID sessionId) {
        return calls.detail(((SessionPrincipal) auth.getPrincipal()).userId(), sessionId);
    }
    @PostMapping("/{sessionId}/executive-analysis")
    MeetingAnalysisState executiveAnalysis(Authentication auth, @PathVariable UUID sessionId) {
        return calls.generateExecutiveAnalysis(((SessionPrincipal) auth.getPrincipal()).userId(), sessionId);
    }
    @PostMapping(value = "/{sessionId}/audio/{source}/{sequenceNumber}", consumes = "audio/webm")
    TranscribedSegmentResponse audio(Authentication auth, @PathVariable UUID sessionId, @PathVariable CaptureSource source,
                                     @PathVariable int sequenceNumber, HttpServletRequest request) throws java.io.IOException {
        return calls.transcribe(((SessionPrincipal) auth.getPrincipal()).userId(), sessionId, source, sequenceNumber, request.getInputStream());
    }
    @PostMapping("/{sessionId}/segments") @ResponseStatus(HttpStatus.NO_CONTENT)
    void segment(Authentication auth, @PathVariable UUID sessionId, @Valid @RequestBody TranscriptSegmentRequest request) { calls.append(((SessionPrincipal) auth.getPrincipal()).userId(), sessionId, request); }
    @PostMapping("/{sessionId}/suggestions")
    CallSuggestionResponse suggestion(Authentication auth, @PathVariable UUID sessionId, @Valid @RequestBody CallSuggestionRequest request) { return calls.suggest(((SessionPrincipal) auth.getPrincipal()).userId(), sessionId, request); }
    @PatchMapping("/{sessionId}/title")
    CallTitleResponse title(Authentication auth, @PathVariable UUID sessionId, @Valid @RequestBody CallTitleRequest request) {
        return new CallTitleResponse(calls.updateTitle(((SessionPrincipal) auth.getPrincipal()).userId(), sessionId, request.title(), request.automatic()));
    }
    @PostMapping("/{sessionId}/end") @ResponseStatus(HttpStatus.NO_CONTENT)
    void end(Authentication auth, @PathVariable UUID sessionId) { calls.end(((SessionPrincipal) auth.getPrincipal()).userId(), sessionId); }
}
