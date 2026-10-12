package br.com.connectas.orientador.call;

import java.util.List;

public record CallHistoryPage(List<CallHistoryItem> items, int page, int pageSize, int total) {}
