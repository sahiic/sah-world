'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { Vitality } from '@/lib/growthScene'
import styles from './GrowthScene.module.css'

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'
export type Season = 'gaflet' | 'tovbe' | 'ihsan' | 'tefekkur'

type Props = {
  uid: string
  stage: number
  fedAreas: number
  vitality: Vitality
  playing: boolean
  pulse: boolean
  label: string
  time: TimeOfDay
  streakDays: number
  season: Season
}

const clusters = [
  { x: 203, y: 199, rx: 58, ry: 42, angle: -19 },
  { x: 278, y: 142, rx: 63, ry: 49, angle: 14 },
  { x: 331, y: 183, rx: 60, ry: 44, angle: 25 },
  { x: 239, y: 171, rx: 62, ry: 47, angle: -10 },
  { x: 271, y: 221, rx: 59, ry: 39, angle: 5 },
  { x: 334, y: 240, rx: 43, ry: 34, angle: -18 },
]
const roots = [
  'M274 412C248 426 235 455 208 477s-40 22-55 38',
  'M278 412C299 443 328 443 351 470s35 19 46 43',
  'M272 414C270 447 256 463 254 510',
  'M281 412C288 443 280 472 301 517',
]
const extraRoots = [
  'M268 418C240 440 220 470 190 495',
  'M286 418C310 450 340 460 365 490',
  'M275 420C260 460 245 490 230 530',
  'M280 420C295 455 310 485 325 525',
]
const leafPath = 'M-9 0C-6-5 2-7 9 0C4 6-4 6-9 0Z'
const streamPath = 'M80 395C120 400 180 408 240 403S340 395 400 400S460 408 520 402'
const stars = [
  { x: 42, y: 38, r: 1.8 }, { x: 120, y: 62, r: 1.2 }, { x: 195, y: 28, r: 1.5 },
  { x: 310, y: 45, r: 1.3 }, { x: 380, y: 70, r: 1.6 }, { x: 460, y: 35, r: 1.4 },
  { x: 520, y: 58, r: 1.1 }, { x: 75, y: 105, r: 1 }, { x: 155, y: 88, r: 1.3 },
  { x: 350, y: 22, r: 1.7 }, { x: 490, y: 95, r: 1.2 }, { x: 260, y: 75, r: .9 },
  { x: 30, y: 140, r: .8 }, { x: 410, y: 110, r: 1 }, { x: 530, y: 130, r: .9 },
  { x: 180, y: 130, r: 1.1 }, { x: 95, y: 170, r: .7 }, { x: 500, y: 160, r: .8 },
]
const flowerPositions = [
  { cx: 220, cy: 165, s: .8 }, { cx: 290, cy: 135, s: .9 }, { cx: 340, cy: 170, s: .7 },
  { cx: 255, cy: 195, s: .85 }, { cx: 310, cy: 210, s: .75 }, { cx: 195, cy: 215, s: .6 },
  { cx: 345, cy: 145, s: .65 },
]
const fallingLeaves = [
  { x: 240, y: 250, delay: 0 }, { x: 300, y: 240, delay: 2.5 },
  { x: 260, y: 260, delay: 5 }, { x: 320, y: 230, delay: 7.5 },
  { x: 210, y: 255, delay: 1.5 }, { x: 350, y: 245, delay: 4 },
]

