package com.atelicove.entities;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class ProjectWorkOrderInvariantTest {

    @Test
    void movingWorkOrderRequiresRemovalAndKeepsBothSidesSynchronized() {
        Project oldProject = project(1, "Old");
        Project newProject = project(2, "New");
        WorkOrder workOrder = new WorkOrder();
        workOrder.setWorkOrderID(7);

        oldProject.addWorkOrder(workOrder);
        assertThatThrownBy(() -> newProject.addWorkOrder(workOrder))
                .isInstanceOf(IllegalStateException.class);

        oldProject.removeWorkOrder(workOrder);
        newProject.addWorkOrder(workOrder);

        assertThat(oldProject.getWorkOrders()).doesNotContain(workOrder);
        assertThat(newProject.getWorkOrders()).containsExactly(workOrder);
        assertThat(workOrder.getProject()).isSameAs(newProject);
        assertThat(workOrder.getPreviousProjectID()).isEqualTo(1);
        assertThat(workOrder.getPreviousProjectName()).isEqualTo("Old");
    }

    private Project project(int id, String name) {
        Project project = new Project();
        project.setProjectID(id);
        project.setProjectName(name);
        return project;
    }
}
