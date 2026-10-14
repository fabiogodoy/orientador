package br.com.connectas.orientador.call;

import java.util.List;

public record KnowledgeBasePage(List<KnowledgeBaseResponse> items, int page, int pageSize, int total) {}
