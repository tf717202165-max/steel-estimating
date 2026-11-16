// RapidSteel MTO - engineer queries for the model.
// elements = regular expressions on the RapidSteel PlanId property.
window.RS_QUERIES = {
 "model": "anzac-avenue_MODEL.ifc",
 "queries": [
  {
   "id": "Q-01",
   "type": "Missing information",
   "status": "Open",
   "sheet": "S8001 - S8004",
   "title": "No steel detail sheets in the tender set",
   "description": "The framing plans refer to typical steelwork details and to detail sheets for fly bracing, but the set stops at S8014. Base plates, anchors, member end connections, purlin cleats, fly brace size and bridging type are not shown. All plates are priced at tender-rule sizes (10 plate minimum, 2-M20); fly braces as 50 x 50 x 5 EA. Please issue the steel detail sheets.",
   "elements": [
    "^C-B2R-SC1-",
    "^CL-B2R-P1-B1-",
    "^B2R-FB-"
   ]
  },
  {
   "id": "Q-02",
   "type": "Missing information",
   "status": "Open",
   "sheet": "S8001 - S8004",
   "title": "Existing steel repair and roof cowl trimmers",
   "description": "The boxed note asks to allow for existing structural steel repair (investigation report 260907-26-056) and for trimmers around roof cowls (MEP drawings). Neither document was received and nothing is drawn. Both are excluded.",
   "elements": [
    "^B2R-P1-B2-Xp0[0-4]"
   ]
  },
  {
   "id": "Q-03",
   "type": "Missing information",
   "status": "Open",
   "sheet": "S8004 / S3001",
   "title": "Supermarket interior framing has no elevation",
   "description": "The H.3 headers and M.5 posts over the new level 1 slab edge, and the row of three SC.2 columns with four M.5 posts near grid H, have no elevation. Heights are assumed: the framing nearest the shopfront follows the existing 10 degree roof of SE.28 / SE.29, the rest is taken to +7780. Please provide a section.",
   "elements": [
    "^SUPER-MZ-",
    "^SUPER-ROW-"
   ]
  },
  {
   "id": "Q-04",
   "type": "Conflict",
   "status": "Open",
   "sheet": "S3001 / S8003 / S8013",
   "title": "Grid G posts: new SC.1 or existing",
   "description": "Eight posts on grid G are tagged SC.1 on the level 1 plan S3001 but ESC (existing) on the roof framing plans and in elevation SE.17. Treated as existing and not included. If they are new 100 x 5 SHS columns, add about 550 kg plus plates.",
   "elements": [
    "^B2R-R3-"
   ]
  },
  {
   "id": "Q-05",
   "type": "Clarification",
   "status": "Open",
   "sheet": "S8003",
   "title": "P.3 purlin section",
   "description": "The schedule gives Z15010, which is not a standard catalogue size. Priced as Z15010 at 2.43 kg/m (12 purlins, 70.6 m). Please confirm the section.",
   "elements": [
    "^B2R-P3-"
   ]
  },
  {
   "id": "Q-06",
   "type": "Conflict",
   "status": "Open",
   "sheet": "S8001 - S8004",
   "title": "RA.1 scheduled twice",
   "description": "RA.1 appears in the schedule as 100 x 10 EA and as 150 x 100 x 10 UA. Priced as 100 x 100 x 10 EA (6 pieces, 10.8 m).",
   "elements": [
    "^B2R-RA1-"
   ]
  },
  {
   "id": "Q-07",
   "type": "Clarification",
   "status": "Open",
   "sheet": "S8011 - S8014",
   "title": "Dimensions and levels",
   "description": "No architectural drawings were received and the structural sheets print no dimensions or RLs. Positions are measured from the 1:100 plans, levels from the framing elevations relative to the named level lines. Accuracy is about 20 mm.",
   "elements": [
    "^B1-SE02-M0[1-4]$"
   ]
  },
  {
   "id": "Q-08",
   "type": "Clarification",
   "status": "Open",
   "sheet": "S8011 - S8014",
   "title": "Screen headers and rails: cleated or welded panels",
   "description": "The drawings do not say whether the mullion and header screens are shop-welded panels or loose members. Priced as loose members with a 10 plate cleat at each header and rail end (640 cleats, in the items not modelled).",
   "elements": [
    "^B1-SE02-H1-R0[1-6]$"
   ]
  },
  {
   "id": "Q-09",
   "type": "Clarification",
   "status": "Open",
   "sheet": "S2002 / S2003",
   "title": "Column and mullion layout for pricing only",
   "description": "S2003 notes that the final location of columns and mullions is to be confirmed; S2002 notes that the three SC.2 columns replace existing UB columns on existing footings. Priced as drawn; removal of existing columns and propping are excluded.",
   "elements": [
    "^SUPER-ROW-SC2-"
   ]
  }
 ]
};
