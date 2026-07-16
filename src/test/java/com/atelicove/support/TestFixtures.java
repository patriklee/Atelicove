package com.atelicove.support;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.LinkedHashSet;
import java.util.Set;

import com.atelicove.entities.Company;
import com.atelicove.entities.Document;
import com.atelicove.entities.Project;
import com.atelicove.entities.Team;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderItem;
import com.atelicove.entities.Worker;
import com.atelicove.enums.DocumentType;
import com.atelicove.enums.ItemType;
import com.atelicove.enums.ProjectStatus;
import com.atelicove.enums.WorkOrderStatus;

/**
 * Domain fixture DSL for unit and slice tests.
 *
 * <p>Every terminal method returns a new entity graph so tests remain isolated.
 * Defaults describe a valid active object; individual tests override only the
 * state relevant to the behavior they document.</p>
 */
public final class TestFixtures {

    public static final int COMPANY_ID = 21;
    public static final int PROJECT_ID = 31;
    public static final int WORK_ORDER_ID = 41;
    public static final int WORKER_ID = 51;
    public static final int TEAM_ID = 61;
    public static final int DOCUMENT_ID = 71;
    public static final int ITEM_ID = 81;
    public static final String USERNAME = "pat.lee";
    public static final String EMAIL = "pat.lee@atelicove.test";
    public static final String RAW_PASSWORD = "valid-password";
    public static final String ENCODED_PASSWORD = "encoded-password";

    private TestFixtures() {}

    public static WorkerBuilder aWorker() {
        return new WorkerBuilder();
    }

    public static CompanyBuilder aCompany() {
        return new CompanyBuilder();
    }

    public static WorkOrderBuilder aWorkOrder() {
        return new WorkOrderBuilder();
    }

    public static ProjectBuilder aProject() {
        return new ProjectBuilder();
    }

    public static TeamBuilder aTeam() {
        return new TeamBuilder();
    }

    public static WorkOrderItemBuilder aWorkOrderItem() {
        return new WorkOrderItemBuilder();
    }

    public static DocumentBuilder aDocument() {
        return new DocumentBuilder();
    }

    public static final class WorkerBuilder {
        private int id = WORKER_ID;
        private String firstName = "Pat";
        private String lastName = "Lee";
        private String username = USERNAME;
        private String email = EMAIL;
        private String password = ENCODED_PASSWORD;
        private boolean admin;
        private boolean archived;

        public WorkerBuilder withId(int value) { id = value; return this; }
        public WorkerBuilder id(int value) { return withId(value); }
        public WorkerBuilder withUsername(String value) { username = value; return this; }
        public WorkerBuilder username(String value) { return withUsername(value); }
        public WorkerBuilder withEmail(String value) { email = value; return this; }
        public WorkerBuilder email(String value) { return withEmail(value); }
        public WorkerBuilder withPassword(String value) { password = value; return this; }
        public WorkerBuilder asAdmin() { admin = true; return this; }
        public WorkerBuilder admin(boolean value) { admin = value; return this; }
        public WorkerBuilder archived() { archived = true; return this; }

        public Worker build() {
            Worker worker = new Worker(firstName, lastName, username, email, password, admin);
            worker.setWorkerID(id);
            worker.setArchived(archived);
            return worker;
        }
    }

    public static final class CompanyBuilder {
        private int id = COMPANY_ID;
        private String name = "Atelicove Client";
        private boolean archived;

        public CompanyBuilder withId(int value) { id = value; return this; }
        public CompanyBuilder named(String value) { name = value; return this; }
        public CompanyBuilder archived() { archived = true; return this; }

        public Company build() {
            Company company = new Company(name, "100 Main Street", "555-0100", "office@client.test");
            company.setCompanyID(id);
            company.setArchived(archived);
            return company;
        }
    }

    public static final class WorkOrderBuilder {
        private int id = WORK_ORDER_ID;
        private WorkOrderStatus status = WorkOrderStatus.OPEN;
        private boolean archived;
        private Company company;
        private final Set<Worker> workers = new LinkedHashSet<>();

