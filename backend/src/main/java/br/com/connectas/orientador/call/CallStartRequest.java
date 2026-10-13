package br.com.connectas.orientador.call;

import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CallStartRequest(@Size(max = 160) String title, @Size(max = 6000) String meetingContext, UUID knowledgeBaseId) {}
