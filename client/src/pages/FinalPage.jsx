import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { narratives } from '../data/narratives.js';

const CHAR_KEYS = ["profession","biology","health","phobia","hobby","fact1","fact2","baggage"];
const CHAR_LABELS = {
  profession:"Профессия", biology:"Биология", health:"Здоровье", phobia:"Фобия",
  hobby:"Хобби", fact1:"Факт I", fact2:"Факт II", baggage:"Багаж",
};
const CHAR_ICONS = {
  profession:"💼", biology:"🧬", health:"❤️", phobia:"😨",
  hobby:"🎯", fact1:"⭐", fact2:"🔒", baggage:"🎒",
};

export default function FinalPage() {
  const { players, exiledPlayers, catastrophe, allDossiers } = useGameStore();

  function getTraits(p) {
    return allDossiers[p.id] || p.traits || {};
  }

  const survivorsWithTraits = players.map(p => ({ ...p, traits: getTraits(p) }));
  const exiledWithTraits = exiledPlayers.map(p => ({ ...p, traits: getTraits(p) }));

  const narrativeFn = narratives[catastrophe?.id];
  const narrative = narrativeFn
    ? narrativeFn(survivorsWithTraits, exiledWithTraits)
    : `Бункер запечатан. ${players.length} человек осталось внутри. Снаружи — катастрофа. Впереди — долгое ожидание.`;

  return (
    <div style={{ width:'100%', minHeight:'100%', background:'var(--bg)', padding:'40px 32px', position:'relative' }}>
      <div className="noise-overlay" />

      {/* Header */}
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}}
        style={{textAlign:'center', marginBottom:40}}>
        <div style={{fontFamily:'var(--font-display)', fontSize:11, letterSpacing:'0.3em',
          color:'var(--text-dim)', marginBottom:8, textTransform:'uppercase'}}>итог игры</div>
        <h1 style={{fontFamily:'var(--font-display)', fontSize:'clamp(48px,8vw,80px)',
          letterSpacing:'0.15em', color:'var(--accent)', margin:0}}>БУНКЕР</h1>
        <div className="glow-line" style={{margin:'16px auto', width:200}} />
        {catastrophe && (
          <div style={{color:'var(--text-dim)', fontSize:13, letterSpacing:'0.1em'}}>
            {catastrophe.icon} {catastrophe.title?.toUpperCase()} · срок {catastrophe.duration}
          </div>
        )}
      </motion.div>

      {/* Narrative */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}}
        style={{maxWidth:760, margin:'0 auto 48px', background:'rgba(200,169,110,0.04)',
          border:'1px solid var(--accent-dim)', padding:28}}>
        <div style={{fontFamily:'var(--font-ui)', fontSize:15, lineHeight:1.9,
          color:'var(--text)', whiteSpace:'pre-line', letterSpacing:'0.02em'}}>
          {narrative}
        </div>
      </motion.div>

      {/* Survivors */}
      <DossierSection
        title="🏰 Остались в бункере"
        players={players}
        getTraits={getTraits}
        color="var(--green)"
        borderColor="rgba(45,122,79,0.3)"
        headerBg="rgba(45,122,79,0.12)"
        delay={0.5}
      />

      {/* Exiled */}
      {exiledPlayers.length > 0 && (
        <DossierSection
          title="✕ Изгнаны"
          players={exiledPlayers}
          getTraits={getTraits}
          color="var(--red)"
          borderColor="rgba(200,68,68,0.3)"
          headerBg="rgba(200,68,68,0.08)"
          delay={0.7}
        />
      )}
    </div>
  );
}

function DossierSection({ title, players, getTraits, color, borderColor, headerBg, delay }) {
  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
      transition={{delay}} style={{marginBottom:48}}>
      <div style={{fontFamily:'var(--font-display)', fontSize:16, letterSpacing:'0.2em',
        color, marginBottom:20, textTransform:'uppercase', borderBottom:`1px solid ${borderColor}`,
        paddingBottom:10}}>
        {title} <span style={{fontSize:13, opacity:0.6}}>({players.length})</span>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(360px,1fr))', gap:16}}>
        {players.map((p, i) => {
          const traits = getTraits(p);
          return (
            <motion.div key={p.id}
              initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}}
              transition={{delay: delay + i * 0.06}}
              style={{border:`1px solid ${borderColor}`, borderRadius:6, overflow:'hidden',
                background:'var(--bg-card)'}}>

              {/* Player name header */}
              <div style={{background:headerBg, padding:'10px 16px', borderBottom:`1px solid ${borderColor}`,
                display:'flex', alignItems:'center', gap:10}}>
                <span style={{fontFamily:'var(--font-display)', fontSize:17, color,
                  letterSpacing:'0.08em'}}>{p.name}</span>
                {p.isBot && <span style={{fontSize:12, opacity:0.6}}>🤖</span>}
              </div>

              {/* Traits grid */}
              <div style={{padding:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                {CHAR_KEYS.map(key => {
                  const trait = traits[key];
                  const val = trait?.value || (typeof trait === 'string' ? trait : null);
                  const desc = trait?.desc;
                  return (
                    <div key={key} style={{background:'rgba(255,255,255,0.02)',
                      border:'1px solid var(--border)', padding:'7px 10px', borderRadius:4}}>
                      <div style={{display:'flex', alignItems:'center', gap:5, marginBottom:4}}>
                        <span style={{fontSize:12}}>{CHAR_ICONS[key]}</span>
                        <span style={{fontFamily:'var(--font-title)', fontSize:9,
                          letterSpacing:'0.12em', textTransform:'uppercase',
                          color:'var(--text-muted)'}}>{CHAR_LABELS[key]}</span>
                      </div>
                      <div style={{fontSize:12, fontWeight:600, color:'var(--text-primary)',
                        lineHeight:1.3}}>{val || '—'}</div>
                      {desc && (
                        <div style={{fontSize:10, color:'var(--text-dim)', marginTop:3,
                          fontStyle:'italic', lineHeight:1.3}}>{desc}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
