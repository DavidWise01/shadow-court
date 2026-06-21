#!/usr/bin/env node
"use strict";
// Closure Loop audit v4 (full debate): Detect -> Compare -> Witness -> Anchor. Exit = failed checks.
var fs=require("fs"), crypto=require("crypto"), path=require("path");
var CORE=require("./core.js");
var CORPUS=[
  {id:"octopus", text:"An octopus is a soft-bodied, eight-limbed mollusc of the order Octopoda, grouped within Cephalopoda with squids, cuttlefish, and nautiloids across many regions of the ocean including reefs and the seabed."},
  {id:"stoicism",text:"Stoicism is a school of Hellenistic philosophy. The Stoics believed the practice of virtue is enough to achieve eudaimonia, living in accordance with nature. It was founded in Athens by Zeno around 300 BC."},
  {id:"halting", text:"In computability theory, the halting problem is undecidable: no general algorithm exists that determines whether an arbitrary program halts for all inputs. Alan Turing proved in 1936 that such an algorithm cannot exist."},
  {id:"cable",   text:"Asia-Africa-Europe 1 is a 25,000 km submarine cable from South East Asia to Europe across Egypt, connecting Hong Kong, Vietnam, Singapore, Thailand, India, Pakistan, UAE, Greece, Italy, and France."},
  {id:"assert",  text:"The system is correct. It must terminate. The proof shows 3 cases. Each case proves the theorem. This is fact. The algorithm always halts in 42 steps."},
  {id:"hedge",   text:"The network might perhaps relate within a shared emergent context. These interactions could depend on relationships among the connections, though it may sometimes appear otherwise."},
  {id:"empty",   text:""},
  {id:"garbage", text:"@@@ 999 ### ~~~ !!!"}
];
function walkNumbers(o,cb){ if(typeof o==="number") return cb(o); if(o&&typeof o==="object") for(var k in o) walkNumbers(o[k],cb); }
function approx(a,b,e){ return Math.abs(a-b)<=(e||1e-12); }
var checks=[];
function check(n,fn){ var d="",p=false; try{ var r=fn(); if(r===true)p=true; else if(r&&typeof r==="object"){p=r.pass;d=r.detail||"";} }catch(e){p=false;d="threw: "+e.message;} checks.push({name:n,pass:p,detail:d}); }

check("weights_48_52_partition",function(){ var ok=CORE.W_MALE===0.48&&CORE.W_FEMALE===0.52&&approx(CORE.W_MALE+CORE.W_FEMALE,1);
  return {pass:ok,detail:"male="+CORE.W_MALE+" female="+CORE.W_FEMALE+" sum="+(CORE.W_MALE+CORE.W_FEMALE)};});
check("judge_weights_are_spec",function(){ var ok=CORE.W_SAME===1.0&&CORE.W_CROSS===0.4;
  return {pass:ok,detail:"W_SAME="+CORE.W_SAME+" W_CROSS="+CORE.W_CROSS};});
check("merit_equals_independent_blend",function(){ var w=0,wh=""; CORPUS.forEach(function(c){var s=CORE.deliberate(c.text).nucleus;var d=Math.abs(s.merit-(0.48*s.mScore+0.52*s.fScore));if(d>w){w=d;wh=c.id;}}); return {pass:w<1e-12,detail:"max|merit-recompute|="+w.toExponential(2)+" ("+wh+")"};});
check("strengths_in_0_1",function(){ var bad=null; CORPUS.forEach(function(c){ CORE.deliberate(c.text).segments.filter(function(s){return s.scored;}).forEach(function(s){ if(s.strength<0||s.strength>1) bad=c.id+"."+s.speaker; }); }); return {pass:bad===null,detail:bad?"out of range: "+bad:"all scored strengths in [0,1]"};});
check("finite_on_all_inputs",function(){ var bad=null; CORPUS.forEach(function(c){ walkNumbers(CORE.deliberate(c.text),function(n){ if(!isFinite(n)) bad=c.id; }); }); return {pass:bad===null,detail:bad?"non-finite at "+bad:"all finite"};});

