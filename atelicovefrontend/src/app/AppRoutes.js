import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../Components/AuthContext';
import { AdminRoute, ProtectedRoute, PublicRoute } from '../Components/ProtectedRoute';

// Public pages
import LoginPage from '../Components/LoginPage';
import UnauthorizedPage from '../Components/UnauthorizedPage';

// Admin pages
import AdminHomePage from '../features/admin/AdminHomePage';
import ManageWorkOrders from '../features/workOrders/ManageWorkOrders';
import ActiveCompanies from '../features/companies/ActiveCompanies';
import ManageCompanies from '../features/companies/ManageCompanies';
import CompanySummary from '../features/companies/CompanySummary';
import ActiveWorkers from '../features/workers/ActiveWorkers';
import ManageWorkers from '../features/workers/ManageWorkers';
import WorkerSummary from '../features/workers/WorkerSummary';
import Settings from '../Components/Settings';
import WorkOrders from '../features/workOrders/WorkOrders';
import WorkOrderDetail from '../features/workOrders/WorkOrderDetail';
import MyAssignments from '../features/workOrders/MyAssignments';
import MyWorkOrderDetail from '../features/workOrders/MyWorkOrderDetail';
import ArchivedWorkOrders from '../features/workOrders/ArchivedWorkOrders';
import ArchivedCompanies from '../features/companies/ArchivedCompanies';
import ArchivedWorkers from '../features/workers/ArchivedWorkers';
import ArchivedProjects from '../Components/ArchivedProjects';
import Documents from '../features/documents/Documents';
import ProjectsPage from '../features/projects/ProjectsPage';
import ProjectStudioPage from '../features/projectStudio/ProjectStudioPage';
import ProjectSummary from '../features/projects/ProjectSummary';

// Worker pages
import HomePage from '../Components/HomePage';
import InspectorAssignedWork from '../Components/InspectorAssignedWork';
import InspectorBillingPage from '../Components/InspectorBillingPage';


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
              <Route index element={<div>Project Studio</div>} />
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
          <Route element={<ProtectedRoute />}>
            <Route path="/worker" element={<HomePage />}>
              <Route index element={<div>Project Studio</div>} />
              <Route path="assigned" element={<InspectorAssignedWork />} />
              <Route path="my-assignments" element={<MyAssignments />} />
              <Route path="my-assignments/:workOrderID" element={<MyWorkOrderDetail />} />
              <Route path="projects/:projectID/edit" element={<ProjectsPage mode="worker-edit" title="Project" subtitle="Review project details and action items." />} />
              <Route path="billing" element={<InspectorBillingPage />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/worker" replace />} />
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
