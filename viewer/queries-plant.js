// RapidSteel MTO - engineer queries for the sample model.
// elements = regular expressions on the RapidSteel PlanId property.
window.RS_QUERIES = {
 "model": "plant_MODEL.ifc",
 "queries": [
  {
   "id": "Q-01",
   "type": "Clarification",
   "status": "Open",
   "sheet": "ST-02.11 / ST-01.06",
   "title": "Walkway deck level vs stair 1 top landing",
   "description": "Maintenance walkway deck modelled at +10580 (ST-02.11 sections M1-M4); stair 1 top landing is AFL 10780 (ST-01.06) and section X-X1 scales the deck at about +10780. Please confirm the walkway RL and the stair-to-walkway link member.",
   "elements": [
    "^WK-",
    "^S1L4",
    "^S1E"
   ]
  },
  {
   "id": "Q-02",
   "type": "Clarification",
   "status": "Open",
   "sheet": "ST-00.01 / ST-90.13",
   "title": "Crane capacity vs runway standard details",
   "description": "General notes give a 20 t crane; ST-90.13 runway details state 'suitable for up to 10T crane'. Runway end plates are only scheduled up to 530UB; crane beams are 610UB125 (20PL assumed). Please confirm the runway details.",
   "elements": [
    "^CB-",
    "^CO-",
    "^ES-"
   ]
  },
  {
   "id": "Q-03",
   "type": "Clarification",
   "status": "Open",
   "sheet": "ST-01.01 / ST-04.11 E1",
   "title": "Line B bay 9-10: bracing symbols vs door opening",
   "description": "ST-01.01 shows vertical-brace symbols at both ends of line B bay 9-10; elevation E1 shows a P25-headed door and no bracing in that bay. Not modelled as braced.",
   "elements": [
    "^DR-B2",
    "^GT-B-74800"
   ]
  },
  {
   "id": "Q-04",
   "type": "Clarification",
   "status": "Open",
   "sheet": "ST-01.01",
   "title": "Line G (lean-to outer line): no bracing drawn",
   "description": "No elevation of line G and no brace symbols on ST-01.01. No bracing modelled on line G; longitudinal stability relies on the roof X-bracing and the line E knees.",
   "elements": [
    "^EB-G",
    "-G$"
   ]
  },
  {
   "id": "Q-05",
   "type": "Assumption",
   "status": "Open",
   "sheet": "ST-01.05",
   "title": "Exhaust pipe supports: no level given",
   "description": "Scrubber exhaust pipe support (S15a + UC15a arms) modelled at +7500 and furnace exhaust pipe support (S25b + UC20a arms) at +7000; ST-01.05 gives no level.",
   "elements": [
    "^PS-",
    "^PF-"
   ]
  },
  {
   "id": "Q-06",
   "type": "Assumption",
   "status": "Open",
   "sheet": "ST-04.13 (ST-04.23 not issued)",
   "title": "Laced column cap / crane seat details not issued",
   "description": "Details Y-Y.A, X-X1.A/B, B7.A on ST-04.23 are referenced but the sheet is not in the set. Cap beam, cap post and plates are tender allowances.",
   "elements": [
    "-DCAP$",
    "-DPOST$",
    "-DL[NS]$",
    "-DLAC-"
   ]
  },
  {
   "id": "Q-07",
   "type": "Assumption",
   "status": "Open",
   "sheet": "ST-04.13 B11 / B10.A",
   "title": "Pre-treatment roof level (TR4 / TR5 top chord)",
   "description": "TR4 / TR5 bottom chord underside +12800 is printed; the top-chord level is not. Top of steel taken as +15000 at grid D, 3 degrees both ways (measured 14957-15071).",
   "elements": [
    "^TR4-",
    "^G13-TR5"
   ]
  },
  {
   "id": "Q-08",
   "type": "Assumption",
   "status": "Open",
   "sheet": "ST-01.05 rev B (superseded) / A6.10",
   "title": "Viewing platform RL 8.600 and stairs 2 / 3 (provisional)",
   "description": "Framed only on the superseded ST-01.05 rev B; rev C removed the layout but the architectural drawings still show the platform and stairs. Priced as a provisional item outside the totals.",
   "elements": [
    "^VP-",
    "^PV-"
   ]
  },
  {
   "id": "Q-09",
   "type": "Assumption",
   "status": "Open",
   "sheet": "A6.10-A6.12",
   "title": "Stairs 5, 6, 7 and storage stair 2: no structural framing",
   "description": "Steel stairs on the architectural drawings with no structural framing in rev D. Modelled from the architectural geometry with 200PFC stringers, 200PFC landings and 125 SHS posts.",
   "elements": [
    "^S5",
    "^S6",
    "^S7",
    "^SS2"
   ]
  },
  {
   "id": "Q-10",
   "type": "Information",
   "status": "Closed",
   "sheet": "ST-02.01 / ST-04.01",
   "title": "TR1 bottom chord next to the S crane surge chord",
   "description": "Closed in R10: not a drawing conflict. The truss schedules draw the TR1 / TR2 / TR3 chords on their side (web horizontal); the model had them web vertical. Turned to web horizontal, the TR1 bottom chord clears the S surge girder. TR1 (roof plan) and the UB25b surge chord (crane plan) are both drawn about 100 mm apart on line E and both are modelled. TR1 set at the measured level (bottom chord centre +10490).",
   "elements": [
    "^TR1-.*-B\\d",
    "^SC-S-"
   ]
  },
  {
   "id": "Q-11",
   "type": "Clarification",
   "status": "Open",
   "sheet": "ST-02.11",
   "title": "Hoist stations: north ends of the UC20b N-S beams",
   "description": "The UC20b beams under the turntable WC40d lines (bays 5-6 and 6-7) have no dropper drawn at their north ends. Do they cantilever about 2.2 m off the TR3b bottom chord or hang from the WC40d above? Priced as drawn, no extra dropper.",
   "elements": [
    "^WK-HS[56]-N[01]$"
   ]
  },
  {
   "id": "Q-12",
   "type": "Clarification",
   "status": "Open",
   "sheet": "ST-05.01 / ST-05.11 PE1",
   "title": "PT west wall: sliding door support posts and beam",
   "description": "Two short SHS posts (S15d, top about +2090) and a support beam (priced 150UC23, about +2000) under the red-clouded 'SLIDING DOOR SUPPORT BEAMS TBC'. Confirm section, level and whether they are in the steel scope. Priced provisional.",
   "elements": [
    "^EN-C2[23]$",
    "^PV-SD0$"
   ]
  },
  {
   "id": "Q-13",
   "type": "Clarification",
   "status": "Open",
   "sheet": "ST-02.11 / ST-03.02",
   "title": "Monorail support beams hung under the TR4 truss chords",
   "description": "Detail M1.A bolts a monorail support beam under a beam with its web vertical (4-M24, 20PL stiffeners both sides of the web). The TR4 chords are drawn on their side (web horizontal), so the underside is two flange tips and M1.A cannot be used as drawn at 32 joints. Please confirm the hanger detail (e.g. a cap / hanger plate across the flange tips). Priced: lower-beam stiffeners only, no hanger plate.",
   "elements": [
    "^(MS\\-UB61\\-13\\-0|MS\\-UB61\\-13\\-1|PM\\-UB41\\-0\\-0\\-0|PM\\-UB41\\-0\\-0\\-1|PM\\-UB41\\-0\\-1\\-0|PM\\-UB41\\-0\\-1\\-1|PM\\-UB41\\-0\\-2\\-0|PM\\-UB41\\-0\\-2\\-1|PM\\-UB41\\-1\\-0\\-0|PM\\-UB41\\-1\\-0\\-1|PM\\-UB41\\-1\\-1\\-0|PM\\-UB41\\-1\\-1\\-1|PM\\-UB41\\-1\\-2\\-0|PM\\-UB41\\-1\\-2\\-1|PM\\-UB41\\-2\\-0\\-0|PM\\-UB41\\-2\\-0\\-1|PM\\-UB41\\-2\\-1\\-0|PM\\-UB41\\-2\\-1\\-1|PM\\-UB41\\-2\\-2\\-0|PM\\-UB41\\-2\\-2\\-1)$"
   ]
  },
  {
   "id": "Q-14",
   "type": "Clarification",
   "status": "Open",
   "sheet": "ST-04.21 / ST-04.22 (B4.A, B5.A, B5.E)",
   "title": "Eave and ridge column tops above the rafter top flange",
   "description": "The moment connection details run the column up to the top of the extended end plate (about 110 above the rafter top flange) with a closing plate. The first purlin sits over the column at these grids and clashes with the column top. Please confirm the purlin seat (packer / taller cleat) or a column top level with the rafter. Priced as drawn; purlin length unaffected.",
   "elements": [
    "^F\\d+-(C-U|DU|DV|E-U|EV)$"
   ]
  }
 ]
};
