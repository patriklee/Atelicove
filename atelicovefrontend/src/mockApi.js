const today = new Date().toISOString();

const workers = [
  { workerID: 1, firstName: 'Miranda', lastName: 'Admin', email: 'admin@atelicove.test', phone: '555-0101', role: 'ADMIN', isAdmin: true, archived: false },
  { workerID: 2, firstName: 'Andre', lastName: 'Stone', email: 'andre@atelicove.test', phone: '555-0102', role: 'WORKER', isAdmin: false, archived: false },
  { workerID: 3, firstName: 'Sofia', lastName: 'Reyes', email: 'sofia@atelicove.test', phone: '555-0103', role: 'WORKER', isAdmin: false, archived: false },
  { workerID: 4, firstName: 'Mina', lastName: 'Park', email: 'mina@atelicove.test', phone: '555-0104', role: 'WORKER', isAdmin: false, archived: true },
];

const companies = [
  { companyID: 1, companyName: 'Alcove Design Group', email: 'hello@alcove.test', phone: '555-0201', address: '101 Studio Ave', archived: false },
  { companyID: 2, companyName: 'Northstar Medical Supply', email: 'ops@northstar.test', phone: '555-0202', address: '2424 Warehouse Rd', archived: false },
  { companyID: 3, companyName: 'Archived Client Co.', email: 'archive@client.test', phone: '555-0203', address: '1 Old Way', archived: true },
];

const teams = [
  { teamID: 1, teamName: 'Editorial Build Team', workers: [workers[1], workers[2]], active: true, archived: false },
  { teamID: 2, teamName: 'Draft Planning Team', workers: [workers[0], workers[2]], active: true, archived: false },
];

const items = [
  { itemID: 1, description: 'Install shelving and hardware', quantity: 4, price: 125, completed: false },
  { itemID: 2, description: 'Verify document upload workflow', quantity: 1, price: 75, completed: true },
];

const workOrders = [
  { workOrderID: 1, title: 'Showroom Fixture Install', description: 'Install fixtures for the active project.', status: 'OPEN', company: companies[0], workers: [workers[1]], teams: [teams[0]], items, comments: [], archived: false },
  { workOrderID: 2, title: 'Inventory Audit', description: 'Audit project materials and invoice records.', status: 'IN_PROCESS', company: companies[1], workers: [workers[2]], teams: [], items: [], comments: [], archived: false },
  { workOrderID: 3, title: 'Archived Cleanup Order', description: 'Old archived work order.', status: 'COMPLETED', company: companies[2], workers: [workers[3]], teams: [], items: [], comments: [], archived: true },
];

const draftWorkOrders = [
  { workOrderID: 101, draftWorkOrderID: 101, title: 'Draft Lighting Review', description: 'Planned lighting work before launch.', status: 'DRAFT', company: companies[0], workers: [workers[1]], teams: [teams[1]], items: [], comments: [], projectID: 2, isDraft: true },
];

const projects = [
  { projectID: 1, projectName: 'Atelicove Showroom Refresh', projectStatus: 'ACTIVE', status: 'ACTIVE', description: 'Active project with real associations.', company: companies[0], teams: [teams[0]], workOrders: [workOrders[0]], draftWorkOrders: [], actionItems: [{ actionItemID: 1, title: 'Confirm vendor arrival', description: 'Call vendor before install.', completed: false }], comments: [{ projectCommentID: 1, comment: 'Mock project comment.', createdAt: today }], archived: false },
  { projectID: 2, projectName: 'Draft Operations Plan', projectStatus: 'DRAFT', status: 'DRAFT', description: 'Draft workspace for project planning.', company: companies[1], teams: [teams[1]], workOrders: [], draftWorkOrders, actionItems: [], comments: [], archived: false },
  { projectID: 3, projectName: 'Archived Project Example', projectStatus: 'COMPLETED', status: 'COMPLETED', description: 'Archived sample project.', company: companies[2], teams: [], workOrders: [workOrders[2]], draftWorkOrders: [], actionItems: [], comments: [], archived: true },
];

