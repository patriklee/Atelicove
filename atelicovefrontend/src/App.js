import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './Components/AuthContext';
import { AdminRoute, ProtectedRoute, PublicRoute } from './Components/ProtectedRoute';

// Public pages
import LoginPage from './Components/LoginPage';
import UnauthorizedPage from './Components/UnauthorizedPage';

// Admin pages
import AdminHomePage from './Components/AdminHomePage';
import ManageWorkOrders from './Components/ManageWorkOrders';
import ActiveCompanies from './Components/ActiveCompanies';
import ManageCompanies from './Components/ManageCompanies';
import CompanySummary from './Components/CompanySummary';
import ActiveWorkers from './Components/ActiveWorkers';
import ManageWorkers from './Components/ManageWorkers';
import WorkerSummary from './Components/WorkerSummary';
import Settings from './Components/Settings';
import WorkOrders from './Components/WorkOrders';
import WorkOrderDetail from './Components/WorkOrderDetail';
import MyAssignments from './Components/MyAssignments';
import MyWorkOrderDetail from './Components/MyWorkOrderDetail';
import ArchivedWorkOrders from './Components/ArchivedWorkOrders';
import ArchivedCompanies from './Components/ArchivedCompanies';
import ArchivedWorkers from './Components/ArchivedWorkers';
import Documents from './Components/Documents';
import DraftPage from './Components/DraftPage';

// Worker pages
import HomePage from './Components/HomePage';
import InspectorAssignedWork from './Components/InspectorAssignedWork';
import InspectorBillingPage from './Components/InspectorBillingPage';


function App() {
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
              <Route path="archive/companies" element={<ArchivedCompanies />} />
              <Route path="archive/workers" element={<ArchivedWorkers />} />
              <Route path="settings" element={<Settings />} />
              <Route path="my-assignments" element={<MyAssignments />} />
              <Route path="my-assignments/:workOrderID" element={<MyWorkOrderDetail />} />
              <Route path="projects/active" element={<WorkOrders title="Active Projects" subtitle="Brows currently active projects and edit them as needed." />} />
              <Route path="projects/draft-studio" element={<DraftPage title="Draft Studio" subtitle="Draft projects" />} />
              <Route path="projects/launch-queue" element={<DraftPage title="Launch Queue" subtitle="View drafts" />} />
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

export default App;
