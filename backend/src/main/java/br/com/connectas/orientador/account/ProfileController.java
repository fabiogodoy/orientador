package br.com.connectas.orientador.account;

import br.com.connectas.orientador.security.SessionPrincipal;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final AccountService accounts;

    public ProfileController(AccountService accounts) {
        this.accounts = accounts;
    }

    @PatchMapping
    public AccountResponse update(@Valid @RequestBody UpdateProfileRequest request, Authentication authentication) {
        return accounts.updateName(userId(authentication), request.name());
    }

    @PutMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AccountResponse uploadAvatar(@RequestParam("avatar") MultipartFile avatar, Authentication authentication) {
        return accounts.updateAvatar(userId(authentication), avatar);
    }

    @GetMapping("/avatar")
    public ResponseEntity<byte[]> avatar(Authentication authentication) {
        AccountRepository.StoredAvatar avatar = accounts.avatar(userId(authentication));
        if (avatar == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofHours(1)).cachePrivate())
                .header(HttpHeaders.VARY, "Cookie")
                .body(avatar.content());
    }

    @DeleteMapping("/avatar")
    public AccountResponse removeAvatar(Authentication authentication) {
        return accounts.removeAvatar(userId(authentication));
    }

    private static UUID userId(Authentication authentication) {
        return ((SessionPrincipal) authentication.getPrincipal()).userId();
    }
}
