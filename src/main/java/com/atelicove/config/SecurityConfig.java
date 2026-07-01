package com.atelicove.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

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
    
    @Bean
    @SuppressWarnings("removal")
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    	
    	http.cors()
	    	.and()
	    	.csrf()
	    	.disable()
	    	.authorizeHttpRequests()
	    	.requestMatchers("/auth/login")
	    	.permitAll()
	    	.anyRequest()
	    	.authenticated();
    	
    	http.logout()
	    	.logoutUrl("/auth/logout")
	    	.invalidateHttpSession(true)
	    	.clearAuthentication(true)
	    	.deleteCookies("JSESSIONID");
    	
    	return http.build();
    }
}