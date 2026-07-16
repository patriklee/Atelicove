const worker = (workerID, firstName, lastName, role, archived = false, admin = false) => {
  const username = admin ? 'patricia' : `${firstName[0]}${lastName}`.toLowerCase();
  const email = `${username}@atelicove.example`;
  return {
    workerID, id: workerID,
    firstName, lastName, username, email,
    password: admin ? 'Admin@123' : 'Worker@123', isAdmin: admin,
    workerFName: firstName, workerLName: lastName, workerUser: username,
    workerEmail: email, workerPW: admin ? 'Admin@123' : 'Worker@123', admin,
    workerDisplayName: `${firstName} ${lastName}`,
    role,
    lastLoginAt: archived ? '2026-03-14T16:00:00' : `2026-07-${String((workerID % 12) + 3).padStart(2, '0')}T08:30:00`,
    archived,
    archivedAt: archived ? '2026-04-01T17:00:00' : null,
  };
};

export const mockWorkers = [
  worker(1, 'Patricia', 'Morgan', 'Administrator', false, true),
  worker(2, 'Maya', 'Carter', 'Master Electrician'),
  worker(3, 'Jordan', 'Lee', 'Electrical Technician'),
  worker(4, 'Samuel', 'Rivera', 'Mechanical Supervisor'),
  worker(5, 'Elena', 'Brooks', 'HVAC Technician'),
  worker(6, 'Marcus', 'Hill', 'Millwright'),
  worker(7, 'Priya', 'Shah', 'Installation Lead'),
  worker(8, 'Noah', 'Williams', 'Carpenter'),
  worker(9, 'Olivia', 'Chen', 'Project Coordinator'),
  worker(10, 'Darius', 'Cole', 'Safety Coordinator'),
  worker(11, 'Avery', 'Bennett', 'Field Technician'),
  worker(12, 'Camila', 'Torres', 'Welder'),
  worker(13, 'Ethan', 'Foster', 'Equipment Operator'),
  worker(14, 'Grace', 'Kim', 'Controls Specialist'),
  worker(15, 'Isaac', 'Reed', 'Plumber'),
  worker(16, 'Layla', 'Hassan', 'Estimator'),
  worker(17, 'Mateo', 'Alvarez', 'Concrete Finisher'),
  worker(18, 'Natalie', 'Price', 'Document Controller'),
  worker(19, 'Owen', 'Murphy', 'Inspector'),
  worker(20, 'Zoe', 'Campbell', 'Procurement Specialist'),
  worker(21, 'Caleb', 'Turner', 'Retired Electrician', true),
  worker(22, 'Sofia', 'Martinez', 'Former Project Coordinator', true),
];

const company = (companyID, companyName, address, phone, email, archived = false) => ({
  companyID, id: companyID, name: companyName, companyName,
  address, companyAddress: address, phone, companyPhone: phone, email, companyEmail: email,
  archived, archivedAt: archived ? '2026-03-31T17:00:00' : null,
});

export const mockCompanies = [
  company(101, 'Northwind Manufacturing', '1840 Foundry Road, Milwaukee, WI 53204', '414-555-0120', 'facilities@northwind.example'),
  company(102, 'Atlas Construction', '725 Mason Avenue, Madison, WI 53703', '608-555-0142', 'projects@atlasconstruction.example'),
  company(103, 'Blue Ridge Electric', '410 Copper Way, Waukesha, WI 53186', '262-555-0188', 'dispatch@blueridgeelectric.example'),
  company(104, 'Harbor Logistics', '92 Port Terminal Drive, Racine, WI 53403', '262-555-0165', 'operations@harborlogistics.example'),
  company(105, 'Summit Engineering', '330 Alpine Plaza, Green Bay, WI 54301', '920-555-0117', 'archive@summitengineering.example', true),
];

const team = (teamID, teamName, workerIndexes, projectStartedAt = null) => ({
  teamID, id: teamID, teamName, name: teamName, projectStartedAt,
  workers: workerIndexes.map(index => mockWorkers[index]),
});

export const mockTeams = [
  team(201, 'Electrical', [1, 2, 13, 18], '2026-04-06T07:00:00'),
  team(202, 'Mechanical', [3, 4, 5, 11, 14], '2026-03-16T07:00:00'),
  team(203, 'Installation', [6, 7, 12, 16], '2026-05-11T07:30:00'),
  team(204, 'Administration', [0, 8, 9, 15, 17, 19]),
  team(205, 'Field Operations', [10, 12, 16, 18], '2026-02-09T06:30:00'),
];

