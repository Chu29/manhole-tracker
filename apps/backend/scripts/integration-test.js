import http from 'http';

async function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      },
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(responseBody) });
        } catch {
          resolve({ status: res.statusCode, body: responseBody });
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTest() {
  console.log("--- Starting Admin Integration Test ---");
  let token;
  try {
    // 1. Login
    console.log("Logging in as admin...");
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    if (loginRes.status !== 200) throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    token = loginRes.body.token;
    console.log("✅ Login successful");

    // 2. Fetch Technicians
    console.log("Fetching technicians...");
    const techRes = await request('GET', '/api/admin/technicians', null, token);
    if (techRes.status !== 200) throw new Error(`Tech fetch failed: ${JSON.stringify(techRes.body)}`);
    console.log(`✅ Fetched ${techRes.body.length} technicians.`);

    // 3. Create Manhole
    console.log("Creating manhole...");
    const manholePayload = {
      code: "TEST-ADMIN-01",
      lat: 40.7128,
      lng: -74.0060,
      utilityType: "electrical",
      status: "active",
      depthMeters: 2.5
    };
    const createRes = await request('POST', '/api/admin/manholes', manholePayload, token);
    if (createRes.status !== 201) throw new Error(`Create manhole failed: ${JSON.stringify(createRes.body)}`);
    const manholeId = createRes.body.id;
    console.log(`✅ Created manhole with ID: ${manholeId}`);

    // 4. Update Manhole
    console.log("Updating manhole...");
    const updateRes = await request('PATCH', `/api/admin/manholes/${manholeId}`, { status: "damaged" }, token);
    if (updateRes.status !== 200) throw new Error(`Update manhole failed: ${JSON.stringify(updateRes.body)}`);
    console.log(`✅ Updated manhole status to: ${updateRes.body.status}`);

    // 5. Delete Manhole
    console.log("Deleting manhole...");
    const deleteRes = await request('DELETE', `/api/admin/manholes/${manholeId}`, null, token);
    if (deleteRes.status !== 204) throw new Error(`Delete manhole failed: ${JSON.stringify(deleteRes.body)}`);
    console.log("✅ Manhole deleted successfully.");
    
    console.log("--- ALL TESTS PASSED ---");

  } catch (error) {
    console.error("❌ TEST FAILED:", error.message);
    process.exit(1);
  }
}

// Give server a moment to boot
setTimeout(runTest, 1000);
