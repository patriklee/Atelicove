import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../Components/AuthContext';
import { AdminRoute, PublicRoute, WorkerRoute } from '../Components/ProtectedRoute';

// Public pages
import LoginPage from '../Components/LoginPage';
import UnauthorizedPage from '../Components/UnauthorizedPage';

// Admin pages
import { AdminHomePage, Settings } from '../features/admin';
import {
  ActiveCompanies,
  ArchivedCompanies,
  CompanySummary,
  ManageCompanies,
} from '../features/companies';
import { Documents } from '../features/documents';
import { ArchivedProjects, ProjectsPage, ProjectSummary } from '../features/projects';
import { ProjectStudioPage } from '../features/projectStudio';
import {
  ActiveWorkers,
  ArchivedWorkers,
  ManageWorkers,
  WorkerHomePage,
  WorkerSummary,
} from '../features/workers';
import {
  ArchivedWorkOrders,
  ManageWorkOrders,
  MyAssignments,
  MyWorkOrderDetail,
  WorkOrderDetail,
  WorkOrders,
  WorkerAssignedWork,
  WorkerBillingPage,
} from '../features/workOrders';

// Worker pages


function AppRoutes() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Route>
          
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminHomePage />}>
              <Route path="manage-workorders" element={<ManageWorkOrders />} />
              <Route path="companies" element={<ActiveCompanies />} />
              <Route path="manage-companies" element={<ManageCompanies />} />
              <Route path="manage-companies/:companyID" element={<ManageCompanies />} />
              <Route path="companies/:companyID" element={<CompanySummary />} />
              <Route path="documents" element={<Documents />} />
              <Route path="workers" element={<ActiveWorkers />} />
              <Route path="manage-workers" element={<ManageWorkers />} />
              <Route path="manage-workers/:workerID" element={<ManageWorkers />} />
              <Route path="workers/:workerID" element={<WorkerSummary />} />
              <Route path="archive/workorders" element={<ArchivedWorkOrders />} />
              <Route path="archive/projects" element={<ArchivedProjects />} />
              <Route path="archive/companies" element={<ArchivedCompanies />} />
              <Route path="archive/workers" element={<ArchivedWorkers />} />
              <Route path="settings" element={<Settings />} />
              <Route path="my-assignments" element={<MyAssignments />} />
              <Route path="my-assignments/:workOrderID" element={<MyWorkOrderDetail />} />
              <Route path="projects/active" element={<ProjectStudioPage />} />
              <Route path="projects/:projectID" element={<ProjectSummary />} />
			  <Route path="workorders" element={<WorkOrders />} />
              <Route path="workorders/:workOrderID" element={<WorkOrderDetail />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Route>

          {/* Worker Routes */}
          <Route element={<WorkerRoute />}>
            <Route path="/worker" element={<WorkerHomePage />}>
              <Route index element={<Navigate to="my-assignments" replace />} />
              <Route path="assigned" element={<WorkerAssignedWork />} />
              <Route path="my-assignments" element={<MyAssignments />} />
              <Route path="my-assignments/:workOrderID" element={<MyWorkOrderDetail />} />
              <Route path="projects/:projectID/edit" element={<ProjectsPage mode="worker-edit" title="Project" subtitle="Review project details and action items." />} />
              <Route path="billing" element={<WorkerBillingPage />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="my-assignments" replace />} />
            </Route>
          </Route>

          {/* Catch All Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default AppRoutes;