const item = (workOrderID, index, itemType, itemName, quantity, price) => ({
  workOrderItemID: workOrderID * 10 + index,
  id: workOrderID * 10 + index,
  itemType, itemName, name: itemName, quantity, price,
});

const document = (documentID, fileName, documentType, createdAt, uploadedBy = 'Natalie Price') => ({
  documentID, id: documentID, fileName, originalFileName: fileName, documentType,
  mimeType: fileName.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  fileSize: 85000 + (documentID % 9) * 47000,
  uploadedByWorkerID: 18, uploadedBy, createdAt, lastModifiedAt: createdAt,
  archived: false, archivedAt: null,
});

const workOrderDocumentNames = {
  1001: ['PanelSchedule.pdf', 'REPORT'], 1004: ['ConcreteDeliveryReceipt.pdf', 'RECEIPT'],
  1007: ['InspectionReport.docx', 'WORK_ORDER'], 1010: ['SafetyChecklist.pdf', 'OTHER'],
  1013: ['ControlsCommissioningReport.pdf', 'WORK_ORDER'], 1016: ['RoofInspectionReport.pdf', 'OTHER'],
  1019: ['DockLevelerServiceReport.pdf', 'WORK_ORDER'], 1022: ['PressureTestResults.pdf', 'OTHER'],
  1027: ['FinalPunchList.docx', 'WORK_ORDER'], 1029: ['LegacyPanelDiagram.pdf', 'OTHER'],
};

