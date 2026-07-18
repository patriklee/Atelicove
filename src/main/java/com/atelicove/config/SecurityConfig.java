package com.atelicove.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration)throws Exception {
    	return configuration.getAuthenticationManager();
    }
    
    /**
     * Configures session-based security for the API. Login is public, every other
     * route requires authentication, and logout clears the server session cookie.
     *
     * @param http Spring Security builder
     * @return configured security filter chain
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();

		return http
				.cors(Customizer.withDefaults())
				.csrf(csrf -> csrf
						.csrfTokenRepository(csrfTokenRepository)
						.csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
				.addFilterAfter(new CsrfCookieFilter(), CsrfFilter.class)
				.authorizeHttpRequests(authorize -> authorize
						.requestMatchers("/auth/login").permitAll()
						.anyRequest().authenticated())
				.exceptionHandling(exceptionHandling -> exceptionHandling
						.authenticationEntryPoint((request, response, exception) -> {
							CsrfToken csrfToken = (CsrfToken) request.getAttribute("_csrf");
							if (csrfToken != null) {
								csrfTokenRepository.saveToken(csrfToken, request, response);
							}
							response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
						}))
				.logout(logout -> logout
						.logoutUrl("/auth/logout")
						.invalidateHttpSession(true)
						.clearAuthentication(true)
						.deleteCookies("JSESSIONID")
						.logoutSuccessHandler((request, response, authentication) ->
								response.setStatus(HttpServletResponse.SC_NO_CONTENT)))
				.build();
    }

	/** Forces deferred CSRF token creation before authorization can reject a request. */
	private static final class CsrfCookieFilter extends OncePerRequestFilter {
		@Override
		protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
				FilterChain filterChain) throws ServletException, IOException {
			CsrfToken csrfToken = (CsrfToken) request.getAttribute("_csrf");
			if (csrfToken != null) {
				csrfToken.getToken();
			}
			filterChain.doFilter(request, response);
		}
	}
}