        public WorkOrderBuilder withId(int value) { id = value; return this; }
        public WorkOrderBuilder withStatus(WorkOrderStatus value) { status = value; return this; }
        public WorkOrderBuilder status(WorkOrderStatus value) { return withStatus(value); }
        public WorkOrderBuilder archived() { archived = true; return this; }
        public WorkOrderBuilder archived(boolean value) { archived = value; return this; }
        public WorkOrderBuilder forCompany(Company value) { company = value; return this; }
        public WorkOrderBuilder assignedTo(Worker value) { workers.add(value); return this; }

        public WorkOrder build() {
            WorkOrder order = new WorkOrder();
            order.setWorkOrderID(id);
            order.setStatus(status);
            order.setArchived(archived);
            order.setCompany(company);
            workers.forEach(order::addWorker);
            return order;
        }
    }

    public static final class ProjectBuilder {
        private int id = PROJECT_ID;
        private String name = "Atelicove Project";
        private ProjectStatus status = ProjectStatus.OPEN;
        private boolean archived;
        private final List<Team> teams = new ArrayList<>();
        private final List<WorkOrder> workOrders = new ArrayList<>();

        public ProjectBuilder withId(int value) { id = value; return this; }
        public ProjectBuilder named(String value) { name = value; return this; }
        public ProjectBuilder withStatus(ProjectStatus value) { status = value; return this; }
        public ProjectBuilder status(ProjectStatus value) { return withStatus(value); }
        public ProjectBuilder archived() { archived = true; return this; }
        public ProjectBuilder teams(Team... values) { teams.addAll(List.of(values)); return this; }
        public ProjectBuilder workOrders(WorkOrder... values) { workOrders.addAll(List.of(values)); return this; }

        public Project build() {
            Project project = new Project();
            project.setProjectID(id);
            project.setProjectName(name);
            project.setProjectStatus(status);
            project.setArchived(archived);
            teams.forEach(project::addTeam);
            workOrders.forEach(project::addWorkOrder);
            return project;
        }
    }

    public static final class TeamBuilder {
        private int id = TEAM_ID;
        private String name = "Design Team";
        private final Set<Worker> workers = new LinkedHashSet<>();

        public TeamBuilder withId(int value) { id = value; return this; }
        public TeamBuilder named(String value) { name = value; return this; }
        public TeamBuilder withWorker(Worker value) { workers.add(value); return this; }
        public TeamBuilder workers(Worker... values) { workers.addAll(List.of(values)); return this; }

        public Team build() {
            Team team = new Team();
            team.setTeamID(id);
            team.setTeamName(name);
            team.setWorkers(workers);
            return team;
        }
    }

    public static final class WorkOrderItemBuilder {
        private int id = ITEM_ID;
        private String name = "Design labor";
        private int quantity = 1;
        private BigDecimal price = new BigDecimal("125.00");
        private ItemType type = ItemType.LABOR;
        private WorkOrder workOrder;

        public WorkOrderItemBuilder withId(int value) { id = value; return this; }
        public WorkOrderItemBuilder named(String value) { name = value; return this; }
        public WorkOrderItemBuilder withQuantity(int value) { quantity = value; return this; }
        public WorkOrderItemBuilder pricedAt(String value) { price = new BigDecimal(value); return this; }
        public WorkOrderItemBuilder forWorkOrder(WorkOrder value) { workOrder = value; return this; }

        public WorkOrderItem build() {
            WorkOrderItem item = new WorkOrderItem(name, quantity, price, type, workOrder);
            item.setWorkOrderItemID(id);
            return item;
        }
    }

    public static final class DocumentBuilder {
        private int id = DOCUMENT_ID;
        private String fileName = "report.pdf";
        private byte[] data = {1, 2, 3};
        private WorkOrder workOrder;
        private Project project;
        private Worker uploader = aWorker().build();

        public DocumentBuilder withId(int value) { id = value; return this; }
        public DocumentBuilder named(String value) { fileName = value; return this; }
        public DocumentBuilder forWorkOrder(WorkOrder value) { workOrder = value; project = null; return this; }
        public DocumentBuilder forProject(Project value) { project = value; workOrder = null; return this; }
        public DocumentBuilder uploadedBy(Worker value) { uploader = value; return this; }

        public Document build() {
            Document document = workOrder != null
                    ? new Document(workOrder, fileName, DocumentType.REPORT, data, uploader, "application/pdf", data.length)
                    : new Document(project, fileName, DocumentType.REPORT, data, uploader, "application/pdf", data.length);
            document.setDocumentID(id);
            return document;
        }
    }
}