const workOrderSpecs = [
  [1001, 'Main service panel upgrade', 'Replace the obsolete main distribution panel and label all feeder circuits.', 0, [1, 2], 'ACTIVE', [['MATERIAL', '400A distribution panel', 1, 4200], ['MATERIAL', 'Copper wire', 320, 3.4], ['MATERIAL', 'Circuit breakers', 18, 86], ['LABOR', 'Electrical installation', 48, 92]]],
  [1002, 'Production floor conduit', 'Install conduit drops for the expanded assembly cells.', 0, [1, 2, 10], 'OPEN', [['MATERIAL', 'EMT conduit', 420, 2.2], ['MATERIAL', 'Junction box', 24, 18], ['MATERIAL', 'Fasteners', 8, 14], ['LABOR', 'Conduit installation', 56, 82]]],
  [1003, 'Emergency lighting test', 'Test emergency fixtures and replace failed battery packs.', 0, [2, 18], 'IN_REVIEW', [['MATERIAL', 'Emergency battery pack', 12, 64], ['MATERIAL', 'LED exit sign', 4, 92], ['OTHER', 'Lift rental', 1, 380], ['LABOR', 'Testing and replacement', 20, 78]]],
  [1004, 'Equipment pad foundation', 'Pour reinforced pads for the new packaging equipment.', 1, [12, 16], 'ACTIVE', [['MATERIAL', 'Concrete mix', 18, 145], ['MATERIAL', 'Rebar', 44, 17], ['MATERIAL', 'Anchor bolts', 16, 22], ['LABOR', 'Concrete placement', 36, 76]]],
  [1005, 'Steel platform fabrication', 'Fabricate and install the service platform above line three.', 1, [5, 11], 'OPEN', [['MATERIAL', 'Structural steel', 2400, 1.9], ['MATERIAL', 'Welding wire', 6, 48], ['MATERIAL', 'Safety railing', 72, 38], ['LABOR', 'Fabrication labor', 64, 88]]],
  [1006, 'Packaging line alignment', 'Align conveyors and verify guards before startup.', 0, [3, 5], 'ACTIVE', [['LABOR', 'Mechanical alignment', 40, 94], ['MATERIAL', 'Machine shims', 12, 19], ['MATERIAL', 'Drive belt', 4, 126], ['OTHER', 'Laser alignment rental', 2, 185]]],
  [1007, 'Electrical rough-in inspection', 'Document rough-in compliance before walls are closed.', 2, [1, 18], 'COMPLETE', [['LABOR', 'Electrical inspection', 8, 108], ['MATERIAL', 'Circuit labels', 6, 12], ['OTHER', 'Permit fee', 1, 240], ['MATERIAL', 'Safety equipment', 2, 48]]],
  [1008, 'Office lighting installation', 'Install efficient fixtures and occupancy controls.', 2, [2, 6], 'ACTIVE', [['MATERIAL', 'LED troffer', 46, 118], ['MATERIAL', 'Occupancy sensor', 18, 76], ['MATERIAL', 'Copper wire', 500, 1.8], ['LABOR', 'Fixture installation', 72, 80]]],
  [1009, 'Conference room finishes', 'Complete paint, trim, and acoustic panel installation.', 1, [6, 7], 'OPEN', [['MATERIAL', 'Interior paint', 24, 39], ['MATERIAL', 'Acoustic wall panel', 20, 94], ['MATERIAL', 'Finish fasteners', 5, 16], ['LABOR', 'Finish carpentry', 48, 74]]],
  [1010, 'Life-safety walkthrough', 'Complete the pre-occupancy safety walkthrough.', 2, [9, 18], 'IN_REVIEW', [['LABOR', 'Safety inspection', 12, 96], ['MATERIAL', 'Safety signage', 18, 28], ['MATERIAL', 'Fire extinguisher', 6, 84], ['OTHER', 'Inspection filing fee', 1, 175]]],
  [1011, 'AHU replacement', 'Remove the failed air handler and install the replacement unit.', 0, [3, 4, 10], 'ACTIVE', [['MATERIAL', 'Air handling unit', 1, 13800], ['MATERIAL', 'Flexible duct connector', 4, 112], ['MATERIAL', 'Vibration isolator', 8, 74], ['LABOR', 'HVAC replacement labor', 72, 98]]],
  [1012, 'Ductwork modifications', 'Modify supply branches for the revised production layout.', 0, [4, 5], 'OPEN', [['MATERIAL', 'Galvanized duct', 220, 18], ['MATERIAL', 'Duct insulation', 180, 7.5], ['MATERIAL', 'Hangers and fasteners', 10, 24], ['LABOR', 'Sheet metal installation', 52, 86]]],
  [1013, 'Building controls integration', 'Connect the new equipment to the building automation system.', 0, [4, 13], 'IN_REVIEW', [['MATERIAL', 'DDC controller', 3, 680], ['MATERIAL', 'Temperature sensor', 14, 84], ['MATERIAL', 'Control cable', 650, 1.25], ['LABOR', 'Controls programming', 40, 112]]],
  [1014, 'Loading dock drainage', 'Correct standing water at dock doors four through six.', 3, [10, 14, 16], 'ACTIVE', [['MATERIAL', 'PVC pipe', 140, 8.2], ['MATERIAL', 'Channel drain', 42, 54], ['MATERIAL', 'Concrete mix', 6, 145], ['LABOR', 'Drainage installation', 44, 82]]],
  [1015, 'Dock canopy lighting', 'Add weather-rated lighting across the outbound dock.', 2, [1, 2], 'OPEN', [['MATERIAL', 'Weatherproof LED fixture', 14, 164], ['MATERIAL', 'PVC conduit', 220, 3.1], ['MATERIAL', 'Junction box', 12, 24], ['LABOR', 'Exterior electrical labor', 36, 88]]],
  [1016, 'Warehouse roof repairs', 'Seal penetrations and replace damaged roof membrane.', 1, [6, 10], 'ACTIVE', [['MATERIAL', 'Roof membrane', 900, 4.8], ['MATERIAL', 'Flashing kit', 12, 68], ['MATERIAL', 'Roofing fasteners', 10, 21], ['LABOR', 'Roof repair labor', 48, 79]]],
  [1017, 'Fire suppression supports', 'Install supports for the relocated sprinkler mains.', 1, [6, 12], 'OPEN', [['MATERIAL', 'Pipe hanger', 68, 14], ['MATERIAL', 'Threaded rod', 180, 3.2], ['MATERIAL', 'Concrete anchor', 72, 5.4], ['LABOR', 'Support installation', 32, 76]]],
  [1018, 'Office furniture installation', 'Assemble workstations and conference-room furniture.', 3, [6, 7], 'COMPLETE', [['MATERIAL', 'Workstation hardware', 28, 46], ['MATERIAL', 'Cable management tray', 28, 32], ['OTHER', 'Delivery handling', 1, 620], ['LABOR', 'Furniture installation', 56, 68]]],
  [1019, 'Dock leveler overhaul', 'Rebuild hydraulic dock levelers at bays two and three.', 3, [3, 5], 'IN_REVIEW', [['MATERIAL', 'Hydraulic seal kit', 2, 480], ['MATERIAL', 'Hydraulic fluid', 8, 32], ['MATERIAL', 'Pivot pin set', 2, 220], ['LABOR', 'Dock equipment service', 36, 96]]],
  [1020, 'Trailer yard lighting', 'Restore lighting along the north trailer staging area.', 3, [1, 10], 'OPEN', [['MATERIAL', 'LED pole fixture', 8, 540], ['MATERIAL', 'Copper wire', 900, 2.1], ['MATERIAL', 'Weatherproof junction box', 8, 42], ['LABOR', 'Pole light repair', 40, 88]]],
  [1021, 'Preventive motor service', 'Complete quarterly service on production motors.', 0, [3, 5], 'COMPLETE', [['MATERIAL', 'Bearing kit', 8, 146], ['MATERIAL', 'Industrial lubricant', 12, 28], ['OTHER', 'Vibration analysis', 8, 72], ['LABOR', 'Motor service labor', 40, 86]]],
  [1022, 'Compressed-air leak repair', 'Repair leaks identified during the plant energy audit.', 0, [3, 14], 'COMPLETE', [['MATERIAL', 'Copper pipe', 110, 12], ['MATERIAL', 'Isolation valve', 14, 68], ['MATERIAL', 'Pipe fittings', 32, 16], ['LABOR', 'Compressed-air repair', 36, 91]]],
  [1023, 'Conveyor guard replacement', 'Replace damaged guards and verify safety interlocks.', 0, [5, 9], 'COMPLETE', [['MATERIAL', 'Conveyor guard panel', 9, 184], ['MATERIAL', 'Safety interlock switch', 6, 96], ['MATERIAL', 'Fasteners', 4, 14], ['LABOR', 'Guard installation', 28, 82]]],
  [1024, 'Quarterly safety audit', 'Document housekeeping, guarding, and PPE compliance.', 0, [9, 18], 'COMPLETE', [['LABOR', 'Facility safety audit', 16, 94], ['MATERIAL', 'Safety equipment', 10, 42], ['MATERIAL', 'Floor marking tape', 18, 24], ['OTHER', 'Compliance filing', 1, 120]]],
  [1025, 'Breakroom plumbing', 'Replace sinks, faucets, and damaged supply piping.', 1, [14, 10], 'ACTIVE', [['MATERIAL', 'Stainless sink', 2, 420], ['MATERIAL', 'Commercial faucet', 2, 285], ['MATERIAL', 'Copper pipe', 80, 11], ['LABOR', 'Plumbing installation', 32, 84]]],
  [1026, 'Interior wall framing', 'Frame new offices along the east mezzanine.', 1, [6, 7], 'OPEN', [['MATERIAL', 'Metal stud', 260, 8.4], ['MATERIAL', 'Drywall sheet', 110, 18], ['MATERIAL', 'Fasteners', 12, 14], ['LABOR', 'Framing and drywall', 72, 72]]],
  [1027, 'Renovation punch list', 'Close the remaining finish and hardware deficiencies.', 1, [6, 8], 'IN_REVIEW', [['MATERIAL', 'Door hardware', 7, 126], ['MATERIAL', 'Touch-up paint', 8, 34], ['MATERIAL', 'Ceiling tile', 24, 16], ['LABOR', 'Punch-list labor', 36, 74]]],
  [1028, 'Final cleaning and turnover', 'Complete construction cleaning and owner turnover.', 1, [8, 17], 'COMPLETE', [['LABOR', 'Final cleaning', 40, 48], ['MATERIAL', 'Cleaning supplies', 1, 280], ['OTHER', 'Waste container', 2, 240], ['LABOR', 'Turnover documentation', 8, 66]]],
  [1029, 'Legacy switchgear survey', 'Historical survey completed before the facility modernization.', 4, [20, 21], 'COMPLETE', [['LABOR', 'Electrical survey', 24, 84], ['MATERIAL', 'Circuit identification tags', 6, 18], ['OTHER', 'Infrared scan', 1, 780], ['MATERIAL', 'Safety equipment', 2, 46]], true],
  [1030, 'Boiler room closeout', 'Archived boiler replacement closeout retained for reference.', 4, [20, 21], 'COMPLETE', [['MATERIAL', 'Boiler gasket kit', 2, 360], ['MATERIAL', 'Steel pipe', 90, 22], ['OTHER', 'Pressure certification', 1, 640], ['LABOR', 'Mechanical closeout', 28, 88]], true],
  [1031, 'Structural condition survey', 'Archived structural survey retained with the decommissioning record.', 4, [16, 21], 'COMPLETE', [['LABOR', 'Structural field survey', 24, 96], ['MATERIAL', 'Concrete test kit', 2, 185], ['OTHER', 'Laboratory analysis', 6, 140], ['MATERIAL', 'Safety equipment', 3, 46]], true],
];

