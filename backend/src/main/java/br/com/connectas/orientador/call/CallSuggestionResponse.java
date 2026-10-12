package br.com.connectas.orientador.call;

import java.util.List;

public record CallSuggestionResponse(String tipo, String trechoCliente, String proximaFala, List<String> pontosChave) {}
