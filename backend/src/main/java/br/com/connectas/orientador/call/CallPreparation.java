package br.com.connectas.orientador.call;

record CallPreparation(String meetingContext, String knowledgeBaseName, String knowledgeBaseContent) {
    static CallPreparation empty() { return new CallPreparation(null, null, null); }
    boolean hasReferences() { return !blank(meetingContext) || !blank(knowledgeBaseContent); }
    private static boolean blank(String value) { return value == null || value.isBlank(); }
}
