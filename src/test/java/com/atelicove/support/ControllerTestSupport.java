package com.atelicove.support;

import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.atelicove.exceptions.GlobalExceptionHandler;

public final class ControllerTestSupport {

    private ControllerTestSupport() {}

    public static MockMvc mockMvcFor(Object controller) {
        return MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }
}