const documents = [
  { documentID: 1, fileName: 'mock-contract.pdf', documentType: 'CONTRACT', uploadDate: today, workOrderID: 1, projectID: 1 },
  { documentID: 2, fileName: 'mock-photo.png', documentType: 'PHOTO', uploadDate: today, workOrderID: 2 },
];

const clone = (value) => JSON.parse(JSON.stringify(value));
const ok = (value) => clone(value);
const getId = (path) => Number((path.match(/\/(\d+)(?:\D|$)/) || [])[1]);
const success = (extra = {}) => ({ success: true, ...extra });

function collectionFor(path) {
  if (path.includes('/projects')) return projects;
  if (path.includes('/workorders/drafts')) return draftWorkOrders;
  if (path.includes('/workorders')) return workOrders;
  if (path.includes('/workers')) return workers;
  if (path.includes('/companies')) return companies;
  if (path.includes('/teams')) return teams;
  if (path.includes('/documents')) return documents;
  return [];
}

function itemById(path, collection) {
  const id = getId(path);
  return collection.find((item) => Object.values(item).some((value) => value === id)) || collection[0] || null;
}

export async function mockApiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const normalizedPath = String(path || '').replace(/^https?:\/\/[^/]+/i, '');
  console.info('[Atelicove mockApi]', method, normalizedPath);

  if (normalizedPath.includes('/auth/login')) return ok(workers[0]);
  if (normalizedPath.includes('/auth/logout')) return success();

  if (normalizedPath.includes('/count')) return workOrders.filter((wo) => !wo.archived).length;
  if (normalizedPath.includes('/documents')) return ok(documents);

  if (normalizedPath.includes('/projects/drafts')) return ok(projects.filter((p) => p.projectStatus === 'DRAFT'));
  if (normalizedPath.includes('/projects/all-with-archived')) return ok(projects);
  if (normalizedPath.includes('/projects')) {
    if (method !== 'GET') return ok(itemById(normalizedPath, projects) || projects[0]);
    if (/\/projects\/\d+/.test(normalizedPath)) return ok(itemById(normalizedPath, projects));
    return ok(projects.filter((p) => !p.archived));
  }

  if (normalizedPath.includes('/workorders/drafts')) {
    if (method !== 'GET') return ok(draftWorkOrders[0]);
    if (/\/workorders\/drafts\/\d+/.test(normalizedPath)) return ok(itemById(normalizedPath, draftWorkOrders));
    return ok(draftWorkOrders);
  }
  if (normalizedPath.includes('/workorders/all-with-archived')) return ok(workOrders);
  if (normalizedPath.includes('/workorders')) {
    if (method !== 'GET') return ok(itemById(normalizedPath, workOrders) || workOrders[0]);
    if (/\/workorders\/\d+/.test(normalizedPath)) return ok(itemById(normalizedPath, workOrders));
    return ok(workOrders.filter((wo) => !wo.archived));
  }

  if (normalizedPath.includes('/workers/all-with-archived')) return ok(workers);
  if (normalizedPath.includes('/workers')) {
    if (method !== 'GET') return ok(itemById(normalizedPath, workers) || workers[0]);
    if (/\/workers\/\d+/.test(normalizedPath)) return ok(itemById(normalizedPath, workers));
    return ok(workers.filter((worker) => !worker.archived));
  }

  if (normalizedPath.includes('/companies/all-with-archived')) return ok(companies);
  if (normalizedPath.includes('/companies')) {
    if (method !== 'GET') return ok(itemById(normalizedPath, companies) || companies[0]);
    if (/\/companies\/\d+/.test(normalizedPath)) return ok(itemById(normalizedPath, companies));
    return ok(companies.filter((company) => !company.archived));
  }

  if (normalizedPath.includes('/teams')) {
    if (method !== 'GET') return ok(itemById(normalizedPath, teams) || teams[0]);
    return ok(teams);
  }

  return ok(collectionFor(normalizedPath));
}
