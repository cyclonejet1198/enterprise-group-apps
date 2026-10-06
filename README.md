# Enterprise Group - Company Platforms Suite
Complete 6-platform microservices suite - Node.js + Express + MongoDB + Docker

## Platforms
- 01-event / TBD
- 02-facility / TBD  
- 03-inventory / TBD
- 04-documents / 3004 RUNNING - Docs, Tracking, Archive
- 05-procurement / 3005 RUNNING - Requests, Approvals, Vendors
- 06-dashboard / 3006 RUNNING - Analytics, KPIs, Reports

## Quick Start
cd 04-documents && docker compose up -d
cd ../05-procurement && docker compose up -d
cd ../06-dashboard && docker compose up -d

## Verification 2026-10-06
8 containers UP (4 api + 4 db)
04: Document Platform Running on 3004
05: Procurement Platform Running on 3005
06: Dashboard Platform Running on 3006

## Git Log
a38adbb feat: 06-dashboard on 3006 completes suite
1bd091e feat: 05-procurement on 3005
474bd03 Platform 04 doc-tracking on 3004

Author: Yaw Bremang Acquah - EP-C19-L01