const buildWorkOrder = ([workOrderID, title, description, companyIndex, workerIndexes, status, items, archived = false]) => {
  const assignedWorkers = workerIndexes.map(index => mockWorkers[index]);
  const completed = status === 'COMPLETE';
  const startDay = String((workOrderID % 24) + 1).padStart(2, '0');
  const documentSpec = workOrderDocumentNames[workOrderID];
  return {
    workOrderID, id: workOrderID, title, workOrderName: title,
    comment: description, description,
    workers: assignedWorkers, assignedWorkers,
    company: mockCompanies[companyIndex], status,
    startDateTime: `${archived ? '2025-11' : completed ? '2026-05' : '2026-07'}-${startDay}T08:00:00`,
    endDateTime: completed ? `${archived ? '2025-11' : '2026-06'}-${startDay}T16:30:00` : null,
    archived, archivedAt: archived ? '2026-01-15T10:00:00' : null,
    items: items.map((values, index) => item(workOrderID, index + 1, ...values)),
    documents: documentSpec ? [document(9000 + workOrderID, documentSpec[0], documentSpec[1], `2026-06-${startDay}T15:00:00`)] : [],
    previousWorkers: archived ? assignedWorkers : [],
  };
};

export const mockWorkOrders = workOrderSpecs.map(buildWorkOrder);

