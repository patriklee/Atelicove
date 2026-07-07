import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import WorkOrderDocuments from '../../../Components/WorkOrderDocuments';
import DraftTeamsPanel from '../../draftStudio/teams/DraftTeamsPanel';
import ProjectDialogs from '../dialogs/ProjectDialogs';
import { ProjectsPageHeader } from '../components';
import DraftProjectsTable from '../../draftStudio/projects/DraftProjectsTable';
import ProjectActionItemsPanel from '../actionItems/ProjectActionItemsPanel';
import ProjectCommentsPanel from '../comments/ProjectCommentsPanel';
import { ProjectDetailsPanel } from '../details';
import { ProjectStudioProjectsTable } from '../../projectStudio/projects';
import { ProjectReviewArchivePanel } from '../../projectStudio/review';
import { ProjectEditorForm } from '../../projectStudio/editor';
import { ProjectWorkOrdersPanel } from '../../projectStudio/workOrders';
import { STUDIO_VIEWS } from '../constants';

/**
 * ProjectsWorkspaceLayout owns the large visual composition for ProjectsPage.
 *
 * ProjectsPage still owns data, state, and actions. This keeps the first
 * final-extraction pass safe while making the page itself much easier to scan.
 */
export default function ProjectsWorkspaceLayout({ workspace }) {
  const {
    loading,
    title,
    subtitle,
    mode,
    studioView,
    requestProjectEditLeave,
    setProjectStudioPreloadSuppressed,
    setStudioView,
    clearLoadedProject,
    message,
    isProjectEdit,
    isProjectStudioEditView,
    navigate,
    selectedProject,
    showProjectCostBox,
    formatMoney,
    isEditorView,
    isStudioEditView,
    projectDetailsPanel,
    showAdminEditTools,
    showCreationStudio,
    isActiveProjectEditor,
    draftStudioLabel,
    projectForm,
    projects,
    teams,
    projectTeamSelectOptions,
    activeProjectOptions,
    saving,
    saveProject,
    setProjectForm,
    loadProjectIntoForm,
    requestLaunchProject,
    deleteDraftProject,
    submitProjectForReview,
    projectWorkOrdersAreComplete,
    projectHasEmptyAssociatedTeam,
    emptyProjectTeamNames,
    draftStudioProjectTableProjects,
    draftStudioProjectTableView,
    setDraftStudioProjectTableView,
    openDraftStudioProjectForEdit,
    setProjectWorkOrdersDialog,
    formatDateTime,
    projectDraftEstimatedCost,
    plannedTeamCount,
    projectWorkOrderCount,
    assignableTeams,
    workers,
    selectedProjectTeamIDs,
    addProjectTeam,
    removeProjectTeam,
    saveDraftOnlyPlannedTeam,
    selectedWorkOrderProject,
    workOrderForm,
    attachableWorkOrders,
    companies,
    associatedWorkOrdersFor,
    teamForWorkOrder,
    workersOutsideWorkOrderTeam,
    workOrderTeamName,
    workOrderCost,
    createAndAttachWorkOrder,
    setWorkOrderForm,
    setWorkOrderTeamsDialog,
    editAssociatedWorkOrder,
    removeAssociatedWorkOrder,
    commentProjectID,
    commentType,
    commentText,
    commentTypes,
    addComment,
    setCommentType,
    setCommentText,
    actionItemsPanel,
    reviewProjects,
    archiveProjects,
    projectReadyToArchive,
    approveProject,
    denyProject,
    archiveProject,
    showProjectList,
    visibleProjects,
    openProjectFromList,
    setProjectTeamsDialog,
    setProjectCommentsDialog,
    setProjectActionItemsDialog,
    openDraftSnapshot,
    associatedDraftsFor,
    launchSignatureProject,
    setLaunchSignatureProject,
    launchDraftWorkOrderIDs,
    setLaunchDraftWorkOrderIDs,
    launchSignature,
    setLaunchSignature,
    launchProject,
    draftStudioProjectDetailsDialog,
    setDraftStudioProjectDetailsDialog,
    workerName,
    workOrderTeamsDialog,
    projectTeamsDialog,
    plannedTeamsForProject,
    projectCommentsDialog,
    projectActionItemsDialog,
    projectWorkOrdersDialog,
    snapshotDialog,
    setSnapshotDialog,
    snapshotsForDraft,
    selectSnapshot,
    deleteSnapshot,
  } = workspace;

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3, pb: 8 }}>
      <ProjectsPageHeader
        title={title}
        subtitle={subtitle}
        mode={mode}
        studioView={studioView}
        onDraftView={() => {
          if (studioView === STUDIO_VIEWS.DRAFT) {
            return;
          }
          requestProjectEditLeave(() => {
            if (mode === 'active') {
              setProjectStudioPreloadSuppressed(true);
            }
            setStudioView(STUDIO_VIEWS.DRAFT);
            clearLoadedProject();
          });
        }}
        onEditView={() => {
          if (studioView === STUDIO_VIEWS.EDIT) {
            return;
          }
          requestProjectEditLeave(() => {
            if (mode === 'active') {
              setProjectStudioPreloadSuppressed(false);
            }
            setStudioView(STUDIO_VIEWS.EDIT);
          });
        }}
      />

      {message && <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>}

      {isProjectEdit && !isProjectStudioEditView && (
        <Button variant="outlined" onClick={() => requestProjectEditLeave(() => navigate(-1))} sx={{ mb: 2 }}>
          Back
        </Button>
      )}

      {isProjectEdit && !selectedProject && (
        <Alert severity="warning" sx={{ mb: 2 }}>Project not found.</Alert>
      )}

      {showProjectCostBox && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                {selectedProject.projectStatus === 'DRAFT' ? 'Estimated Cost' : 'Actual Cost'}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {selectedProject.projectStatus === 'DRAFT'
                  ? formatMoney(selectedProject.estimatedCost)
                  : formatMoney(selectedProject.actualCost)}
              </Typography>
            </Box>
            <Chip label={selectedProject.projectStatus.replaceAll('_', ' ')} />
          </Stack>
        </Paper>
      )}

      {isEditorView && selectedProject && !isStudioEditView && !isProjectStudioEditView && projectDetailsPanel}

      {showAdminEditTools && (
        <Grid
          container
          rowSpacing={(isProjectStudioEditView || isStudioEditView) && selectedProject ? 6 : 3}
          columnSpacing={(isProjectStudioEditView || isStudioEditView) && selectedProject ? 5 : 3}
          sx={{ mb: 4 }}
        >
          <Grid item xs={12} lg={showCreationStudio || isStudioEditView || isProjectStudioEditView ? 5 : 7}>
            <ProjectEditorForm
              draftStudioLabel={draftStudioLabel}
              isStudioEditView={isStudioEditView}
              isProjectStudioEditView={isProjectStudioEditView}
              isActiveProjectEditor={isActiveProjectEditor}
              isEditorView={isEditorView}
              showCreationStudio={showCreationStudio}
              selectedProject={selectedProject}
              projectForm={projectForm}
              projects={projects}
              teams={teams}
              projectTeamSelectOptions={projectTeamSelectOptions}
              activeProjectOptions={activeProjectOptions}
              saving={saving}
              onSubmit={saveProject}
              onProjectFormChange={setProjectForm}
              onLoadProject={loadProjectIntoForm}
              onClearLoadedProject={clearLoadedProject}
              onLaunchProject={requestLaunchProject}
              onDeleteDraftProject={deleteDraftProject}
              onSubmitForReview={submitProjectForReview}
              formatMoney={formatMoney}
              projectWorkOrdersAreComplete={projectWorkOrdersAreComplete}
              projectHasEmptyAssociatedTeam={projectHasEmptyAssociatedTeam}
              emptyProjectTeamNames={emptyProjectTeamNames}
            />
          </Grid>

          {isProjectStudioEditView && selectedProject && (
          <Grid item xs={12} lg={7}>
            {projectDetailsPanel}
          </Grid>
          )}

          {showCreationStudio && (
          <Grid item xs={12} lg={7}>
            <DraftProjectsTable
              projects={draftStudioProjectTableProjects}
              view={draftStudioProjectTableView}
              onViewChange={setDraftStudioProjectTableView}
              onOpenProject={openDraftStudioProjectForEdit}
              onOpenWorkOrders={setProjectWorkOrdersDialog}
              formatMoney={formatMoney}
              formatDateTime={formatDateTime}
              projectDraftEstimatedCost={projectDraftEstimatedCost}
              plannedTeamCount={plannedTeamCount}
              projectWorkOrderCount={projectWorkOrderCount}
            />
          </Grid>
          )}

          {isStudioEditView && selectedProject && (
          <Grid item xs={12} lg={7}>
            {projectDetailsPanel}
          </Grid>
          )}

          {isEditorView && selectedProject && (
          <Grid item xs={12} lg={5} sx={{ mt: (isProjectStudioEditView || isStudioEditView) ? 4 : 0 }}>
            <DraftTeamsPanel
              selectedProject={selectedProject}
              teams={assignableTeams}
              workers={workers}
              selectedTeamIDs={selectedProjectTeamIDs}
              saving={saving}
              isDraftMode={isStudioEditView}
              onAddTeam={addProjectTeam}
              onRemoveTeam={removeProjectTeam}
              onSaveDraftTeam={saveDraftOnlyPlannedTeam}
            />
          </Grid>
          )}

          {isEditorView && selectedProject && (
          <Grid item xs={12} lg={7} sx={{ mt: (isProjectStudioEditView || isStudioEditView) ? 4 : 0 }}>
            <ProjectWorkOrdersPanel
              selectedWorkOrderProject={selectedWorkOrderProject}
              workOrderForm={workOrderForm}
              attachableWorkOrders={attachableWorkOrders}
              assignableTeams={assignableTeams}
              companies={companies}
              saving={saving}
              associatedWorkOrdersFor={associatedWorkOrdersFor}
              teamForWorkOrder={teamForWorkOrder}
              workersOutsideWorkOrderTeam={workersOutsideWorkOrderTeam}
              workOrderTeamName={workOrderTeamName}
              workOrderCost={workOrderCost}
              onSubmit={createAndAttachWorkOrder}
              onWorkOrderFormChange={setWorkOrderForm}
              onOpenWorkOrderTeams={setWorkOrderTeamsDialog}
              onEditAssociatedWorkOrder={editAssociatedWorkOrder}
              onRemoveAssociatedWorkOrder={removeAssociatedWorkOrder}
            />
          </Grid>
          )}

          {isEditorView && selectedProject && (
          <Grid item xs={12} lg={5} sx={{ mt: (isProjectStudioEditView || isStudioEditView) ? 4 : 0 }}>
            <ProjectCommentsPanel
              selectedProject={selectedProject}
              isEditorView={isEditorView}
              isStudioEditView={isStudioEditView}
              commentProjectID={commentProjectID}
              commentType={commentType}
              commentText={commentText}
              commentTypes={commentTypes}
              saving={saving}
              onSubmit={addComment}
              onCommentTypeChange={setCommentType}
              onCommentTextChange={setCommentText}
            />
          </Grid>
          )}

          {isEditorView && selectedProject && ['DRAFT', 'ACTIVE'].includes(selectedProject.projectStatus) && (
            <Grid item xs={12}>
              <WorkOrderDocuments
                basePath={`/projects/${selectedProject.projectID}/documents`}
                canManage={!selectedProject.archived}
                title={isStudioEditView ? 'Draft Project Documents' : 'Project Documents'}
                emptyMessage="No documents are attached to this project."
              />
            </Grid>
          )}
        </Grid>
      )}

      {isEditorView && actionItemsPanel}

      {isProjectStudioEditView && (
        <ProjectReviewArchivePanel
          reviewProjects={reviewProjects}
          archiveProjects={archiveProjects}
          saving={saving}
          projectReadyToArchive={projectReadyToArchive}
          onOpenProject={(project) => navigate(`/admin/projects/${project.projectID}`)}
          onApproveProject={approveProject}
          onDenyProject={denyProject}
          onArchiveProject={archiveProject}
        />
      )}

      {showProjectList && (
        <ProjectStudioProjectsTable
          mode={mode}
          isStudioEditView={isStudioEditView}
          visibleProjects={visibleProjects}
          onOpenProject={openProjectFromList}
          onOpenTeams={setProjectTeamsDialog}
          onOpenWorkOrders={setProjectWorkOrdersDialog}
          onOpenComments={setProjectCommentsDialog}
          onOpenActionItems={setProjectActionItemsDialog}
          onOpenDraftSnapshot={openDraftSnapshot}
          associatedDraftsFor={associatedDraftsFor}
          plannedTeamCount={plannedTeamCount}
          projectWorkOrderCount={projectWorkOrderCount}
          formatMoney={formatMoney}
          formatDateTime={formatDateTime}
        />
      )}

      <ProjectDialogs
        launchSignatureProject={launchSignatureProject}
        setLaunchSignatureProject={setLaunchSignatureProject}
        launchDraftWorkOrderIDs={launchDraftWorkOrderIDs}
        setLaunchDraftWorkOrderIDs={setLaunchDraftWorkOrderIDs}
        launchSignature={launchSignature}
        setLaunchSignature={setLaunchSignature}
        saving={saving}
        launchProject={launchProject}
        draftStudioProjectDetailsDialog={draftStudioProjectDetailsDialog}
        setDraftStudioProjectDetailsDialog={setDraftStudioProjectDetailsDialog}
        formatMoney={formatMoney}
        projectDraftEstimatedCost={projectDraftEstimatedCost}
        associatedWorkOrdersFor={associatedWorkOrdersFor}
        workerName={workerName}
        workOrderCost={workOrderCost}
        workOrderTeamsDialog={workOrderTeamsDialog}
        setWorkOrderTeamsDialog={setWorkOrderTeamsDialog}
        projectTeamsDialog={projectTeamsDialog}
        setProjectTeamsDialog={setProjectTeamsDialog}
        plannedTeamsForProject={plannedTeamsForProject}
        projectCommentsDialog={projectCommentsDialog}
        setProjectCommentsDialog={setProjectCommentsDialog}
        projectActionItemsDialog={projectActionItemsDialog}
        setProjectActionItemsDialog={setProjectActionItemsDialog}
        projectWorkOrdersDialog={projectWorkOrdersDialog}
        setProjectWorkOrdersDialog={setProjectWorkOrdersDialog}
        navigate={navigate}
        snapshotDialog={snapshotDialog}
        setSnapshotDialog={setSnapshotDialog}
        snapshotsForDraft={snapshotsForDraft}
        selectSnapshot={selectSnapshot}
        deleteSnapshot={deleteSnapshot}
      />
    </Box>
  );
}
