package br.com.connectas.orientador.account;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;

class LoginAttemptLimiterTest {
    @Test
    void blocksAfterFiveFailuresAndReopensAfterWindow() {
        TestClock clock = new TestClock();
        LoginAttemptLimiter limiter = new LoginAttemptLimiter(clock);
        String key = "account@example.com|127.0.0.1";
        for (int attempt = 0; attempt < 5; attempt++) {
            assertFalse(limiter.blocked(key));
            limiter.failed(key);
        }
        assertTrue(limiter.blocked(key));
        clock.now = clock.now.plusSeconds(15 * 60);
        assertFalse(limiter.blocked(key));
    }

    static class TestClock extends Clock {
        Instant now = Instant.parse("2026-10-10T10:00:00Z");
        @Override public ZoneId getZone() { return ZoneId.of("UTC"); }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }
}