const projectCommentText = [
  ['Customer approved the revised equipment layout.', 'Main panel delivery is confirmed for Monday.', 'Concrete pad dimensions were verified in the field.', 'Production access is limited during second shift.', 'Weekly coordination meeting completed with no safety incidents.'],
  ['Demolition is complete in the conference room wing.', 'Waiting for electrical inspection before closing walls.', 'Finish samples were approved by the customer.', 'Furniture delivery moved to Thursday morning.', 'Updated floor plan was distributed to all trade leads.'],
  ['Replacement air handler arrived without shipping damage.', 'Controls sequence was reviewed with facility maintenance.', 'Ductwork measurements match the approved drawings.', 'Startup is scheduled after the weekend shutdown.', 'Temporary cooling remains operational in the office area.'],
  ['Material delivery delayed until Tuesday.', 'Dock doors four through six remain available for operations.', 'Roof repair area passed the moisture inspection.', 'Drainage trench alignment was marked and approved.', 'Night work was authorized for the yard lighting repairs.'],
  ['All quarterly motor inspections are complete.', 'Compressed-air pressure test passed.', 'Conveyor guards were accepted by the safety manager.', 'Final maintenance records were uploaded.', 'Customer signed the preventive-maintenance summary.'],
  ['Framing inspection passed with two minor corrections.', 'Breakroom plumbing rough-in is complete.', 'Paint color was changed to the approved warm gray.', 'Final punch list has seven remaining items.', 'Turnover manuals are being assembled.'],
  ['Field measurements are complete for the warehouse addition.', 'Geotechnical report recommends deeper perimeter footings.', 'Customer approved the revised loading-dock layout.', 'Utility locate is scheduled for next Wednesday.', 'Budget estimate was updated with current concrete pricing.'],
  ['Electrical load study is ready for customer review.', 'Line shutdown window is still awaiting production approval.', 'Equipment vendor supplied updated anchor details.', 'Controls scope was clarified during design review.', 'Draft work orders now reflect the phased installation plan.'],
  ['Office renovation was completed ahead of schedule.', 'Final inspection passed without correction notices.', 'Customer training and turnover are complete.', 'All closeout documents have been accepted.', 'Warranty contacts were provided to facilities staff.'],
  ['Historical switchgear drawings were indexed.', 'Boiler pressure certificate was added to the archive.', 'Previously assigned technicians are retained for audit history.', 'Final invoice reconciliation was completed.', 'Archived project records passed the retention review.'],
];

