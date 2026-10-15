package br.com.connectas.orientador.call;

import java.util.List;

public record CallSuggestionResponse(String tipo, String trechoCliente, String proximaFala, List<String> pontosChave, String contextSummary, int summarizedThrough, String acao) {
    public CallSuggestionResponse(String tipo, String trechoCliente, String proximaFala, List<String> pontosChave, String contextSummary, int summarizedThrough) {
        this(tipo, trechoCliente, proximaFala, pontosChave, contextSummary, summarizedThrough, "Ouvir".equals(tipo) ? "OUVIR" : "FALAR");
    }
}
