const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Load organization data
const loadOrganizations = () => {
  try {
    const dataPath = path.join(__dirname, 'data', 'organizations.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading organizations data:', error);
    return { orphanages: [], oldageHomes: [] };
  }
};

// Save organization data
const saveOrganizations = (data) => {
  try {
    const dataPath = path.join(__dirname, 'data', 'organizations.json');
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving organizations data:', error);
    return false;
  }
};

// API Routes

// Get all orphanages (sorted by funding amount - lowest first)
app.get('/api/organizations', (req, res) => {
  const data = loadOrganizations();
  const sortedOrphanages = data.orphanages.sort((a, b) => {
    const amountA = parseInt(a.fund_amount.replace(/[₹,]/g, ''));
    const amountB = parseInt(b.fund_amount.replace(/[₹,]/g, ''));
    return amountA - amountB;
  });
  res.json(sortedOrphanages);
});

// Get all old age homes (sorted by funding amount - lowest first)
app.get('/api/organizations1', (req, res) => {
  const data = loadOrganizations();
  const sortedOldageHomes = data.oldageHomes.sort((a, b) => {
    const amountA = parseInt(a.fund_amount.replace(/[₹,]/g, ''));
    const amountB = parseInt(b.fund_amount.replace(/[₹,]/g, ''));
    return amountA - amountB;
  });
  res.json(sortedOldageHomes);
});

// Get organization by ID and type
app.get('/api/organization/:type/:id', (req, res) => {
  const { type, id } = req.params;
  const data = loadOrganizations();
  
  let organizations;
  if (type === 'orphanage') {
    organizations = data.orphanages;
  } else if (type === 'oldage') {
    organizations = data.oldageHomes;
  } else {
    return res.status(400).json({ error: 'Invalid organization type' });
  }
  
  const organization = organizations.find(org => org.id === parseInt(id));
  if (!organization) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  
  res.json(organization);
});

// Add new organization
app.post('/api/organization/:type', (req, res) => {
  const { type } = req.params;
  const data = loadOrganizations();
  
  let organizations;
  if (type === 'orphanage') {
    organizations = data.orphanages;
  } else if (type === 'oldage') {
    organizations = data.oldageHomes;
  } else {
    return res.status(400).json({ error: 'Invalid organization type' });
  }
  
  const newOrg = {
    id: Math.max(...organizations.map(org => org.id), 0) + 1,
    ...req.body
  };
  
  organizations.push(newOrg);
  
  if (saveOrganizations(data)) {
    res.status(201).json(newOrg);
  } else {
    res.status(500).json({ error: 'Failed to save organization' });
  }
});

// Update organization funding
app.put('/api/organization/:type/:id/funding', (req, res) => {
  const { type, id } = req.params;
  const { fund_amount } = req.body;
  const data = loadOrganizations();
  
  let organizations;
  if (type === 'orphanage') {
    organizations = data.orphanages;
  } else if (type === 'oldage') {
    organizations = data.oldageHomes;
  } else {
    return res.status(400).json({ error: 'Invalid organization type' });
  }
  
  const orgIndex = organizations.findIndex(org => org.id === parseInt(id));
  if (orgIndex === -1) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  
  organizations[orgIndex].fund_amount = fund_amount;
  
  if (saveOrganizations(data)) {
    res.json(organizations[orgIndex]);
  } else {
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

// Delete organization
app.delete('/api/organization/:type/:id', (req, res) => {
  const { type, id } = req.params;
  const data = loadOrganizations();
  
  let organizations;
  if (type === 'orphanage') {
    organizations = data.orphanages;
  } else if (type === 'oldage') {
    organizations = data.oldageHomes;
  } else {
    return res.status(400).json({ error: 'Invalid organization type' });
  }
  
  const orgIndex = organizations.findIndex(org => org.id === parseInt(id));
  if (orgIndex === -1) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  
  const deletedOrg = organizations.splice(orgIndex, 1)[0];
  
  if (saveOrganizations(data)) {
    res.json({ message: 'Organization deleted successfully', organization: deletedOrg });
  } else {
    res.status(500).json({ error: 'Failed to delete organization' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Local database server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Local database server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET /api/organizations (orphanages)');
  console.log('- GET /api/organizations1 (old age homes)');
  console.log('- GET /api/organization/:type/:id');
  console.log('- POST /api/organization/:type');
  console.log('- PUT /api/organization/:type/:id/funding');
  console.log('- DELETE /api/organization/:type/:id');
});