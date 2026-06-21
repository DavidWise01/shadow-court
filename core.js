/*__CORE_START__*/
// TOPH atom-court core v4 — full 60:00 policy debate with timeline, cross-ex, and judge reasons.
// For team vs Against team (K/Q/J each); 3 judges tabulate scored events and rule with reasons.
// Nucleus (F first, M second) frames; first and last. Fully deterministic.
(function (root) {
  "use strict";
  var W_MALE=0.48, W_FEMALE=0.52, W_SAME=1.0, W_CROSS=0.4;
  var ROLES=["King","Queen","Jester"];
  var AXIS={King:"authority",Queen:"breadth",Jester:"resistance"};
  var TOTAL=3600;
  // the nucleus dipole, given faces: F (relational, 52%) ⚭ M (assertion, 48%), per domain. Rendered as framing voices in tribute.
  var NUCLEI={
    science: { f:{name:"Ada Lovelace",         line:"As poetical science I read it relationally"},               m:{name:"Alan Turing",         line:"As a decision problem I read it as a claim that must compel"} },
    religion:{ f:{name:"Hildegard of Bingen",  line:"As the greening web of creation I read it relationally"},   m:{name:"Thomas Aquinas",      line:"As a question for the Summa I read it as a claim that must be proven"} },
    politics:{ f:{name:"Hannah Arendt",        line:"As the web of human plurality I read it relationally"},      m:{name:"Niccolò Machiavelli", line:"As the assertion of power I read it as a claim that must compel"} }
  };
  function pickNuclei(opts){ var d=(opts&&typeof opts==="object"&&opts.domain&&NUCLEI[opts.domain])?opts.domain:"science"; return NUCLEI[d]; }

  function clamp01(x){ if(!isFinite(x)) return 0; return x<0?0:x>1?1:x; }
  function round(x,n){ var p=Math.pow(10,n||3); return Math.round(x*p)/p; }
  function pct(x){ return (x*100).toFixed(1)+"%"; }
  function countAny(w,s){ var n=0; for(var i=0;i<w.length;i++) if(s[w[i]]) n++; return n; }
  function toSet(s){ var o={},a=s.split(" "); for(var i=0;i<a.length;i++) o[a[i]]=1; return o; }
  var ASSERT=toSet("is are was must will shall proves demonstrates shows clearly always never fact established therefore thus defines determines causes");
  var HEDGE =toSet("may might could perhaps suggests appears seems possibly probably likely often sometimes can would believed thought estimated approximately");
  var RELATE=toSet("between together within relates depends context among across shared connection interaction system network relationship mutual interdependent emergent");

  function extractFeatures(text){
    text=String(text||"");
    var words=(text.toLowerCase().match(/[a-z']+/g)||[]); var W=words.length||1;
    var sentences=(text.match(/[.!?]+/g)||[]).length||1; var digits=(text.match(/[0-9]/g)||[]).length;
    var uniq={}; for(var i=0;i<words.length;i++) uniq[words[i]]=1;
    return { words:W, sentences:sentences, avgSentLen:W/sentences, digitDensity:digits/W,
      assert:countAny(words,ASSERT)/W, hedge:countAny(words,HEDGE)/W, rel:countAny(words,RELATE)/W,
      lexDiversity:Object.keys(uniq).length/W };
  }
  function nucleusDebate(f){
    var mScore=clamp01(0.5 + 6.0*f.assert + 3.0*f.digitDensity - 4.0*f.hedge);
    var fScore=clamp01(0.42 + 6.0*f.rel + 0.45*f.lexDiversity + 1.5*f.hedge);
    return { wMale:W_MALE, wFemale:W_FEMALE, mScore:mScore, fScore:fScore, merit:W_MALE*mScore+W_FEMALE*fScore };
  }
  function roleBase(role,idea,f){
    if(role==="King")  return idea.merit;
    if(role==="Queen") return clamp01(0.30 + 0.5*f.lexDiversity + 4.0*f.rel);
    return clamp01(1 - 2*Math.abs(idea.mScore-idea.fScore));
  }
  function recoveryFor(role,idea,f){
    if(role==="King")  return idea.mScore;
    if(role==="Queen") return f.lexDiversity;
    return clamp01(1 - 2*Math.abs(idea.mScore-idea.fScore));
  }
  function weight(jr,er){ return jr===er?W_SAME:W_CROSS; }

  function deliberate(text,opts){
    var f=extractFeatures(text), idea=nucleusDebate(f);
    var NN=pickNuclei(opts), NF=NN.f, NM=NN.m;
    var dmf=Math.abs(idea.mScore-idea.fScore);
    var segments=[], t=0, sid=0;
    function seg(dur,phase,kind,speaker,side,role,strength,scored,text){
      var s={id:"s"+(sid++),t0:t,t1:t+dur,dur:dur,phase:phase,kind:kind,speaker:speaker,side:side,role:role,strength:strength,scored:!!scored,text:text};
      t+=dur; segments.push(s); return s;
    }

    // nucleus frames: F first (relation 52%), then M (assertion 48%) — given persona faces
    seg(180,"framing","frame",NF.name+" · F",0,null,0,false,
      NF.line+": this resolution is a system of dependencies — relational density "+pct(f.rel)+". The question is whether it coheres.");
    seg(180,"framing","frame",NM.name+" · M",0,null,0,false,
      NM.line+" — assertion "+pct(f.assert)+" against hedging "+pct(f.hedge)+". Merit opens at "+round(idea.merit,2)+".");

    // three rounds (14:00 each)
    ROLES.forEach(function(role){
      var base=roleBase(role,idea,f), ax=AXIS[role];
      var forStr=base, againstStr=1-base;
      var leaderSign=base>=0.5?1:-1, trailerSign=-leaderSign;
      var rebStr=Math.abs(2*base-1)*0.5;
      var recovery=recoveryFor(role,idea,f), ansStr=recovery*0.6;
      // For constructive (5:00)
      seg(300,"round-"+role,"constructive","For · "+role,1,role,forStr,true,
        role==="King"?("Affirmative constructive: the resolution holds on authority — assertion "+pct(f.assert)+", merit "+round(idea.merit,2)+". We affirm ("+forStr.toFixed(2)+").")
        :role==="Queen"?("Affirmative: breadth carries it — relational density "+pct(f.rel)+", lexical reach "+round(f.lexDiversity,2)+". The idea connects.")
        :("Affirmative: it holds under inversion — both frames converge (Δ "+round(dmf,2)+"). Robust under cross-ex."));
      // Against constructive (5:00)
      seg(300,"round-"+role,"constructive","Against · "+role,-1,role,againstStr,true,
        role==="King"?("Negative constructive: the claim overreaches — hedging "+pct(f.hedge)+" leaves it unproven. We negate ("+againstStr.toFixed(2)+").")
        :role==="Queen"?("Negative: the connections are thin where it counts; the case doesn't generalize.")
        :("Negative: flip the frame and it splits (Δ "+round(dmf,2)+"); the claim is contingent."));
      // Rebuttal (2:00) — the leader presses
      seg(120,"round-"+role,"rebuttal",(leaderSign>0?"For":"Against")+" · "+role,leaderSign,role,rebStr,true,
        (leaderSign>0?"For rebuttal: the negative's objection doesn't land — our "+ax+" advantage stands.":"Against rebuttal: the affirmative thins under pressure on "+ax+"; the burden isn't met."));
      // Judge question (1:00) — the matching judge questions the trailing side
      seg(60,"round-"+role,"question","Judge · "+role,0,role,0,false,
        "Judge "+role+" to the "+(trailerSign>0?"affirmative":"negative")+": on "+ax+", what survives the strongest objection?");
      // Answer (1:00) — the trailing side defends; cross-ex moves the panel
      seg(60,"round-"+role,"answer",(trailerSign>0?"For":"Against")+" · "+role,trailerSign,role,ansStr,true,
        "Defense: "+(recovery>0.5?"we recover — ":"we concede ground — ")+ax+" support sits at "+round(recovery,2)+" ("+(trailerSign>0?"affirmative":"negative")+").");
    });

    // tally the three silent judges over all scored events
    var scored=segments.filter(function(s){return s.scored;});
    var judges=[], sumNet=0, aff=0, neg=0, tie=0;
    ROLES.forEach(function(jr){
      var net=0, decisive=null, maxAbs=-1;
      scored.forEach(function(s){
        var c=s.side*s.strength*weight(jr,s.role); net+=c;
        if(Math.abs(c)>maxAbs){ maxAbs=Math.abs(c); decisive={role:s.role,kind:s.kind,side:s.side,contrib:c}; }
      });
      var ballot=net>1e-9?"AFF":net<-1e-9?"NEG":"TIE";
      if(ballot==="AFF") aff++; else if(ballot==="NEG") neg++; else tie++;
      var side=decisive.side>0?"the affirmative":"the negative";
      var reason="I weight "+AXIS[jr]+". The "+decisive.role+" round decided it — "+side+"'s "+decisive.kind+" carried "+(decisive.contrib>=0?"+":"")+round(decisive.contrib,2)+" with me. Ballot "+ballot+" (net "+round(net,2)+").";
      judges.push({role:jr,net:net,ballot:ballot,reason:reason,decisive:decisive}); sumNet+=net;
    });
    var panelNet=sumNet/ROLES.length;
    var verdict=panelNet>=0.2?"UPHELD":panelNet<=-0.2?"STRUCK":"CONTESTED";

    // deliberation (12:00): each judge rules with its reason
    ROLES.forEach(function(jr){
      var j=judges.filter(function(x){return x.role===jr;})[0];
      seg(240,"deliberation","ruling","Judge · "+jr,0,jr,0,false,j.reason);
    });

    return { features:f, nucleus:idea, totalSeconds:TOTAL, segments:segments,
      judges:judges, panelNet:panelNet, ballotCount:{aff:aff,neg:neg,tie:tie}, verdict:verdict };
  }

  var API={ W_MALE:W_MALE,W_FEMALE:W_FEMALE,W_SAME:W_SAME,W_CROSS:W_CROSS,ROLES:ROLES,AXIS:AXIS,TOTAL:TOTAL,NUCLEI:NUCLEI,
    clamp01:clamp01,extractFeatures:extractFeatures,nucleusDebate:nucleusDebate,roleBase:roleBase,recoveryFor:recoveryFor,deliberate:deliberate,pickNuclei:pickNuclei };
  if(typeof module!=="undefined"&&module.exports) module.exports=API;
  root.CORE=API;
})(typeof globalThis!=="undefined"?globalThis:this);
/*__CORE_END__*/
