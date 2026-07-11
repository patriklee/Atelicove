package com.atelicove.entities;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.Method;

import org.junit.jupiter.api.Test;

class DocumentParentInvariantTest {

    @Test
    void exactlyOneParentIsRequired() throws Exception {
        Method invariant = Document.class.getDeclaredMethod("validateSingleParent");
        invariant.setAccessible(true);

        assertThatCode(() -> invoke(invariant, document(new WorkOrder(), null))).doesNotThrowAnyException();
        assertThatCode(() -> invoke(invariant, document(null, new Project()))).doesNotThrowAnyException();
        assertThatThrownBy(() -> invoke(invariant, document(new WorkOrder(), new Project())))
                .hasCauseInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> invoke(invariant, document(null, null)))
                .hasCauseInstanceOf(IllegalStateException.class);
    }

    private Document document(WorkOrder workOrder, Project project) {
        Document document = new Document();
        document.setWorkOrder(workOrder);
        document.setProject(project);
        return document;
    }

    private void invoke(Method method, Document document) throws Exception {
        method.invoke(document);
    }
}
