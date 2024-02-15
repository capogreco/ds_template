// const ws_address = `ws://localhost/ctrl`
const ws_address = `wss://cold-eagle-12.deno.dev/ctrl`

const socket = new WebSocket (ws_address)

let bg_col = `indigo`
let phase = `connecting`
let override_hold = false

const id = {}

socket.onmessage = m => {
   const { method, content } = JSON.parse (m.data)
   const manage_method = {
      id: () => {
         phase = `connected`
         Object.assign (id, content)
         console.log (`id: ${ content.no }`)
         console.log (`name: ${ content.name }`)
      },
      list: () => {

         bg_col = `indigo`
         phase  = `connected`

         socket_list.innerText = ``

         content.forEach (({ id, ping, audio_enabled }) => {
            const row = document.createElement (`div`)
            row.style.width   = `100%`
            row.style.display = `block`
            row.style.left    = `0%`  

            const name_div = document.createElement (`div`)
            name_div.style.textAlign = `left`
            name_div.style.display   = `inline-block`
            name_div.style.width     = `33.3%`
            name_div.innerText       = id.name
            name_div.style.color = audio_enabled ? `white` : `grey`
            row.appendChild (name_div)

            const ping_div = document.createElement (`div`)
            ping_div.style.textAlign = `center` 
            ping_div.style.display   = `inline-block`
            ping_div.style.width     = `33.3%`
            ping_div.innerText       = Math.floor (ping.time)
            row.appendChild (ping_div)

            const server_div = document.createElement (`div`)
            server_div.style.textAlign = `right`
            server_div.style.display   = `inline-block`
            server_div.style.width     = `33%`
            server_div.innerText       = id.server.name
            row.appendChild (server_div)

            socket_list.appendChild (row)

         })
      },
      ping: () => {
         socket.send (JSON.stringify ({
            type    : `ctrl`,
            method  : `pong`,
            content : content,
         }))
      },
      busy: () => {
         phase = `busy`
         bg_col = `crimson`
               
         socket_list.innerText = ``
         const text_div = document.createElement (`div`)
         text_div.style.justifyContent = `center`
         text_div.style.alignItems     = `center`
         text_div.style.display        = `flex`
         text_div.style.width          = `100%`
         text_div.style.height         = `100%`
         text_div.style.touchAction    = `none`
         text_div.innerText = `${ content } is already connected 😠`
         socket_list.appendChild (text_div)

      },
      kick: () => {
         phase = `kicked`
         bg_col = `crimson`

         socket_list.innerText = ``

         const text_div = document.createElement (`div`)
         text_div.style.justifyContent = `center`
         text_div.style.alignItems     = `center`
         text_div.style.display        = `flex`
         text_div.style.width          = `100%`
         text_div.style.height         = `100%`
         text_div.style.touchAction    = `none`
         text_div.innerText = `${ content } took ctrl 😵`
         socket_list.appendChild (text_div)

         setTimeout (() => location.reload () , 3000)
      },
      greeting: () => console.log (content),

   }
   manage_method[method] ()
}

document.body.style.margin             = 0
document.body.style.overflow           = `hidden`
document.body.style.touchAction        = `none`
document.body.style.overscrollBehavior = `none`

const socket_list            = document.createElement (`div`)
socket_list.style.font       = `14 px`
socket_list.style.fontFamily = 'monospace'
socket_list.style.color      = `white`
socket_list.style.display    = `block`
socket_list.style.position   = `fixed`
socket_list.style.width      = `${ innerWidth }px`
socket_list.style.height     = `${ innerHeight }px`
socket_list.style.left       = 0
socket_list.style.top        = 0
document.body.appendChild (socket_list)

socket_list.innerText = ` ... connecting`

const cnv  = document.getElementById (`cnv`)
cnv.width  = innerWidth
cnv.height = innerHeight

const ctx = cnv.getContext (`2d`)

document.body.onpointerdown = () => {
   if (phase == `busy`) {
      override_hold = Date.now ()
   }
}

document.body.onpointerup = () => {
   if (phase == `busy`) {
      override_hold = false
   }
}

window.onresize = () => {
   cnv.width  = innerWidth
   cnv.height = innerHeight

   socket_list.style.width      = `${ innerWidth }px`
   socket_list.style.height     = `${ innerHeight }px`         
}

function background () {
   ctx.fillStyle = bg_col
   ctx.fillRect (0, 0, cnv.width, cnv.height)
}

function draw_frame () {
   background ()
   const frame_manager = {
      connecting : () => {},
      connected  : () => {},
      busy       : () => {
         if (!override_hold) return
         ctx.fillStyle = `deeppink`
         const p = (Date.now () - override_hold) / 3000
         if (p > 1) {
            override_hold = false
            bg_col = `deeppink`
            socket.send (JSON.stringify ({
               type    : `ctrl`,
               method  : `override`,
               content : id,

            }))
            return
         }
         const y = cnv.height * (1 - p)
         ctx.fillRect (0, y, cnv.width, cnv.height)
      },
      kicked     : () => {},
   }
   frame_manager[phase] ()
   requestAnimationFrame (draw_frame)
}

requestAnimationFrame (draw_frame)

