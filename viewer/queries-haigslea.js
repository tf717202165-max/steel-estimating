// RapidSteel MTO - engineer queries for the model.
// elements = regular expressions on the RapidSteel PlanId property.
window.RS_QUERIES = {
 "model": "haigslea_MODEL.ifc",
 "queries": [
  {
   "id": "Q-01",
   "type": "Clarification",
   "status": "Open",
   "sheet": "S400",
   "title": "AR1 awning rafter section",
   "description": "The roof framing schedule gives 125 x 75 x 3.5 RHS, which is not a standard AS/NZS 1163 size. Priced as 125 x 75 x 4.0 RHS (16 rafters, 58.9 m). Please confirm the section.",
   "elements": [
    "^LROOF-AR1-"
   ]
  },
  {
   "id": "Q-02",
   "type": "Missing information",
   "status": "Open",
   "sheet": "S400",
   "title": "WB4 is not in the schedule",
   "description": "WB4 is labelled on the lower roof framing plan (west wall of the A-B block) but is not in the roof framing schedule. Priced as WB1, 89 x 89 x 3.5 SHS.",
   "elements": [
    "^LROOF-WB4"
   ]
  },
  {
   "id": "Q-03",
   "type": "Missing information",
   "status": "Open",
   "sheet": "S400",
   "title": "Support steel at grids 2/B and 4/B",
   "description": "The lower roof framing plan note reads '12 plate 4/M16 bolts, 2/89x3.5 SHS tees provisionally, allow 4/75x50 UA vert'. No lengths or levels are given. Priced with assumed lengths (about 175 kg in total, in the items not modelled). Please advise the lengths and what the steel supports.",
   "elements": [
    "^F[24]-CB$"
   ]
  },
  {
   "id": "Q-04",
   "type": "Missing information",
   "status": "Open",
   "sheet": "S400 / S420",
   "title": "Number of roof penetrations",
   "description": "S400 allows 2 additional C20024 purlins where a penetration exceeds the purlin spacing. The number of penetrations is not on the structural drawings; one is priced. Please advise the number.",
   "elements": [
    "^PU-P1-R5-"
   ]
  },
  {
   "id": "Q-05",
   "type": "Conflict",
   "status": "Open",
   "sheet": "S400 / A-1010",
   "title": "East awning edge",
   "description": "The structural lower roof plan puts the east awning edge 5837 past grid 6 (3041 and 4079 locally); the architectural roof plan shows 686 + 3709. Priced to the structural plan. Please confirm which governs.",
   "elements": [
    "^LROOF-P4-E-",
    "^LROOF-AR1-E"
   ]
  },
  {
   "id": "Q-06",
   "type": "Clarification",
   "status": "Open",
   "sheet": "S410 / A-3000",
   "title": "Levels",
   "description": "Only the hall FFL (RL 102.610) and the roof pitching point (RL 107.110) are printed. The pitching point is taken at the underside of PR1 on grid D. All other levels are scaled from the S410 sections (about +/- 30 mm).",
   "elements": [
    "^F\\d-R$"
   ]
  },
  {
   "id": "Q-07",
   "type": "Missing information",
   "status": "Open",
   "sheet": "S420",
   "title": "Bases of PC2 and the wind mullions",
   "description": "Top of footing is taken at the underside of the 120 slab for the portal columns. No base or cap detail is given for the UB wind mullions M1 / M2 or for PC2; plates and anchors for these are assumed.",
   "elements": [
    "^ROOF-PC2-",
    "^EWALL-G\\d-M[12]$"
   ]
  },
  {
   "id": "Q-08",
   "type": "Missing information",
   "status": "Open",
   "sheet": "S410",
   "title": "Noggings, C10010 and dropper rods",
   "description": "The C15012 noggings, the 'C10010 to u/s of purlins' and the M10 dropper rods appear as notes on S410 only. Quantities are counted or assumed as listed in the items not modelled.",
   "elements": [
    "^LWALL-D-G\\d-[1-3]$"
   ]
  },
  {
   "id": "Q-09",
   "type": "Clarification",
   "status": "Open",
   "sheet": "S410",
   "title": "End walls on grids 1 and 6",
   "description": "The end walls are shown with 150 stud infill and no steel girts. Stud framing is not included. If steel girts or light steel studs are wanted there, please advise.",
   "elements": [
    "^EWALL-G1-WB2",
    "^EWALL-G6-GH3"
   ]
  }
 ]
};