export function BotanicalScene({ uid, stage, fedAreas, vitality, playing, pulse, label, time, streakDays, season }: Props) {
  const reduced = useReducedMotion()
  const maturity = Math.max(0, Math.min(10, stage))
  const treeScale = .68 + Math.min(8, maturity) * .04
  const canopyScale = .64 + Math.min(8, maturity) * .04
  const earlyOpacity = Math.max(0, Math.min(1, 2 - maturity))
  const treeOpacity = Math.max(0, Math.min(1, maturity - 1))
  const rootScale = .35 + maturity * .065
  const isNight = time === 'night'
  const isDusk = time === 'dusk'
  const streamIntensity = Math.min(1, streakDays / 14)
  const flowerCount = Math.min(flowerPositions.length, Math.floor(fedAreas * flowerPositions.length / 7))
  const extraRootCount = Math.min(extraRoots.length, Math.floor(fedAreas / 2))
  const leafCount = season === 'tefekkur' ? Math.min(fallingLeaves.length, 4 + Math.floor(maturity / 3)) : 0

  return <svg className={styles.landscape} viewBox="0 0 560 560" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
    <defs>
      <linearGradient id={`${uid}-sky`} x2="0" y2="1"><stop stopColor="var(--sky-top)"/><stop offset=".65" stopColor="var(--sky-mid)"/><stop offset="1" stopColor="var(--sky-low)"/></linearGradient>
      <radialGradient id={`${uid}-sun`}><stop stopColor="var(--sun-core)" stopOpacity=".85"/><stop offset=".16" stopColor="var(--sun-core)" stopOpacity=".65"/><stop offset="1" stopColor="var(--sun-core)" stopOpacity="0"/></radialGradient>
      <linearGradient id={`${uid}-rays`} x1="1" y1="0" x2="0" y2="1"><stop stopColor="var(--sun-core)" stopOpacity=".4"/><stop offset="1" stopColor="var(--sun-core)" stopOpacity="0"/></linearGradient>
      <linearGradient id={`${uid}-meadow`} x2="0" y2="1"><stop stopColor="var(--meadow-light)"/><stop offset="1" stopColor="var(--meadow-dark)"/></linearGradient>
      <linearGradient id={`${uid}-soil`} x2="0" y2="1"><stop stopColor="var(--soil-light)"/><stop offset=".3" stopColor="var(--soil-mid)"/><stop offset="1" stopColor="var(--soil-dark)"/></linearGradient>
      <linearGradient id={`${uid}-bark`}><stop stopColor="var(--bark-shadow)"/><stop offset=".45" stopColor="var(--bark-mid)"/><stop offset=".82" stopColor="var(--bark-light)"/><stop offset="1" stopColor="var(--bark-mid)"/></linearGradient>
      <radialGradient id={`${uid}-foliage`} cx="76%" cy="20%" r="90%"><stop stopColor="var(--leaf-rim)"/><stop offset=".25" stopColor="var(--leaf-light)"/><stop offset=".6" stopColor="var(--leaf-mid)"/><stop offset="1" stopColor="var(--leaf-shadow)"/></radialGradient>
      <radialGradient id={`${uid}-haze`}><stop stopColor="var(--haze)" stopOpacity=".55"/><stop offset="1" stopColor="var(--haze)" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${uid}-moon-glow`}><stop stopColor="var(--moon-glow)" stopOpacity=".4"/><stop offset="1" stopColor="var(--moon-glow)" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${uid}-nur`}><stop stopColor="var(--nur-core)" stopOpacity=".9"/><stop offset=".4" stopColor="var(--nur-core)" stopOpacity=".4"/><stop offset="1" stopColor="var(--nur-core)" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${uid}-flower`}><stop stopColor="var(--flower-inner)"/><stop offset=".6" stopColor="var(--flower-mid)"/><stop offset="1" stopColor="var(--flower-outer)"/></radialGradient>
      <linearGradient id={`${uid}-stream`} x1="0" y1="0" x2="1" y2="0"><stop stopColor="var(--stream-start)" stopOpacity=".1"/><stop offset=".3" stopColor="var(--stream-mid)" stopOpacity={streamIntensity * .6}/><stop offset=".7" stopColor="var(--stream-mid)" stopOpacity={streamIntensity * .6}/><stop offset="1" stopColor="var(--stream-end)" stopOpacity=".1"/></linearGradient>
      <filter id={`${uid}-soft`}><feGaussianBlur stdDeviation="5"/></filter>
      <filter id={`${uid}-far`}><feGaussianBlur stdDeviation="1.8"/></filter>
      <filter id={`${uid}-contact`} x="-50%" width="200%" y="-100%" height="300%"><feGaussianBlur stdDeviation="7"/></filter>
      <filter id={`${uid}-crown-shadow`} x="-25%" y="-25%" width="150%" height="160%"><feDropShadow dx="-5" dy="8" stdDeviation="5" floodColor="var(--leaf-shadow)" floodOpacity=".3"/></filter>
      <filter id={`${uid}-nur-glow`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4"/></filter>
      <filter id={`${uid}-star-glow`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2"/></filter>
      <pattern id={`${uid}-grain`} width="31" height="29" patternUnits="userSpaceOnUse"><circle cx="3" cy="4" r=".6" fill="var(--grain)" opacity=".2"/><circle cx="17" cy="23" r=".5" fill="var(--grain)" opacity=".15"/><path d="m24 9 2 1M8 19h1" stroke="var(--grain)" opacity=".12" strokeWidth=".5"/></pattern>
      <path id={`${uid}-leaf`} d={leafPath}/>
    </defs>

    {/* Sky */}
    <g data-layer="sky"><rect width="560" height="560" fill={`url(#${uid}-sky)`}/><ellipse cx="290" cy="248" rx="390" ry="155" fill={`url(#${uid}-haze)`}/></g>

    {/* Stars — visible at night and faintly at dusk */}
    {(isNight || isDusk) && <g data-layer="stars" opacity={isNight ? 1 : .3}>
      {stars.map((star, i) => <g key={i}>
        <circle cx={star.x} cy={star.y} r={star.r} fill="var(--star)" className={styles.star} style={{ animationDelay: `-${i * 1.3}s`, animationDuration: `${3 + i % 3}s` }} />
        <circle cx={star.x} cy={star.y} r={star.r * 2.5} fill="var(--star)" opacity=".15" filter={`url(#${uid}-star-glow)`} />
      </g>)}
    </g>}

    {/* Hilal (Crescent Moon) — night sky */}
    {isNight && <g data-layer="moon" className={styles.moon}>
      <circle cx="120" cy="80" r="60" fill={`url(#${uid}-moon-glow)`} />
      <g transform="translate(120 80)">
        <circle r="22" fill="var(--moon-face)" />
        <circle cx="8" cy="-5" r="18" fill="var(--sky-top)" />
      </g>
    </g>}

    {/* Clouds — hidden at night */}
    {!isNight && <g data-layer="clouds" fill="var(--cloud)" filter={`url(#${uid}-soft)`} opacity=".55">
      {[{x:84,y:111,s:1},{x:340,y:70,s:.68},{x:468,y:157,s:.8},{x:25,y:232,s:.55}].map((cloud,index)=><g key={index} transform={`translate(${cloud.x} ${cloud.y}) scale(${cloud.s})`}><g className={styles.cloud} style={{animationDuration:`${70+index*14}s`,animationDelay:`-${index*19}s`}}><ellipse rx="64" ry="12"/><ellipse cx="-23" cy="-8" rx="30" ry="15"/><ellipse cx="12" cy="-14" rx="34" ry="19"/></g></g>)}
    </g>}

    {/* Sun — hidden at night */}
    {!isNight && <g data-layer="sun" data-part="sukur" className={styles.part}>
      <circle cx="442" cy="83" r="119" fill={`url(#${uid}-sun)`}/><circle cx="442" cy="83" r="17" fill="var(--sun-core)" opacity=".7"/>
      <g className={styles.rays} fill={`url(#${uid}-rays)`}><path d="M450 63 93 434 152 467Z"/><path d="M451 65 271 417 339 429Z"/><path d="M451 65 411 413 455 413Z"/></g>
    </g>}

    {/* Hills */}
    <g data-layer="hills">
      <path d="M-30 319C40 257 103 237 171 266S283 300 364 249 472 244 590 204V440H-30Z" fill="var(--hill-far)" filter={`url(#${uid}-far)`}/>
      <path d="M-30 354C48 287 130 309 191 323S309 266 396 304 494 302 590 267V448H-30Z" fill="var(--hill-middle)"/>
      <path d="M-30 384C41 360 85 325 155 345S269 378 346 338 463 335 590 319V450H-30Z" fill="var(--hill-near)"/>
      <ellipse cx="415" cy="307" rx="250" ry="42" fill={`url(#${uid}-haze)`} opacity=".5"/>
    </g>

    {/* Meadow */}
    <g data-layer="meadow">
      <path d="M0 402C124 365 170 387 263 382S451 359 560 389V467H0Z" fill={`url(#${uid}-meadow)`}/>
      <path d="M365 384C344 399 397 413 452 431H514C445 407 385 398 389 380Z" fill="var(--path)" opacity=".42"/>
      <ellipse cx="215" cy="417" rx={55+stage*5} ry="13" transform="rotate(-10 215 417)" fill="var(--shadow)" opacity=".25" filter={`url(#${uid}-contact)`}/>
      <ellipse cx="276" cy="414" rx="27" ry="7" fill="var(--shadow)" opacity=".5" filter={`url(#${uid}-contact)`}/>
    </g>

    {/* Selsebil stream bed — always visible as a faint dry path */}
    <g data-layer="stream-bed" className={styles.streamBed}>
      <path d={streamPath} fill="none" stroke="var(--path)" strokeWidth={4} strokeLinecap="round" strokeDasharray="6 8" />
    </g>

    {/* Selsebil Stream — flows based on streak */}
    {streakDays > 0 && <g data-layer="stream" className={styles.stream} opacity={streamIntensity}>
      <path d={streamPath} fill="none" stroke={`url(#${uid}-stream)`} strokeWidth={3 + streakDays * .3} strokeLinecap="round" />
      <path d={streamPath} fill="none" stroke="var(--stream-mid)" strokeWidth={1.5 + streakDays * .15} strokeLinecap="round" className={styles.streamFlow} pathLength="100" opacity=".7" />
      {streakDays >= 3 && <path d={streamPath} fill="none" stroke="var(--stream-sparkle)" strokeWidth="1" strokeDasharray="1 12" className={styles.streamSparkle} pathLength="100" />}
      {streakDays >= 7 && Array.from({ length: 5 }, (_, i) => {
        const x = 140 + i * 80
        return <circle key={i} cx={x} cy={400 + (i % 3) * 3} r={1.5 + (i % 2)} fill="var(--stream-sparkle)" className={styles.streamDrop} style={{ animationDelay: `-${i * 1.2}s` }} opacity=".6" />
      })}
    </g>}

    {/* Tree */}
    <motion.g data-layer="tree" animate={{scale: pulse && playing ? 1.02 : 1}} transition={playing ? {type:'spring',stiffness:200,damping:13} : {duration:0}} style={{transformOrigin:'280px 412px'}}>
      {/* Early sprout */}
      <g opacity={earlyOpacity} style={{transition:'opacity 1s'}}>
        <ellipse cx="277" cy="409" rx="10" ry="6" fill="var(--bark-light)"/>
        <g transform={`translate(280 410) scale(${.35+Math.min(1,maturity)*.65})`}><path d="M0 0C-7-22-1-47 4-61" fill="none" stroke="var(--leaf-mid)" strokeWidth="5"/><path d="M1-27C-32-26-36-53-22-50S-2-41 1-27ZM3-50c3-29 33-28 32-16S19-48 3-50Z" fill={`url(#${uid}-foliage)`}/></g>
      </g>
      {/* Mature tree */}
      <g opacity={treeOpacity} style={{transform:`translate(${280-280*treeScale}px,${414-414*treeScale}px) scale(${treeScale})`,transition:reduced?'none':'transform 1.4s ease, opacity 1s'}}>
        <g className={styles.treeWind}>
          {/* Trunk */}
          <g data-part="focus" className={styles.part}><path d="M266 414C271 376 271 346 265 313C259 275 277 231 280 191C290 230 286 271 288 310C283 347 288 381 292 414Z" fill={`url(#${uid}-bark)`}/><path d="M286 406C278 363 282 337 277 310S279 252 282 222" fill="none" stroke="var(--bark-rim)" strokeWidth="2" opacity=".65"/><path d="M272 409c-5-41 2-54-3-77m12 51-3-38m-8-39 1-28" fill="none" stroke="var(--bark-shadow)" strokeWidth="2" opacity=".6"/></g>
          {/* Branches */}
          <g data-part="profession" className={styles.part} fill="none" stroke={`url(#${uid}-bark)`} strokeLinecap="round"><path d="M277 337C254 308 231 287 196 259M280 307C306 281 330 260 352 234M274 285C251 253 240 229 237 202M281 264C301 226 302 198 299 173" strokeWidth="9"/><path d="M235 289c-28-2-46-13-58-34M316 272c23-6 39-16 51-30M254 250c-3-29-14-47-30-61M299 224c24-17 42-35 52-59" strokeWidth="4"/></g>
          {/* Canopy */}
          <g data-part="journal" className={styles.part} style={{transform:`translate(${280-280*canopyScale}px,${200-200*canopyScale}px) scale(${canopyScale})`,transition:reduced?'none':'transform 1.4s ease'}}>
            {clusters.map((cluster,index)=><g key={index} transform={`translate(${cluster.x} ${cluster.y}) rotate(${cluster.angle})`} opacity={Math.min(1,Math.max(.2,(maturity-1)*.55+(.2-index*.025)))}>
              <g className={styles.foliage} style={{animationDelay:`-${index*1.6}s`}}>
                <path d={`M${-cluster.rx} 0C${-cluster.rx-5} ${-cluster.ry*.6} ${-cluster.rx*.6} ${-cluster.ry} -12 ${-cluster.ry*.88}C12 ${-cluster.ry*1.2} ${cluster.rx*.72} ${-cluster.ry*.87} ${cluster.rx*.8} -14C${cluster.rx*1.2} 9 ${cluster.rx*.8} ${cluster.ry*.83} 21 ${cluster.ry*.85}C-12 ${cluster.ry*1.1} ${-cluster.rx*.93} ${cluster.ry*.65} ${-cluster.rx} 0Z`} fill={`url(#${uid}-foliage)`} filter={`url(#${uid}-crown-shadow)`}/>
                <g data-part="quran" className={styles.part}>{Array.from({length:24},(_,leaf)=>{
                  const angle=leaf*2.399+index
                  const distance=Math.sqrt((leaf+.5)/24)
                  const x=Math.cos(angle)*cluster.rx*distance
                  const y=Math.sin(angle)*cluster.ry*distance
                  return <use key={leaf} href={`#${uid}-leaf`} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${leaf*37}) scale(${.55+(leaf%4)*.12})`} fill={leaf%3===0?'var(--leaf-rim)':leaf%3===1?'var(--leaf-light)':'var(--leaf-shadow)'} opacity={leaf%3===0?.46:.27}/>
                })}</g>
                <path d={`M8 ${-cluster.ry*.76}Q${cluster.rx*.7} ${-cluster.ry*.8} ${cluster.rx*.82} -8`} stroke="var(--leaf-rim)" strokeWidth="1.5" fill="none" opacity=".6"/>
              </g>
            </g>)}

            {/* Flower buds — always visible from stage 1 as waiting seeds */}
            {maturity >= 1 && flowerCount === 0 && <g data-layer="buds" className={styles.buds}>
              {flowerPositions.slice(0, Math.min(4, Math.ceil(maturity))).map((f, i) => <g key={i} transform={`translate(${f.cx} ${f.cy}) scale(${f.s})`}>
                <circle r={2.2} fill="var(--flower-center)" opacity=".35" className={styles.bud} style={{ animationDelay: `-${i * 2.3}s` }} />
                <circle r={1} fill="var(--flower-inner)" opacity=".5" />
              </g>)}
            </g>}

            {/* Flowers — rose motif, bloom based on fedAreas */}
            {flowerCount > 0 && maturity >= 3 && <g data-layer="flowers" className={styles.flowers}>
              {flowerPositions.slice(0, flowerCount).map((f, i) => <g key={i} transform={`translate(${f.cx} ${f.cy}) scale(${f.s})`} className={styles.flower} style={{ animationDelay: `-${i * 1.1}s` }}>
                {Array.from({ length: 5 }, (_, p) => {
                  const a = p * 72 * Math.PI / 180
                  return <ellipse key={p} cx={Math.cos(a) * 5} cy={Math.sin(a) * 5} rx="4.5" ry="3" transform={`rotate(${p * 72} ${Math.cos(a) * 5} ${Math.sin(a) * 5})`} fill={`url(#${uid}-flower)`} opacity=".85" />
                })}
                <circle r="2.5" fill="var(--flower-center)" />
                {fedAreas >= 6 && <circle r="1" fill="var(--pollen)" className={styles.flowerGlow} />}
              </g>)}
            </g>}
          </g>

          {/* Falling leaves — tefekkür season */}
          {leafCount > 0 && !reduced && <g data-layer="falling-leaves">
            {fallingLeaves.slice(0, leafCount).map((fl, i) => <use key={i} href={`#${uid}-leaf`} className={styles.fallingLeaf} style={{ animationDelay: `${fl.delay}s` }} transform={`translate(${fl.x} ${fl.y}) scale(.7)`} fill={season === 'tefekkur' ? 'var(--leaf-autumn)' : 'var(--leaf-rim)'} opacity=".6" />)}
          </g>}
        </g>
      </g>
    </motion.g>

    {/* Foreground — grass and stones */}
    <g data-layer="foreground">
      {Array.from({length:38},(_,index)=>{const x=(index*79)%560;const y=418+(index%4)*4;return <g key={index} transform={`translate(${x} ${y})`}><path className={styles.grass} style={{animationDelay:`-${index%7}s`}} d={`M0 0q-3-${8+index%9} -8-${11+index%13}Q-1-9 0 0q1-${12+index%12} 8-${17+index%9}Q2-5 0 0Z`} fill={index%2?'var(--grass)':'var(--meadow-light)'}/></g>})}
      <g fill="var(--stone)"><path d="m91 424 4-10 15-4 13 8-3 7Z"/><path d="m401 414 5-7 8 1 7 8Z"/></g>
      <path d="m97 415 12-3 10 7-12-2Z" fill="var(--stone-light)"/>
    </g>

    {/* Soil and roots */}
    <g data-layer="soil" data-part="lessons" className={styles.part}>
      <path d="M0 431C106 417 164 438 273 426S448 444 560 426V560H0Z" fill={`url(#${uid}-soil)`}/>
      <path d="M0 431C106 417 164 438 273 426S448 444 560 426" fill="none" stroke="var(--grass)" strokeWidth="4"/>
      {Array.from({length:40},(_,index)=><ellipse key={index} cx={(index*83)%560} cy={449+(index*17)%109} rx={1+index%3} ry="1" fill="var(--soil-speck)" opacity=".25"/>)}
      <g data-part="mescidim" className={styles.part} style={{transform:`translate(${278-278*rootScale}px,${425-425*rootScale}px) scale(${rootScale})`,transition:reduced?'none':'transform 1.4s ease'}}>
        <g fill="none" stroke={`url(#${uid}-bark)`} strokeLinecap="round">
          <path d="M278 424v-15" strokeWidth="11"/>
          {roots.map((path,index)=><path key={path} d={path} strokeWidth={5-index*.7}/>)}
          {/* Extra roots that grow with fedAreas */}
          {extraRoots.slice(0, extraRootCount).map((path, i) => <path key={`extra-${i}`} d={path} strokeWidth={2.5 - i * .3} opacity={.5 + fedAreas * .07} className={styles.extraRoot} style={{ animationDelay: `${i * .3}s` }} />)}
          <path d="M238 449q-39-4-62 15M219 468q-4 26-30 39M335 452q25-3 46 10M350 470q0 19 22 33M260 475l-21 17M290 474l24 13" strokeWidth="1.8"/>
        </g>
        <g fill="var(--pollen)" opacity={fedAreas/7}>
          {[[153,515],[397,513],[254,510],[301,517]].map(([x,y])=><circle key={x} cx={x} cy={y} r="3" className={styles.rootTip}/>)}
          {/* Extra root tips for high fedAreas */}
          {fedAreas >= 5 && [[180,525],[370,520],[240,535],[320,530]].map(([x,y])=><circle key={`e${x}`} cx={x} cy={y} r="2.5" className={styles.rootTip} opacity=".7"/>)}
        </g>
        {pulse&&roots.map((path,index)=><path key={path} d={path} fill="none" stroke="var(--pollen)" strokeWidth="3" pathLength="100" className={styles.rootDrop} style={{animationDelay:`${index*.08}s`}}/>)}
      </g>
    </g>

    {/* Islamic geometric ground motif — rub el hizb pattern */}
    <g data-layer="geometric" className={styles.geometric} transform="translate(275 425)" opacity=".18">
      <rect x="-8" y="-8" width="16" height="16" fill="var(--pollen)" transform="rotate(0)" />
      <rect x="-8" y="-8" width="16" height="16" fill="var(--pollen)" transform="rotate(45)" />
      <circle r="4" fill="var(--flower-center)" opacity=".6" />
    </g>

    {/* Grain overlay */}
    <rect width="560" height="560" fill={`url(#${uid}-grain)`} opacity=".55" pointerEvents="none"/>

    {/* Pollen / mote particles */}
    <g className={styles.pollen} aria-hidden="true">{Array.from({length:12},(_,index)=><circle key={index} cx={65+(index*97)%439} cy={140+(index*61)%260} r={index%3===0?1.8:1} fill="var(--pollen)" className={styles.mote} style={{animationDelay:`-${index*.8}s`,animationDuration:`${6+index%4}s`}}/>)}</g>

    {/* Ambient nur — subtle golden particles visible during day/dawn */}
    {!isNight && !isDusk && !reduced && <g data-layer="nur-ambient" className={styles.nurAmbient} aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => {
        const x = 100 + (i * 137) % 360
        const y = 160 + (i * 109) % 220
        return <circle key={i} cx={x} cy={y} r={2 + (i % 2)} fill="var(--pollen)" className={styles.nurAmbientParticle} style={{ animationDelay: `-${i * 1.8}s`, animationDuration: `${9 + i % 4}s` }} />
      })}
    </g>}

    {/* Nur particles — Islamic light particles, replace generic fireflies */}
    {(isNight || isDusk) && !reduced && <g data-layer="nur" className={styles.nurLayer} aria-hidden="true">
      {Array.from({ length: isNight ? 16 : 8 }, (_, i) => {
        const x = 40 + (i * 131) % 480
        const y = 120 + (i * 97) % 280
        return <g key={i} className={styles.nurParticle} style={{ animationDelay: `-${i * .7}s`, animationDuration: `${5 + i % 4}s` }}>
          <circle cx={x} cy={y} r={3 + (i % 3)} fill={`url(#${uid}-nur)`} filter={`url(#${uid}-nur-glow)`} />
          <circle cx={x} cy={y} r={1.2 + (i % 2) * .5} fill="var(--nur-core)" opacity=".9" />
        </g>
      })}
    </g>}

    {/* Level-up burst — light explosion */}
    {pulse && <g data-layer="levelup-burst" fill="var(--pollen)">
      {Array.from({length:8},(_,index)=>{
        const angle = index * 45 * Math.PI / 180
        return <circle key={index} cx={280 + Math.cos(angle) * 15} cy={300 + Math.sin(angle) * 15} r="2.5" className={styles.burst} style={{animationDelay:`${index*.05}s`}}/>
      })}
      <circle cx="280" cy="300" r="8" fill="var(--nur-core)" opacity=".3" className={styles.nurBurst} />
    </g>}

    {/* Birds — radiant vitality */}
    {vitality==='radiant'&&<g className={styles.birds} fill="none" stroke="var(--bird)" strokeWidth="1.5" opacity={isNight ? '.25' : '.5'}>
      <path d="M90 133q6-7 13 0 6-6 12 0M116 116q5-5 10 0 5-4 9 0M142 133q4-4 8 0 4-4 8 0"/>
      {maturity >= 6 && <path d="M420 145q5-6 11 0 5-5 10 0M445 130q4-4 8 0 4-4 8 0" className={styles.birds2} />}
    </g>}
  </svg>
}
