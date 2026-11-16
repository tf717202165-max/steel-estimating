// RapidSteel MTO - engineer queries for the sample model.
// elements = regular expressions on the RapidSteel PlanId property.
window.RS_QUERIES = {
 "model": "warehouse_MODEL.ifc",
 "queries": [
  {
   "id": "Q-01",
   "type": "Conflict",
   "status": "Open",
   "sheet": "OS100 / OS110",
   "title": "Office ground columns MC1-MC4: base plate",
   "description": "OS100 gives a 25 base plate with 4-M24 HD bolts; the OS110 cap / base plate schedule (2-storey supporting the first floor) gives 20 with 4-M20. Priced to OS100 (member specific, agrees with the HD bolt table). Please confirm.",
   "elements": [
    "^OF-COL-MC\\d-\\d+$"
   ]
  },
  {
   "id": "Q-02",
   "type": "Conflict",
   "status": "Open",
   "sheet": "S211 / S500 / S515",
   "title": "Door mullion bases DM1 / DM2",
   "description": "DM1: S211 '16 mm base plate, 2-M20 Trubolts'; S500 DF1 '125x125x12 EA, 2-M20 Trubolts'; the loading dock mullions on S515 '10 base plate and cleat'. DM2 (200PFC) has no base information. Priced: DM1 16 PL, dock mullions 10 PL + cleat, DM2 as DM1. Please confirm.",
   "elements": [
    "^WB-DM[12]-\\d+$"
   ]
  },
  {
   "id": "Q-03",
   "type": "Clarification",
   "status": "Open",
   "sheet": "S600 R10",
   "title": "Strap plate at the 700WB eave haunches",
   "description": "R10 note: '300 x 25 strap plate for 700WB eaves haunch where required'. Every grid-1 eave haunch (D to K) is 700WB. Priced 300x25 at all 700WB eave haunches, 250x25 elsewhere. Please confirm where it is required.",
   "elements": [
    "^PF[12]-[D-K]-RN1$"
   ]
  },
  {
   "id": "Q-04",
   "type": "Conflict",
   "status": "Open",
   "sheet": "OS601 det 3 / OS110",
   "title": "Office roof beam OB1 on column OC1: cap plate",
   "description": "OS601 detail 3 shows a 10 cap plate with 4-M20; the OS110 schedule gives 16. Priced to the detail (10). Please confirm.",
   "elements": [
    "^OF-COL-OC1-\\d+$"
   ]
  },
  {
   "id": "Q-05",
   "type": "Clarification",
   "status": "Open",
   "sheet": "S515",
   "title": "Loading dock stair and dock details (red markups)",
   "description": "S515 carries red markups ('AMEND STAIR AS PER ARCH', 'check the dock as per arch. drawing'). The dock stair and dock details are priced provisional from the current sheet. Please issue the amended details.",
   "elements": [
    "^DS-"
   ]
  },
  {
   "id": "Q-06",
   "type": "Clarification",
   "status": "Open",
   "sheet": "S651 / S211",
   "title": "End-wall raker connections",
   "description": "The end-wall raker web cleats / end plates 'refer member schedule', but the S211 member schedule rows R1-R4 carry no connection data. Priced to the S211 steel beam bolting schedule (typical UNO). Please confirm.",
   "elements": [
    "^EW-[AMN]-R\\d-\\d+$"
   ]
  },
  {
   "id": "Q-07",
   "type": "Information",
   "status": "Open",
   "sheet": "S601 R22",
   "title": "TB1 to PC7 'T' bracket size",
   "description": "The 'T' bracket from 16 plates (6-M20 to TB1) is not sized on R22. Priced: 16 PL flange on the PC7 face (TB1 clear depth x 200) + 16 PL web (TB1 clear depth x 150). Please confirm.",
   "elements": [
    "^PF5-TB1-[EW]$"
   ]
  }
 ]
};
