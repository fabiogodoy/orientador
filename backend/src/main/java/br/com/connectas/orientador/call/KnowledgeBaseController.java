package br.com.connectas.orientador.call;

import br.com.connectas.orientador.security.SessionPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/knowledge-bases")
class KnowledgeBaseController {
    private final KnowledgeBaseService bases;
    KnowledgeBaseController(KnowledgeBaseService bases) { this.bases = bases; }
    @GetMapping KnowledgeBasePage list(Authentication auth, @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "") String query) { return bases.list(userId(auth), page, query); }
    @GetMapping("/options") List<KnowledgeBaseResponse> options(Authentication auth,
                                                                   @RequestParam(defaultValue = "") String query) { return bases.options(userId(auth), query); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    KnowledgeBaseResponse create(Authentication auth, @Valid @RequestBody KnowledgeBaseRequest request) { return bases.create(userId(auth), request); }
    @PutMapping("/{id}")
    KnowledgeBaseResponse update(Authentication auth, @PathVariable UUID id, @Valid @RequestBody KnowledgeBaseRequest request) { return bases.update(userId(auth), id, request); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(Authentication auth, @PathVariable UUID id) { bases.delete(userId(auth), id); }
    private static UUID userId(Authentication auth) { return ((SessionPrincipal) auth.getPrincipal()).userId(); }
}