const actionItemText = [
  ['Confirm shutdown window with production', 'Order remaining conduit', 'Verify equipment-pad anchor locations'],
  ['Schedule electrical inspection', 'Approve conference-room finish sample', 'Update customer turnover checklist'],
  ['Confirm crane arrival time', 'Complete controls point-to-point test', 'Record final airflow measurements'],
  ['Coordinate dock access with operations', 'Verify drainage elevations', 'Schedule roof warranty inspection'],
  ['Upload motor vibration reports', 'Close compressed-air repair tickets', 'Send maintenance summary to customer'],
  ['Verify breakroom fixture measurements', 'Complete remaining punch-list items', 'Assemble owner documentation'],
  ['Review geotechnical recommendations', 'Confirm utility easement limits', 'Update warehouse expansion estimate'],
  ['Approve line shutdown sequence', 'Verify vendor electrical requirements', 'Complete phased staffing plan'],
  ['Archive signed inspection certificate', 'Deliver warranty binder', 'Close final customer action log'],
  ['Index legacy equipment drawings', 'Retain final pressure test report', 'Complete historical cost reconciliation'],
];

const projectDocumentNames = [
  ['SitePlan.pdf', 'SafetyChecklist.pdf'], ['OfficeLayout.pdf', 'InspectionReport.docx'],
  ['HVACSubmittal.pdf', 'ControlsSequence.docx'], ['DrainagePlan.pdf', 'RoofWarranty.pdf'],
  ['MaintenanceSummary.pdf', 'EquipmentInspectionReport.docx'],
];

const commentsFor = projectIndex => projectCommentText[projectIndex].map((commentText, index) => ({
  projectCommentID: 8000 + projectIndex * 10 + index + 1,
  id: 8000 + projectIndex * 10 + index + 1,
  commentText,
  commentType: ['UPDATE', 'GENERAL', 'DECISION', 'WARNING', 'UPDATE'][index],
  author: index % 2 ? 'Patricia Morgan' : 'Olivia Chen',
  createdAt: `2026-07-${String(projectIndex + index + 1).padStart(2, '0')}T${10 + index}:00:00`,
}));

const actionsFor = (projectIndex, completedProject = false) => actionItemText[projectIndex].map((itemText, index) => {
  const completed = completedProject || index === 2;
  return {
    actionItemID: 7000 + projectIndex * 10 + index + 1,
    id: 7000 + projectIndex * 10 + index + 1,
    itemText, title: itemText, completed,
    completedAt: completed ? `2026-06-${String(projectIndex + index + 10).padStart(2, '0')}T15:30:00` : null,
    dueDate: `2026-07-${String(projectIndex + index + 18).padStart(2, '0')}`,
    assignedWorker: index === 0 ? mockWorkers[(projectIndex + 8) % 20] : null,
    assignedTeam: index === 1 ? mockTeams[projectIndex % mockTeams.length] : null,
  };
});

const projectDocumentsFor = projectIndex => {
  const names = projectDocumentNames[projectIndex];
  if (!names) return [];
  return names.map((fileName, index) => document(
    9500 + projectIndex * 10 + index + 1,
    fileName,
    index ? 'OTHER' : 'WORK_ORDER',
    `2026-06-${String(projectIndex * 2 + index + 5).padStart(2, '0')}T14:00:00`,
  ));
};

const order = workOrderID => mockWorkOrders.find(workOrder => workOrder.workOrderID === workOrderID);
const orders = (...workOrderIDs) => workOrderIDs.map(order);

const draftItem = (id, itemType, itemName, quantity, price) => ({
  draftWorkOrderItemID: id, id, itemType, itemName, name: itemName, quantity, price,
});

const draftWorkOrder = (id, title, companyIndex, workerIndexes, items) => ({
  draftWorkOrderID: id, id, workOrderID: null, title, workOrderName: title, status: 'DRAFT',
  comment: `${title} prepared for customer review.`, description: `${title} prepared for customer review.`,
  workers: workerIndexes.map(index => mockWorkers[index]),
  assignedWorkers: workerIndexes.map(index => mockWorkers[index]),
  company: mockCompanies[companyIndex], startDateTime: null, endDateTime: null,
  archived: false, archivedAt: null, items,
});

