package br.com.connectas.orientador.account;

import java.util.Map;
import br.com.connectas.orientador.call.CallService;
import br.com.connectas.orientador.call.OpenAiRealtimeClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    ResponseEntity<Map<String, String>> invalidInput(Exception exception) {
        return error(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "Confira os dados informados.");
    }

    @ExceptionHandler(AccountService.InvalidRegistrationException.class)
    ResponseEntity<Map<String, String>> invalidRegistration(AccountService.InvalidRegistrationException exception) {
        return error(HttpStatus.BAD_REQUEST, "INVALID_REGISTRATION", exception.getMessage());
    }

    @ExceptionHandler(AccountService.AccountConflictException.class)
    ResponseEntity<Map<String, String>> conflict() {
        return error(HttpStatus.CONFLICT, "EMAIL_IN_USE", "Este e-mail já está cadastrado.");
    }

    @ExceptionHandler(AccountService.InvalidCredentialsException.class)
    ResponseEntity<Map<String, String>> invalidCredentials() {
        return error(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
    }

    @ExceptionHandler(AccountService.TrialExpiredException.class)
    ResponseEntity<Map<String, String>> trialExpired() {
        return error(HttpStatus.FORBIDDEN, "TRIAL_EXPIRED", "O período gratuito terminou. Entre em contato com a Connectas.");
    }

    @ExceptionHandler(AuthController.TooManyAttemptsException.class)
    ResponseEntity<Map<String, String>> tooManyAttempts() {
        return error(HttpStatus.TOO_MANY_REQUESTS, "TOO_MANY_ATTEMPTS", "Muitas tentativas. Tente novamente em 15 minutos.");
    }

    @ExceptionHandler(CallService.CallNotFoundException.class)
    ResponseEntity<Map<String, String>> callNotFound() {
        return error(HttpStatus.NOT_FOUND, "CALL_NOT_FOUND", "Esta call não está disponível.");
    }

    @ExceptionHandler(OpenAiRealtimeClient.RealtimeUnavailableException.class)
    ResponseEntity<Map<String, String>> realtimeUnavailable() {
        return error(HttpStatus.SERVICE_UNAVAILABLE, "REALTIME_UNAVAILABLE", "A transcrição em tempo real não está disponível agora.");
    }

    private static ResponseEntity<Map<String, String>> error(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).body(Map.of("code", code, "message", message));
    }
}
