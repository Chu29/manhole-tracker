import { prisma } from "./prisma.js";

async function seed() {
  console.log("Seeding database from original seed.sql via Prisma...");

  // 1. Insert Base Technicians
  const admin = await prisma.technician.upsert({
    where: { email: "jp.manga@manholetracker.cm" },
    update: {},
    create: {
      id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      name: "Jean-Pierre Manga",
      email: "jp.manga@manholetracker.cm",
      passwordHash: "$2b$10$xyzHASH123SecurePasswordStuffHere",
      role: "admin",
    },
  });

  const tech = await prisma.technician.upsert({
    where: { email: "a.bello@manholetracker.cm" },
    update: {},
    create: {
      id: "b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e",
      name: "Amadou Bello",
      email: "a.bello@manholetracker.cm",
      passwordHash: "$2b$10$abcHASH456AnotherSecureHashString",
      role: "technician",
    },
  });

  console.log(`Seeded technicians: ${admin.email}, ${tech.email}`);

  // 2. Bulk Geospatial Asset Seeding (from original seed.sql)
  const seedManholes = [
    // POSTE CENTRALE
    { code: "YDE-PC-SEW-010", lng: 11.5180, lat: 3.8645, utilityType: "sewer", depthMeters: 2.4, status: "active", installDate: "2018-02-10", lastInspectedAt: "2026-01-15T07:30:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-PC-SEW-011", lng: 11.5182, lat: 3.8648, utilityType: "sewer", depthMeters: 2.8, status: "active", installDate: "2018-02-10", lastInspectedAt: "2026-01-15T08:15:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-PC-SEW-012", lng: 11.5185, lat: 3.8651, utilityType: "sewer", depthMeters: 2.2, status: "active", installDate: "2018-02-10", lastInspectedAt: "2026-02-20T09:00:00.000Z", lastInspectedBy: admin.id },
    { code: "YDE-PC-TEL-013", lng: 11.5165, lat: 3.8622, utilityType: "telecom", depthMeters: 1.5, status: "active", installDate: "2021-06-14", lastInspectedAt: "2025-11-12T10:30:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-PC-TEL-014", lng: 11.5168, lat: 3.8625, utilityType: "telecom", depthMeters: 1.4, status: "damaged", installDate: "2021-06-14", lastInspectedAt: "2026-03-05T13:00:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-PC-TEL-015", lng: 11.5171, lat: 3.8629, utilityType: "telecom", depthMeters: 1.6, status: "active", installDate: "2021-06-14", lastInspectedAt: "2025-12-18T14:45:00.000Z", lastInspectedBy: admin.id },
    { code: "YDE-PC-WAT-016", lng: 11.5190, lat: 3.8610, utilityType: "water", depthMeters: 1.9, status: "active", installDate: "2019-04-03", lastInspectedAt: "2026-01-22T07:45:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-PC-WAT-017", lng: 11.5195, lat: 3.8614, utilityType: "water", depthMeters: 2.0, status: "active", installDate: "2019-04-03", lastInspectedAt: "2026-01-22T08:30:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-PC-ELE-018", lng: 11.5210, lat: 3.8630, utilityType: "electrical", depthMeters: 1.2, status: "active", installDate: "2022-09-01", lastInspectedAt: "2025-10-30T12:00:00.000Z", lastInspectedBy: admin.id },
    { code: "YDE-PC-ELE-019", lng: 11.5215, lat: 3.8633, utilityType: "electrical", depthMeters: 1.3, status: "buried", installDate: "2022-09-01", lastInspectedAt: null, lastInspectedBy: null },

    // ESSOS
    { code: "YDE-ESS-WAT-020", lng: 11.5360, lat: 3.8670, utilityType: "water", depthMeters: 1.7, status: "active", installDate: "2020-11-18", lastInspectedAt: "2026-02-10T09:15:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-ESS-WAT-021", lng: 11.5364, lat: 3.8674, utilityType: "water", depthMeters: 1.8, status: "active", installDate: "2020-11-18", lastInspectedAt: "2026-02-10T10:00:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-ESS-SEW-022", lng: 11.5380, lat: 3.8690, utilityType: "sewer", depthMeters: 3.0, status: "active", installDate: "2017-08-05", lastInspectedAt: "2025-09-14T15:20:00.000Z", lastInspectedBy: admin.id },
    { code: "YDE-ESS-SEW-023", lng: 11.5385, lat: 3.8693, utilityType: "sewer", depthMeters: 2.9, status: "damaged", installDate: "2017-08-05", lastInspectedAt: "2026-03-01T11:30:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-ESS-TEL-024", lng: 11.5400, lat: 3.8710, utilityType: "telecom", depthMeters: 1.3, status: "active", installDate: "2023-01-20", lastInspectedAt: "2026-01-08T09:00:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-ESS-ELE-025", lng: 11.5420, lat: 3.8730, utilityType: "electrical", depthMeters: 1.1, status: "inactive", installDate: "2016-05-12", lastInspectedAt: "2024-11-05T13:45:00.000Z", lastInspectedBy: admin.id },

    // BASTOS
    { code: "YDE-BAS-TEL-030", lng: 11.5120, lat: 3.8820, utilityType: "telecom", depthMeters: 1.6, status: "active", installDate: "2022-03-15", lastInspectedAt: "2026-02-28T10:00:00.000Z", lastInspectedBy: admin.id },
    { code: "YDE-BAS-TEL-031", lng: 11.5125, lat: 3.8825, utilityType: "telecom", depthMeters: 1.5, status: "active", installDate: "2022-03-15", lastInspectedAt: "2026-02-28T10:45:00.000Z", lastInspectedBy: admin.id },
    { code: "YDE-BAS-WAT-032", lng: 11.5140, lat: 3.8850, utilityType: "water", depthMeters: 2.1, status: "active", installDate: "2021-09-10", lastInspectedAt: "2026-01-19T14:15:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-BAS-SEW-033", lng: 11.5100, lat: 3.8800, utilityType: "sewer", depthMeters: 2.7, status: "active", installDate: "2019-11-30", lastInspectedAt: "2025-10-10T08:30:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-BAS-ELE-034", lng: 11.5155, lat: 3.8870, utilityType: "electrical", depthMeters: 1.4, status: "active", installDate: "2023-04-05", lastInspectedAt: "2026-03-12T16:00:00.000Z", lastInspectedBy: admin.id },

    // NGOUSSO
    { code: "YDE-NGO-SEW-040", lng: 11.5450, lat: 3.8900, utilityType: "sewer", depthMeters: 2.6, status: "active", installDate: "2018-07-22", lastInspectedAt: "2025-12-01T11:00:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-NGO-WAT-041", lng: 11.5470, lat: 3.8920, utilityType: "water", depthMeters: 1.9, status: "damaged", installDate: "2020-02-14", lastInspectedAt: "2026-02-15T13:30:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-NGO-TEL-042", lng: 11.5485, lat: 3.8935, utilityType: "telecom", depthMeters: 1.4, status: "buried", installDate: "2021-11-01", lastInspectedAt: null, lastInspectedBy: null },
    { code: "YDE-NGO-ELE-043", lng: 11.5500, lat: 3.8950, utilityType: "electrical", depthMeters: 1.3, status: "active", installDate: "2022-08-19", lastInspectedAt: "2026-01-05T09:45:00.000Z", lastInspectedBy: admin.id },

    // BİYEM-ASSI
    { code: "YDE-BYA-WAT-050", lng: 11.4900, lat: 3.8400, utilityType: "water", depthMeters: 2.0, status: "active", installDate: "2019-01-15", lastInspectedAt: "2026-02-01T08:00:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-BYA-SEW-051", lng: 11.4920, lat: 3.8420, utilityType: "sewer", depthMeters: 2.5, status: "active", installDate: "2019-01-15", lastInspectedAt: "2026-02-01T09:00:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-BYA-TEL-052", lng: 11.4940, lat: 3.8440, utilityType: "telecom", depthMeters: 1.5, status: "active", installDate: "2020-05-20", lastInspectedAt: "2025-11-25T14:20:00.000Z", lastInspectedBy: admin.id },
    { code: "YDE-BYA-ELE-053", lng: 11.4960, lat: 3.8460, utilityType: "electrical", depthMeters: 1.2, status: "active", installDate: "2023-02-10", lastInspectedAt: "2026-03-08T11:15:00.000Z", lastInspectedBy: tech.id },

    // ACCACI (ESCHOSYS Campus Focus)
    { code: "YDE-ACC-ESC-TEL-060", lng: 11.5030, lat: 3.8535, utilityType: "telecom", depthMeters: 1.2, status: "active", installDate: "2023-09-01", lastInspectedAt: "2026-03-01T08:00:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-ACC-ESC-TEL-061", lng: 11.5035, lat: 3.8540, utilityType: "telecom", depthMeters: 1.4, status: "active", installDate: "2023-09-01", lastInspectedAt: "2026-03-01T09:30:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-ACC-ESC-SEW-062", lng: 11.5038, lat: 3.8542, utilityType: "sewer", depthMeters: 2.6, status: "active", installDate: "2022-01-15", lastInspectedAt: "2026-02-14T11:00:00.000Z", lastInspectedBy: admin.id },
    { code: "YDE-ACC-ESC-WAT-063", lng: 11.5032, lat: 3.8545, utilityType: "water", depthMeters: 1.8, status: "active", installDate: "2022-01-15", lastInspectedAt: "2026-01-10T14:20:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-ACC-ESC-ELE-064", lng: 11.5042, lat: 3.8538, utilityType: "electrical", depthMeters: 1.5, status: "active", installDate: "2023-09-01", lastInspectedAt: "2026-02-25T10:15:00.000Z", lastInspectedBy: admin.id },
    { code: "YDE-ACC-ESC-ELE-065", lng: 11.5045, lat: 3.8548, utilityType: "electrical", depthMeters: 1.3, status: "damaged", installDate: "2023-09-01", lastInspectedAt: "2026-03-10T16:00:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-ACC-WAT-070", lng: 11.5015, lat: 3.8520, utilityType: "water", depthMeters: 2.0, status: "active", installDate: "2021-04-10", lastInspectedAt: "2026-01-20T10:00:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-ACC-SEW-071", lng: 11.5050, lat: 3.8560, utilityType: "sewer", depthMeters: 2.8, status: "active", installDate: "2020-08-25", lastInspectedAt: "2026-02-05T09:30:00.000Z", lastInspectedBy: admin.id },
    { code: "YDE-ACC-TEL-072", lng: 11.5065, lat: 3.8575, utilityType: "telecom", depthMeters: 1.5, status: "buried", installDate: "2021-11-12", lastInspectedAt: null, lastInspectedBy: null },

    // OBOBOGO (Rebase Code Camp Focus)
    { code: "YDE-OBB-RCC-TEL-080", lng: 11.4880, lat: 3.8235, utilityType: "telecom", depthMeters: 1.3, status: "active", installDate: "2024-01-10", lastInspectedAt: "2026-03-12T09:00:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-OBB-RCC-ELE-081", lng: 11.4885, lat: 3.8240, utilityType: "electrical", depthMeters: 1.5, status: "active", installDate: "2024-01-10", lastInspectedAt: "2026-03-12T10:15:00.000Z", lastInspectedBy: admin.id },
    { code: "YDE-OBB-RCC-SEW-082", lng: 11.4888, lat: 3.8242, utilityType: "sewer", depthMeters: 2.4, status: "active", installDate: "2023-11-05", lastInspectedAt: "2026-02-18T14:30:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-OBB-RCC-WAT-083", lng: 11.4882, lat: 3.8245, utilityType: "water", depthMeters: 1.7, status: "active", installDate: "2023-11-05", lastInspectedAt: "2026-01-25T11:00:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-OBB-RCC-TEL-084", lng: 11.4892, lat: 3.8238, utilityType: "telecom", depthMeters: 1.2, status: "active", installDate: "2024-01-10", lastInspectedAt: "2026-03-12T11:30:00.000Z", lastInspectedBy: admin.id },
    { code: "YDE-OBB-RCC-ELE-085", lng: 11.4895, lat: 3.8248, utilityType: "electrical", depthMeters: 1.4, status: "damaged", installDate: "2024-01-10", lastInspectedAt: "2026-03-14T15:00:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-OBB-WAT-090", lng: 11.4860, lat: 3.8215, utilityType: "water", depthMeters: 2.1, status: "active", installDate: "2020-05-18", lastInspectedAt: "2026-02-01T08:30:00.000Z", lastInspectedBy: tech.id },
    { code: "YDE-OBB-SEW-091", lng: 11.4905, lat: 3.8260, utilityType: "sewer", depthMeters: 2.7, status: "active", installDate: "2019-09-12", lastInspectedAt: "2026-01-15T13:00:00.000Z", lastInspectedBy: admin.id },
    { code: "YDE-OBB-TEL-092", lng: 11.4915, lat: 3.8275, utilityType: "telecom", depthMeters: 1.6, status: "buried", installDate: "2021-03-30", lastInspectedAt: null, lastInspectedBy: null },
  ];

  for (const mh of seedManholes) {
    const existing = await prisma.manhole.findFirst({ where: { code: mh.code } });
    if (!existing) {
      await prisma.$executeRaw`
        INSERT INTO manholes (code, location, utility_type, depth_meters, status, install_date, last_inspected_at, last_inspected_by)
        VALUES (
          ${mh.code},
          ST_SetSRID(ST_MakePoint(${mh.lng}, ${mh.lat}), 4326)::geography,
          ${mh.utilityType},
          ${mh.depthMeters},
          ${mh.status},
          ${mh.installDate ? new Date(mh.installDate) : null},
          ${mh.lastInspectedAt ? new Date(mh.lastInspectedAt) : null},
          ${mh.lastInspectedBy ? mh.lastInspectedBy : null}::uuid
        )
      `;
    }
  }

  console.log("Seeding complete.");
}

seed()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
