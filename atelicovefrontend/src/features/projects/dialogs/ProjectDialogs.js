import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { formatDateTime, getWorkOrderWorkers, normalizeWorker } from '../../../model';

const ProjectDialogs = ({
  launchSignatureProject,
  setLaunchSignatureProject,
  launchDraftWorkOrderIDs,
  setLaunchDraftWorkOrderIDs,
  launchSignature,
  setLaunchSignature,
  saving,
  launchProject,

  draftStudioProjectDetailsDialog,
  setDraftStudioProjectDetailsDialog,
  formatMoney,
  projectDraftEstimatedCost,
  associatedWorkOrdersFor,
  workerName,
  workOrderCost,

  workOrderTeamsDialog,
  setWorkOrderTeamsDialog,

  projectTeamsDialog,
  setProjectTeamsDialog,
  plannedTeamsForProject,

  projectCommentsDialog,
  setProjectCommentsDialog,

  projectActionItemsDialog,
  setProjectActionItemsDialog,

  projectWorkOrdersDialog,
  setProjectWorkOrdersDialog,
  navigate,

  snapshotDialog,
  setSnapshotDialog,
  snapshotsForDraft,
  selectSnapshot,
  deleteSnapshot,
}) => (
  <>
    <Dialog open={Boolean(launchSignatureProject)} onClose={() => setLaunchSignatureProject(null)} fullWidth maxWidth="sm">
      <DialogTitle>Launch Project Signature</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            A signature is required before this draft can be launched as an active project.
          </Typography>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Draft work orders to create on launch</Typography>
            {(launchSignatureProject?.draftWorkOrders || []).map(workOrder => (
              <Stack key={workOrder.workOrderID} direction="row" spacing={1} alignItems="center">
                <Checkbox
                  checked={launchDraftWorkOrderIDs.includes(workOrder.workOrderID)}
                  onChange={event => setLaunchDraftWorkOrderIDs(current => (
                    event.target.checked
                      ? Array.from(new Set([...current, workOrder.workOrderID]))
                      : current.filter(id => id !== workOrder.workOrderID)
                  ))}
                />
                <Typography variant="body2">
                  #{workOrder.workOrderID} - {workOrder.plannedTeamName || 'No planned team'}
                </Typography>
              </Stack>
            ))}
            {!(launchSignatureProject?.draftWorkOrders || []).length && (
              <Typography variant="body2" color="text.secondary">
                No draft work orders will be created.
              </Typography>
            )}
          </Box>
          <TextField
            label="Signature"
            fullWidth
            value={launchSignature}
            onChange={event => setLaunchSignature(event.target.value)}
            autoFocus
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setLaunchSignatureProject(null)} disabled={saving}>Cancel</Button>
        <Button variant="contained" startIcon={<RocketLaunchIcon />} disabled={saving || !launchSignature.trim()} onClick={launchProject}>
          Launch Project
        </Button>
      </DialogActions>
    </Dialog>

    <Dialog open={Boolean(draftStudioProjectDetailsDialog)} onClose={() => setDraftStudioProjectDetailsDialog(null)} fullWidth maxWidth="md">
      <DialogTitle>{draftStudioProjectDetailsDialog?.projectName || 'Project Details'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip size="small" label={draftStudioProjectDetailsDialog?.projectStatus || 'UNKNOWN'} />
            <Chip size="small" label={`Budget ${formatMoney(draftStudioProjectDetailsDialog?.budget)}`} />
            <Chip
              size="small"
              label={
                draftStudioProjectDetailsDialog?.projectStatus === 'ACTIVE'
                  ? `Actual ${formatMoney(draftStudioProjectDetailsDialog?.actualCost)}`
                  : `Estimated ${formatMoney(projectDraftEstimatedCost(draftStudioProjectDetailsDialog || {}))}`
              }
            />
          </Stack>
          {draftStudioProjectDetailsDialog?.description && (
            <Typography variant="body2">{draftStudioProjectDetailsDialog.description}</Typography>
          )}

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Teams</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {(draftStudioProjectDetailsDialog?.teams || []).map(team => (
                <Chip key={team.teamID} size="small" label={team.teamName || `Team #${team.teamID}`} />
              ))}
              {!(draftStudioProjectDetailsDialog?.teams || []).length && <Chip size="small" label="No teams" />}
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Work Orders</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Work Order</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Workers</TableCell>
                    <TableCell align="right">Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {associatedWorkOrdersFor(draftStudioProjectDetailsDialog || {}).map(workOrder => (
                    <TableRow key={`${workOrder.status || 'UNKNOWN'}-${workOrder.workOrderID}`}>
                      <TableCell>#{workOrder.workOrderID}</TableCell>
                      <TableCell>{(workOrder.status || 'UNKNOWN').replaceAll('_', ' ')}</TableCell>
                      <TableCell>{workOrder.company?.companyName || workOrder.plannedCompanyName || 'No company'}</TableCell>
                      <TableCell>{getWorkOrderWorkers(workOrder).map(workerName).join(', ') || 'Unassigned'}</TableCell>
                      <TableCell align="right">{formatMoney(workOrderCost(workOrder))}</TableCell>
                    </TableRow>
                  ))}
                  {!associatedWorkOrdersFor(draftStudioProjectDetailsDialog || {}).length && (
                    <TableRow>
                      <TableCell colSpan={5}>No work orders are associated with this project.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDraftStudioProjectDetailsDialog(null)}>Close</Button>
      </DialogActions>
    </Dialog>

    <Dialog open={Boolean(workOrderTeamsDialog)} onClose={() => setWorkOrderTeamsDialog(null)} fullWidth maxWidth="sm">
      <DialogTitle>Work Order #{workOrderTeamsDialog?.workOrder?.workOrderID} Teams</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {workOrderTeamsDialog?.team
                ? workOrderTeamsDialog.team.teamName || `Team #${workOrderTeamsDialog.team.teamID}`
                : 'Team Members'}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(workOrderTeamsDialog?.team?.workers || []).map(worker => (
                    <TableRow key={normalizeWorker(worker).workerID}>
                      <TableCell>{workerName(normalizeWorker(worker))}</TableCell>
                    </TableRow>
                  ))}
                  {!(workOrderTeamsDialog?.team?.workers || []).length && (
                    <TableRow>
                      <TableCell>
                        {workOrderTeamsDialog?.team ? 'No members are listed for this team.' : 'No team is associated with this work order.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Assigned Workers Outside Team</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Worker</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(workOrderTeamsDialog?.workersOutsideTeam || []).map(worker => (
                    <TableRow key={worker.workerID}>
                      <TableCell>{workerName(worker)}</TableCell>
                    </TableRow>
                  ))}
                  {!(workOrderTeamsDialog?.workersOutsideTeam || []).length && (
                    <TableRow>
                      <TableCell>No separately assigned workers.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setWorkOrderTeamsDialog(null)}>Close</Button>
      </DialogActions>
    </Dialog>

    <Dialog open={Boolean(projectTeamsDialog)} onClose={() => setProjectTeamsDialog(null)} fullWidth maxWidth="sm">
      <DialogTitle>{projectTeamsDialog?.projectName || 'Project'} Teams</DialogTitle>
      <DialogContent dividers>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Team</TableCell>
                <TableCell>Workers</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plannedTeamsForProject(projectTeamsDialog || {}).map(team => (
                <TableRow key={team.teamID}>
                  <TableCell>{team.teamName || `Team #${team.teamID}`}</TableCell>
                  <TableCell>
                    {(team.workers || []).length
                      ? (team.workers || []).map(worker => workerName(normalizeWorker(worker))).join(', ')
                      : <Chip size="small" color="warning" label="Associated team is empty" />}
                  </TableCell>
                </TableRow>
              ))}
              {!plannedTeamsForProject(projectTeamsDialog || {}).length && (
                <TableRow>
                  <TableCell colSpan={2}>
                    {projectTeamsDialog?.projectStatus === 'DRAFT'
                      ? 'No planned staffing is saved for this draft project.'
                      : 'No teams are associated with this project.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setProjectTeamsDialog(null)}>Close</Button>
      </DialogActions>
    </Dialog>

    <Dialog open={Boolean(projectCommentsDialog)} onClose={() => setProjectCommentsDialog(null)} fullWidth maxWidth="md">
      <DialogTitle>{projectCommentsDialog?.projectName || 'Project'} Comments</DialogTitle>
      <DialogContent dividers>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Comment</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(projectCommentsDialog?.comments || []).map(comment => (
                <TableRow key={comment.projectCommentID || comment.commentID || `${comment.commentType}-${comment.createdAt}`}>
                  <TableCell>{comment.commentType || 'GENERAL'}</TableCell>
                  <TableCell>{comment.commentText || comment.text || 'No comment text'}</TableCell>
                  <TableCell>{comment.author ? workerName(normalizeWorker(comment.author)) : 'Unknown'}</TableCell>
                  <TableCell>{formatDateTime(comment.createdAt)}</TableCell>
                </TableRow>
              ))}
              {!(projectCommentsDialog?.comments || []).length && (
                <TableRow>
                  <TableCell colSpan={4}>No comments are associated with this project.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setProjectCommentsDialog(null)}>Close</Button>
      </DialogActions>
    </Dialog>

    <Dialog open={Boolean(projectActionItemsDialog)} onClose={() => setProjectActionItemsDialog(null)} fullWidth maxWidth="md">
      <DialogTitle>{projectActionItemsDialog?.projectName || 'Project'} Action Items</DialogTitle>
      <DialogContent dividers>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Action Item</TableCell>
                <TableCell>Assigned To</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(projectActionItemsDialog?.actionItems || []).map(item => (
                <TableRow key={item.actionItemID}>
                  <TableCell>
                    <Chip size="small" color={item.completed ? 'success' : 'default'} label={item.completed ? 'Done' : 'Open'} />
                  </TableCell>
                  <TableCell>{item.itemText || 'Untitled action item'}</TableCell>
                  <TableCell>
                    {item.assignedWorker
                      ? workerName(normalizeWorker(item.assignedWorker))
                      : item.assignedTeam?.teamName || 'General'}
                  </TableCell>
                </TableRow>
              ))}
              {!(projectActionItemsDialog?.actionItems || []).length && (
                <TableRow>
                  <TableCell colSpan={3}>No action items for this project.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setProjectActionItemsDialog(null)}>Close</Button>
      </DialogActions>
    </Dialog>

    <Dialog open={Boolean(projectWorkOrdersDialog)} onClose={() => setProjectWorkOrdersDialog(null)} fullWidth maxWidth="md">
      <DialogTitle>{projectWorkOrdersDialog?.projectName || 'Project'} Work Orders</DialogTitle>
      <DialogContent dividers>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Work Order</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Workers</TableCell>
                <TableCell align="right">Cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...(projectWorkOrdersDialog?.workOrders || []), ...(projectWorkOrdersDialog?.draftWorkOrders || [])].map(workOrder => (
                <TableRow key={`${workOrder.status || 'UNKNOWN'}-${workOrder.workOrderID}`}>
                  <TableCell>
                    {workOrder.status === 'DRAFT' ? (
                      `#${workOrder.workOrderID}`
                    ) : (
                      <Button
                        size="small"
                        onClick={() => navigate(`/admin/workorders/${workOrder.workOrderID}`)}
                        sx={{ justifyContent: 'flex-start', p: 0, textAlign: 'left' }}
                      >
                        #{workOrder.workOrderID}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={(workOrder.status || 'UNKNOWN').replaceAll('_', ' ')} />
                  </TableCell>
                  <TableCell>{workOrder.company?.companyName || workOrder.plannedCompanyName || 'No company'}</TableCell>
                  <TableCell>{getWorkOrderWorkers(workOrder).map(workerName).join(', ') || 'Unassigned'}</TableCell>
                  <TableCell align="right">{formatMoney(workOrderCost(workOrder))}</TableCell>
                </TableRow>
              ))}
              {![...(projectWorkOrdersDialog?.workOrders || []), ...(projectWorkOrdersDialog?.draftWorkOrders || [])].length && (
                <TableRow>
                  <TableCell colSpan={5}>No work orders are associated with this project.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setProjectWorkOrdersDialog(null)}>Close</Button>
      </DialogActions>
    </Dialog>

    <Dialog open={Boolean(snapshotDialog)} onClose={() => setSnapshotDialog(null)} fullWidth maxWidth="md">
      <DialogTitle>{snapshotDialog?.draft?.projectName || 'Draft Snapshot'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2">Snapshot</Typography>
            {snapshotDialog?.snapshot ? (
              <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                <InputLabel>Snapshot</InputLabel>
                <Select
                  value={snapshotDialog.snapshot.projectSnapshotID}
                  label="Snapshot"
                  onChange={event => selectSnapshot(event.target.value)}
                >
                  {snapshotsForDraft(snapshotDialog.activeProject, snapshotDialog.draft.projectID).map(snapshot => (
                    <MenuItem key={snapshot.projectSnapshotID} value={snapshot.projectSnapshotID}>
                      {snapshot.snapshotName || 'Draft snapshot'} - {formatDateTime(snapshot.createdAt)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No snapshot has been saved for this draft yet.
              </Typography>
            )}
          </Box>
          {snapshotDialog?.snapshot && (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip size="small" label={`Budget ${formatMoney(snapshotDialog.snapshot.budget)}`} />
              <Chip size="small" label={`Estimated ${formatMoney(snapshotDialog.snapshot.estimatedCost)}`} />
              <Chip size="small" label={`Difference ${formatMoney(snapshotDialog.snapshot.budgetDifference)}`} />
            </Stack>
          )}
          <Box>
            <Typography variant="subtitle2">Draft Work Orders</Typography>
            {(snapshotDialog?.data?.draftWorkOrders || []).map(order => (
              <Box key={order.workOrderID} sx={{ border: '1px solid #e5e7eb', borderRadius: 1, p: 1.5, mt: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Work order #{order.workOrderID}</Typography>
                <Typography variant="body2" color="text.secondary">{order.comment || 'No note'}</Typography>
                <Typography variant="caption" color="text.secondary">Items</Typography>
                {(order.items || []).map(item => (
                  <Typography key={item.workOrderItemID || item.itemName} variant="body2">
                    {item.itemName || 'Item'} - {item.quantity || 0} x {formatMoney(item.price)}
                  </Typography>
                ))}
                {!(order.items || []).length && <Typography variant="body2">No draft items.</Typography>}
              </Box>
            ))}
            {!(snapshotDialog?.data?.draftWorkOrders || []).length && <Typography variant="body2">No draft work orders in this snapshot.</Typography>}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setSnapshotDialog(null)}>Close</Button>
        <Button color="error" disabled={!snapshotDialog?.snapshot || saving} onClick={deleteSnapshot}>
          Delete Snapshot
        </Button>
      </DialogActions>
    </Dialog>
  </>
);

export default ProjectDialogs;