const project = (projectIndex, values) => {
  const [projectID, projectName, description, budget, projectStatus, teamIndexes, workOrders, archived = false, draftWorkOrders = []] = values;
  const completed = projectStatus === 'COMPLETE';
  return {
    projectID, id: projectID, projectName, name: projectName, description, budget,
    estimatedCost: 0, actualCost: 0, projectStatus, status: projectStatus,
    activatedAt: projectStatus === 'OPEN' ? null : `2026-0${(projectIndex % 5) + 2}-10T08:00:00`,
    completedAt: completed ? '2026-06-28T16:30:00' : null,
    archived, archivedAt: archived ? '2026-07-01T10:00:00' : null,
    plannedTeamsJson: projectStatus === 'OPEN' ? JSON.stringify(teamIndexes.map(index => mockTeams[index])) : null,
    teams: projectStatus === 'OPEN' ? [] : teamIndexes.map(index => mockTeams[index]),
    workOrders, draftWorkOrders,
    comments: commentsFor(projectIndex),
    actionItems: actionsFor(projectIndex, completed),
    documents: projectDocumentsFor(projectIndex),
    snapshots: [], associatedActiveProject: null,
  };
};

export const mockProjects = [
  project(0, [301, 'Production Line Upgrade', 'Electrical, mechanical, and foundation work for a new automated packaging line.', 185000, 'ACTIVE', [0, 1, 4], orders(1001, 1002, 1003, 1004, 1005, 1006)]),
  project(1, [302, 'Office Renovation', 'Renovation of administrative offices, conference rooms, and employee support spaces.', 92000, 'ACTIVE', [0, 2, 3], orders(1007, 1008, 1009, 1010)]),
  project(2, [303, 'HVAC Replacement', 'Replacement of the aging production air handler, duct branches, and controls.', 78000, 'ACTIVE', [1, 0], orders(1011, 1012, 1013)]),
  project(3, [304, 'Warehouse Expansion', 'Loading-dock, roof, drainage, and life-safety improvements for expanded operations.', 240000, 'ACTIVE', [0, 2, 4], orders(1014, 1015, 1016, 1017, 1019, 1020)]),
  project(4, [305, 'Preventive Maintenance Program', 'Completed quarterly maintenance and safety program for plant equipment.', 46000, 'COMPLETE', [1, 4], orders(1021, 1022, 1023, 1024)]),
  project(5, [306, 'Employee Facilities Refresh', 'Breakroom, office framing, finishes, and turnover for the Atlas field office.', 68000, 'IN_REVIEW', [1, 2, 3], orders(1025, 1026, 1027)]),
  project(6, [307, 'Harbor Annex Planning', 'Draft plan for a warehouse annex with new docks and utility connections.', 310000, 'OPEN', [2, 4], [], false, [
    draftWorkOrder(601, 'Annex site preparation', 3, [10, 12], [draftItem(6001, 'LABOR', 'Site layout', 24, 78), draftItem(6002, 'MATERIAL', 'Survey stakes', 40, 8)]),
    draftWorkOrder(602, 'New dock electrical service', 3, [1, 2], [draftItem(6003, 'MATERIAL', 'Electrical switchboard', 1, 6800), draftItem(6004, 'LABOR', 'Electrical installation', 80, 88)]),
  ]]),
  project(7, [308, 'Assembly Cell Modernization', 'Draft phased upgrade for controls, power, and equipment installation.', 215000, 'OPEN', [0, 1, 2], [], false, [
    draftWorkOrder(603, 'Controls cabinet installation', 0, [13, 2], [draftItem(6005, 'MATERIAL', 'Controls cabinet', 3, 2400), draftItem(6006, 'LABOR', 'Controls integration', 60, 110)]),
    draftWorkOrder(604, 'Machine utility connections', 0, [3, 14], [draftItem(6007, 'MATERIAL', 'Copper pipe', 180, 12), draftItem(6008, 'LABOR', 'Utility connection labor', 48, 88)]),
  ]]),
  project(8, [309, 'Completed Facility Fit-Out', 'Completed fit-out retained with its furniture, cleaning, closeout, and warranty records.', 84000, 'COMPLETE', [0, 2, 3], orders(1018, 1028), true]),
  project(9, [310, 'Summit Plant Decommissioning', 'Archived historical project containing legacy electrical, mechanical, and structural records.', 125000, 'COMPLETE', [0, 1, 3], orders(1029, 1030, 1031), true]),
];

export const mockDraftWorkOrders = mockProjects.flatMap(projectRecord => projectRecord.draftWorkOrders || []);
