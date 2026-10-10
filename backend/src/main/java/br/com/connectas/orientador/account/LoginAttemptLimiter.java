package br.com.connectas.orientador.account;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class LoginAttemptLimiter {
    private static final int MAX_FAILURES = 5;
    private static final int MAX_TRACKED = 10_000;
    private static final Duration WINDOW = Duration.ofMinutes(15);
    private final ConcurrentHashMap<String, Attempt> attempts = new ConcurrentHashMap<>();
    private final Clock clock;

    public LoginAttemptLimiter(Clock clock) {
        this.clock = clock;
    }

    public boolean blocked(String key) {
        if (attempts.size() >= MAX_TRACKED && !attempts.containsKey(key)) {
            discardExpired();
            if (attempts.size() >= MAX_TRACKED) return true;
        }
        Attempt attempt = attempts.get(key);
        return attempt != null && clock.instant().isBefore(attempt.startedAt().plus(WINDOW))
                && attempt.failures() >= MAX_FAILURES;
    }

    public void failed(String key) {
        Instant now = clock.instant();
        attempts.compute(key, (ignored, previous) -> previous == null
                || !now.isBefore(previous.startedAt().plus(WINDOW))
                ? new Attempt(1, now) : new Attempt(previous.failures() + 1, previous.startedAt()));
    }

    public void succeeded(String key) {
        attempts.remove(key);
    }

    private void discardExpired() {
        Instant now = clock.instant();
        attempts.entrySet().removeIf(entry -> !now.isBefore(entry.getValue().startedAt().plus(WINDOW)));
    }

    private record Attempt(int failures, Instant startedAt) {
    }
}
