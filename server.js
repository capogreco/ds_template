import { serve } from "https://deno.land/std@0.185.0/http/server.ts"
import { serveDir } from "https://deno.land/std@0.185.0/http/file_server.ts"
import { generate_name } from "./modules/generate_name.js"
import { generate } from "https://deno.land/std@0.213.0/uuid/v1.ts";

const server_id = generate ()

// const kv = await Deno.openKv ()
const kv = await Deno.openKv (`/Users/capo_greco/Documents/kv/local`)

// const clear_kv = async () => {
//    const iter = await kv.list ()
//    for await (const { key } of iter) {
//       kv.delete (key)
//    }
// }

// clear_kv ()

const sockets = new Map ()

const update_ctrl = async () => {
   const iter = await kv.list ({ prefix : [ server_id, `ctrl` ] })
   const ctrl_array_db = []
   for await (const { value } of iter) {
      ctrl_array_db.push (value)
   }
   const ctrl_array_map = []
   for await (const e of ctrl_array_db) {
      const v = sockets.get (e.id.no) || false
      if (v) ctrl_array_map.push (v)
   }

   const msg = {
      method  : `list`,
      content : ctrl_array_db.map (e => e.id.name),
   }

   for await (const a of ctrl_array_map) {
      a.socket.send (JSON.stringify (msg))
   }
}

const check_map_sockets = async () => {
   const redundant = []
   for await (const a of sockets) {
      const v = a[1]
      if (v.socket.readyState > 1) redundant.push (v.id.no)
      else {
         const val = await kv.get ([ server_id, v.id.type, v.id.no  ]) || false
         if (!val) {
            kv.set ([ v.id.type, v.id.no, server_id ], v.id)
         }
      }
      redundant.forEach (e => sockets.delete (e))
   }
}

const check_db_sockets = async () => {
   check_map_sockets ()
   console.log (`checking db sockets`)
   const iter = await kv.list ({ prefix : [ server_id, `ctrl` ] })
   const socket_array = []
   for await (const { value } of iter) {
      socket_array.push (value)
   }
   const redundant = []
   socket_array.forEach (e => {
      console.log (e)
      const s = sockets.get (e.id.no) || false
      // console.log (sockets)
      console.log (s) 
      if (!s) {
         // console.dir (e)
         redundant.push (e)
         return
      }
      if (s.readyState > 1) redundant.push (e)
   })
   console.dir (redundant)
   redundant.forEach (async e => {
      // console.log ([ e.id.type, e.id.no, server_id ])
      const val = await kv.get ([ server_id, e.id.type, e.id.no ])
      // console.log (val)
      const res = await kv.delete ([ server_id, e.id.type, e.id.no ])
      // console.log (res)
   })
   update_ctrl ()
}

setInterval (check_db_sockets, 1000)

const manage_pong    = async (msg, socket) => {}
const manage_synth   = async (msg, socket) => {}
const manage_control = async (msg, socket) => {}

const req_handler = async incoming_req => {
   let req = incoming_req
   const path = new URL (req.url).pathname
   const upgrade = req.headers.get ("upgrade") || ""
   if (upgrade.toLowerCase () == "websocket") {
      const { socket, response } = Deno.upgradeWebSocket (req)
      const id = {
         no : req.headers.get (`sec-websocket-key`),
         name : generate_name (),
         type : path == `/ctrl` ? `ctrl` : `synth`,
         server : server_id,
      }
      // console.dir (id)
      sockets.set (id.no, { id, socket })
      socket.onopen = async () => {
         // if (id.type == `ctrl`) {
         //    const iter = await kv.list ({ prefix : [ `ctrl` ]})
         //    const ctrl_array = []
         //    for await (const { value } of iter) {
         //       ctrl_array.push (value)
         //    }
         //    check_map_sockets ()
         //    console.log (ctrl_array)
         //    if (ctrl_array.length > 0) {
         //       console.log (`there is already a controller connected`)
         //       return
         //    }
         // }
         const val = {
            id, ping : false,
            last_update : Date.now (),                  
         }
         kv.set ([ server_id, id.type, id.no ], val)

         socket.send (JSON.stringify ({
            method  : `id`,
            content : id,
         }))
      }
      socket.onmessage = async m => {
         const msg = JSON.parse (m.data)
         const manage_type = {
            synth   : (m, s) => manage_synth   (m, s),
            control : (m, s) => manage_control (m, s),
         }
         manage_type[msg.type] (msg, socket)
      }
      socket.onerror = e => console.log(`socket error: ${ e.message }`)
      socket.onclose = async () => {
         await kv.delete ([ id.type, id.no ])
      }

      return response
   }
   
   const options = {
      fsRoot : `public`,
      index  : `index.html`,
   }

   return serveDir (req, options)
}

serve (req_handler, { port: 80 })
