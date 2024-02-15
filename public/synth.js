const synth_info = {}

let last_ping = false

const connection_test = () => {
   if (last_ping < Date.now () - 12000 || socket.readyState > 1) {
      location.reload ()
   }

   setTimeout (connection_test, 3000)
}

// const ws_address = `ws://localhost`
const ws_address = `wss://cold-eagle-12.deno.dev`

console.log (`attempting websocket at ${ ws_address }`)

const socket = new WebSocket (ws_address)

socket.onopen = () => console.log (`websocket achieved!`)

// check for pings within last 12 seconds.  If not, reload
const check_connection = () => {}

socket.onmessage = m => {
   const { method, content } = JSON.parse (m.data)

   // console.log (`${ method } message recieved`)

   const handle_incoming = {

      id: () => {
         Object.assign (synth_info, content)
         console.log (`welcome, ${ synth_info.name }!`)
         last_ping = Date.now ()
         connection_test ()
      },

      ping: () => {
         last_ping = Date.now ()
         socket.send (JSON.stringify ({
            type    : `synth`,
            method  : `pong`,
            content : content,
         }))
      },


      note: () => {
         // if (audio_context.state == `running`) {
         //    bg_col = `turquoise`
         //    setTimeout (() => bg_col = `deeppink`, msg.content[1] * 1000)

         //    const t = audio_context.currentTime
         //    rev_gate.gain.cancelScheduledValues (t)
         //    rev_gate.gain.setValueAtTime (rev_gate.gain.value, t)
         //    const r = ((1 - msg.state.y) ** 12) * 0.4
         //    rev_gate.gain.linearRampToValueAtTime (r, t + msg.content[1])

         //    play_osc (...msg.content, audio_context)
         // }
      }
   }
   // console.log (method)
   handle_incoming[method] ()
}


// function midi_to_cps (n) {
//    return 440 * (2 ** ((n - 69) / 12))
// }

// function rand_element (arr) {
//    return arr[rand_integer (arr.length)]
// }

// function rand_integer (max) {
//    return Math.floor (Math.random () * max)
// }

// function shuffle_array (a) {
//    for (let i = a.length - 1; i > 0; i--) {
//       let j = Math.floor (Math.random () * (i + 1));
//       [ a[i], a[j] ] = [ a[j], a[i] ]
//    }
// }

// socket.addEventListener ('open', msg => {
//    console.log (`websocket is ${ msg.type } at ${ msg.target.url } `)
// })

// ~ UI THINGS ~

let bg_col = `deeppink`

document.body.style.margin   = 0
document.body.style.overflow = `hidden`

document.body.style.backgroundColor = `black`
const text_div                = document.createElement (`div`)
text_div.innerText            = `tap to join the distributed arpeggiator instrument`
text_div.style.font           = `italic bolder 80px sans-serif`
text_div.style.color          = `white`
text_div.style.display        = `flex`
text_div.style.justifyContent = `center`
text_div.style.alignItems     = `center`
text_div.style.position       = `fixed`
text_div.style.width          = `${ window.innerWidth }px`
text_div.style.height         = `${ window.innerHeight }px`
text_div.style.left           = 0
text_div.style.top            = 0
document.body.appendChild (text_div)

document.body.onclick = async () => {
   if (document.body.style.backgroundColor == `black`) {

      await audio_context.resume ()

      document.body.style.backgroundColor = bg_col
      text_div.remove ()

      const name_div = document.createElement (`div`)
      name_div.style.textAlign = `center`
      name_div.style.position  = `fixed`
      name_div.style.color     = `white`
      name_div.style.width     = `100%`
      name_div.style.font      = `14px monospace`
      name_div.style.left      = 0
      name_div.style.top       = 0
      name_div.innerText       = synth_info.name
      document.body.appendChild (name_div)

      const audio_enabled = audio_context.state == `running`
      socket.send (JSON.stringify ({
         type    : `synth`,
         method  : `audio_enabled`, 
         content : { audio_enabled }
      }))   

      console.log (synth_info)
      requestAnimationFrame (draw_frame)
   }
}

// ~ WEB AUDIO THINGS ~
const audio_context = new AudioContext ()
audio_context.suspend ()

// reverbjs.extend (audio_context)

// const rev_gate = audio_context.createGain ()
// rev_gate.gain.value = 1

// const reverb_url = "R1NuclearReactorHall.m4a"
// const rev = audio_context.createReverbFromUrl (reverb_url, () => {
//    rev_gate.connect (rev).connect (audio_context.destination)
// })

// function play_osc (frq, lth, crv, bri, stk, gen, acx) {
//    if (gen > stk || bri === 0 || frq > 16000) return

//    const t = acx.currentTime

//    const pre = acx.createGain ()
//    const rev_gen = stk - gen + 1
//    const vol = Math.max (Math.min (1, bri * rev_gen), 0)
//    pre.gain.setValueAtTime (vol, t)

//    const amp = acx.createGain ()
//    amp.gain.setValueAtTime (0, t)
//    amp.gain.linearRampToValueAtTime (0.4, t + 0.02)
//    amp.gain.setValueAtTime (0.4, t + lth)
//    amp.gain.linearRampToValueAtTime (0, t + lth + 0.02)
//    amp.connect (acx.destination)
//    amp.connect (rev_gate)


//    const osc = acx.createOscillator ()
//    osc.frequency.setValueAtTime (frq, t)
//    osc.start (t)
//    osc.connect (pre)
//       .connect (amp)
//    osc.stop (t + lth + 0.2)

//    if (stk > gen) {
//       const next_bri = (bri - (1 / rev_gen)) * (rev_gen / (rev_gen - 1))
//       play_osc (frq * gen, lth, crv, next_bri, stk, gen + 1, acx)
//    }
// }

cnv.width = innerWidth
cnv.height = innerHeight
const ctx = cnv.getContext (`2d`)

function draw_frame () {
   ctx.fillStyle = bg_col
   ctx.fillRect (0, 0, cnv.width, cnv.height)   

   requestAnimationFrame (draw_frame)
}

function check_websocket () {
   if (socket.readyState > 1) location.reload ()
   setTimeout (check_websocket, 333)
}

// check_websocket ()
