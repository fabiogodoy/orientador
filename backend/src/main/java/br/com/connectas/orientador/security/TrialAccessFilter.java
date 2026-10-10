package br.com.connectas.orientador.security;

import br.com.connectas.orientador.account.AccountRepository;
import br.com.connectas.orientador.account.Identity;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class TrialAccessFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(TrialAccessFilter.class);
    private final AccountRepository repository;
    private final Clock clock;

    public TrialAccessFilter(AccountRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof SessionPrincipal principal) {
            Identity identity = repository.findIdentityById(principal.userId()).orElse(null);
            if (identity == null || identity.trialExpiredAt(clock.instant())) {
                log.warn("Authenticated access rejected userId={} reason={}", principal.userId(),
                        identity == null ? "ACCOUNT_MISSING" : "TRIAL_EXPIRED");
                if (request.getSession(false) != null) request.getSession(false).invalidate();
                SecurityContextHolder.clearContext();
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"code\":\"TRIAL_EXPIRED\",\"message\":\"O período gratuito terminou. Entre em contato com a Connectas.\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/") || path.equals("/api/auth/csrf")
                || path.equals("/api/auth/register") || path.equals("/api/auth/login")
                || path.equals("/api/auth/logout") || "OPTIONS".equals(request.getMethod());
    }
}
