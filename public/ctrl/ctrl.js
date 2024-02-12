// const ws_address = `ws://localhost/ctrl`
const ws_address = `wss://cold-eagle-12.deno.dev/ctrl`

const socket = new WebSocket (ws_address)

socket.onmessage = m => {
   const { method, content } = JSON.parse (m.data)
   const manage_method = {
      id: () => {
         console.log (`id: ${ content.no }`)
         console.log (`name: ${ content.name }`)
      },
      list: () => {
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
background ()

window.onresize = () => {
   cnv.width  = innerWidth
   cnv.height = innerHeight
   background ()

   socket_list.style.width      = `${ innerWidth }px`
   socket_list.style.height     = `${ innerHeight }px`         
}

function background () {
   ctx.fillStyle = `indigo`
   ctx.fillRect (0, 0, cnv.width, cnv.height)
}
