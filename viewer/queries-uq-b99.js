// RapidSteel MTO - engineer queries for the model.
// elements = regular expressions on the RapidSteel PlanId property.
window.RS_QUERIES = {
 "model": "uq-b99_MODEL.ifc",
 "queries": [
  {
   "id": "Q-01",
   "type": "Missing information",
   "status": "Open",
   "sheet": "S1.002 / S1.003",
   "title": "Level of the pipework support beams B1",
   "description": "The level of the two 200 x 200 x 5 SHS beams B1 is not printed on the structural drawings. The cross beam underside is taken at RL 6.024 from architectural sheet 402, with the beam between the concrete columns on top of it. Please confirm the levels.",
   "elements": [
    "^B1-[AB]$"
   ]
  },
  {
   "id": "Q-02",
   "type": "Missing information",
   "status": "Open",
   "sheet": "A103 / A402",
   "title": "Post under the pipework beam",
   "description": "The architect shows a 'steel column in line of fence to support UB pipework structure'; it has no mark, size, base or footing on the structural drawings, and the architect calls the beam a UB while the schedule gives B1 = 200 x 200 x 5 SHS. Priced as an 89 x 89 x 5 SHS post, about 2.0 m, with base and cap plates. Please confirm.",
   "elements": [
    "^B1-POST"
   ]
  },
  {
   "id": "Q-03",
   "type": "Clarification",
   "status": "Open",
   "sheet": "S1.003 schedule",
   "title": "Scheduled marks that are not drawn",
   "description": "T1, T2 (framing truss), PP1 (pole plate) and CJ1 (EC150-15 ceiling joists at 300) are in the steel member schedule but are not drawn on any plan, section or detail; the architectural sections show exposed purlins and no ceiling. Not included. Please confirm they are not required.",
   "elements": []
  },
  {
   "id": "Q-04",
   "type": "Missing information",
   "status": "Open",
   "sheet": "S1.003 / A401",
   "title": "Stair treads and mid landing",
   "description": "The stair detail shows 8 thick tread support plates 'size to suit treads' only; the tread type and the landing infill are not specified. Shown with grating treads 305 x 32 and a grating landing on 75 x 75 x 8 angles; gratings are listed by number / area, not in the steel weight. Please advise the tread and landing type.",
   "elements": [
    "^G-",
    "^LA-[NS]$"
   ]
  },
  {
   "id": "Q-05",
   "type": "Conflict",
   "status": "Open",
   "sheet": "S1.003 / A401 / A402",
   "title": "Length of Stair 1",
   "description": "The architect's setout (22 risers @ 177.3, goings 255, 1.0 m landing) gives a 6.10 m run; structural section 1 and the slab thickening TH3 on S1.001 show the stair foot about 560 mm further west. Priced to the architect. Please confirm which governs.",
   "elements": [
    "^STR-[NS][ULD]$"
   ]
  },
  {
   "id": "Q-06",
   "type": "Clarification",
   "status": "Open",
   "sheet": "S1.003 / A402",
   "title": "Purlin rows and laps",
   "description": "P1 is scheduled 'EC150-12 at 1200 max' without a dimensioned layout: structural sections 1 and 2 show 8 rows, architectural section 02 shows 7. Priced as 8 rows, one length per bay lapped 15 % of the span over the middle rafter. EC150 is a C section - please confirm lapped lengths or a continuous length.",
   "elements": [
    "^P-\\d[AB]$"
   ]
  },
  {
   "id": "Q-07",
   "type": "Clarification",
   "status": "Open",
   "sheet": "S0.002 note 36",
   "title": "Bridging",
   "description": "General note 36 requires a minimum of 1 row of bridging; no bridging line is drawn on the roof framing plan. Priced with 1 row per bay at mid span.",
   "elements": [
    "^BRG-"
   ]
  },
  {
   "id": "Q-08",
   "type": "Clarification",
   "status": "Open",
   "sheet": "S0.002 note 40",
   "title": "Barge / trimming sections",
   "description": "General note 40 requires a C barge / trimming section to all roof edges, same size and gauge as the purlins; none is drawn as a member. Priced with one EC150-12 at the north and south roof edges.",
   "elements": [
    "^BG-[NS]$"
   ]
  },
  {
   "id": "Q-09",
   "type": "Missing information",
   "status": "Open",
   "sheet": "A103 / A402 / S1.003",
   "title": "Pipe supports off the existing building and slab penetration angles",
   "description": "'High level pipe support to structural engineer's details' and 'sprinkler pipework to be supported off existing' are noted by the architect, and S1.003 has a slab penetration infill detail with unsized angles; no members, sizes or numbers are given. Not included.",
   "elements": []
  },
  {
   "id": "Q-10",
   "type": "Clarification",
   "status": "Open",
   "sheet": "S0.002 notes 30-31 / S1.003 note 3",
   "title": "Finish of the pump house frame",
   "description": "'All external steelwork to be hot dip galvanised'. The stair, the pipework beams and the post are external; the pump house frame is inside the cladding. Please confirm whether the frame is galvanised or primed.",
   "elements": [
    "^C-[NMS]\\d$",
    "^R-[SMN]$"
   ]
  },
  {
   "id": "Q-11",
   "type": "Clarification",
   "status": "Open",
   "sheet": "A800 / A401",
   "title": "Balustrade BAL1",
   "description": "BAL1 is a proprietary modular galvanised balustrade (top, mid and bottom rail). The part on Stair 1 is shown in the model for completeness and listed as provisional outside the steel total; the platform edge balustrade is not modelled.",
   "elements": [
    "^HR-"
   ]
  }
 ],
 "preview": true
};
