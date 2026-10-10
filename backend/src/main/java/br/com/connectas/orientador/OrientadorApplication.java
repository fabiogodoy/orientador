package br.com.connectas.orientador;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class OrientadorApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrientadorApplication.class, args);
    }
}
