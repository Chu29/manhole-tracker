-- Manhole Tracker — Expanded Yaoundé Seed Data
-- 1. Insert Base Technicians
INSERT INTO technicians (id, name, email, password_hash, role) VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Jean-Pierre Manga', 'jp.manga@manholetracker.cm', '$2b$10$xyzHASH123SecurePasswordStuffHere', 'admin'),
('b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e', 'Amadou Bello', 'a.bello@manholetracker.cm', '$2b$10$abcHASH456AnotherSecureHashString', 'technician')
ON CONFLICT (email) DO NOTHING;

-- 2. Bulk Geospatial Asset Seeding (65+ Manholes)
INSERT INTO manholes (code, location, utility_type, depth_meters, status, install_date, last_inspected_at, last_inspected_by) VALUES

-- =========================================================================
-- NEIGHBORHOOD: POSTE CENTRALE (Central Business District Core)
-- Bounding area: Longitude ~11.516 to 11.522, Latitude ~3.860 to 3.866
-- =========================================================================
('YDE-PC-SEW-010', ST_SetSRID(ST_MakePoint(11.5180, 3.8645), 4326), 'sewer', 2.4, 'active', '2018-02-10', '2026-01-15 08:30:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-PC-SEW-011', ST_SetSRID(ST_MakePoint(11.5182, 3.8648), 4326), 'sewer', 2.8, 'active', '2018-02-10', '2026-01-15 09:15:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-PC-SEW-012', ST_SetSRID(ST_MakePoint(11.5185, 3.8651), 4326), 'sewer', 2.2, 'active', '2018-02-10', '2026-02-20 10:00:00+01', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
('YDE-PC-TEL-013', ST_SetSRID(ST_MakePoint(11.5165, 3.8622), 4326), 'telecom', 1.5, 'active', '2021-06-14', '2025-11-12 11:30:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-PC-TEL-014', ST_SetSRID(ST_MakePoint(11.5168, 3.8625), 4326), 'telecom', 1.4, 'damaged', '2021-06-14', '2026-03-05 14:00:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-PC-TEL-015', ST_SetSRID(ST_MakePoint(11.5171, 3.8629), 4326), 'telecom', 1.6, 'active', '2021-06-14', '2025-12-18 15:45:00+01', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
('YDE-PC-WAT-016', ST_SetSRID(ST_MakePoint(11.5190, 3.8610), 4326), 'water', 1.9, 'active', '2019-04-03', '2026-01-22 08:45:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-PC-WAT-017', ST_SetSRID(ST_MakePoint(11.5195, 3.8614), 4326), 'water', 2.0, 'active', '2019-04-03', '2026-01-22 09:30:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-PC-ELE-018', ST_SetSRID(ST_MakePoint(11.5210, 3.8630), 4326), 'electrical', 1.2, 'active', '2022-09-01', '2025-10-30 13:00:00+01', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
('YDE-PC-ELE-019', ST_SetSRID(ST_MakePoint(11.5215, 3.8633), 4326), 'electrical', 1.3, 'buried', '2022-09-01', NULL, NULL),

-- =========================================================================
-- NEIGHBORHOOD: ESSOS (East Residential & Commercial Grid)
-- Bounding area: Longitude ~11.535 to 11.545, Latitude ~3.865 to 3.875
-- =========================================================================
('YDE-ESS-WAT-020', ST_SetSRID(ST_MakePoint(11.5360, 3.8670), 4326), 'water', 1.7, 'active', '2020-11-18', '2026-02-10 10:15:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-ESS-WAT-021', ST_SetSRID(ST_MakePoint(11.5365, 3.8675), 4326), 'water', 1.8, 'active', '2020-11-18', '2026-02-10 11:00:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-ESS-WAT-022', ST_SetSRID(ST_MakePoint(11.5370, 3.8680), 4326), 'water', 1.6, 'damaged', '2020-11-18', '2026-03-02 12:30:00+01', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
('YDE-ESS-SEW-023', ST_SetSRID(ST_MakePoint(11.5400, 3.8710), 4326), 'sewer', 3.2, 'active', '2016-05-24', '2025-08-14 09:00:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-ESS-SEW-024', ST_SetSRID(ST_MakePoint(11.5405, 3.8715), 4326), 'sewer', 3.0, 'active', '2016-05-24', '2025-08-14 10:30:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-ESS-SEW-025', ST_SetSRID(ST_MakePoint(11.5410, 3.8720), 4326), 'sewer', 3.5, 'inactive', '2016-05-24', '2025-11-04 14:15:00+01', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
('YDE-ESS-TEL-026', ST_SetSRID(ST_MakePoint(11.5430, 3.8735), 4326), 'telecom', 1.1, 'active', '2023-01-15', '2026-01-29 11:00:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-ESS-TEL-027', ST_SetSRID(ST_MakePoint(11.5435, 3.8740), 4326), 'telecom', 1.0, 'active', '2023-01-15', '2026-01-29 11:45:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-ESS-ELE-028', ST_SetSRID(ST_MakePoint(11.5440, 3.8745), 4326), 'electrical', 1.4, 'active', '2021-08-20', '2025-09-12 16:00:00+01', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
('YDE-ESS-ELE-029', ST_SetSRID(ST_MakePoint(11.5445, 3.8750), 4326), 'electrical', 1.5, 'active', '2021-08-20', '2025-09-12 16:45:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),

-- =========================================================================
-- NEIGHBORHOOD: NKOLMESSENG (High-density Northeast Zone)
-- Bounding area: Longitude ~11.550 to 11.565, Latitude ~3.880 to 3.895
-- =========================================================================
('YDE-NKM-TEL-030', ST_SetSRID(ST_MakePoint(11.5520, 3.8820), 4326), 'telecom', 1.2, 'active', '2022-03-10', '2026-02-05 09:30:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-NKM-TEL-031', ST_SetSRID(ST_MakePoint(11.5525, 3.8825), 4326), 'telecom', 1.3, 'active', '2022-03-10', '2026-02-05 10:15:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-NKM-TEL-032', ST_SetSRID(ST_MakePoint(11.5530, 3.8830), 4326), 'telecom', 1.1, 'damaged', '2022-03-10', '2026-03-11 13:00:00+01', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
('YDE-NKM-WAT-033', ST_SetSRID(ST_MakePoint(11.5560, 3.8860), 4326), 'water', 2.1, 'active', '2017-08-12', '2025-10-22 14:00:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-NKM-WAT-034', ST_SetSRID(ST_MakePoint(11.5565, 3.8865), 4326), 'water', 1.9, 'active', '2017-08-12', '2025-10-22 14:45:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-NKM-WAT-035', ST_SetSRID(ST_MakePoint(11.5570, 3.8870), 4326), 'water', 2.0, 'buried', '2017-08-12', NULL, NULL),
('YDE-NKM-SEW-036', ST_SetSRID(ST_MakePoint(11.5600, 3.8900), 4326), 'sewer', 2.9, 'active', '2019-10-05', '2026-01-08 10:00:00+01', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
('YDE-NKM-SEW-037', ST_SetSRID(ST_MakePoint(11.5605, 3.8905), 4326), 'sewer', 3.1, 'active', '2019-10-05', '2026-01-08 11:15:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-NKM-ELE-038', ST_SetSRID(ST_MakePoint(11.5630, 3.8930), 4326), 'electrical', 1.5, 'active', '2021-04-17', '2025-12-03 15:00:00+01', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
('YDE-NKM-ELE-039', ST_SetSRID(ST_MakePoint(11.5635, 3.8935), 4326), 'electrical', 1.6, 'active', '2021-04-17', '2025-12-03 15:45:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),

-- =========================================================================
-- NEIGHBORHOOD: ACACIA (Biyem-Assi South-West Sector)
-- Bounding area: Longitude ~11.485 to 11.495, Latitude ~3.830 to 3.840
-- =========================================================================
('YDE-ACA-SEW-040', ST_SetSRID(ST_MakePoint(11.4860, 3.8320), 4326), 'sewer', 2.7, 'active', '2015-09-30', '2026-02-12 09:00:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-ACA-SEW-041', ST_SetSRID(ST_MakePoint(11.4865, 3.8325), 4326), 'sewer', 2.6, 'active', '2015-09-30', '2026-02-12 09:45:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-ACA-SEW-042', ST_SetSRID(ST_MakePoint(11.4870, 3.8330), 4326), 'sewer', 2.8, 'active', '2015-09-30', '2026-02-12 10:30:00+01', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
('YDE-ACA-WAT-043', ST_SetSRID(ST_MakePoint(11.4900, 3.8350), 4326), 'water', 1.8, 'active', '2020-05-20', '2025-11-18 13:15:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-ACA-WAT-044', ST_SetSRID(ST_MakePoint(11.4905, 3.8355), 4326), 'water', 1.7, 'damaged', '2020-05-20', '2026-03-08 11:00:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-ACA-WAT-045', ST_SetSRID(ST_MakePoint(11.4910, 3.8360), 4326), 'water', 1.9, 'active', '2020-05-20', '2025-11-18 14:00:00+01', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
('YDE-ACA-TEL-046', ST_SetSRID(ST_MakePoint(11.4930, 3.8380), 4326), 'telecom', 1.3, 'active', '2022-10-12', '2026-01-20 15:00:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-ACA-TEL-047', ST_SetSRID(ST_MakePoint(11.4935, 3.8385), 4326), 'telecom', 1.2, 'active', '2022-10-12', '2026-01-20 15:45:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-ACA-ELE-048', ST_SetSRID(ST_MakePoint(11.4940, 3.8390), 4326), 'electrical', 1.5, 'active', '2021-02-15', '2025-09-25 10:00:00+01', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
('YDE-ACA-ELE-049', ST_SetSRID(ST_MakePoint(11.4945, 3.8395), 4326), 'electrical', 1.4, 'inactive', '2021-02-15', '2025-09-25 10:45:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),

-- =========================================================================
-- NEIGHBORHOOD: NGOUSSO (North-East Medical & Residential Sector)
-- Bounding area: Longitude ~11.540 to 11.550, Latitude ~3.900 to 3.910
-- =========================================================================
('YDE-NGS-WAT-050', ST_SetSRID(ST_MakePoint(11.5420, 3.9020), 4326), 'water', 2.0, 'active', '2019-07-04', '2026-02-18 09:30:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-NGS-WAT-051', ST_SetSRID(ST_MakePoint(11.5425, 3.9025), 4326), 'water', 1.9, 'active', '2019-07-04', '2026-02-18 10:15:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-NGS-WAT-052', ST_SetSRID(ST_MakePoint(11.5430, 3.9030), 4326), 'water', 2.1, 'active', '2019-07-04', '2026-02-18 11:00:00+01', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),
('YDE-NGS-SEW-053', ST_SetSRID(ST_MakePoint(11.5450, 3.9050), 4326), 'sewer', 3.3, 'active', '2016-12-15', '2025-10-14 14:00:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-NGS-SEW-054', ST_SetSRID(ST_MakePoint(11.5455, 3.9055), 4326), 'sewer', 3.1, 'damaged', '2016-12-15', '2026-03-09 16:30:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),
('YDE-NGS-SEW-055', ST_SetSRID(ST_MakePoint(11.5460, 3.9060), 4326), 'sewer', 3.4, 'active', '2016-12-15', '2025-10-14 14:45:00+01', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),('YDE-NGS-TEL-056', ST_SetSRID(ST_MakePoint(11.5480, 3.9080), 4326), 'telecom', 1.4, 'active', '2023-05-22', '2026-01-12 11:15:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),('YDE-NGS-TEL-057', ST_SetSRID(ST_MakePoint(11.5485, 3.9085), 4326), 'telecom', 1.3, 'active', '2023-05-22', '2026-01-12 12:00:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),('YDE-NGS-ELE-058', ST_SetSRID(ST_MakePoint(11.5490, 3.9090), 4326), 'electrical', 1.6, 'active', '2022-01-18', '2025-11-30 09:00:00+01', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),('YDE-NGS-ELE-059', ST_SetSRID(ST_MakePoint(11.5495, 3.9095), 4326), 'electrical', 1.5, 'buried', '2022-01-18', NULL, NULL),
-- =========================================================================
-- ADDITIONAL TRANSIT HUB SECTOR: OLEZOA (Southern Distribution Junction)
-- Bounding area: Longitude ~11.500 to 11.510, Latitude ~3.845 to 3.855-- =========================================================================
('YDE-OLZ-TEL-060', ST_SetSRID(ST_MakePoint(11.5040, 3.8480), 4326), 'telecom', 1.5, 'active', '2021-11-05', '2026-01-25 13:45:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),('YDE-OLZ-TEL-061', ST_SetSRID(ST_MakePoint(11.5045, 3.8485), 4326), 'telecom', 1.4, 'active', '2021-11-05', '2026-01-25 14:30:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),('YDE-OLZ-WAT-062', ST_SetSRID(ST_MakePoint(11.5060, 3.8510), 4326), 'water', 2.2, 'active', '2018-06-12', '2025-12-14 10:15:00+01', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),('YDE-OLZ-WAT-063', ST_SetSRID(ST_MakePoint(11.5065, 3.8515), 4326), 'water', 2.0, 'active', '2018-06-12', '2025-12-14 11:00:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),('YDE-OLZ-SEW-064', ST_SetSRID(ST_MakePoint(11.5080, 3.8530), 4326), 'sewer', 3.1, 'active', '2017-03-22', '2026-02-02 08:30:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e'),('YDE-OLZ-SEW-065', ST_SetSRID(ST_MakePoint(11.5085, 3.8535), 4326), 'sewer', 2.9, 'damaged', '2017-03-22', '2026-03-10 15:00:00+01', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'),('YDE-OLZ-ELE-066', ST_SetSRID(ST_MakePoint(11.5095, 3.8545), 4326), 'electrical', 1.3, 'active', '2023-02-28', '2025-10-05 16:15:00+01', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e')ON CONFLICT (code) DO NOTHING;