package br.com.connectas.orientador.account;

import br.com.connectas.orientador.security.SessionPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final AccountService accounts;
    private final LoginAttemptLimiter limiter;
    private final SecurityContextRepository contextRepository;

    public AuthController(AccountService accounts, LoginAttemptLimiter limiter,
                          SecurityContextRepository contextRepository) {
        this.accounts = accounts;
        this.limiter = limiter;
        this.contextRepository = contextRepository;
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(@RequestAttribute("_csrf") CsrfToken token) {
        return Map.of("token", token.getToken());
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AccountResponse register(@Valid @RequestBody RegistrationRequest request) {
        return accounts.register(request);
    }

    @PostMapping("/login")
    public AccountResponse login(@Valid @RequestBody LoginRequest request,
                                 HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String key = AccountService.normalizeEmail(request.email()) + "|" + httpRequest.getRemoteAddr();
        if (limiter.blocked(key)) throw new TooManyAttemptsException();
        Identity identity;
        try {
            identity = accounts.authenticate(request);
        } catch (AccountService.InvalidCredentialsException exception) {
            limiter.failed(key);
            log.warn("Login rejected: invalid credentials");
            throw exception;
        }
        limiter.succeeded(key);
        httpRequest.getSession(true);
        httpRequest.changeSessionId();
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                new SessionPrincipal(identity.id()), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + identity.role().name()))));
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, httpRequest, httpResponse);
        log.info("Login accepted userId={} tenantId={}", identity.id(), identity.tenantId());
        return AccountResponse.from(identity);
    }

    @GetMapping("/me")
    public AccountResponse me(Authentication authentication) {
        SessionPrincipal principal = (SessionPrincipal) authentication.getPrincipal();
        return AccountResponse.from(accounts.currentIdentity(principal.userId()));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request) {
        if (request.getSession(false) != null) request.getSession(false).invalidate();
        SecurityContextHolder.clearContext();
    }

    public static class TooManyAttemptsException extends RuntimeException {
    }
}
