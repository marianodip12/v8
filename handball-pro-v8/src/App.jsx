import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { supabase } from "./lib/supabase.js";

// ═══════════════════════════════════════════════════
//  THEME
// ═══════════════════════════════════════════════════
const T = {
  bg:"#060c18", card:"#0d1526", card2:"#111e35",
  accent:"#3b82f6", cyan:"#06b6d4",
  green:"#22c55e", red:"#ef4444", yellow:"#f59e0b",
  orange:"#f97316", purple:"#8b5cf6",
  text:"#e2e8f0", muted:"#64748b", border:"#1a2d4a",
  font:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
};

// ═══════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════
const ZONES = {
  left_wing:  { label:"Extremo Izq.", short:"EI", emoji:"◀", color:"#06b6d4",
    path:"M 0 0 L 56 0 A 84 84 0 0 1 67 42 L 31 63 A 126 126 0 0 0 14 0 Z", lx:22, ly:34 },
  left_back:  { label:"Back Izq.",    short:"LI", emoji:"↖", color:"#8b5cf6",
    path:"M 67 42 A 84 84 0 0 1 98 73 L 77 109 A 126 126 0 0 0 31 63 Z",    lx:53, ly:74 },
  center:     { label:"Central",      short:"CE", emoji:"↑", color:"#f59e0b",
    path:"M 98 73 A 84 84 0 0 1 182 73 L 203 109 A 126 126 0 0 0 77 109 Z", lx:140,ly:90 },
  right_back: { label:"Back Der.",    short:"LD", emoji:"↗", color:"#8b5cf6",
    path:"M 182 73 A 84 84 0 0 1 213 42 L 249 63 A 126 126 0 0 0 203 109 Z",lx:223,ly:74 },
  right_wing: { label:"Extremo Der.", short:"ED", emoji:"▶", color:"#06b6d4",
    path:"M 280 0 L 224 0 A 84 84 0 0 0 213 42 L 249 63 A 126 126 0 0 1 266 0 Z",lx:256,ly:34},
  pivot:      { label:"Pivote",       short:"PI", emoji:"⬟", color:"#ef4444",
    path:"M 98 73 A 84 84 0 0 1 182 73 L 140 0 Z",                          lx:140,ly:50 },
  penal:      { label:"Penal 7m",     short:"7m", emoji:"⚪", color:"#ffffff",
    path:"M 116 -28 L 164 -28 L 164 0 L 116 0 Z",                           lx:140,ly:-16 },
};

const QUADRANTS = [
  {id:0,label:"Sup Izq",icon:"↖",row:0,col:0},{id:1,label:"Sup Cen",icon:"↑",row:0,col:1},
  {id:2,label:"Sup Der",icon:"↗",row:0,col:2},{id:3,label:"Med Izq",icon:"←",row:1,col:0},
  {id:4,label:"Centro", icon:"●",row:1,col:1},{id:5,label:"Med Der",icon:"→",row:1,col:2},
  {id:6,label:"Inf Izq",icon:"↙",row:2,col:0},{id:7,label:"Inf Cen",icon:"↓",row:2,col:1},
  {id:8,label:"Inf Der",icon:"↘",row:2,col:2},
];

const EV_TYPES = {
  goal:        {label:"Gol",          icon:"⚽",color:"#22c55e"},
  miss:        {label:"Tiro errado",  icon:"❌",color:"#64748b"},
  saved:       {label:"Atajada",      icon:"🧤",color:"#60a5fa"},
  turnover:    {label:"Pérdida",      icon:"🔄",color:"#94a3b8"},
  timeout:     {label:"T. Muerto",    icon:"⏸",color:"#f59e0b"},
  exclusion:   {label:"Exclusión 2'", icon:"⏱",color:"#f97316"},
  red_card:    {label:"Tarjeta Roja", icon:"🟥",color:"#ef4444"},
  blue_card:   {label:"Tarjeta Azul", icon:"🟦",color:"#3b82f6"},
  yellow_card: {label:"Amarilla",     icon:"🟨",color:"#f59e0b"},
  half_time:   {label:"Descanso",     icon:"🔔",color:"#8b5cf6"},
};

const COMPETITIONS = ["Liga","Copa","Super 8","Amistoso","Torneo Regional"];
const VENUES = ["Local","Visitante","Neutro"];
const POSITIONS = ["Arquero","Armador","Lateral Izq.","Lateral Der.","Extremo Izq.","Extremo Der.","Pivote"];

const DISTANCES = [
  {k:"6m",l:"6m",emoji:"🟢"},{k:"9m",l:"9m",emoji:"🟡"},
  {k:"12m",l:"12m",emoji:"🟠"},{k:"penal",l:"Penal 7m",emoji:"⚪"},{k:"arco",l:"Arco-Arco",emoji:"🔴"},
];
const SITUATIONS = [
  {k:"igualdad",l:"Igualdad",emoji:"⚖️",color:"#64748b"},
  {k:"superioridad",l:"Superioridad",emoji:"📈",color:"#22c55e"},
  {k:"inferioridad",l:"Inferioridad",emoji:"📉",color:"#ef4444"},
];
const THROW_TYPES = [
  {k:"salto",l:"Salto",emoji:"🦘"},{k:"habilidad",l:"Habilidad",emoji:"🤸"},
  {k:"finta",l:"Finta",emoji:"🌀"},{k:"penetracion",l:"Penetración",emoji:"🏃"},
  {k:"otro",l:"Otro",emoji:"❓"},
];

// ═══════════════════════════════════════════════════
//  SHARED ATOMS
// ═══════════════════════════════════════════════════
function Btn({onClick,children,color,outline,style={},disabled=false}){
  const bg=outline?"transparent":color||T.accent;
  const border=outline?`1px solid ${color||T.accent}`:"none";
  return(
    <button onClick={onClick} disabled={disabled}
      style={{background:disabled?"#1a2d4a":bg,color:disabled?T.muted:"#fff",border:disabled?"1px solid #1a2d4a":border,
        borderRadius:12,padding:"13px 16px",fontWeight:700,fontSize:13,cursor:disabled?"not-allowed":"pointer",
        width:"100%",...style}}>
      {children}
    </button>
  );
}
function Card({children,style={}}){
  return <div style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"13px 14px",...style}}>{children}</div>;
}
function SectionLabel({children}){
  return <div style={{fontSize:9,color:T.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:7,fontWeight:700}}>{children}</div>;
}
function Badge({label,color}){
  return <span style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:8,padding:"2px 8px",fontSize:10,fontWeight:700}}>{label}</span>;
}

