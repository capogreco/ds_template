const ws_address = `ws://localhost/ctrl`

const socket = new WebSocket (ws_address)

socket.onmessage = m => {
   const { method, content } = JSON.parse (m.data)
   const manage_method = {
      id: () => {
         console.log (`id: ${ content.no }`)
         console.log (`name: ${ content.name }`)
      },
      list: () => {
         console.log (`list:`)
         console.dir (content)

         socket_list.innerText = ``
         content.forEach (({ id }) => {
            const div = document.createElement (`div`)
            div.innerText = id.name
            socket_list.appendChild (div)
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