check("timeline_sums_to_3600_contiguous",function(){
  var bad=null,total=null; CORPUS.forEach(function(c){
    var segs=CORE.deliberate(c.text).segments;
    var sum=segs.reduce(function(a,s){return a+s.dur;},0); total=sum;
    if(sum!==3600) bad=c.id+" sum="+sum;
    if(segs[0].t0!==0) bad=c.id+" t0!=0";
    for(var i=0;i<segs.length-1;i++) if(segs[i].t1!==segs[i+1].t0) bad=c.id+" gap@"+i;
    if(segs[segs.length-1].t1!==3600) bad=c.id+" end!=3600";
  });
  return {pass:bad===null,detail:bad?"timeline broken: "+bad:"contiguous 0..3600 (60:00), no gaps"};});

check("structure_framing_rounds_deliberation",function(){
  var s=CORE.deliberate("test").segments;
  var frameOk=s[0].kind==="frame"&&/· F$/.test(s[0].speaker)&&s[1].kind==="frame"&&/· M$/.test(s[1].speaker);
  var roundsOk=true;
  CORE.ROLES.forEach(function(role){
    var rs=s.filter(function(x){return x.phase==="round-"+role;});
    var kinds=rs.map(function(x){return x.kind;}).join(",");
    if(kinds!=="constructive,constructive,rebuttal,question,answer") roundsOk=false;
    if(!(rs[0].side===1&&rs[1].side===-1)) roundsOk=false; // For then Against
  });
  var rulings=s.filter(function(x){return x.kind==="ruling";});
  var ok=frameOk&&roundsOk&&rulings.length===3;
  return {pass:ok,detail:"frame_FM="+frameOk+" rounds_ok="+roundsOk+" rulings="+rulings.length};});

check("determinism_and_seed_independent",function(){ var bad=null; CORPUS.forEach(function(c){ var a=JSON.stringify(CORE.deliberate(c.text,1)),b=JSON.stringify(CORE.deliberate(c.text,1)),d=JSON.stringify(CORE.deliberate(c.text,999)); if(a!==b)bad=c.id+"(rerun)"; if(a!==d)bad=c.id+"(seed)"; }); return {pass:bad===null,detail:bad?"nondeterministic "+bad:"identical across reruns and seeds"};});

check("teams_argue_complementary_strength",function(){ var w=0,wh=""; CORPUS.forEach(function(c){ var s=CORE.deliberate(c.text).segments;
  CORE.ROLES.forEach(function(role){
    var cons=s.filter(function(x){return x.phase==="round-"+role&&x.kind==="constructive";});
    var F=cons.filter(function(x){return x.side===1;})[0], A=cons.filter(function(x){return x.side===-1;})[0];
    var e=Math.abs((F.strength+A.strength)-1); if(e>w){w=e;wh=c.id+"."+role;} }); });
  return {pass:w<1e-12,detail:"max|forStr+againstStr-1|="+w.toExponential(2)+" ("+wh+") — genuine opposition"};});

check("judge_tally_recomputed_from_scored_events",function(){ var w=0,wh=""; CORPUS.forEach(function(c){ var d=CORE.deliberate(c.text); var scored=d.segments.filter(function(s){return s.scored;});
  d.judges.forEach(function(j){ var indep=0; scored.forEach(function(s){ indep+=s.side*s.strength*(j.role===s.role?1.0:0.4); }); var e=Math.abs(j.net-indep); if(e>w){w=e;wh=c.id+".judge"+j.role;} }); });
  return {pass:w<1e-12,detail:"max|judgeNet-recompute|="+w.toExponential(2)+" ("+wh+") — judges tabulate the actual events"};});

check("verdict_threshold_independent",function(){ function indep(p){return p>=0.2?"UPHELD":p<=-0.2?"STRUCK":"CONTESTED";} var bad=null; CORPUS.forEach(function(c){ var d=CORE.deliberate(c.text); if(d.verdict!==indep(d.panelNet)) bad=c.id; }); return {pass:bad===null,detail:bad?"mismatch "+bad:"verdict matches independent panelNet rule"};});