function QuadrantPicker({value,onChange,resultColor}){
  const rows=[[0,1,2],[3,4,5],[6,7,8]];
  return(
    <div>
      <SectionLabel>CUADRANTE DEL ARCO</SectionLabel>
      <div style={{background:"#0c2340",borderRadius:12,padding:10,border:`1px solid ${T.border}`}}>
        <svg viewBox="0 0 100 40" width="100%" style={{display:"block",marginBottom:8}}>
          <rect x="20" y="2" width="60" height="36" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="1.5"/>
          <line x1="40" y1="2" x2="40" y2="38" stroke="rgba(255,255,255,.3)" strokeWidth=".8"/>
          <line x1="60" y1="2" x2="60" y2="38" stroke="rgba(255,255,255,.3)" strokeWidth=".8"/>
          <line x1="20" y1="15" x2="80" y2="15" stroke="rgba(255,255,255,.3)" strokeWidth=".8"/>
          <line x1="20" y1="27" x2="80" y2="27" stroke="rgba(255,255,255,.3)" strokeWidth=".8"/>
        </svg>
        {rows.map((row,ri)=>(
          <div key={ri} style={{display:"flex",gap:5,marginBottom:ri<2?5:0}}>
            {row.map(qi=>{
              const q=QUADRANTS[qi];
              const sel=value===qi;
              return(
                <button key={qi} onClick={()=>onChange(sel?null:qi)}
                  style={{flex:1,background:sel?(resultColor||T.accent)+"33":"rgba(255,255,255,.05)",
                    border:`1.5px solid ${sel?(resultColor||T.accent):"rgba(255,255,255,.1)"}`,
                    borderRadius:8,padding:"8px 4px",cursor:"pointer",
                    display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                  <span style={{fontSize:14,lineHeight:1}}>{q.icon}</span>
                  <span style={{fontSize:8,color:sel?(resultColor||T.accent):T.muted,fontWeight:700}}>{q.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniCourt({onZoneClick,selZone,heatCounts={}}){
  const [hov,setHov]=useState(null);
  const maxV=Math.max(...Object.values(heatCounts),1);
  const heatFill=k=>{
    const v=heatCounts[k]||0;
    if(!v)return "rgba(255,255,255,0.04)";
    return `rgba(59,130,246,${0.15+v/maxV*0.5})`;
  };
  return(
    <div style={{background:"#0f2a5a",borderRadius:14,padding:"10px 6px",border:"1px solid #1e407a"}}>
      <svg viewBox="-8 -28 296 190" width="100%" preserveAspectRatio="xMidYMid meet" style={{display:"block",maxWidth:360,margin:"0 auto"}}>
        <rect x="-8" y="-28" width="296" height="190" fill="#0f2a5a" rx="8"/>
        <rect x="0" y="0" width="280" height="155" fill="#2196c4" rx="4"/>
        <path d="M 56 0 A 84 84 0 0 1 224 0 Z" fill="#1565a0"/>
        {Object.entries(ZONES).map(([key,zone])=>(
          <path key={key} d={zone.path}
            fill={selZone===key?zone.color+"55":heatFill(key)}
            stroke={selZone===key?"#fff":hov===key?"rgba(255,255,255,.55)":"rgba(255,255,255,.15)"}
            strokeWidth={selZone===key?2.5:hov===key?1.5:1}
            style={{cursor:"pointer",transition:"all .15s"}}
            onMouseEnter={()=>setHov(key)} onMouseLeave={()=>setHov(null)}
            onClick={()=>onZoneClick&&onZoneClick(selZone===key?null:key)}
          />
        ))}
        {Object.entries(ZONES).map(([key,zone])=>(
          <text key={key+"t"} x={zone.lx} y={zone.ly} textAnchor="middle"
            style={{fontSize:10,fill:"rgba(255,255,255,.7)",fontWeight:700,pointerEvents:"none",userSelect:"none"}}>
            {zone.short}
          </text>
        ))}
      </svg>
    </div>
  );
}

function PlayerPicker({players=[],value,onChange,label,accent}){
  return(
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
        {players.map(p=>(
          <button key={p.id||p.name} onClick={()=>onChange(value===p.name?null:p.name)}
            style={{background:value===p.name?(accent||T.accent)+"22":T.card2,
              color:value===p.name?(accent||T.accent):T.muted,
              border:`1.5px solid ${value===p.name?(accent||T.accent):T.border}`,
              borderRadius:10,padding:"7px 10px",fontSize:11,fontWeight:700,cursor:"pointer",
              display:"flex",alignItems:"center",gap:4}}>
            <span style={{background:(accent||T.accent)+"33",borderRadius:5,padding:"1px 5px",fontSize:10,fontWeight:800}}>
              #{p.number}
            </span>
            {p.name}
          </button>
        ))}
        {players.length===0&&<span style={{fontSize:11,color:T.muted,padding:"6px 0"}}>Sin jugadores cargados</span>}
      </div>
    </div>
  );
}

function ScoreChart({events,homeColor,awayColor}){
  const pts=useMemo(()=>{
    const r=[{min:0,h:0,a:0}];
    events.filter(e=>e.hScore!=null&&e.type!=="half_time").forEach(e=>r.push({min:e.min,h:e.hScore,a:e.aScore}));
    return r;
  },[events]);
  if(pts.length<2)return <div style={{textAlign:"center",color:T.muted,fontSize:11,padding:"20px 0"}}>Sin datos de marcador</div>;
  const maxG=Math.max(...pts.map(p=>Math.max(p.h,p.a)),5);
  const maxM=Math.max(...pts.map(p=>p.min),60);
  const W=320,H=90,PL=24,PR=8,PT=8,PB=16;
  const iW=W-PL-PR,iH=H-PT-PB;
  const xS=p=>(p.min/maxM)*iW+PL;
  const yS=v=>H-PB-((v/maxG)*iH);
  const poly=arr=>arr.map(p=>`${xS(p)},${yS(p)}`).join(" ");
  const half=events.find(e=>e.type==="half_time");
  return(
    <svg viewBox={`0 0 ${W} ${H}`} width="100%">
      {[0,Math.round(maxG/2),maxG].map(v=>(
        <g key={v}>
          <line x1={PL} y1={yS(v)} x2={W-PR} y2={yS(v)} stroke={T.border} strokeWidth=".5"/>
          <text x={PL-3} y={yS(v)+3} textAnchor="end" style={{fontSize:7,fill:T.muted}}>{v}</text>
        </g>
      ))}
      {half&&<line x1={xS({min:half.min})} y1={PT} x2={xS({min:half.min})} y2={H-PB} stroke="#8b5cf6" strokeWidth="1" strokeDasharray="3,2"/>}
      <polyline points={poly(pts)} fill="none" stroke={homeColor} strokeWidth="2" strokeLinejoin="round"/>
      <polyline points={poly(pts.map(p=>({...p,h:p.a})))} fill="none" stroke={awayColor} strokeWidth="2" strokeLinejoin="round"/>
      {pts.map((p,i)=>i>0&&p.h!==pts[i-1].h&&(
        <circle key={i+"h"} cx={xS(p)} cy={yS(p.h)} r="3" fill={homeColor}/>
      ))}
      {pts.map((p,i)=>i>0&&p.a!==pts[i-1].a&&(
        <circle key={i+"a"} cx={xS(p)} cy={yS(p.a)} r="3" fill={awayColor}/>
      ))}
    </svg>
  );
}

function EventCard({ev,homeColor,awayColor,homeName,awayName,onDelete}){
  const [exp,setExp]=useState(false);
  const t=EV_TYPES[ev.type]||{label:ev.type,icon:"•",color:T.muted};
  const tc=ev.team==="home"?homeColor:awayColor;
  const tn=ev.team==="home"?homeName:awayName;
  return(
    <div style={{background:T.card,borderRadius:11,border:`1px solid ${T.border}`,
      borderLeft:`3px solid ${tc}`,padding:"9px 11px",marginBottom:6}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:16,flexShrink:0}}>{t.icon}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
            <span style={{fontSize:10,fontWeight:700,color:tc}}>{tn}</span>
            <Badge label={t.label} color={t.color}/>
            {ev.quickMode&&!ev.completed&&<Badge label="⚡" color={T.yellow}/>}
            {ev.completed&&<span style={{fontSize:11}}>✅</span>}
          </div>
          <div style={{fontSize:10,color:T.muted,marginTop:1}}>
            {ev.min}' {ev.zone&&`· ${ZONES[ev.zone]?.label}`} {ev.shooter&&`· ${ev.shooter.name} #${ev.shooter.number}`}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          {ev.type==="goal"&&<span style={{fontSize:12,fontWeight:900,color:T.green}}>{ev.hScore}–{ev.aScore}</span>}
          {onDelete&&(
            <button onClick={()=>onDelete(ev.id)}
              style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",
                color:T.red,borderRadius:7,padding:"3px 7px",fontSize:11,cursor:"pointer",fontWeight:700}}>
              ✕
            </button>
          )}
          <button onClick={()=>setExp(!exp)}
            style={{background:"transparent",border:"none",color:T.muted,fontSize:11,cursor:"pointer",padding:2}}>
            {exp?"▲":"▼"}
          </button>
        </div>
      </div>
      {exp&&(
        <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${T.border}`,display:"flex",flexWrap:"wrap",gap:5}}>
          {ev.goalkeeper&&<Badge label={`🧤 ${ev.goalkeeper.name} #${ev.goalkeeper.number}`} color="#60a5fa"/>}
          {ev.sanctioned&&<Badge label={`⚠️ ${ev.sanctioned.name} #${ev.sanctioned.number}`} color={T.orange}/>}
          {ev.distance&&<Badge label={`📏 ${DISTANCES.find(d=>d.k===ev.distance)?.l||ev.distance}`} color={T.muted}/>}
          {ev.situation&&ev.situation!=="igualdad"&&<Badge label={SITUATIONS.find(s=>s.k===ev.situation)?.l||ev.situation} color={T.muted}/>}
          {ev.throwType&&<Badge label={THROW_TYPES.find(t=>t.k===ev.throwType)?.l||ev.throwType} color={T.yellow}/>}
          {ev.quadrant!=null&&<Badge label={`Cuad: ${QUADRANTS[ev.quadrant]?.label}`} color={T.muted}/>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  GOAL MAP (9 cuadrantes del arco)
// ═══════════════════════════════════════════════════
function GoalMap({byQ,mode}){
  const modeColor=mode==="goals"?T.green:mode==="saved"?"#60a5fa":mode==="miss"?T.red:T.yellow;
  const maxV=Math.max(...byQ.map(q=>mode==="goals"?q.goals:mode==="saved"?q.saved:mode==="miss"?q.miss:q.total),1);
  const val=q=>mode==="goals"?q.goals:mode==="saved"?q.saved:mode==="miss"?q.miss:q.total;
  const rows=[[0,1,2],[3,4,5],[6,7,8]];
  return(
    <div>
      {rows.map((row,ri)=>(
        <div key={ri} style={{display:"flex",gap:5,marginBottom:ri<2?5:0}}>
          {row.map(qi=>{
            const q=byQ[qi];
            const v=val(q);
            const pct=maxV?v/maxV:0;
            return(
              <div key={qi} style={{flex:1,borderRadius:9,border:`1px solid ${v>0?modeColor+"44":T.border}`,
                background:v>0?modeColor+Math.round(pct*0.5*255).toString(16).padStart(2,"0"):"rgba(0,0,0,.2)",
                padding:"8px 4px",textAlign:"center",minHeight:50,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
                <span style={{fontSize:16,fontWeight:800,color:v>0?modeColor:T.muted,lineHeight:1}}>{v}</span>
                <span style={{fontSize:8,color:T.muted}}>{QUADRANTS[qi].icon}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  STATS COURT (heatmap cancha)
// ═══════════════════════════════════════════════════
function StatsCourt({shots}){
  const [selZone,setSelZone]=useState(null);
  const [mode,setMode]=useState("goals");
  const [hov,setHov]=useState(null);
  const [detailTab,setDetailTab]=useState("goals");
  const zoneStats=useMemo(()=>
    Object.keys(ZONES).reduce((a,k)=>{
      const zs=shots.filter(s=>s.zone===k);
      a[k]={goals:zs.filter(s=>s.result==="goal").length,
             saved:zs.filter(s=>s.result==="saved").length,
             miss:zs.filter(s=>s.result==="miss").length,
             total:zs.length,shots:zs};
      return a;
    },{}),[shots]);
  const getVal=k=>mode==="goals"?zoneStats[k]?.goals:mode==="saved"?zoneStats[k]?.saved:mode==="miss"?zoneStats[k]?.miss:zoneStats[k]?.total;
  const maxVal=Math.max(...Object.keys(ZONES).map(k=>getVal(k)),1);
  const modeColor=mode==="goals"?T.green:mode==="saved"?"#60a5fa":mode==="miss"?T.red:T.yellow;
  const heatFill=k=>{
    const v=getVal(k);if(!v)return "rgba(255,255,255,0.04)";
    const a=Math.min(0.75,0.18+v/maxVal*0.57);
    if(mode==="goals")return `rgba(34,197,94,${a})`;
    if(mode==="saved")return `rgba(96,165,250,${a})`;
    if(mode==="miss") return `rgba(239,68,68,${a})`;
    return `rgba(245,158,11,${a})`;
  };
  const dtShots=selZone?zoneStats[selZone].shots.filter(s=>s.result===(detailTab==="goals"?"goal":detailTab==="saved"?"saved":"miss")):[];
  return(
    <div>
      <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
        {[{k:"goals",l:"⚽ Goles",c:T.green},{k:"saved",l:"🧤 Atajados",c:"#60a5fa"},{k:"miss",l:"❌ Errados",c:T.red},{k:"total",l:"📊 Total",c:T.yellow}].map(m=>(
          <button key={m.k} onClick={()=>setMode(m.k)}
            style={{flex:1,minWidth:60,background:mode===m.k?m.c+"28":T.card,color:mode===m.k?m.c:T.muted,
              border:`1px solid ${mode===m.k?m.c:T.border}`,borderRadius:9,padding:"7px 2px",fontSize:10,fontWeight:700,cursor:"pointer"}}>
            {m.l}
          </button>
        ))}
      </div>
      <div style={{background:"#0f2a5a",borderRadius:14,padding:"10px 6px",border:"1px solid #1e407a",marginBottom:10}}>
        <svg viewBox="-8 -28 296 190" width="100%" preserveAspectRatio="xMidYMid meet" style={{display:"block",maxWidth:360,margin:"0 auto"}}>
          <rect x="-8" y="-28" width="296" height="190" fill="#0f2a5a" rx="8"/>
          <rect x="0" y="0" width="280" height="155" fill="#2196c4" rx="4"/>
          <path d="M 56 0 A 84 84 0 0 1 224 0 Z" fill="#1565a0"/>
          {Object.entries(ZONES).map(([key,zone])=>(
            <path key={key} d={zone.path}
              fill={selZone===key?zone.color+"55":heatFill(key)}
              stroke={selZone===key?"#fff":hov===key?"rgba(255,255,255,.55)":"rgba(255,255,255,.15)"}
              strokeWidth={selZone===key?2.5:hov===key?1.5:1}
              style={{cursor:"pointer",transition:"all .15s"}}
              onMouseEnter={()=>setHov(key)} onMouseLeave={()=>setHov(null)}
              onClick={()=>{setSelZone(selZone===key?null:key);setDetailTab("goals");}}
            />
          ))}
          {Object.entries(ZONES).map(([key,zone])=>{
            const v=getVal(key)||0;
            return(
              <g key={key+"t"}>
                <text x={zone.lx} y={zone.ly-6} textAnchor="middle"
                  style={{fontSize:9,fill:"rgba(255,255,255,.7)",fontWeight:700,pointerEvents:"none"}}>
                  {zone.short}
                </text>
                {v>0&&<text x={zone.lx} y={zone.ly+8} textAnchor="middle"
                  style={{fontSize:11,fill:modeColor,fontWeight:900,pointerEvents:"none"}}>
                  {v}
                </text>}
              </g>
            );
          })}
        </svg>
      </div>
      {selZone&&(
        <Card style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:700,color:T.text}}>{ZONES[selZone].label}</div>
            <div style={{display:"flex",gap:5}}>
              {[{k:"goals",l:"⚽",v:zoneStats[selZone].goals,c:T.green},{k:"saved",l:"🧤",v:zoneStats[selZone].saved,c:"#60a5fa"},{k:"miss",l:"❌",v:zoneStats[selZone].miss,c:T.red}].map(x=>(
                <button key={x.k} onClick={()=>setDetailTab(x.k)}
                  style={{background:detailTab===x.k?x.c+"22":T.card2,color:detailTab===x.k?x.c:T.muted,
                    border:`1px solid ${detailTab===x.k?x.c:T.border}`,borderRadius:8,padding:"5px 9px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                  {x.l} {x.v}
                </button>
              ))}
            </div>
          </div>
          {dtShots.length===0
            ?<div style={{textAlign:"center",color:T.muted,fontSize:11,padding:"10px 0"}}>Sin tiros en esta categoría</div>
            :dtShots.map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontSize:11,fontWeight:700,color:modeColor,width:20,textAlign:"center"}}>
                  {s.quadrant!=null?QUADRANTS[s.quadrant]?.icon:"?"}
                </span>
                <span style={{fontSize:11,color:T.text,flex:1}}>#{s.number} {s.player}</span>
              </div>
            ))
          }
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  MODAL BASE
// ═══════════════════════════════════════════════════
function Modal({children,onClose,title}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",backdropFilter:"blur(6px)",
      display:"flex",flexDirection:"column",justifyContent:"flex-end",zIndex:200}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:T.card,borderRadius:"20px 20px 0 0",padding:"16px 16px 24px",
        border:`1px solid ${T.border}`,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{width:40,height:4,background:T.border,borderRadius:2,margin:"0 auto 14px"}}/>
        {title&&<div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:14}}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  AI ANALYSIS COMPONENT (reutilizable)
// ═══════════════════════════════════════════════════
function AIAnalysis({events,homeName,awayName,hScore,aScore,compact=false}){
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);
  const [focus,setFocus]=useState("complete");

  const focusOptions=[
    {k:"complete", l:"📋 Completo"},
    {k:"attack",   l:"⚔️ Ataque"},
    {k:"defense",  l:"🛡️ Defensa"},
    {k:"goalkeeper",l:"🧤 Arquero"},
  ];

  const analyze=async()=>{
    setLoading(true);setError(null);setResult(null);
    const focusMap={
      complete:"Realizá un análisis táctico completo del partido",
      attack:"Analizá el rendimiento ofensivo de ambos equipos en detalle",
      defense:"Analizá el rendimiento defensivo y disciplinario de ambos equipos",
      goalkeeper:"Analizá el desempeño del arquero y las situaciones de gol",
    };
    const goals=events.filter(e=>e.type==="goal").length;
    const excl=events.filter(e=>e.type==="exclusion").length;
    const tm=events.filter(e=>e.type==="timeout").length;
    const scorers={};
    events.filter(e=>e.type==="goal"&&e.shooter).forEach(e=>{
      const k=e.shooter.name;
      if(!scorers[k])scorers[k]={name:k,goals:0,team:e.team};
      scorers[k].goals++;
    });
    const scorerStr=Object.values(scorers).sort((a,b)=>b.goals-a.goals)
      .map(s=>`${s.name} ${s.goals}g (${s.team==="home"?homeName:awayName})`).join(", ");
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:900,
          system:`Sos un analista táctico de handball experto. Respondé en español de forma concisa y profesional.
Usá estos emojis como encabezados de sección: 📋 RESUMEN · ⚔️ ATAQUE · 🛡️ DEFENSA · ⭐ JUGADOR DESTACADO · 📈 TENDENCIAS · 🎯 RECOMENDACIONES
Máximo 350 palabras. Terminología técnica de handball.`,
          messages:[{role:"user",content:`${focusMap[focus]}.
Partido: ${homeName} ${hScore} - ${aScore} ${awayName}
Total goles: ${goals} | Exclusiones: ${excl} | Tiempos muertos: ${tm}
Goleadores: ${scorerStr||"Sin datos"}
Eventos totales: ${events.length}`}],
        }),
      });
      const data=await res.json();
      const text=data.content?.map(b=>b.text||"").join("")||"";
      if(!text)throw new Error();
      setResult(text);
    }catch{setError("Error al conectar con IA. Intentá de nuevo.");}
    finally{setLoading(false);}
  };

  return(
    <div>
      {!compact&&(
        <div style={{background:"rgba(59,130,246,.06)",border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 12px",marginBottom:12}}>
          <div style={{fontSize:10,color:T.muted}}>⚠️ El análisis de IA es orientativo y puede contener imprecisiones. Usalo como apoyo, no como fuente única.</div>
        </div>
      )}
      <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
        {focusOptions.map(f=>(
          <button key={f.k} onClick={()=>setFocus(f.k)}
            style={{flex:1,minWidth:"40%",background:focus===f.k?T.accent+"22":T.card2,color:focus===f.k?T.accent:T.muted,
              border:`1px solid ${focus===f.k?T.accent:T.border}`,borderRadius:9,padding:"8px 4px",fontSize:10,fontWeight:700,cursor:"pointer"}}>
            {f.l}
          </button>
        ))}
      </div>
      <Btn onClick={analyze} disabled={loading} color={T.accent} style={{marginBottom:12}}>
        {loading?"⏳ Analizando...":"🤖 Analizar partido con IA"}
      </Btn>
      {error&&<div style={{background:"rgba(239,68,68,.1)",border:`1px solid ${T.red}44`,borderRadius:10,padding:"10px 12px",fontSize:12,color:T.red,marginBottom:10}}>{error}</div>}
      {result&&(
        <div style={{background:T.card2,borderRadius:12,padding:"13px",border:`1px solid ${T.border}`,fontSize:12,color:T.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>
          {result}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  EVOLUTION PAGE
// ═══════════════════════════════════════════════════
function EvolutionPage({goBack,match}){
  const matchData=match||{home:"GEI",away:"Rival",hs:0,as:0,date:"",events:[]};
  const homeColor=matchData.hc||T.accent;
  const awayColor=matchData.ac||T.muted;
  const [filter,setFilter]=useState("all");
  const [subTab,setSubTab]=useState("chart");
  const events=matchData.events||[];
  const filtered=filter==="all"?events:events.filter(e=>e.type===filter||e.type==="half_time");
  const stats={
    homeGoals:events.filter(e=>e.type==="goal"&&e.team==="home").length,
    awayGoals:events.filter(e=>e.type==="goal"&&e.team==="away").length,
    homeExcl:events.filter(e=>e.type==="exclusion"&&e.team==="home").length,
    awayExcl:events.filter(e=>e.type==="exclusion"&&e.team==="away").length,
    homeTm:events.filter(e=>e.type==="timeout"&&e.team==="home").length,
    awayTm:events.filter(e=>e.type==="timeout"&&e.team==="away").length,
  };
  const scorerMap={};
  events.filter(e=>e.type==="goal"&&e.shooter).forEach(e=>{
    const k=e.shooter.name;
    if(!scorerMap[k])scorerMap[k]={name:k,number:e.shooter.number,goals:0,team:e.team};
    scorerMap[k].goals++;
  });
  const scorers=Object.values(scorerMap).sort((a,b)=>b.goals-a.goals).slice(0,5);
  return(
    <div>
      <button onClick={goBack} style={{background:"transparent",border:"none",color:T.muted,fontSize:13,cursor:"pointer",marginBottom:14,padding:0,display:"flex",alignItems:"center",gap:6}}>
        ← Volver
      </button>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:10,color:T.accent,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>Evolución del Partido</div>
        <div style={{fontSize:20,fontWeight:800,color:T.text}}>{matchData.home} vs {matchData.away}</div>
        <div style={{fontSize:11,color:T.muted}}>{matchData.date} {matchData.competition&&`· ${matchData.competition}`}</div>
      </div>
      {/* Final score */}
      <div style={{background:`linear-gradient(135deg,${homeColor}20,${awayColor}20)`,borderRadius:14,padding:"14px 16px",border:`1px solid ${T.border}`,marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{textAlign:"center",flex:1}}>
            <div style={{fontSize:11,fontWeight:800,color:T.text,marginBottom:4}}>{matchData.home}</div>
            <div style={{fontSize:48,fontWeight:900,color:homeColor,lineHeight:1}}>{matchData.hs}</div>
          </div>
          <div style={{textAlign:"center",padding:"0 12px"}}>
            <div style={{fontSize:10,color:T.muted,letterSpacing:2}}>FINAL</div>
            <div style={{fontSize:16,color:T.muted}}>–</div>
          </div>
          <div style={{textAlign:"center",flex:1}}>
            <div style={{fontSize:11,fontWeight:800,color:T.text,marginBottom:4}}>{matchData.away}</div>
            <div style={{fontSize:48,fontWeight:900,color:awayColor,lineHeight:1}}>{matchData.as}</div>
          </div>
        </div>
      </div>
      {/* Sub tabs */}
      <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
        {[{k:"chart",l:"📈 Gráfico"},{k:"stats",l:"📊 Stats"},{k:"scorers",l:"⚽ Goleadores"},{k:"timeline",l:"📋 Timeline"},{k:"ai",l:"🤖 IA"}].map(t=>(
          <button key={t.k} onClick={()=>setSubTab(t.k)}
            style={{flex:1,minWidth:"30%",background:subTab===t.k?T.accent:T.card,color:subTab===t.k?"#fff":T.muted,
              border:`1px solid ${subTab===t.k?T.accent:T.border}`,borderRadius:9,padding:"8px 3px",fontSize:10,fontWeight:700,cursor:"pointer"}}>
            {t.l}
          </button>
        ))}
      </div>
      {subTab==="chart"&&(
        <Card>
          <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:10}}>📈 Evolución del marcador</div>
          <ScoreChart events={events} homeColor={homeColor} awayColor={awayColor}/>
          <div style={{display:"flex",justifyContent:"center",gap:14,marginTop:8}}>
            {[{c:homeColor,l:matchData.home},{c:awayColor,l:matchData.away}].map(x=>(
              <div key={x.l} style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:14,height:3,background:x.c,borderRadius:2}}/>
                <span style={{fontSize:10,color:T.muted}}>{x.l}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
      {subTab==="stats"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[
            {l:"Goles",h:stats.homeGoals,a:stats.awayGoals,c:T.green},
            {l:"Exclusiones",h:stats.homeExcl,a:stats.awayExcl,c:T.orange},
            {l:"T. Muertos",h:stats.homeTm,a:stats.awayTm,c:T.yellow},
          ].map(s=>{
            const tot=s.h+s.a||1;
            return(
              <Card key={s.l}>
                <div style={{fontSize:11,color:T.muted,marginBottom:6,textAlign:"center"}}>{s.l}</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:16,fontWeight:800,color:s.c,width:24,textAlign:"right"}}>{s.h}</span>
                  <div style={{flex:1,height:6,background:T.border,borderRadius:3,overflow:"hidden",display:"flex"}}>
                    <div style={{width:`${s.h/tot*100}%`,background:homeColor,borderRadius:"3px 0 0 3px"}}/>
                    <div style={{width:`${s.a/tot*100}%`,background:awayColor,borderRadius:"0 3px 3px 0"}}/>
                  </div>
                  <span style={{fontSize:16,fontWeight:800,color:s.c,width:24}}>{s.a}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                  <span style={{fontSize:9,color:T.muted}}>{matchData.home}</span>
                  <span style={{fontSize:9,color:T.muted}}>{matchData.away}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {subTab==="scorers"&&(
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {scorers.length===0
            ?<div style={{textAlign:"center",color:T.muted,padding:"20px",fontSize:12}}>Sin goleadores registrados</div>
            :scorers.map((s,i)=>(
              <Card key={s.name}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:16}}>{"🥇🥈🥉"[i]||"🏅"}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{s.name} <span style={{color:T.muted,fontSize:11}}>#{s.number}</span></div>
                    <div style={{fontSize:10,color:T.muted}}>{s.team==="home"?matchData.home:matchData.away}</div>
                  </div>
                  <div style={{fontSize:24,fontWeight:900,color:T.green}}>{s.goals}</div>
                </div>
              </Card>
            ))
          }
        </div>
      )}
      {subTab==="timeline"&&(
        <div>
          <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
            {[{k:"all",l:"Todo"},{k:"goal",l:"⚽ Goles"},{k:"saved",l:"🧤 Ataj."},{k:"miss",l:"❌ Err."},{k:"exclusion",l:"⏱ Excl."}].map(f=>(
              <button key={f.k} onClick={()=>setFilter(f.k)}
                style={{flex:1,background:filter===f.k?T.accent:T.card,color:filter===f.k?"#fff":T.muted,
                  border:`1px solid ${filter===f.k?T.accent:T.border}`,borderRadius:8,padding:"6px 4px",fontSize:10,fontWeight:700,cursor:"pointer"}}>
                {f.l}
              </button>
            ))}
          </div>
          {/* 2do tiempo primero, luego 1ro — más reciente arriba */}
          {(()=>{
            const halfTime=events.find(e=>e.type==="half_time");
            const htMin=halfTime?.min||30;
            const secondHalf=[...filtered].filter(e=>e.min>htMin||e.type==="half_time").reverse();
            const firstHalf=[...filtered].filter(e=>e.min<=htMin&&e.type!=="half_time").reverse();
            return(
              <div>
                {secondHalf.length>0&&(
                  <div>
                    <div style={{fontSize:9,color:T.purple,letterSpacing:2,fontWeight:700,marginBottom:6,marginTop:2}}>🔔 2° TIEMPO</div>
                    {secondHalf.map(ev=>(
                      <EventCard key={ev.id} ev={ev} homeColor={homeColor} awayColor={awayColor} homeName={matchData.home} awayName={matchData.away}/>
                    ))}
                  </div>
                )}
                {firstHalf.length>0&&(
                  <div>
                    <div style={{fontSize:9,color:T.purple,letterSpacing:2,fontWeight:700,marginBottom:6,marginTop:8}}>🔔 1° TIEMPO</div>
                    {firstHalf.map(ev=>(
                      <EventCard key={ev.id} ev={ev} homeColor={homeColor} awayColor={awayColor} homeName={matchData.home} awayName={matchData.away}/>
                    ))}
                  </div>
                )}
                {filtered.length===0&&<div style={{textAlign:"center",color:T.muted,padding:"20px",fontSize:12}}>Sin eventos</div>}
              </div>
            );
          })()}
        </div>
      )}
      {subTab==="ai"&&(
        <AIAnalysis events={events} homeName={matchData.home} awayName={matchData.away} hScore={matchData.hs} aScore={matchData.as}/>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  TEAMS PAGE
// ═══════════════════════════════════════════════════
function TeamsPage({teams,setTeams,onTeamUpdated}){
  const [selTeam,setSelTeam]=useState(null);
  const [showAddTeam,setShowAddTeam]=useState(false);
  const [showAddPlayer,setShowAddPlayer]=useState(false);
  const [newTeam,setNewTeam]=useState({name:"",color:"#3b82f6"});
  const [newPlayer,setNewPlayer]=useState({name:"",number:"",position:"Campo"});
  const [saving,setSaving]=useState(false);

  const addTeam=async()=>{
    if(!newTeam.name.trim())return;
    setSaving(true);
    try{
      const {data}=await supabase.from("teams").insert({name:newTeam.name.trim(),color:newTeam.color}).select().single();
      if(data){
        const t={...data,players:[]};
        setTeams(prev=>[...prev,t]);
        setSelTeam(t);
        setShowAddTeam(false);
        setNewTeam({name:"",color:"#3b82f6"});
      }
    }catch(e){console.warn(e);}
    setSaving(false);
  };

  const addPlayer=async()=>{
    if(!newPlayer.name.trim()||!newPlayer.number)return;
    setSaving(true);
    try{
      const {data}=await supabase.from("players").insert({
        team_id:selTeam.id,name:newPlayer.name.trim(),
        number:parseInt(newPlayer.number),position:newPlayer.position
      }).select().single();
      if(data){
        const updP={...selTeam,players:[...(selTeam.players||[]),data]};
        setTeams(prev=>prev.map(t=>t.id===selTeam.id?updP:t));
        setSelTeam(updP);
        if(onTeamUpdated)onTeamUpdated(updP);
        setShowAddPlayer(false);
        setNewPlayer({name:"",number:"",position:"Campo"});
      }
    }catch(e){console.warn(e);}
    setSaving(false);
  };

  const deletePlayer=async(playerId)=>{
    try{
      await supabase.from("players").delete().eq("id",playerId);
      const updP={...selTeam,players:selTeam.players.filter(p=>p.id!==playerId)};
      setTeams(prev=>prev.map(t=>t.id===selTeam.id?updP:t));
      setSelTeam(updP);
      if(onTeamUpdated)onTeamUpdated(updP);
    }catch(e){console.warn(e);}
  };

  const COLORS=["#ef4444","#3b82f6","#22c55e","#f59e0b","#8b5cf6","#06b6d4","#f97316","#ec4899"];

  if(selTeam){
    return(
      <div>
        <button onClick={()=>setSelTeam(null)} style={{background:"transparent",border:"none",color:T.muted,fontSize:13,cursor:"pointer",marginBottom:14,padding:0,display:"flex",alignItems:"center",gap:6}}>
          ← Equipos
        </button>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{width:16,height:16,borderRadius:"50%",background:selTeam.color,flexShrink:0}}/>
          <div style={{fontSize:20,fontWeight:800,color:T.text}}>{selTeam.name}</div>
          <Badge label={`${selTeam.players?.length||0} jugadores`} color={selTeam.color}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
          {(selTeam.players||[]).sort((a,b)=>a.number-b.number).map(p=>(
            <div key={p.id} style={{background:T.card,borderRadius:11,border:`1px solid ${T.border}`,padding:"10px 13px",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:selTeam.color+"22",border:`2px solid ${selTeam.color}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:11,fontWeight:800,color:selTeam.color}}>#{p.number}</span>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:T.text}}>{p.name}</div>
                <div style={{fontSize:10,color:T.muted}}>{p.position}</div>
              </div>
              <button onClick={()=>deletePlayer(p.id)}
                style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",color:T.red,borderRadius:8,padding:"4px 8px",fontSize:11,cursor:"pointer"}}>
                ✕
              </button>
            </div>
          ))}
        </div>
        <Btn onClick={()=>setShowAddPlayer(true)} color={selTeam.color}>+ Agregar jugador</Btn>

        {showAddPlayer&&(
          <Modal title="➕ Nuevo Jugador" onClose={()=>setShowAddPlayer(false)}>
            <div style={{marginBottom:10}}>
              <SectionLabel>NOMBRE</SectionLabel>
              <input value={newPlayer.name} onChange={e=>setNewPlayer(f=>({...f,name:e.target.value}))}
                placeholder="Ej: García"
                style={{width:"100%",background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 14px",color:T.text,fontSize:14,boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:10}}>
              <SectionLabel>NÚMERO</SectionLabel>
              <input type="number" value={newPlayer.number} onChange={e=>setNewPlayer(f=>({...f,number:e.target.value}))}
                placeholder="Ej: 7"
                style={{width:"100%",background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 14px",color:T.text,fontSize:14,boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:16}}>
              <SectionLabel>POSICIÓN</SectionLabel>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {POSITIONS.map(pos=>(
                  <button key={pos} onClick={()=>setNewPlayer(f=>({...f,position:pos}))}
                    style={{background:newPlayer.position===pos?selTeam.color+"22":T.card2,color:newPlayer.position===pos?selTeam.color:T.muted,
                      border:`1px solid ${newPlayer.position===pos?selTeam.color:T.border}`,borderRadius:9,padding:"6px 10px",fontSize:10,fontWeight:700,cursor:"pointer"}}>
                    {pos}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={()=>setShowAddPlayer(false)} outline color={T.muted} style={{flex:1}}>Cancelar</Btn>
              <Btn onClick={addPlayer} disabled={saving||!newPlayer.name||!newPlayer.number} color={selTeam.color} style={{flex:2}}>
                {saving?"Guardando...":"✓ Agregar"}
              </Btn>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return(
    <div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:10,color:T.accent,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>Gestión</div>
        <div style={{fontSize:22,fontWeight:800,color:T.text}}>Equipos</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
        {teams.map(t=>(
          <button key={t.id} onClick={()=>setSelTeam(t)}
            style={{background:T.card,borderRadius:14,border:`1px solid ${t.color}44`,padding:"13px 14px",
              display:"flex",alignItems:"center",gap:12,cursor:"pointer",textAlign:"left",width:"100%"}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:t.color+"22",border:`2px solid ${t.color}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{fontSize:14,fontWeight:800,color:t.color}}>{t.name[0]}</span>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:T.text}}>{t.name}</div>
              <div style={{fontSize:11,color:T.muted}}>{t.players?.length||0} jugadores</div>
            </div>
            <span style={{color:T.muted,fontSize:16}}>›</span>
          </button>
        ))}
        {teams.length===0&&(
          <div style={{textAlign:"center",padding:"30px",color:T.muted}}>
            <div style={{fontSize:32,marginBottom:8}}>👥</div>
            <div style={{fontSize:13}}>No hay equipos aún</div>
          </div>
        )}
      </div>
      <Btn onClick={()=>setShowAddTeam(true)} color={T.accent}>+ Nuevo equipo</Btn>

      {showAddTeam&&(
        <Modal title="🤾 Nuevo Equipo" onClose={()=>setShowAddTeam(false)}>
          <div style={{marginBottom:12}}>
            <SectionLabel>NOMBRE DEL EQUIPO</SectionLabel>
            <input value={newTeam.name} onChange={e=>setNewTeam(f=>({...f,name:e.target.value}))}
              placeholder="Ej: GEI"
              style={{width:"100%",background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 14px",color:T.text,fontSize:14,boxSizing:"border-box"}}/>
          </div>
          <div style={{marginBottom:16}}>
            <SectionLabel>COLOR</SectionLabel>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {COLORS.map(c=>(
                <button key={c} onClick={()=>setNewTeam(f=>({...f,color:c}))}
                  style={{width:36,height:36,borderRadius:"50%",background:c,border:`3px solid ${newTeam.color===c?"#fff":c}`,cursor:"pointer",flexShrink:0}}/>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={()=>setShowAddTeam(false)} outline color={T.muted} style={{flex:1}}>Cancelar</Btn>
            <Btn onClick={addTeam} disabled={saving||!newTeam.name} color={newTeam.color} style={{flex:2}}>
              {saving?"Guardando...":"✓ Crear equipo"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  STATS PAGE
// ═══════════════════════════════════════════════════
function StatsPage({liveEvents=[],matchEvents,matchTitle,onBack,completedMatches=[],homeTeamName="GEI"}){
  const sourceEvents=matchEvents||liveEvents;
  const isMatchView=!!matchEvents;
  const [dataMode,setDataMode]=useState("full");
  const [mainTab,setMainTab]=useState(isMatchView?"court":"season");
  const [goalMode,setGoalMode]=useState("goals");
  const [teamFilter,setTeamFilter]=useState("home");
  const [kpiFilter,setKpiFilter]=useState(null); // null | "goal" | "saved" | "miss" | "penal"
  const [compFilter,setCompFilter]=useState("all");
  const medals=["🥇","🥈","🥉"];

  // Stats de temporada — todos los partidos cerrados
  const allSeasonEvents=useMemo(()=>{
    let evs=[];
    completedMatches
      .filter(m=>compFilter==="all"||m.competition===compFilter)
      .forEach(m=>(m.events||[]).forEach(e=>evs.push({...e,matchHome:m.home,matchAway:m.away})));
    return evs;
  },[completedMatches,compFilter]);

  const seasonShots=useMemo(()=>allSeasonEvents
    .filter(e=>["goal","miss","saved"].includes(e.type)&&e.completed&&e.zone!=null&&e.team===teamFilter)
    .map(e=>({
      zone:e.zone,result:e.type==="goal"?"goal":e.type==="saved"?"saved":"miss",
      player:e.shooter?.name||"?",number:e.shooter?.number||0,
      quadrant:e.quadrant!=null?parseInt(e.quadrant):null,
      goalkeeper:e.goalkeeper?.name||null,goalkeeperNumber:e.goalkeeper?.number||null,
      distance:e.distance||null,situation:e.situation||null,throwType:e.throwType||null,
      team:e.team,
    })),[allSeasonEvents,teamFilter]);

  const seasonTotals=useMemo(()=>{
    const g=allSeasonEvents.filter(e=>e.type==="goal"&&e.team===teamFilter).length;
    const t=allSeasonEvents.filter(e=>["goal","miss","saved"].includes(e.type)&&e.team===teamFilter).length;
    return{goals:g,total:t,pct:t?Math.round(g/t*100):0};
  },[allSeasonEvents,teamFilter]);

  // Filtro de equipo — aplica tanto en partido individual como en temporada
  const filteredSource=useMemo(()=>{
    return sourceEvents.filter(e=>e.team===teamFilter);
  },[sourceEvents,teamFilter]);

  // Extraer nombres de home/away del título
  const matchParts=matchTitle?.match(/^(.+?)\s+\d+[–-]\d+\s+(.+)$/);
  const homeNameInMatch=matchParts?.[1]||homeTeamName;
  const awayNameInMatch=matchParts?.[2]||"Rival";

  const fullShots=useMemo(()=>filteredSource.filter(e=>["goal","miss","saved"].includes(e.type)&&e.completed&&e.zone!=null).map(e=>({
    zone:e.zone,result:e.type==="goal"?"goal":e.type==="saved"?"saved":"miss",
    player:e.shooter?.name||"?",number:e.shooter?.number||0,
    quadrant:e.quadrant!=null?parseInt(e.quadrant):null,
    goalkeeper:e.goalkeeper?.name||null,goalkeeperNumber:e.goalkeeper?.number||null,
    distance:e.distance||null,situation:e.situation||null,throwType:e.throwType||null,
    team:e.team,
  })),[filteredSource]);

  const quickShots=useMemo(()=>filteredSource.filter(e=>["goal","miss","saved"].includes(e.type)&&(!e.completed||e.quickMode)).map(e=>({
    zone:e.zone||null,
    result:e.type==="goal"?"goal":e.type==="saved"?"saved":"miss",
    player:e.shooter?.name||"?",number:e.shooter?.number||0,
    quadrant:e.quadrant!=null?parseInt(e.quadrant):null,
    team:e.team,situation:e.situation||null,
    goalkeeper:e.goalkeeper?.name||null,goalkeeperNumber:e.goalkeeper?.number||null,
    attackSide:e.attackSide||null,
    distance:e.distance||null,throwType:e.throwType||null,
  })),[filteredSource]);



  const shots=dataMode==="full"?fullShots:quickShots;

  // Stats por arquero
  const goalkeeperMap=useMemo(()=>{
    const m={};
    fullShots.forEach(s=>{
      if(!s.goalkeeper)return;
      const k=s.goalkeeper;
      if(!m[k])m[k]={name:k,number:s.goalkeeperNumber,saved:0,goals:0,miss:0,total:0,
        byQ:Array.from({length:9},()=>({saved:0,goals:0,miss:0,total:0})),
        byDist:{},byThrow:{}};
      m[k].total++;
      if(s.result==="saved")m[k].saved++;
      else if(s.result==="goal")m[k].goals++;
      else m[k].miss++;
      // By quadrant
      if(s.quadrant!=null){
        m[k].byQ[s.quadrant].total++;
        if(s.result==="saved")m[k].byQ[s.quadrant].saved++;
        else if(s.result==="goal")m[k].byQ[s.quadrant].goals++;
        else m[k].byQ[s.quadrant].miss++;
      }
      // By distance
      if(s.distance){
        if(!m[k].byDist[s.distance])m[k].byDist[s.distance]={saved:0,goals:0,miss:0,total:0};
        m[k].byDist[s.distance].total++;
        if(s.result==="saved")m[k].byDist[s.distance].saved++;
        else if(s.result==="goal")m[k].byDist[s.distance].goals++;
        else m[k].byDist[s.distance].miss++;
      }
    });
    return Object.values(m).sort((a,b)=>b.saved-a.saved);
  },[fullShots]);

  // Arquero rival — shots del equipo contrario al seleccionado
  const rivalGKMap=useMemo(()=>{
    const oppositeTeam=teamFilter==="home"?"away":"home";
    const rivalShots=sourceEvents.filter(e=>
      ["goal","miss","saved"].includes(e.type)&&e.team===oppositeTeam&&e.completed&&e.goalkeeper
    );
    const m={};
    rivalShots.forEach(s=>{
      const k=s.goalkeeper?.name||"?";
      if(!m[k])m[k]={name:k,number:s.goalkeeper?.number||0,saved:0,goals:0,miss:0,total:0,
        byQ:Array.from({length:9},()=>({saved:0,goals:0,miss:0,total:0}))};
      m[k].total++;
      if(s.type==="saved")m[k].saved++;
      else if(s.type==="goal")m[k].goals++;
      else m[k].miss++;
      if(s.quadrant!=null){
        const qi=parseInt(s.quadrant);
        if(m[k].byQ[qi]){
          m[k].byQ[qi].total++;
          if(s.type==="saved")m[k].byQ[qi].saved++;
          else if(s.type==="goal")m[k].byQ[qi].goals++;
          else m[k].byQ[qi].miss++;
        }
      }
    });
    // Quick mode rival GK (no name but count)
    const quickRival=sourceEvents.filter(e=>
      ["goal","miss","saved"].includes(e.type)&&e.team===oppositeTeam&&(!e.completed||e.quickMode)
    );
    const qTotals={saved:quickRival.filter(e=>e.type==="saved").length,
      goals:quickRival.filter(e=>e.type==="goal").length,
      miss:quickRival.filter(e=>e.type==="miss").length,
      total:quickRival.length};
    return{named:Object.values(m).sort((a,b)=>b.saved-a.saved), quick:qTotals};
  },[sourceEvents,teamFilter]);

  const totals=useMemo(()=>({
    total:shots.length,
    goals:shots.filter(s=>s.result==="goal").length,
    saved:shots.filter(s=>s.result==="saved").length,
    miss:shots.filter(s=>s.result==="miss").length,
  }),[shots]);
  const pct=totals.total?Math.round(totals.goals/totals.total*100):0;

  const byQ=useMemo(()=>Array.from({length:9},(_,i)=>{
    const qs=shots.filter(s=>s.quadrant===i);
    return{goals:qs.filter(s=>s.result==="goal").length,saved:qs.filter(s=>s.result==="saved").length,miss:qs.filter(s=>s.result==="miss").length,total:qs.length};
  }),[shots]);

  const playerMap=useMemo(()=>{
    const m={};
    shots.forEach(s=>{
      if(!m[s.player])m[s.player]={player:s.player,number:s.number,goals:0,saved:0,miss:0};
      if(s.result==="goal")m[s.player].goals++;
      else if(s.result==="saved")m[s.player].saved++;
      else m[s.player].miss++;
    });
    return Object.values(m).sort((a,b)=>b.goals-a.goals);
  },[shots]);

  return(
    <div>
      {onBack&&(
        <button onClick={onBack} style={{background:"transparent",border:"none",color:T.muted,fontSize:13,cursor:"pointer",marginBottom:12,padding:0,display:"flex",alignItems:"center",gap:6}}>
          ← Volver
        </button>
      )}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:10,color:T.accent,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>Análisis</div>
        <div style={{fontSize:20,fontWeight:800,color:T.text}}>{matchTitle||"Estadísticas"}</div>
        {matchTitle&&<div style={{fontSize:11,color:T.muted,marginTop:2}}>Partido finalizado</div>}
      </div>

      {/* Selector de perspectiva — Mi equipo / Rival */}
      {isMatchView&&(
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:4,display:"flex",gap:4,marginBottom:14}}>
          {[{k:"home",emoji:"🟢",l:homeNameInMatch||"Mi equipo",color:T.green},{k:"away",emoji:"🔴",l:awayNameInMatch||"Rival",color:T.red}].map(t=>(
            <button key={t.k} onClick={()=>setTeamFilter(t.k)}
              style={{flex:1,background:teamFilter===t.k?t.color+"22":"transparent",
                color:teamFilter===t.k?t.color:T.muted,
                border:`1.5px solid ${teamFilter===t.k?t.color:T.border}`,
                borderRadius:10,padding:"9px 4px",fontSize:11,fontWeight:800,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",gap:5,transition:"all .15s"}}>
              <span style={{fontSize:14}}>{t.emoji}</span> {t.l}
            </button>
          ))}
        </div>
      )}

      {/* Si NO es vista de partido: selector de temporada/competencia */}
      {!isMatchView&&(
        <>
          {/* Toggle de perspectiva — también en temporada */}
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:4,display:"flex",gap:4,marginBottom:12}}>
            {[{k:"home",emoji:"🟢",l:`${homeTeamName||"Mi equipo"}`,color:T.green},{k:"away",emoji:"🔴",l:"Rival",color:T.red}].map(t=>(
              <button key={t.k} onClick={()=>setTeamFilter(t.k)}
                style={{flex:1,background:teamFilter===t.k?t.color+"22":"transparent",
                  color:teamFilter===t.k?t.color:T.muted,
                  border:`1.5px solid ${teamFilter===t.k?t.color:T.border}`,
                  borderRadius:10,padding:"9px 4px",fontSize:11,fontWeight:800,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:5,transition:"all .15s"}}>
                <span style={{fontSize:14}}>{t.emoji}</span> {t.l}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
            {["all","Liga","Copa","Super 8","Amistoso"].map(c=>(
              <button key={c} onClick={()=>setCompFilter(c)}
                style={{background:compFilter===c?T.accent+"22":T.card,color:compFilter===c?T.accent:T.muted,
                  border:`1px solid ${compFilter===c?T.accent:T.border}`,borderRadius:9,padding:"6px 10px",fontSize:10,fontWeight:700,cursor:"pointer"}}>
                {c==="all"?"🏆 Todo":c}
              </button>
            ))}
          </div>
          {/* KPIs de temporada */}
          <div style={{display:"flex",gap:5,marginBottom:12}}>
            {[
              {l:"Partidos",v:completedMatches.filter(m=>compFilter==="all"||m.competition===compFilter).length,c:T.text},
              {l:"Goles",   v:seasonTotals.goals, c:T.green},
              {l:"Conv.",   v:`${seasonTotals.pct}%`,c:seasonTotals.pct>=60?T.green:T.yellow},
              {l:"Tiros",   v:seasonTotals.total, c:T.text},
            ].map(k=>(
              <div key={k.l} style={{flex:1,background:T.card,borderRadius:9,padding:"8px 3px",border:`1px solid ${T.border}`,textAlign:"center"}}>
                <div style={{fontSize:15,fontWeight:800,color:k.c,lineHeight:1}}>{k.v}</div>
                <div style={{fontSize:8,color:T.muted,marginTop:2}}>{k.l}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tab selector */}
      {!isMatchView&&(
        <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
          {[{k:"season",l:"📈 Temporada"},{k:"court",l:"🏟 Cancha"},{k:"goal",l:"🥅 Arco"},{k:"players",l:"👥 Jugadores"},{k:"keeper",l:"🧤 Arquero"},{k:"analysis",l:"📐 Análisis"}].map(t=>(
            <button key={t.k} onClick={()=>setMainTab(t.k)}
              style={{flex:1,minWidth:"28%",background:mainTab===t.k?T.accent:T.card,color:mainTab===t.k?"#fff":T.muted,
                border:`1px solid ${mainTab===t.k?T.accent:T.border}`,borderRadius:9,padding:"7px 3px",fontSize:9,fontWeight:700,cursor:"pointer"}}>
              {t.l}
            </button>
          ))}
        </div>
      )}

      {/* Season overview tab */}
      {mainTab==="season"&&!isMatchView&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* Resultados recientes */}
          <Card>
            <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:10}}>📅 Últimos partidos</div>
            {completedMatches.filter(m=>compFilter==="all"||m.competition===compFilter).slice(0,8).map(m=>{
              const isHome=m.home===homeTeamName;
              const myG=isHome?m.hs:m.as, oppG=isHome?m.as:m.hs;
              const res=myG>oppG?"W":myG===oppG?"D":"L";
              const resCol=res==="W"?T.green:res==="D"?T.yellow:T.red;
              const rival=isHome?m.away:m.home;
              return(
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:8,paddingBottom:7,marginBottom:7,borderBottom:`1px solid ${T.border}`}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:resCol+"22",border:`1.5px solid ${resCol}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:9,fontWeight:800,color:resCol}}>{res}</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:700,color:T.text}}>vs {rival}</div>
                    <div style={{fontSize:9,color:T.muted}}>{m.date} · {m.competition}</div>
                  </div>
                  <div style={{fontSize:14,fontWeight:900,color:T.text}}>{myG}–{oppG}</div>
                </div>
              );
            })}
            {completedMatches.length===0&&<div style={{textAlign:"center",color:T.muted,fontSize:11,padding:"10px 0"}}>Sin partidos aún</div>}
          </Card>
          {/* Top goleadores de temporada */}
          {seasonShots.length>0&&(()=>{
            const pm={};
            seasonShots.filter(s=>s.result==="goal").forEach(s=>{
              if(!pm[s.player])pm[s.player]={player:s.player,number:s.number,goals:0};
              pm[s.player].goals++;
            });
            const top=Object.values(pm).sort((a,b)=>b.goals-a.goals).slice(0,5);
            return(
              <Card>
                <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:10}}>⚽ Goleadores de temporada</div>
                {top.map((p,i)=>(
                  <div key={p.player} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                    <span style={{fontSize:14,width:20}}>{["🥇","🥈","🥉","4","5"][i]}</span>
                    <span style={{fontSize:11,color:T.text,flex:1}}>#{p.number} {p.player}</span>
                    <span style={{fontSize:14,fontWeight:800,color:T.green}}>{p.goals}</span>
                  </div>
                ))}
              </Card>
            );
          })()}
          {seasonShots.length===0&&(
            <div style={{textAlign:"center",padding:"20px",color:T.muted}}>
              <div style={{fontSize:28,marginBottom:6}}>📊</div>
              <div style={{fontSize:12}}>Sin estadísticas de temporada aún</div>
            </div>
          )}
        </div>
      )}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:3,display:"flex",gap:3,marginBottom:12}}>
        <button onClick={()=>setDataMode("full")}
          style={{flex:1,background:dataMode==="full"?T.accent:"transparent",color:dataMode==="full"?"#fff":T.muted,
            border:"none",borderRadius:9,padding:"8px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
          📋 Completo ({fullShots.length})
        </button>
        <button onClick={()=>setDataMode("quick")}
          style={{flex:1,background:dataMode==="quick"?T.yellow+"bb":"transparent",color:dataMode==="quick"?"#000":T.muted,
            border:"none",borderRadius:9,padding:"8px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
          ⚡ Rápido ({quickShots.length})
        </button>
      </div>
      {dataMode==="quick"&&(()=>{
        const QuickSideAnalysis=()=>{
        const teamLabel=t=>t==="home"?(matchTitle?matchTitle.split(" ")[0]:homeTeamName):"Rival";
        const teamColor=t=>t==="home"?T.accent:"#64748b";
        const [qTeam,setQTeam]=useState("home");
        const [qMode,setQMode]=useState("goals"); // "goals"|"saved"|"miss"|"total"
        const [qSelZone,setQSelZone]=useState(null);

        const qTeamShots=quickShots.filter(s=>s.team===qTeam);
        const qWithZone=qTeamShots.filter(s=>s.zone);

        const qZoneStats=Object.keys(ZONES).reduce((a,k)=>{
          const zs=qTeamShots.filter(s=>s.zone===k);
          a[k]={goals:zs.filter(s=>s.result==="goal").length,
                saved:zs.filter(s=>s.result==="saved").length,
                miss:zs.filter(s=>s.result==="miss").length,
                total:zs.length,shots:zs};
          return a;
        },{});

        const getVal=k=>qMode==="goals"?qZoneStats[k]?.goals:qMode==="saved"?qZoneStats[k]?.saved:qMode==="miss"?qZoneStats[k]?.miss:qZoneStats[k]?.total;
        const modeColor=qMode==="goals"?T.green:qMode==="saved"?"#60a5fa":qMode==="miss"?T.red:T.yellow;
        const qMaxVal=Math.max(...Object.keys(ZONES).map(k=>getVal(k)||0),1);

        const qHeatFill=k=>{
          const v=getVal(k)||0;
          if(!v)return "rgba(255,255,255,0.04)";
          const a=Math.min(0.75,0.18+v/qMaxVal*0.57);
          if(qMode==="goals")return `rgba(34,197,94,${a})`;
          if(qMode==="saved")return `rgba(96,165,250,${a})`;
          if(qMode==="miss") return `rgba(239,68,68,${a})`;
          return `rgba(245,158,11,${a})`;
        };

        const totQ={
          total:qTeamShots.length,
          goals:qTeamShots.filter(s=>s.result==="goal").length,
          saved:qTeamShots.filter(s=>s.result==="saved").length,
          miss:qTeamShots.filter(s=>s.result==="miss").length,
        };

        // Análisis por lado
        const sideData=["left","right"].map(side=>{
          const ss=qTeamShots.filter(s=>s.attackSide===side);
          return{side,label:side==="left"?"◀ Izquierda":"▶ Derecha",
            color:side==="left"?"#06b6d4":"#f59e0b",
            goals:ss.filter(s=>s.result==="goal").length,
            saved:ss.filter(s=>s.result==="saved").length,
            miss:ss.filter(s=>s.result==="miss").length,
            total:ss.length};
        }).filter(s=>s.total>0);

        if(quickShots.length===0) return(
          <div style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.3)",borderRadius:10,padding:"8px 12px",marginBottom:10,fontSize:11,color:T.yellow}}>
            ⚡ Sin datos de modo rápido registrados.
          </div>
        );

        return(
          <div>
            {/* Selector de equipo */}
            <div style={{display:"flex",gap:5,marginBottom:10}}>
              {["home","away"].map(t=>(
                <button key={t} onClick={()=>setQTeam(t)}
                  style={{flex:1,background:qTeam===t?teamColor(t)+"22":T.card,color:qTeam===t?teamColor(t):T.muted,
                    border:`1px solid ${qTeam===t?teamColor(t):T.border}`,borderRadius:9,padding:"7px 4px",fontSize:10,fontWeight:700,cursor:"pointer"}}>
                  {teamLabel(t)}
                </button>
              ))}
            </div>
            {/* KPIs */}
            <div style={{display:"flex",gap:4,marginBottom:10}}>
              {[{k:"goals",l:"⚽ Goles",v:totQ.goals,c:T.green},{k:"saved",l:"🧤 Ataj.",v:totQ.saved,c:"#60a5fa"},{k:"miss",l:"❌ Err.",v:totQ.miss,c:T.red},{k:"total",l:"📊 Total",v:totQ.total,c:T.yellow}].map(m=>(
                <button key={m.k} onClick={()=>setQMode(m.k)}
                  style={{flex:1,background:qMode===m.k?m.c+"22":T.card,color:qMode===m.k?m.c:T.muted,
                    border:`1px solid ${qMode===m.k?m.c:T.border}`,borderRadius:9,padding:"6px 2px",fontSize:9,fontWeight:700,cursor:"pointer",
                    display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                  <span style={{fontSize:8}}>{m.l}</span>
                  <span style={{fontSize:14,fontWeight:900}}>{m.v}</span>
                </button>
              ))}
            </div>
            {/* Mapa de calor interactivo */}
            {qWithZone.length>0&&(
              <div style={{marginBottom:10}}>
                <div style={{background:"#0f2a5a",borderRadius:12,padding:"8px 4px",border:"1px solid #1e407a",marginBottom:6}}>
                  <svg viewBox="-8 -28 296 190" width="100%" preserveAspectRatio="xMidYMid meet" style={{display:"block",maxWidth:360,margin:"0 auto"}}>
                    <rect x="-8" y="-28" width="296" height="190" fill="#0f2a5a" rx="8"/>
                    <rect x="0" y="0" width="280" height="155" fill="#2196c4" rx="4"/>
                    <path d="M 56 0 A 84 84 0 0 1 224 0 Z" fill="#1565a0"/>
                    {Object.entries(ZONES).map(([key,zone])=>(
                      <path key={key} d={zone.path}
                        fill={qSelZone===key?zone.color+"55":qHeatFill(key)}
                        stroke={qSelZone===key?"#fff":"rgba(255,255,255,.15)"}
                        strokeWidth={qSelZone===key?2.5:1}
                        style={{cursor:"pointer",transition:"all .15s"}}
                        onClick={()=>setQSelZone(qSelZone===key?null:key)}
                      />
                    ))}
                    {Object.entries(ZONES).map(([key,zone])=>{
                      const v=getVal(key)||0;
                      return(
                        <g key={key+"t"}>
                          <text x={zone.lx} y={zone.ly-5} textAnchor="middle"
                            style={{fontSize:9,fill:"rgba(255,255,255,.7)",fontWeight:700,pointerEvents:"none"}}>
                            {zone.short}
                          </text>
                          {v>0&&(
                            <text x={zone.lx} y={zone.ly+8} textAnchor="middle"
                              style={{fontSize:12,fill:modeColor,fontWeight:900,pointerEvents:"none"}}>
                              {v}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
                {/* Detalle de zona seleccionada */}
                {qSelZone&&qZoneStats[qSelZone]&&(
                  <div style={{background:T.card,borderRadius:11,border:`1px solid ${ZONES[qSelZone]?.color}44`,padding:"10px 12px",marginBottom:6}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:8}}>{ZONES[qSelZone]?.label} — {qZoneStats[qSelZone].total} tiros</div>
                    <div style={{display:"flex",gap:5,marginBottom:6}}>
                      {[{l:"⚽ Goles",v:qZoneStats[qSelZone].goals,c:T.green},{l:"🧤 Ataj.",v:qZoneStats[qSelZone].saved,c:"#60a5fa"},{l:"❌ Err.",v:qZoneStats[qSelZone].miss,c:T.red}].map(x=>(
                        <div key={x.l} style={{flex:1,textAlign:"center",borderRadius:8,padding:"6px 0",background:x.c+"12",border:`1px solid ${x.c}28`}}>
                          <div style={{fontSize:16,fontWeight:800,color:x.c}}>{x.v}</div>
                          <div style={{fontSize:8,color:T.muted}}>{x.l}</div>
                        </div>
                      ))}
                    </div>
                    {qZoneStats[qSelZone].total>0&&(
                      <div style={{height:5,borderRadius:2,overflow:"hidden",background:T.border,display:"flex"}}>
                        <div style={{width:`${qZoneStats[qSelZone].goals/qZoneStats[qSelZone].total*100}%`,background:T.green}}/>
                        <div style={{width:`${qZoneStats[qSelZone].saved/qZoneStats[qSelZone].total*100}%`,background:"#60a5fa"}}/>
                        <div style={{width:`${qZoneStats[qSelZone].miss/qZoneStats[qSelZone].total*100}%`,background:T.red}}/>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* Análisis por lado */}
            {sideData.length>0&&(
              <div style={{marginBottom:6}}>
                <div style={{fontSize:9,color:T.muted,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>Por lado de ataque</div>
                <div style={{display:"flex",gap:6}}>
                  {sideData.map(s=>{
                    const pct=s.total?Math.round(s.goals/s.total*100):0;
                    return(
                      <div key={s.side} style={{flex:1,background:s.color+"0c",border:`1px solid ${s.color}33`,borderRadius:11,padding:"10px 8px"}}>
                        <div style={{fontSize:11,fontWeight:700,color:s.color,marginBottom:6}}>{s.label}</div>
                        <div style={{display:"flex",gap:4,marginBottom:5}}>
                          {[{l:"⚽",v:s.goals,c:T.green},{l:"🧤",v:s.saved,c:"#60a5fa"},{l:"❌",v:s.miss,c:T.red}].map(x=>(
                            <div key={x.l} style={{flex:1,textAlign:"center",borderRadius:7,padding:"4px 0",background:x.c+"12"}}>
                              <div style={{fontSize:14,fontWeight:800,color:x.c}}>{x.v}</div>
                              <div style={{fontSize:7,color:T.muted}}>{x.l}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{height:4,borderRadius:2,overflow:"hidden",background:T.border,display:"flex"}}>
                          <div style={{width:`${s.total?s.goals/s.total*100:0}%`,background:T.green}}/>
                          <div style={{width:`${s.total?s.saved/s.total*100:0}%`,background:"#60a5fa"}}/>
                          <div style={{width:`${s.total?s.miss/s.total*100:0}%`,background:T.red}}/>
                        </div>
                        <div style={{fontSize:9,color:T.muted,marginTop:4,textAlign:"center"}}>{s.total} tiros · {pct}% conv.</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );};
        return <QuickSideAnalysis/>;      })()}
      {/* ── KPIs principales — clickeables ── */}
      {(()=>{
        const penalShots=shots.filter(s=>s.zone==="penal"||s.distance==="penal");
        const penalGoals=penalShots.filter(s=>s.result==="goal").length;
        const rivalGKSaved=rivalGKMap.named.reduce((a,g)=>a+g.saved,0)+(rivalGKMap.quick?.saved||0);
        const rivalGKTotal=rivalGKMap.named.reduce((a,g)=>a+g.total,0)+(rivalGKMap.quick?.total||0);
        const rivSavePct=rivalGKTotal?Math.round(rivalGKSaved/rivalGKTotal*100):0;
        const kpis=[
          {key:"goal",   emoji:"⚽", l:"Goles",      v:totals.goals,  c:T.green},
          {key:"saved",  emoji:"🧤", l:"Atajadas",   v:totals.saved,  c:"#60a5fa"},
          {key:"miss",   emoji:"❌", l:"Errados",    v:totals.miss,   c:T.muted},
          {key:"tiros",  emoji:"🎯", l:"Tiros",      v:totals.total,  c:T.text,   noClick:true},
          {key:"conv",   emoji:"📊", l:"Conversión", v:`${pct}%`,     c:pct>=50?T.green:T.yellow, noClick:true},
          {key:"rival",  emoji:"🛑", l:"% Arq. rival",v:rivalGKTotal?`${rivSavePct}%`:"—", c:rivSavePct>=40?T.orange:T.green, noClick:true},
          {key:"penal",  emoji:"🥅", l:"Penales",    v:penalGoals,    c:T.purple},
        ];

        // Zona breakdown para el kpi seleccionado
        const zoneBreakdown=kpiFilter&&kpiFilter!=="penal"?(()=>{
          const filtered=shots.filter(s=>s.result===kpiFilter&&s.zone);
          const byZone={};
          Object.keys(ZONES).forEach(zk=>{
            const zs=filtered.filter(s=>s.zone===zk);
            if(zs.length>0) byZone[zk]=zs.length;
          });
          return Object.entries(byZone).sort(([,a],[,b])=>b-a);
        })():kpiFilter==="penal"?(()=>{
          return penalShots.map(s=>({result:s.result}));
        })():null;

        return(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:8}}>
              {kpis.map(k=>{
                const active=kpiFilter===k.key;
                return(
                  <div key={k.key}
                    onClick={()=>!k.noClick&&setKpiFilter(active?null:k.key)}
                    style={{background:active?k.c+"22":T.card,borderRadius:11,padding:"10px 6px",
                      border:`1px solid ${active?k.c:T.border}`,textAlign:"center",
                      display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                      cursor:k.noClick?"default":"pointer",transition:"all .15s"}}>
                    <span style={{fontSize:16,lineHeight:1}}>{k.emoji}</span>
                    <div style={{fontSize:18,fontWeight:900,color:k.c,lineHeight:1}}>{k.v}</div>
                    <div style={{fontSize:8,color:active?k.c:T.muted,letterSpacing:.5,textTransform:"uppercase",fontWeight:active?700:400}}>{k.l}</div>
                    {!k.noClick&&<div style={{fontSize:7,color:active?k.c:T.border}}>{active?"▲ ocultar":"▼ ver zonas"}</div>}
                  </div>
                );
              })}
            </div>

            {/* Panel de desglose por zona */}
            {kpiFilter&&kpiFilter!=="penal"&&(()=>{
              const resultLabel={goal:"⚽ Goles",saved:"🧤 Atajadas",miss:"❌ Errados"}[kpiFilter];
              const resultColor={goal:T.green,saved:"#60a5fa",miss:T.red}[kpiFilter];
              const filtered=shots.filter(s=>s.result===kpiFilter);
              const withZone=filtered.filter(s=>s.zone);
              const noZone=filtered.filter(s=>!s.zone);
              const total=filtered.length;
              if(total===0) return(
                <div style={{background:T.card,borderRadius:10,padding:"12px",textAlign:"center",color:T.muted,fontSize:11,marginBottom:10}}>
                  Sin datos de {resultLabel}
                </div>
              );
              const byZone=Object.entries(ZONES).map(([zk,zv])=>{
                const zs=withZone.filter(s=>s.zone===zk);
                return{key:zk,label:zv.label,short:zv.short,color:zv.color,count:zs.length};
              }).filter(z=>z.count>0).sort((a,b)=>b.count-a.count);
              const maxV=byZone[0]?.count||1;
              return(
                <div style={{background:T.card,borderRadius:12,padding:"10px 12px",marginBottom:10,border:`1px solid ${resultColor}33`}}>
                  <div style={{fontSize:11,fontWeight:700,color:resultColor,marginBottom:8}}>
                    {resultLabel} por zona — {total} total
                    {noZone.length>0&&<span style={{color:T.muted,fontWeight:400}}> ({noZone.length} sin zona)</span>}
                  </div>
                  {byZone.map(z=>(
                    <div key={z.key} style={{marginBottom:6}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                        <span style={{fontSize:10,fontWeight:700,color:z.color,width:80,flexShrink:0}}>{z.label}</span>
                        <div style={{flex:1,height:8,background:T.border,borderRadius:4,overflow:"hidden"}}>
                          <div style={{width:`${z.count/maxV*100}%`,height:"100%",background:resultColor,borderRadius:4,transition:"width .3s"}}/>
                        </div>
                        <span style={{fontSize:13,fontWeight:900,color:resultColor,width:20,textAlign:"right"}}>{z.count}</span>
                      </div>
                    </div>
                  ))}
                  {noZone.length>0&&(
                    <div style={{marginTop:6,paddingTop:6,borderTop:`1px solid ${T.border}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:10,color:T.muted,width:80,flexShrink:0}}>Sin zona</span>
                        <div style={{flex:1,height:8,background:T.border,borderRadius:4,overflow:"hidden"}}>
                          <div style={{width:`${noZone.length/maxV*100}%`,height:"100%",background:T.muted,borderRadius:4}}/>
                        </div>
                        <span style={{fontSize:13,fontWeight:900,color:T.muted,width:20,textAlign:"right"}}>{noZone.length}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Panel penales */}
            {kpiFilter==="penal"&&(()=>{
              const pg=penalShots.filter(s=>s.result==="goal").length;
              const ps=penalShots.filter(s=>s.result==="saved").length;
              const pm=penalShots.filter(s=>s.result==="miss").length;
              const pt=penalShots.length;
              return(
                <div style={{background:T.card,borderRadius:12,padding:"10px 12px",marginBottom:10,border:`1px solid ${T.purple}44`}}>
                  <div style={{fontSize:11,fontWeight:700,color:T.purple,marginBottom:8}}>🥅 Penales — {pt} total</div>
                  <div style={{display:"flex",gap:6}}>
                    {[{l:"Goles",v:pg,c:T.green},{l:"Atajados",v:ps,c:"#60a5fa"},{l:"Errados",v:pm,c:T.red}].map(x=>(
                      <div key={x.l} style={{flex:1,textAlign:"center",borderRadius:8,padding:"8px 0",background:x.c+"15",border:`1px solid ${x.c}30`}}>
                        <div style={{fontSize:18,fontWeight:900,color:x.c}}>{x.v}</div>
                        <div style={{fontSize:9,color:T.muted}}>{x.l}</div>
                      </div>
                    ))}
                  </div>
                  {pt>0&&(
                    <div style={{marginTop:8}}>
                      <div style={{fontSize:9,color:T.muted,marginBottom:4}}>EFECTIVIDAD PENAL</div>
                      <div style={{height:8,borderRadius:4,background:T.border,overflow:"hidden",display:"flex"}}>
                        <div style={{width:`${pg/pt*100}%`,background:T.green}}/>
                        <div style={{width:`${ps/pt*100}%`,background:"#60a5fa"}}/>
                        <div style={{width:`${pm/pt*100}%`,background:T.red}}/>
                      </div>
                      <div style={{fontSize:10,fontWeight:700,color:T.green,marginTop:4,textAlign:"center"}}>
                        {Math.round(pg/pt*100)}% conversión penal
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })()}
      {shots.length===0?(

        <div style={{textAlign:"center",padding:"30px 20px",color:T.muted}}>
          <div style={{fontSize:32,marginBottom:8}}>{dataMode==="full"?"📋":"⚡"}</div>
          <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:4}}>Sin datos de {dataMode==="full"?"registro completo":"registro rápido"}</div>
        </div>
      ):isMatchView?(
        <>
          <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
            {(dataMode==="full"
              ?[{k:"court",l:"🏟 Cancha"},{k:"goal",l:"🥅 Arco"},{k:"players",l:"👥 Jugadores"},{k:"keeper",l:"🧤 Arquero"},{k:"analysis",l:"📐 Análisis"}]
              :[{k:"court",l:"🏟 Cancha"},{k:"players",l:"👥 Jugadores"},{k:"keeper",l:"🧤 Arquero"},{k:"analysis",l:"📐 Análisis"}]
            ).map(t=>(
              <button key={t.k} onClick={()=>setMainTab(t.k)}
                style={{flex:1,background:mainTab===t.k?T.accent:T.card,color:mainTab===t.k?"#fff":T.muted,
                  border:`1px solid ${mainTab===t.k?T.accent:T.border}`,borderRadius:9,padding:"8px 3px",fontSize:10,fontWeight:700,cursor:"pointer",minWidth:60}}>
                {t.l}
              </button>
            ))}
          </div>
          {mainTab==="court"&&<StatsCourt shots={shots}/> }
          {mainTab==="goal"&&dataMode==="full"&&(
            <div>
              <div style={{display:"flex",gap:6,marginBottom:10}}>
                {[
                  {k:"goals",l:"⚽ Goles",c:T.green,    v:totals.goals},
                  {k:"saved",l:"🧤 Ataj.", c:"#60a5fa", v:totals.saved},
                  {k:"miss", l:"❌ Err.",  c:T.red,      v:totals.miss},
                  {k:"total",l:"📊 Total", c:T.yellow,   v:totals.total},
                ].map(m=>(
                  <button key={m.k} onClick={()=>setGoalMode(m.k)}
                    style={{flex:1,background:goalMode===m.k?m.c+"28":T.card,color:goalMode===m.k?m.c:T.muted,
                      border:`1px solid ${goalMode===m.k?m.c:T.border}`,borderRadius:9,padding:"7px 2px",fontSize:10,fontWeight:700,cursor:"pointer",
                      display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                    <span>{m.l}</span>
                    <span style={{fontSize:13,fontWeight:900}}>{m.v}</span>
                  </button>
                ))}
              </div>
              <Card style={{marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:700,color:T.text,marginBottom:10}}>🥅 Mapa del Arco</div>
                <GoalMap byQ={byQ} mode={goalMode}/>
              </Card>
            </div>
          )}
          {mainTab==="keeper"&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {/* Arquero propio */}
              <div style={{fontSize:10,color:"#60a5fa",fontWeight:700,letterSpacing:1}}>
                🧤 ARQUERO — {homeNameInMatch}
              </div>
              {goalkeeperMap.length===0?(
                <div style={{textAlign:"center",padding:"20px",color:T.muted}}>
                  <div style={{fontSize:24,marginBottom:6}}>🧤</div>
                  <div style={{fontSize:11}}>Sin datos — registrá con modo completo</div>
                </div>
              ):goalkeeperMap.map((gk,i)=>{
                const pct=gk.total?Math.round(gk.saved/gk.total*100):0;
                return(
                  <Card key={gk.name}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <div style={{width:40,height:40,borderRadius:"50%",background:"#60a5fa22",border:"2px solid #60a5fa44",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <span style={{fontSize:11,fontWeight:800,color:"#60a5fa"}}>#{gk.number||"?"}</span>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:14,fontWeight:700,color:T.text}}>{gk.name}</span>
                          {i===0&&<span>🥇</span>}
                        </div>
                        <div style={{fontSize:11,color:T.muted}}>{gk.total} tiros · {pct}% efectividad</div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:22,fontWeight:900,color:pct>=40?T.green:T.red}}>{pct}%</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:5,marginBottom:8}}>
                      {[{l:"Atajadas",v:gk.saved,c:"#60a5fa"},{l:"Goles rec.",v:gk.goals,c:T.red},{l:"Errados",v:gk.miss,c:T.muted}].map(x=>(
                        <div key={x.l} style={{flex:1,textAlign:"center",borderRadius:8,padding:"6px 0",background:x.c+"12",border:`1px solid ${x.c}28`}}>
                          <div style={{fontSize:16,fontWeight:800,color:x.c}}>{x.v}</div>
                          <div style={{fontSize:9,color:T.muted}}>{x.l}</div>
                        </div>
                      ))}
                    </div>
                    {/* Cuadrantes arquero propio */}
                    {gk.byQ&&gk.byQ.some(q=>q.total>0)&&(
                      <div>
                        <div style={{fontSize:9,color:T.muted,marginBottom:5}}>POR CUADRANTE</div>
                        {[[0,1,2],[3,4,5],[6,7,8]].map((row,ri)=>(
                          <div key={ri} style={{display:"flex",gap:4,marginBottom:ri<2?4:0}}>
                            {row.map(qi=>{
                              const q=gk.byQ[qi];
                              const pctQ=q.total?Math.round(q.saved/q.total*100):0;
                              return(
                                <div key={qi} style={{flex:1,background:q.total>0?"#60a5fa12":"rgba(0,0,0,.2)",
                                  border:`1px solid ${q.total>0?"#60a5fa33":T.border}`,
                                  borderRadius:7,padding:"5px 2px",textAlign:"center",minHeight:40}}>
                                  {q.total>0?(
                                    <>
                                      <div style={{fontSize:11,fontWeight:800,color:"#60a5fa"}}>{q.saved}</div>
                                      <div style={{fontSize:8,color:T.muted}}>{QUADRANTS[qi].icon}</div>
                                      <div style={{fontSize:8,color:T.muted}}>{pctQ}%</div>
                                    </>
                                  ):(
                                    <span style={{fontSize:11,color:T.muted}}>{QUADRANTS[qi].icon}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{height:5,borderRadius:2,overflow:"hidden",background:T.border,display:"flex",marginTop:8}}>
                      <div style={{width:`${gk.total?gk.saved/gk.total*100:0}%`,background:"#60a5fa"}}/>
                      <div style={{width:`${gk.total?gk.goals/gk.total*100:0}%`,background:T.red}}/>
                    </div>
                  </Card>
                );
              })}

              {/* Arquero rival */}
              <div style={{fontSize:10,color:T.orange,fontWeight:700,letterSpacing:1,marginTop:8}}>
                🧤 ARQUERO RIVAL — {awayNameInMatch}
              </div>
              {/* Modo rápido: totales */}
              {rivalGKMap.quick.total>0&&(
                <Card>
                  <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:8}}>⚡ Modo rápido</div>
                  <div style={{display:"flex",gap:5,marginBottom:6}}>
                    {[
                      {l:"Atajadas",v:rivalGKMap.quick.saved,c:"#60a5fa"},
                      {l:"Goles",   v:rivalGKMap.quick.goals,c:T.green},
                      {l:"Errados", v:rivalGKMap.quick.miss, c:T.muted},
                    ].map(x=>(
                      <div key={x.l} style={{flex:1,textAlign:"center",borderRadius:8,padding:"6px 0",background:x.c+"12",border:`1px solid ${x.c}28`}}>
                        <div style={{fontSize:16,fontWeight:800,color:x.c}}>{x.v}</div>
                        <div style={{fontSize:9,color:T.muted}}>{x.l}</div>
                      </div>
                    ))}
                  </div>
                  {rivalGKMap.quick.total>0&&(
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{flex:1,height:6,borderRadius:3,overflow:"hidden",background:T.border,display:"flex"}}>
                        <div style={{width:`${Math.round(rivalGKMap.quick.saved/rivalGKMap.quick.total*100)}%`,background:"#60a5fa"}}/>
                        <div style={{width:`${Math.round(rivalGKMap.quick.goals/rivalGKMap.quick.total*100)}%`,background:T.green}}/>
                      </div>
                      <span style={{fontSize:12,fontWeight:800,color:"#60a5fa"}}>
                        {Math.round(rivalGKMap.quick.saved/rivalGKMap.quick.total*100)}% atajado
                      </span>
                    </div>
                  )}
                </Card>
              )}
              {/* Modo completo: por nombre y cuadrante */}
              {rivalGKMap.named.length>0?rivalGKMap.named.map((gk,i)=>{
                const pct=gk.total?Math.round(gk.saved/gk.total*100):0;
                return(
                  <Card key={gk.name}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <div style={{width:40,height:40,borderRadius:"50%",background:T.orange+"22",border:`2px solid ${T.orange}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <span style={{fontSize:11,fontWeight:800,color:T.orange}}>#{gk.number||"?"}</span>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,color:T.text}}>{gk.name}</div>
                        <div style={{fontSize:11,color:T.muted}}>{gk.total} tiros · {pct}% atajado</div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:22,fontWeight:900,color:pct>=40?T.green:T.red}}>{pct}%</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:5,marginBottom:8}}>
                      {[{l:"Atajadas",v:gk.saved,c:"#60a5fa"},{l:"Goles",v:gk.goals,c:T.green},{l:"Errados",v:gk.miss,c:T.muted}].map(x=>(
                        <div key={x.l} style={{flex:1,textAlign:"center",borderRadius:8,padding:"6px 0",background:x.c+"12",border:`1px solid ${x.c}28`}}>
                          <div style={{fontSize:16,fontWeight:800,color:x.c}}>{x.v}</div>
                          <div style={{fontSize:9,color:T.muted}}>{x.l}</div>
                        </div>
                      ))}
                    </div>
                    {gk.byQ&&gk.byQ.some(q=>q.total>0)&&(
                      <div>
                        <div style={{fontSize:9,color:T.muted,marginBottom:5}}>POR CUADRANTE</div>
                        {[[0,1,2],[3,4,5],[6,7,8]].map((row,ri)=>(
                          <div key={ri} style={{display:"flex",gap:4,marginBottom:ri<2?4:0}}>
                            {row.map(qi=>{
                              const q=gk.byQ[qi];
                              return(
                                <div key={qi} style={{flex:1,background:q.total>0?T.green+"12":"rgba(0,0,0,.2)",
                                  border:`1px solid ${q.total>0?T.green+"33":T.border}`,
                                  borderRadius:7,padding:"5px 2px",textAlign:"center",minHeight:40}}>
                                  {q.total>0?(
                                    <>
                                      <div style={{fontSize:11,fontWeight:800,color:T.green}}>{q.goals}</div>
                                      <div style={{fontSize:8,color:T.muted}}>{QUADRANTS[qi].icon}</div>
                                      <div style={{fontSize:8,color:T.muted}}>{q.saved>0?`🧤${q.saved}`:""}</div>
                                    </>
                                  ):(
                                    <span style={{fontSize:11,color:T.muted}}>{QUADRANTS[qi].icon}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              }):(
                rivalGKMap.quick.total===0&&(
                  <div style={{textAlign:"center",padding:"16px",color:T.muted,fontSize:11}}>
                    Sin datos del arquero rival
                  </div>
                )
              )}
            </div>
          )}
          {mainTab==="players"&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {playerMap.length===0
                ?<div style={{textAlign:"center",color:T.muted,padding:"20px",fontSize:12}}>Sin datos</div>
                :playerMap.map((p,i)=>{
                  const tot=p.goals+p.saved+p.miss;
                  const pct2=tot?Math.round(p.goals/tot*100):0;
                  return(
                    <Card key={p.player}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                        <div style={{width:34,height:34,borderRadius:"50%",background:T.accent+"22",border:`2px solid ${T.accent}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <span style={{fontSize:11,fontWeight:800,color:T.accent}}>#{p.number||"?"}</span>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:5}}>
                            <span style={{fontSize:13,fontWeight:700,color:T.text}}>{p.player}</span>
                            {i<3&&<span style={{fontSize:13}}>{medals[i]}</span>}
                          </div>
                          <div style={{fontSize:10,color:T.muted}}>{tot} tiros · {pct2}% conv.</div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:5,marginBottom:5}}>
                        {[{l:"⚽",v:p.goals,c:T.green},{l:"🧤",v:p.saved,c:"#60a5fa"},{l:"❌",v:p.miss,c:T.red}].map(x=>(
                          <div key={x.l} style={{flex:1,textAlign:"center",borderRadius:8,padding:"5px 0",background:x.c+"12",border:`1px solid ${x.c}28`}}>
                            <div style={{fontSize:16,fontWeight:800,color:x.c}}>{x.v}</div>
                            <div style={{fontSize:9,color:T.muted}}>{x.l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{height:4,borderRadius:2,display:"flex",overflow:"hidden",background:T.border}}>
                        <div style={{width:`${tot?p.goals/tot*100:0}%`,background:T.green}}/>
                        <div style={{width:`${tot?p.saved/tot*100:0}%`,background:"#60a5fa"}}/>
                        <div style={{width:`${tot?p.miss/tot*100:0}%`,background:T.red}}/>
                      </div>
                    </Card>
                  );
                })
              }
            </div>
          )}
          {mainTab==="analysis"&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[{items:DISTANCES,key:"distance",title:"📏 Por Distancia",color:T.accent},
                {items:SITUATIONS,key:"situation",title:"⚖️ Por Situación",getColor:s=>s.color},
                {items:THROW_TYPES,key:"throwType",title:"🤾 Tipo de Lanzamiento",color:T.yellow}
              ].map(({items,key,title,color,getColor})=>{
                const hasData=shots.some(s=>s[key]);
                if(!hasData)return null;
                return(
                  <Card key={key}>
                    <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:10}}>{title}</div>
                    {items.map(item=>{
                      const ds=shots.filter(s=>s[key]===item.k);
                      if(!ds.length)return null;
                      const g=ds.filter(s=>s.result==="goal").length;
                      const pct3=Math.round(g/ds.length*100);
                      const c=getColor?getColor(item):color;
                      return(
                        <div key={item.k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                          <span style={{fontSize:13,width:20}}>{item.emoji}</span>
                          <span style={{fontSize:11,color:T.muted,width:80,flexShrink:0}}>{item.l}</span>
                          <div style={{flex:1,height:7,background:T.border,borderRadius:4,overflow:"hidden"}}>
                            <div style={{width:`${pct3}%`,height:"100%",background:c,borderRadius:4}}/>
                          </div>
                          <span style={{fontSize:11,fontWeight:700,color:c,width:50,textAlign:"right"}}>{g}/{ds.length} ({pct3}%)</span>
                        </div>
                      );
                    })}
                  </Card>
                );
              }).filter(Boolean)}
              {!shots.some(s=>s.distance||s.situation!=="igualdad"||s.throwType)&&(
                <div style={{textAlign:"center",padding:"30px 20px",color:T.muted}}>
                  <div style={{fontSize:32,marginBottom:8}}>📐</div>
                  <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:4}}>Sin datos de análisis avanzado</div>
                  <div style={{fontSize:11}}>Registrá con Modo Completo para ver distancia, situación y tipo.</div>
                </div>
              )}
            </div>
          )}
        </>
      ):(
        /* Vista temporada con shots — usar tabs del season selector */
        <>
          {mainTab==="court"&&<StatsCourt shots={seasonShots.length>0?seasonShots:shots}/>}
          {mainTab==="goal"&&(
            <div>
              <div style={{display:"flex",gap:6,marginBottom:10}}>
                {[{k:"goals",l:"⚽ Goles",c:T.green,v:totals.goals},{k:"saved",l:"🧤 Ataj.",c:"#60a5fa",v:totals.saved},{k:"miss",l:"❌ Err.",c:T.red,v:totals.miss},{k:"total",l:"📊 Total",c:T.yellow,v:totals.total}].map(m=>(
                  <button key={m.k} onClick={()=>setGoalMode(m.k)}
                    style={{flex:1,background:goalMode===m.k?m.c+"28":T.card,color:goalMode===m.k?m.c:T.muted,
                      border:`1px solid ${goalMode===m.k?m.c:T.border}`,borderRadius:9,padding:"7px 2px",fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                    <span>{m.l}</span><span style={{fontSize:13,fontWeight:900}}>{m.v}</span>
                  </button>
                ))}
              </div>
              <Card><div style={{fontSize:11,fontWeight:700,color:T.text,marginBottom:10}}>🥅 Mapa del Arco</div><GoalMap byQ={byQ} mode={goalMode}/></Card>
            </div>
          )}
          {mainTab==="players"&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {playerMap.map((p,i)=>{
                const tot=p.goals+p.saved+p.miss,pct2=tot?Math.round(p.goals/tot*100):0;
                return(<Card key={p.player}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{width:34,height:34,borderRadius:"50%",background:T.accent+"22",border:`2px solid ${T.accent}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{fontSize:11,fontWeight:800,color:T.accent}}>#{p.number||"?"}</span>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <span style={{fontSize:13,fontWeight:700,color:T.text}}>{p.player}</span>
                        {i<3&&<span style={{fontSize:13}}>{medals[i]}</span>}
                      </div>
                      <div style={{fontSize:10,color:T.muted}}>{tot} tiros · {pct2}% conv.</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:5,marginBottom:5}}>
                    {[{l:"⚽",v:p.goals,c:T.green},{l:"🧤",v:p.saved,c:"#60a5fa"},{l:"❌",v:p.miss,c:T.red}].map(x=>(
                      <div key={x.l} style={{flex:1,textAlign:"center",borderRadius:8,padding:"5px 0",background:x.c+"12",border:`1px solid ${x.c}28`}}>
                        <div style={{fontSize:16,fontWeight:800,color:x.c}}>{x.v}</div>
                        <div style={{fontSize:9,color:T.muted}}>{x.l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{height:4,borderRadius:2,display:"flex",overflow:"hidden",background:T.border}}>
                    <div style={{width:`${tot?p.goals/tot*100:0}%`,background:T.green}}/>
                    <div style={{width:`${tot?p.saved/tot*100:0}%`,background:"#60a5fa"}}/>
                    <div style={{width:`${tot?p.miss/tot*100:0}%`,background:T.red}}/>
                  </div>
                </Card>);
              })}
            </div>
          )}
          {mainTab==="keeper"&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {goalkeeperMap.length===0
                ?<div style={{textAlign:"center",padding:"30px",color:T.muted}}><div style={{fontSize:28,marginBottom:8}}>🧤</div><div style={{fontSize:12}}>Sin datos de arquero</div></div>
                :goalkeeperMap.map((gk,i)=>{
                  const pct=gk.total?Math.round(gk.saved/gk.total*100):0;
                  return(<Card key={gk.name}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <div style={{width:40,height:40,borderRadius:"50%",background:"#60a5fa22",border:"2px solid #60a5fa44",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <span style={{fontSize:11,fontWeight:800,color:"#60a5fa"}}>#{gk.number||"?"}</span>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:14,fontWeight:700,color:T.text}}>{gk.name}</span>{i===0&&<span>🥇</span>}</div>
                        <div style={{fontSize:11,color:T.muted}}>{gk.total} tiros · {pct}% atajados</div>
                      </div>
                      <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,color:"#60a5fa"}}>{pct}%</div><div style={{fontSize:9,color:T.muted}}>efectividad</div></div>
                    </div>
                    <div style={{display:"flex",gap:5,marginBottom:5}}>
                      {[{l:"Atajadas",v:gk.saved,c:"#60a5fa"},{l:"Goles rec.",v:gk.goals,c:T.red},{l:"Errados",v:gk.miss,c:T.muted}].map(x=>(
                        <div key={x.l} style={{flex:1,textAlign:"center",borderRadius:8,padding:"6px 0",background:x.c+"12",border:`1px solid ${x.c}28`}}>
                          <div style={{fontSize:16,fontWeight:800,color:x.c}}>{x.v}</div>
                          <div style={{fontSize:9,color:T.muted}}>{x.l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{height:6,borderRadius:3,overflow:"hidden",background:T.border,display:"flex"}}>
                      <div style={{width:`${gk.total?gk.saved/gk.total*100:0}%`,background:"#60a5fa"}}/>
                      <div style={{width:`${gk.total?gk.goals/gk.total*100:0}%`,background:T.red}}/>
                    </div>
                  </Card>);
                })
              }
            </div>
          )}
          {mainTab==="analysis"&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[{items:DISTANCES,key:"distance",title:"📏 Por Distancia",color:T.accent},
                {items:SITUATIONS,key:"situation",title:"⚖️ Por Situación",getColor:s=>s.color},
                {items:THROW_TYPES,key:"throwType",title:"🤾 Tipo de Lanzamiento",color:T.yellow}
              ].map(({items,key,title,color,getColor})=>{
                const hasData=shots.some(s=>s[key]);
                if(!hasData)return null;
                return(<Card key={key}>
                  <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:10}}>{title}</div>
                  {items.map(item=>{
                    const ds=shots.filter(s=>s[key]===item.k);
                    if(!ds.length)return null;
                    const g=ds.filter(s=>s.result==="goal").length;
                    const pct3=Math.round(g/ds.length*100);
                    const c=getColor?getColor(item):color;
                    return(<div key={item.k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                      <span style={{fontSize:13,width:20}}>{item.emoji}</span>
                      <span style={{fontSize:11,color:T.muted,width:80,flexShrink:0}}>{item.l}</span>
                      <div style={{flex:1,height:7,background:T.border,borderRadius:4,overflow:"hidden"}}>
                        <div style={{width:`${pct3}%`,height:"100%",background:c,borderRadius:4}}/>
                      </div>
                      <span style={{fontSize:11,fontWeight:700,color:c,width:50,textAlign:"right"}}>{g}/{ds.length} ({pct3}%)</span>
                    </div>);
                  })}
                </Card>);
              }).filter(Boolean)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  AI PAGE
// ═══════════════════════════════════════════════════
function AIPage({liveEvents,liveMatchInfo,completedMatches}){
  const [selMatch,setSelMatch]=useState("live");
  const matchesToShow=[
    {id:"live",label:`🔴 Partido en vivo (${liveMatchInfo?.home||"GEI"} vs ${liveMatchInfo?.away||"Rival"})`,events:liveEvents,hs:liveEvents.filter(e=>e.type==="goal"&&e.team==="home").length,as:liveEvents.filter(e=>e.type==="goal"&&e.team==="away").length,home:liveMatchInfo?.home||"GEI",away:liveMatchInfo?.away||"Rival"},
    ...completedMatches.map(m=>({...m,label:`✅ ${m.home} ${m.hs}–${m.as} ${m.away} (${m.date||""})`}))
  ];
  const current=matchesToShow.find(m=>m.id===selMatch)||matchesToShow[0];
  return(
    <div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:10,color:T.accent,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>Inteligencia Artificial</div>
        <div style={{fontSize:22,fontWeight:800,color:T.text}}>Análisis IA</div>
      </div>
      <div style={{marginBottom:12}}>
        <SectionLabel>SELECCIONAR PARTIDO</SectionLabel>
        <select value={selMatch} onChange={e=>setSelMatch(e.target.value)}
          style={{width:"100%",background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 14px",color:T.text,fontSize:13,cursor:"pointer"}}>
          {matchesToShow.map(m=>(
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>
      {current&&(
        <AIAnalysis
          events={current.events||[]}
          homeName={current.home||"GEI"}
          awayName={current.away||"Rival"}
          hScore={current.hs||0}
          aScore={current.as||0}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  REGISTER PAGE
// ═══════════════════════════════════════════════════
function RegisterPage({events,setEvents,matchStatus,matchInfo,onCloseMatch,onStartMatch,persistEvent,updatePersistedEvent,homeTeam,awayTeamName,awayPlayers=[]}){
  const [regMode,setRegMode]=useState("quick");
  const [minute,setMinute]=useState(1);
  const [step,setStep]=useState(null);
  const [completingId,setCompletingId]=useState(null);
  const [form,setForm]=useState({type:"goal",team:"home",zone:null,quadrant:null,shooter:null,goalkeeper:null,sanctioned:null,minute:"1"});
  const [lForm,setLForm]=useState({type:"goal",team:"home",zone:null,quadrant:null,shooter:null,goalkeeper:null,sanctioned:null,minute:"1",distance:null,situation:"igualdad",throwType:null});
  const [quickZone,setQuickZone]=useState(null);
  const [quickSit,setQuickSit]=useState("igualdad");

  // ── CRONÓMETRO ────────────────────────────────────────
  const [half,setHalf]=useState(1);           // 1 o 2
  const [timerSecs,setTimerSecs]=useState(30*60); // 30:00
  const [timerRunning,setTimerRunning]=useState(false);
  const [exclusions,setExclusions]=useState([]); // [{id,team,player,secs}]
  const timerRef=useRef(null);

  useEffect(()=>{
    if(timerRunning){
      timerRef.current=setInterval(()=>{
        setTimerSecs(s=>{
          const ns=s-1;
          if(ns<=0){ clearInterval(timerRef.current); setTimerRunning(false); return 0; }
          return ns;
        });
        setExclusions(prev=>prev.map(e=>({...e,secs:e.secs-1})).filter(e=>e.secs>0));
      },1000);
    } else {
      clearInterval(timerRef.current);
    }
    return()=>clearInterval(timerRef.current);
  },[timerRunning]);

  const fmtTime=s=>{
    const m=Math.floor(s/60);
    const sec=s%60;
    return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };

  // Minuto real del cronómetro (para guardar en evento)
  const realMinute=Math.max(1,Math.ceil((30*60-timerSecs)/60)+(half===2?30:0));

  const startHalf=(h)=>{
    setHalf(h);
    setTimerSecs(30*60);
    setTimerRunning(true);
    setExclusions([]);
  };

  const addExclusion=(team,player)=>{
    const id=Date.now();
    setExclusions(prev=>{
      const teamExcl=prev.filter(e=>e.team===team);
      if(teamExcl.length>=2)return prev; // máx 2 por equipo
      return [...prev,{id,team,player,secs:120}];
    });
  };

  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const lupd=(k,v)=>setLForm(f=>({...f,[k]:v}));

  const awayTeamData={name:awayTeamName||"Rival",color:"#64748b",players:awayPlayers};
  const EMPTY_PLAYERS=[];

  const heatCounts=useMemo(()=>{const c={};events.filter(e=>e.zone).forEach(e=>{c[e.zone]=(c[e.zone]||0)+1;});return c;},[events]);
  const lastScore=events.filter(e=>e.hScore!=null).slice(-1)[0]||{hScore:0,aScore:0};
  const totals={goals:events.filter(e=>e.type==="goal").length,saved:events.filter(e=>e.type==="saved").length,miss:events.filter(e=>e.type==="miss").length,excl:events.filter(e=>e.type==="exclusion").length};
  const pendingCount=events.filter(e=>!e.completed&&["goal","miss","saved"].includes(e.type)).length;

  const calcScore=(type,team)=>{
    const prev=events.filter(e=>e.hScore!=null).slice(-1)[0]||{hScore:0,aScore:0};
    let {hScore,aScore}=prev;
    if(type==="goal"){team==="home"?hScore++:aScore++;}
    return {hScore,aScore};
  };

  const saveEv=async(ev)=>{
    if(persistEvent){
      const uuid=await persistEvent(ev).catch(()=>null);
      if(uuid&&uuid!==ev.id) setEvents(prev=>prev.map(e=>e.id===ev.id?{...e,id:uuid}:e));
    }
  };

  const quickTap=(type,team)=>{
    const score=calcScore(type,team);
    const localId=Date.now();
    const min=timerRunning||timerSecs<30*60?realMinute:minute;
    const ev={id:localId,min,team,type,zone:quickZone,quadrant:null,situation:quickSit,shooter:null,goalkeeper:null,sanctioned:null,completed:false,quickMode:true,...score};
    setEvents(prev=>[...prev,ev]);
    saveEv(ev);
    // Disparar cronómetro de exclusión automáticamente
    if(type==="exclusion") addExclusion(team,null);
  };

  const deleteEvent=(id)=>{
    setEvents(prev=>prev.filter(e=>e.id!==id));
    if(persistEvent) supabase.from("events").delete().eq("id",id).catch(()=>{});
  };

  const submitFull=()=>{
    const min=parseInt(form.minute)||1;
    const score=calcScore(form.type,form.team);
    const currentTeam=form.team==="home"?homeTeam:awayTeamData;
    const opponentTeam=form.team==="home"?awayTeamData:homeTeam;
    const fp=(currentTeam?.players||[]).filter(p=>p.pos!=="Arquero"&&p.position!=="Arquero");
    const shooter=form.shooter?{name:form.shooter,number:fp.find(p=>p.name===form.shooter)?.number||0}:null;
    const goalkeeper=form.goalkeeper?{name:form.goalkeeper,number:(opponentTeam?.players||[]).find(p=>p.name===form.goalkeeper)?.number||0}:null;
    if(completingId){
      const upd2={zone:form.zone,quadrant:form.quadrant,min,type:form.type,shooter,goalkeeper,completed:true};
      setEvents(prev=>prev.map(e=>e.id===completingId?{...e,...upd2}:e));
      if(updatePersistedEvent) updatePersistedEvent(completingId,upd2).catch(()=>{});
      setCompletingId(null);
    } else {
      const localId=Date.now();
      const ev={id:localId,min,team:form.team,type:form.type,zone:form.zone,quadrant:form.quadrant,shooter,goalkeeper,sanctioned:null,completed:true,...score};
      setEvents(prev=>[...prev,ev]);
      saveEv(ev);
    }
    setStep(null);
    setForm({type:"goal",team:"home",zone:null,quadrant:null,shooter:null,goalkeeper:null,sanctioned:null,minute:"1"});
  };

  const submitDisc=()=>{
    const min=parseInt(form.minute)||1;
    const prev=events.filter(e=>e.hScore!=null).slice(-1)[0]||{hScore:0,aScore:0};
    const currentTeam=form.team==="home"?homeTeam:awayTeamData;
    const sanctioned=form.sanctioned?{name:form.sanctioned,number:(currentTeam?.players||[]).find(p=>p.name===form.sanctioned)?.number||0}:null;
    const localId=Date.now();
    const ev={id:localId,min,team:form.team,type:form.type,completed:true,sanctioned,hScore:prev.hScore,aScore:prev.aScore};
    setEvents(p=>[...p,ev]);
    saveEv(ev);
    setStep(null);
    setForm(f=>({...f,sanctioned:null,minute:"1"}));
  };

  const lSubmit=()=>{
    const min=parseInt(lForm.minute)||1;
    const score=calcScore(lForm.type,lForm.team);
    const currentTeam=lForm.team==="home"?homeTeam:awayTeamData;
    const opponentTeam=lForm.team==="home"?awayTeamData:homeTeam;
    const fp=(currentTeam?.players||[]).filter(p=>p.pos!=="Arquero"&&p.position!=="Arquero");
    const shooter=lForm.shooter?{name:lForm.shooter,number:fp.find(p=>p.name===lForm.shooter)?.number||0}:null;
    const goalkeeper=lForm.goalkeeper?{name:lForm.goalkeeper,number:(opponentTeam?.players||[]).find(p=>p.name===lForm.goalkeeper)?.number||0}:null;
    const localId=Date.now();
    const ev={id:localId,min,team:lForm.team,type:lForm.type,zone:lForm.zone,quadrant:lForm.quadrant,completed:true,distance:lForm.distance,situation:lForm.situation,throwType:lForm.throwType,shooter,goalkeeper,sanctioned:null,...score};
    setEvents(prev=>[...prev,ev]);
    saveEv(ev);
    setLForm({type:"goal",team:"home",zone:null,quadrant:null,shooter:null,goalkeeper:null,sanctioned:null,minute:String(minute),distance:null,situation:"igualdad",throwType:null});
  };

  const lSubmitDisc=()=>{
    const min=parseInt(lForm.minute)||1;
    const prev=events.filter(e=>e.hScore!=null).slice(-1)[0]||{hScore:0,aScore:0};
    const currentTeam=lForm.team==="home"?homeTeam:awayTeamData;
    const sanctioned=lForm.sanctioned?{name:lForm.sanctioned,number:(currentTeam?.players||[]).find(p=>p.name===lForm.sanctioned)?.number||0}:null;
    const localId=Date.now();
    const ev={id:localId,min,team:lForm.team,type:lForm.type,completed:true,sanctioned,hScore:prev.hScore,aScore:prev.aScore};
    setEvents(p=>[...p,ev]);
    saveEv(ev);
    setLForm(f=>({...f,sanctioned:null}));
  };

  const openComplete=(ev)=>{
    setCompletingId(ev.id);
    setForm({type:ev.type,team:ev.team,zone:null,quadrant:null,shooter:null,goalkeeper:null,sanctioned:null,minute:String(ev.min)});
    setStep("shot_detail");
  };

  const homeC=homeTeam?.color||T.accent;
  const awayC=awayTeamData.color||T.muted;

  // ── SCOREBOARD ──
  const Scoreboard=()=>(
    <div style={{marginBottom:10}}>
      {/* Scores */}
      <div style={{background:`linear-gradient(135deg,${homeC}18,${awayC}18)`,borderRadius:14,padding:"10px 14px",border:`1px solid ${T.border}`,marginBottom:6,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{textAlign:"center",flex:1}}>
          <div style={{fontSize:10,fontWeight:700,color:homeC,marginBottom:2}}>{homeTeam?.name||"Local"}</div>
          <div style={{fontSize:36,fontWeight:900,color:homeC,lineHeight:1}}>{lastScore.hScore}</div>
        </div>
        <div style={{textAlign:"center",padding:"0 10px"}}>
          {/* Cronómetro */}
          <div style={{fontSize:20,fontWeight:900,color:timerSecs===0?T.red:timerRunning?T.green:T.yellow,
            letterSpacing:1,lineHeight:1,marginBottom:4}}>
            {fmtTime(timerSecs)}
          </div>
          <div style={{display:"flex",gap:4,justifyContent:"center",marginBottom:4}}>
            {/* Play/Pause */}
            <button onClick={()=>setTimerRunning(r=>!r)}
              style={{background:timerRunning?"rgba(239,68,68,.2)":"rgba(34,197,94,.2)",
                border:`1px solid ${timerRunning?T.red:T.green}`,color:timerRunning?T.red:T.green,
                borderRadius:7,padding:"3px 8px",fontSize:11,cursor:"pointer",fontWeight:700}}>
              {timerRunning?"⏸":"▶"}
            </button>
            {/* 1T / 2T */}
            {[1,2].map(h=>(
              <button key={h} onClick={()=>startHalf(h)}
                style={{background:half===h?T.accent+"22":"transparent",color:half===h?T.accent:T.muted,
                  border:`1px solid ${half===h?T.accent:T.border}`,borderRadius:7,padding:"3px 7px",fontSize:10,cursor:"pointer",fontWeight:700}}>
                {h}T
              </button>
            ))}
          </div>
          <div style={{color:T.muted,fontSize:14,fontWeight:700}}>–</div>
        </div>
        <div style={{textAlign:"center",flex:1}}>
          <div style={{fontSize:10,fontWeight:700,color:awayC,marginBottom:2}}>{awayTeamData.name}</div>
          <div style={{fontSize:36,fontWeight:900,color:awayC,lineHeight:1}}>{lastScore.aScore}</div>
        </div>
      </div>
      {/* Exclusiones activas */}
      {exclusions.length>0&&(
        <div style={{display:"flex",gap:6,marginBottom:2}}>
          {exclusions.map(ex=>(
            <div key={ex.id} style={{flex:1,background:"rgba(249,115,22,.12)",border:"1px solid rgba(249,115,22,.4)",
              borderRadius:9,padding:"5px 8px",display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:ex.team==="home"?homeC:awayC,flexShrink:0}}/>
              <span style={{fontSize:10,color:T.orange,fontWeight:700,flex:1}}>
                {ex.team==="home"?homeTeam?.name||"Local":awayTeamData.name}
                {ex.player?` #${ex.player}`:""}
              </span>
              <span style={{fontSize:13,fontWeight:900,color:ex.secs<=30?T.red:T.orange}}>
                {fmtTime(ex.secs)}
              </span>
              <button onClick={()=>setExclusions(prev=>prev.filter(e=>e.id!==ex.id))}
                style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:12,padding:0}}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── KPI BAR ──
  const KPIBar=()=>(
    <div style={{display:"flex",gap:5,marginBottom:10}}>
      {[{l:"Goles",v:totals.goals,c:T.green},{l:"Ataj.",v:totals.saved,c:"#60a5fa"},{l:"Err.",v:totals.miss,c:T.red},{l:"Excl.",v:totals.excl,c:T.orange}].map(k=>(
        <div key={k.l} style={{flex:1,background:T.card,borderRadius:9,padding:"6px 2px",border:`1px solid ${T.border}`,textAlign:"center"}}>
          <div style={{fontSize:14,fontWeight:800,color:k.c,lineHeight:1}}>{k.v}</div>
          <div style={{fontSize:8,color:T.muted,marginTop:1}}>{k.l}</div>
        </div>
      ))}
      {pendingCount>0&&(
        <button onClick={()=>setRegMode("pending")}
          style={{flex:1.5,background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.35)",borderRadius:9,padding:"4px 3px",cursor:"pointer",textAlign:"center"}}>
          <div style={{fontSize:14,fontWeight:800,color:T.yellow,lineHeight:1}}>{pendingCount}</div>
          <div style={{fontSize:8,color:T.yellow,marginTop:1}}>Pend.</div>
        </button>
      )}
    </div>
  );

  // ── QUICK MODE ──
  const QuickMode=()=>{
    const teamStats=(team)=>({
      tiros:events.filter(e=>["goal","miss","saved"].includes(e.type)&&e.team===team).length,
      goals:events.filter(e=>e.type==="goal"&&e.team===team).length,
      saved:events.filter(e=>e.type==="saved"&&e.team===team).length,
      miss:events.filter(e=>e.type==="miss"&&e.team===team).length,
      excl:events.filter(e=>e.type==="exclusion"&&e.team===team).length,
      turn:events.filter(e=>e.type==="turnover"&&e.team===team).length,
    });
    const hs=teamStats("home"),as=teamStats("away");
    const pressBtn=(e)=>{e.currentTarget.style.transform="scale(.93)";};
    const releaseBtn=(e)=>{e.currentTarget.style.transform="scale(1)";};

    const TeamBlock=({team,teamData,stats})=>{
      const c=teamData?.color||T.muted;
      const name=teamData?.name||team;
      return(
        <div style={{background:c+"0c",borderRadius:16,border:`1px solid ${c}30`,padding:"11px 11px 13px",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:9,height:9,borderRadius:"50%",background:c}}/>
              <span style={{fontSize:13,fontWeight:800,color:c}}>{name}</span>
            </div>
          </div>
          {/* Zona */}
          <div style={{marginBottom:7}}>
            <div style={{fontSize:7,color:T.muted,letterSpacing:1,marginBottom:3}}>ZONA (opcional)</div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
              {Object.entries(ZONES).map(([k,z])=>(
                <button key={k} onClick={()=>setQuickZone(quickZone===k?null:k)}
                  style={{background:quickZone===k?z.color+"33":"rgba(0,0,0,.2)",border:`1px solid ${quickZone===k?z.color:"rgba(255,255,255,.08)"}`,
                    borderRadius:6,padding:"3px 6px",fontSize:8,fontWeight:700,color:quickZone===k?z.color:T.muted,cursor:"pointer"}}>
                  {z.short}
                </button>
              ))}
            </div>
          </div>
          {/* Stats */}
          <div style={{display:"flex",gap:3,marginBottom:10}}>
            {[{l:"Tiros",v:stats.tiros,c:T.text},{l:"Goles",v:stats.goals,c:T.green},{l:"Ataj.",v:stats.saved,c:"#60a5fa"},{l:"Err.",v:stats.miss,c:T.red},{l:"Excl.",v:stats.excl,c:T.orange},{l:"Pérd.",v:stats.turn,c:T.muted}].map(s=>(
              <div key={s.l} style={{flex:1,textAlign:"center",background:"rgba(0,0,0,.25)",borderRadius:7,padding:"4px 1px",border:"1px solid rgba(255,255,255,.04)"}}>
                <div style={{fontSize:13,fontWeight:800,color:s.c,lineHeight:1}}>{s.v}</div>
                <div style={{fontSize:7,color:T.muted,marginTop:1}}>{s.l}</div>
              </div>
            ))}
          </div>
          {/* Buttons */}
          <div style={{display:"flex",gap:5}}>
            {[{k:"goal",icon:"⚽",lbl:"GOL",c:T.green},{k:"saved",icon:"🧤",lbl:"ATAJ.",c:"#60a5fa"},{k:"miss",icon:"❌",lbl:"FUERA",c:T.red},{k:"turnover",icon:"🔄",lbl:"PÉRD.",c:T.muted}].map((b,i)=>(
              <button key={i} onClick={()=>quickTap(b.k,team)}
                onTouchStart={pressBtn} onTouchEnd={releaseBtn} onMouseDown={pressBtn} onMouseUp={releaseBtn}
                style={{flex:b.k==="goal"?1.25:1,background:b.k==="goal"?b.c+"28":b.c+"12",
                  border:`${b.k==="goal"?"2px":"1px"} solid ${b.c}${b.k==="goal"?"55":"28"}`,
                  borderRadius:11,padding:b.k==="goal"?"12px 5px":"10px 3px",cursor:"pointer",
                  display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"transform .1s",WebkitTapHighlightColor:"transparent"}}>
                <span style={{fontSize:b.k==="goal"?24:18,lineHeight:1}}>{b.icon}</span>
                <span style={{fontSize:b.k==="goal"?9:7,fontWeight:800,color:b.c,letterSpacing:.4}}>{b.lbl}</span>
              </button>
            ))}
          </div>
        </div>
      );
    };

    return(
      <div>
        {/* Situación */}
        <div style={{background:T.card,borderRadius:11,padding:"8px 11px",marginBottom:8,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:7,color:T.muted,letterSpacing:1,marginBottom:5}}>SITUACIÓN</div>
          <div style={{display:"flex",gap:4}}>
            {SITUATIONS.map(s=>(
              <button key={s.k} onClick={()=>setQuickSit(s.k)}
                style={{flex:1,background:quickSit===s.k?s.color+"22":"transparent",border:`1px solid ${quickSit===s.k?s.color:T.border}`,
                  borderRadius:8,padding:"5px 3px",fontSize:8,fontWeight:700,color:quickSit===s.k?s.color:T.muted,cursor:"pointer",
                  display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                <span style={{fontSize:13}}>{s.emoji}</span>
                <span>{s.l}</span>
              </button>
            ))}
          </div>
        </div>
        <TeamBlock team="home" teamData={homeTeam} stats={hs}/>
        <TeamBlock team="away" teamData={awayTeamData} stats={as}/>
        {/* Discipline */}
        <div style={{marginBottom:10}}>
          <SectionLabel>EVENTOS GENERALES</SectionLabel>
          <div style={{display:"flex",gap:5}}>
            {[{k:"exclusion",l:"⏱ Excl.",c:T.orange},{k:"timeout",l:"⏸ T.Muerto",c:T.yellow},{k:"red_card",l:"🟥 Roja",c:T.red},{k:"half_time",l:"🔔 Desc.",c:T.purple}].map(b=>(
              <button key={b.k} onClick={()=>{upd("type",b.k);upd("minute",String(minute));setStep("disc_quick");}}
                style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 3px",color:b.c,fontWeight:700,fontSize:9,cursor:"pointer",
                  display:"flex",flexDirection:"column",alignItems:"center",gap:2,textAlign:"center"}}>
                <span style={{fontSize:13}}>{b.l.split(" ")[0]}</span>
                <span style={{fontSize:7}}>{b.l.split(" ").slice(1).join(" ")}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Recent events */}
        {events.length>0&&(
          <div>
            <SectionLabel>ÚLTIMOS EVENTOS</SectionLabel>
            {[...events].reverse().slice(0,5).map(ev=>(
              <EventCard key={ev.id} ev={ev} homeColor={homeC} awayColor={awayC} homeName={homeTeam?.name||"Local"} awayName={awayTeamData.name} onDelete={deleteEvent}/>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── FULL MODE ──
  const FullMode=()=>{
    const currentTeam=lForm.team==="home"?homeTeam:awayTeamData;
    const opponentTeam=lForm.team==="home"?awayTeamData:homeTeam;
    const isShot=["goal","miss","saved"].includes(lForm.type);
    const resultColor=lForm.type==="goal"?T.green:lForm.type==="saved"?"#60a5fa":T.red;
    const canSubmit=lForm.zone&&lForm.quadrant!=null&&lForm.shooter;
    return(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <MiniCourt onZoneClick={(z)=>lupd("zone",z)} selZone={lForm.zone} heatCounts={heatCounts}/>
        <div>
          <SectionLabel>TIPO DE EVENTO</SectionLabel>
          <div style={{display:"flex",gap:6}}>
            {[{k:"shot",l:"🎯 Tiro"},{k:"disc",l:"🃏 Evento"}].map(t=>{
              const isShotMode=["goal","miss","saved"].includes(lForm.type);
              const active=t.k==="shot"?isShotMode:!isShotMode;
              return <button key={t.k} onClick={()=>{if(t.k==="shot")lupd("type","goal");else lupd("type","exclusion");}}
                style={{flex:1,background:active?T.accent+"22":T.card2,color:active?T.accent:T.muted,
                  border:`1px solid ${active?T.accent:T.border}`,borderRadius:10,padding:"11px",fontWeight:700,fontSize:13,cursor:"pointer"}}>{t.l}</button>;
            })}
          </div>
        </div>
        {isShot?(
          <>
            <div><SectionLabel>RESULTADO</SectionLabel>
              <div style={{display:"flex",gap:6}}>
                {[{k:"goal",l:"⚽ GOL",c:T.green},{k:"saved",l:"🧤 ATAJADO",c:"#60a5fa"},{k:"miss",l:"❌ ERRADO",c:T.red}].map(r=>(
                  <button key={r.k} onClick={()=>lupd("type",r.k)}
                    style={{flex:1,background:lForm.type===r.k?r.c+"22":T.card2,color:lForm.type===r.k?r.c:T.muted,
                      border:`1.5px solid ${lForm.type===r.k?r.c:T.border}`,borderRadius:11,padding:"11px 4px",fontWeight:700,fontSize:12,cursor:"pointer"}}>{r.l}</button>
                ))}
              </div>
            </div>
            <div><SectionLabel>EQUIPO</SectionLabel>
              <div style={{display:"flex",gap:6}}>
                {[{k:"home",name:homeTeam?.name||"Local",color:homeC},{k:"away",name:awayTeamData.name,color:awayC}].map(t=>(
                  <button key={t.k} onClick={()=>lupd("team",t.k)}
                    style={{flex:1,background:lForm.team===t.k?t.color+"22":T.card2,color:lForm.team===t.k?t.color:T.muted,
                      border:`1.5px solid ${lForm.team===t.k?t.color:T.border}`,borderRadius:11,padding:"11px",fontWeight:700,fontSize:13,cursor:"pointer"}}>{t.name}</button>
                ))}
              </div>
            </div>
            <div><SectionLabel>MINUTO</SectionLabel>
              <input type="number" value={lForm.minute} onChange={e=>lupd("minute",e.target.value)} min="1" max="60"
                style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 14px",color:T.text,fontSize:15,fontWeight:800,width:"100%"}}/>
            </div>
            <QuadrantPicker value={lForm.quadrant} onChange={(q)=>lupd("quadrant",q)} resultColor={resultColor}/>
            <PlayerPicker players={(currentTeam?.players||[]).filter(p=>p.position!=="Arquero"&&p.pos!=="Arquero")} value={lForm.shooter}
              onChange={v=>lupd("shooter",v)} label={`JUGADOR QUE LANZÓ (${currentTeam?.name||""})`} accent={currentTeam?.color||T.accent}/>
            <PlayerPicker players={opponentTeam?.players||[]} value={lForm.goalkeeper}
              onChange={v=>lupd("goalkeeper",v)} label={`ARQUERO (${opponentTeam?.name||"Rival"})`} accent="#60a5fa"/>
            {/* Análisis avanzado */}
            <div style={{background:T.card2,borderRadius:12,padding:"12px",border:`1px solid ${T.border}`}}>
              <div style={{fontSize:9,color:T.accent,letterSpacing:2,marginBottom:10,fontWeight:700}}>ANÁLISIS AVANZADO</div>
              <div style={{marginBottom:10}}>
                <SectionLabel>DISTANCIA</SectionLabel>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {DISTANCES.map(d=>(
                    <button key={d.k} onClick={()=>lupd("distance",lForm.distance===d.k?null:d.k)}
                      style={{flex:1,minWidth:"17%",background:lForm.distance===d.k?T.accent+"22":"rgba(0,0,0,.2)",
                        border:`1px solid ${lForm.distance===d.k?T.accent:T.border}`,borderRadius:8,padding:"5px 2px",fontSize:8,fontWeight:700,
                        color:lForm.distance===d.k?T.accent:T.muted,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                      <span>{d.emoji}</span><span>{d.l}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <SectionLabel>SITUACIÓN</SectionLabel>
                <div style={{display:"flex",gap:5}}>
                  {SITUATIONS.map(s=>(
                    <button key={s.k} onClick={()=>lupd("situation",s.k)}
                      style={{flex:1,background:lForm.situation===s.k?s.color+"22":"rgba(0,0,0,.2)",
                        border:`1px solid ${lForm.situation===s.k?s.color:T.border}`,borderRadius:8,padding:"6px 2px",fontSize:8,fontWeight:700,
                        color:lForm.situation===s.k?s.color:T.muted,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                      <span style={{fontSize:12}}>{s.emoji}</span><span>{s.l}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel>TIPO DE LANZAMIENTO</SectionLabel>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {THROW_TYPES.map(t=>(
                    <button key={t.k} onClick={()=>lupd("throwType",lForm.throwType===t.k?null:t.k)}
                      style={{flex:1,minWidth:"17%",background:lForm.throwType===t.k?T.yellow+"22":"rgba(0,0,0,.2)",
                        border:`1px solid ${lForm.throwType===t.k?T.yellow:T.border}`,borderRadius:8,padding:"5px 2px",fontSize:8,fontWeight:700,
                        color:lForm.throwType===t.k?T.yellow:T.muted,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                      <span>{t.emoji}</span><span>{t.l}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Btn onClick={lSubmit} disabled={!canSubmit} color={T.accent}>✓ Registrar tiro</Btn>
          </>
        ):(
          <>
            <div><SectionLabel>TIPO DE SANCIÓN</SectionLabel>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {[{k:"exclusion",l:"⏱ Exclusión 2'",c:T.orange},{k:"timeout",l:"⏸ Tiempo Muerto",c:T.yellow},{k:"red_card",l:"🟥 Tarjeta Roja",c:T.red},{k:"half_time",l:"🔔 Descanso",c:T.purple}].map(s=>(
                  <button key={s.k} onClick={()=>lupd("type",s.k)}
                    style={{background:lForm.type===s.k?s.c+"22":T.card2,color:lForm.type===s.k?s.c:T.muted,
                      border:`1.5px solid ${lForm.type===s.k?s.c:T.border}`,borderRadius:11,padding:"10px",fontWeight:700,fontSize:11,cursor:"pointer"}}>{s.l}</button>
                ))}
              </div>
            </div>
            <div><SectionLabel>EQUIPO</SectionLabel>
              <div style={{display:"flex",gap:6}}>
                {[{k:"home",name:homeTeam?.name||"Local",color:homeC},{k:"away",name:awayTeamData.name,color:awayC}].map(t=>(
                  <button key={t.k} onClick={()=>lupd("team",t.k)}
                    style={{flex:1,background:lForm.team===t.k?t.color+"22":T.card2,color:lForm.team===t.k?t.color:T.muted,
                      border:`1.5px solid ${lForm.team===t.k?t.color:T.border}`,borderRadius:11,padding:"11px",fontWeight:700,fontSize:13,cursor:"pointer"}}>{t.name}</button>
                ))}
              </div>
            </div>
            <div><SectionLabel>MINUTO</SectionLabel>
              <input type="number" value={lForm.minute} onChange={e=>lupd("minute",e.target.value)} min="1" max="60"
                style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 14px",color:T.text,fontSize:15,fontWeight:800,width:"100%"}}/>
            </div>
            {lForm.type!=="timeout"&&lForm.type!=="half_time"&&(
              <PlayerPicker players={currentTeam?.players||[]} value={lForm.sanctioned}
                onChange={v=>lupd("sanctioned",v)} label="JUGADOR SANCIONADO" accent={EV_TYPES[lForm.type]?.color}/>
            )}
            <Btn onClick={lSubmitDisc} color={EV_TYPES[lForm.type]?.color||T.accent}>✓ Confirmar {EV_TYPES[lForm.type]?.label}</Btn>
          </>
        )}
        {events.length>0&&(
          <div>
            <SectionLabel>ÚLTIMOS EVENTOS</SectionLabel>
            {[...events].reverse().slice(0,5).map(ev=>(
              <EventCard key={ev.id} ev={ev} homeColor={homeC} awayColor={awayC} homeName={homeTeam?.name||"Local"} awayName={awayTeamData.name} onDelete={deleteEvent}/>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── PENDING MODE ──
  const PendingMode=()=>{
    const pending=events.filter(e=>!e.completed&&["goal","miss","saved"].includes(e.type));
    const done=events.filter(e=>e.completed&&["goal","miss","saved"].includes(e.type));
    return(
      <div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <button onClick={()=>setRegMode("quick")} style={{background:"transparent",border:"none",color:T.muted,fontSize:13,cursor:"pointer",padding:0}}>← Volver</button>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:800,color:T.text}}>📋 Completar datos</div>
            <div style={{fontSize:11,color:T.muted}}>{pending.length} pendientes · {done.length} completos</div>
          </div>
        </div>
        {pending.length===0?(
          <div style={{textAlign:"center",padding:"30px 0",color:T.green}}>
            <div style={{fontSize:40,marginBottom:10}}>✅</div>
            <div style={{fontSize:14,fontWeight:700,color:T.text}}>¡Todo completado!</div>
          </div>
        ):pending.map(ev=>(
          <div key={ev.id} style={{background:T.card,borderRadius:12,border:`1px solid ${T.border}`,padding:"12px 13px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                <span style={{fontSize:14}}>{EV_TYPES[ev.type]?.icon}</span>
                <span style={{fontSize:12,fontWeight:700,color:T.text}}>{EV_TYPES[ev.type]?.label}</span>
                <Badge label={`Min ${ev.min}`} color={T.muted}/>
              </div>
              <div style={{fontSize:11,color:T.muted}}>{ev.team==="home"?homeTeam?.name||"Local":awayTeamData.name}</div>
            </div>
            <button onClick={()=>openComplete(ev)}
              style={{background:T.yellow+"22",border:`1px solid ${T.yellow}44`,color:T.yellow,borderRadius:9,padding:"8px 12px",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}}>
              Completar →
            </button>
          </div>
        ))}
      </div>
    );
  };

  return(
    <div>
      {/* Header */}
      <div style={{marginBottom:10}}>
        <div style={{fontSize:10,color:T.accent,letterSpacing:3,textTransform:"uppercase",marginBottom:3}}>Partido en Vivo</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:19,fontWeight:800,color:T.text}}>Registrar</div>
            <div style={{fontSize:11,color:T.muted}}>{homeTeam?.name||"Local"} vs {awayTeamData.name}</div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {matchStatus==="live"&&regMode!=="pending"&&(
              <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:11,padding:3,display:"flex",gap:3}}>
                {[{k:"quick",l:"⚡"},{k:"full",l:"📋"}].map(m=>(
                  <button key={m.k} onClick={()=>setRegMode(m.k)}
                    style={{background:regMode===m.k?T.accent:"transparent",color:regMode===m.k?"#fff":T.muted,
                      border:"none",borderRadius:8,padding:"6px 10px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    {m.l}
                  </button>
                ))}
              </div>
            )}
            {matchStatus==="live"&&(
              <button onClick={onCloseMatch}
                style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.4)",color:"#fca5a5",borderRadius:9,padding:"7px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                🏁 Cerrar
              </button>
            )}
          </div>
        </div>
      </div>

      {matchStatus==="idle"?(
        <div style={{textAlign:"center",padding:"40px 20px"}}>
          <div style={{fontSize:44,marginBottom:12}}>🤾</div>
          <div style={{fontSize:16,fontWeight:800,color:T.text,marginBottom:6}}>Sin partido en curso</div>
          <div style={{fontSize:12,color:T.muted,marginBottom:20}}>Iniciá un nuevo partido desde la pestaña Partidos.</div>
          <Btn onClick={onStartMatch} color={T.accent}>+ Nuevo partido</Btn>
        </div>
      ):(
        <>
          <Scoreboard/>
          <KPIBar/>
          {regMode==="quick"&&<QuickMode/>}
          {regMode==="full"&&<FullMode/>}
          {regMode==="pending"&&<PendingMode/>}
        </>
      )}

      {/* Modal ShotModal (completar/registrar desde quick) */}
      {step==="shot_detail"&&(
        <Modal title={completingId?"📋 Completar tiro":"🎯 Detalles del tiro"} onClose={()=>{setStep(null);setCompletingId(null);}}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",gap:6}}>
              {[{k:"goal",l:"⚽ GOL",c:T.green},{k:"saved",l:"🧤 ATAJADO",c:"#60a5fa"},{k:"miss",l:"❌ ERRADO",c:T.red}].map(r=>(
                <button key={r.k} onClick={()=>upd("type",r.k)}
                  style={{flex:1,background:form.type===r.k?r.c+"22":T.card2,color:form.type===r.k?r.c:T.muted,border:`1.5px solid ${form.type===r.k?r.c:T.border}`,borderRadius:10,padding:"10px 4px",fontWeight:700,fontSize:11,cursor:"pointer"}}>{r.l}</button>
              ))}
            </div>
            <MiniCourt onZoneClick={z=>upd("zone",z)} selZone={form.zone} heatCounts={heatCounts}/>
            <QuadrantPicker value={form.quadrant} onChange={q=>upd("quadrant",q)} resultColor={form.type==="goal"?T.green:form.type==="saved"?"#60a5fa":T.red}/>
            <PlayerPicker players={(form.team==="home"?homeTeam?.players||[]:awayTeamData.players||[]).filter(p=>p.position!=="Arquero"&&p.pos!=="Arquero")} value={form.shooter} onChange={v=>upd("shooter",v)} label="JUGADOR" accent={form.team==="home"?homeC:awayC}/>
            <PlayerPicker players={form.team==="home"?awayTeamData.players||[]:homeTeam?.players||[]} value={form.goalkeeper} onChange={v=>upd("goalkeeper",v)} label="ARQUERO RIVAL" accent="#60a5fa"/>
            <Btn onClick={submitFull} disabled={!form.zone||form.quadrant==null} color={T.accent}>✓ Confirmar</Btn>
          </div>
        </Modal>
      )}
      {step==="disc_quick"&&(
        <Modal title="⚠️ Evento disciplinario" onClose={()=>setStep(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",gap:6}}>
              {[{k:"home",name:homeTeam?.name||"Local",color:homeC},{k:"away",name:awayTeamData.name,color:awayC}].map(t=>(
                <button key={t.k} onClick={()=>upd("team",t.k)}
                  style={{flex:1,background:form.team===t.k?t.color+"22":T.card2,color:form.team===t.k?t.color:T.muted,border:`1.5px solid ${form.team===t.k?t.color:T.border}`,borderRadius:10,padding:"10px",fontWeight:700,fontSize:12,cursor:"pointer"}}>{t.name}</button>
              ))}
            </div>
            {form.type!=="timeout"&&form.type!=="half_time"&&(
              <PlayerPicker players={form.team==="home"?homeTeam?.players||[]:awayTeamData.players||[]} value={form.sanctioned} onChange={v=>upd("sanctioned",v)} label="JUGADOR SANCIONADO" accent={EV_TYPES[form.type]?.color}/>
            )}
            <Btn onClick={submitDisc} color={EV_TYPES[form.type]?.color||T.accent}>✓ Confirmar {EV_TYPES[form.type]?.label}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  MATCHES PAGE
// ═══════════════════════════════════════════════════
function MatchesPage({matchStatus,liveMatchInfo,liveScore,completedMatches,setEvoMatch,setShowEvo,setStatsMatch,deleteMatch,reopenMatch,onNewMatch,setTab,liveHomeTeam}){
  const myTeam=liveHomeTeam?.name||"Mi equipo";
  const seasonStats=useMemo(()=>{
    let w=0,d=0,l=0,gf=0,ga=0;
    completedMatches.forEach(m=>{
      const isHome=m.home===myTeam;
      const isAway=m.away===myTeam;
      if(!isHome&&!isAway)return;
      const myG=isHome?m.hs:m.as,oppG=isHome?m.as:m.hs;
      gf+=myG;ga+=oppG;
      if(myG>oppG)w++;else if(myG===oppG)d++;else l++;
    });
    return{w,d,l,gf,ga,pts:w*2+d};
  },[completedMatches,myTeam]);

  return(
    <div>
      <style>{`@keyframes blkR{0%,100%{opacity:1}50%{opacity:.2}}`}</style>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:10,color:T.accent,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>Handball Pro v8</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:22,fontWeight:800,color:T.text}}>Partidos</div>
          {matchStatus==="idle"&&<Btn onClick={onNewMatch} color={T.accent} style={{width:"auto",padding:"8px 14px",fontSize:12}}>+ Nuevo</Btn>}
        </div>
        <div style={{fontSize:12,color:T.muted}}>Temporada 2025</div>
      </div>

      {/* Season summary */}
      {completedMatches.length>0&&(
        <Card style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:T.text,marginBottom:8}}>📊 {myTeam} — Temporada</div>
          <div style={{display:"flex",gap:5,marginBottom:8}}>
            {[{l:"PJ",v:seasonStats.w+seasonStats.d+seasonStats.l,c:T.text},{l:"G",v:seasonStats.w,c:T.green},{l:"E",v:seasonStats.d,c:T.yellow},{l:"P",v:seasonStats.l,c:T.red},{l:"GF",v:seasonStats.gf,c:T.text},{l:"GC",v:seasonStats.ga,c:T.muted},{l:"Pts",v:seasonStats.pts,c:T.accent}].map(k=>(
              <div key={k.l} style={{flex:1,textAlign:"center",background:T.card2,borderRadius:7,padding:"5px 2px",border:`1px solid ${T.border}`}}>
                <div style={{fontSize:12,fontWeight:800,color:k.c,lineHeight:1}}>{k.v}</div>
                <div style={{fontSize:7,color:T.muted,marginTop:1}}>{k.l}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:4}}>
            {[...completedMatches].slice(0,6).reverse().map((m,i)=>{
              const isHome=m.home===myTeam,isAway=m.away===myTeam;
              if(!isHome&&!isAway)return null;
              const myG=isHome?m.hs:m.as,oppG=isHome?m.as:m.hs;
              const res=myG>oppG?"W":myG===oppG?"D":"L";
              const col=res==="W"?T.green:res==="D"?T.yellow:T.red;
              return<div key={i} style={{width:26,height:26,borderRadius:"50%",background:col+"22",border:`2px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:9,fontWeight:800,color:col}}>{res}</span>
              </div>;
            })}
          </div>
        </Card>
      )}

      {/* Live */}
      {matchStatus==="live"&&(
        <div style={{background:"linear-gradient(135deg,#7f1d1d,#991b1b)",borderRadius:14,padding:"12px 14px",marginBottom:12,border:"1px solid #ef444444"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:T.red,display:"inline-block",animation:"blkR 1.2s infinite"}}/>
            <span style={{fontSize:10,color:T.red,fontWeight:700,letterSpacing:2}}>EN VIVO</span>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{textAlign:"center",flex:1}}>
              <div style={{fontSize:11,fontWeight:700,color:"#fff",marginBottom:1}}>{liveMatchInfo.home}</div>
              <div style={{fontSize:34,fontWeight:900,color:"#fff"}}>{liveScore.h}</div>
            </div>
            <div style={{color:"rgba(255,255,255,.4)",fontSize:13}}>VS</div>
            <div style={{textAlign:"center",flex:1}}>
              <div style={{fontSize:11,fontWeight:700,color:"#fff",marginBottom:1}}>{liveMatchInfo.away}</div>
              <div style={{fontSize:34,fontWeight:900,color:"#fff"}}>{liveScore.a}</div>
            </div>
          </div>
          <button onClick={()=>setTab("register")} style={{width:"100%",background:"rgba(239,68,68,.25)",border:"1px solid rgba(239,68,68,.5)",color:"#fca5a5",borderRadius:10,padding:"9px",fontWeight:700,fontSize:12,cursor:"pointer"}}>
            ➕ Ir a Registrar
          </button>
        </div>
      )}

      {matchStatus==="idle"&&completedMatches.length===0&&(
        <div style={{background:T.card,borderRadius:14,border:`1px dashed ${T.border}`,padding:"24px",marginBottom:12,textAlign:"center"}}>
          <div style={{fontSize:28,marginBottom:6}}>🤾</div>
          <div style={{fontSize:13,fontWeight:700,color:T.muted,marginBottom:10}}>Sin partidos aún</div>
          <Btn onClick={onNewMatch} color={T.accent}>+ Nuevo partido</Btn>
        </div>
      )}

      {completedMatches.length>0&&(
        <>
          <div style={{fontSize:9,color:T.muted,letterSpacing:2,marginBottom:7,textTransform:"uppercase"}}>HISTORIAL</div>
          {completedMatches.map((m)=>{
            const isHome=m.home===myTeam,isAway=m.away===myTeam;
            const myG=isHome?m.hs:m.as,oppG=isHome?m.as:m.hs;
            const res=isHome||isAway?(myG>oppG?"W":myG===oppG?"D":"L"):null;
            const resCol=res==="W"?T.green:res==="D"?T.yellow:T.red;
            return(
              <Card key={m.id} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{display:"flex",gap:5,alignItems:"center"}}>
                    <span style={{fontSize:10,color:T.muted}}>{m.date}</span>
                    {m.competition&&<Badge label={m.competition} color={T.accent}/>}
                  </div>
                  <div style={{display:"flex",gap:5,alignItems:"center"}}>
                    {res&&<div style={{width:20,height:20,borderRadius:"50%",background:resCol+"22",border:`1.5px solid ${resCol}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:8,fontWeight:800,color:resCol}}>{res}</span>
                    </div>}
                    <Badge label="Final" color={T.green}/>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <div style={{flex:1,textAlign:"center"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3,marginBottom:2}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:m.hc||T.accent}}/>
                      <span style={{fontSize:11,fontWeight:700,color:T.text}}>{m.home}</span>
                    </div>
                    <div style={{fontSize:24,fontWeight:900,color:m.hs>m.as?T.text:T.muted}}>{m.hs}</div>
                  </div>
                  <div style={{color:T.muted,fontSize:12,fontWeight:700}}>–</div>
                  <div style={{flex:1,textAlign:"center"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3,marginBottom:2}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:m.ac||T.muted}}/>
                      <span style={{fontSize:11,fontWeight:700,color:T.text}}>{m.away}</span>
                    </div>
                    <div style={{fontSize:24,fontWeight:900,color:m.as>m.hs?T.text:T.muted}}>{m.as}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:4}}>
                  <button onClick={()=>setStatsMatch&&setStatsMatch(m)} style={{flex:1,background:T.accent+"15",color:T.accent,border:`1px solid ${T.accent}33`,borderRadius:8,padding:"6px",fontSize:9,fontWeight:700,cursor:"pointer"}}>📊 Stats</button>
                  <button onClick={()=>{setEvoMatch(m);setShowEvo(true);}} style={{flex:1,background:T.card2,color:T.muted,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px",fontSize:9,fontWeight:600,cursor:"pointer"}}>📈 Evolución</button>
                  <button onClick={()=>reopenMatch&&reopenMatch(m)} style={{flex:1,background:T.yellow+"15",color:T.yellow,border:`1px solid ${T.yellow}33`,borderRadius:8,padding:"6px",fontSize:9,fontWeight:600,cursor:"pointer"}}>✏️ Reabrir</button>
                  <button onClick={()=>{if(window.confirm(`¿Eliminar ${m.home} vs ${m.away}?`))deleteMatch&&deleteMatch(m.id);}} style={{background:T.red+"15",color:T.red,border:`1px solid ${T.red}33`,borderRadius:8,padding:"6px 9px",fontSize:11,cursor:"pointer"}}>🗑</button>
                </div>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  DB HELPERS
// ═══════════════════════════════════════════════════
const mapDbEvent=(e)=>({
  id:e.id,min:e.minute,team:e.team,type:e.type,zone:e.zone,quadrant:e.quadrant,
  attackSide:e.attack_side,distance:e.distance||null,situation:e.situation||null,throwType:e.throw_type||null,
  shooter:e.shooter_name?{name:e.shooter_name,number:e.shooter_number}:null,
  goalkeeper:e.goalkeeper_name?{name:e.goalkeeper_name,number:e.goalkeeper_number}:null,
  sanctioned:e.sanctioned_name?{name:e.sanctioned_name,number:e.sanctioned_number}:null,
  hScore:e.h_score,aScore:e.a_score,completed:e.completed,quickMode:e.quick_mode,
});
const mapDbMatch=(m)=>({
  id:m.id,home:m.home_name,away:m.away_name,hs:m.home_score,as:m.away_score,
  date:m.match_date||"",hc:m.home_color,ac:m.away_color,competition:m.competition||"",
  events:(m.events||[]).map(mapDbEvent).sort((a,b)=>a.min-b.min),
});

// ═══════════════════════════════════════════════════
//  NAV
// ═══════════════════════════════════════════════════
const NAV=[
  {k:"matches",icon:"🗓",label:"Partidos"},
  {k:"teams",  icon:"👥",label:"Equipos"},
  {k:"register",icon:"➕",label:"Registrar"},
  {k:"stats",  icon:"📊",label:"Stats"},
  {k:"ai",     icon:"🤖",label:"IA"},
];

// ═══════════════════════════════════════════════════
//  APP
// ═══════════════════════════════════════════════════
export default function App(){
  const [tab,setTab]                   = useState("matches");
  const [showEvo,setShowEvo]           = useState(false);
  const [evoMatch,setEvoMatch]         = useState(null);
  const [statsMatch,setStatsMatch]     = useState(null);

  // Teams
  const [teams,setTeams]               = useState([]);
  const [selTeamId,setSelTeamId]       = useState(null);

  // Live match
  const [liveEvents,setLiveEvents]     = useState([]);
  const [matchStatus,setMatchStatus]   = useState("idle");
  const [liveMatchInfo,setLiveMatchInfo] = useState({home:"",away:"",date:null,competition:"Liga"});
  const [liveMatchId,setLiveMatchId]   = useState(null);
  const [awayPlayers,setAwayPlayers]   = useState([]);
  const [completedMatches,setCompletedMatches] = useState([]);
  const [showNewMatch,setShowNewMatch] = useState(false);
  const [showCloseConfirm,setShowCloseConfirm] = useState(false);
  const [dbLoading,setDbLoading]       = useState(true);

  const homeTeam = teams.find(t=>t.id===selTeamId)||teams[0]||null;

  const liveScore=useMemo(()=>{
    const last=liveEvents.filter(e=>e.hScore!=null).slice(-1)[0];
    return last?{h:last.hScore,a:last.aScore}:{h:0,a:0};
  },[liveEvents]);

  // ── LOAD ──
  useEffect(()=>{
    const load=async()=>{
      try{
        // localStorage backup
        const localMatch=localStorage.getItem("hb_live_match");
        const localEvents=localStorage.getItem("hb_live_events");
        if(localMatch){
          const m=JSON.parse(localMatch);
          const evs=localEvents?JSON.parse(localEvents):[];
          setLiveMatchInfo({home:m.home,away:m.away,date:null,competition:m.competition||"Liga"});
          setLiveMatchId(m.id||null);
          setLiveEvents(evs);
          setMatchStatus("live");
          if(m.selTeamId)setSelTeamId(m.selTeamId);
        }
        // Teams with players
        const {data:teamsData}=await supabase.from("teams").select("*, players(*)").order("created_at");
        if(teamsData?.length){
          setTeams(teamsData.map(t=>({...t,players:t.players||[]})));
          if(!selTeamId&&!localMatch)setSelTeamId(teamsData[0].id);
        }
        // Closed matches
        const {data:closed}=await supabase.from("matches").select("*, events(*)").eq("status","closed").order("created_at",{ascending:false}).limit(50);
        if(closed?.length)setCompletedMatches(closed.map(mapDbMatch));
        // Live match from DB
        if(!localMatch){
          const {data:live}=await supabase.from("matches").select("*, events(*)").eq("status","live").order("created_at",{ascending:false}).limit(1).maybeSingle();
          if(live){
            const evs=(live.events||[]).map(mapDbEvent).sort((a,b)=>a.min-b.min);
            setLiveMatchId(live.id);
            setLiveMatchInfo({home:live.home_name,away:live.away_name,date:null,competition:live.competition||"Liga"});
            setLiveEvents(evs);
            setMatchStatus("live");
            setTab("register");
            localStorage.setItem("hb_live_match",JSON.stringify({id:live.id,home:live.home_name,away:live.away_name,competition:live.competition}));
            localStorage.setItem("hb_live_events",JSON.stringify(evs));
          }
        }
      }catch(e){console.warn("load error",e);}
      finally{setDbLoading(false);}
    };
    load();
  },[]);

  // Sync localStorage
  useEffect(()=>{
    if(matchStatus==="live")localStorage.setItem("hb_live_events",JSON.stringify(liveEvents));
  },[liveEvents,matchStatus]);
  useEffect(()=>{
    if(matchStatus==="live"&&liveMatchInfo.home)
      localStorage.setItem("hb_live_match",JSON.stringify({id:liveMatchId,home:liveMatchInfo.home,away:liveMatchInfo.away,competition:liveMatchInfo.competition,selTeamId}));
    if(matchStatus==="idle"){
      localStorage.removeItem("hb_live_match");
      localStorage.removeItem("hb_live_events");
    }
  },[matchStatus,liveMatchInfo,liveMatchId,selTeamId]);

  const onTeamUpdated=useCallback((t)=>{
    setTeams(prev=>prev.map(x=>x.id===t.id?t:x));
  },[]);

  // ── START MATCH ──
  const startMatch=useCallback(async(opts)=>{
    const {teamId,awayName,competition,round,rivalPlayers=[]}=opts;
    const team=teams.find(t=>t.id===teamId)||homeTeam;
    let matchId=null;
    try{
      const {data}=await supabase.from("matches").insert({
        home_name:team?.name||"Local",away_name:awayName,
        home_color:team?.color||T.accent,away_color:"#64748b",
        status:"live",competition:competition||"Liga",round:round||null,
      }).select().single();
      if(data)matchId=data.id;
    }catch(e){console.warn(e);}

    // Guardar/actualizar rival y sus jugadores
    let loadedPlayers=rivalPlayers;
    if(awayName.trim()){
      try{
        // Buscar o crear equipo rival
        let {data:rival}=await supabase.from("rival_teams")
          .select("*, rival_players(*)")
          .ilike("name",awayName.trim())
          .maybeSingle();
        if(!rival){
          const {data:newRival}=await supabase.from("rival_teams")
            .insert({name:awayName.trim()}).select().single();
          rival=newRival;
        }
        // Guardar jugadores nuevos
        if(rival?.id&&rivalPlayers.length>0){
          const existing=(rival.rival_players||[]).map(p=>p.number);
          const toInsert=rivalPlayers.filter(p=>!existing.includes(p.number));
          if(toInsert.length>0){
            await supabase.from("rival_players").insert(
              toInsert.map(p=>({rival_team_id:rival.id,name:p.name,number:p.number,position:p.position||"Campo"}))
            );
          }
          // Recargar jugadores completos
          const {data:allP}=await supabase.from("rival_players").select("*").eq("rival_team_id",rival.id);
          loadedPlayers=allP||rivalPlayers;
        } else if(rival?.rival_players?.length){
          loadedPlayers=rival.rival_players;
        }
      }catch(e){console.warn(e);}
    }

    setAwayPlayers(loadedPlayers);
    if(matchId)setLiveMatchId(matchId);
    setSelTeamId(teamId||selTeamId);
    setLiveMatchInfo({home:team?.name||"Local",away:awayName,date:null,competition:competition||"Liga"});
    setLiveEvents([]);
    setMatchStatus("live");
    setShowNewMatch(false);
    setTab("register");
  },[teams,homeTeam,selTeamId]);

  // ── PERSIST EVENT ──
  const persistEvent=useCallback(async(ev)=>{
    if(!liveMatchId)return ev.id;
    try{
      const {data}=await supabase.from("events").insert({
        match_id:liveMatchId,minute:ev.min,team:ev.team,type:ev.type,
        zone:ev.zone,quadrant:ev.quadrant,attack_side:ev.attackSide||null,
        distance:ev.distance||null,situation:ev.situation||null,throw_type:ev.throwType||null,
        shooter_name:ev.shooter?.name||null,shooter_number:ev.shooter?.number||null,
        goalkeeper_name:ev.goalkeeper?.name||null,goalkeeper_number:ev.goalkeeper?.number||null,
        sanctioned_name:ev.sanctioned?.name||null,sanctioned_number:ev.sanctioned?.number||null,
        h_score:ev.hScore||0,a_score:ev.aScore||0,completed:ev.completed||false,quick_mode:ev.quickMode||false,
      }).select().single();
      return data?.id||ev.id;
    }catch(e){console.warn(e);return ev.id;}
  },[liveMatchId]);

  const updatePersistedEvent=useCallback(async(id,upd)=>{
    try{await supabase.from("events").update({zone:upd.zone,quadrant:upd.quadrant,type:upd.type,
      shooter_name:upd.shooter?.name||null,shooter_number:upd.shooter?.number||null,
      goalkeeper_name:upd.goalkeeper?.name||null,goalkeeper_number:upd.goalkeeper?.number||null,completed:true,
    }).eq("id",id);}catch(e){console.warn(e);}
  },[]);

  // ── CLOSE MATCH ──
  const closeMatch=useCallback(async()=>{
    const date=new Date().toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"});
    if(liveMatchId){
      try{await supabase.from("matches").update({home_score:liveScore.h,away_score:liveScore.a,status:"closed",match_date:date}).eq("id",liveMatchId);}
      catch(e){console.warn(e);}
    }
    const nm={id:liveMatchId||Date.now(),home:liveMatchInfo.home,away:liveMatchInfo.away,
      hs:liveScore.h,as:liveScore.a,date,competition:liveMatchInfo.competition,
      hc:homeTeam?.color||T.accent,ac:"#64748b",events:[...liveEvents]};
    setCompletedMatches(prev=>[nm,...prev]);
    setLiveEvents([]);setLiveMatchId(null);setMatchStatus("idle");
    setShowCloseConfirm(false);setTab("matches");
    localStorage.removeItem("hb_live_match");localStorage.removeItem("hb_live_events");
  },[liveMatchId,liveMatchInfo,liveScore,liveEvents,homeTeam]);

  // ── DELETE MATCH ──
  const deleteMatch=useCallback(async(id)=>{
    try{await supabase.from("matches").delete().eq("id",id);}catch(e){}
    setCompletedMatches(prev=>prev.filter(m=>m.id!==id));
  },[]);

  // ── REOPEN MATCH ──
  const reopenMatch=useCallback(async(m)=>{
    try{await supabase.from("matches").update({status:"live"}).eq("id",m.id);}catch(e){}
    setLiveMatchId(m.id);
    setLiveMatchInfo({home:m.home,away:m.away,date:null,competition:m.competition||"Liga"});
    setLiveEvents([...(m.events||[])]);
    setMatchStatus("live");
    setCompletedMatches(prev=>prev.filter(x=>x.id!==m.id));
    setTab("register");
  },[]);

  // ── NEW MATCH MODAL ──
  const NewMatchModal=()=>{
    const [form,setForm]=useState({teamId:teams[0]?.id||"",awayName:"",competition:"Liga",round:""});
    const [rivalPlayers,setRivalPlayers]=useState([]);
    const [addingPlayer,setAddingPlayer]=useState(false);
    const [newP,setNewP]=useState({name:"",number:"",position:"Campo"});
    const upd=(k,v)=>setForm(f=>({...f,[k]:v}));

    // Buscar rival existente cuando cambia el nombre
    const onAwayNameChange=async(val)=>{
      upd("awayName",val);
      if(val.length>=3){
        try{
          const {data}=await supabase.from("rival_teams")
            .select("*, rival_players(*)")
            .ilike("name",`%${val}%`)
            .maybeSingle();
          if(data?.rival_players?.length){
            setRivalPlayers(data.rival_players);
          }
        }catch(e){}
      }
    };

    const addRivalPlayer=()=>{
      if(!newP.name||!newP.number)return;
      setRivalPlayers(prev=>[...prev,{id:Date.now(),name:newP.name.trim(),number:parseInt(newP.number),position:newP.position}]);
      setNewP({name:"",number:"",position:"Campo"});
      setAddingPlayer(false);
    };

    return(
      <Modal title="🤾 Nuevo Partido" onClose={()=>setShowNewMatch(false)}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <SectionLabel>MI EQUIPO</SectionLabel>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {teams.map(t=>(
                <button key={t.id} onClick={()=>upd("teamId",t.id)}
                  style={{background:form.teamId===t.id?t.color+"22":T.card2,color:form.teamId===t.id?t.color:T.muted,
                    border:`1.5px solid ${form.teamId===t.id?t.color:T.border}`,borderRadius:10,padding:"9px 13px",fontWeight:700,fontSize:13,cursor:"pointer",
                    display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:t.color}}/>
                  {t.name}
                </button>
              ))}
              {teams.length===0&&<span style={{fontSize:12,color:T.muted}}>Creá un equipo primero en la pestaña 👥</span>}
            </div>
          </div>
          <div>
            <SectionLabel>RIVAL</SectionLabel>
            <input value={form.awayName} onChange={e=>onAwayNameChange(e.target.value)}
              placeholder="Nombre del equipo rival"
              style={{width:"100%",background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 14px",color:T.text,fontSize:14,boxSizing:"border-box"}}/>
          </div>
          {/* Plantel rival opcional */}
          {form.awayName.trim().length>0&&(
            <div style={{background:T.card2,borderRadius:11,border:`1px solid ${T.border}`,padding:"10px 12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:rivalPlayers.length>0?8:0}}>
                <SectionLabel>PLANTEL RIVAL (opcional)</SectionLabel>
                <button onClick={()=>setAddingPlayer(!addingPlayer)}
                  style={{background:T.accent+"22",border:`1px solid ${T.accent}44`,color:T.accent,borderRadius:8,padding:"4px 10px",fontSize:10,fontWeight:700,cursor:"pointer"}}>
                  + Agregar
                </button>
              </div>
              {rivalPlayers.length>0&&(
                <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                  {rivalPlayers.map((p,i)=>(
                    <div key={p.id||i} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"4px 8px",fontSize:10,color:T.text,display:"flex",alignItems:"center",gap:5}}>
                      <span style={{color:T.muted,fontWeight:700}}>#{p.number}</span> {p.name}
                      <button onClick={()=>setRivalPlayers(prev=>prev.filter((_,j)=>j!==i))}
                        style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:11,padding:0}}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              {addingPlayer&&(
                <div style={{display:"flex",gap:6,marginTop:6}}>
                  <input value={newP.number} onChange={e=>setNewP(f=>({...f,number:e.target.value}))}
                    placeholder="#" type="number"
                    style={{width:50,background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 8px",color:T.text,fontSize:12,boxSizing:"border-box"}}/>
                  <input value={newP.name} onChange={e=>setNewP(f=>({...f,name:e.target.value}))}
                    placeholder="Nombre"
                    style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 10px",color:T.text,fontSize:12,boxSizing:"border-box"}}/>
                  <button onClick={addRivalPlayer}
                    style={{background:T.green,border:"none",color:"#fff",borderRadius:8,padding:"7px 12px",fontWeight:700,fontSize:12,cursor:"pointer"}}>✓</button>
                </div>
              )}
              {rivalPlayers.length===0&&!addingPlayer&&(
                <div style={{fontSize:10,color:T.muted}}>Sin plantel — podés agregar jugadores para el análisis completo</div>
              )}
            </div>
          )}
          <div>
            <SectionLabel>COMPETENCIA</SectionLabel>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {COMPETITIONS.map(c=>(
                <button key={c} onClick={()=>upd("competition",c)}
                  style={{background:form.competition===c?T.accent+"22":T.card2,color:form.competition===c?T.accent:T.muted,
                    border:`1px solid ${form.competition===c?T.accent:T.border}`,borderRadius:9,padding:"7px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <SectionLabel>JORNADA / FECHA (opcional)</SectionLabel>
            <input value={form.round} onChange={e=>upd("round",e.target.value)}
              placeholder="Ej: Jornada 5, Final, etc."
              style={{width:"100%",background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 14px",color:T.text,fontSize:13,boxSizing:"border-box"}}/>
          </div>
          <Btn onClick={()=>startMatch({...form,rivalPlayers})} disabled={!form.teamId||!form.awayName.trim()} color={T.accent}>
            ▶ Iniciar partido
          </Btn>
        </div>
      </Modal>
    );
  };

  const content=()=>{
    if(dbLoading)return(
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:14}}>
        <div style={{width:36,height:36,borderRadius:"50%",border:`3px solid ${T.border}`,borderTop:`3px solid ${T.accent}`,animation:"spin 1s linear infinite"}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span style={{fontSize:13,color:T.muted}}>Cargando...</span>
      </div>
    );
    if(showEvo)return <EvolutionPage match={evoMatch} goBack={()=>{setShowEvo(false);setEvoMatch(null);}}/>;
    if(statsMatch)return <StatsPage matchEvents={statsMatch.events||[]} matchTitle={`${statsMatch.home} ${statsMatch.hs}–${statsMatch.as} ${statsMatch.away}`} onBack={()=>setStatsMatch(null)} homeTeamName={homeTeam?.name||"GEI"}/>;
    switch(tab){
      case "matches":  return <MatchesPage
        matchStatus={matchStatus} liveMatchInfo={liveMatchInfo} liveScore={liveScore}
        completedMatches={completedMatches} setEvoMatch={setEvoMatch} setShowEvo={setShowEvo}
        setStatsMatch={setStatsMatch} deleteMatch={deleteMatch} reopenMatch={reopenMatch}
        onNewMatch={()=>setShowNewMatch(true)} setTab={setTab} liveHomeTeam={homeTeam}
      />;
      case "teams":    return <TeamsPage teams={teams} setTeams={setTeams} onTeamUpdated={onTeamUpdated}/>;
      case "register": return <RegisterPage
        events={liveEvents} setEvents={setLiveEvents}
        matchStatus={matchStatus} matchInfo={liveMatchInfo}
        onCloseMatch={()=>setShowCloseConfirm(true)}
        onStartMatch={()=>setShowNewMatch(true)}
        persistEvent={persistEvent} updatePersistedEvent={updatePersistedEvent}
        homeTeam={homeTeam} awayTeamName={liveMatchInfo.away} awayPlayers={awayPlayers}
      />;
      case "stats":    return <StatsPage liveEvents={liveEvents} completedMatches={completedMatches} homeTeamName={homeTeam?.name||"GEI"}/>;
      case "ai":       return <AIPage liveEvents={liveEvents} liveMatchInfo={liveMatchInfo} completedMatches={completedMatches}/>;
      default:         return null;
    }
  };

  return(
    <div style={{background:T.bg,minHeight:"100vh",fontFamily:T.font,display:"flex",flexDirection:"column",alignItems:"center"}}>
      <div style={{width:"100%",maxWidth:430,minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",position:"relative"}}>
        <div style={{padding:"11px 16px 0",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <span style={{fontSize:17}}>🤾</span>
            <span style={{fontSize:12,fontWeight:800,color:T.text,letterSpacing:1}}>HANDBALL PRO</span>
            <span style={{fontSize:8,background:T.accent+"22",color:T.accent,border:`1px solid ${T.accent}44`,borderRadius:7,padding:"1px 5px",fontWeight:700}}>v8</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <style>{`@keyframes blinkG{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
            {matchStatus==="live"
              ?<><div style={{width:5,height:5,borderRadius:"50%",background:T.red,animation:"blinkG 1.2s infinite"}}/><span style={{fontSize:9,color:T.red,fontWeight:700}}>EN VIVO</span></>
              :<><div style={{width:5,height:5,borderRadius:"50%",background:T.muted}}/><span style={{fontSize:9,color:T.muted,fontWeight:600}}>Sin partido</span></>
            }
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"14px 14px 88px",WebkitOverflowScrolling:"touch"}}>
          {content()}
        </div>
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(6,12,24,.97)",backdropFilter:"blur(16px)",borderTop:`1px solid ${T.border}`,display:"flex",zIndex:50,paddingBottom:"env(safe-area-inset-bottom,0)"}}>
          {NAV.map(n=>{
            const active=!showEvo&&!statsMatch&&tab===n.k;
            return(
              <button key={n.k} onClick={()=>{setShowEvo(false);setEvoMatch(null);setStatsMatch(null);setTab(n.k);}}
                style={{flex:1,background:"transparent",border:"none",cursor:"pointer",padding:"9px 3px 7px",display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative"}}>
                {active&&<div style={{position:"absolute",top:0,left:"15%",right:"15%",height:2,background:T.accent,borderRadius:"0 0 2px 2px"}}/>}
                {n.k==="register"&&matchStatus==="live"&&<div style={{position:"absolute",top:5,right:"16%",width:6,height:6,borderRadius:"50%",background:T.red}}/>}
                <span style={{fontSize:17,lineHeight:1,filter:active?"none":"grayscale(1) opacity(.42)",transform:active?"scale(1.15)":"scale(1)",transition:"all .15s"}}>{n.icon}</span>
                <span style={{fontSize:8,fontWeight:active?700:500,color:active?T.accent:T.muted,letterSpacing:.4}}>{n.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {showNewMatch&&<NewMatchModal/>}
      {showCloseConfirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:20}}>
          <div style={{background:T.card,borderRadius:20,padding:22,border:`1px solid ${T.border}`,maxWidth:360,width:"100%",textAlign:"center"}}>
            <div style={{fontSize:34,marginBottom:10}}>🏁</div>
            <div style={{fontSize:16,fontWeight:800,color:T.text,marginBottom:5}}>¿Cerrar el partido?</div>
            <div style={{fontSize:13,color:T.muted,marginBottom:14}}>{liveMatchInfo.home} {liveScore.h} – {liveScore.a} {liveMatchInfo.away}</div>
            <div style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.3)",borderRadius:10,padding:"9px 12px",marginBottom:14,textAlign:"left"}}>
              <div style={{fontSize:11,color:T.yellow}}>💡 Podés completar los datos rápidos desde Stats después de cerrar.</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={()=>setShowCloseConfirm(false)} outline color={T.muted} style={{flex:1}}>Cancelar</Btn>
              <Btn onClick={closeMatch} color={T.green} style={{flex:2}}>✓ Cerrar partido</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