check("verdict_responsive_to_input",function(){ var seen={}; CORPUS.forEach(function(c){ seen[CORE.deliberate(c.text).verdict]=1; }); var k=Object.keys(seen); return {pass:k.length>=2,detail:"distinct verdicts: "+k.join(", ")+" — responds to the article"};});

check("one_judge_question_per_round",function(){ var bad=null; CORPUS.forEach(function(c){ var qs=CORE.deliberate(c.text).segments.filter(function(s){return s.kind==="question";});
  if(qs.length!==3) bad=c.id+" qcount="+qs.length;
  CORE.ROLES.forEach(function(role){ var q=qs.filter(function(x){return x.role===role;}); if(q.length!==1) bad=c.id+" role "+role+" q="+q.length; else if(q[0].speaker!=="Judge · "+role) bad=c.id+" wrong asker "+q[0].speaker; }); });
  return {pass:bad===null,detail:bad?"question structure: "+bad:"exactly 1 question/round, asked by the matching judge"};});

check("judges_give_reasons_matching_rulings",function(){ var bad=null; CORPUS.forEach(function(c){ var d=CORE.deliberate(c.text);
  if(d.judges.length!==3) bad=c.id+" judges="+d.judges.length;
  d.judges.forEach(function(j){ if(!j.reason||j.reason.length<20) bad=c.id+" thin reason "+j.role; });
  var rulings=d.segments.filter(function(s){return s.kind==="ruling";});
  CORE.ROLES.forEach(function(role){ var r=rulings.filter(function(x){return x.role===role;})[0]; var j=d.judges.filter(function(x){return x.role===role;})[0]; if(!r||r.text!==j.reason) bad=c.id+" ruling!=reason "+role; }); });
  return {pass:bad===null,detail:bad?"reason/ruling: "+bad:"3 judges give reasons; each ruling segment carries that reason"};});

check("shipped_equals_tested",function(){ var hp=path.join(__dirname,"index.html"); if(!fs.existsSync(hp)) return {pass:false,detail:"index.html not present yet"};
  var cs=fs.readFileSync(path.join(__dirname,"core.js"),"utf8"); var m=cs.match(/\/\*__CORE_START__\*\/[\s\S]*\/\*__CORE_END__\*\//); var b=m?m[0]:null;
  var inH=b&&fs.readFileSync(hp,"utf8").indexOf(b)!==-1; return {pass:!!inH,detail:inH?"core block verbatim in index.html":"core block NOT in index.html (drift!)"};});

var failed=checks.filter(function(c){return !c.pass;});
var report={ document_id:"INSP-"+new Date().toISOString().slice(0,10).replace(/-/g,"")+"-toph-debate-1hr",
  method:"Closure Loop (Detect -> Anchor -> Compare -> Witness)", timestamp:new Date().toISOString(),
  model:"60:00 policy debate: framing(F,M) + 3 rounds(For/Against constructive, rebuttal, judge cross-ex, answer) + 3-judge deliberation with reasons",
  corpus_size:CORPUS.length, checks:checks, passed:checks.length-failed.length, total:checks.length,
  compliance:failed.length===0?"Fully Compliant":"Non-Compliant", verdict:failed.length===0?"WORKS — verified, not asserted":"FAILS — "+failed.length+" check(s) bit" };
report.sha256="sha256:"+crypto.createHash("sha256").update(JSON.stringify(report.checks)).digest("hex");
fs.writeFileSync(path.join(__dirname,"audit_report.json"),JSON.stringify(report,null,2));
console.log("\nClosure Loop audit v4  —  "+report.document_id+"\ncorpus "+CORPUS.length+"\n");
checks.forEach(function(c){ console.log("  ["+(c.pass?"PASS":"FAIL")+"] "+c.name+(c.detail?"  —  "+c.detail:"")); });
console.log("\n"+report.passed+"/"+report.total+" passed   compliance="+report.compliance);
console.log("anchor "+report.sha256); console.log("verdict: "+report.verdict+"\n");
process.exit(failed.length);
